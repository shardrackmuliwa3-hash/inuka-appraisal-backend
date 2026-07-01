const { computeBSCycleScore } = require('./bs-scoring');

const BRAND_GREEN = '#0D3B2E';
const BAND_COLORS = { 'E.P': '#006400', 'G.P': '#2d8a2d', 'A.P': '#b8860b', 'W.P': '#cc6600', 'U.P': '#b00020' };

function fmt(n) { if (n === null || n === undefined) return '—'; return n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function pct(p) { if (p === null || p === undefined) return '—'; return (p * 100).toFixed(2) + '%'; }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }); }

const MONTH_LABELS = {
  Jan:'January', Feb:'February', Mar:'March', Apr:'April', May:'May', Jun:'June',
  Jul:'July', Aug:'August', Sep:'September', Oct:'October', Nov:'November', Dec:'December',
};

function monthLabel(m, year) { return `${MONTH_LABELS[m] || m} ${year}`; }

function disbTable(disbScore, year, periodEnd) {
  const rows = disbScore.rows.map(r => `
    <tr>
      <td>${monthLabel(r.month, year)}${r === disbScore.rows[disbScore.rows.length - 1] ? ` (as at ${periodEnd})` : ''}</td>
      <td class="num">Kshs. ${fmt(r.budget)}</td>
      <td class="num">Kshs. ${fmt(r.actual)}</td>
      <td class="num">${pct(r.pctAchiv)}</td>
      <td class="num">Kshs. ${fmt(r.variance)}</td>
    </tr>`).join('');
  return `
    <table>
      <thead><tr><th>Month</th><th>Budgeted Disbursement</th><th>Actual Disbursement</th><th>% Achievement on Disbursement</th><th>Variance on Disbursement</th></tr></thead>
      <tbody>${rows}
        <tr class="total-row">
          <td><strong>TOTAL</strong></td>
          <td class="num"><strong>Kshs. ${fmt(disbScore.totalBudget)}</strong></td>
          <td class="num"><strong>Kshs. ${fmt(disbScore.totalActual)}</strong></td>
          <td class="num"><strong>${pct(disbScore.cumulativePct)}</strong></td>
          <td class="num"><strong>Kshs. ${fmt(disbScore.totalVariance)}</strong></td>
        </tr>
      </tbody>
    </table>`;
}

function collTable(collScore, year, periodEnd) {
  const rows = collScore.rows.map(r => `
    <tr>
      <td>${monthLabel(r.month, year)}${r === collScore.rows[collScore.rows.length - 1] ? ` (as at ${periodEnd})` : ''}</td>
      <td class="num">Kshs. ${fmt(r.budget)}</td>
      <td class="num">Kshs. ${fmt(r.actual)}</td>
      <td class="num">${pct(r.pctAchiv)}</td>
      <td class="num">Kshs. ${fmt(r.variance)}</td>
    </tr>`).join('');
  return `
    <table>
      <thead><tr><th>Month</th><th>Budgeted Collection</th><th>Actual Collection against Budget</th><th>% Achievement on Collection</th><th>Variance on Collection</th></tr></thead>
      <tbody>${rows}
        <tr class="total-row">
          <td><strong>TOTAL</strong></td>
          <td class="num"><strong>Kshs. ${fmt(collScore.totalBudget)}</strong></td>
          <td class="num"><strong>Kshs. ${fmt(collScore.totalActual)}</strong></td>
          <td class="num"><strong>${pct(collScore.cumulativePct)}</strong></td>
          <td class="num"><strong>Kshs. ${fmt(collScore.totalVariance)}</strong></td>
        </tr>
      </tbody>
    </table>`;
}

