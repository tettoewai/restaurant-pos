-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER', 'WMS_CHECK');

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_tableId_fkey";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'ORDER',
ADD COLUMN     "wmsCheckResultId" INTEGER,
ALTER COLUMN "tableId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "WMSCheckResult" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "menusWithoutIngredients" JSONB NOT NULL,
    "addonsWithoutIngredients" JSONB NOT NULL,
    "notEnoughIngredients" JSONB NOT NULL,
    "hitThresholdStocks" JSONB NOT NULL,
    "issuesCount" INTEGER NOT NULL,

    CONSTRAINT "WMSCheckResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_wmsCheckResultId_fkey" FOREIGN KEY ("wmsCheckResultId") REFERENCES "WMSCheckResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
