/**
 * Branch Supervisor Performance Scoring Engine
 * Purely numerical: Disbursement and Collection budget vs actual
 *
 * Performance Bands (based on cumulative disbursement % achievement):
 *   E.P  Exceptional      >= 100%
 *   G.P  Good             80% – 99%
 *   A.P  Average          60% – 79%
 *   W.P  Weak             40% – 59%
 *   U.P  Unacceptable     < 40%
 */

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PERIOD_MONTHS = {
  MONTHLY:     null, // set dynamically
  Q1:          ['Jan','Feb','Mar'],
  Q2:          ['Apr','May','Jun'],
  Q3:          ['Jul','Aug','Sep'],
  Q4:          ['Oct','Nov','Dec'],
  H1:          ['Jan','Feb','Mar','Apr','May','Jun'],
  H2:          ['Jul','Aug','Sep','Oct','Nov','Dec'],
  ANNUAL:      MONTHS,
  PROBATIONARY: null, // set dynamically
};

const BANDS = [
  { min: 1.0, code: 'E.P', label: 'Exceptional Performance',    color: '#006400' },
  { min: 0.8, code: 'G.P', label: 'Good Performance',           color: '#2d8a2d' },
  { min: 0.6, code: 'A.P', label: 'Average Performance',        color: '#b8860b' },
  { min: 0.4, code: 'W.P', label: 'Weak Performance',           color: '#cc6600' },
  { min: 0,   code: 'U.P', label: 'Unacceptable Performance',   color: '#b00020' },
];

const PERFORMANCE_STATEMENTS = {
  'E.P': 'Your branch has delivered exceptional performance against the allocated budget. This demonstrates outstanding leadership, disciplined execution, and strong accountability across the team. The branch serves as a benchmark of excellence across the network. Sustain this momentum and continue driving the team toward even greater milestones.',
  'G.P': 'Your branch has delivered good performance against the allocated budget targets. The results reflect solid planning, strong field supervision, and consistent team accountability. Continue building on this momentum and strive to push performance into the Exceptional range by ensuring no pipeline opportunity is left unconverted.',
  'A.P': 'Your performance is largely on track with the expected delivery trajectory. While meaningful progress has been made, there are still identifiable gaps that must be closed to achieve full budget alignment. With deliberate effort and tighter follow-through, the branch is well-positioned to deliver on its targets.',
  'W.P': 'Your performance is significantly below expectations and indicates clear breakdowns in execution, follow-through, and performance management at branch level. The current position exposes the branch to a substantial deficit against the 2026 budget. Without immediate and intensified intervention, the likelihood of closing this gap remains low. Urgent corrective action, stricter supervision, and full accountability across the team are required.',
  'U.P': 'Your performance is critically below the required standard and represents a serious deviation from the expected delivery trajectory. The level of underperformance indicates fundamental failures in planning, execution, and oversight. The current deficit is not sustainable and places the branch in a high-risk position against the 2026 budget. Immediate, decisive intervention is required, including strict performance management measures and direct accountability, to attempt recovery within the remaining period.',
};

