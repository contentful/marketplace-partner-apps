# Claude Repo Governance Template System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a template system under `~/.claude/templates/` and two scripts (`new-repo.sh`, `audit-repo.sh`) so any new repo is fully Claude-configured in under 30 seconds.

**Architecture:** Four stack-variant template directories (`contentful-tool`, `python-agent`, `full-stack-saas`, `generic-mvp`) plus a `_shared/` baseline, all under `~/.claude/templates/`. A scaffold script stamps templates onto a new directory; an audit script checks compliance of existing repos.

**Tech Stack:** Bash, JSON (MCP config), Markdown (CLAUDE.md templates)

---

## File Map

| Action | Path |
|---|---|
| Create | `~/.claude/templates/_shared/.gitignore-additions` |
| Create | `~/.claude/templates/_shared/docs/superpowers/.keep` |
| Create | `~/.claude/templates/contentful-tool/CLAUDE.md` |
| Create | `~/.claude/templates/contentful-tool/.mcp.json` |
| Create | `~/.claude/templates/contentful-tool/.env.example` |
| Create | `~/.claude/templates/python-agent/CLAUDE.md` |
| Create | `~/.claude/templates/python-agent/.mcp.json` |
| Create | `~/.claude/templates/python-agent/.env.example` |
| Create | `~/.claude/templates/full-stack-saas/CLAUDE.md` |
| Create | `~/.claude/templates/full-stack-saas/.mcp.json` |
| Create | `~/.claude/templates/full-stack-saas/.env.example` |
| Create | `~/.claude/templates/generic-mvp/CLAUDE.md` |
| Create | `~/.claude/templates/generic-mvp/.mcp.json` |
| Create | `~/.claude/templates/generic-mvp/.env.example` |
| Create | `~/.claude/scripts/new-repo.sh` |
| Create | `~/.claude/scripts/audit-repo.sh` |

---

## Task 1: Shared baseline files

**Files:**
- Create: `~/.claude/templates/_shared/.gitignore-additions`
- Create: `~/.claude/templates/_shared/docs/superpowers/.keep`

- [ ] **Step 1: Create the templates directory structure**

```bash
mkdir -p ~/.claude/templates/_shared/docs/superpowers
mkdir -p ~/.claude/templates/contentful-tool
mkdir -p ~/.claude/templates/python-agent
mkdir -p ~/.claude/templates/full-stack-saas
mkdir -p ~/.claude/templates/generic-mvp
```

Expected: no errors, directories exist.

- [ ] **Step 2: Create `.gitignore-additions`**

Create `~/.claude/templates/_shared/.gitignore-additions` with this exact content:

```
# Claude / AI tooling
.cache/
.env.production.local
.env.local
*.env.local

# Secrets
.env
!.env.example

# OS
.DS_Store
```

- [ ] **Step 3: Create the superpowers placeholder**

Create `~/.claude/templates/_shared/docs/superpowers/.keep` with empty content (just touch the file):

```bash
touch ~/.claude/templates/_shared/docs/superpowers/.keep
```

- [ ] **Step 4: Verify structure**

```bash
find ~/.claude/templates/_shared -type f
```

Expected output:
```
/Users/<you>/.claude/templates/_shared/.gitignore-additions
/Users/<you>/.claude/templates/_shared/docs/superpowers/.keep
```

- [ ] **Step 5: Commit**

```bash
cd ~/.claude
git add templates/_shared/
git commit -m "feat(templates): add shared baseline files"
```

---

## Task 2: `contentful-tool` template

Stack: Next.js + Vercel + Contentful + Gemini AI SDK. Reference: `/Users/zuhur.ahmed/Codebases/-content-graph-main/`.

**Files:**
- Create: `~/.claude/templates/contentful-tool/CLAUDE.md`
- Create: `~/.claude/templates/contentful-tool/.mcp.json`
- Create: `~/.claude/templates/contentful-tool/.env.example`

- [ ] **Step 1: Create `CLAUDE.md`**

