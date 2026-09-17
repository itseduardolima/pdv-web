-- "Esqueci minha senha" do superadmin — mesma mecânica de PinToken, fora do
-- isolamento por tenant/RLS (mesma exceção de PlatformAdmin).
CREATE TABLE "PlatformAdminResetToken" (
    "id" TEXT NOT NULL,
    "platformAdminId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAdminResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformAdminResetToken_tokenHash_key" ON "PlatformAdminResetToken"("tokenHash");

CREATE INDEX "PlatformAdminResetToken_platformAdminId_idx" ON "PlatformAdminResetToken"("platformAdminId");

ALTER TABLE "PlatformAdminResetToken" ADD CONSTRAINT "PlatformAdminResetToken_platformAdminId_fkey" FOREIGN KEY ("platformAdminId") REFERENCES "PlatformAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
