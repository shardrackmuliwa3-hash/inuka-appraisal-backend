const express = require("express");
const prisma = require("../utils/prisma");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

// Anyone authenticated can read templates (needed to render forms);
// only Super Admin can write.
router.use(authRequired);

router.get("/", async (req, res) => {
  const templates = await prisma.appraisalTemplate.findMany({
    where: req.query.activeOnly === "true" ? { isActive: true } : {},
    orderBy: [{ jobRoleKey: "asc" }, { version: "desc" }],
  });
  res.json(templates);
});

router.get("/:id", async (req, res) => {
  const template = await prisma.appraisalTemplate.findUnique({
    where: { id: req.params.id },
    include: {
      competencyGroups: { include: { criteria: { orderBy: { orderIndex: "asc" } } }, orderBy: { orderIndex: "asc" } },
      kpiGroups: { include: { kpis: { orderBy: { orderIndex: "asc" } } }, orderBy: { orderIndex: "asc" } },
    },
  });
  if (!template) return res.status(404).json({ error: "Template not found" });
  res.json(template);
});

router.use(requireRole("SUPER_ADMIN"));

// Create a full template in one payload (groups + criteria + kpi groups + kpis nested)
router.post("/", async (req, res) => {
  try {
    const { jobRoleKey, title, sectionAWeight, sectionBWeight, competencyGroups, kpiGroups } = req.body;

    const template = await prisma.appraisalTemplate.create({
      data: {
        jobRoleKey,
        title,
        sectionAWeight: sectionAWeight ?? 15,
        sectionBWeight: sectionBWeight ?? 85,
        competencyGroups: {
          create: (competencyGroups || []).map((g, gi) => ({
            code: g.code,
            title: g.title,
            orderIndex: gi,
            criteria: {
              create: (g.criteria || []).map((c, ci) => ({
                title: c.title,
                behaviouralAnchor: c.behaviouralAnchor || "",
                orderIndex: ci,
              })),
            },
          })),
        },
        kpiGroups: {
          create: (kpiGroups || []).map((g, gi) => ({
            code: g.code,
            title: g.title,
            orderIndex: gi,
            kpis: {
              create: (g.kpis || []).map((k, ki) => ({
                title: k.title,
                measurementFormula: k.measurementFormula || "",
                targetLabel: k.targetLabel || "",
                weightPct: k.weightPct,
                higherIsBetter: k.higherIsBetter ?? true,
                orderIndex: ki,
              })),
            },
          })),
        },
      },
      include: {
        competencyGroups: { include: { criteria: true } },
        kpiGroups: { include: { kpis: true } },
      },
    });
    res.status(201).json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// Deactivate / activate, or bump version by cloning
router.patch("/:id", async (req, res) => {
  const { title, isActive, sectionAWeight, sectionBWeight } = req.body;
  const template = await prisma.appraisalTemplate.update({
    where: { id: req.params.id },
    data: { title, isActive, sectionAWeight, sectionBWeight },
  });
  res.json(template);
});

router.delete("/:id", async (req, res) => {
  // Soft delete via isActive=false is preferred; hard delete only if no cycles reference it.
  const cyclesCount = await prisma.appraisalCycle.count({ where: { templateId: req.params.id } });
  if (cyclesCount > 0) {
    return res.status(409).json({ error: "Template has appraisal cycles; deactivate instead of deleting." });
  }
  await prisma.appraisalTemplate.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

module.exports = router;