Create `~/.claude/templates/contentful-tool/CLAUDE.md`:

```markdown
# CLAUDE.md

## Project Overview

[2-3 sentences: what this tool does, who uses it, what problem it solves.]

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Deployment | Vercel |
| CMS | Contentful (CDA + CMA) |
| AI | Gemini via `@ai-sdk/google` (`generateObject`, `generateText`) |
| Background jobs | Inngest |
| Cache | `.cache/` directory (gitignored) |

## Key Directories

```
api/
  _shared/
    tools/       — AI classifier tools (classificationTool.ts)
    utils/       — shared utilities (embeddingCache, contentSignals, etc.)
  webhooks/      — Contentful webhook handlers
  cron/          — scheduled jobs
scripts/         — one-off scripts (classify, export, test)
config/          — taxonomy and content-type profiles
.cache/          — embedding cache, classification history (gitignored)
exports/         — CSV exports from classification runs
```

## Development Commands

```bash
# Pull environment from Vercel
vercel env pull .env.production.local

# Run a script
npx tsx scripts/<script-name>.ts

# Deploy
vercel --prod

# Type check
npx tsc --noEmit
```

## Secrets & Environment

Secrets are pulled from Vercel via `vercel env pull`. Never hardcode.

Required env vars (see `.env.example`):
- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_CDA_TOKEN`
- `CONTENTFUL_CMA_TOKEN`
- `CONTENTFUL_WEBHOOK_SECRET`
- `CONTENTFUL_BOT_USER_ID`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default: `gemini-2.5-pro-preview`)

## Active MCP Servers

See `.mcp.json`. Configured servers:
- **context7** — fetch current library docs (Contentful SDK, AI SDK, Inngest)
- **github** — PR review, issue tracking, code search
- **supabase** — if this project uses a Supabase DB

## Security Rules

See global `~/.claude/CLAUDE.md` Security Rules section. Key points:
- Use parameterized queries; no string-concatenated SQL
- Validate all user input server-side
- HMAC-SHA256 for webhook signature verification
- Never expose `NEXT_PUBLIC_` secrets
```

- [ ] **Step 2: Create `.mcp.json`**

Create `~/.claude/templates/contentful-tool/.mcp.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

- [ ] **Step 3: Create `.env.example`**

Create `~/.claude/templates/contentful-tool/.env.example`:

```bash
# Contentful
CONTENTFUL_SPACE_ID=
CONTENTFUL_CDA_TOKEN=
CONTENTFUL_CMA_TOKEN=
CONTENTFUL_WEBHOOK_SECRET=
CONTENTFUL_BOT_USER_ID=

# Gemini AI
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-pro-preview
GEMINI_JUDGE_MODEL=gemini-2.5-flash-lite

# Supabase (optional)
SUPABASE_PROJECT_REF=
SUPABASE_ACCESS_TOKEN=
DATABASE_URL=

# GitHub MCP
GITHUB_PERSONAL_ACCESS_TOKEN=
```

- [ ] **Step 4: Verify files exist**

```bash
ls -la ~/.claude/templates/contentful-tool/
```

Expected: `CLAUDE.md`, `.mcp.json`, `.env.example`

- [ ] **Step 5: Commit**

```bash
cd ~/.claude
git add templates/contentful-tool/
git commit -m "feat(templates): add contentful-tool stack template"
```

---

## Task 3: `python-agent` template

Stack: FastAPI + uv + Supabase + Claude/Gemini. Reference: `/Users/zuhur.ahmed/Codebases/Thesis-App/backend/`.

**Files:**
- Create: `~/.claude/templates/python-agent/CLAUDE.md`
- Create: `~/.claude/templates/python-agent/.mcp.json`
- Create: `~/.claude/templates/python-agent/.env.example`

- [ ] **Step 1: Create `CLAUDE.md`**

Create `~/.claude/templates/python-agent/CLAUDE.md`:

