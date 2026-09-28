-- Anulação de venda: nunca apaga a linha (03-regras-negocio § Venda).
ALTER TABLE "Sale" ADD COLUMN "voidedAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "voidedById" TEXT;
ALTER TABLE "Sale" ADD COLUMN "voidReason" TEXT;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_voidedById_fkey"
  FOREIGN KEY ("voidedById") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
