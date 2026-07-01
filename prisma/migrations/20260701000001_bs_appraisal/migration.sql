-- Branch Supervisor Performance Appraisal Tables
-- Purely numerical: budget vs actual for disbursement & collection

CREATE TYPE "BSCycleStatus" AS ENUM ('DRAFT', 'RM_SUBMITTED', 'COO_REVIEWED', 'HRM_APPROVED', 'COMPLETED', 'CANCELLED');

CREATE TYPE "BSReviewPeriod" AS ENUM (
  'MONTHLY', 'Q1', 'Q2', 'Q3', 'Q4',
  'H1', 'H2', 'ANNUAL', 'PROBATIONARY'
);

CREATE TABLE "BSBranchBudget" (
  "id"          TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "branchName"  TEXT NOT NULL,
  "year"        INTEGER NOT NULL DEFAULT 2026,
  "disbursement" JSONB NOT NULL DEFAULT '{}',
  "collection"   JSONB NOT NULL DEFAULT '{}',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("branchName", "year")
);

CREATE TABLE "BSAppraisalCycle" (
  "id"             TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "staffId"        TEXT NOT NULL,
  "staffName"      TEXT NOT NULL,
  "designation"    TEXT NOT NULL DEFAULT 'Branch Supervisor',
  "branch"         TEXT NOT NULL,
  "region"         TEXT NOT NULL,
  "reviewPeriod"   "BSReviewPeriod" NOT NULL,
  "year"           INTEGER NOT NULL DEFAULT 2026,
  "periodLabel"    TEXT NOT NULL,
  "periodStart"    TEXT NOT NULL,
  "periodEnd"      TEXT NOT NULL,
  "status"         "BSCycleStatus" NOT NULL DEFAULT 'DRAFT',
  "disbBudget"     JSONB NOT NULL DEFAULT '{}',
  "disbActual"     JSONB NOT NULL DEFAULT '{}',
  "collBudget"     JSONB NOT NULL DEFAULT '{}',
  "collActual"     JSONB NOT NULL DEFAULT '{}',
  "rmName"         TEXT,
  "rmTitle"        TEXT,
  "rmComments"     TEXT,
  "rmSignedAt"     TIMESTAMP(3),
  "cooComments"    TEXT,
  "cooSignedAt"    TIMESTAMP(3),
  "hrmComments"    TEXT,
  "hrmSignedAt"    TIMESTAMP(3),
  "bsAcknowledged" BOOLEAN NOT NULL DEFAULT FALSE,
  "bsAcknowledgedAt" TIMESTAMP(3),
  "immediateActions" TEXT,
  "createdByUserId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BSAppraisalCycle_staffId_idx" ON "BSAppraisalCycle"("staffId");
CREATE INDEX "BSAppraisalCycle_branch_idx" ON "BSAppraisalCycle"("branch");
CREATE INDEX "BSAppraisalCycle_status_idx" ON "BSAppraisalCycle"("status");
CREATE INDEX "BSAppraisalCycle_region_idx" ON "BSAppraisalCycle"("region");
