/*
  Warnings:

  - The values [REVIEWING] on the enum `ApplicantStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `value_upload` on the `FieldValueResponses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[share_token]` on the table `Form` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `snapshot_version` to the `FormResponses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApplicantStatus_new" AS ENUM ('SUBMITTED', 'CHECKED', 'REJECTED', 'ASSIGNED', 'REVIEWED', 'INTERVIEWING', 'FAILED', 'PASSED');
ALTER TABLE "FormResponses" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "FormResponses" ALTER COLUMN "status" TYPE "ApplicantStatus_new" USING ("status"::text::"ApplicantStatus_new");
ALTER TYPE "ApplicantStatus" RENAME TO "ApplicantStatus_old";
ALTER TYPE "ApplicantStatus_new" RENAME TO "ApplicantStatus";
DROP TYPE "ApplicantStatus_old";
ALTER TABLE "FormResponses" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- DropForeignKey
ALTER TABLE "FieldValueResponses" DROP CONSTRAINT "FieldValueResponses_form_response_id_fkey";

-- DropForeignKey
ALTER TABLE "FormResponses" DROP CONSTRAINT "FormResponses_form_id_fkey";

-- DropForeignKey
ALTER TABLE "FormSections" DROP CONSTRAINT "FormSections_form_id_fkey";

-- DropForeignKey
ALTER TABLE "ScoringSections" DROP CONSTRAINT "ScoringSections_form_id_fkey";

-- AlterTable
ALTER TABLE "FieldValueResponses" DROP COLUMN "value_upload",
ADD COLUMN     "value_array" TEXT[],
ADD COLUMN     "value_json" JSONB,
ADD COLUMN     "value_number" DOUBLE PRECISION,
ADD COLUMN     "value_string" TEXT;

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "share_expiry" TIMESTAMP(3),
ADD COLUMN     "share_token" TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "FormResponses" ADD COLUMN     "snapshot_version" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "university_id" SET DEFAULT NULL;

-- AlterTable
ALTER TABLE "FormSections" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "ResponseAssignments" ADD COLUMN     "completed_at" TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "ResponseScores" ADD COLUMN     "rejection_reason" TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "ScoringCriterias" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "ScoringSections" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Universities" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "end_date" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "FormSnapshots" (
    "id" SERIAL NOT NULL,
    "form_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "snapshot_json" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSnapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" SERIAL NOT NULL,
    "sluge" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteConfig" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormSnapshots_version_key" ON "FormSnapshots"("version");

-- CreateIndex
CREATE UNIQUE INDEX "FormSnapshots_form_id_version_key" ON "FormSnapshots"("form_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Page_sluge_key" ON "Page"("sluge");

-- CreateIndex
CREATE UNIQUE INDEX "SiteConfig_key_key" ON "SiteConfig"("key");

-- CreateIndex
CREATE INDEX "FieldValueResponses_value_number_idx" ON "FieldValueResponses"("value_number");

-- CreateIndex
CREATE INDEX "FieldValueResponses_value_string_idx" ON "FieldValueResponses"("value_string");

-- CreateIndex
CREATE UNIQUE INDEX "Form_share_token_key" ON "Form"("share_token");

-- AddForeignKey
ALTER TABLE "FormSections" ADD CONSTRAINT "FormSections_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponses" ADD CONSTRAINT "FormResponses_snapshot_version_fkey" FOREIGN KEY ("snapshot_version") REFERENCES "FormSnapshots"("version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponses" ADD CONSTRAINT "FormResponses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSnapshots" ADD CONSTRAINT "FormSnapshots_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldValueResponses" ADD CONSTRAINT "FieldValueResponses_form_response_id_fkey" FOREIGN KEY ("form_response_id") REFERENCES "FormResponses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringSections" ADD CONSTRAINT "ScoringSections_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
