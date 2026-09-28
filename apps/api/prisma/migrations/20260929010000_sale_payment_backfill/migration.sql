-- Reparo do backfill de SalePayment. A migration 20260928210000 fez o INSERT
-- ... SELECT sem `app.tenant_id`; com RLS forçado (o migrate roda com o
-- usuário da aplicação, sem BYPASSRLS) o SELECT não enxergava venda nenhuma
-- e as vendas antigas ficaram sem forma de pagamento. Aqui o tenant é
-- definido por loja. Idempotente: só preenche venda que ainda não tem linha.
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT "id" FROM "Tenant" LOOP
    PERFORM set_config('app.tenant_id', t."id", true);
    INSERT INTO "SalePayment" ("id", "tenantId", "saleId", "method", "amountCents")
    SELECT 'sp_' || s."id", s."tenantId", s."id", s."paymentMethod", s."totalCents"
    FROM "Sale" s
    WHERE s."tenantId" = t."id"
      AND NOT EXISTS (SELECT 1 FROM "SalePayment" p WHERE p."saleId" = s."id");
  END LOOP;
END $$;
