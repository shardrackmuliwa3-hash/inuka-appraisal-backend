/**
 * BS Excel Upload Route
 * Reads BS_Performance_assessment.xlsx Sheet "Actual BS Perfromanc"
 *
 * Exact column layout (0-based index from col A=0):
 *   B(1)=Region, C(2)=Branch, D(3)=StaffID, E(4)=BS Name, F(5)=JoiningDate, G(6)=Role
 *   H(7)=RM Name, I(8)=RM Title
 *   Q(16)=Jan-Disb-Actual, R(17)=Feb, S(18)=Mar, T(19)=Apr, U(20)=May, V(21)=Jun
 *   AT(45)=Jan-Colle-Actual, AU(46)=Feb, AV(47)=Mar, AW(48)=Apr, AX(49)=May, AY(50)=Jun
 */

const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, requireRole('SUPER_ADMIN'));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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

// Exact column indices (0-based from col A)
const COLS = {
  region:    1,   // B
  branch:    2,   // C
  staffId:   3,   // D
  bsName:    4,   // E  "Branch Supervisor Name"
  role:      6,   // G
  rmName:    7,   // H  "RM Name"
  rmTitle:   8,   // I  "RM Title"
  // Disbursement actuals
  disbJan:  16,   // Q
  disbFeb:  17,   // R
  disbMar:  18,   // S
  disbApr:  19,   // T
  disbMay:  20,   // U
  disbJun:  21,   // V  (17.Jun)
  // Will auto-detect Jul-Dec if present further right
  // Collection actuals
  collJan:  45,   // AT
  collFeb:  46,   // AU
  collMar:  47,   // AV
  collApr:  48,   // AW
  collMay:  49,   // AX
  collJun:  50,   // AY
};

const DISB_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function safeNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}
function safeStr(v) {
  if (!v) return null;
  const s = String(v).trim();
  return s || null;
}

function parseSheet(workbook) {
  // Find the actuals sheet
  const sheetName = workbook.SheetNames.find(n =>
    n.toLowerCase().includes('actual') || n.toLowerCase().includes('performance')
  ) || workbook.SheetNames[2];
  if (!sheetName) throw new Error('Cannot find the Actual Performance sheet.');

  const ws = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  if (rows.length < 2) throw new Error('Sheet is empty.');

  // Detect Jul-Dec disbursement and collection columns from headers
  const headers = (rows[0] || []).map(h => h ? String(h).trim().toLowerCase() : '');
  const extraDisbCols = {}; // month -> col index for Jul-Dec
  const extraCollCols = {};

  headers.forEach((h, i) => {
    if (i <= 21) return; // skip already-known columns
    const isDisb = h.includes('disb') && h.includes('actual');
    const isColl = (h.includes('colle') || h.includes('collection')) && h.includes('actual') && !h.includes('rate') && !h.includes('%');
    const monthMatch = h.match(/jul|aug|sep|oct|nov|dec/);
    if (monthMatch) {
      const m = monthMatch[0].charAt(0).toUpperCase() + monthMatch[0].slice(1);
      if (isDisb) extraDisbCols[m] = i;
      if (isColl) extraCollCols[m] = i;
    }
  });

  const results = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const staffIdRaw = row[COLS.staffId];
    const branch = safeStr(row[COLS.branch]);
    if (!staffIdRaw || staffIdRaw === '-' || !branch) continue;
    const staffId = String(staffIdRaw).trim();
    if (!staffId || isNaN(parseInt(staffId))) continue;

    // Build disbursement actuals
    const disbActual = {};
    const baseDisb = [
      ['Jan', COLS.disbJan], ['Feb', COLS.disbFeb], ['Mar', COLS.disbMar],
      ['Apr', COLS.disbApr], ['May', COLS.disbMay], ['Jun', COLS.disbJun],
    ];
    for (const [m, idx] of baseDisb) {
      const v = safeNum(row[idx]);
      if (v !== null) disbActual[m] = v;
    }
    for (const [m, idx] of Object.entries(extraDisbCols)) {
      const v = safeNum(row[idx]);
      if (v !== null) disbActual[m] = v;
    }

    // Build collection actuals
    const collActual = {};
    const baseColl = [
      ['Jan', COLS.collJan], ['Feb', COLS.collFeb], ['Mar', COLS.collMar],
      ['Apr', COLS.collApr], ['May', COLS.collMay], ['Jun', COLS.collJun],
    ];
    for (const [m, idx] of baseColl) {
      const v = safeNum(row[idx]);
      if (v !== null) collActual[m] = v;
    }
    for (const [m, idx] of Object.entries(extraCollCols)) {
      const v = safeNum(row[idx]);
      if (v !== null) collActual[m] = v;
    }

    results.push({
      staffId,
      branch,
      region: safeStr(row[COLS.region]) || '',
      name: safeStr(row[COLS.bsName]) || '',
      role: safeStr(row[COLS.role]) || 'Branch Supervisor',
      rmName: safeStr(row[COLS.rmName]),
      rmTitle: safeStr(row[COLS.rmTitle]),
      disbActual,
      collActual,
      disbMonths: Object.keys(disbActual).length,
      collMonths: Object.keys(collActual).length,
    });
  }

  return results;
}

