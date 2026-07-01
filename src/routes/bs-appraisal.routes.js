const express = require('express');
const { Pool } = require('pg');
const { authRequired, requireRole } = require('../middleware/auth');
const { computeBSCycleScore, PERIOD_MONTHS } = require('../utils/bs-scoring');
const { buildBSReportHtml } = require('../utils/bs-report-html');
const budgetData = require('../utils/bs-budget-data');

const router = express.Router();
router.use(authRequired);

// Use raw pg pool for BS tables (separate from Prisma)
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  }
  return pool;
}

async function query(sql, params) {
  const client = await getPool().connect();
  try {
    const res = await client.query(sql, params);
    return res;
  } finally {
    client.release();
  }
}

// Safely parse JSONB fields that may come back as strings or objects
function safeJson(val) {
  if (!val) return {};
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return {}; }
}

function normalizeCycle(cycle) {
  if (!cycle) return null;
  return {
    ...cycle,
    disbBudget: safeJson(cycle.disbBudget),
    disbActual: safeJson(cycle.disbActual),
    collBudget: safeJson(cycle.collBudget),
    collActual: safeJson(cycle.collActual),
  };
}

// ---- Budget data endpoint (used by frontend to pre-fill forms) ----
router.get('/budgets', (req, res) => {
  res.json({ branches: Object.keys(budgetData.disbursement), ...budgetData });
});

router.get('/budgets/:branch', (req, res) => {
  const branch = req.params.branch;
  const disb = budgetData.disbursement[branch] || {};
  const coll = budgetData.collection[branch] || {};
  if (!Object.keys(disb).length) return res.status(404).json({ error: 'Branch not found in budget data' });
  res.json({ branch, disbursement: disb, collection: coll });
});

// ---- Staff list from budget data + RM info from DB ----
router.get('/staff', async (req, res) => {
  try {
    // Load RM info from database
    const rmRows = await query('SELECT "staffId","rmName","rmTitle" FROM "BSRMInfo"');
    const rmMap = {};
    for (const r of rmRows.rows) rmMap[r.staffId] = { rmName: r.rmName, rmTitle: r.rmTitle };

    // Merge with static budget staff data
    const staff = budgetData.staff.map(s => ({
      ...s,
      rmName: (rmMap[s.staffId] && rmMap[s.staffId].rmName) || null,
      rmTitle: (rmMap[s.staffId] && rmMap[s.staffId].rmTitle) || null,
    }));
    res.json(staff);
  } catch (err) {
    // Fallback if BSRMInfo table doesn't exist yet
    res.json(budgetData.staff);
  }
});

// ---- CRUD for BS Appraisal Cycles ----

// Create a new BS appraisal cycle (Super Admin or RM-role)
router.post('/', requireRole('SUPER_ADMIN', 'APPRAISER'), async (req, res) => {
  try {
    const {
      staffId, staffName, designation, branch, region,
      reviewPeriod, year, periodLabel, periodStart, periodEnd,
      disbBudget, disbActual, collBudget, collActual,
      rmName, rmTitle, immediateActions,
    } = req.body;

    // Auto-load budget from Excel data if not provided
    const autoDisbBudget = disbBudget || budgetData.disbursement[branch] || {};
    const autoCollBudget = collBudget || budgetData.collection[branch] || {};

    const result = await query(
      `INSERT INTO "BSAppraisalCycle"
        ("id","staffId","staffName","designation","branch","region","reviewPeriod","year",
         "periodLabel","periodStart","periodEnd","disbBudget","disbActual","collBudget","collActual",
         "rmName","rmTitle","immediateActions","createdByUserId","updatedAt")
       VALUES (gen_random_uuid()::TEXT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())
       RETURNING *`,
      [staffId, staffName, designation || 'Branch Supervisor', branch, region,
       reviewPeriod, year || 2026, periodLabel, periodStart, periodEnd,
       JSON.stringify(autoDisbBudget), JSON.stringify(disbActual || {}),
       JSON.stringify(autoCollBudget), JSON.stringify(collActual || {}),
       rmName, rmTitle, immediateActions, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create BS appraisal cycle' });
  }
});

// List all BS cycles (scoped by role)
router.get('/', async (req, res) => {
  try {
    let sql = 'SELECT * FROM "BSAppraisalCycle"';
    const params = [];
    // All roles can see; filter if needed
    if (req.query.region) { sql += ' WHERE "region" = $1'; params.push(req.query.region); }
    sql += ' ORDER BY "createdAt" DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch BS cycles' });
  }
});

