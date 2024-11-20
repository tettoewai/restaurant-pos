-- AlterEnum
ALTER TYPE "ORDERSTATUS" ADD VALUE 'CANCELED';

-- CreateTable
CREATE TABLE "CanceledOrder" (
    "id" SERIAL NOT NULL,
    "itemId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "userKnow" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanceledOrder_pkey" PRIMARY KEY ("id")
);
