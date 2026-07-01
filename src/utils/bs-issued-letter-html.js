const BRAND_GREEN = '#0D3B2E';
const BAND_COLORS = { 'E.P':'#006400','G.P':'#2d8a2d','A.P':'#b8860b','W.P':'#cc6600','U.P':'#b00020' };

function fmt(n) { if (!n && n !== 0) return '—'; return Math.abs(n).toLocaleString('en-KE', { minimumFractionDigits: 2 }); }
function pct(p) { if (p === null || p === undefined) return '—'; return (p * 100).toFixed(2) + '%'; }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }); }
function fmtDateTime(d) { if (!d) return '—'; const dt = new Date(d); return `${dt.toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })} at ${dt.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}`; }

const MONTH_LABELS = { Jan:'January',Feb:'February',Mar:'March',Apr:'April',May:'May',Jun:'June', Jul:'July',Aug:'August',Sep:'September',Oct:'October',Nov:'November',Dec:'December' };
const PERIOD_MONTHS = { Q1:['Jan','Feb','Mar'],Q2:['Apr','May','Jun'],Q3:['Jul','Aug','Sep'],Q4:['Oct','Nov','Dec'], H1:['Jan','Feb','Mar','Apr','May','Jun'],H2:['Jul','Aug','Sep','Oct','Nov','Dec'], ANNUAL:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] };

function disbTable(cycle, score) {
  const months = PERIOD_MONTHS[cycle.reviewPeriod] || Object.keys(cycle.disbBudget || {});
  const rows = months.map(m => {
    const bud = (cycle.disbBudget && cycle.disbBudget[m]) || 0;
    const act = (cycle.disbActual && cycle.disbActual[m]) || 0;
    const achiv = bud > 0 ? act / bud : null;
    const variance = bud - act;
    return `<tr>
      <td>${MONTH_LABELS[m] || m} ${cycle.year}${m === months[months.length-1] ? ` (as at ${cycle.periodEnd})` : ''}</td>
      <td class="num">${fmt(bud)}</td><td class="num">${fmt(act)}</td>
      <td class="num" style="color:${achiv !== null ? (achiv>=1?'#006400':achiv>=0.8?'#2d8a2d':achiv>=0.6?'#b8860b':achiv>=0.4?'#cc6600':'#b00020') : '#333'}">${achiv !== null ? pct(achiv) : '—'}</td>
      <td class="num" style="color:${variance>0?'#b00020':'#006400'}">${fmt(variance)}</td>
    </tr>`;
  }).join('');
  return `<table><thead><tr><th>Month</th><th>Budgeted Disbursement (Kshs)</th><th>Actual Disbursement (Kshs)</th><th>% Achievement</th><th>Variance (Kshs)</th></tr></thead>
  <tbody>${rows}<tr class="total"><td><strong>TOTAL</strong></td><td class="num"><strong>${fmt(score.disbursement.totalBudget)}</strong></td><td class="num"><strong>${fmt(score.disbursement.totalActual)}</strong></td><td class="num"><strong>${pct(score.disbursement.cumulativePct)}</strong></td><td class="num"><strong>${fmt(score.disbursement.totalVariance)}</strong></td></tr></tbody></table>`;
}

function collTable(cycle, score) {
  const months = PERIOD_MONTHS[cycle.reviewPeriod] || Object.keys(cycle.collBudget || {});
  const rows = months.map(m => {
    const bud = (cycle.collBudget && cycle.collBudget[m]) || 0;
    const act = (cycle.collActual && cycle.collActual[m]) || 0;
    const achiv = bud > 0 ? act / bud : null;
    const variance = bud - act;
    return `<tr>
      <td>${MONTH_LABELS[m] || m} ${cycle.year}${m === months[months.length-1] ? ` (as at ${cycle.periodEnd})` : ''}</td>
      <td class="num">${fmt(bud)}</td><td class="num">${fmt(act)}</td>
      <td class="num">${achiv !== null ? pct(achiv) : '—'}</td>
      <td class="num" style="color:${variance>0?'#b00020':'#006400'}">${fmt(variance)}</td>
    </tr>`;
  }).join('');
  return `<table><thead><tr><th>Month</th><th>Budgeted Collection (Kshs)</th><th>Actual Collection (Kshs)</th><th>% Achievement</th><th>Variance (Kshs)</th></tr></thead>
  <tbody>${rows}<tr class="total"><td><strong>TOTAL</strong></td><td class="num"><strong>${fmt(score.collection.totalBudget)}</strong></td><td class="num"><strong>${fmt(score.collection.totalActual)}</strong></td><td class="num"><strong>${pct(score.collection.cumulativePct)}</strong></td><td class="num"><strong>${fmt(score.collection.totalVariance)}</strong></td></tr></tbody></table>`;
}

