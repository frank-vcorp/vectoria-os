#!/usr/bin/env bash
# Configura dominio os.systronia.com y NEXT_PUBLIC_APP_URL en Coolify.
# Requiere COOLIFY_READ_TOKEN y COOLIFY_WRITE_TOKEN (p. ej. source ~/.config/kilo/integra.secrets.env).
#
# Uso:
#   ./scripts/coolify-systronia-domains.sh
#   APP_UUID=... ./scripts/coolify-systronia-domains.sh
#
# En la UI de Coolify (si la API no expone dominios en tu instancia):
#   1. Proyecto → aplicación vectoria-os → Dominios: quitar vectoria-os.* y agregar https://os.systronia.com
#   2. Dominio raíz systronia.com: configurar en el sitio/marketing que corresponda en el mismo servidor
#   3. DNS: registro A o CNAME de `os` hacia el host de Coolify
#   4. Variables de entorno: NEXT_PUBLIC_APP_URL=https://os.systronia.com → redeploy
set -euo pipefail

APP_UUID="${COOLIFY_APP_UUID:-hokuzfiqv0y7b8w6awhlccs4}"
NEW_FQDN="${SYSTRONIA_APP_FQDN:-https://os.systronia.com}"
BASE="${COOLIFY_BASE_URL:-https://app.coolify.io}${COOLIFY_API_PREFIX:-/api/v1}"

if [[ -z "${COOLIFY_WRITE_TOKEN:-}" || -z "${COOLIFY_READ_TOKEN:-}" ]]; then
  if [[ -f "$HOME/.config/kilo/integra.secrets.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$HOME/.config/kilo/integra.secrets.env"
    set +a
  elif [[ -f "$HOME/.cursor/bin/load-cursor-env.sh" ]]; then
    # shellcheck disable=SC1091
    source "$HOME/.cursor/bin/load-cursor-env.sh"
  fi
fi

: "${COOLIFY_WRITE_TOKEN:?COOLIFY_WRITE_TOKEN no definido}"
: "${COOLIFY_READ_TOKEN:?COOLIFY_READ_TOKEN no definido}"

echo "App UUID: ${APP_UUID}"
echo "Nuevo FQDN: ${NEW_FQDN}"

curl -sf -H "Authorization: Bearer ${COOLIFY_READ_TOKEN}" \
  "${BASE}/applications/${APP_UUID}" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('Actual fqdn:', d.get('fqdn') or d.get('domains') or '(sin campo)')
print('Nombre:', d.get('name'))
"

BODY="$(python3 -c "
import json
print(json.dumps({'fqdn': '''$NEW_FQDN'''}))
")"

HTTP=$(curl -s -m 30 -o /tmp/coolify-fqdn.json -w '%{http_code}' -X PATCH \
  "${BASE}/applications/${APP_UUID}" \
  -H "Authorization: Bearer ${COOLIFY_WRITE_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "$BODY")
echo "PATCH fqdn HTTP=${HTTP}"
cat /tmp/coolify-fqdn.json
echo

ENV_BODY="$(python3 -c "
import json
print(json.dumps({
  'data': [
    {'key': 'NEXT_PUBLIC_APP_URL', 'value': '''$NEW_FQDN''', 'is_literal': True, 'is_buildtime': True},
  ]
}))
")"

HTTP2=$(curl -s -m 30 -o /tmp/coolify-env-systronia.json -w '%{http_code}' -X PATCH \
  "${BASE}/applications/${APP_UUID}/envs/bulk" \
  -H "Authorization: Bearer ${COOLIFY_WRITE_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "$ENV_BODY")
echo "PATCH NEXT_PUBLIC_APP_URL HTTP=${HTTP2}"
cat /tmp/coolify-env-systronia.json
echo
echo "Ejecuta ./scripts/coolify-deploy.sh para redeploy con la nueva URL."
