const express = require("express");
const prisma = require("../utils/prisma");
const { authRequired, requireRole } = require("../middleware/auth");
const { computeCycleScore } = require("../utils/scoring");

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

async function getCycleWithRelations(cycleId) {
  return prisma.appraisalCycle.findUnique({
    where: { id: cycleId },
    include: {
      staffProfile: { include: { user: true, raterAssignments: true } },
      template: true,
      ratings: true,
      kpiActuals: true,
      narratives: true,
      signoffs: true,
    },
  });
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ---------- CREATE CYCLE (Super Admin) ----------
router.post("/", requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { staffProfileId, templateId, assessmentType, periodStart, periodEnd } = req.body;
    const staff = await prisma.staffProfile.findUnique({ where: { id: staffProfileId } });
    if (!staff) return res.status(404).json({ error: "Staff profile not found" });

    const nextReviewDate = addMonths(periodEnd || staff.dateOfJoining, staff.cycleFrequencyMonths);

    const cycle = await prisma.appraisalCycle.create({
      data: {
        staffProfileId,
        templateId,
        assessmentType: assessmentType || "Periodic Review",
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        nextReviewDate,
        status: "IN_PROGRESS",
      },
    });

    await prisma.auditLog.create({
      data: { cycleId: cycle.id, userId: req.user.id, action: "CYCLE_CREATED", details: JSON.stringify({ staffProfileId, templateId }) },
    });

    res.status(201).json(cycle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create appraisal cycle" });
  }
});

// ---------- LIST CYCLES (scoped by role) ----------
router.get("/", async (req, res) => {
  let where = {};
  if (req.user.role === "APPRAISEE") {
    where = { staffProfileId: req.user.staffProfileId };
  } else if (req.user.role === "APPRAISER") {
    const assignments = await prisma.raterAssignment.findMany({ where: { raterUserId: req.user.id } });
    const staffIds = assignments.map((a) => a.staffProfileId);
    where = { staffProfileId: { in: staffIds } };
  }
  // SUPER_ADMIN sees all (where stays {})

  const cycles = await prisma.appraisalCycle.findMany({
    where,
    include: { staffProfile: true, template: { select: { title: true, jobRoleKey: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(cycles);
});

// ---------- GET ONE CYCLE WITH LIVE COMPUTED SCORE ----------
router.get("/:id", async (req, res) => {
  const cycle = await getCycleWithRelations(req.params.id);
  if (!cycle) return res.status(404).json({ error: "Cycle not found" });

  const fullTemplate = await loadFullTemplate(cycle.templateId);
  const scoreResult = computeCycleScore({
    template: fullTemplate,
    ratings: cycle.ratings,
    kpiActuals: cycle.kpiActuals,
  });

  res.json({ ...cycle, template: fullTemplate, computedScore: scoreResult });
});

// ---------- SUBMIT/UPDATE RATINGS (Appraiser or Appraisee self-rating) ----------
router.post("/:id/ratings", requireRole("APPRAISER", "APPRAISEE"), async (req, res) => {
  try {
    const { ratings, raterRole } = req.body; // ratings: [{criterionId, score, comment}]
    const cycleId = req.params.id;

    const ops = ratings.map((r) =>
      prisma.rating.upsert({
        where: { cycleId_criterionId_raterUserId: { cycleId, criterionId: r.criterionId, raterUserId: req.user.id } },
        update: { score: r.score, comment: r.comment || null },
        create: {
          cycleId,
          criterionId: r.criterionId,
          raterUserId: req.user.id,
          raterRole: raterRole || (req.user.role === "APPRAISEE" ? "SELF" : "SUPERVISOR"),
          score: r.score,
          comment: r.comment || null,
        },
      })
    );
    await prisma.$transaction(ops);
    await prisma.auditLog.create({ data: { cycleId, userId: req.user.id, action: "RATINGS_SUBMITTED" } });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit ratings" });
  }
});

// ---------- SUBMIT/UPDATE KPI ACTUALS (Appraiser typically; could be Appraisee-entered then verified) ----------
router.post("/:id/kpi-actuals", requireRole("APPRAISER", "SUPER_ADMIN"), async (req, res) => {
  try {
    const { actuals } = req.body; // [{kpiId, actualValue, targetValue}]
    const cycleId = req.params.id;

    const ops = actuals.map((a) =>
      prisma.kpiActual.upsert({
        where: { cycleId_kpiId: { cycleId, kpiId: a.kpiId } },
        update: { actualValue: a.actualValue, targetValue: a.targetValue, enteredByUserId: req.user.id },
        create: { cycleId, kpiId: a.kpiId, actualValue: a.actualValue, targetValue: a.targetValue, enteredByUserId: req.user.id },
      })
    );
    await prisma.$transaction(ops);
    await prisma.auditLog.create({ data: { cycleId, userId: req.user.id, action: "KPI_ACTUALS_SUBMITTED" } });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit KPI actuals" });
  }
});

// ---------- NARRATIVE SECTIONS (C1-C6) ----------
router.post("/:id/narratives", async (req, res) => {
  try {
    const { section, content } = req.body;
    const cycleId = req.params.id;
    const narrative = await prisma.narrativeResponse.upsert({
      where: { cycleId_section_authorUserId: { cycleId, section, authorUserId: req.user.id } },
      update: { content },
      create: { cycleId, section, content, authorUserId: req.user.id },
    });
    res.json(narrative);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save narrative" });
  }
});

// ---------- SIGN-OFF ----------
router.post("/:id/signoff", async (req, res) => {
  try {
    const { party, notes } = req.body; // APPRAISEE | SUPERVISOR | HR | APPROVING_AUTHORITY
    const cycleId = req.params.id;

    const signoff = await prisma.signOff.upsert({
      where: { cycleId_party: { cycleId, party } },
      update: { userId: req.user.id, notes, signedAt: new Date() },
      create: { cycleId, party, userId: req.user.id, notes },
    });

    // If appraisee + at least one supervisor-type signoff exist, move to AWAITING_SIGNOFF/COMPLETED
    const allSignoffs = await prisma.signOff.findMany({ where: { cycleId } });
    const hasAppraisee = allSignoffs.some((s) => s.party === "APPRAISEE");
    const hasSupervisor = allSignoffs.some((s) => s.party === "SUPERVISOR");
    const hasHR = allSignoffs.some((s) => s.party === "HR");

    let status;
    if (hasAppraisee && hasSupervisor && hasHR) status = "COMPLETED";
    else if (hasAppraisee || hasSupervisor) status = "AWAITING_SIGNOFF";
    if (status) {
      await prisma.appraisalCycle.update({ where: { id: cycleId }, data: { status } });
    }

    await prisma.auditLog.create({ data: { cycleId, userId: req.user.id, action: "SIGNOFF", details: party } });

    res.json(signoff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record sign-off" });
  }
});

module.exports = router;