function sigBlock(sigImg, name, title, signedAt, party) {
  return `<div class="sig-block">
    <div class="sig-label">${party}</div>
    ${sigImg ? `<img src="${sigImg}" class="sig-img" alt="${party} signature"/>` : '<div class="sig-placeholder">[Awaiting Signature]</div>'}
    <div class="sig-name">${name || '—'}</div>
    ${title ? `<div class="sig-title">${title}</div>` : ''}
    <div class="sig-date">${sigImg ? fmtDateTime(signedAt) : ''}</div>
  </div>`;
}

function formatBody(text) {
  if (!text) return '';
  return text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function buildBSIssuedLetterHtml(letter, cycle, score) {
  const bandColor = BAND_COLORS[letter.band] || '#333';
  const today = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  const actions = (() => { try { return JSON.parse(letter.mergedImmediateActions); } catch { return [letter.mergedImmediateActions]; } })();
  const copyTo = (() => { try { return JSON.parse(letter.copyTo); } catch { return [letter.copyTo]; } })();
  const isSealed = !!letter.sealedAt;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  @page { margin: 20mm 18mm; }
  body { font-family:'Times New Roman',Times,serif; font-size:11px; color:#1a1a1a; line-height:1.6; }
  .letterhead { text-align:center; border-bottom:3px double ${BRAND_GREEN}; padding-bottom:10px; margin-bottom:14px; }
  .letterhead h1 { color:${BRAND_GREEN}; font-size:17px; margin:0 0 2px; font-style:italic; }
  .letterhead .tagline { font-size:9px; color:#666; }
  .band-legend { background:#f8f8f8; border:1px solid #ddd; padding:6px 10px; margin-bottom:12px; font-size:9.5px; display:flex; gap:16px; flex-wrap:wrap; }
  .band-legend span { white-space:nowrap; }
  .ref-date { display:flex; justify-content:space-between; margin-bottom:12px; font-size:10.5px; }
  .sealed-banner { background:${BRAND_GREEN}; color:white; text-align:center; padding:6px; font-weight:bold; font-size:10px; letter-spacing:1px; margin-bottom:12px; border-radius:3px; }
  table { width:100%; border-collapse:collapse; margin-bottom:8px; font-size:9.5px; }
  th { background:${BRAND_GREEN}; color:white; padding:4px 6px; font-weight:bold; }
  td { border:1px solid #ccc; padding:3px 6px; }
  td.num { text-align:right; }
  tr.total { background:#f0f0f0; font-weight:bold; }
  .section-title { font-weight:bold; font-style:italic; text-decoration:underline; margin:10px 0 4px; }
  .verdict-box { border:2px solid ${bandColor}; background:${bandColor}18; padding:8px 12px; margin:10px 0; border-radius:4px; }
  .verdict-code { color:${bandColor}; font-weight:bold; font-size:13px; }
  .actions ul { padding-left:16px; margin:4px 0; }
  .actions li { margin-bottom:3px; }
  .expectations { background:${BRAND_GREEN}10; border-left:4px solid ${BRAND_GREEN}; padding:8px 12px; margin:10px 0; }
  .expectations ul { padding-left:16px; margin:4px 0; }
  .sig-row { display:flex; gap:20px; margin-top:20px; flex-wrap:wrap; }
  .sig-block { flex:1; min-width:150px; border:1px solid #ddd; border-radius:4px; padding:8px; text-align:center; background:#fafafa; }
  .sig-block .sig-label { font-size:9px; font-weight:bold; color:${BRAND_GREEN}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
  .sig-img { max-width:140px; max-height:60px; display:block; margin:4px auto; border-bottom:1px solid #333; }
  .sig-placeholder { height:60px; border-bottom:1px solid #ccc; margin:4px 0; color:#bbb; font-size:9px; display:flex; align-items:flex-end; justify-content:center; padding-bottom:4px; }
  .sig-name { font-weight:bold; font-size:10px; margin-top:4px; }
  .sig-title { font-style:italic; font-size:9px; color:#555; }
  .sig-date { font-size:8.5px; color:#888; margin-top:2px; }
  .ack-block { margin-top:20px; border-top:2px solid ${BRAND_GREEN}; padding-top:10px; }
  .ack-block h3 { color:${BRAND_GREEN}; font-size:11px; margin-bottom:6px; }
  .audit-block { margin-top:20px; background:#f0f0f0; border:1px solid #ccc; border-radius:4px; padding:10px; font-size:8.5px; }
  .audit-block h4 { color:${BRAND_GREEN}; margin:0 0 6px; font-size:10px; }
  .audit-row { display:flex; gap:10px; border-bottom:1px solid #ddd; padding:2px 0; }
  .audit-row .ts { color:#888; min-width:140px; }
  .footer { margin-top:14px; text-align:center; font-size:8px; color:#777; border-top:1px solid #ddd; padding-top:6px; }
</style></head><body>

${isSealed ? `<div class="sealed-banner">🔒 SEALED DOCUMENT — This letter was officially sealed on ${fmtDateTime(letter.sealedAt)} and cannot be altered.</div>` : ''}

<div class="letterhead">
  <h1>Inuka Africa – Making Growth Possible! 🌱✨</h1>
  <div class="tagline">Unit 4, Elgeyo Marakwet road off Argwings Kodhek, Kilimani Road P.O BOX 24001-00100, Nairobi Kenya<br/>Tel. 0703 395300, 0705 860150, 0732 591803 &nbsp;|&nbsp; Email: Info@inukaafrica.com &nbsp;|&nbsp; www.inukaafrica.com</div>
</div>

<div class="band-legend">
  <span><strong style="color:#006400">E.P</strong> - Exceptional (≥100%)</span>
  <span><strong style="color:#2d8a2d">G.P</strong> - Good (80–100%)</span>
  <span><strong style="color:#b8860b">A.P</strong> - Average (60–80%)</span>
  <span><strong style="color:#cc6600">W.P</strong> - Weak (40–60%)</span>
  <span><strong style="color:#b00020">U.P</strong> - Unacceptable (&lt;40%)</span>
</div>

<div class="ref-date">
  <span>Ref: ${letter.refNumber}</span>
  <span>${today}</span>
</div>

<div style="margin-bottom:10px;">
  <strong>${cycle.staffName.toUpperCase()} (IA/${cycle.staffId})</strong><br/>
  <em>${cycle.designation} — ${cycle.branch} Branch</em>
</div>

<p><em>Dear ${cycle.staffName.split(' ')[0]},</em></p>

<p><strong><u>${letter.subject}</u></strong></p>

<div>${formatBody(letter.mergedOpeningParagraph)}</div>

<p class="section-title">• Disbursement (Budget vs Actual)</p>
${disbTable(cycle, score)}

<p class="section-title">• Collection (Budget vs Actual)</p>
${collTable(cycle, score)}

<h3 style="background:${BRAND_GREEN};color:white;padding:5px 10px;margin:12px 0 6px;font-size:11px;">Performance Insights</h3>
<div>${formatBody(letter.mergedPerformanceInsights)}</div>

<div class="verdict-box">
  <span class="verdict-code">${score.verdictLabel}</span><br/>
  <div style="margin-top:4px;">${formatBody(letter.mergedMainBody)}</div>
</div>

<div class="actions">
  <p><strong><u>Immediate Execution Priorities</u></strong></p>
  <ul>${actions.map(a => `<li>${formatBody(a)}</li>`).join('')}</ul>
</div>

<div class="expectations">
  <strong>The expectations are clear:</strong>
  <ul>
    <li><strong>DELIVER the allocated budget</strong> — <em>Fully deliver the allocated budget as planned.</em></li>
    <li><strong>RECOVER all deficits</strong> — <em>Ensure all deficits are completely recovered.</em></li>
    <li><strong>CLOSE the review period on a strong footing.</strong></li>
  </ul>
</div>

<div style="margin-top:10px;">${formatBody(letter.mergedClosingParagraph)}</div>

<!-- SIGNATURES -->
<div class="sig-row">
  ${sigBlock(letter.rmSignature, letter.rmSignerName, letter.rmSignerTitle, letter.rmSignedAt, 'Regional Manager')}
  ${sigBlock(letter.cooSignature, letter.cooSignerName, null, letter.cooSignedAt, 'COO')}
  ${sigBlock(letter.hrmSignature, letter.hrmSignerName, null, letter.hrmSignedAt, 'HR Manager')}
</div>

<div style="margin-top:10px; font-size:10px;"><strong>Copy to:</strong> ${copyTo.join(' &nbsp;|&nbsp; ')}</div>

<!-- BS ACKNOWLEDGMENT -->
<div class="ack-block">
  <h3>Branch Supervisor — Acknowledgment of Receipt</h3>
  <p style="font-size:10px;">I, the undersigned, confirm that I have received, read, and understood this <strong>${letter.templateTitle}</strong> and its full contents.</p>
  ${letter.bsSignature
    ? `<div style="text-align:center;margin:8px 0;">
        <img src="${letter.bsSignature}" style="max-width:160px;max-height:70px;border-bottom:1px solid #333;display:block;margin:0 auto 4px;"/>
        <div style="font-weight:bold;font-size:10px;">${letter.bsSignerName || cycle.staffName}</div>
        <div style="font-size:9px;color:#555;">${cycle.designation} — IA/${cycle.staffId}</div>
        <div style="font-size:9px;color:#888;">Signed: ${fmtDateTime(letter.bsSignedAt)}</div>
       </div>`
    : `<div style="display:flex;gap:40px;margin-top:12px;">
        <div style="flex:1;border-bottom:1px solid #333;padding-top:40px;font-size:9.5px;">Name:</div>
        <div style="flex:1;border-bottom:1px solid #333;padding-top:40px;font-size:9.5px;">Sign:</div>
        <div style="flex:1;border-bottom:1px solid #333;padding-top:40px;font-size:9.5px;">Date:</div>
       </div>`}
</div>

<!-- AUDIT TRAIL -->
<div class="audit-block">
  <h4>🔍 Document Authenticity Record</h4>
  <div class="audit-row"><span class="ts">Issued</span><span>Letter issued by ${letter.issuedByName} on ${fmtDateTime(letter.issuedAt)} using template: "${letter.templateTitle}"</span></div>
  ${letter.rmSignedAt ? `<div class="audit-row"><span class="ts">RM Signature</span><span>${letter.rmSignerName} signed on ${fmtDateTime(letter.rmSignedAt)}</span></div>` : ''}
  ${letter.cooSignedAt ? `<div class="audit-row"><span class="ts">COO Signature</span><span>${letter.cooSignerName} signed on ${fmtDateTime(letter.cooSignedAt)}</span></div>` : ''}
  ${letter.hrmSignedAt ? `<div class="audit-row"><span class="ts">HRM Signature</span><span>${letter.hrmSignerName} signed on ${fmtDateTime(letter.hrmSignedAt)}</span></div>` : ''}
  ${letter.bsSignedAt ? `<div class="audit-row"><span class="ts">BS Acknowledged</span><span>${letter.bsSignerName} acknowledged on ${fmtDateTime(letter.bsSignedAt)}</span></div>` : ''}
  ${letter.sealedAt ? `<div class="audit-row"><span class="ts">🔒 SEALED</span><span>Document sealed on ${fmtDateTime(letter.sealedAt)} — no further modifications permitted</span></div>` : ''}
</div>

<div class="footer">CONFIDENTIAL — Inuka Africa Limited HR Property — Ref: ${letter.refNumber} — Generated ${today}<br/>This document carries embedded digital signatures and an audit trail. Any tampering constitutes a disciplinary offence.</div>
</body></html>`;
}

module.exports = { buildBSIssuedLetterHtml };
