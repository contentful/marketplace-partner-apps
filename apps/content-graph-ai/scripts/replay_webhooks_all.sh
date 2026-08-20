#!/usr/bin/env bash
set -euo pipefail

# Replay Contentful publish webhook for all entries of a content type
# Uses Contentful Management API to list entries, then POSTs each entry payload to your server's webhook endpoint.
# Requirements:
#   - env: CONTENTFUL_SPACE_ID
#   - env: CONTENTFUL_MANAGEMENT_TOKEN (CMA token)
#   - env: CONTENTFUL_WEBHOOK_SECRET (must match your server)
#   - optional env: CONTENTFUL_ENVIRONMENT_ID (default: master)
#   - optional env: DEMO_BASE_URL (e.g., https://<your-ngrok>.ngrok-free.app)
#   - optional arg1: Base URL override
#   - optional env/arg: CONTENTFUL_CONTENT_TYPE (default: aiDemoAsset)
#
# Usage:
#   bash scripts/replay_webhooks_all.sh
#   BASE_URL=https://example.ngrok-free.app bash scripts/replay_webhooks_all.sh
#   CONTENTFUL_CONTENT_TYPE=blogPost bash scripts/replay_webhooks_all.sh

SPACE_ID=${CONTENTFUL_SPACE_ID:-}
MGMT_TOKEN=${CONTENTFUL_MANAGEMENT_TOKEN:-}
WEBHOOK_SECRET=${CONTENTFUL_WEBHOOK_SECRET:-}
ENV_ID=${CONTENTFUL_ENVIRONMENT_ID:-master}
BASE_URL=${1:-${DEMO_BASE_URL:-}}
CONTENT_TYPE=${CONTENTFUL_CONTENT_TYPE:-aiDemoAsset}

if [[ -z "$SPACE_ID" || -z "$MGMT_TOKEN" || -z "$WEBHOOK_SECRET" ]]; then
  echo "ERROR: Missing required env vars. Ensure CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN, CONTENTFUL_WEBHOOK_SECRET are set." >&2
  exit 1
fi

if [[ -z "${BASE_URL}" ]]; then
  echo "ERROR: Missing BASE_URL. Set DEMO_BASE_URL env or pass as first arg (e.g., https://your-tunnel.ngrok-free.app)." >&2
  exit 1
fi

API="https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENV_ID}/entries"
LIMIT=100
SKIP=0
TOTAL=1
COUNT=0

headers=(
  -H "Authorization: Bearer ${MGMT_TOKEN}"
  -H "Content-Type: application/vnd.contentful.management.v1+json"
)

echo "Replaying webhook for contentType='${CONTENT_TYPE}' from env='${ENV_ID}' to ${BASE_URL}/webhooks/contentful"
echo

while (( SKIP < TOTAL )); do
  echo "Fetching entries: skip=${SKIP} limit=${LIMIT} ..."
  QUERY="${API}?limit=${LIMIT}&skip=${SKIP}"
  if [[ -n "${CONTENT_TYPE}" && "${CONTENT_TYPE}" != "ALL" ]]; then
    QUERY+="&content_type=${CONTENT_TYPE}"
  fi
  RESP=$(curl -sS -H "Authorization: Bearer ${MGMT_TOKEN}" -H "Content-Type: application/vnd.contentful.management.v1+json" "${QUERY}")
  TOTAL=$(echo "$RESP" | jq -r '.total // 0')
  PAGE_COUNT=$(echo "$RESP" | jq -r '.items | length')
  if (( PAGE_COUNT == 0 )); then
    echo "No more items."
    break
  fi

  while IFS= read -r payload; do
    id=$(echo "$payload" | jq -r '.sys.id')
    printf "→ %s ... " "$id"
    # Post to webhook
    HTTP_CODE=$(curl -sS -o /tmp/replay_resp.json -w "%{http_code}" \
      -X POST "${BASE_URL}/webhooks/contentful" \
      -H "Content-Type: application/json" \
      -H "X-Webhook-Secret: ${WEBHOOK_SECRET}" \
      --data-binary "$payload") || true

    if [[ "$HTTP_CODE" == "200" ]]; then
      echo "OK"
    else
      echo "FAIL ($HTTP_CODE)"; cat /tmp/replay_resp.json; echo
    fi
    COUNT=$((COUNT+1))
    # small jitter to avoid bursts
    sleep 0.1
  done < <(echo "$RESP" | jq -c '.items[] | { sys: { id: .sys.id, contentType: { sys: { id: .sys.contentType.sys.id } } }, fields: .fields }')

  SKIP=$((SKIP + LIMIT))
  echo
done

echo "Done. Posted ${COUNT} webhook(s)."

