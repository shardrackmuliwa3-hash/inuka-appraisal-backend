const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const { computeBSCycleScore } = require('../utils/bs-scoring');
const TEMPLATES_SEED = require('../utils/bs-letter-templates');

const router = express.Router();
router.use(authRequired);

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

// Log every significant action
async function auditLog(issuedLetterId, cycleId, user, action, details) {
  try {
    await q(
      `INSERT INTO "BSLetterAuditLog"("id","issuedLetterId","cycleId","userId","userEmail","userName","userRole","action","details")
       VALUES(gen_random_uuid()::TEXT,$1,$2,$3,$4,$5,$6,$7,$8)`,
      [issuedLetterId, cycleId, user.id, user.email, user.fullName || user.email, user.role, action, details ? JSON.stringify(details) : null]
    );
  } catch (e) { console.error('Audit log error:', e.message); }
}

// Variable substitution for templates
function merge(template, cycle, score) {
  const disp = (n) => n !== null && n !== undefined ? Math.abs(n).toLocaleString('en-KE', { minimumFractionDigits: 2 }) : '—';
  const pct = (p) => p !== null && p !== undefined ? (p * 100).toFixed(2) + '%' : '—';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const vars = {
    '{{staffName}}': cycle.staffName || '',
    '{{firstName}}': (cycle.staffName || '').split(' ')[0] || '',
    '{{staffId}}': cycle.staffId || '',
    '{{branch}}': cycle.branch || '',
    '{{region}}': cycle.region || '',
    '{{designation}}': cycle.designation || 'Branch Supervisor',
    '{{reviewPeriod}}': cycle.reviewPeriod || '',
    '{{year}}': String(cycle.year || 2026),
    '{{periodLabel}}': cycle.periodLabel || '',
    '{{periodEnd}}': cycle.periodEnd || '',
    '{{disbPct}}': pct(score?.disbursement?.cumulativePct),
    '{{collPct}}': pct(score?.collection?.cumulativePct),
    '{{disbVariance}}': `Kshs. ${disp(score?.disbursement?.totalVariance)}`,
    '{{collVariance}}': `Kshs. ${disp(score?.collection?.totalVariance)}`,
    '{{verdictCode}}': score?.verdictCode || '',
    '{{verdictLabel}}': score?.verdictLabel || '',
    '{{rmName}}': cycle.rmName || '[Regional Manager]',
    '{{rmTitle}}': cycle.rmTitle || '[Title]',
    '{{today}}': today,
  };

  function sub(text) {
    if (!text) return '';
    return Object.entries(vars).reduce((t, [k, v]) => t.split(k).join(v), text);
  }
  return sub;
}

// ============================================================
// TEMPLATE MANAGEMENT
// ============================================================

