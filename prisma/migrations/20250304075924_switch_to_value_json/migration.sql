-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Scope" AS ENUM ('SCHOLARSHIP', 'SURVEY');

-- CreateEnum
CREATE TYPE "ApplicantStatus" AS ENUM ('SUBMITTED', 'CHECKED', 'REJECTED', 'ASSIGNED', 'REVIEWING', 'FAILED', 'PASSED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "gender" "Gender",
    "phone_number" TEXT,
    "avatar_url" TEXT,
    "public_id" TEXT,
    "generation" TEXT,
    "job_title" TEXT,
    "school" TEXT,
    "major" TEXT,
    "company" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_external_guest" BOOLEAN NOT NULL DEFAULT false,
    "refresh_token" TEXT,
    "start_date" TIMESTAMP,
    "end_date" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "module" TEXT,
    "method" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "api_path" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creator_name" TEXT,
    "creator_id" INTEGER,
    "is_public" BOOLEAN DEFAULT false,
    "is_default" BOOLEAN DEFAULT false,
    "primary_color" TEXT DEFAULT '#09BDD4',
    "block_color" TEXT DEFAULT '#ffffff',
    "background_color" TEXT DEFAULT '#DAF5F9',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "scope" "Scope",
    "image_url" TEXT,
    "public_id" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSections" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "json_blocks" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "form_id" TEXT NOT NULL,

    CONSTRAINT "FormSections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormResponses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "form_id" TEXT NOT NULL,
    "status" "ApplicantStatus" DEFAULT 'SUBMITTED',
    "university_id" INTEGER DEFAULT NULL,
    "final_scores" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "total_final_score" INTEGER,

    CONSTRAINT "FormResponses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldValueResponses" (
    "id" SERIAL NOT NULL,
    "form_response_id" INTEGER NOT NULL,
    "field_id" TEXT NOT NULL,
    "value_upload" JSONB,

    CONSTRAINT "FieldValueResponses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Universities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "Universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringSections" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "max_score" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "form_id" TEXT NOT NULL,

    CONSTRAINT "ScoringSections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringCriterias" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "max_score" INTEGER NOT NULL,
    "min_score" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "scoring_section_id" INTEGER NOT NULL,

    CONSTRAINT "ScoringCriterias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseScores" (
    "id" SERIAL NOT NULL,
    "score_value" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "form_response_id" INTEGER NOT NULL,
    "scoring_criteria_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "finalized_by" INTEGER,
    "finalized_at" TIMESTAMP(3),

    CONSTRAINT "ResponseScores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseAssignments" (
    "id" SERIAL NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "form_response_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "scoring_section_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "ResponseAssignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_api_path_method_key" ON "Permission"("api_path", "method");

-- CreateIndex
CREATE INDEX "FormResponses_name_idx" ON "FormResponses"("name");

-- CreateIndex
CREATE INDEX "FormResponses_email_idx" ON "FormResponses"("email");

-- CreateIndex
CREATE INDEX "FormResponses_phone_number_idx" ON "FormResponses"("phone_number");

-- CreateIndex
CREATE INDEX "FormResponses_form_id_idx" ON "FormResponses"("form_id");

-- CreateIndex
CREATE INDEX "FormResponses_status_idx" ON "FormResponses"("status");

-- CreateIndex
CREATE INDEX "FormResponses_total_final_score_idx" ON "FormResponses"("total_final_score");

-- CreateIndex
CREATE INDEX "FieldValueResponses_form_response_id_idx" ON "FieldValueResponses"("form_response_id");

-- CreateIndex
CREATE INDEX "FieldValueResponses_field_id_idx" ON "FieldValueResponses"("field_id");

-- CreateIndex
CREATE UNIQUE INDEX "Universities_name_key" ON "Universities"("name");

-- CreateIndex
CREATE INDEX "ResponseScores_form_response_id_scoring_criteria_id_user_id_idx" ON "ResponseScores"("form_response_id", "scoring_criteria_id", "user_id");

-- CreateIndex
CREATE INDEX "ResponseAssignments_form_response_id_user_id_scoring_sectio_idx" ON "ResponseAssignments"("form_response_id", "user_id", "scoring_section_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSections" ADD CONSTRAINT "FormSections_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponses" ADD CONSTRAINT "FormResponses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponses" ADD CONSTRAINT "FormResponses_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "Universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldValueResponses" ADD CONSTRAINT "FieldValueResponses_form_response_id_fkey" FOREIGN KEY ("form_response_id") REFERENCES "FormResponses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringSections" ADD CONSTRAINT "ScoringSections_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringCriterias" ADD CONSTRAINT "ScoringCriterias_scoring_section_id_fkey" FOREIGN KEY ("scoring_section_id") REFERENCES "ScoringSections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseScores" ADD CONSTRAINT "ResponseScores_form_response_id_fkey" FOREIGN KEY ("form_response_id") REFERENCES "FormResponses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseScores" ADD CONSTRAINT "ResponseScores_scoring_criteria_id_fkey" FOREIGN KEY ("scoring_criteria_id") REFERENCES "ScoringCriterias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseScores" ADD CONSTRAINT "ResponseScores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseAssignments" ADD CONSTRAINT "ResponseAssignments_form_response_id_fkey" FOREIGN KEY ("form_response_id") REFERENCES "FormResponses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseAssignments" ADD CONSTRAINT "ResponseAssignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseAssignments" ADD CONSTRAINT "ResponseAssignments_scoring_section_id_fkey" FOREIGN KEY ("scoring_section_id") REFERENCES "ScoringSections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
