-- Pagamento misto: 1 linha por forma de pagamento da venda (máx. 2).
CREATE TABLE "SalePayment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  CONSTRAINT "SalePayment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SalePayment_saleId_method_key" ON "SalePayment"("saleId", "method");
CREATE INDEX "SalePayment_tenantId_saleId_idx" ON "SalePayment"("tenantId", "saleId");
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_saleId_fkey"
  FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Vendas antigas: uma linha com o total inteiro no método que já tinham.
INSERT INTO "SalePayment" ("id", "tenantId", "saleId", "method", "amountCents")
SELECT 'sp_' || "id", "tenantId", "id", "paymentMethod", "totalCents" FROM "Sale";

ALTER TABLE "SalePayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalePayment" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "SalePayment"
  USING ("tenantId" = app_tenant_id()) WITH CHECK ("tenantId" = app_tenant_id());
