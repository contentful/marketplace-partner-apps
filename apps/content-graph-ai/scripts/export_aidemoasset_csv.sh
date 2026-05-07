#!/usr/bin/env bash
set -euo pipefail

# Export aiDemoAsset entries with AI fields to CSV
# Columns: id,title,aiTopic,aiIntent,aiPersona,aiFunnelStage,aiIndustry,aiConfidence,aiNeedsReview,aiLastClassified
# Uses Contentful Management API to read entries. Requires env vars set.
#
# Required env:
#   CONTENTFUL_SPACE_ID
#   CONTENTFUL_MANAGEMENT_TOKEN (CFPAT_...)
# Optional env:
#   CONTENTFUL_ENVIRONMENT_ID (default: master)
#
# Usage:
#   bash scripts/export_aidemoasset_csv.sh > exports/aidemoasset_export.csv

SPACE_ID=${CONTENTFUL_SPACE_ID:-}
TOKEN=${CONTENTFUL_MANAGEMENT_TOKEN:-}
ENV_ID=${CONTENTFUL_ENVIRONMENT_ID:-master}
API_BASE="https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENV_ID}"
LIMIT=100
SKIP=0

if [[ -z "$SPACE_ID" || -z "$TOKEN" ]]; then
  echo "ERROR: Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN in your .env" >&2
  exit 1
fi

headers=(
  -H "Authorization: Bearer ${TOKEN}"
  -H "Content-Type: application/vnd.contentful.management.v1+json"
)

echo "id,title,aiTopic,aiIntent,aiPersona,aiFunnelStage,aiIndustry,aiConfidence,aiNeedsReview,aiLastClassified"

while true; do
  url="${API_BASE}/entries?content_type=aiDemoAsset&limit=${LIMIT}&skip=${SKIP}&order=sys.updatedAt"
  RESP=$(curl -sS "${headers[@]}" "$url")
  COUNT=$(echo "$RESP" | jq -r '.items | length')
  if [[ "$COUNT" == "0" ]]; then
    break
  fi
  echo "$RESP" | jq -r '
    .items[] | {
      id: .sys.id,
      title: (.fields.title["en-US"] // .fields.name["en-US"] // ""),
      aiTopic: (.fields.aiTopic["en-US"] // ""),
      aiIntent: (.fields.aiIntent["en-US"] // ""),
      aiPersona: (.fields.aiPersona["en-US"] // ""),
      aiFunnelStage: (.fields.aiFunnelStage["en-US"] // ""),
      aiIndustry: (.fields.aiIndustry["en-US"] // ""),
      aiConfidence: (.fields.aiConfidence["en-US"] // null),
      aiNeedsReview: (.fields.aiNeedsReview["en-US"] // null),
      aiLastClassified: (.fields.aiLastClassified["en-US"] // "")
    } | 
    [
      .id,
      (.title | gsub("\n"; " ") | gsub("\r"; " ") | gsub(","; " ") ),
      .aiTopic,
      .aiIntent,
      .aiPersona,
      .aiFunnelStage,
      .aiIndustry,
      (if .aiConfidence == null then "" else (.aiConfidence|tostring) end),
      (if .aiNeedsReview == null then "" else (.aiNeedsReview|tostring) end),
      .aiLastClassified
    ] | @csv'
  SKIP=$((SKIP + LIMIT))
  sleep 0.1

done

