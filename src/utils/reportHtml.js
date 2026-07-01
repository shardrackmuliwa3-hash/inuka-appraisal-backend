const BRAND_GREEN = "#0D3B2E";
const BRAND_GOLD = "#D4A017";

function fmtPct(p) {
  return p === null || p === undefined ? "—" : `${(p * 100).toFixed(1)}%`;
}
function fmtScore(n) {
  return n === null || n === undefined ? "—" : n.toFixed(2);
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}
function esc(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderCompetencyTable(sectionA) {
  return sectionA.groups
    .map(
      (g) => `
    <div class="group-block">
      <div class="group-title">${esc(g.code)} — ${esc(g.title)} <span class="group-score">${fmtScore(g.average)} / 5  (${fmtPct(g.pctOfMax)})</span></div>
      <table class="criteria-table">
        <thead><tr><th>Criterion</th><th>Behavioural Anchor</th><th>Avg Score</th></tr></thead>
        <tbody>
          ${g.criteria
            .map(
              (c) => `<tr><td>${esc(c.title)}</td><td class="anchor">${esc(c.behaviouralAnchor)}</td><td class="num">${fmtScore(c.average)}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`
    )
    .join("");
}

function renderKpiTable(sectionB) {
  return sectionB.groups
    .map(
      (g) => `
    <div class="group-block">
      <div class="group-title">${esc(g.code)} — ${esc(g.title)} <span class="group-score">${fmtScore(g.subtotal)} pts</span></div>
      <table class="kpi-table">
        <thead><tr><th>KPI</th><th>Target</th><th>Actual</th><th>Achievement</th><th>Weight</th><th>Weighted Score</th></tr></thead>
        <tbody>
          ${g.kpis
            .map(
              (k) => `<tr>
                <td>${esc(k.title)}</td>
                <td class="num">${esc(k.targetLabel)}</td>
                <td class="num">${k.actualValue ?? "—"}</td>
                <td class="num">${fmtPct(k.achievementPct)}</td>
                <td class="num">${(k.weightPct * 100).toFixed(0)}%</td>
                <td class="num">${fmtScore(k.weightedScore)}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`
    )
    .join("");
}

function renderNarrativeBlock(title, content) {
  return `<div class="narrative-block"><div class="narrative-title">${esc(title)}</div><div class="narrative-content">${esc(content || "—").replace(/\n/g, "<br/>")}</div></div>`;
}

function buildAppraisalReportHtml(cycle, scoreResult, narrativesBySection, signoffs) {
  const staff = cycle.staffProfile;
  const outcome = scoreResult.outcome;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  @page { margin: 24mm 16mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 11px; }
  .header { background: ${BRAND_GREEN}; color: white; padding: 20px 24px; border-radius: 6px; margin-bottom: 14px; }
  .header h1 { margin: 0 0 4px; font-size: 20px; letter-spacing: 0.5px; }
  .header .sub { color: ${BRAND_GOLD}; font-size: 12px; font-weight: 600; }
  .header .tagline { font-size: 10px; opacity: 0.85; margin-top: 4px; }
  .section-title { background: ${BRAND_GREEN}; color: white; padding: 6px 10px; font-size: 12px; font-weight: 700; margin: 18px 0 8px; border-left: 5px solid ${BRAND_GOLD}; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  th, td { border: 1px solid #ddd; padding: 5px 7px; font-size: 10px; text-align: left; vertical-align: top; }
  th { background: #f1f1f1; color: ${BRAND_GREEN}; font-weight: 700; }
  td.num { text-align: center; white-space: nowrap; }
  td.anchor { color: #555; font-size: 9.5px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 10px; }
  .info-row { display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; padding: 3px 0; }
  .info-label { color: #555; font-weight: 600; }
  .group-block { margin-bottom: 10px; }
  .group-title { font-weight: 700; color: ${BRAND_GREEN}; font-size: 11px; margin-bottom: 4px; }
  .group-score { float: right; color: ${BRAND_GOLD}; background: ${BRAND_GREEN}; padding: 1px 8px; border-radius: 10px; font-size: 9.5px; }
  .summary-box { display: flex; gap: 12px; margin: 10px 0; }
  .summary-card { flex: 1; border: 2px solid ${BRAND_GREEN}; border-radius: 6px; padding: 10px; text-align: center; }
  .summary-card .label { font-size: 9.5px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary-card .value { font-size: 20px; font-weight: 800; color: ${BRAND_GREEN}; margin: 4px 0; }
  .summary-card .band { font-size: 10px; color: ${BRAND_GOLD}; font-weight: 700; }
  .outcome-box { background: #fff8e6; border: 2px solid ${BRAND_GOLD}; border-radius: 6px; padding: 12px; margin: 12px 0; }
  .outcome-box .outcome-title { font-weight: 800; color: ${BRAND_GREEN}; font-size: 13px; margin-bottom: 4px; }
  .narrative-block { margin-bottom: 8px; border-left: 3px solid ${BRAND_GOLD}; padding-left: 8px; }
  .narrative-title { font-weight: 700; color: ${BRAND_GREEN}; font-size: 10.5px; margin-bottom: 2px; }
  .narrative-content { font-size: 10px; white-space: pre-wrap; }
  .signoff-table td { font-size: 9.5px; }
  .footer { margin-top: 16px; text-align: center; font-size: 8.5px; color: #888; border-top: 1px solid #ddd; padding-top: 6px; }
</style></head>
<body>

  <div class="header">
    <h1>INUKA AFRICA LIMITED</h1>
    <div class="sub">${esc(staff.designation)} · COMPREHENSIVE PERFORMANCE APPRAISAL REPORT</div>
    <div class="tagline">Transforming Lives Through Responsible Credit · Confidential — HR Eyes Only</div>
  </div>

  <div class="section-title">STAFF & ASSESSMENT DETAILS</div>
  <div class="info-grid">
    <div class="info-row"><span class="info-label">Full Name</span><span>${esc(staff.fullName)}</span></div>
    <div class="info-row"><span class="info-label">Staff ID</span><span>${esc(staff.staffId)}</span></div>
    <div class="info-row"><span class="info-label">Designation</span><span>${esc(staff.designation)}</span></div>
    <div class="info-row"><span class="info-label">Department</span><span>${esc(staff.department || "—")}</span></div>
    <div class="info-row"><span class="info-label">Region / Branch</span><span>${esc(staff.region || "—")} ${esc(staff.branch ? "/ " + staff.branch : "")}</span></div>
    <div class="info-row"><span class="info-label">Reporting To</span><span>${esc(staff.reportingTo || "—")}</span></div>
    <div class="info-row"><span class="info-label">Assessment Type</span><span>${esc(cycle.assessmentType)}</span></div>
    <div class="info-row"><span class="info-label">Assessment Period</span><span>${fmtDate(cycle.periodStart)} – ${fmtDate(cycle.periodEnd)}</span></div>
    <div class="info-row"><span class="info-label">Date of Assessment</span><span>${fmtDate(cycle.dateOfAssessment || new Date())}</span></div>
    <div class="info-row"><span class="info-label">Next Review Date</span><span>${fmtDate(cycle.nextReviewDate)}</span></div>
  </div>

  <div class="section-title">SCORE SUMMARY</div>
  <div class="summary-box">
    <div class="summary-card">
      <div class="label">Section A — General Assessment</div>
      <div class="value">${fmtScore(scoreResult.sectionA.score)} / ${scoreResult.sectionA.maxScore}</div>
      <div class="band">${scoreResult.sectionA.band ? scoreResult.sectionA.band.label : "—"}</div>
    </div>
    <div class="summary-card">
      <div class="label">Section B — KPI Assessment</div>
      <div class="value">${fmtScore(scoreResult.sectionB.score)} / ${scoreResult.sectionB.maxScore}</div>
      <div class="band">${scoreResult.sectionB.band ? scoreResult.sectionB.band.label : "—"}</div>
    </div>
    <div class="summary-card" style="background:${BRAND_GREEN}; color:white;">
      <div class="label" style="color:${BRAND_GOLD};">Cumulative Score</div>
      <div class="value" style="color:white;">${fmtScore(scoreResult.totalScore)} / ${scoreResult.maxTotal}</div>
      <div class="band" style="color:${BRAND_GOLD};">${scoreResult.overallBand ? scoreResult.overallBand.label : "—"} (${fmtPct(scoreResult.overallPct)})</div>
    </div>
  </div>

  <div class="outcome-box">
    <div class="outcome-title">RECOMMENDED OUTCOME: ${esc(outcome.outcome)}</div>
    <div>${esc(outcome.detail)}</div>
  </div>

  <div class="section-title">SECTION A — GENERAL ASSESSMENT (COMPETENCY-BASED)</div>
  ${renderCompetencyTable(scoreResult.sectionA)}

  <div class="section-title">SECTION B — KEY PERFORMANCE INDICATOR ASSESSMENT</div>
  ${renderKpiTable(scoreResult.sectionB)}

  <div class="section-title">SECTION C — QUALITATIVE NARRATIVE & DEVELOPMENT PLANNING</div>
  ${renderNarrativeBlock("Key Strengths", narrativesBySection.C1_STRENGTHS)}
  ${renderNarrativeBlock("Areas Requiring Improvement & Strategies", narrativesBySection.C2_IMPROVEMENT_AREAS)}
  ${renderNarrativeBlock("Personal Development Plan", narrativesBySection.C3_DEVELOPMENT_PLAN)}
  ${renderNarrativeBlock("Training & Certification Needs", narrativesBySection.C4_TRAINING_NEEDS)}
  ${renderNarrativeBlock("Career Aspirations & Succession Potential", narrativesBySection.C5_CAREER_ASPIRATIONS)}
  ${renderNarrativeBlock("Outcome Recommendation Rationale", narrativesBySection.C6_OUTCOME_RECOMMENDATION)}

  <div class="section-title">SIGN-OFF</div>
  <table class="signoff-table">
    <thead><tr><th>Party</th><th>Name</th><th>Date Signed</th><th>Notes</th></tr></thead>
    <tbody>
      ${["APPRAISEE", "SUPERVISOR", "HR", "APPROVING_AUTHORITY"]
        .map((party) => {
          const s = signoffs.find((x) => x.party === party);
          return `<tr><td>${party.replace("_", " ")}</td><td>${s ? esc(s.userName) : "—"}</td><td>${s ? fmtDate(s.signedAt) : "—"}</td><td>${s ? esc(s.notes || "") : ""}</td></tr>`;
        })
        .join("")}
    </tbody>
  </table>

  <div class="footer">CONFIDENTIAL · Inuka Africa Limited HR Property · Unauthorised disclosure is a disciplinary offence · Generated ${fmtDate(new Date())}</div>
</body></html>`;
}

module.exports = { buildAppraisalReportHtml };