const IMMEDIATE_ACTIONS = {
  'E.P': [
    'Maintain current disbursement velocity and ensure no pipeline stalls in the remaining period.',
    'Drive collections efficiency by maintaining zero tolerance for avoidable arrears.',
    'Mentor junior staff and model the accountability standards that produced this performance.',
    'Identify and document best practices for cross-branch sharing.',
  ],
  'G.P': [
    'Accelerate disbursement conversion rate to move into the Exceptional band.',
    'Enforce rigorous collections management with structured daily follow-ups.',
    'Drive individual accountability — each Loan Officer must deliver on assigned targets.',
    'Tighten pipeline monitoring and eliminate bottlenecks before end of period.',
  ],
  'A.P': [
    'Accelerate disbursement momentum by unlocking all viable pipeline opportunities and ensuring high conversion rates.',
    'Enforce rigorous collections management, with structured daily follow-ups, strict accountability, and zero tolerance for avoidable arrears.',
    'Drive individual accountability across all Loan Officers, ensuring each staff member delivers on assigned targets without exception.',
    'Strengthen on-ground supervision, maintaining visibility, discipline, and productivity within the branch.',
    'Implement a time-bound recovery plan, clearly demonstrating how the existing deficit will be cleared within the remaining period.',
  ],
  'W.P': [
    'Implement an IMMEDIATE disbursement recovery sprint — identify every viable client in the pipeline and disburse without delay.',
    'Conduct emergency team briefing to communicate the performance gap and set non-negotiable individual daily targets.',
    'Enforce zero-tolerance collections protocol with daily reconciliation and immediate escalation of delinquent accounts.',
    'Engage Regional Manager for daily check-in calls until performance stabilises above the 60% threshold.',
    'Submit a written 7-day recovery plan to the Regional Manager within 48 hours of receiving this feedback.',
  ],
  'U.P': [
    'Convene an immediate branch crisis meeting and communicate the severity of the performance gap to every staff member.',
    'Submit a comprehensive written Performance Improvement Plan (PIP) to the Regional Manager within 24 hours.',
    'Implement a daily disbursement and collections reporting regime directly to the Regional Manager.',
    'Each Loan Officer must produce a personal daily target tracker — no exceptions.',
    'HR will schedule a formal review within 14 days to assess progress against this PIP. Non-compliance will trigger formal disciplinary proceedings.',
  ],
};

function bandFor(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return null;
  return BANDS.find(b => pct >= b.min) || BANDS[BANDS.length - 1];
}

function getMonthsForPeriod(reviewPeriod, customMonths) {
  if (customMonths && Array.isArray(customMonths)) return customMonths;
  return PERIOD_MONTHS[reviewPeriod] || MONTHS;
}

function computeMonthlyRow(budget, actual, month) {
  const bud = (budget && budget[month]) || 0;
  const act = (actual && actual[month]) || 0;
  const variance = bud - act;
  const pctAchiv = bud > 0 ? act / bud : null;
  return { month, budget: bud, actual: act, variance, pctAchiv };
}

function computeBSSectionScore(budget, actual, months) {
  const rows = months.map(m => computeMonthlyRow(budget, actual, m));
  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalVariance = totalBudget - totalActual;
  const cumulativePct = totalBudget > 0 ? totalActual / totalBudget : null;
  return { rows, totalBudget, totalActual, totalVariance, cumulativePct, band: bandFor(cumulativePct) };
}

function computeBSCycleScore(cycle) {
  const months = getMonthsForPeriod(cycle.reviewPeriod, cycle.customMonths);
  const disbScore = computeBSSectionScore(cycle.disbBudget, cycle.disbActual, months);
  const collScore = computeBSSectionScore(cycle.collBudget, cycle.collActual, months);

  // Verdict based on cumulative disbursement % (matching Excel column AJ logic)
  const verdictBand = bandFor(disbScore.cumulativePct);
  const verdictCode = verdictBand ? verdictBand.code : 'U.P';

  return {
    months,
    disbursement: disbScore,
    collection: collScore,
    verdictCode,
    verdictLabel: verdictBand ? `${verdictCode} - ${verdictBand.label}` : 'U.P - Unacceptable Performance',
    performanceStatement: PERFORMANCE_STATEMENTS[verdictCode] || PERFORMANCE_STATEMENTS['U.P'],
    immediateActions: IMMEDIATE_ACTIONS[verdictCode] || IMMEDIATE_ACTIONS['U.P'],
  };
}

module.exports = {
  MONTHS,
  PERIOD_MONTHS,
  BANDS,
  PERFORMANCE_STATEMENTS,
  IMMEDIATE_ACTIONS,
  bandFor,
  getMonthsForPeriod,
  computeMonthlyRow,
  computeBSSectionScore,
  computeBSCycleScore,
};
