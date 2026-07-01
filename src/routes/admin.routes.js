const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(authRequired, requireRole("SUPER_ADMIN"));

// ---- Create a user (Appraiser or Appraisee or another Super Admin) ----
router.post("/users", async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: "email, password, fullName, role are required" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase().trim(), passwordHash, fullName, role },
    });
    res.status(201).json({ id: user.id, email: user.email, role: user.role, fullName: user.fullName });
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Email already in use" });
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

router.delete("/users/:id", async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    if (err.code === "P2003") {
      // Has related records — soft delete instead
      await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
      return res.json({ deactivated: true, message: "User has appraisal records — deactivated instead of deleted." });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

  const { isActive, fullName, role } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive, fullName, role },
  });
  res.json(user);
});

// ---- Staff profiles ----
router.post("/staff", async (req, res) => {
  try {
    const {
      userId, staffId, fullName, designation, department, region, branch,
      reportingTo, dateOfJoining, employmentType, basicPay, allowances,
      jobRoleKey, cycleFrequencyMonths,
    } = req.body;

    const staff = await prisma.staffProfile.create({
      data: {
        userId, staffId, fullName, designation, department, region, branch,
        reportingTo, dateOfJoining: new Date(dateOfJoining), employmentType,
        basicPay, allowances, jobRoleKey,
        cycleFrequencyMonths: cycleFrequencyMonths || 6,
      },
    });
    res.status(201).json(staff);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Staff ID or user already linked to a profile" });
    console.error(err);
    res.status(500).json({ error: "Failed to create staff profile" });
  }
});

router.get("/staff", async (req, res) => {
  const staff = await prisma.staffProfile.findMany({
    include: { user: { select: { email: true, isActive: true } }, raterAssignments: true },
    orderBy: { staffId: "asc" },
  });
  res.json(staff);
});

router.patch("/staff/:id", async (req, res) => {
  const staff = await prisma.staffProfile.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(staff);
});

// ---- Rater assignments (flexible N raters per staff) ----
router.post("/staff/:staffProfileId/raters", async (req, res) => {
  const { raterUserId, raterRole, label } = req.body;
  const assignment = await prisma.raterAssignment.create({
    data: { staffProfileId: req.params.staffProfileId, raterUserId, raterRole, label },
  });
  res.status(201).json(assignment);
});

router.delete("/raters/:id", async (req, res) => {
  await prisma.raterAssignment.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

module.exports = router;
