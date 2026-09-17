-- Anonimização definitiva de dado pessoal (LGPD, 08-seguranca § 13):
-- registra quando um Operator já soft-deleted teve name/photoUrl/pinHash
-- zerados a pedido. Sempre posterior a deletedAt; a linha nunca é apagada
-- (Sale/CashSession referenciam Operator sem cascade).
ALTER TABLE "Operator" ADD COLUMN "anonymizedAt" TIMESTAMP(3);
