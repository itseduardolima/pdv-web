-- Troco em venda em Dinheiro: valor recebido e troco calculado pela API.
ALTER TABLE "Sale" ADD COLUMN "amountReceivedCents" INTEGER;
ALTER TABLE "Sale" ADD COLUMN "changeCents" INTEGER;
