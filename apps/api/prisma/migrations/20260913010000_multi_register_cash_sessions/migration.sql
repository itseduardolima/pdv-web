-- HU 4.5-4.7, 11.6 (decisão de 2026-09-13): mercados com mais de um caixa
-- físico podem ter até tenant.registerCount sessões de caixa abertas ao
-- mesmo tempo, uma por caixa (registerNumber). Todo tenant nasce com
-- registerCount = 1 e toda CashSession existente vira "Caixa 1" — zero
-- mudança de comportamento sem ação do Administrador.

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "registerCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "CashSession" ADD COLUMN "registerNumber" INTEGER NOT NULL DEFAULT 1;

-- DropIndex (03-regras-negocio § Caixa, versão antiga: 1 sessão aberta por tenant)
DROP INDEX "CashSession_one_open_per_tenant";

-- DropIndex (substituído pelo índice composto abaixo, que já cobre tenantId+closedAt)
DROP INDEX "CashSession_tenantId_closedAt_idx";

-- CreateIndex
CREATE INDEX "CashSession_tenantId_registerNumber_closedAt_idx" ON "CashSession"("tenantId", "registerNumber", "closedAt");

-- CreateIndex: uma sessão aberta por caixa físico, garantida mesmo sob concorrência.
CREATE UNIQUE INDEX "CashSession_one_open_per_register"
  ON "CashSession" ("tenantId", "registerNumber")
  WHERE "closedAt" IS NULL;
