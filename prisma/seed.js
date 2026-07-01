const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Inuka Appraisal System...");

  // ---------- Users ----------
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "hr.admin@inukaafrica.com" },
    update: {},
    create: {
      email: "hr.admin@inukaafrica.com",
      passwordHash,
      fullName: "Shardrack Muliwa",
      role: "SUPER_ADMIN",
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: "hqca@inukaafrica.com" },
    update: {},
    create: {
      email: "hqca@inukaafrica.com",
      passwordHash,
      fullName: "Head, Credit Analysis (HQCA)",
      role: "APPRAISER",
    },
  });

  const coo = await prisma.user.upsert({
    where: { email: "coo@inukaafrica.com" },
    update: {},
    create: {
      email: "coo@inukaafrica.com",
      passwordHash,
      fullName: "Chief Operating Officer",
      role: "APPRAISER",
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "martha.kiiti@inukaafrica.com" },
    update: {},
    create: {
      email: "martha.kiiti@inukaafrica.com",
      passwordHash,
      fullName: "Martha Ndanu Kiiti",
      role: "APPRAISEE",
    },
  });

  // ---------- Staff profile ----------
  const staff = await prisma.staffProfile.upsert({
    where: { staffId: "IA/1487" },
    update: {},
    create: {
      staffId: "IA/1487",
      userId: staffUser.id,
      fullName: "Martha Ndanu Kiiti",
      designation: "Regional Credit Analyst",
      department: "Credit & Risk",
      region: "Transzoia Region",
      reportingTo: "Head of Credit / COO",
      dateOfJoining: new Date("2022-03-01"),
      employmentType: "Probationary Review",
      basicPay: 22231,
      allowances: 6000,
      jobRoleKey: "REGIONAL_CREDIT_ANALYST_PROBATION",
      cycleFrequencyMonths: 6,
    },
  });

  // Flexible rater assignments — 2 raters configured for this role (Supervisor + COO),
  // demonstrating the system supports N raters per staff/role.
  await prisma.raterAssignment.createMany({
    data: [
      { staffProfileId: staff.id, raterUserId: supervisor.id, raterRole: "SUPERVISOR", label: "HQCA" },
      { staffProfileId: staff.id, raterUserId: coo.id, raterRole: "THIRD_RATER", label: "COO" },
    ],
    skipDuplicates: true,
  });

  // ---------- Template: Regional Credit Analyst — Probationary Appraisal ----------
  const existing = await prisma.appraisalTemplate.findFirst({
    where: { jobRoleKey: "REGIONAL_CREDIT_ANALYST_PROBATION", isActive: true },
  });

  if (!existing) {
    await prisma.appraisalTemplate.create({
      data: {
        jobRoleKey: "REGIONAL_CREDIT_ANALYST_PROBATION",
        title: "Regional Credit Analyst — Probationary Performance Appraisal",
        sectionAWeight: 15,
        sectionBWeight: 85,
        competencyGroups: {
          create: [
            {
              code: "A1",
              title: "Professional Conduct & Work Ethic",
              orderIndex: 0,
              criteria: {
                create: [
                  { title: "Works to Full Potential", behaviouralAnchor: "Maximises output daily; volunteers for added responsibility; no supervisory chasing required.", orderIndex: 0 },
                  { title: "Discipline & Punctuality", behaviouralAnchor: "Present, prepared, and accountable; zero unexplained lateness or absences in review period.", orderIndex: 1 },
                  { title: "Ethics, Integrity & Honesty", behaviouralAnchor: "Zero tolerance for fraud or manipulation; transparent credit decisions; acts in client interest.", orderIndex: 2 },
                  { title: "Accountability & Ownership", behaviouralAnchor: "Owns outcomes—successes and failures—without deflection; escalates early when needed.", orderIndex: 3 },
                  { title: "Professionalism", behaviouralAnchor: "Projects Inuka's institutional brand; written and verbal communication meets corporate standard.", orderIndex: 4 },
                  { title: "Time Management", behaviouralAnchor: "Independently manages competing priorities across 71 branches; rarely misses deadlines.", orderIndex: 5 },
                  { title: "Initiative & Self-Motivation", behaviouralAnchor: "Identifies and acts on opportunities without being directed; self-starting in problem resolution.", orderIndex: 6 },
                ],
              },
            },
            {
              code: "A2",
              title: "Collaboration, Communication & Leadership",
              orderIndex: 1,
              criteria: {
                create: [
                  { title: "Coworker Relations & Teamwork", behaviouralAnchor: "Actively supports peers; shares intelligence; no silo behaviour observed.", orderIndex: 0 },
                  { title: "Written Communication Quality", behaviouralAnchor: "Credit reports, memos, and correspondence are clear, concise, and error-free.", orderIndex: 1 },
                  { title: "Verbal Communication & Briefing", behaviouralAnchor: "Delivers branch briefings and management updates with clarity and confidence.", orderIndex: 2 },
                  { title: "Leading with Dignity & Respect", behaviouralAnchor: "Gives feedback constructively; treats all cadres—LOs to HODs—with equal respect.", orderIndex: 3 },
                  { title: "Coaching & Mentoring", behaviouralAnchor: "Demonstrably transfers skills to Loan Officers and junior analysts; tracks their development.", orderIndex: 4 },
                  { title: "Adaptability & Resilience", behaviouralAnchor: "Adjusts approach calmly when policy, product, or environment changes under pressure.", orderIndex: 5 },
                  { title: "Driving Initiative in Projects", behaviouralAnchor: "Champions process improvements; moves team projects forward without micro-management.", orderIndex: 6 },
                ],
              },
            },
            {
              code: "A3",
              title: "Credit-Specific Technical Competencies",
              orderIndex: 2,
              criteria: {
                create: [
                  { title: "Credit Analysis Quality", behaviouralAnchor: "Thorough financial analysis; identifies hidden risks; conclusions are well-supported.", orderIndex: 0 },
                  { title: "Work Consistency & Accuracy", behaviouralAnchor: "Error-free loan files across audit cycles; low rework rate across all branches supervised.", orderIndex: 1 },
                  { title: "Risk Identification & Mitigation", behaviouralAnchor: "Early warning signals flagged proactively; policy exceptions documented and escalated.", orderIndex: 2 },
                  { title: "Alignment to Credit Policy", behaviouralAnchor: "All approval decisions traceable to Inuka's credit policy framework; no undocumented deviations.", orderIndex: 3 },
                  { title: "Problem-Solving & Root Cause", behaviouralAnchor: "Diagnoses credit issues at branch level; implements corrective action with measurable impact.", orderIndex: 4 },
                  { title: "Loan File & Documentation Rigour", behaviouralAnchor: "Files are complete, accurately structured, and pass audit on first review.", orderIndex: 5 },
                  { title: "Regulatory & KYC Awareness", behaviouralAnchor: "Demonstrates up-to-date knowledge of CBK directives, AML obligations, and KYC requirements.", orderIndex: 6 },
                  { title: "Data Literacy & Reporting", behaviouralAnchor: "Accurately interprets portfolio dashboards, PAR trends, and disbursement analytics.", orderIndex: 7 },
                ],
              },
            },
          ],
        },
        kpiGroups: {
          create: [
            {
              code: "B1",
              title: "Portfolio Quality & Risk Management",
              orderIndex: 0,
              kpis: {
                create: [
                  { title: "Portfolio at Risk (PAR 30)", measurementFormula: "(Portfolio overdue >30 days ÷ Total outstanding portfolio) × 100", targetLabel: "< 10%", weightPct: 0.15, higherIsBetter: false, orderIndex: 0 },
                  { title: "Non-Performing Loan (NPL) Rate", measurementFormula: "(Total NPLs ÷ Total Gross Loans outstanding) × 100", targetLabel: "< 5%", weightPct: 0.10, higherIsBetter: false, orderIndex: 1 },
                  { title: "Loan Loss Provision Coverage", measurementFormula: "(Provisions held ÷ Total NPLs) × 100", targetLabel: "≥ 80%", weightPct: 0.05, higherIsBetter: true, orderIndex: 2 },
                ],
              },
            },
            {
              code: "B2",
              title: "Credit Processing & Turnaround Time",
              orderIndex: 1,
              kpis: {
                create: [
                  { title: "Loan Processing TAT Compliance", measurementFormula: "% of new loan applications communicated to branches within 24 hours of receipt at HQCA", targetLabel: "≥ 95%", weightPct: 0.10, higherIsBetter: true, orderIndex: 0 },
                  { title: "Repeat Loan TAT Compliance", measurementFormula: "% of repeat borrowers funded within 12 hours of eligibility confirmation", targetLabel: "≥ 95%", weightPct: 0.08, higherIsBetter: true, orderIndex: 1 },
                  { title: "Documentation Accuracy Rate", measurementFormula: "(Accurate & complete files ÷ Total files audited) × 100", targetLabel: "≥ 95%", weightPct: 0.07, higherIsBetter: true, orderIndex: 2 },
                ],
              },
            },
            {
              code: "B3",
              title: "KYC & Regulatory Compliance",
              orderIndex: 2,
              kpis: {
                create: [
                  { title: "KYC Compliance Rate", measurementFormula: "(Fully KYC-compliant applications ÷ Total applications processed) × 100", targetLabel: "100%", weightPct: 0.08, higherIsBetter: true, orderIndex: 0 },
                  { title: "Policy Exception Rate", measurementFormula: "% of approved loans carrying a documented policy exception or deviation", targetLabel: "< 3%", weightPct: 0.05, higherIsBetter: false, orderIndex: 1 },
                  { title: "Loan Acceptance Rate (Quality-Controlled)", measurementFormula: "Approval rate maintained simultaneously with PAR 30 constraint < 10%", targetLabel: "≥ 62%", weightPct: 0.05, higherIsBetter: true, orderIndex: 2 },
                ],
              },
            },
            {
              code: "B4",
              title: "Business Growth & Conversion",
              orderIndex: 3,
              kpis: {
                create: [
                  { title: "Repeat Loan Rate", measurementFormula: "(No. of repeat loans disbursed ÷ Total eligible active clients) × 100", targetLabel: "≥ 50%", weightPct: 0.07, higherIsBetter: true, orderIndex: 0 },
                  { title: "Lead Conversion Rate", measurementFormula: "(No. of loans disbursed ÷ Qualified leads submitted by branches) × 100", targetLabel: "≥ 50%", weightPct: 0.05, higherIsBetter: true, orderIndex: 1 },
                  { title: "Active Client Base Growth", measurementFormula: "Net % increase in active borrower count versus prior equivalent period", targetLabel: "≥ 20% annualised", weightPct: 0.05, higherIsBetter: true, orderIndex: 2 },
                ],
              },
            },
            {
              code: "B5",
              title: "Customer Experience & Satisfaction",
              orderIndex: 4,
              kpis: {
                create: [
                  { title: "Customer Satisfaction Score (CSAT)", measurementFormula: "Average CSAT score from exit / periodic branch surveys (scale 1–10)", targetLabel: "≥ 8.5 / 10", weightPct: 0.04, higherIsBetter: true, orderIndex: 0 },
                  { title: "Net Promoter Score (NPS)", measurementFormula: "NPS derived from periodic borrower surveys", targetLabel: "≥ +70", weightPct: 0.03, higherIsBetter: true, orderIndex: 1 },
                  { title: "Complaint Resolution Rate", measurementFormula: "% of customer complaints resolved within 48-hour SLA", targetLabel: "≥ 95%", weightPct: 0.03, higherIsBetter: true, orderIndex: 2 },
                ],
              },
            },
            {
              code: "B6",
              title: "Operational Governance & Reporting",
              orderIndex: 5,
              kpis: {
                create: [
                  { title: "Credit Report Timeliness", measurementFormula: "% of mandatory weekly/monthly credit reports submitted on or before deadline", targetLabel: "100%", weightPct: 0.03, higherIsBetter: true, orderIndex: 0 },
                  { title: "Audit Finding Resolution Rate", measurementFormula: "(Findings resolved within agreed SLA ÷ Total findings raised) × 100", targetLabel: "≥ 90%", weightPct: 0.02, higherIsBetter: true, orderIndex: 1 },
                  { title: "Branch Compliance Visit Completion", measurementFormula: "% of planned branch credit compliance visits completed", targetLabel: "≥ 90%", weightPct: 0.03, higherIsBetter: true, orderIndex: 2 },
                ],
              },
            },
          ],
        },
      },
    });
    console.log("Created Regional Credit Analyst Probationary template.");
  }

  console.log("Seed complete.");
  console.log("Login credentials (password for all: ChangeMe123!):");
  console.log("  Super Admin: hr.admin@inukaafrica.com");
  console.log("  Appraiser (HQCA): hqca@inukaafrica.com");
  console.log("  Appraiser (COO): coo@inukaafrica.com");
  console.log("  Appraisee: martha.kiiti@inukaafrica.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
