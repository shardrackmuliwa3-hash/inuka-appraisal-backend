/**
 * Scoring engine — mirrors the Inuka Excel appraisal formulas exactly.
 *
 * Section A (General Assessment):
 *   - Each criterion's score = average of all rater scores (1-5) for that criterion
 *   - Each group's score = average of its criteria averages
 *   - Section A final = average of all group scores, scaled to template.sectionAWeight
 *     i.e. (avgOfGroups / 5) * sectionAWeight
 *
 * Section B (KPI Assessment):
 *   - achievementPct = actual vs target, direction-aware, capped at 100%
 *   - weightedScore = achievementPct * kpi.weightPct * sectionBWeight
 *   - Section B total = sum of all weightedScores (max = sectionBWeight)
 *
 * Overall = Section A score + Section B score (out of 100 by default)
 * Band thresholds match the Excel legend: 80/65/50/30 percent cutoffs.
 */

const RATING_BANDS = [
  { min: 0.8, label: "Exceptional", stars: "★★★★★" },
  { min: 0.65, label: "Above Average", stars: "★★★★☆" },
  { min: 0.5, label: "Meets Expectations", stars: "★★★☆☆" },
  { min: 0.3, label: "Needs Improvement", stars: "★★☆☆☆" },
  { min: 0, label: "Unsatisfactory", stars: "★☆☆☆☆" },
];

function bandFor(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return null;
  return RATING_BANDS.find((b) => pct >= b.min) || RATING_BANDS[RATING_BANDS.length - 1];
}

function average(nums) {
  const valid = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function computeSectionA(competencyGroups, ratings, sectionAWeight) {
  const ratingsByCriterion = {};
  for (const r of ratings) {
    if (!ratingsByCriterion[r.criterionId]) ratingsByCriterion[r.criterionId] = [];
    ratingsByCriterion[r.criterionId].push(r.score);
  }

  const groupResults = competencyGroups.map((group) => {
    const criteriaResults = group.criteria.map((c) => {
      const avg = average(ratingsByCriterion[c.id] || []);
      return {
        criterionId: c.id,
        title: c.title,
        behaviouralAnchor: c.behaviouralAnchor,
        raterScores: ratingsByCriterion[c.id] || [],
        average: avg,
        pctOfMax: avg !== null ? avg / 5 : null,
      };
    });
    const groupAvg = average(criteriaResults.map((c) => c.average));
    return {
      groupId: group.id,
      code: group.code,
      title: group.title,
      criteria: criteriaResults,
      average: groupAvg,
      pctOfMax: groupAvg !== null ? groupAvg / 5 : null,
      scaledScore: groupAvg !== null ? (groupAvg / 5) * sectionAWeight : null,
    };
  });

  const overallAvg = average(groupResults.map((g) => g.average));
  const pctOfMax = overallAvg !== null ? overallAvg / 5 : null;
  const scaledScore = overallAvg !== null ? (overallAvg / 5) * sectionAWeight : null;

  return {
    groups: groupResults,
    average: overallAvg,
    pctOfMax,
    score: scaledScore,
    maxScore: sectionAWeight,
    band: bandFor(pctOfMax),
  };
}

function computeAchievementPct(actualValue, targetValue, higherIsBetter) {
  if (actualValue === null || actualValue === undefined || targetValue === null || targetValue === undefined) {
    return null;
  }
  if (targetValue === 0) {
    return higherIsBetter ? (actualValue >= 0 ? 1 : 0) : (actualValue === 0 ? 1 : 0);
  }
  let raw;
  if (higherIsBetter) {
    raw = actualValue / targetValue;
  } else {
    raw = targetValue / actualValue;
  }
  if (!Number.isFinite(raw) || raw < 0) raw = 0;
  return Math.min(raw, 1);
}

function computeSectionB(kpiGroups, actuals, sectionBWeight) {
  const actualByKpi = {};
  for (const a of actuals) actualByKpi[a.kpiId] = a;

  const groupResults = kpiGroups.map((group) => {
    const kpiResults = group.kpis.map((kpi) => {
      const actual = actualByKpi[kpi.id];
      const achievementPct = actual
        ? computeAchievementPct(actual.actualValue, actual.targetValue, kpi.higherIsBetter)
        : null;
      const weightedScore = achievementPct !== null ? achievementPct * kpi.weightPct * sectionBWeight : null;
      return {
        kpiId: kpi.id,
        title: kpi.title,
        measurementFormula: kpi.measurementFormula,
        targetLabel: kpi.targetLabel,
        weightPct: kpi.weightPct,
        actualValue: actual ? actual.actualValue : null,
        achievementPct,
        weightedScore,
        band: bandFor(achievementPct),
      };
    });
    return {
      groupId: group.id,
      code: group.code,
      title: group.title,
      kpis: kpiResults,
      subtotal: kpiResults.reduce((sum, k) => sum + (k.weightedScore || 0), 0),
    };
  });

  const totalScore = groupResults.reduce((sum, g) => sum + g.subtotal, 0);
  const pctOfMax = sectionBWeight > 0 ? totalScore / sectionBWeight : null;

  return {
    groups: groupResults,
    score: totalScore,
    maxScore: sectionBWeight,
    pctOfMax,
    band: bandFor(pctOfMax),
  };
}

const OUTCOME_RULES = [
  { min: 0.8, outcome: "CONFIRM PROBATION — IMMEDIATE EFFECT", detail: "Exceptional performance. Recommend salary review and fast-track programme." },
  { min: 0.65, outcome: "CONFIRM PROBATION", detail: "Above average performance. Maintain current role; set stretch KPIs for next cycle." },
  { min: 0.5, outcome: "CONFIRM WITH CONDITIONS", detail: "Satisfactory. Document SMART improvement targets within 14 days." },
  { min: 0.3, outcome: "EXTEND PROBATION — 3 MONTHS", detail: "Below standard. Mandatory PIP with bi-weekly HR check-ins." },
  { min: 0, outcome: "TERMINATE PROBATION", detail: "Unsatisfactory. Escalate to formal HR disciplinary process immediately." },
];

function outcomeFor(overallPct) {
  if (overallPct === null || overallPct === undefined || Number.isNaN(overallPct)) {
    return { outcome: "PENDING", detail: "Scores not yet complete." };
  }
  return OUTCOME_RULES.find((r) => overallPct >= r.min) || OUTCOME_RULES[OUTCOME_RULES.length - 1];
}

function computeCycleScore({ template, ratings, kpiActuals }) {
  const sectionA = computeSectionA(template.competencyGroups, ratings, template.sectionAWeight);
  const sectionB = computeSectionB(template.kpiGroups, kpiActuals, template.sectionBWeight);

  const maxTotal = template.sectionAWeight + template.sectionBWeight;
  const totalScore = (sectionA.score || 0) + (sectionB.score || 0);
  const overallPct = maxTotal > 0 ? totalScore / maxTotal : null;

  return {
    sectionA,
    sectionB,
    totalScore,
    maxTotal,
    overallPct,
    overallBand: bandFor(overallPct),
    outcome: outcomeFor(overallPct),
  };
}

module.exports = {
  RATING_BANDS,
  bandFor,
  average,
  computeAchievementPct,
  computeSectionA,
  computeSectionB,
  computeCycleScore,
  outcomeFor,
};
