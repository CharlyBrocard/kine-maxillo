/*
  Warnings:

  - You are about to drop the `AvailabilityException` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AvailabilityRule` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('MAXILLO_FACIAL', 'PRESSOTHERAPIE');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "category" "Category" NOT NULL;

-- DropTable
DROP TABLE "AvailabilityException";

-- DropTable
DROP TABLE "AvailabilityRule";

-- DropEnum
DROP TYPE "DayOfWeek";

-- DropEnum
DROP TYPE "ExceptionType";

-- CreateTable
CREATE TABLE "AvailableSlot" (
    "id" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "category" "Category" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailableSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailableSlot_start_idx" ON "AvailableSlot"("start");

-- CreateIndex
CREATE UNIQUE INDEX "AvailableSlot_start_category_key" ON "AvailableSlot"("start", "category");