```markdown
# CLAUDE.md

## Project Overview

[2-3 sentences: what this agent does, what it automates or analyzes, who uses it.]

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Python 3.12 |
| Package manager | uv |
| Web framework | FastAPI + Uvicorn |
| Validation | Pydantic v2 |
| Database | Supabase (PostgreSQL + RLS) |
| AI | Anthropic Claude SDK / Gemini via `@ai-sdk/google` |
| Formatting | Black + Ruff |
| Deployment | Docker + docker-compose on VPS |

## Key Directories

```
backend/
  api/
    routes/      — FastAPI route handlers
    models/      — Pydantic models
  agents/        — agent implementations
  services/      — business logic
  system_instructions/ — agent prompts (XML or Markdown)
  tests/         — pytest test suite
database/
  migrations/    — SQL migration files (run via psql, not supabase db push)
```

## Development Commands

```bash
# Install deps
uv sync

# Run dev server
uv run uvicorn main:app --reload --port 8000

# Run tests
uv run pytest tests/ -v

# Format
uv run black . && uv run ruff check --fix .

# Docker
docker-compose up --build
docker-compose down
```

## Secrets & Environment

Secrets managed via Doppler in production. Locally use `.env`.

```bash
# Pull from Doppler (production)
doppler secrets download --no-file --format env > .env

# Or edit .env directly for local dev
cp .env.example .env
```

Required env vars (see `.env.example`):
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## Active MCP Servers

See `.mcp.json`. Configured servers:
- **supabase** — query DB, run migrations, inspect schema
- **github** — PR review, issue tracking
- **ssh** — deploy to VPS, tail logs, run remote commands

## Security Rules

See global `~/.claude/CLAUDE.md` Security Rules section. Key points:
- Use parameterized queries; never string-concatenate SQL
- Use Pydantic for all input validation at API boundaries
- Enable RLS on all Supabase tables with user data
- Use `getUser()` not `getSession()` server-side
- Never expose `service_role` key to any client
- Use ES256 JWT algorithm; backend needs JWK public key, not HMAC secret
```

- [ ] **Step 2: Create `.mcp.json`**

Create `~/.claude/templates/python-agent/.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "ssh": {
      "command": "npx",
      "args": ["-y", "mcp-ssh-manager", "--minimal"],
      "env": {
        "SSH_CONFIG_PATH": "${HOME}/.ssh/config"
      }
    }
  }
}
```

- [ ] **Step 3: Create `.env.example`**

Create `~/.claude/templates/python-agent/.env.example`:

```bash
# Anthropic
ANTHROPIC_API_KEY=

# Supabase
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=
SUPABASE_ACCESS_TOKEN=
DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres

# Gemini (if used)
GEMINI_API_KEY=

# GitHub MCP
GITHUB_PERSONAL_ACCESS_TOKEN=

# App
PORT=8000
ENVIRONMENT=development
```

- [ ] **Step 4: Verify**

```bash
ls -la ~/.claude/templates/python-agent/
```

Expected: `CLAUDE.md`, `.mcp.json`, `.env.example`

- [ ] **Step 5: Commit**

```bash
cd ~/.claude
git add templates/python-agent/
git commit -m "feat(templates): add python-agent stack template"
```

---

## Task 4: `full-stack-saas` template

Stack: Next.js + FastAPI + Supabase + Docker. This is the Thesis-App pattern. Reference: `/Users/zuhur.ahmed/Codebases/Thesis-App/`.

**Files:**
- Create: `~/.claude/templates/full-stack-saas/CLAUDE.md`
- Create: `~/.claude/templates/full-stack-saas/.mcp.json`
- Create: `~/.claude/templates/full-stack-saas/.env.example`

- [ ] **Step 1: Create `CLAUDE.md`**

Create `~/.claude/templates/full-stack-saas/CLAUDE.md`:

