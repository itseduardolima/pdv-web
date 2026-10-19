CREATE TYPE "DiscountType" AS ENUM ('AMOUNT', 'PERCENT');

ALTER TABLE "Sale"
  ADD COLUMN "subtotalCents" INTEGER,
  ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "discountType" "DiscountType",
  ADD COLUMN "discountValue" INTEGER;

ALTER TABLE "SaleItem" ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0;

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT "id" FROM "Tenant" LOOP
    PERFORM set_config('app.tenant_id', t."id", true);
    UPDATE "Sale" SET "subtotalCents" = "totalCents" WHERE "tenantId" = t."id";
  END LOOP;
END $$;

ALTER TABLE "Sale" ALTER COLUMN "subtotalCents" SET NOT NULL;
