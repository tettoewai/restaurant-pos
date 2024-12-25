/*
  Warnings:

  - You are about to drop the column `quantity_requried` on the `PromotionMenu` table. All the data in the column will be lost.
  - Added the required column `quantity_required` to the `PromotionMenu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PromotionMenu" DROP COLUMN "quantity_requried",
ADD COLUMN     "quantity_required" INTEGER NOT NULL;
