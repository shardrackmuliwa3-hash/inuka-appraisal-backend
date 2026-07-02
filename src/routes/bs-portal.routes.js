/**
 * BS/RM Portal Routes + Bulk Account Creation
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { authRequired, requireRole } = require('../middleware/auth');
const budgetData = require('../utils/bs-budget-data');

const router = express.Router();

let pool;
function getPool() {
  if (!pool) {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  }
  return pool;
}
async function q(sql, params = []) {
  const client = await getPool().connect();
  try { return (await client.query(sql, params)).rows; }
  finally { client.release(); }
}
async function q1(sql, params = []) { const rows = await q(sql, params); return rows[0] || null; }

function safeJson(v) { if (!v) return {}; if (typeof v === 'object') return v; try { return JSON.parse(v); } catch { return {}; } }
function normalizeCycle(c) { if (!c) return null; return { ...c, disbBudget: safeJson(c.disbBudget), disbActual: safeJson(c.disbActual), collBudget: safeJson(c.collBudget), collActual: safeJson(c.collActual) }; }

function rmNameToEmail(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${first}.${last}@inukaafrica.com`;
}

// ============================================================
// BULK ACCOUNT CREATION
// ============================================================

router.post('/admin/bulk-create', authRequired, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const defaultPassword = await bcrypt.hash('Inuka@2026', 10);
    const results = { bs: { created: 0, skipped: 0, list: [] }, rm: { created: 0, skipped: 0, list: [] } };

    for (const staff of budgetData.staff) {
      const email = `ia.${staff.staffId}@inukaafrica.com`;
      const existing = await q1(`SELECT id FROM "User" WHERE email=$1`, [email]);
      if (existing) {
        await q(`INSERT INTO "BSUserLink"("userId","staffId") VALUES($1,$2) ON CONFLICT DO NOTHING`, [existing.id, staff.staffId]);
        results.bs.skipped++;
        continue;
      }
      const user = await q1(
        `INSERT INTO "User"("id","email","password","fullName","role","createdAt","updatedAt")
         VALUES(gen_random_uuid()::TEXT,$1,$2,$3,'BRANCH_SUPERVISOR',NOW(),NOW()) RETURNING id`,
        [email, defaultPassword, staff.name]
      );
      await q(`INSERT INTO "BSUserLink"("userId","staffId") VALUES($1,$2) ON CONFLICT DO NOTHING`, [user.id, staff.staffId]);
      results.bs.created++;
      results.bs.list.push({ name: staff.name, email, branch: staff.branch, staffId: staff.staffId });
    }

    const rms = await q(`SELECT DISTINCT "rmName","region" FROM "BSRMInfo" WHERE "rmName" IS NOT NULL`);
    const seenRMs = new Set();
    for (const rm of rms) {
      if (!rm.rmName || seenRMs.has(rm.rmName)) continue;
      seenRMs.add(rm.rmName);
      const email = rmNameToEmail(rm.rmName);
      const existing = await q1(`SELECT id FROM "User" WHERE email=$1`, [email]);
      if (existing) {
        await q(`INSERT INTO "RMUserLink"("userId","rmName","region") VALUES($1,$2,$3) ON CONFLICT("userId") DO UPDATE SET "rmName"=$2,"region"=$3`, [existing.id, rm.rmName, rm.region]);
        results.rm.skipped++;
        continue;
      }
      const user = await q1(
        `INSERT INTO "User"("id","email","password","fullName","role","createdAt","updatedAt")
         VALUES(gen_random_uuid()::TEXT,$1,$2,$3,'REGIONAL_MANAGER',NOW(),NOW()) RETURNING id`,
        [email, defaultPassword, rm.rmName]
      );
      await q(`INSERT INTO "RMUserLink"("userId","rmName","region") VALUES($1,$2,$3) ON CONFLICT DO NOTHING`, [user.id, rm.rmName, rm.region]);
      results.rm.created++;
      results.rm.list.push({ name: rm.rmName, email, region: rm.region });
    }

    res.json({ success: true, defaultPassword: 'Inuka@2026', ...results, totalCreated: results.bs.created + results.rm.created });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/admin/staff-accounts', authRequired, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const bs = await q(`SELECT u.id,u.email,u."fullName",u.role,l."staffId" FROM "User" u LEFT JOIN "BSUserLink" l ON l."userId"=u.id WHERE u.role='BRANCH_SUPERVISOR' ORDER BY u."fullName"`);
    const rm = await q(`SELECT u.id,u.email,u."fullName",u.role,l."rmName",l.region FROM "User" u LEFT JOIN "RMUserLink" l ON l."userId"=u.id WHERE u.role='REGIONAL_MANAGER' ORDER BY u."fullName"`);
    res.json({ bs, rm });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// BS PORTAL
// ============================================================

router.get('/bs/my-letters', authRequired, requireRole('BRANCH_SUPERVISOR', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const link = await q1(`SELECT "staffId" FROM "BSUserLink" WHERE "userId"=$1`, [req.user.id]);
    if (!link) return res.status(403).json({ error: 'No staff profile linked. Contact HR.' });
    const cycles = await q(`SELECT * FROM "BSAppraisalCycle" WHERE "staffId"=$1 ORDER BY "createdAt" DESC`, [link.staffId]);
    const cycleIds = cycles.map(c => c.id);
    let letters = [];
    if (cycleIds.length) {
      letters = await q(
        `SELECT l.*,c."staffName",c."branch",c."region",c."reviewPeriod",c."year",c."periodLabel"
         FROM "BSIssuedLetter" l JOIN "BSAppraisalCycle" c ON c.id=l."cycleId"
         WHERE l."cycleId"=ANY($1::text[]) ORDER BY l."createdAt" DESC`,
        [cycleIds]
      );
    }
    res.json({ staffId: link.staffId, cycles: cycles.map(normalizeCycle), letters });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ============================================================
// RM PORTAL
// ============================================================

router.get('/rm/my-region', authRequired, requireRole('REGIONAL_MANAGER', 'SUPER_ADMIN', 'APPRAISER'), async (req, res) => {
  try {
    const link = await q1(`SELECT "rmName","region" FROM "RMUserLink" WHERE "userId"=$1`, [req.user.id]);
    if (!link && req.user.role === 'REGIONAL_MANAGER') return res.status(403).json({ error: 'No RM profile linked. Contact HR.' });

    const rmName = link?.rmName || req.query.rmName;
    const region = link?.region || req.query.region;

    const cycles = await q(
      `SELECT * FROM "BSAppraisalCycle" WHERE "rmName" ILIKE $1 OR "region" ILIKE $2 ORDER BY "branch"`,
      [rmName ? `%${rmName}%` : '%none%', region ? `%${region}%` : '%none%']
    );
    const cycleIds = cycles.map(c => c.id);
    let pendingLetters = [];
    if (cycleIds.length) {
      pendingLetters = await q(
        `SELECT l.*,c."staffName",c."branch",c."reviewPeriod",c."year",c."periodLabel"
         FROM "BSIssuedLetter" l JOIN "BSAppraisalCycle" c ON c.id=l."cycleId"
         WHERE l."cycleId"=ANY($1::text[]) AND l."rmSignedAt" IS NULL AND l.status!='SEALED'
         ORDER BY l."createdAt" DESC`,
        [cycleIds]
      );
    }
    res.json({ rmName, region, cycles: cycles.map(normalizeCycle), pendingLetters, totalCycles: cycles.length });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

module.exports = router;
