-- CreateTable
CREATE TABLE "Receipt" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "tableId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "addonId" INTEGER,
    "menuId" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "qrCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" SERIAL NOT NULL,
    "receiptCode" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rating_receiptCode_key" ON "Rating"("receiptCode");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "Addon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
