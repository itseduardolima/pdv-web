#!/bin/sh
# Barra um deploy com .env ausente ou ainda com valores de exemplo.
# Uso na VPS: ./scripts/deploy-check.sh && docker compose up -d --build
set -e
cd "$(dirname "$0")/.."
[ -f .env ] || { echo "ERRO: .env não existe. cp .env.example .env e preencha." >&2; exit 1; }
required="APP_DOMAIN API_DOMAIN MEDIA_DOMAIN ACME_EMAIL POSTGRES_PASSWORD APP_DB_PASSWORD STORAGE_SECRET_KEY SESSION_SECRET"
fail=0
for name in $required; do
  value=$(grep -E "^${name}=" .env | tail -1 | cut -d= -f2- | sed 's/[[:space:]]*#.*$//')
  case "$value" in
    ""|*seudominio*|*gere-*|*change-me*|*placeholder*|localhost*)
      echo "ERRO: $name não preenchido no .env (valor atual: '${value:-vazio}')" >&2; fail=1 ;;
  esac
done
[ "$fail" -eq 0 ] && echo "OK: .env pronto para produção."
exit $fail
