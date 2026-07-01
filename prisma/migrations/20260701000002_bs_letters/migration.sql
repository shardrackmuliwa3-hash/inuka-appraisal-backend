-- BS Letter Management System
-- Template library, issued letters with digital signatures, and audit log

CREATE TABLE "BSLetterTemplate" (
  "id"                TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "band"              TEXT NOT NULL,       -- E.P | G.P | A.P | W.P | U.P
  "letterType"        TEXT NOT NULL,       -- APPRECIATION | COMMENDATION | NORMAL_FEEDBACK | CAUTION | FIRST_WARNING | FINAL_WARNING | PIP_PLACEMENT
  "title"             TEXT NOT NULL,       -- e.g. "1st Written Warning Letter"
  "subject"           TEXT NOT NULL,       -- letter subject line
  "refPrefix"         TEXT NOT NULL DEFAULT 'HR/E-017', -- reference number prefix
  "openingParagraph"  TEXT NOT NULL,       -- first paragraph before the tables
  "performanceInsights" TEXT NOT NULL,     -- paragraph after the tables explaining the numbers
  "mainBody"          TEXT NOT NULL,       -- main content: verdict language, expectations
  "immediateActions"  TEXT NOT NULL,       -- JSON array of bullet point strings
  "closingParagraph"  TEXT NOT NULL,       -- closing before signature
  "copyTo"            TEXT NOT NULL DEFAULT '["Chief Operations Officer (COO), Inuka Africa","HR Section, Inuka Africa","Personal File"]',
  "isActive"          BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder"         INTEGER NOT NULL DEFAULT 0,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BSLetterTemplate_band_idx" ON "BSLetterTemplate"("band", "isActive");

-- Issued letters — one per cycle per issuance (can re-issue with different template)
CREATE TABLE "BSIssuedLetter" (
  "id"                TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "cycleId"           TEXT NOT NULL,
  "templateId"        TEXT NOT NULL,
  "templateTitle"     TEXT NOT NULL,        -- snapshot of template title at issue time
  "band"              TEXT NOT NULL,
  "letterType"        TEXT NOT NULL,
  "refNumber"         TEXT NOT NULL,        -- e.g. HR/E-017(31-90)06/26
  "subject"           TEXT NOT NULL,
  -- Merged letter body (snapshot at time of issue — template edits won't affect this)
  "mergedOpeningParagraph"    TEXT NOT NULL,
  "mergedPerformanceInsights" TEXT NOT NULL,
  "mergedMainBody"    TEXT NOT NULL,
  "mergedImmediateActions"    TEXT NOT NULL,  -- JSON array
  "mergedClosingParagraph"    TEXT NOT NULL,
  "copyTo"            TEXT NOT NULL,
  -- Status
  "status"            TEXT NOT NULL DEFAULT 'DRAFT',
  -- DRAFT → ISSUED → RM_SIGNED → COO_SIGNED → HRM_SIGNED → BS_ACKNOWLEDGED → SEALED
  "issuedAt"          TIMESTAMP(3),
  "issuedByUserId"    TEXT,
  "issuedByName"      TEXT,
  "sealedAt"          TIMESTAMP(3),
  -- RM signature
  "rmSignature"       TEXT,   -- base64 PNG data URL
  "rmSignedAt"        TIMESTAMP(3),
  "rmSignerName"      TEXT,
  "rmSignerTitle"     TEXT,
  -- COO signature
  "cooSignature"      TEXT,
  "cooSignedAt"       TIMESTAMP(3),
  "cooSignerName"     TEXT,
  -- HRM signature
  "hrmSignature"      TEXT,
  "hrmSignedAt"       TIMESTAMP(3),
  "hrmSignerName"     TEXT,
  -- BS acknowledgment
  "bsSignature"       TEXT,
  "bsSignedAt"        TIMESTAMP(3),
  "bsSignerName"      TEXT,
  "bsComments"        TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BSIssuedLetter_cycleId_idx" ON "BSIssuedLetter"("cycleId");
CREATE INDEX "BSIssuedLetter_status_idx" ON "BSIssuedLetter"("status");

-- Proof-of-issuance audit log — permanent, append-only
CREATE TABLE "BSLetterAuditLog" (
  "id"              TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "issuedLetterId"  TEXT,
  "cycleId"         TEXT,
  "userId"          TEXT NOT NULL,
  "userEmail"       TEXT NOT NULL,
  "userName"        TEXT NOT NULL,
  "userRole"        TEXT NOT NULL,
  "action"          TEXT NOT NULL,
  -- TEMPLATE_CREATED | TEMPLATE_EDITED | LETTER_ISSUED | RM_SIGNED | COO_SIGNED
  -- HRM_SIGNED | BS_ACKNOWLEDGED | LETTER_VIEWED | LETTER_PRINTED | LETTER_SEALED | LETTER_REISSUED
  "details"         TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BSLetterAuditLog_issuedLetterId_idx" ON "BSLetterAuditLog"("issuedLetterId");
CREATE INDEX "BSLetterAuditLog_cycleId_idx" ON "BSLetterAuditLog"("cycleId");
CREATE INDEX "BSLetterAuditLog_action_idx" ON "BSLetterAuditLog"("action");
