/**
 * BS Excel Upload Route
 * Uses direct cell address access (not array indexing) for reliability.
 *
 * Confirmed column layout (0-based from col A=0):
 *   B(1)=Region  C(2)=Branch  D(3)=StaffID  E(4)=BS Name
 *   G(6)=Role    H(7)=RM Name  I(8)=RM Title
 *   Q(16)=Jan-Disb-Actual  R(17)=Feb  S(18)=Mar  T(19)=Apr  U(20)=May  V(21)=Jun
 *   AT(45)=Jan-Colle-Actual  AU(46)=Feb  AV(47)=Mar  AW(48)=Apr  AX(49)=May  AY(50)=Jun
 */

const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, requireRole('SUPER_ADMIN'));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

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

function safeNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}
function safeStr(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' || s === '-' ? null : s;
}

// Read a cell value directly by 0-based row and col index
function cell(ws, r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cel = ws[addr];
  if (!cel) return null;
  return cel.v !== undefined ? cel.v : null;
}

const DISB_COLS = { Jan:16, Feb:17, Mar:18, Apr:19, May:20, Jun:21 };
const COLL_COLS = { Jan:45, Feb:46, Mar:47, Apr:48, May:49, Jun:50 };

function parseSheet(workbook) {
  // Accept any sheet name — pick the first one with "actual" or "performance", else first sheet
  const sheetName = workbook.SheetNames.find(n =>
    n.toLowerCase().includes('actual') || n.toLowerCase().includes('performance')
  ) || workbook.SheetNames[0];

  if (!sheetName) throw new Error('No sheet found in workbook.');
  const ws = workbook.Sheets[sheetName];
  if (!ws || !ws['!ref']) throw new Error('Sheet is empty.');

  const range = XLSX.utils.decode_range(ws['!ref']);
  const results = [];

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    // Must have a valid staff ID (numeric) and branch name
    const staffIdRaw = cell(ws, r, 3);    // Column D
    const branchRaw  = cell(ws, r, 2);    // Column C
    if (!staffIdRaw || !branchRaw) continue;

    const staffId = String(staffIdRaw).trim();
    if (!staffId || staffId === '-' || isNaN(parseInt(staffId))) continue;

    const branch = safeStr(branchRaw);
    if (!branch) continue;

    // Disbursement actuals
    const disbActual = {};
    for (const [month, colIdx] of Object.entries(DISB_COLS)) {
      const v = safeNum(cell(ws, r, colIdx));
      if (v !== null) disbActual[month] = v;
    }

    // Collection actuals
    const collActual = {};
    for (const [month, colIdx] of Object.entries(COLL_COLS)) {
      const v = safeNum(cell(ws, r, colIdx));
      if (v !== null) collActual[month] = v;
    }

    results.push({
      staffId,
      branch,
      region:   safeStr(cell(ws, r, 1))  || '',
      name:     safeStr(cell(ws, r, 4))  || '',
      role:     safeStr(cell(ws, r, 6))  || 'Branch Supervisor',
      rmName:   safeStr(cell(ws, r, 7)),
      rmTitle:  safeStr(cell(ws, r, 8)),
      disbActual,
      collActual,
      disbMonths: Object.keys(disbActual).length,
      collMonths:  Object.keys(collActual).length,
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

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false });
    const parsed   = parseSheet(workbook);

    if (!parsed.length) {
      return res.status(400).json({
        error: 'No valid staff rows found. Make sure the file has Staff ID in column D and Branch in column C.',
        sheetsFound: workbook.SheetNames,
      });
    }

    const summary = { matched: [], notFound: [], errors: [] };

    for (const row of parsed) {
      try {
        const cycles = await q(
          `SELECT id FROM "BSAppraisalCycle"
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
          if (row.rmName)  { sql += `,"rmName"=$${idx}`;  params.push(row.rmName);  idx++; }
          if (row.rmTitle) { sql += `,"rmTitle"=$${idx}`; params.push(row.rmTitle); idx++; }
          sql += `,"updatedAt"=NOW() WHERE "id"=$${idx}`;
          params.push(cycle.id);
          await q(sql, params);
        }

        // Upsert RM info lookup
        if (row.rmName || row.rmTitle) {
          await q(
            `INSERT INTO "BSRMInfo"("id","staffId","branch","rmName","rmTitle","updatedAt")
             VALUES(gen_random_uuid()::TEXT,$1,$2,$3,$4,NOW())
             ON CONFLICT("staffId") DO UPDATE SET "rmName"=$3,"rmTitle"=$4,"branch"=$2,"updatedAt"=NOW()`,
            [row.staffId, row.branch, row.rmName, row.rmTitle]
          );
        }

        summary.matched.push({
          staffId: row.staffId, branch: row.branch, name: row.name,
          rmName: row.rmName, cyclesUpdated: cycles.length,
          disbMonths: row.disbMonths, collMonths: row.collMonths,
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

// POST /api/bs-upload/preview
router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false });
    const parsed = parseSheet(workbook);
    res.json({ totalRows: parsed.length, sample: parsed.slice(0, 3), sheetNames: workbook.SheetNames });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
