#!/bin/sh
# Backup diário do banco (09-operacao § 4) — pg_dump completo (todos os
# tenants, não é um dump por tenant), comprimido e criptografado, empurrado
# pra um destino S3-compatível FORA da VPS (bucket separado, outro
# provedor, etc.) — um backup que só existe no mesmo disco que pode falhar
# não protege contra a falha que importa.
#
# Uso (cron diário, horário de menor movimento):
#   0 3 * * * BACKUP_ENCRYPTION_PASSPHRASE=... BACKUP_S3_BUCKET=... \
#     /caminho/para/pdv-web/scripts/backup-db.sh
#
# Pré-requisitos na VPS: `aws` CLI instalado (apt install awscli, ou
# `pip install awscli`) — funciona tanto com S3 de verdade quanto com
# qualquer destino S3-compatível via BACKUP_S3_ENDPOINT_URL (Backblaze B2,
# outro MinIO fora desta VPS, etc.); credenciais via as variáveis padrão
# do próprio aws-cli (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/AWS_REGION).
#
# Retenção (09-operacao § 4): mantém os 7 backups diários e os 4 semanais
# (domingo) mais recentes no destino — os mais antigos são apagados a cada
# execução. Lembrete: um backup nunca restaurado não é backup — fazer o
# drill de restore mensal (ver 09-operacao § 4) continua manual, não tem
# como automatizar aqui.
set -e
cd "$(dirname "$0")/.."

: "${BACKUP_ENCRYPTION_PASSPHRASE:?defina BACKUP_ENCRYPTION_PASSPHRASE — backup nunca sobe sem criptografia}"
: "${BACKUP_S3_BUCKET:?defina BACKUP_S3_BUCKET — o destino precisa ser fora desta VPS}"
: "${APP_DB_NAME:=pdv}"
: "${BACKUP_DAILY_RETENTION:=7}"
: "${BACKUP_WEEKLY_RETENTION:=4}"

command -v aws >/dev/null 2>&1 || {
  echo "ERRO: aws-cli não encontrado no PATH (apt install awscli, ou pip install awscli)." >&2
  exit 1
}

endpoint_args=""
[ -n "${BACKUP_S3_ENDPOINT_URL:-}" ] && endpoint_args="--endpoint-url $BACKUP_S3_ENDPOINT_URL"

timestamp=$(date -u +%Y-%m-%dT%H-%M-%SZ)
weekday=$(date -u +%u) # 1=segunda ... 7=domingo
raw_dump="$(mktemp)"
dump_file="$(mktemp)"
trap 'rm -f "$raw_dump" "$dump_file"' EXIT

echo "Gerando dump de '${APP_DB_NAME}'..."
# -U postgres: só o superusuário de administração bypassa a Row-Level
# Security — um dump como APP_DB_USER (não-superusuário, RLS) devolveria
# as tabelas de domínio vazias, o que tornaria o backup inútil sem avisar
# ninguém (08-seguranca § 1).
#
# Dump primeiro pra um arquivo isolado, SEM pipe com gzip/openssl: em sh
# POSIX (sem pipefail, que é extensão bash/ksh) `set -e` só olha o exit
# code do ÚLTIMO comando de um pipeline — um `pg_dump | gzip | openssl`
# com o pg_dump falhando no meio passaria despercebido, porque gzip/openssl
# produzem um arquivo pequeno mas com headers válidos mesmo com stdin
# vazio (não fica vazio, então nem o teste de `-s` abaixo pegaria).
# Isolado assim, o `set -e` do topo do script já mata o script se o
# `pg_dump` falhar, antes de qualquer coisa ser comprimida/enviada.
docker compose exec -T postgres pg_dump -U postgres -d "$APP_DB_NAME" >"$raw_dump"

if [ ! -s "$raw_dump" ]; then
  echo "ERRO: dump veio vazio — o container 'postgres' está no ar? (docker compose ps)" >&2
  exit 1
fi

gzip -c "$raw_dump" | openssl enc -aes-256-cbc -pbkdf2 -salt -pass "pass:${BACKUP_ENCRYPTION_PASSPHRASE}" >"$dump_file"

if [ ! -s "$dump_file" ]; then
  echo "ERRO: falha ao comprimir/criptografar o dump." >&2
  exit 1
fi

if [ "$weekday" = "7" ]; then
  prefix="weekly"
  keep="$BACKUP_WEEKLY_RETENTION"
else
  prefix="daily"
  keep="$BACKUP_DAILY_RETENTION"
fi
key="backups/${prefix}/pdv-${timestamp}.sql.gz.enc"

echo "Enviando para s3://${BACKUP_S3_BUCKET}/${key}..."
# shellcheck disable=SC2086
aws s3 cp $endpoint_args "$dump_file" "s3://${BACKUP_S3_BUCKET}/${key}"

echo "Aplicando retenção (${prefix}: manter os ${keep} mais recentes)..."
# shellcheck disable=SC2086
aws s3api list-objects-v2 $endpoint_args --bucket "$BACKUP_S3_BUCKET" --prefix "backups/${prefix}/" \
  --query "sort_by(Contents, &LastModified)[:-${keep}].Key" --output text 2>/dev/null |
  tr '\t' '\n' |
  while read -r old_key; do
    case "$old_key" in
      '' | None) continue ;;
    esac
    echo "  removendo $old_key"
    # shellcheck disable=SC2086
    aws s3 rm $endpoint_args "s3://${BACKUP_S3_BUCKET}/${old_key}"
  done

echo "OK: backup enviado e retenção aplicada."
