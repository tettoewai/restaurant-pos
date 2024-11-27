-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "locationId" INTEGER;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
