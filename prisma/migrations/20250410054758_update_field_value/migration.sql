/*
  Warnings:

  - A unique constraint covering the columns `[form_response_id,field_id]` on the table `FieldValueResponses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FormResponses" ALTER COLUMN "university_id" SET DEFAULT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FieldValueResponses_form_response_id_field_id_key" ON "FieldValueResponses"("form_response_id", "field_id");
