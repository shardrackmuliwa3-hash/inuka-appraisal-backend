-- Add Branch Supervisor and Regional Manager roles
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'BRANCH_SUPERVISOR';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'REGIONAL_MANAGER';

-- Link tables: connect User accounts to BS staff IDs / RM names
CREATE TABLE IF NOT EXISTS "BSUserLink" (
  "userId"  TEXT NOT NULL PRIMARY KEY,
  "staffId" TEXT NOT NULL,
  UNIQUE ("staffId")
);

CREATE TABLE IF NOT EXISTS "RMUserLink" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "rmName" TEXT NOT NULL,
  "region" TEXT
);
