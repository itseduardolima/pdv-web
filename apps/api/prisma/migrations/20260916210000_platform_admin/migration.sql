-- Conta do dono do sistema (revendedor) — fora do isolamento por tenant, de
-- propósito. Sem tenantId, sem Row-Level Security (mesmo padrão de "Tenant"
-- na migration 20260912180000_row_level_security: é a entidade que fica
-- acima do escopo de qualquer loja, não dentro dele).
CREATE TABLE "PlatformAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformAdmin_email_key" ON "PlatformAdmin"("email");
