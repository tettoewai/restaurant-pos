-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "group" TEXT,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 1;
