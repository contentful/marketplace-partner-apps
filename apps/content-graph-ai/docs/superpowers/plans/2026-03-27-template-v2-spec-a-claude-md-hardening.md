# Template v2 Spec A — CLAUDE.md Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 new sections to all 4 CLAUDE.md templates with anti-patterns embedded in code blocks, not prose.

**Architecture:** Each template gets `## Error Handling Conventions`, `## Logging`, `## Observability`, and `## Known Anti-Patterns & Bugs` appended. Anti-patterns use code blocks with `# CORRECT` / `# NEVER` comments so Claude follows them reliably. Also adds missing observability keys to contentful-tool `.env.example`.

**Tech Stack:** Bash heredocs (all files in `~/.claude/` which is outside Conductor workspace sandbox — must use Bash, not Write tool)

---

## File Map

| Action | Path |
|---|---|
| Modify | `~/.claude/templates/contentful-tool/CLAUDE.md` |
| Modify | `~/.claude/templates/python-agent/CLAUDE.md` |
| Modify | `~/.claude/templates/full-stack-saas/CLAUDE.md` |
| Modify | `~/.claude/templates/generic-mvp/CLAUDE.md` |
| Modify | `~/.claude/templates/contentful-tool/.env.example` |

---

## Task 1: Harden `contentful-tool` CLAUDE.md

**Files:**
- Modify: `~/.claude/templates/contentful-tool/CLAUDE.md`

- [ ] **Step 1: Append 4 new sections**

Run this exact bash command:

```bash
cat >> /Users/zuhur.ahmed/.claude/templates/contentful-tool/CLAUDE.md << 'HEREDOC'

## Error Handling Conventions

Wrap all Gemini AI calls in try/catch. Capture the field name in the catch for debugging.

```typescript
// CORRECT — structured catch with context
try {
  const result = await generateObject({ model, schema, prompt })
  return result.object
} catch (err) {
  console.error({ field: 'classification', slug, err }, 'Gemini call failed')
  throw err
}

// NEVER — bare unstructured catch
try {
  const result = await generateObject({ model, schema, prompt })
} catch (e) {
  throw e
}
```

Webhook handlers must return structured errors via `sendSafeRouteError()` — never expose raw stack traces.

## Logging

Use `pino` for structured logging. JSON format in production, human-readable in dev.

```typescript
// CORRECT — structured pino log
import pino from 'pino'
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' })
logger.info({ slug, entryId, field }, 'Classification complete')

// NEVER — bare console.log in production code
console.log('Classification complete', slug)
```

Set `LOG_LEVEL` env var. Default: `info`. Use `debug` locally.

## Observability

LangSmith and Phoenix OTEL are wired in `api/_shared/utils/observability.ts`.
Both require env vars — add them to `.env.example` or they silently no-op.

Required keys:
- `LANGSMITH_API_KEY` — LangSmith project tracing
- `LANGSMITH_PROJECT` — project name (default: `content-graph`)
- `PHOENIX_API_KEY` — Arize Phoenix eval platform
- `PHOENIX_COLLECTOR_ENDPOINT` — OTLP endpoint (e.g. `http://localhost:6006/v1/traces`)

To verify observability is active: check `classification_runs` table in DB after a classify run.
If table is empty, `DATABASE_URL` is likely missing.

## Known Anti-Patterns & Bugs

**Model selection — CRITICAL**

```typescript
// CORRECT — use pro model for generateObject
const model = google('gemini-2.5-pro-preview')
await generateObject({ model, schema, prompt })

// NEVER — flash models hang on generateObject with large inputs (MAX_TOKENS loop)
const model = google('gemini-2.5-flash-lite')  // hangs on Ninetailed pages
const model = google('gemini-3-flash-preview')  // hangs on structured output
```

**Taxonomy validation before promoting corrections**

```typescript
// CORRECT — validate against enum before persisting
const VALID_FUNNEL_STAGES = ['TOFU', 'MOFU', 'BOFU', ...]
if (!VALID_FUNNEL_STAGES.includes(suggestedValue)) {
  logger.warn({ suggestedValue }, 'Invalid taxonomy value — rejecting')
  return
}
await saveCorrectionWithEmbedding(entryId, field, suggestedValue)

// NEVER — promote raw LLM output without validation
await saveCorrectionWithEmbedding(entryId, field, llmOutput.value)
```

**Cache seeding on new environments**

`.cache/feedback-corrections.json` is gitignored but critical. On a new environment:
```bash
# Re-seed corrections by running the classifier loop manually first
npx tsx scripts/classify-pillar-pages.ts
# Then verify: cat .cache/feedback-corrections.json | python3 -m json.tool
```

**Webhook infinite loop guard**

