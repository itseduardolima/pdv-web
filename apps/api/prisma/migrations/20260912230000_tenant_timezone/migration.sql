-- Fuso horário da loja, usado para agregar o "hoje" do Dashboard.
ALTER TABLE "Tenant" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';
