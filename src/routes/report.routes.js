const express = require("express");
const prisma = require("../utils/prisma");
const { authRequired, requireRole } = require("../middleware/auth");
const { computeCycleScore } = require("../utils/scoring");
const { buildAppraisalReportHtml } = require("../utils/reportHtml");

const router = express.Router();
router.use(authRequired);

async function loadFullTemplate(templateId) {
  return prisma.appraisalTemplate.findUnique({
    where: { id: templateId },
    include: {
      competencyGroups: { include: { criteria: true }, orderBy: { orderIndex: "asc" } },
      kpiGroups: { include: { kpis: true }, orderBy: { orderIndex: "asc" } },
    },
  });
}

async function buildReportPayload(cycleId) {
  const cycle = await prisma.appraisalCycle.findUnique({
    where: { id: cycleId },
    include: {
      staffProfile: true,
      ratings: true,
      kpiActuals: true,
      narratives: true,
      signoffs: { include: { user: { select: { fullName: true } } } },
    },
  });
  if (!cycle) return null;
  const fullTemplate = await loadFullTemplate(cycle.templateId);
  const scoreResult = computeCycleScore({ template: fullTemplate, ratings: cycle.ratings, kpiActuals: cycle.kpiActuals });
  const narrativesBySection = {};
  for (const n of cycle.narratives) {
    narrativesBySection[n.section] = narrativesBySection[n.section]
      ? narrativesBySection[n.section] + "\n\n" + n.content
      : n.content;
  }
  const signoffs = cycle.signoffs.map((s) => ({ party: s.party, userName: s.user.fullName, signedAt: s.signedAt, notes: s.notes }));
  return { cycle, scoreResult, narrativesBySection, signoffs };
}

// HTML report — opens in browser, Ctrl+P to print/save as PDF
router.get("/cycle/:id/html", async (req, res) => {
  try {
    const cycle = await prisma.appraisalCycle.findUnique({ where: { id: req.params.id } });
    if (!cycle) return res.status(404).json({ error: "Cycle not found" });
    if (req.user.role === "APPRAISEE" && cycle.staffProfileId !== req.user.staffProfileId) return res.status(403).json({ error: "Forbidden" });
    if (req.user.role === "APPRAISER") {
      const assigned = await prisma.raterAssignment.findFirst({ where: { staffProfileId: cycle.staffProfileId, raterUserId: req.user.id } });
      if (!assigned) return res.status(403).json({ error: "Forbidden" });
    }
    const payload = await buildReportPayload(req.params.id);
    if (!payload) return res.status(404).json({ error: "Cycle not found" });
    const html = buildAppraisalReportHtml(payload.cycle, payload.scoreResult, payload.narrativesBySection, payload.signoffs);
    res.set("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

router.get("/cycle/:id/data", async (req, res) => {
  const payload = await buildReportPayload(req.params.id);
  if (!payload) return res.status(404).json({ error: "Cycle not found" });
  res.json(payload);
});

router.get("/aggregate", requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { region, branch, status } = req.query;
    const cycles = await prisma.appraisalCycle.findMany({
      where: { status: status || undefined, staffProfile: { region: region || undefined, branch: branch || undefined } },
      include: { staffProfile: true, ratings: true, kpiActuals: true },
    });
    const results = [];
    for (const cycle of cycles) {
      const fullTemplate = await loadFullTemplate(cycle.templateId);
      const scoreResult = computeCycleScore({ template: fullTemplate, ratings: cycle.ratings, kpiActuals: cycle.kpiActuals });
      results.push({ cycleId: cycle.id, staffId: cycle.staffProfile.staffId, fullName: cycle.staffProfile.fullName, designation: cycle.staffProfile.designation, region: cycle.staffProfile.region, branch: cycle.staffProfile.branch, status: cycle.status, overallPct: scoreResult.overallPct, overallBand: scoreResult.overallBand ? scoreResult.overallBand.label : null, outcome: scoreResult.outcome.outcome });
    }
    const flagged = results.filter((r) => r.overallPct !== null && r.overallPct < 0.5);
    const avgPct = results.filter((r) => r.overallPct !== null).reduce((s, r) => s + r.overallPct, 0) / (results.filter((r) => r.overallPct !== null).length || 1);
    res.json({ count: results.length, averageScorePct: avgPct, flaggedBelowExpectation: flagged, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to build aggregate report" });
  }
});

module.exports = router;
