-- AlterTable
ALTER TABLE "PatientSession" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "acknowledgedBy" TEXT;
