-- Row-Level Security (08-seguranca § 1): segunda camada de isolamento.
-- A aplicação seta app.tenant_id em cada transação (extensão do Prisma);
-- sem isso as tabelas de domínio não devolvem nem aceitam linha nenhuma.
-- FORCE faz valer até para o dono das tabelas; superusuário sempre ignora
-- RLS — por isso a API nunca conecta como superusuário (ver infra/postgres).

CREATE OR REPLACE FUNCTION app_tenant_id() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.tenant_id', true), '') $$;

ALTER TABLE "Operator" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Operator" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Operator"
  USING ("tenantId" = app_tenant_id()) WITH CHECK ("tenantId" = app_tenant_id());

ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Product"
  USING ("tenantId" = app_tenant_id()) WITH CHECK ("tenantId" = app_tenant_id());

ALTER TABLE "CashSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CashSession" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "CashSession"
  USING ("tenantId" = app_tenant_id()) WITH CHECK ("tenantId" = app_tenant_id());

ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Sale"
  USING ("tenantId" = app_tenant_id()) WITH CHECK ("tenantId" = app_tenant_id());

-- SaleItem não tem tenantId: herda o isolamento pela venda.
ALTER TABLE "SaleItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SaleItem" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "SaleItem"
  USING (EXISTS (SELECT 1 FROM "Sale" s WHERE s.id = "SaleItem"."saleId"))
  WITH CHECK (EXISTS (SELECT 1 FROM "Sale" s WHERE s.id = "SaleItem"."saleId"));
