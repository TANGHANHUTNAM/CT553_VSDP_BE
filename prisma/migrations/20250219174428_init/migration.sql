/*
  Warnings:

  - The values [APPLICANT] on the enum `Scope` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Form` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `public_url` on the `Form` table. All the data in the column will be lost.
  - You are about to drop the `ApplicantSubmission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormField` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormRow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormVersion` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Scope_new" AS ENUM ('SCHOLARSHIP', 'SURVEY');
ALTER TABLE "Form" ALTER COLUMN "scope" DROP DEFAULT;
ALTER TABLE "Form" ALTER COLUMN "scope" TYPE "Scope_new" USING ("scope"::text::"Scope_new");
ALTER TYPE "Scope" RENAME TO "Scope_old";
ALTER TYPE "Scope_new" RENAME TO "Scope";
DROP TYPE "Scope_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ApplicantSubmission" DROP CONSTRAINT "ApplicantSubmission_applicantId_fkey";

-- DropForeignKey
ALTER TABLE "ApplicantSubmission" DROP CONSTRAINT "ApplicantSubmission_formVersionId_fkey";

-- DropForeignKey
ALTER TABLE "FormField" DROP CONSTRAINT "FormField_formRowId_fkey";

-- DropForeignKey
ALTER TABLE "FormGroup" DROP CONSTRAINT "FormGroup_formId_fkey";

-- DropForeignKey
ALTER TABLE "FormRow" DROP CONSTRAINT "FormRow_formGroupId_fkey";

-- DropForeignKey
ALTER TABLE "FormVersion" DROP CONSTRAINT "FormVersion_formId_fkey";

-- AlterTable
ALTER TABLE "Form" DROP CONSTRAINT "Form_pkey",
DROP COLUMN "public_url",
ADD COLUMN     "background_color" TEXT,
ADD COLUMN     "creator_id" INTEGER,
ADD COLUMN     "creator_name" TEXT,
ADD COLUMN     "is_default" BOOLEAN DEFAULT false,
ADD COLUMN     "json_blocks" TEXT DEFAULT '[]',
ADD COLUMN     "primary_color" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "is_active" SET DEFAULT false,
ALTER COLUMN "scope" DROP DEFAULT,
ADD CONSTRAINT "Form_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Form_id_seq";

-- DropTable
DROP TABLE "ApplicantSubmission";

-- DropTable
DROP TABLE "FormField";

-- DropTable
DROP TABLE "FormGroup";

-- DropTable
DROP TABLE "FormRow";

-- DropTable
DROP TABLE "FormVersion";

-- DropEnum
DROP TYPE "FieldType";

-- CreateTable
CREATE TABLE "FormResponses" (
    "id" SERIAL NOT NULL,
    "json_response" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "applicant_id" INTEGER NOT NULL,
    "form_id" TEXT NOT NULL,

    CONSTRAINT "FormResponses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FormResponses" ADD CONSTRAINT "FormResponses_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponses" ADD CONSTRAINT "FormResponses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