```markdown
# CLAUDE.md

## Project Overview

[2-3 sentences: what this SaaS does, who the users are, what problem it solves.]

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4 |
| Backend | FastAPI (Python 3.12), Uvicorn, Pydantic v2 |
| Database | Supabase (PostgreSQL + RLS + pgvector) |
| AI | Anthropic Claude SDK |
| Deployment | Docker + docker-compose (backend on VPS), Vercel (frontend) |
| Package managers | npm (frontend), uv (backend) |

## Key Directories

```
frontend/
  app/           — Next.js pages and layouts
  components/    — React components
  contexts/      — React context providers

backend/
  api/routes/    — FastAPI endpoints
  agents/        — AI agent implementations
  services/      — business logic
  system_instructions/ — agent prompts

database/
  migrations/    — SQL migration files (run via psql directly)

docs/
  ARCHITECTURE.md
  superpowers/
    specs/       — design specs
    plans/       — implementation plans
```

## Development Commands

```bash
# Frontend (from /frontend)
npm run dev          # localhost:3000
npm run build
npm run lint

# Backend (from /backend)
uv sync
uv run uvicorn main:app --reload --port 8000
uv run pytest tests/ -v

# Docker (full stack)
docker-compose up --build
docker-compose down

# Secrets
vercel env pull .env.production.local   # frontend secrets
doppler secrets download --no-file --format env > backend/.env   # backend secrets
```

## Secrets & Environment

Frontend secrets: Vercel (`vercel env pull .env.production.local`).
Backend secrets: Doppler (`doppler secrets download`).
Never hardcode. Never commit `.env` files.

## Active MCP Servers

See `.mcp.json`. Configured servers:
- **supabase** — DB queries, migrations, schema inspection
- **github** — PR review, issues, code search
- **ssh** — VPS deployment, log tailing
- **memory** — persistent cross-session knowledge graph
- **gdrive** — read/write Google Drive docs

## Security Rules

See global `~/.claude/CLAUDE.md` Security Rules section. Key points:
- RLS on all Supabase tables with user data (SELECT, INSERT, UPDATE, DELETE policies)
- Use `getUser()` not `getSession()` server-side
- Never expose `service_role` key to client or frontend
- Validate all inputs with Pydantic (backend) and Zod (frontend Server Actions)
- ES256 JWT: backend needs JWK public key
```

- [ ] **Step 2: Create `.mcp.json`**

Create `~/.claude/templates/full-stack-saas/.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "ssh": {
      "command": "npx",
      "args": ["-y", "mcp-ssh-manager", "--minimal"],
      "env": {
        "SSH_CONFIG_PATH": "${HOME}/.ssh/config"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "${HOME}/.claude/memory.jsonl"
      }
    },
    "gdrive": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gdrive"],
      "env": {
        "GDRIVE_OAUTH_PATH": "${HOME}/.config/mcp-gdrive/gcp-oauth.keys.json",
        "GDRIVE_CREDENTIALS_PATH": "${HOME}/.config/mcp-gdrive/credentials.json"
      }
    }
  }
}
```

- [ ] **Step 3: Create `.env.example`**

Create `~/.claude/templates/full-stack-saas/.env.example`:

```bash
# Supabase
SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=
SUPABASE_ACCESS_TOKEN=
DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres

# Anthropic
ANTHROPIC_API_KEY=

# GitHub MCP
GITHUB_PERSONAL_ACCESS_TOKEN=

# App
NEXT_PUBLIC_API_URL=http://localhost:8000
PORT=8000
ENVIRONMENT=development
```

- [ ] **Step 4: Verify**

```bash
ls -la ~/.claude/templates/full-stack-saas/
```

Expected: `CLAUDE.md`, `.mcp.json`, `.env.example`

- [ ] **Step 5: Commit**

```bash
cd ~/.claude
git add templates/full-stack-saas/
git commit -m "feat(templates): add full-stack-saas template (Thesis-App pattern)"
```

---

## Task 5: `generic-mvp` template

Minimal baseline. No stack assumptions. MCP is github-only; everything else is opt-in comments.