`CONTENTFUL_BOT_USER_ID` MUST be set. Without it the webhook will re-trigger itself on every classification update:
```bash
# Verify before deploying webhook
echo $CONTENTFUL_BOT_USER_ID  # must not be empty
```
HEREDOC
echo "Exit: $?"
```

- [ ] **Step 2: Verify sections were appended**

```bash
grep -c "## Error Handling" /Users/zuhur.ahmed/.claude/templates/contentful-tool/CLAUDE.md
grep -c "## Known Anti-Patterns" /Users/zuhur.ahmed/.claude/templates/contentful-tool/CLAUDE.md
```

Expected: both return `1`.

- [ ] **Step 3: Count total sections (should be 11)**

```bash
grep -c "^## " /Users/zuhur.ahmed/.claude/templates/contentful-tool/CLAUDE.md
```

Expected: `11`

- [ ] **Step 4: Add missing observability keys to `.env.example`**

```bash
cat >> /Users/zuhur.ahmed/.claude/templates/contentful-tool/.env.example << 'HEREDOC'

# Observability (LangSmith + Phoenix) — required for tracing to work
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=content-graph
PHOENIX_API_KEY=
PHOENIX_COLLECTOR_ENDPOINT=http://localhost:6006/v1/traces
HEREDOC
echo "Exit: $?"
```

- [ ] **Step 5: Commit**

```bash
cd /Users/zuhur.ahmed/.claude
git add templates/contentful-tool/ 2>/dev/null || echo "not a git repo, skipping commit"
git commit -m "feat(templates): harden contentful-tool CLAUDE.md with 4 new sections" 2>/dev/null || echo "skipped"
```

---

## Task 2: Harden `python-agent` CLAUDE.md

**Files:**
- Modify: `~/.claude/templates/python-agent/CLAUDE.md`

- [ ] **Step 1: Append 4 new sections**

```bash
cat >> /Users/zuhur.ahmed/.claude/templates/python-agent/CLAUDE.md << 'HEREDOC'

## Error Handling Conventions

One base exception class only. Never create a parallel `errors.py`.

```python
# CORRECT — single hierarchy in api/utils/error_handler.py
from api.utils.error_handler import ThesisError, ExternalServiceError

class AnthropicError(ExternalServiceError):
    pass

# NEVER — parallel errors.py creates inconsistent response shapes
# Do not create backend/errors.py alongside api/utils/error_handler.py
```

Global exception handlers registered in `main.py`:
```python
app.add_exception_handler(ThesisError, thesis_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)
```

## Logging

Use `logger_config.py` with `setup_logging()` and `get_logger()`. JSON output via `python-json-logger`.

```python
# CORRECT
from backend.logger_config import get_logger
logger = get_logger(__name__)
logger.info("Classification complete", extra={"slug": slug, "field": field})

# NEVER — bare print() anywhere in source
print("Classification complete", slug)
```

Add `python-json-logger` to dependencies:
```bash
uv add python-json-logger
```

## Observability

Add `X-Request-ID` middleware so every log line is correlatable across a request:

```python
# In main.py, before route registration
import uuid
from starlette.middleware.base import BaseHTTPMiddleware

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

app.add_middleware(RequestIDMiddleware)
```

Log `request_id` in every handler:
```python
request_id = request.headers.get("X-Request-ID", "unknown")
logger.info("Handler called", extra={"request_id": request_id, "path": request.url.path})
```

## Known Anti-Patterns & Bugs

**Always wrap external API calls with retry**

```python
# CORRECT — retry on transient failures
from api.utils.retry import async_retry_with_backoff, retry_on_rate_limit

result = await async_retry_with_backoff(
    anthropic_client.messages.create,
    strategy=retry_on_rate_limit,
    model=model, messages=messages, max_tokens=2048
)

# NEVER — bare await with no retry (Anthropic, Supabase, Voyage all have transient failures)
result = await anthropic_client.messages.create(model=model, messages=messages)
```

**CORS — never wildcard with credentials**

```python
# CORRECT
app.add_middleware(CORSMiddleware,
    allow_origins=[os.environ["FRONTEND_URL"]],
    allow_credentials=True)

# NEVER — exposes API to all origins when credentials are used
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True)
```

**Migrations — psql only, never supabase db push**

```bash
# CORRECT
psql $DATABASE_URL -f database/migrations/YYYYMMDDHHMMSS_description.sql

# NEVER — causes sync issues with Supabase
supabase db push
```

**ES256 JWT — backend needs JWK public key, not HMAC secret**

