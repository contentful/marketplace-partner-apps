#!/usr/bin/env bash
set -euo pipefail

# End-to-End Demo Script for ContentGraph
# - Resets Contentful App locations (sidebar/page)
# - Ensures taxonomy fields exist on content type
# - Imports demo entries if none exist
# - Simulates Contentful publish webhook (triggers AI classification)
# - Verifies analytics content mix
# - Exercises Slack /cg endpoint (sample request)
#
# Required env vars (set these before running):
#   TUNNEL   - e.g., https://your-ngrok-subdomain.ngrok-free.app
#   ORG_ID   - Contentful Organization ID
#   APP_ID   - Contentful App ID (the one installed in your space)
#   CT_ID    - Target Content Type ID (default: aiDemoAsset)
# Optional:
#   WEBHOOK_PATH - Defaults to /webhooks/contentful (update if your route is different)
#
# Usage:
#   chmod +x scripts/demo_end_to_end.sh
#   TUNNEL=... ORG_ID=... APP_ID=... CT_ID=aiDemoAsset ./scripts/demo_end_to_end.sh

TUNNEL=${TUNNEL:-}
ORG_ID=${ORG_ID:-}
APP_ID=${APP_ID:-}
CT_ID=${CT_ID:-aiDemoAsset}
WEBHOOK_PATH=${WEBHOOK_PATH:-/webhooks/contentful}

say(){ printf "\n=== %s ===\n" "$*"; }
need(){ command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1"; exit 1; }; }

need curl
need jq

if [[ -z "$TUNNEL" || -z "$ORG_ID" || -z "$APP_ID" ]]; then
  echo "Please set TUNNEL, ORG_ID, and APP_ID environment variables." >&2
  exit 1
fi

say "1) Tunnel check (should be 200 JSON)"
curl -sS -i "$TUNNEL/analytics/content-mix" | head -n 10 || true

say "2) Reset App Definition locations (src + entry-sidebar/page)"
jq -nc --arg org "$ORG_ID" --arg app "$APP_ID" --arg base "$TUNNEL" \
'{orgId:$org, appId:$app, base:$base, reset:true}' \
| curl -sS -X POST "$TUNNEL/contentful/setup/app-locations" -H 'Content-Type: application/json' --data-binary @- | jq .

say "3) Ensure content type fields (authoring + AI + computed) and publish"
jq -nc --arg ct "$CT_ID" '{contentTypeId:$ct, publish:true}' \
| curl -sS -X POST "$TUNNEL/contentful/setup/taxonomy" -H 'Content-Type: application/json' --data-binary @- | jq .

say "4) Get an $CT_ID entry id"
ENTRY_ID=$( \
  jq -nc --arg ct "$CT_ID" '{data:{limit:1,skip:0,contentTypes:[$ct]}}' \
  | curl -sS -X POST "$TUNNEL/api/tools/fetch-contentful-assets/execute" -H 'Content-Type: application/json' --data-binary @- \
  | jq -r '.assets[0].id // empty' \
)
echo "ENTRY_ID=$ENTRY_ID"

if [[ -z "${ENTRY_ID:-}" ]]; then
  say "4a) No entries found; importing 3 items and publishing"
  jq -nc --arg ct "$CT_ID" \
  '{data:{sections:["blog","resources"],limit:3,contentTypeId:$ct,publish:true,useSitemap:true}}' \
  | curl -sS -X POST "$TUNNEL/api/tools/import-scraped-into-contentful/execute" -H 'Content-Type: application/json' --data-binary @- | jq .

  say "4b) Get entry id again"
  ENTRY_ID=$( \
    jq -nc --arg ct "$CT_ID" '{data:{limit:1,skip:0,contentTypes:[$ct]}}' \
    | curl -sS -X POST "$TUNNEL/api/tools/fetch-contentful-assets/execute" -H 'Content-Type: application/json' --data-binary @- \
    | jq -r '.assets[0].id // empty' \
  )
  echo "ENTRY_ID=$ENTRY_ID"
fi

if [[ -n "${ENTRY_ID:-}" ]]; then
  say "5) Simulate Contentful publish webhook (triggers AI classification write-back)"
  jq -nc --arg id "$ENTRY_ID" --arg ct "$CT_ID" \
  --arg body "This whitepaper explains Zero Trust architecture for fintech security teams." \
  '{
    sys:{id:$id,contentType:{sys:{id:$ct}}},
    fields:{
      title:{"en-US":"Test from webhook"},
      body:{"en-US":{
        nodeType:"document",data:{},
        content:[{nodeType:"paragraph",data:{},
          content:[{nodeType:"text",value:$body,marks:[],data:{}}]
        }]
      }}
    }
  }' \
  | curl -sS -X POST "$TUNNEL$WEBHOOK_PATH" -H 'Content-Type: application/json' --data-binary @- | jq .
fi

say "6) Verify analytics content mix"
curl -sS "$TUNNEL/analytics/content-mix" | jq .

say "7) Slack /cg endpoint (sample query)"
# Note: Ensure your server exposes /slack/cg for slash commands.
# If your Slack integration uses a different route, adjust accordingly.
curl -sS -X POST "$TUNNEL/slack/cg" -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'text=persona=decision-makers funnel=consideration industry=finance limit=3' | jq . || true

say "Done. In Contentful UI:"
echo "- Settings → Apps → Your App → Manage → Hosted by URL (src) = $TUNNEL"
echo "- Locations: Entry Sidebar path /app/sidebar.html (reset done), Page path /app/mix.html"
echo "- Content model → $CT_ID → Editor interface → Sidebar: add your app, Save, Publish"
echo "- Open an entry: sidebar shows 'Classify with AI' + 'Approve & Save'; AI fields appear after approval/publish."