// Seed templates (run once — idempotent)
router.post('/templates/seed', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    let created = 0;
    for (const t of TEMPLATES_SEED) {
      const existing = await q1(`SELECT id FROM "BSLetterTemplate" WHERE band=$1 AND "letterType"=$2`, [t.band, t.letterType]);
      if (!existing) {
        await q(
          `INSERT INTO "BSLetterTemplate"("id","band","letterType","title","subject","openingParagraph","performanceInsights","mainBody","immediateActions","closingParagraph","sortOrder")
           VALUES(gen_random_uuid()::TEXT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [t.band, t.letterType, t.title, t.subject, t.openingParagraph, t.performanceInsights, t.mainBody, t.immediateActions, t.closingParagraph, t.sortOrder || 0]
        );
        created++;
      }
    }
    await auditLog(null, null, req.user, 'TEMPLATES_SEEDED', { created });
    res.json({ message: `${created} templates seeded.` });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// List all templates (optionally filter by band)
router.get('/templates', async (req, res) => {
  try {
    const { band } = req.query;
    const rows = band
      ? await q(`SELECT * FROM "BSLetterTemplate" WHERE band=$1 AND "isActive"=TRUE ORDER BY "sortOrder"`, [band])
      : await q(`SELECT * FROM "BSLetterTemplate" WHERE "isActive"=TRUE ORDER BY band, "sortOrder"`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/templates/:id', async (req, res) => {
  const t = await q1(`SELECT * FROM "BSLetterTemplate" WHERE id=$1`, [req.params.id]);
  if (!t) return res.status(404).json({ error: 'Template not found' });
  res.json(t);
});

// Edit a template (HR only)
router.patch('/templates/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const fields = ['title','subject','openingParagraph','performanceInsights','mainBody','immediateActions','closingParagraph','isActive','sortOrder'];
    const updates = []; const params = [];
    let i = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`"${f}"=$${i}`);
        params.push(req.body[f]);
        i++;
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    updates.push(`"updatedAt"=NOW()`);
    params.push(req.params.id);
    const t = await q1(`UPDATE "BSLetterTemplate" SET ${updates.join(',')} WHERE id=$${i} RETURNING *`, params);
    await auditLog(null, null, req.user, 'TEMPLATE_EDITED', { templateId: req.params.id });
    res.json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create custom template
router.post('/templates', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { band, letterType, title, subject, openingParagraph, performanceInsights, mainBody, immediateActions, closingParagraph, sortOrder } = req.body;
    const t = await q1(
      `INSERT INTO "BSLetterTemplate"("id","band","letterType","title","subject","openingParagraph","performanceInsights","mainBody","immediateActions","closingParagraph","sortOrder")
       VALUES(gen_random_uuid()::TEXT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [band, letterType, title, subject, openingParagraph, performanceInsights, mainBody, JSON.stringify(immediateActions), closingParagraph, sortOrder || 0]
    );
    await auditLog(null, null, req.user, 'TEMPLATE_CREATED', { templateId: t.id, band, letterType });
    res.status(201).json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// LETTER ISSUANCE
// ============================================================

// Issue a letter for a BS cycle (selects template, merges variables, creates IssuedLetter)
router.post('/cycles/:cycleId/issue', requireRole('SUPER_ADMIN', 'APPRAISER'), async (req, res) => {
  try {
    const { templateId, refNumber } = req.body;

    const cycle = await q1(`SELECT * FROM "BSAppraisalCycle" WHERE id=$1`, [req.params.cycleId]);
    if (!cycle) return res.status(404).json({ error: 'Cycle not found' });

    const tmpl = await q1(`SELECT * FROM "BSLetterTemplate" WHERE id=$1`, [templateId]);
    if (!tmpl) return res.status(404).json({ error: 'Template not found' });

    const score = computeBSCycleScore(cycle);
    const sub = merge(tmpl, cycle, score);
    const ref = refNumber || `HR/E-017/${cycle.branch.replace(/ /g, '')}-${cycle.reviewPeriod}/${cycle.year}`;

    const letter = await q1(
      `INSERT INTO "BSIssuedLetter"(
        "id","cycleId","templateId","templateTitle","band","letterType","refNumber","subject",
        "mergedOpeningParagraph","mergedPerformanceInsights","mergedMainBody","mergedImmediateActions","mergedClosingParagraph",
        "copyTo","status","issuedAt","issuedByUserId","issuedByName","updatedAt")
       VALUES(gen_random_uuid()::TEXT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'ISSUED',NOW(),$14,$15,NOW()) RETURNING *`,
      [cycle.id, tmpl.id, tmpl.title, tmpl.band, tmpl.letterType, ref, sub(tmpl.subject),
       sub(tmpl.openingParagraph), sub(tmpl.performanceInsights), sub(tmpl.mainBody),
       JSON.stringify(JSON.parse(tmpl.immediateActions).map(sub)),
       sub(tmpl.closingParagraph), tmpl.copyTo,
       req.user.id, req.user.fullName || req.user.email]
    );

    await auditLog(letter.id, cycle.id, req.user, 'LETTER_ISSUED', { templateId, templateTitle: tmpl.title, band: tmpl.band });
    res.status(201).json({ ...letter, computedScore: score });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// Get all issued letters for a cycle
router.get('/cycles/:cycleId/letters', async (req, res) => {
  const letters = await q(`SELECT * FROM "BSIssuedLetter" WHERE "cycleId"=$1 ORDER BY "createdAt" DESC`, [req.params.cycleId]);
  res.json(letters);
});

// Get one issued letter
router.get('/letters/:id', async (req, res) => {
  const letter = await q1(`SELECT * FROM "BSIssuedLetter" WHERE id=$1`, [req.params.id]);
  if (!letter) return res.status(404).json({ error: 'Letter not found' });
  const cycle = await q1(`SELECT * FROM "BSAppraisalCycle" WHERE id=$1`, [letter.cycleId]);
  await auditLog(letter.id, letter.cycleId, req.user, 'LETTER_VIEWED', null);
  res.json({ ...letter, cycle });
});

// ============================================================
// DIGITAL SIGNATURES
// ============================================================

router.post('/letters/:id/sign', async (req, res) => {
  try {
    const { party, signature, signerName, signerTitle } = req.body;
    // party: RM | COO | HRM | BS
    const letter = await q1(`SELECT * FROM "BSIssuedLetter" WHERE id=$1`, [req.params.id]);
    if (!letter) return res.status(404).json({ error: 'Letter not found' });
    if (letter.sealedAt) return res.status(409).json({ error: 'Letter is sealed and cannot be modified' });
    if (!signature || signature.length < 100) return res.status(400).json({ error: 'Invalid signature data' });

    const PARTY_MAP = {
      RM:  { sig: 'rmSignature', at: 'rmSignedAt', name: 'rmSignerName', title: 'rmSignerTitle', nextStatus: 'RM_SIGNED' },
      COO: { sig: 'cooSignature', at: 'cooSignedAt', name: 'cooSignerName', title: null,           nextStatus: 'COO_SIGNED' },
      HRM: { sig: 'hrmSignature', at: 'hrmSignedAt', name: 'hrmSignerName', title: null,           nextStatus: 'HRM_SIGNED' },
      BS:  { sig: 'bsSignature',  at: 'bsSignedAt',  name: 'bsSignerName',  title: null,           nextStatus: 'BS_ACKNOWLEDGED' },
    };
    const p = PARTY_MAP[party];
    if (!p) return res.status(400).json({ error: 'Invalid party. Must be RM, COO, HRM, or BS.' });

    const updates = [`"${p.sig}"=$1,"${p.at}"=NOW(),"${p.name}"=$2,"status"=$3,"updatedAt"=NOW()`];
    const params = [signature, signerName, p.nextStatus, req.params.id];
    if (p.title && signerTitle) { updates[0] += `,"${p.title}"=$5`; params.splice(3, 0, signerTitle); params[params.length-1] = req.params.id; }

    // If BS acknowledges, seal the letter
    let sealClause = '';
    if (party === 'BS') sealClause = ',"sealedAt"=NOW()';

    const updated = await q1(
      `UPDATE "BSIssuedLetter" SET "${p.sig}"=$1,"${p.at}"=NOW(),"${p.name}"=$2,"status"=$3${sealClause},"updatedAt"=NOW() WHERE id=$4 RETURNING *`,
      [signature, signerName, party === 'BS' ? 'SEALED' : p.nextStatus, req.params.id]
    );

    await auditLog(letter.id, letter.cycleId, req.user, `${party}_SIGNED`, { signerName, party });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ============================================================
// RENDERED LETTER HTML (for viewing / printing)
// ============================================================

router.get('/letters/:id/html', async (req, res) => {
  try {
    const letter = await q1(`SELECT * FROM "BSIssuedLetter" WHERE id=$1`, [req.params.id]);
    if (!letter) return res.status(404).json({ error: 'Letter not found' });
    const cycle = await q1(`SELECT * FROM "BSAppraisalCycle" WHERE id=$1`, [letter.cycleId]);
    const score = computeBSCycleScore(cycle);

    // Build the rendered letter HTML
    const { buildBSIssuedLetterHtml } = require('../utils/bs-issued-letter-html');
    const html = buildBSIssuedLetterHtml(letter, cycle, score);
    await auditLog(letter.id, letter.cycleId, req.user, 'LETTER_VIEWED', null);
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ============================================================
// AUDIT LOG
// ============================================================

router.get('/letters/:id/audit', requireRole('SUPER_ADMIN'), async (req, res) => {
  const logs = await q(`SELECT * FROM "BSLetterAuditLog" WHERE "issuedLetterId"=$1 ORDER BY "createdAt" ASC`, [req.params.id]);
  res.json(logs);
});

router.get('/cycles/:cycleId/audit', requireRole('SUPER_ADMIN', 'APPRAISER'), async (req, res) => {
  const logs = await q(`SELECT * FROM "BSLetterAuditLog" WHERE "cycleId"=$1 ORDER BY "createdAt" ASC`, [req.params.cycleId]);
  res.json(logs);
});

module.exports = router;
