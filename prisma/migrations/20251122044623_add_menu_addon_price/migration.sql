-- CreateTable
CREATE TABLE "MenuAddonPrice" (
    "id" SERIAL NOT NULL,
    "menuId" INTEGER NOT NULL,
    "addonId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuAddonPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuAddonPrice_menuId_idx" ON "MenuAddonPrice"("menuId");

-- CreateIndex
CREATE INDEX "MenuAddonPrice_addonId_idx" ON "MenuAddonPrice"("addonId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuAddonPrice_menuId_addonId_key" ON "MenuAddonPrice"("menuId", "addonId");

-- AddForeignKey
ALTER TABLE "MenuAddonPrice" ADD CONSTRAINT "MenuAddonPrice_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuAddonPrice" ADD CONSTRAINT "MenuAddonPrice_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "Addon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
