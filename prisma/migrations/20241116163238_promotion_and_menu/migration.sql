-- CreateEnum
CREATE TYPE "DISCOUNT" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateTable
CREATE TABLE "Promotion" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discount_type" "DISCOUNT" NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionMenu" (
    "id" SERIAL NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "menuId" INTEGER NOT NULL,
    "quantity_requried" INTEGER NOT NULL,

    CONSTRAINT "PromotionMenu_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PromotionMenu" ADD CONSTRAINT "PromotionMenu_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionMenu" ADD CONSTRAINT "PromotionMenu_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