// POST /api/bs-upload/actuals
router.post('/actuals', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    if (!req.file.originalname.toLowerCase().match(/\.xlsx?$/)) {
      return res.status(400).json({ error: 'Please upload an Excel file (.xlsx or .xls).' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const parsed = parseSheet(workbook);
    if (!parsed.length) return res.status(400).json({ error: 'No valid staff rows found. Check the file format.' });

    const summary = { matched: [], notFound: [], errors: [] };

    for (const row of parsed) {
      try {
        // Match by staffId OR branch name
        const cycles = await q(
          `SELECT id,"staffName","branch","reviewPeriod","year","status"
           FROM "BSAppraisalCycle"
           WHERE ("staffId"=$1 OR "branch" ILIKE $2) AND "status" NOT IN ('CANCELLED')
           ORDER BY "createdAt" DESC LIMIT 10`,
          [row.staffId, row.branch]
        );

        if (!cycles.length) {
          summary.notFound.push({ staffId: row.staffId, branch: row.branch, name: row.name, rmName: row.rmName });
          continue;
        }

        for (const cycle of cycles) {
          const params = [JSON.stringify(row.disbActual), JSON.stringify(row.collActual)];
          let sql = `UPDATE "BSAppraisalCycle" SET "disbActual"=$1,"collActual"=$2`;
          let idx = 3;
          if (row.rmName) { sql += `,"rmName"=$${idx}`; params.push(row.rmName); idx++; }
          if (row.rmTitle) { sql += `,"rmTitle"=$${idx}`; params.push(row.rmTitle); idx++; }
          sql += `,"updatedAt"=NOW() WHERE "id"=$${idx}`;
          params.push(cycle.id);
          await q(sql, params);
        }

        // Upsert RM info
        if (row.rmName || row.rmTitle) {
          await q(
            `INSERT INTO "BSRMInfo"("id","staffId","branch","rmName","rmTitle","updatedAt")
             VALUES(gen_random_uuid()::TEXT,$1,$2,$3,$4,NOW())
             ON CONFLICT("staffId") DO UPDATE SET "rmName"=$3,"rmTitle"=$4,"branch"=$2,"updatedAt"=NOW()`,
            [row.staffId, row.branch, row.rmName, row.rmTitle]
          );
        }

        summary.matched.push({
          staffId: row.staffId,
          branch: row.branch,
          name: row.name,
          rmName: row.rmName,
          cyclesUpdated: cycles.length,
          disbMonths: row.disbMonths,
          collMonths: row.collMonths,
        });
      } catch (err) {
        summary.errors.push({ staffId: row.staffId, branch: row.branch, error: err.message });
      }
    }

    res.json({
      success: true,
      totalRows: parsed.length,
      matchedCount: summary.matched.length,
      notFoundCount: summary.notFound.length,
      errorCount: summary.errors.length,
      summary,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to process Excel file.' });
  }
});

// POST /api/bs-upload/preview — parse without saving
router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const parsed = parseSheet(workbook);
    res.json({ totalRows: parsed.length, sample: parsed.slice(0, 3), sheetNames: workbook.SheetNames });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
