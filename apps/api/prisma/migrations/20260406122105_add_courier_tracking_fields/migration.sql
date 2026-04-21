-- AlterTable
ALTER TABLE "Courier" ADD COLUMN     "lastLocationAt" TIMESTAMP(3),
ADD COLUMN     "locationSource" TEXT,
ADD COLUMN     "trackingStatus" TEXT;
