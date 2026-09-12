-- 03-regras-negocio § Caixa: duas sessões não podem estar abertas ao mesmo
-- tempo no mesmo tenant. O Service já checa; este índice parcial garante
-- mesmo sob concorrência.
CREATE UNIQUE INDEX "CashSession_one_open_per_tenant"
  ON "CashSession" ("tenantId")
  WHERE "closedAt" IS NULL;