// Get one cycle with computed scores
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM "BSAppraisalCycle" WHERE "id" = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Cycle not found' });
    const cycle = normalizeCycle(result.rows[0]);
    const computedScore = computeBSCycleScore(cycle);
    res.json({ ...cycle, computedScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cycle' });
  }
});

// Update cycle (actuals entry, comments, signoffs)
router.patch('/:id', async (req, res) => {
  try {
    const allowed = [
      'disbActual','collActual','status','rmName','rmTitle','rmComments',
      'cooComments','hrmComments','immediateActions','bsAcknowledged','rmSignedAt','cooSignedAt','hrmSignedAt','bsAcknowledgedAt',
    ];
    const updates = [];
    const params = [];
    let i = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        const val = (key === 'disbActual' || key === 'collActual')
          ? JSON.stringify(req.body[key]) : req.body[key];
        updates.push(`"${key}" = $${i}`);
        params.push(val);
        i++;
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
    updates.push(`"updatedAt" = NOW()`);
    params.push(req.params.id);
    const result = await query(
      `UPDATE "BSAppraisalCycle" SET ${updates.join(', ')} WHERE "id" = $${i} RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Cycle not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update cycle' });
  }
});

// RM submit
router.post('/:id/rm-submit', requireRole('APPRAISER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { rmName, rmTitle, rmComments, disbActual, collActual } = req.body;
    const result = await query(
      `UPDATE "BSAppraisalCycle" SET
        "status"='RM_SUBMITTED', "rmName"=$1, "rmTitle"=$2, "rmComments"=$3,
        "disbActual"=$4, "collActual"=$5, "rmSignedAt"=NOW(), "updatedAt"=NOW()
       WHERE "id"=$6 RETURNING *`,
      [rmName, rmTitle, rmComments,
       JSON.stringify(disbActual || {}), JSON.stringify(collActual || {}),
       req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit' });
  }
});

// COO review
router.post('/:id/coo-review', requireRole('APPRAISER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { cooComments } = req.body;
    const result = await query(
      `UPDATE "BSAppraisalCycle" SET "status"='COO_REVIEWED',"cooComments"=$1,"cooSignedAt"=NOW(),"updatedAt"=NOW() WHERE "id"=$2 RETURNING *`,
      [cooComments, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to update' }); }
});

// HRM approve
router.post('/:id/hrm-approve', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { hrmComments } = req.body;
    const result = await query(
      `UPDATE "BSAppraisalCycle" SET "status"='HRM_APPROVED',"hrmComments"=$1,"hrmSignedAt"=NOW(),"updatedAt"=NOW() WHERE "id"=$2 RETURNING *`,
      [hrmComments, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to update' }); }
});

// BS acknowledge
router.post('/:id/acknowledge', requireRole('APPRAISEE', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const result = await query(
      `UPDATE "BSAppraisalCycle" SET "status"='COMPLETED',"bsAcknowledged"=TRUE,"bsAcknowledgedAt"=NOW(),"updatedAt"=NOW() WHERE "id"=$1 RETURNING *`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to acknowledge' }); }
});

// Generate formal letter HTML
router.get('/:id/letter', async (req, res) => {
  try {
    const result = await query('SELECT * FROM "BSAppraisalCycle" WHERE "id" = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Cycle not found' });
    const cycle = result.rows[0];
    const html = buildBSReportHtml(cycle, req.query.ref);
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate letter' });
  }
});

// Aggregate report — all branches sorted by disbursement %
router.get('/aggregate/summary', requireRole('SUPER_ADMIN', 'APPRAISER'), async (req, res) => {
  try {
    let sql = 'SELECT * FROM "BSAppraisalCycle"';
    const params = [];
    if (req.query.year) { sql += ' WHERE "year" = $1'; params.push(parseInt(req.query.year)); }
    sql += ' ORDER BY "region", "branch"';
    const result = await query(sql, params);
    const rows = result.rows.map(cycle => {
      const score = computeBSCycleScore(cycle);
      return {
        id: cycle.id, staffId: cycle.staffId, staffName: cycle.staffName,
        branch: cycle.branch, region: cycle.region, reviewPeriod: cycle.reviewPeriod,
        periodLabel: cycle.periodLabel, status: cycle.status,
        disbPct: score.disbursement.cumulativePct,
        collPct: score.collection.cumulativePct,
        disbVariance: score.disbursement.totalVariance,
        collVariance: score.collection.totalVariance,
        verdict: score.verdictCode,
        verdictLabel: score.verdictLabel,
      };
    });
    res.json({ count: rows.length, results: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to build aggregate' });
  }
});

module.exports = router;