**Files:**
- Create: `~/.claude/templates/generic-mvp/CLAUDE.md`
- Create: `~/.claude/templates/generic-mvp/.mcp.json`
- Create: `~/.claude/templates/generic-mvp/.env.example`

- [ ] **Step 1: Create `CLAUDE.md`**

Create `~/.claude/templates/generic-mvp/CLAUDE.md`:

```markdown
# CLAUDE.md

## Project Overview

[2-3 sentences describing what this project does, who uses it, what problem it solves.]

## Tech Stack

| Layer | Technology |
|---|---|
| [Layer] | [Technology] |

## Key Directories

```
[annotate your key directories here]
```

## Development Commands

```bash
# [Add your dev/build/test/deploy commands here]
```

## Secrets & Environment

Secrets live in `.env` locally. Never commit `.env`.

```bash
cp .env.example .env
# Fill in values
```

Required env vars: see `.env.example`.

## Active MCP Servers

See `.mcp.json`. Currently: github only.
Add supabase, ssh, context7 as needed — templates in `~/.claude/templates/`.

## Security Rules

See global `~/.claude/CLAUDE.md` Security Rules section.
- No hardcoded credentials
- Validate all user input at system boundaries
- Parameterized queries only
```

- [ ] **Step 2: Create `.mcp.json`**

Create `~/.claude/templates/generic-mvp/.mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

- [ ] **Step 3: Create `.env.example`**

Create `~/.claude/templates/generic-mvp/.env.example`:

```bash
# GitHub MCP
GITHUB_PERSONAL_ACCESS_TOKEN=

# Add project-specific vars below
```

- [ ] **Step 4: Verify**

```bash
ls -la ~/.claude/templates/generic-mvp/
```

Expected: `CLAUDE.md`, `.mcp.json`, `.env.example`

- [ ] **Step 5: Commit**

```bash
cd ~/.claude
git add templates/generic-mvp/
git commit -m "feat(templates): add generic-mvp baseline template"
```

---

## Task 6: `new-repo.sh` scaffold script

**Files:**
- Create: `~/.claude/scripts/new-repo.sh`

- [ ] **Step 1: Write the script**

Create `~/.claude/scripts/new-repo.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

TEMPLATES_DIR="$HOME/.claude/templates"
CODEBASES_DIR="$HOME/Codebases"
VALID_STACKS="contentful-tool python-agent full-stack-saas generic-mvp"

usage() {
  echo "Usage: new-repo.sh <repo-name> <stack-type>"
  echo "       new-repo.sh --patch <path> <stack-type>"
  echo ""
  echo "Stack types: $VALID_STACKS"
  exit 1
}

# Parse args
PATCH_MODE=false
PATCH_PATH=""

if [[ "${1:-}" == "--patch" ]]; then
  PATCH_MODE=true
  PATCH_PATH="${2:-}"
  STACK="${3:-}"
  [[ -z "$PATCH_PATH" || -z "$STACK" ]] && usage
else
  REPO_NAME="${1:-}"
  STACK="${2:-}"
  [[ -z "$REPO_NAME" || -z "$STACK" ]] && usage
fi

# Validate stack
if ! echo "$VALID_STACKS" | grep -qw "$STACK"; then
  echo "Error: unknown stack '$STACK'. Valid: $VALID_STACKS"
  exit 1
fi

STACK_DIR="$TEMPLATES_DIR/$STACK"
SHARED_DIR="$TEMPLATES_DIR/_shared"

if [[ "$PATCH_MODE" == true ]]; then
  TARGET=$(realpath "$PATCH_PATH")
  echo "Patching existing repo: $TARGET"
else
  TARGET="$CODEBASES_DIR/$REPO_NAME"
  echo "Creating new repo: $TARGET"
  mkdir -p "$TARGET"
  cd "$TARGET"
  git init
  git commit --allow-empty -m "chore: initial commit"
fi

cd "$TARGET"

# Copy shared files (skip existing in patch mode)
while IFS= read -r -d '' src; do
  rel="${src#$SHARED_DIR/}"
  dst="$TARGET/$rel"
  if [[ "$PATCH_MODE" == true && -e "$dst" ]]; then
    echo "  skip (exists): $rel"
    continue
  fi
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
  echo "  add: $rel"
