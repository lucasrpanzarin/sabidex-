#!/usr/bin/env bash
# Consulta SOMENTE LEITURA no banco D1 do Sabidex, pela API da Cloudflare.
# Usado pelo Claude nas análises (a permissão fica em .claude/settings.json).
#
# Uso:  bash .claude/scripts/d1-ler.sh "SELECT ... "
#       bash .claude/scripts/d1-ler.sh -b outro_banco "SELECT ..."
#
# Precisa de CLOUDFLARE_API_TOKEN (só D1 → Read) e CLOUDFLARE_ACCOUNT_ID no ambiente.
# Recusa qualquer comando que não seja SELECT/WITH: o token já é só leitura,
# e este script é uma segunda trava.
set -euo pipefail

BANCO="sabidex"
if [ "${1:-}" = "-b" ]; then BANCO="$2"; shift 2; fi
SQL="${1:-}"

if [ -z "$SQL" ]; then
  echo "uso: d1-ler.sh [-b banco] \"SELECT ...\"" >&2; exit 2
fi
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "faltam CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID no ambiente" >&2; exit 2
fi

# Trava de leitura: um comando só, começando por SELECT ou WITH, sem palavras de escrita.
python3 -I - "$SQL" <<'PY' || exit 3
import re, sys
sql = sys.argv[1].strip().rstrip(";").strip()
if ";" in sql:
    sys.exit("recusado: só um comando por vez")
if not re.match(r"(?is)^(select|with)\b", sql):
    sys.exit("recusado: só SELECT/WITH")
if re.search(r"(?i)\b(insert|update|delete|replace|drop|create|alter|attach|detach|pragma|vacuum|reindex)\b", sql):
    sys.exit("recusado: palavra de escrita na consulta")
PY

API="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/d1/database"
AUT="Authorization: Bearer $CLOUDFLARE_API_TOKEN"

ID=$(curl -sS -H "$AUT" "$API?name=$BANCO" | python3 -I -c '
import sys, json
banco = sys.argv[1]
d = json.load(sys.stdin)
ids = [x["uuid"] for x in d.get("result") or [] if x["name"] == banco]
print(ids[0] if ids else "")' "$BANCO")
if [ -z "$ID" ]; then echo "banco $BANCO não encontrado" >&2; exit 4; fi

python3 -I -c 'import json, sys; print(json.dumps({"sql": sys.argv[1]}))' "$SQL" \
  | curl -sS -H "$AUT" -H 'Content-Type: application/json' -X POST "$API/$ID/query" --data-binary @- \
  | python3 -I -c '
import sys, json
d = json.load(sys.stdin)
if not d.get("success"):
    sys.exit("erro: %s" % d.get("errors"))
linhas = d["result"][0]["results"]
for r in linhas:
    print(json.dumps(r, ensure_ascii=False))
print("(%d linhas)" % len(linhas), file=sys.stderr)'
