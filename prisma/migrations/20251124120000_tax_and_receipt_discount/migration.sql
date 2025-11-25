-- Alter Table: Company add tax rate configuration
ALTER TABLE "Company"
ADD COLUMN "taxRate" INTEGER NOT NULL DEFAULT 5;

-- Alter Table: Receipt add discount tracking
ALTER TABLE "Receipt"
ADD COLUMN "discount" INTEGER NOT NULL DEFAULT 0;