```python
# CORRECT — fetch JWK from Supabase
jwks_uri = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

# NEVER — ES256 tokens cannot be verified with HMAC secret
jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
```
HEREDOC
echo "Exit: $?"
```

- [ ] **Step 2: Verify**

```bash
grep -c "^## " /Users/zuhur.ahmed/.claude/templates/python-agent/CLAUDE.md
```

Expected: `11`

- [ ] **Step 3: Commit**

```bash
cd /Users/zuhur.ahmed/.claude
git add templates/python-agent/ 2>/dev/null && git commit -m "feat(templates): harden python-agent CLAUDE.md" 2>/dev/null || echo "skipped"
```

---

## Task 3: Harden `full-stack-saas` CLAUDE.md

**Files:**
- Modify: `~/.claude/templates/full-stack-saas/CLAUDE.md`

- [ ] **Step 1: Append 4 new sections**

```bash
cat >> /Users/zuhur.ahmed/.claude/templates/full-stack-saas/CLAUDE.md << 'HEREDOC'

## Error Handling Conventions

**Backend (FastAPI):** Single exception hierarchy in `api/utils/error_handler.py`. Never create `errors.py`.

```python
# CORRECT
from api.utils.error_handler import ExternalServiceError
class StripeError(ExternalServiceError): pass

# NEVER
# backend/errors.py  ← do not create this file
```

**Frontend (Next.js):** Every App Router segment must have an `error.tsx`:

```typescript
// CORRECT — app/dashboard/error.tsx
'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}

// NEVER — leaving a segment without error.tsx means unhandled React errors break the whole UI
```

## Logging

**Backend:** JSON structured logging via `python-json-logger` + request-ID middleware (see python-agent pattern).

**Frontend:** Use Sentry for error capture. Never use `console.error` for production errors:

```typescript
// CORRECT — Sentry captures with full context
import * as Sentry from '@sentry/nextjs'
Sentry.captureException(error, { extra: { userId, action } })

// NEVER — console.error is invisible in production
console.error('Payment failed', error)
```

## Observability

**Frontend:** Sentry required. Add to `NEXT_PUBLIC_SENTRY_DSN` env var.
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Backend:** Request-ID middleware + JSON logger (see python-agent pattern).

**Database:** Supabase dashboard → Logs → API logs gives per-request traces.

Required env vars:
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry project DSN
- `SENTRY_AUTH_TOKEN` — for source map uploads in CI

## Known Anti-Patterns & Bugs

**Migration system — use supabase/migrations/ only**

```bash
# CORRECT — timestamped format, Supabase CLI compatible
supabase/migrations/20260327120000_add_users_table.sql

# NEVER — do not add files to backend/migrations/ (legacy, deprecated)
backend/migrations/094_new_feature.sql
```

Run migrations via psql, not supabase db push:
```bash
psql $DATABASE_URL -f supabase/migrations/YYYYMMDDHHMMSS_description.sql
```

**Never expose service_role key to frontend**

```typescript
// CORRECT — service_role only in backend environment
const adminClient = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// NEVER — NEXT_PUBLIC_ prefix exposes to browser
const adminClient = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)
```

**Always getUser() not getSession() server-side**

```typescript
// CORRECT
const { data: { user } } = await supabase.auth.getUser()

// NEVER — getSession() is not verified server-side
const { data: { session } } = await supabase.auth.getSession()
```

**CORS — set FRONTEND_URL explicitly**

```python
# CORRECT
allow_origins=[os.environ["FRONTEND_URL"]]

# NEVER
allow_origins=["*"]  # exposes API to all origins with credentials
```

**All external API calls need retry (Anthropic, Supabase, Voyage)**

```python
# CORRECT
result = await async_retry_with_backoff(anthropic_client.messages.create, strategy=retry_on_rate_limit, ...)

# NEVER
result = await anthropic_client.messages.create(...)
```
HEREDOC
echo "Exit: $?"
```

- [ ] **Step 2: Verify**

```bash
grep -c "^## " /Users/zuhur.ahmed/.claude/templates/full-stack-saas/CLAUDE.md
```

Expected: `11`

- [ ] **Step 3: Commit**

```bash
cd /Users/zuhur.ahmed/.claude
git add templates/full-stack-saas/ 2>/dev/null && git commit -m "feat(templates): harden full-stack-saas CLAUDE.md" 2>/dev/null || echo "skipped"
```

---

## Task 4: Harden `generic-mvp` CLAUDE.md

**Files:**
- Modify: `~/.claude/templates/generic-mvp/CLAUDE.md`

- [ ] **Step 1: Append 4 new sections**

```bash
cat >> /Users/zuhur.ahmed/.claude/templates/generic-mvp/CLAUDE.md << 'HEREDOC'

## Error Handling Conventions

```
# Add stack-specific error handling here.
# Pattern: one base exception class, global handler registered at app startup.
# Never swallow exceptions silently — always log with context before re-raising.
```

## Logging

```
# Add stack-specific logging setup here.
# Principle: structured JSON logs in production, human-readable in dev.
# Never use bare print()/console.log() in production paths.
```

## Observability

