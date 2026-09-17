-- HU 13.7: suspender uma loja sem apagar dado nenhum. default true preserva
-- o comportamento de toda loja existente hoje.
ALTER TABLE "Tenant" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