function buildBSReportHtml(cycle, refNumber) {
  const score = computeBSCycleScore(cycle);
  const bandColor = BAND_COLORS[score.verdictCode] || BAND_COLORS['U.P'];
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  @page { margin: 20mm 18mm; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #1a1a1a; line-height: 1.5; }
  .letterhead { text-align: center; border-bottom: 3px double ${BRAND_GREEN}; padding-bottom: 10px; margin-bottom: 16px; }
  .letterhead h1 { color: ${BRAND_GREEN}; font-size: 18px; margin: 0 0 2px; font-style: italic; }
  .letterhead .tagline { font-size: 10px; color: #666; }
  .band-legend { background: #f8f8f8; border: 1px solid #ddd; padding: 8px 12px; margin-bottom: 14px; font-size: 10px; }
  .band-legend table { width: 100%; border: none; }
  .band-legend td { border: none; padding: 1px 8px; }
  .ref-date { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 10.5px; }
  .addressee { margin-bottom: 10px; }
  .addressee strong { font-size: 12px; }
  .subject { font-weight: bold; text-decoration: underline; margin: 12px 0 10px; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
  th { background: ${BRAND_GREEN}; color: white; padding: 5px 6px; text-align: center; font-weight: bold; }
  td { border: 1px solid #ccc; padding: 4px 6px; vertical-align: middle; }
  td.num { text-align: right; }
  tr.total-row { background: #f0f0f0; font-weight: bold; }
  .section-title { font-weight: bold; font-style: italic; text-decoration: underline; margin: 12px 0 4px; font-size: 11px; }
  .verdict-box { border: 2px solid ${bandColor}; background: ${bandColor}15; padding: 10px 14px; margin: 12px 0; border-radius: 4px; }
  .verdict-box .code { font-weight: bold; color: ${bandColor}; font-size: 13px; }
  .insight-box { margin: 10px 0; }
  .expectations { background: ${BRAND_GREEN}10; border-left: 4px solid ${BRAND_GREEN}; padding: 8px 12px; margin: 10px 0; }
  .expectations h3 { color: ${BRAND_GREEN}; margin: 0 0 6px; font-size: 11px; }
  .expectations ul { margin: 4px 0; padding-left: 16px; }
  .expectations li { margin-bottom: 3px; font-size: 10.5px; }
  .action-box { margin: 10px 0; }
  .action-box h3 { font-weight: bold; font-size: 11px; margin-bottom: 6px; text-decoration: underline; }
  .action-box ul { padding-left: 16px; }
  .action-box li { margin-bottom: 4px; font-size: 10.5px; }
  .signoff { margin-top: 18px; }
  .signoff-name { font-weight: bold; margin-top: 8px; }
  .signoff-title { font-style: italic; }
  .cc { margin-top: 10px; font-size: 10px; }
  .cc ul { margin: 2px 0; padding-left: 16px; }
  .acknowledgment { margin-top: 24px; border-top: 2px solid ${BRAND_GREEN}; padding-top: 12px; }
  .acknowledgment h2 { color: ${BRAND_GREEN}; font-size: 12px; margin-bottom: 8px; }
  .ack-line { display: flex; gap: 40px; margin-top: 12px; }
  .ack-field { flex: 1; border-bottom: 1px solid #333; padding-top: 20px; font-size: 10px; }
  .footer { margin-top: 16px; text-align: center; font-size: 8.5px; color: #555; border-top: 1px solid #ccc; padding-top: 6px; }
  h2.section-head { background: ${BRAND_GREEN}; color: white; padding: 5px 10px; font-size: 11px; margin: 12px 0 6px; }
</style>
</head><body>

<div class="letterhead">
  <h1>Inuka Africa – Making Growth Possible! 🌱✨</h1>
  <div class="tagline">Unit 4, Elgeyo Marakwet road off Argwings Kodhek, Kilimani Road P.O BOX 24001-00100, Nairobi Kenya<br/>
  Tel. 0703 395300, 0705 860150, 0732 591803 &nbsp;|&nbsp; Email: Info@inukaafrica.com &nbsp;|&nbsp; www.inukaafrica.com</div>
</div>

<div class="band-legend">
  <table><tr>
    <td><strong style="color:#006400">E.P</strong> - Exceptional Performance - <strong>(Over 100%)</strong></td>
    <td><strong style="color:#2d8a2d">G.P</strong> - Good Performance - <strong>(80%-100%)</strong></td>
    <td><strong style="color:#b8860b">A.P</strong> - Average Performance - <strong>(60%-80%)</strong></td>
    <td><strong style="color:#cc6600">W.P</strong> - Weak Performance - <strong>(40%-60%)</strong></td>
    <td><strong style="color:#b00020">U.P</strong> - Unacceptable Performance - <strong>(Below 40%)</strong></td>
  </tr></table>
</div>

<div class="ref-date">
  <span>Ref: ${refNumber || 'HR/E-017/' + cycle.branch.replace(/ /g,'') + '/' + cycle.year}</span>
  <span>${today}</span>
</div>

<div class="addressee">
  <strong>${cycle.staffName.toUpperCase()} (IA/${cycle.staffId})</strong><br/>
  <em>${cycle.designation} - ${cycle.branch}</em>
</div>

<p><em>Dear ${cycle.staffName.split(' ')[0]},</em></p>

<div class="subject">Subject: Branch Performance Review Feedback &amp; Corrective Action Expectations</div>

<p>We hope this letter finds you in good health and high spirit.</p>

<p>This letter presents a review of your branch's performance against the approved ${cycle.year} Branch Budget, specifically on loan disbursements and collections, for the period <strong>${cycle.periodLabel}</strong>, and also sets out the expectations and required actions going forward.</p>

<p><strong>Below is a review of your branch's performance against the allocated budget:</strong></p>

<p class="section-title">• Disbursement (Budget vs Actual)</p>
${disbTable(score.disbursement, cycle.year, cycle.periodEnd)}

<p class="section-title">• Collection (Budget vs Actual)</p>
${collTable(score.collection, cycle.year, cycle.periodEnd)}

<h2 class="section-head">Performance Insights</h2>

<div class="insight-box">
  <p>The above performance reflects your branch's current position relative to the ${cycle.year} approved targets indicating that:</p>
  <ul>
    <li>As at ${cycle.periodEnd}, the branch is currently ${score.disbursement.totalVariance > 0 ? `behind on disbursements by <strong>Kshs. ${fmt(score.disbursement.totalVariance)}</strong>` : `<strong>ahead on disbursements by Kshs. ${fmt(Math.abs(score.disbursement.totalVariance))}</strong>`} and ${score.collection.totalVariance > 0 ? `behind on collections by <strong>Kshs. ${fmt(score.collection.totalVariance)}</strong>` : `<strong>ahead on collections by Kshs. ${fmt(Math.abs(score.collection.totalVariance))}</strong>`} relative to the ${cycle.year} budget.</li>
  </ul>
</div>

<div class="verdict-box">
  <p><strong>This performance level to date is rated =</strong> <span class="code">${score.verdictLabel}</span>. ${score.performanceStatement}</p>
</div>

<div class="action-box">
  <h3>Immediate Execution Priorities</h3>
  <p>To close the current gaps within the remaining period, you must take decisive and results-driven action:</p>
  <ul>${score.immediateActions.map(a => `<li>${a}</li>`).join('')}</ul>
</div>

${cycle.immediateActions ? `<p>${cycle.immediateActions.replace(/\n/g, '<br/>')}</p>` : ''}

${cycle.rmComments ? `<div class="action-box"><h3>Regional Manager's Comments</h3><p>${cycle.rmComments.replace(/\n/g, '<br/>')}</p></div>` : ''}

<div class="expectations">
  <h3>The expectations are clear:</h3>
  <ul>
    <li><strong>DELIVER the allocated budget</strong> – <em>Fully deliver the allocated budget as planned.</em></li>
    <li><strong>RECOVER all the deficits</strong> – <em>Ensure all deficits are completely recovered.</em></li>
    <li><strong>CLOSE the review period on a strong footing</strong> – <em>Close the period successfully on a strong and solid footing.</em></li>
  </ul>
</div>

<p>It is expected that all performance deficits will be <strong>FULLY RECOVERED</strong> by the end of the review period, with no shortfalls carried into the next period.</p>

<div class="signoff">
  <p>Yours Faithfully,</p>
  ${cycle.rmSignedAt ? `<p style="margin-top:24px;">__________________________________</p>` : '<p style="margin-top:48px;">__________________________________</p>'}
  <div class="signoff-name">${cycle.rmName || '[Regional Manager Name]'}</div>
  <div class="signoff-title">${cycle.rmTitle || '[Regional Manager Title]'}</div>
  ${cycle.rmSignedAt ? `<div style="font-size:10px;color:#555;">Signed: ${fmtDate(cycle.rmSignedAt)}</div>` : ''}
</div>

<div class="cc">
  <strong>Copy to:</strong>
  <ul>
    <li>Chief Operations Officer (COO), Inuka Africa ${cycle.cooSignedAt ? `<em>(Reviewed: ${fmtDate(cycle.cooSignedAt)})</em>` : ''}</li>
    <li>HR Section, Inuka Africa ${cycle.hrmSignedAt ? `<em>(Approved: ${fmtDate(cycle.hrmSignedAt)})</em>` : ''}</li>
    <li>Personal File</li>
  </ul>
</div>

<div class="acknowledgment">
  <h2>Letter Acknowledgment by the Branch Supervisor</h2>
  <p>I acknowledge receipt of this <strong><em>Performance Feedback</em></strong> and its content.</p>
  ${cycle.bsAcknowledged ? `<p><em>Acknowledged on ${fmtDate(cycle.bsAcknowledgedAt)}</em></p>` : ''}
  <div class="ack-line">
    <div class="ack-field">Name: ${cycle.bsAcknowledged ? cycle.staffName : ''}</div>
    <div class="ack-field">Sign:</div>
    <div class="ack-field">Date: ${cycle.bsAcknowledged ? fmtDate(cycle.bsAcknowledgedAt) : ''}</div>
  </div>
</div>

<div class="footer">CONFIDENTIAL &nbsp;|&nbsp; Inuka Africa Limited &nbsp;|&nbsp; Generated ${today}</div>
</body></html>`;
}

module.exports = { buildBSReportHtml };
