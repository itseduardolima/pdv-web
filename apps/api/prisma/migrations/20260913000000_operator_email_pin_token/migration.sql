-- E-mail no operador (recuperação de PIN / primeiro acesso) e tokens de PIN.
ALTER TABLE "Operator" ALTER COLUMN "pinHash" DROP NOT NULL;
ALTER TABLE "Operator" ADD COLUMN "email" TEXT;
CREATE UNIQUE INDEX "Operator_tenantId_email_key" ON "Operator"("tenantId", "email");

CREATE TYPE "PinTokenPurpose" AS ENUM ('FIRST_ACCESS', 'RESET');

CREATE TABLE "PinToken" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "operatorId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "purpose" "PinTokenPurpose" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PinToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PinToken_tokenHash_key" ON "PinToken"("tokenHash");
CREATE INDEX "PinToken_tenantId_operatorId_idx" ON "PinToken"("tenantId", "operatorId");
ALTER TABLE "PinToken" ADD CONSTRAINT "PinToken_operatorId_fkey"
  FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mesmo isolamento por tenant das outras tabelas (08-seguranca § 1).
ALTER TABLE "PinToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PinToken" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "PinToken"
  USING ("tenantId" = app_tenant_id()) WITH CHECK ("tenantId" = app_tenant_id());
