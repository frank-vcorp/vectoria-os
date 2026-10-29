#!/usr/bin/env bash
# Cambia el repo Git de la app en Coolify (p. ej. a frank-vcorp/vectoria-os).
# Uso:
#   source ~/.config/kilo/integra.secrets.env   # COOLIFY_* tokens
#   ./scripts/coolify-set-git-source.sh
#   GIT_REPO=https://github.com/frank-vcorp/vectoria-os.git GIT_BRANCH=main ./scripts/coolify-set-git-source.sh
set -euo pipefail

APP_UUID="${COOLIFY_APP_UUID:-hokuzfiqv0y7b8w6awhlccs4}"
GIT_REPO="${GIT_REPO:-https://github.com/frank-vcorp/vectoria-os.git}"
GIT_BRANCH="${GIT_BRANCH:-main}"
BASE="${COOLIFY_BASE_URL:-https://app.coolify.io}${COOLIFY_API_PREFIX:-/api/v1}"

if [[ -z "${COOLIFY_WRITE_TOKEN:-}" || -z "${COOLIFY_READ_TOKEN:-}" ]]; then
  if [[ -f "$HOME/.config/kilo/integra.secrets.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$HOME/.config/kilo/integra.secrets.env"
    set +a
  elif [[ -f "$HOME/.cursor/secrets.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$HOME/.cursor/secrets.env"
    set +a
  elif [[ -f "$HOME/.cursor/bin/load-cursor-env.sh" ]]; then
    # shellcheck disable=SC1091
    source "$HOME/.cursor/bin/load-cursor-env.sh"
  fi
fi

: "${COOLIFY_WRITE_TOKEN:?COOLIFY_WRITE_TOKEN no definido}"
: "${COOLIFY_READ_TOKEN:?COOLIFY_READ_TOKEN no definido}"

echo "App: ${APP_UUID}"
echo "Repo objetivo: ${GIT_REPO} (${GIT_BRANCH})"

echo "--- Antes ---"
curl -sf -H "Authorization: Bearer ${COOLIFY_READ_TOKEN}" \
  "${BASE}/applications/${APP_UUID}" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('name:', d.get('name'))
print('git_repository:', d.get('git_repository'))
print('git_branch:', d.get('git_branch'))
"

BODY="$(python3 -c "
import json
print(json.dumps({'git_repository': '''$GIT_REPO''', 'git_branch': '''$GIT_BRANCH'''}))
")"

HTTP=$(curl -s -m 30 -o /tmp/coolify-git-source.json -w '%{http_code}' -X PATCH \
  "${BASE}/applications/${APP_UUID}" \
  -H "Authorization: Bearer ${COOLIFY_WRITE_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "$BODY")
echo "PATCH HTTP=${HTTP}"
python3 -c "
import json
d=json.load(open('/tmp/coolify-git-source.json'))
print('git_repository:', d.get('git_repository', d))
print('git_branch:', d.get('git_branch', ''))
" 2>/dev/null || cat /tmp/coolify-git-source.json

echo "Siguiente paso: ./scripts/coolify-deploy.sh"
