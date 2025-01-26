/*
  Warnings:

  - You are about to drop the column `qrCode` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `assetUrl` on the `Table` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Receipt" DROP COLUMN "qrCode";

-- AlterTable
ALTER TABLE "Table" DROP COLUMN "assetUrl";