done < <(find "$SHARED_DIR" -type f -print0)

# Copy stack-specific files (skip existing in patch mode)
for f in CLAUDE.md .mcp.json .env.example; do
  src="$STACK_DIR/$f"
  dst="$TARGET/$f"
  if [[ ! -f "$src" ]]; then
    echo "  warning: template missing $f"
    continue
  fi
  if [[ "$PATCH_MODE" == true && -e "$dst" ]]; then
    echo "  skip (exists): $f"
    continue
  fi
  cp "$src" "$dst"
  echo "  add: $f"
done

# Ensure docs/superpowers/specs exists
mkdir -p "$TARGET/docs/superpowers/specs"
mkdir -p "$TARGET/docs/superpowers/plans"

# Ensure .cache is gitignored
GITIGNORE="$TARGET/.gitignore"
if [[ ! -f "$GITIGNORE" ]]; then
  touch "$GITIGNORE"
fi
if ! grep -q "^\.cache/$" "$GITIGNORE" 2>/dev/null; then
  cat "$SHARED_DIR/.gitignore-additions" >> "$GITIGNORE"
  echo "  updated: .gitignore"
fi

echo ""
echo "Done. Repo ready at: $TARGET"
echo "Next: cd $TARGET && open -a 'Cursor' ."
```

- [ ] **Step 2: Make executable**

```bash
chmod +x ~/.claude/scripts/new-repo.sh
```

- [ ] **Step 3: Smoke test — create a test repo**

```bash
~/.claude/scripts/new-repo.sh test-governance-repo generic-mvp
```

Expected output:
```
Creating new repo: /Users/<you>/Codebases/test-governance-repo
  add: .gitignore-additions
  add: docs/superpowers/.keep
  add: CLAUDE.md
  add: .mcp.json
  add: .env.example
  updated: .gitignore

Done. Repo ready at: /Users/<you>/Codebases/test-governance-repo
```

- [ ] **Step 4: Verify the test repo**

```bash
ls -la ~/Codebases/test-governance-repo/
ls ~/Codebases/test-governance-repo/docs/superpowers/
cat ~/Codebases/test-governance-repo/.gitignore | grep cache
```

Expected: CLAUDE.md, .mcp.json, .env.example present; docs/superpowers/specs and plans dirs exist; `.cache/` in .gitignore.

- [ ] **Step 5: Test --patch mode**

```bash
mkdir -p /tmp/test-patch-repo && cd /tmp/test-patch-repo && git init
~/.claude/scripts/new-repo.sh --patch /tmp/test-patch-repo python-agent
ls /tmp/test-patch-repo
```

Expected: CLAUDE.md, .mcp.json, .env.example added; no errors.

- [ ] **Step 6: Clean up test repos**

```bash
rm -rf ~/Codebases/test-governance-repo
rm -rf /tmp/test-patch-repo
```

- [ ] **Step 7: Commit**

```bash
cd ~/.claude
git add scripts/new-repo.sh
git commit -m "feat(scripts): add new-repo.sh scaffold script"
```

---

## Task 7: `audit-repo.sh` compliance checker

**Files:**
- Create: `~/.claude/scripts/audit-repo.sh`

- [ ] **Step 1: Write the script**

Create `~/.claude/scripts/audit-repo.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-$(pwd)}"
TARGET=$(realpath "$TARGET")

REQUIRED_SECTIONS=(
  "## Project Overview"
  "## Tech Stack"
  "## Key Directories"
  "## Development Commands"
  "## Secrets"
  "## Active MCP Servers"
  "## Security Rules"
)

SECRET_PATTERNS=(
  "sk-[a-zA-Z0-9]{20,}"
  "Bearer [a-zA-Z0-9._-]{20,}"
  "password\s*=\s*['\"][^'\"]{6,}"
  "api_key\s*=\s*['\"][^'\"]{8,}"
  "ANTHROPIC_API_KEY=[a-zA-Z0-9_-]{20,}"
)

