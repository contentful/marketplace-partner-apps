#!/usr/bin/env bash
set -euo pipefail

# Test Slack /cg endpoint by generating a valid Slack signature locally.
# Requires env:
#   BASE_URL or DEMO_BASE_URL  (e.g., https://your-ngrok.ngrok-free.app)
#   SLACK_SIGNING_SECRET       (from Slack app Basic Information)
# Optional arg1: command text (default example below)
#
# Usage:
#   chmod +x scripts/test_slack_cg.sh
#   BASE_URL=https://your-ngrok.ngrok-free.app SLACK_SIGNING_SECRET=xxxx scripts/test_slack_cg.sh \
#       "persona=decision-makers funnel=consideration industry=finance limit=3"

BASE_URL=${BASE_URL:-${DEMO_BASE_URL:-}}
SECRET=${SLACK_SIGNING_SECRET:-}
TEXT=${1:-'persona=decision-makers funnel=consideration industry=finance limit=3'}

if [[ -z "${BASE_URL}" ]]; then
  echo "ERROR: Set BASE_URL or DEMO_BASE_URL to your public server URL (e.g., https://<ngrok>.ngrok-free.app)" >&2
  exit 1
fi
if [[ -z "${SECRET}" ]]; then
  echo "ERROR: Set SLACK_SIGNING_SECRET to your Slack app's Signing Secret" >&2
  exit 1
fi

# URL-encode the text for application/x-www-form-urlencoded
ENCODED_TEXT=$(printf '%s' "$TEXT" | jq -s -R -r @uri)
BODY="text=${ENCODED_TEXT}"

TS=$(date +%s)
BASE_STRING="v0:${TS}:${BODY}"

# Compute HMAC-SHA256 signature
SIG_HASH=$(printf '%s' "$BASE_STRING" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')
SIG_HEADER="v0=${SIG_HASH}"

echo "POST ${BASE_URL}/slack/cg"
echo "X-Slack-Request-Timestamp: ${TS}"
echo "X-Slack-Signature: ${SIG_HEADER}"
echo "Body: ${BODY}"

curl -sS -X POST "${BASE_URL}/slack/cg" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H "X-Slack-Request-Timestamp: ${TS}" \
  -H "X-Slack-Signature: ${SIG_HEADER}" \
  --data "${BODY}" | jq .

