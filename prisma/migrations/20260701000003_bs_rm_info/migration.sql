-- Stores RM Name & RM Title per Branch Supervisor (populated from Excel upload)
CREATE TABLE IF NOT EXISTS "BSRMInfo" (
  "id"        TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "staffId"   TEXT NOT NULL,
  "branch"    TEXT NOT NULL,
  "rmName"    TEXT,
  "rmTitle"   TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("staffId")
);
CREATE INDEX IF NOT EXISTS "BSRMInfo_branch_idx" ON "BSRMInfo"("branch");
