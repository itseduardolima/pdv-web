-- Preço de custo opcional (0 quando não informado) e estoque mínimo padrão 5.
ALTER TABLE "Product" ALTER COLUMN "costPriceCents" SET DEFAULT 0;
ALTER TABLE "Product" ALTER COLUMN "minStock" SET DEFAULT 5;
