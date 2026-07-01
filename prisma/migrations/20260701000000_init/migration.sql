-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'APPRAISER', 'APPRAISEE');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'AWAITING_SIGNOFF', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RaterRole" AS ENUM ('SELF', 'SUPERVISOR', 'SECOND_RATER', 'THIRD_RATER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NarrativeSection" AS ENUM ('C1_STRENGTHS', 'C2_IMPROVEMENT_AREAS', 'C3_DEVELOPMENT_PLAN', 'C4_TRAINING_NEEDS', 'C5_CAREER_ASPIRATIONS', 'C6_OUTCOME_RECOMMENDATION');

-- CreateEnum
CREATE TYPE "SignOffParty" AS ENUM ('APPRAISEE', 'SUPERVISOR', 'HR', 'APPROVING_AUTHORITY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "fullName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "department" TEXT,
    "region" TEXT,
    "branch" TEXT,
    "reportingTo" TEXT,
    "dateOfJoining" TIMESTAMP(3) NOT NULL,
    "employmentType" TEXT,
    "basicPay" DOUBLE PRECISION,
    "allowances" DOUBLE PRECISION,
    "jobRoleKey" TEXT NOT NULL,
    "cycleFrequencyMonths" INTEGER NOT NULL DEFAULT 6,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalTemplate" (
    "id" TEXT NOT NULL,
    "jobRoleKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sectionAWeight" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "sectionBWeight" DOUBLE PRECISION NOT NULL DEFAULT 85,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppraisalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyGroup" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CompetencyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyCriterion" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "behaviouralAnchor" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CompetencyCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiGroup" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "KpiGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiDefinition" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "measurementFormula" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "weightPct" DOUBLE PRECISION NOT NULL,
    "higherIsBetter" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "KpiDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaterAssignment" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "raterUserId" TEXT NOT NULL,
    "raterRole" "RaterRole" NOT NULL DEFAULT 'SUPERVISOR',
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RaterAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalCycle" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dateOfAssessment" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "status" "CycleStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppraisalCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "raterUserId" TEXT NOT NULL,
    "raterRole" "RaterRole" NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiActual" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "actualValue" DOUBLE PRECISION,
    "targetValue" DOUBLE PRECISION,
    "achievementPct" DOUBLE PRECISION,
    "weightedScore" DOUBLE PRECISION,
    "enteredByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KpiActual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NarrativeResponse" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "section" "NarrativeSection" NOT NULL,
    "content" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NarrativeResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignOff" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "party" "SignOffParty" NOT NULL,
    "userId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "SignOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "StaffProfile_staffId_key" ON "StaffProfile"("staffId");
CREATE UNIQUE INDEX "StaffProfile_userId_key" ON "StaffProfile"("userId");
CREATE INDEX "AppraisalTemplate_jobRoleKey_isActive_idx" ON "AppraisalTemplate"("jobRoleKey", "isActive");
CREATE INDEX "AppraisalCycle_staffProfileId_idx" ON "AppraisalCycle"("staffProfileId");
CREATE INDEX "AppraisalCycle_status_idx" ON "AppraisalCycle"("status");
CREATE UNIQUE INDEX "Rating_cycleId_criterionId_raterUserId_key" ON "Rating"("cycleId", "criterionId", "raterUserId");
CREATE UNIQUE INDEX "KpiActual_cycleId_kpiId_key" ON "KpiActual"("cycleId", "kpiId");
CREATE UNIQUE INDEX "NarrativeResponse_cycleId_section_authorUserId_key" ON "NarrativeResponse"("cycleId", "section", "authorUserId");
CREATE UNIQUE INDEX "SignOff_cycleId_party_key" ON "SignOff"("cycleId", "party");

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CompetencyGroup" ADD CONSTRAINT "CompetencyGroup_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AppraisalTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyCriterion" ADD CONSTRAINT "CompetencyCriterion_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CompetencyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KpiGroup" ADD CONSTRAINT "KpiGroup_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AppraisalTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KpiDefinition" ADD CONSTRAINT "KpiDefinition_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "KpiGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RaterAssignment" ADD CONSTRAINT "RaterAssignment_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppraisalCycle" ADD CONSTRAINT "AppraisalCycle_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AppraisalCycle" ADD CONSTRAINT "AppraisalCycle_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AppraisalTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "CompetencyCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_raterUserId_fkey" FOREIGN KEY ("raterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KpiActual" ADD CONSTRAINT "KpiActual_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KpiActual" ADD CONSTRAINT "KpiActual_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "KpiDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NarrativeResponse" ADD CONSTRAINT "NarrativeResponse_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NarrativeResponse" ADD CONSTRAINT "NarrativeResponse_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SignOff" ADD CONSTRAINT "SignOff_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignOff" ADD CONSTRAINT "SignOff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