```
# Add observability keys to .env.example when wiring up:
# - Error tracking: Sentry (NEXT_PUBLIC_SENTRY_DSN / SENTRY_DSN)
# - LLM tracing: LangSmith (LANGSMITH_API_KEY, LANGSMITH_PROJECT)
# - Request tracing: X-Request-ID middleware
```

## Known Anti-Patterns & Bugs

**Universal rules — apply to every stack:**

```
# NEVER hardcode secrets — use env vars
# NEVER use wildcard CORS with credentials: allow_origins=["*"]
# NEVER build SQL queries with string concatenation — use parameterized queries
# NEVER commit .env files — only commit .env.example
# NEVER skip input validation at API boundaries
```
HEREDOC
echo "Exit: $?"
```

- [ ] **Step 2: Verify**

```bash
grep -c "^## " /Users/zuhur.ahmed/.claude/templates/generic-mvp/CLAUDE.md
```

Expected: `11`

- [ ] **Step 3: Commit**

```bash
cd /Users/zuhur.ahmed/.claude
git add templates/generic-mvp/ 2>/dev/null && git commit -m "feat(templates): harden generic-mvp CLAUDE.md" 2>/dev/null || echo "skipped"
```

---

## Task 5: Update `audit-repo.sh` to check for 11 sections

**Files:**
- Modify: `~/.claude/scripts/audit-repo.sh`

- [ ] **Step 1: Update required sections array**

The audit script currently checks for 7 sections. Add the 4 new ones:

```bash
# Read current file to find the REQUIRED_SECTIONS array
grep -n "REQUIRED_SECTIONS" /Users/zuhur.ahmed/.claude/scripts/audit-repo.sh | head -5
```

- [ ] **Step 2: Replace the array in audit-repo.sh**

```bash
sed -i '' 's/REQUIRED_SECTIONS=(\n  "## Project Overview"\n  "## Tech Stack"\n  "## Key Directories"\n  "## Development Commands"\n  "## Secrets"\n  "## Active MCP Servers"\n  "## Security Rules"\n)/REQUIRED_SECTIONS=(\n  "## Project Overview"\n  "## Tech Stack"\n  "## Key Directories"\n  "## Development Commands"\n  "## Secrets"\n  "## Active MCP Servers"\n  "## Security Rules"\n  "## Error Handling"\n  "## Logging"\n  "## Observability"\n  "## Known Anti-Patterns"\n)/' /Users/zuhur.ahmed/.claude/scripts/audit-repo.sh
```

If sed fails (multiline sed is fragile), use Python instead:

```bash
python3 << 'PYEOF'
path = '/Users/zuhur.ahmed/.claude/scripts/audit-repo.sh'
with open(path) as f:
    content = f.read()

old = '''REQUIRED_SECTIONS=(
  "## Project Overview"
  "## Tech Stack"
  "## Key Directories"
  "## Development Commands"
  "## Secrets"
  "## Active MCP Servers"
  "## Security Rules"
)'''

new = '''REQUIRED_SECTIONS=(
  "## Project Overview"
  "## Tech Stack"
  "## Key Directories"
  "## Development Commands"
  "## Secrets"
  "## Active MCP Servers"
  "## Security Rules"
  "## Error Handling"
  "## Logging"
  "## Observability"
  "## Known Anti-Patterns"
)'''

if old in content:
    with open(path, 'w') as f:
        f.write(content.replace(old, new))
    print("Updated successfully")
else:
    print("ERROR: old string not found — check file manually")
    print(content[:500])
PYEOF
```

- [ ] **Step 3: Verify**

```bash
grep -A 15 "REQUIRED_SECTIONS" /Users/zuhur.ahmed/.claude/scripts/audit-repo.sh | head -15
```

Expected: 11 section strings in the array.

- [ ] **Step 4: Test audit on a template dir (should show 11/11)**

```bash
~/.claude/scripts/audit-repo.sh /tmp && echo "done"
# Will fail on most checks but CLAUDE.md check should show section count
```

- [ ] **Step 5: Commit**

```bash
cd /Users/zuhur.ahmed/.claude
git add scripts/audit-repo.sh 2>/dev/null && git commit -m "feat(scripts): update audit-repo.sh to check 11 CLAUDE.md sections" 2>/dev/null || echo "skipped"
```

---

## Self-Review

**Spec A coverage:**
- 4 new sections in all 4 templates — Tasks 1-4 ✓
- Anti-patterns in code blocks — all tasks use `# CORRECT` / `# NEVER` format ✓
- Missing observability keys in contentful-tool .env.example — Task 1 Step 4 ✓
- audit-repo.sh updated for 11 sections — Task 5 ✓

**Placeholder scan:** No TBDs. generic-mvp uses placeholder comments inside code fences intentionally — these are template placeholders for the user to fill in, not plan placeholders.

**Type consistency:** All bash heredocs use `HEREDOC` as delimiter consistently. Python script in Task 5 uses `PYEOF` to avoid collision.
