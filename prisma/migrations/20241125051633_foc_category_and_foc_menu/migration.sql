-- AlterEnum
ALTER TYPE "DISCOUNT" ADD VALUE 'FOCMENU';

-- AlterTable
ALTER TABLE "Promotion" ALTER COLUMN "discount_value" DROP NOT NULL;

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
ALTER TABLE "FocCategory" ADD CONSTRAINT "FocCategory_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocMenu" ADD CONSTRAINT "FocMenu_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocMenu" ADD CONSTRAINT "FocMenu_focCategoryId_fkey" FOREIGN KEY ("focCategoryId") REFERENCES "FocCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