ISSUES=0
pass() { echo "  OK   $1"; }
fail() { echo "  FAIL $1"; ((ISSUES++)) || true; }

echo "Auditing: $TARGET"
echo ""

# 1. CLAUDE.md
CLAUDE_MD="$TARGET/CLAUDE.md"
if [[ ! -f "$CLAUDE_MD" ]]; then
  fail "CLAUDE.md — missing"
else
  FOUND=0
  TOTAL=${#REQUIRED_SECTIONS[@]}
  for section in "${REQUIRED_SECTIONS[@]}"; do
    if grep -q "$section" "$CLAUDE_MD" 2>/dev/null; then
      ((FOUND++)) || true
    fi
  done
  if [[ $FOUND -eq $TOTAL ]]; then
    pass "CLAUDE.md — present ($FOUND/$TOTAL sections)"
  else
    fail "CLAUDE.md — present but incomplete ($FOUND/$TOTAL sections)"
  fi
fi

# 2. .mcp.json
if [[ -f "$TARGET/.mcp.json" ]]; then
  pass ".mcp.json — present"
else
  fail ".mcp.json — missing"
fi

# 3. .env.example
if [[ -f "$TARGET/.env.example" ]]; then
  pass ".env.example — present"
else
  fail ".env.example — missing"
fi

# 4. docs/superpowers
if [[ -d "$TARGET/docs/superpowers" ]]; then
  pass "docs/superpowers/ — present"
else
  fail "docs/superpowers/ — missing"
fi

# 5. .gitignore has .cache/
GITIGNORE="$TARGET/.gitignore"
if [[ -f "$GITIGNORE" ]] && grep -q "\.cache" "$GITIGNORE" 2>/dev/null; then
  pass ".gitignore — .cache/ excluded"
else
  fail ".gitignore — .cache/ not excluded (or .gitignore missing)"
fi

# 6. Secret scan (exclude .env.example and template files)
SECRET_FOUND=false
for pattern in "${SECRET_PATTERNS[@]}"; do
  if grep -rE "$pattern" "$TARGET" \
    --include="*.ts" --include="*.tsx" --include="*.js" \
    --include="*.py" --include="*.json" --include="*.env" \
    --exclude=".env.example" \
    --exclude-dir=".git" --exclude-dir="node_modules" \
    --exclude-dir=".venv" --exclude-dir=".cache" \
    -l 2>/dev/null | grep -q .; then
    SECRET_FOUND=true
    MATCH_FILES=$(grep -rElm 3 "$pattern" "$TARGET" \
      --include="*.ts" --include="*.tsx" --include="*.js" \
      --include="*.py" --include="*.json" --include="*.env" \
      --exclude=".env.example" \
      --exclude-dir=".git" --exclude-dir="node_modules" \
      --exclude-dir=".venv" --exclude-dir=".cache" 2>/dev/null || true)
    fail "secrets scan — possible hardcoded secret (pattern: $pattern) in: $MATCH_FILES"
  fi
done
if [[ "$SECRET_FOUND" == false ]]; then
  pass "secrets scan — clean"
fi

echo ""
echo "─────────────────────────────────────────"
if [[ $ISSUES -eq 0 ]]; then
  echo "All checks passed."
else
  echo "$ISSUES issue(s) found."
  echo "Fix: ~/.claude/scripts/new-repo.sh --patch $TARGET <stack-type>"
  echo "Stack types: contentful-tool | python-agent | full-stack-saas | generic-mvp"
fi
```

- [ ] **Step 2: Make executable**

```bash
chmod +x ~/.claude/scripts/audit-repo.sh
```

- [ ] **Step 3: Test against a bare directory (should fail 5 checks)**

```bash
mkdir -p /tmp/test-bare-repo && cd /tmp/test-bare-repo && git init
~/.claude/scripts/audit-repo.sh /tmp/test-bare-repo
```

Expected output includes 4-5 FAIL lines (CLAUDE.md missing, .mcp.json missing, .env.example missing, docs/superpowers missing, .gitignore missing).

- [ ] **Step 4: Stamp it and re-audit (should pass)**

```bash
~/.claude/scripts/new-repo.sh --patch /tmp/test-bare-repo generic-mvp
~/.claude/scripts/audit-repo.sh /tmp/test-bare-repo
```

Expected: all checks pass.

- [ ] **Step 5: Clean up**

```bash
rm -rf /tmp/test-bare-repo
```

- [ ] **Step 6: Commit**

```bash
cd ~/.claude
git add scripts/audit-repo.sh
git commit -m "feat(scripts): add audit-repo.sh compliance checker"
```

---

## Task 8: Audit existing active repos

Run `audit-repo.sh` against your three active codebases and patch any issues.

**Repos to audit:**
- `~/Codebases/Thesis-App`
- `~/Codebases/-content-graph-main`
- `~/Codebases/vibeship-scanner`

- [ ] **Step 1: Audit Thesis-App**

```bash
~/.claude/scripts/audit-repo.sh ~/Codebases/Thesis-App
```

Note any failures. Thesis-App already has a CLAUDE.md and .mcp.json so expect mostly passes.

- [ ] **Step 2: Patch Thesis-App if needed**

If issues found (missing .env.example, docs/superpowers, etc.):

```bash
~/.claude/scripts/new-repo.sh --patch ~/Codebases/Thesis-App full-stack-saas
~/.claude/scripts/audit-repo.sh ~/Codebases/Thesis-App
```

The `--patch` flag skips existing files so CLAUDE.md and .mcp.json won't be overwritten.

- [ ] **Step 3: Audit content-graph**

```bash
~/.claude/scripts/audit-repo.sh ~/Codebases/-content-graph-main
```

- [ ] **Step 4: Patch content-graph if needed**

```bash
~/.claude/scripts/new-repo.sh --patch ~/Codebases/-content-graph-main contentful-tool
~/.claude/scripts/audit-repo.sh ~/Codebases/-content-graph-main
```

- [ ] **Step 5: Audit vibeship-scanner**

```bash
~/.claude/scripts/audit-repo.sh ~/Codebases/vibeship-scanner
```

- [ ] **Step 6: Patch vibeship-scanner if needed**

Vibeship-scanner is SvelteKit + Supabase — closest match is `python-agent` for the MCP config (has supabase + github + ssh). Use:

```bash
~/.claude/scripts/new-repo.sh --patch ~/Codebases/vibeship-scanner python-agent
~/.claude/scripts/audit-repo.sh ~/Codebases/vibeship-scanner
```

- [ ] **Step 7: Commit patches per repo**

For each patched repo, commit only the new files:

```bash
cd ~/Codebases/Thesis-App
git add .env.example docs/superpowers/   # only new files
git commit -m "chore: add claude governance files (audit compliance)"
```

Repeat for each patched repo.

---

## Self-Review

**Spec coverage check:**
- Template directory structure — covered in Tasks 1-5
- CLAUDE.md 7-section format — covered in Tasks 2-5 (each template has all 7 sections)
- .mcp.json per stack — covered in Tasks 2-5
- .env.example per stack — covered in Tasks 2-5
- `new-repo.sh` with --patch flag — covered in Task 6
- `audit-repo.sh` with all 6 checks — covered in Task 7
- Audit existing repos — covered in Task 8
- Governance rules (source-of-truth, versioning) — enforced by script behavior and git history

**No placeholders:** All CLAUDE.md templates use `[bracketed]` markers for the 2-3 project-specific lines (Project Overview, Tech Stack rows, Key Directories) — these are intentionally left for the user to fill per project. All other sections are complete.

**Type consistency:** Scripts reference `TEMPLATES_DIR`, `SHARED_DIR`, `STACK_DIR` consistently across Tasks 6 and 7.
