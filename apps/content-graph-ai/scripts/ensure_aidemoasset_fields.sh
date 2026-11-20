#!/usr/bin/env bash
set -euo pipefail

# Ensure aiDemoAsset has AI label fields visible in the editor
# Fields ensured: aiTopic, aiIntent, aiPersona, aiFunnelStage, aiIndustry (Symbol, localized, not omitted)
# Uses Contentful Management API. Requires env vars set.
#
# Required env:
#   CONTENTFUL_SPACE_ID
#   CONTENTFUL_MANAGEMENT_TOKEN (CFPAT_...)
# Optional env:
#   CONTENTFUL_ENVIRONMENT_ID (default: master)
#
# Usage:
#   bash scripts/ensure_aidemoasset_fields.sh

SPACE_ID=${CONTENTFUL_SPACE_ID:-}
TOKEN=${CONTENTFUL_MANAGEMENT_TOKEN:-}
ENV_ID=${CONTENTFUL_ENVIRONMENT_ID:-master}
CT_ID="aiDemoAsset"
API_BASE="https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENV_ID}"

if [[ -z "$SPACE_ID" || -z "$TOKEN" ]]; then
  echo "ERROR: Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN in your .env" >&2
  exit 1
fi

headers=(
  -H "Authorization: Bearer ${TOKEN}"
  -H "Content-Type: application/vnd.contentful.management.v1+json"
)

# Fetch content type (if not exists, create a minimal one)
HTTP_CODE=$(curl -sS -o /tmp/ct.json -w "%{http_code}" "${API_BASE}/content_types/${CT_ID}" "${headers[@]}") || true
if [[ "$HTTP_CODE" == "404" ]]; then
  echo "Content type ${CT_ID} not found. Creating minimal content type..."
  BODY='{
    "name": "AI Demo Asset",
    "displayField": "title",
    "fields": [
      {"id":"title","name":"Title","type":"Symbol","required":true,"localized":true,"disabled":false,"omitted":false},
      {"id":"summary","name":"Summary","type":"Text","required":false,"localized":true,"disabled":false,"omitted":false},
      {"id":"body","name":"Body","type":"RichText","required":false,"localized":true,"disabled":false,"omitted":false}
    ]
  }'
  HTTP_CODE=$(curl -sS -o /tmp/ct.json -w "%{http_code}" -X PUT "${API_BASE}/content_types/${CT_ID}" "${headers[@]}" --data-binary "$BODY") || true
  if [[ "$HTTP_CODE" != "201" && "$HTTP_CODE" != "200" ]]; then
    echo "Failed to create content type (${HTTP_CODE}):"; cat /tmp/ct.json; echo; exit 1
  fi
fi

# Load current CT JSON and version
VERSION=$(jq -r '.sys.version // 1' /tmp/ct.json)

# Ensure fields present
ensure_field() {
  local fid="$1"; local fname="$2"; local ftype="$3"; local localized="$4";
  if ! jq -e --arg id "$fid" '.fields[] | select(.id==$id)' /tmp/ct.json >/dev/null; then
    echo "Adding field: $fid"
    jq --arg id "$fid" --arg name "$fname" --arg type "$ftype" --argjson localized "$localized" \
      '.fields += [{id:$id,name:$name,type:$type,required:false,localized:$localized,disabled:false,omitted:false,validations:[]}]' \
      /tmp/ct.json > /tmp/ct.updated.json && mv /tmp/ct.updated.json /tmp/ct.json
  else
    # Make sure it is not omitted/disabled and localized as requested
    jq --arg id "$fid" --argjson localized "$localized" \
      '(.fields[] | select(.id==$id) | .disabled)=false | (.fields[] | select(.id==$id) | .omitted)=false | (.fields[] | select(.id==$id) | .localized)=$localized' \
      /tmp/ct.json > /tmp/ct.updated.json && mv /tmp/ct.updated.json /tmp/ct.json
  fi
}

ensure_field aiTopic        "AI Topic"        Symbol true
ensure_field aiIntent       "AI Intent"       Symbol true
ensure_field aiPersona      "AI Persona"      Symbol true
ensure_field aiFunnelStage  "AI Funnel Stage" Symbol true
ensure_field aiIndustry     "AI Industry"     Symbol true

# Computed/metadata fields (non-localized is fine; values are still stored under default locale key)
ensure_field aiConfidence     "AI Confidence"     Number false
ensure_field aiNeedsReview    "AI Needs Review"   Boolean false
ensure_field aiLastClassified "AI Last Classified" DateTime false


# Update content type
HTTP_CODE=$(curl -sS -o /tmp/ct_update.json -w "%{http_code}" -X PUT "${API_BASE}/content_types/${CT_ID}" \
  "${headers[@]}" -H "X-Contentful-Version: ${VERSION}" --data-binary @/tmp/ct.json) || true
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Failed to update content type (${HTTP_CODE}):"; cat /tmp/ct_update.json; echo; exit 1
fi

# Publish content type
NEW_VERSION=$(jq -r '.sys.version' /tmp/ct_update.json)
HTTP_CODE=$(curl -sS -o /tmp/ct_publish.json -w "%{http_code}" -X PUT "${API_BASE}/content_types/${CT_ID}/published" \
  "${headers[@]}" -H "X-Contentful-Version: ${NEW_VERSION}") || true
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Failed to publish content type (${HTTP_CODE}):"; cat /tmp/ct_publish.json; echo; exit 1
fi

echo "✅ aiDemoAsset updated and published with AI label fields visible in editor."

