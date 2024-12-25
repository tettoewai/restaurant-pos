/*
  Warnings:

  - You are about to drop the column `quantity_requried` on the `PromotionMenu` table. All the data in the column will be lost.
  - Added the required column `quantity_required` to the `PromotionMenu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "DISCOUNT" ADD VALUE 'FOCMENU';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isFoc" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "group" TEXT,
ADD COLUMN     "locationId" INTEGER,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "totalPrice" INTEGER,
ALTER COLUMN "discount_value" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PromotionMenu" DROP COLUMN "quantity_requried",
ADD COLUMN     "quantity_required" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "FocCategory" (
    "id" SERIAL NOT NULL,
    "minSelection" INTEGER NOT NULL,
    "promotionId" INTEGER NOT NULL,

    CONSTRAINT "FocCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocMenu" (
    "id" SERIAL NOT NULL,
    "menuId" INTEGER NOT NULL,
    "focCategoryId" INTEGER NOT NULL,

    CONSTRAINT "FocMenu_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocCategory" ADD CONSTRAINT "FocCategory_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocMenu" ADD CONSTRAINT "FocMenu_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocMenu" ADD CONSTRAINT "FocMenu_focCategoryId_fkey" FOREIGN KEY ("focCategoryId") REFERENCES "FocCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
