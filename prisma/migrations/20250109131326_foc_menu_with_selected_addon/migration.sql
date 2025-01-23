-- CreateTable
CREATE TABLE "FocMenuAddonCategory" (
    "id" SERIAL NOT NULL,
    "menuId" INTEGER NOT NULL,
    "addonCategoryId" INTEGER NOT NULL,
    "addonId" INTEGER NOT NULL,
    "promotionId" INTEGER NOT NULL,

    CONSTRAINT "FocMenuAddonCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FocMenuAddonCategory" ADD CONSTRAINT "FocMenuAddonCategory_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocMenuAddonCategory" ADD CONSTRAINT "FocMenuAddonCategory_addonCategoryId_fkey" FOREIGN KEY ("addonCategoryId") REFERENCES "AddonCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocMenuAddonCategory" ADD CONSTRAINT "FocMenuAddonCategory_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "Addon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocMenuAddonCategory" ADD CONSTRAINT "FocMenuAddonCategory_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
