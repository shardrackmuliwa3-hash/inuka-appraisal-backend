/**
 * BS Excel Upload Route
 * Accepts the BS_Performance_assessment.xlsx file,
 * reads Sheet 3 ("Actual BS Perfromanc"), extracts monthly actuals
 * for disbursement and collection per branch, and updates existing cycles.
 */

const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, requireRole('SUPER_ADMIN'));

// Store file in memory (no disk writes needed)
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

// Month abbreviation map — handles "17.Jun-Disb-Actual" style headers too
const MONTH_MAP = {
  'jan': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'apr': 'Apr',
  'may': 'May', 'jun': 'Jun', 'jul': 'Jul', 'aug': 'Aug',
  'sep': 'Sep', 'oct': 'Oct', 'nov': 'Nov', 'dec': 'Dec',
};

function extractMonth(header) {
  const lower = header.toLowerCase();
  for (const [key, val] of Object.entries(MONTH_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function parseActualsFromSheet(workbook) {
  // Find the actuals sheet (Sheet 3)
  const sheetName = workbook.SheetNames.find(n =>
    n.toLowerCase().includes('actual') || n.toLowerCase().includes('performance')
  ) || workbook.SheetNames[2];

  if (!sheetName) throw new Error('Could not find the Actual Performance sheet in this workbook.');

  const ws = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  if (rows.length < 2) throw new Error('Sheet appears to be empty.');

  // Row 0 = headers
  const headers = rows[0].map(h => h ? String(h).trim() : '');

  // Find column indices by header content
  const colMap = {};
  headers.forEach((h, i) => {
    const lower = h.toLowerCase();
    // Disbursement actuals
    if ((lower.includes('disb') || lower.includes('disbursement')) && lower.includes('actual')) {
      const month = extractMonth(h);
      if (month) colMap[`disb_${month}`] = i;
    }
    // Collection actuals
    if ((lower.includes('colle') || lower.includes('collection')) && lower.includes('actual') && !lower.includes('rate') && !lower.includes('%')) {
      const month = extractMonth(h);
      if (month) colMap[`coll_${month}`] = i;
    }
    // Identity columns
    if (lower === 'branch' || lower.includes('branch')) colMap['branch'] = i;
    if (lower === 'region' || lower.includes('region')) colMap['region'] = i;
    if (lower === 'staff id' || lower === 'staffid' || lower.includes('staff id')) colMap['staffId'] = i;
    if (lower.includes('actual name') || lower.includes('name')) colMap['name'] = i;
    if (lower === 'role') colMap['role'] = i;
  });

  // Fallback: use known column positions from the standard Inuka Excel format
  // B=region(1), C=branch(2), D=staffId(3), E=name(4), G=role(6)
  // O=Jan-Disb(14), P=Feb-Disb(15), Q=Mar-Disb(16), R=Apr-Disb(17), S=May-Disb(18), T=Jun-Disb(19)
  // AR=Jan-Coll(43), AS=Feb-Coll(44), AT=Mar-Coll(45), AU=Apr-Coll(46), AV=May-Coll(47), AW=Jun-Coll(48)
  // Also Jul-Dec: U=Jul-Disb, V=Aug... etc (need to check exact layout for full-year)

  if (!colMap['branch']) colMap['branch'] = 2;
  if (!colMap['region']) colMap['region'] = 1;
  if (!colMap['staffId']) colMap['staffId'] = 3;
  if (!colMap['name']) colMap['name'] = 4;

  // Standard Inuka actuals columns (H1 period = Jan–Jun)
  const STD_DISB = { Jan:14, Feb:15, Mar:16, Apr:17, May:18, Jun:19, Jul:20, Aug:21, Sep:22, Oct:23, Nov:24, Dec:25 };
  const STD_COLL = { Jan:43, Feb:44, Mar:45, Apr:46, May:47, Jun:48, Jul:49, Aug:50, Sep:51, Oct:52, Nov:53, Dec:54 };

  for (const [m, idx] of Object.entries(STD_DISB)) {
    if (!colMap[`disb_${m}`]) colMap[`disb_${m}`] = idx;
  }
  for (const [m, idx] of Object.entries(STD_COLL)) {
    if (!colMap[`coll_${m}`]) colMap[`coll_${m}`] = idx;
  }

  const results = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every(c => c === null || c === undefined || c === '')) continue;

    const staffId = row[colMap['staffId']];
    const branch = row[colMap['branch']];
    if (!staffId || staffId === '-' || !branch) continue;

    // Try to parse staffId as integer
    const staffIdStr = String(staffId).trim();
    if (!staffIdStr || isNaN(parseInt(staffIdStr))) continue;

    const disbActual = {};
    const collActual = {};

    for (const m of ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']) {
      const dIdx = colMap[`disb_${m}`];
      const cIdx = colMap[`coll_${m}`];
      if (dIdx !== undefined && row[dIdx] !== null && row[dIdx] !== undefined && row[dIdx] !== '') {
        const v = parseFloat(row[dIdx]);
        if (!isNaN(v)) disbActual[m] = Math.round(v * 100) / 100;
      }
      if (cIdx !== undefined && row[cIdx] !== null && row[cIdx] !== undefined && row[cIdx] !== '') {
        const v = parseFloat(row[cIdx]);
        if (!isNaN(v)) collActual[m] = Math.round(v * 100) / 100;
      }
    }

    results.push({
      staffId: staffIdStr,
      branch: String(branch).trim(),
      region: row[colMap['region']] ? String(row[colMap['region']]).trim() : '',
      name: row[colMap['name']] ? String(row[colMap['name']]).trim() : '',
      disbActual,
      collActual,
      monthsFound: Object.keys(disbActual),
    });
  }

  return results;
}

// POST /api/bs-upload/actuals — upload Excel, extract actuals, update cycles
router.post('/actuals', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded. Please attach the Excel file.' });

    const ext = req.file.originalname.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      return res.status(400).json({ error: 'Please upload an Excel file (.xlsx or .xls).' });
    }

    // Parse Excel from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const parsed = parseActualsFromSheet(workbook);

    if (!parsed.length) {
      return res.status(400).json({ error: 'No valid staff data found in the Excel file. Please check the format.' });
    }

    const summary = { matched: [], notFound: [], errors: [] };

    for (const row of parsed) {
      try {
        // Try to find an existing cycle for this branch/staffId
        const cycles = await q(
          `SELECT id, "staffName", "branch", "reviewPeriod", "year", "status" FROM "BSAppraisalCycle"
           WHERE ("staffId" = $1 OR "branch" ILIKE $2) AND "status" NOT IN ('CANCELLED')
           ORDER BY "createdAt" DESC LIMIT 5`,
          [row.staffId, row.branch]
        );

        if (!cycles.length) {
          summary.notFound.push({ staffId: row.staffId, branch: row.branch, name: row.name, reason: 'No active appraisal cycle found' });
          continue;
        }

        // Update each matched cycle
        for (const cycle of cycles) {
          await q(
            `UPDATE "BSAppraisalCycle" SET "disbActual"=$1, "collActual"=$2, "updatedAt"=NOW() WHERE "id"=$3`,
            [JSON.stringify(row.disbActual), JSON.stringify(row.collActual), cycle.id]
          );
        }

        summary.matched.push({
          staffId: row.staffId,
          branch: row.branch,
          name: row.name,
          cyclesUpdated: cycles.length,
          monthsLoaded: row.monthsFound,
          disbMonths: Object.keys(row.disbActual).length,
          collMonths: Object.keys(row.collActual).length,
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

// GET /api/bs-upload/preview — parse Excel and preview without saving
router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const parsed = parseActualsFromSheet(workbook);
    res.json({ totalRows: parsed.length, rows: parsed.slice(0, 5), sheetNames: workbook.SheetNames });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
