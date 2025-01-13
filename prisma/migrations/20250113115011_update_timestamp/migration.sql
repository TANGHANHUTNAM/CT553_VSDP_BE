/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatar",
DROP COLUMN "deleted_at",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "end_date" TIMESTAMP,
ADD COLUMN     "job_title" TEXT,
ADD COLUMN     "public_id" TEXT,
ADD COLUMN     "start_date" TIMESTAMP;
