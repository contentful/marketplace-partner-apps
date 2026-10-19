# Template v2 Spec B — Starter Files (CI + Hooks + Scaffold Update) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CI workflow, pre-commit hook, and auto hook-wiring to all 4 stack templates; update `new-repo.sh` to stamp and wire them.

**Architecture:** Each template gets `.github/workflows/ci.yml` (validate-secrets → test → deploy) and `.githooks/pre-commit` (<2s secrets/console.log check). JS stacks get `postinstall` in package.json. Python stacks get a `Makefile`. `new-repo.sh` updated to stamp new files, run `git config core.hooksPath .githooks`, and print a secrets setup checklist.

**Tech Stack:** Bash, YAML (GitHub Actions), shell script (pre-commit hook)

---

## File Map

| Action | Path |
|---|---|
| Create | `~/.claude/templates/contentful-tool/.github/workflows/ci.yml` |
| Create | `~/.claude/templates/python-agent/.github/workflows/ci.yml` |
| Create | `~/.claude/templates/full-stack-saas/.github/workflows/ci.yml` |
| Create | `~/.claude/templates/generic-mvp/.github/workflows/ci.yml` |
| Create | `~/.claude/templates/contentful-tool/.githooks/pre-commit` |
| Create | `~/.claude/templates/python-agent/.githooks/pre-commit` |
| Create | `~/.claude/templates/full-stack-saas/.githooks/pre-commit` |
| Create | `~/.claude/templates/generic-mvp/.githooks/pre-commit` |
| Create | `~/.claude/templates/_shared/Makefile` |
| Modify | `~/.claude/scripts/new-repo.sh` |
| Modify | `~/.claude/scripts/audit-repo.sh` |

---

## Task 1: Create CI workflow — `contentful-tool`

**Files:**
- Create: `~/.claude/templates/contentful-tool/.github/workflows/ci.yml`

- [ ] **Step 1: Create directory and write CI file**

```bash
mkdir -p /Users/zuhur.ahmed/.claude/templates/contentful-tool/.github/workflows

cat > /Users/zuhur.ahmed/.claude/templates/contentful-tool/.github/workflows/ci.yml << 'HEREDOC'
# SETUP REQUIRED — create these GitHub repository secrets before this workflow will run:
# VERCEL_TOKEN           — Vercel personal access token
# VERCEL_ORG_ID          — Vercel org/team ID
# VERCEL_PROJECT_ID      — Vercel project ID for this repo
# CONTENTFUL_SPACE_ID    — Contentful space ID
# CONTENTFUL_CDA_TOKEN   — Contentful CDA token (read-only)
# GEMINI_API_KEY         — Google Gemini API key
#
# Optional (for observability jobs):
# LANGSMITH_API_KEY      — LangSmith tracing
# PHOENIX_API_KEY        — Arize Phoenix evals

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate-secrets:
    name: Validate required secrets
    runs-on: ubuntu-latest
    steps:
      - name: Check secrets exist
        run: |
          MISSING=""
          [ -z "${{ secrets.VERCEL_TOKEN }}" ]       && MISSING="$MISSING VERCEL_TOKEN"
          [ -z "${{ secrets.VERCEL_ORG_ID }}" ]      && MISSING="$MISSING VERCEL_ORG_ID"
          [ -z "${{ secrets.VERCEL_PROJECT_ID }}" ]  && MISSING="$MISSING VERCEL_PROJECT_ID"
          [ -z "${{ secrets.CONTENTFUL_SPACE_ID }}" ] && MISSING="$MISSING CONTENTFUL_SPACE_ID"
          [ -z "${{ secrets.GEMINI_API_KEY }}" ]     && MISSING="$MISSING GEMINI_API_KEY"
          if [ -n "$MISSING" ]; then
            echo "Missing required secrets:$MISSING"
            echo "Go to: Settings → Secrets and variables → Actions → New repository secret"
            exit 1
          fi
          echo "All required secrets present"

  test:
    name: Test
    needs: validate-secrets
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Type check
        run: npx tsc --noEmit
      - name: Run tests
        run: npm test --if-present
      - name: Verify classifier (if applicable)
        run: npm run verify:classifier --if-present
        env:
          CONTENTFUL_SPACE_ID: ${{ secrets.CONTENTFUL_SPACE_ID }}
          CONTENTFUL_CDA_TOKEN: ${{ secrets.CONTENTFUL_CDA_TOKEN }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

  deploy:
    name: Deploy to Vercel
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Deploy
        run: npx vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
      - name: Health check
        run: |
          sleep 10
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${{ vars.PRODUCTION_URL }}/api/health" || echo "000")
          echo "Health check status: $STATUS"
          [ "$STATUS" = "200" ] && echo "Deploy healthy" || echo "WARNING: health check returned $STATUS"
        continue-on-error: true
HEREDOC
echo "Exit: $?"
```

- [ ] **Step 2: Verify file exists and has key sections**

```bash
grep -c "validate-secrets\|needs: test\|needs: validate-secrets" \
  /Users/zuhur.ahmed/.claude/templates/contentful-tool/.github/workflows/ci.yml
```

Expected: `3`

---

## Task 2: Create CI workflow — `python-agent`

**Files:**
- Create: `~/.claude/templates/python-agent/.github/workflows/ci.yml`

- [ ] **Step 1: Create directory and write CI file**

```bash
mkdir -p /Users/zuhur.ahmed/.claude/templates/python-agent/.github/workflows

cat > /Users/zuhur.ahmed/.claude/templates/python-agent/.github/workflows/ci.yml << 'HEREDOC'
# SETUP REQUIRED — create these GitHub repository secrets before this workflow will run:
# SUPABASE_PROJECT_REF   — Supabase project reference ID
# SUPABASE_ACCESS_TOKEN  — Supabase personal access token
# ANTHROPIC_API_KEY      — Anthropic API key
# VPS_HOST               — VPS hostname or IP for SSH deployment
# VPS_USER               — VPS SSH username
# VPS_SSH_KEY            — VPS SSH private key (full key contents)
#
# Optional:
# DATABASE_URL           — Direct DB connection string (for integration tests)

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate-secrets:
    name: Validate required secrets
    runs-on: ubuntu-latest
    steps:
      - name: Check secrets exist
        run: |
          MISSING=""
          [ -z "${{ secrets.ANTHROPIC_API_KEY }}" ]      && MISSING="$MISSING ANTHROPIC_API_KEY"
          [ -z "${{ secrets.SUPABASE_PROJECT_REF }}" ]   && MISSING="$MISSING SUPABASE_PROJECT_REF"
          if [ -n "$MISSING" ]; then
            echo "Missing required secrets:$MISSING"
            echo "Go to: Settings → Secrets and variables → Actions → New repository secret"
            exit 1
          fi
          echo "All required secrets present"

  test:
    name: Test
    needs: validate-secrets
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install uv
        run: pip install uv
      - name: Install dependencies
        run: uv sync
      - name: Lint
        run: uv run ruff check . && uv run black --check .
      - name: Run tests
        run: uv run pytest tests/ -v -m "not slow and not integration"

  deploy:
    name: Deploy to VPS
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/app
            git pull origin main
            docker-compose up --build -d
            sleep 5
            curl -sf http://localhost:8000/health && echo "Deploy healthy" || echo "WARNING: health check failed"
HEREDOC
echo "Exit: $?"
```

- [ ] **Step 2: Verify**

```bash
grep -c "validate-secrets\|needs: test\|needs: validate-secrets" \
  /Users/zuhur.ahmed/.claude/templates/python-agent/.github/workflows/ci.yml
```

Expected: `3`

---

## Task 3: Create CI workflow — `full-stack-saas`

**Files:**
- Create: `~/.claude/templates/full-stack-saas/.github/workflows/ci.yml`

- [ ] **Step 1: Create directory and write CI file**

```bash
mkdir -p /Users/zuhur.ahmed/.claude/templates/full-stack-saas/.github/workflows

cat > /Users/zuhur.ahmed/.claude/templates/full-stack-saas/.github/workflows/ci.yml << 'HEREDOC'
# SETUP REQUIRED — create these GitHub repository secrets:
# VERCEL_TOKEN           — Vercel personal access token
# VERCEL_ORG_ID          — Vercel org ID
# VERCEL_PROJECT_ID      — Vercel frontend project ID
# SUPABASE_PROJECT_REF   — Supabase project reference
# SUPABASE_ACCESS_TOKEN  — Supabase personal access token
# ANTHROPIC_API_KEY      — Anthropic API key
# VPS_HOST               — VPS hostname for backend deploy
# VPS_USER               — VPS SSH username
# VPS_SSH_KEY            — VPS SSH private key
# NEXT_PUBLIC_SENTRY_DSN — Sentry DSN for frontend error tracking
# SENTRY_AUTH_TOKEN      — Sentry auth token for source maps

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate-secrets:
    name: Validate required secrets
    runs-on: ubuntu-latest
    steps:
      - name: Check secrets exist
        run: |
          MISSING=""
          [ -z "${{ secrets.VERCEL_TOKEN }}" ]          && MISSING="$MISSING VERCEL_TOKEN"
          [ -z "${{ secrets.ANTHROPIC_API_KEY }}" ]     && MISSING="$MISSING ANTHROPIC_API_KEY"
          [ -z "${{ secrets.SUPABASE_PROJECT_REF }}" ]  && MISSING="$MISSING SUPABASE_PROJECT_REF"
          [ -z "${{ secrets.VPS_HOST }}" ]              && MISSING="$MISSING VPS_HOST"
          if [ -n "$MISSING" ]; then
            echo "Missing required secrets:$MISSING"
            echo "Go to: Settings → Secrets and variables → Actions → New repository secret"
            exit 1
          fi
          echo "All required secrets present"

  test-backend:
    name: Test Backend
    needs: validate-secrets
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install uv
        run: pip install uv
      - working-directory: backend
        run: uv sync
      - name: Lint
        working-directory: backend
        run: uv run ruff check . && uv run black --check .
      - name: Test
        working-directory: backend
        run: uv run pytest tests/ -v -m "not slow and not integration"

  test-frontend:
    name: Test Frontend
    needs: validate-secrets
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - working-directory: frontend
        run: npm ci
      - name: Lint
        working-directory: frontend
        run: npm run lint
      - name: Build
        working-directory: frontend
        run: npm run build
        env:
          NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.NEXT_PUBLIC_SENTRY_DSN }}

  deploy-frontend:
    name: Deploy Frontend
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - working-directory: frontend
        run: npm ci
      - name: Deploy
        working-directory: frontend
        run: npx vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
    name: Deploy Backend
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/app
            git pull origin main
            docker-compose up --build -d backend
            sleep 5
            curl -sf http://localhost:8000/health && echo "Backend healthy" || echo "WARNING: health check failed"
HEREDOC
echo "Exit: $?"
```

- [ ] **Step 2: Verify**

```bash
grep -c "validate-secrets\|needs:" \
  /Users/zuhur.ahmed/.claude/templates/full-stack-saas/.github/workflows/ci.yml
```

Expected: `5` or more (multiple `needs:` entries)

---

## Task 4: Create CI workflow — `generic-mvp`

**Files:**
- Create: `~/.claude/templates/generic-mvp/.github/workflows/ci.yml`

- [ ] **Step 1: Create directory and write CI file**

```bash
mkdir -p /Users/zuhur.ahmed/.claude/templates/generic-mvp/.github/workflows

cat > /Users/zuhur.ahmed/.claude/templates/generic-mvp/.github/workflows/ci.yml << 'HEREDOC'
# SETUP REQUIRED — add your stack-specific secrets here before enabling deploy job.
# Common secrets:
# VERCEL_TOKEN / VPS_SSH_KEY / DATABASE_URL
#
# To add secrets: Settings → Secrets and variables → Actions → New repository secret

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate-secrets:
    name: Validate secrets
    runs-on: ubuntu-latest
    steps:
      - name: Check placeholder
        run: |
          echo "Add your secret validation here."
          echo "Example: [ -z '${{ secrets.MY_SECRET }}' ] && echo 'Missing MY_SECRET' && exit 1"

  test:
    name: Test
    needs: validate-secrets
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: |
          echo "Add your test command here."
          echo "Examples: npm test / pytest tests/ / go test ./..."

  deploy:
    name: Deploy
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: |
          echo "Add your deploy command here."
          echo "Examples: npx vercel deploy --prod / docker-compose up -d / fly deploy"
HEREDOC
echo "Exit: $?"
```

- [ ] **Step 2: Verify**

```bash
grep -c "validate-secrets\|needs: test\|needs: validate-secrets" \
  /Users/zuhur.ahmed/.claude/templates/generic-mvp/.github/workflows/ci.yml
```

Expected: `3`

---

## Task 5: Create pre-commit hooks — all stacks

**Files:**
- Create: `~/.claude/templates/contentful-tool/.githooks/pre-commit`
- Create: `~/.claude/templates/python-agent/.githooks/pre-commit`
- Create: `~/.claude/templates/full-stack-saas/.githooks/pre-commit`
- Create: `~/.claude/templates/generic-mvp/.githooks/pre-commit`

- [ ] **Step 1: Create JS/TS pre-commit hook (used by contentful-tool and full-stack-saas)**

```bash
mkdir -p /Users/zuhur.ahmed/.claude/templates/contentful-tool/.githooks
mkdir -p /Users/zuhur.ahmed/.claude/templates/full-stack-saas/.githooks

for STACK in contentful-tool full-stack-saas; do
cat > /Users/zuhur.ahmed/.claude/templates/$STACK/.githooks/pre-commit << 'HEREDOC'
#!/usr/bin/env bash
# Pre-commit hook — runs in <2s
# Full TypeScript compilation runs in CI only. This catches the most dangerous patterns locally.
set -euo pipefail

STAGED=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

if [ -z "$STAGED" ]; then
  exit 0
fi

FAIL=0

# 1. Secret pattern scan in staged files
SECRET_PATTERNS=("sk-[a-zA-Z0-9]{20,}" "ANTHROPIC_API_KEY=sk-" "Bearer [a-zA-Z0-9._-]{40,}")
for pattern in "${SECRET_PATTERNS[@]}"; do
  MATCHES=$(echo "$STAGED" | xargs grep -lE "$pattern" 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    echo "BLOCKED: Possible hardcoded secret ($pattern) in:"
    echo "$MATCHES"
    FAIL=1
  fi
done

# 2. console.log in non-test TypeScript/JavaScript source files
TS_FILES=$(echo "$STAGED" | grep -E '\.(ts|tsx|js|jsx)$' | grep -v -E '(\.test\.|\.spec\.|__tests__)' || true)
if [ -n "$TS_FILES" ]; then
  CONSOLELOG=$(echo "$TS_FILES" | xargs grep -l "console\.log" 2>/dev/null || true)
  if [ -n "$CONSOLELOG" ]; then
    echo "WARNING: console.log found in non-test source files (use pino logger instead):"
    echo "$CONSOLELOG"
    # Warning only — not blocking. Remove this line to make it blocking:
    # FAIL=1
  fi
fi

if [ $FAIL -eq 1 ]; then
  echo ""
  echo "Pre-commit hook blocked the commit. Fix the issues above and retry."
  exit 1
fi

exit 0
HEREDOC
chmod +x /Users/zuhur.ahmed/.claude/templates/$STACK/.githooks/pre-commit
echo "$STACK pre-commit hook: $?"
done
```

- [ ] **Step 2: Create Python pre-commit hook (python-agent)**

```bash
mkdir -p /Users/zuhur.ahmed/.claude/templates/python-agent/.githooks

cat > /Users/zuhur.ahmed/.claude/templates/python-agent/.githooks/pre-commit << 'HEREDOC'
#!/usr/bin/env bash
# Pre-commit hook — runs in <2s
set -euo pipefail

STAGED=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

if [ -z "$STAGED" ]; then
  exit 0
fi

FAIL=0

# 1. Secret pattern scan
SECRET_PATTERNS=("ANTHROPIC_API_KEY=sk-" "sk-[a-zA-Z0-9]{20,}" "Bearer [a-zA-Z0-9._-]{40,}")
for pattern in "${SECRET_PATTERNS[@]}"; do
  MATCHES=$(echo "$STAGED" | xargs grep -lE "$pattern" 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    echo "BLOCKED: Possible hardcoded secret ($pattern) in:"
    echo "$MATCHES"
    FAIL=1
  fi
done

# 2. print() in non-test Python source files
PY_FILES=$(echo "$STAGED" | grep -E '\.py$' | grep -v -E '(test_|_test\.py|conftest\.py)' || true)
if [ -n "$PY_FILES" ]; then
  PRINTS=$(echo "$PY_FILES" | xargs grep -lnE "^\s*print\(" 2>/dev/null || true)
  if [ -n "$PRINTS" ]; then
    echo "WARNING: print() found in non-test Python files (use get_logger(__name__) instead):"
    echo "$PRINTS"
    # Warning only — not blocking. Remove this line to make it blocking:
    # FAIL=1
  fi
fi

if [ $FAIL -eq 1 ]; then
  echo ""
  echo "Pre-commit hook blocked the commit. Fix the issues above and retry."
  exit 1
fi

exit 0
HEREDOC
chmod +x /Users/zuhur.ahmed/.claude/templates/python-agent/.githooks/pre-commit
echo "python-agent pre-commit: $?"
```

- [ ] **Step 3: Create generic pre-commit hook**

```bash
mkdir -p /Users/zuhur.ahmed/.claude/templates/generic-mvp/.githooks

cat > /Users/zuhur.ahmed/.claude/templates/generic-mvp/.githooks/pre-commit << 'HEREDOC'
#!/usr/bin/env bash
# Pre-commit hook — minimal secret scan
set -euo pipefail

STAGED=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)
[ -z "$STAGED" ] && exit 0

FAIL=0
SECRET_PATTERNS=("sk-[a-zA-Z0-9]{20,}" "ANTHROPIC_API_KEY=sk-" "Bearer [a-zA-Z0-9._-]{40,}")
for pattern in "${SECRET_PATTERNS[@]}"; do
  MATCHES=$(echo "$STAGED" | xargs grep -lE "$pattern" 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    echo "BLOCKED: Possible hardcoded secret in: $MATCHES"
    FAIL=1
  fi
done

[ $FAIL -eq 1 ] && echo "Fix secrets and retry." && exit 1
exit 0
HEREDOC
chmod +x /Users/zuhur.ahmed/.claude/templates/generic-mvp/.githooks/pre-commit
echo "generic-mvp pre-commit: $?"
```

- [ ] **Step 4: Verify all 4 hooks are executable**

```bash
for STACK in contentful-tool python-agent full-stack-saas generic-mvp; do
  f="/Users/zuhur.ahmed/.claude/templates/$STACK/.githooks/pre-commit"
  [ -x "$f" ] && echo "$STACK: OK" || echo "$STACK: MISSING or not executable"
done
```

Expected: all 4 print `OK`.

---

## Task 6: Create auto hook-wiring files

**Files:**
- Create: `~/.claude/templates/_shared/Makefile` (for Python stacks)

The JS/TS stacks need a `package.json` with `postinstall` — but stamping a full `package.json` is too aggressive (new repos will have their own). Instead, add a `Makefile` to `_shared` that works for all stacks, and add a note in CLAUDE.md about running `make setup` after cloning. The `new-repo.sh` script handles wiring on initial scaffold.

- [ ] **Step 1: Create shared Makefile**

```bash
cat > /Users/zuhur.ahmed/.claude/templates/_shared/Makefile << 'HEREDOC'
# Development setup — run once after cloning
.PHONY: setup hooks

setup: hooks
	@echo "Dev environment ready."
	@echo "Next steps:"
	@echo "  1. Copy .env.example to .env and fill in values"
	@echo "  2. Add GitHub repository secrets (see .github/workflows/ci.yml header)"

hooks:
	git config core.hooksPath .githooks
	chmod +x .githooks/pre-commit 2>/dev/null || true
	@echo "Git hooks wired (.githooks/pre-commit active)"
HEREDOC
echo "Makefile: $?"
```

- [ ] **Step 2: Verify**

```bash
cat /Users/zuhur.ahmed/.claude/templates/_shared/Makefile
```

Expected: shows `setup` and `hooks` targets.

---

## Task 7: Update `new-repo.sh`

**Files:**
- Modify: `~/.claude/scripts/new-repo.sh`

- [ ] **Step 1: Read current script**

```bash
cat /Users/zuhur.ahmed/.claude/scripts/new-repo.sh
```

- [ ] **Step 2: Replace with updated version**

The updated script adds: stamp `.github/workflows/ci.yml`, stamp `.githooks/pre-commit`, run `git config core.hooksPath .githooks`, print secrets checklist at end.

```bash
cat > /Users/zuhur.ahmed/.claude/scripts/new-repo.sh << 'HEREDOC'
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

# Copy CI workflow (skip if exists in patch mode)
CI_SRC="$STACK_DIR/.github/workflows/ci.yml"
CI_DST="$TARGET/.github/workflows/ci.yml"
if [[ -f "$CI_SRC" ]]; then
  if [[ "$PATCH_MODE" == true && -e "$CI_DST" ]]; then
    echo "  skip (exists): .github/workflows/ci.yml"
  else
    mkdir -p "$TARGET/.github/workflows"
    cp "$CI_SRC" "$CI_DST"
    echo "  add: .github/workflows/ci.yml"
  fi
fi

# Copy pre-commit hook (skip if exists in patch mode)
HOOK_SRC="$STACK_DIR/.githooks/pre-commit"
HOOK_DST="$TARGET/.githooks/pre-commit"
if [[ -f "$HOOK_SRC" ]]; then
  if [[ "$PATCH_MODE" == true && -e "$HOOK_DST" ]]; then
    echo "  skip (exists): .githooks/pre-commit"
  else
    mkdir -p "$TARGET/.githooks"
    cp "$HOOK_SRC" "$HOOK_DST"
    chmod +x "$HOOK_DST"
    echo "  add: .githooks/pre-commit (executable)"
  fi
fi

# Wire git hooks
git -C "$TARGET" config core.hooksPath .githooks 2>/dev/null && echo "  wired: git hooks (.githooks/)" || true

# Ensure docs/superpowers dirs
mkdir -p "$TARGET/docs/superpowers/specs"
mkdir -p "$TARGET/docs/superpowers/plans"

# Ensure .cache is gitignored
GITIGNORE="$TARGET/.gitignore"
if [[ ! -f "$GITIGNORE" ]]; then
  touch "$GITIGNORE"
fi
if ! grep -q "\.cache" "$GITIGNORE" 2>/dev/null; then
  cat "$SHARED_DIR/.gitignore-additions" >> "$GITIGNORE"
  echo "  updated: .gitignore"
fi

echo ""
echo "Done. Repo ready at: $TARGET"
echo ""
echo "Next steps:"
echo "  1. cd $TARGET"
echo "  2. cp .env.example .env && fill in values"
echo "  3. Add GitHub secrets listed in .github/workflows/ci.yml header"
echo "  4. make setup  (re-wires hooks after any future clone)"
echo "  5. open -a 'Cursor' ."
HEREDOC
chmod +x /Users/zuhur.ahmed/.claude/scripts/new-repo.sh
echo "new-repo.sh updated: $?"
```

- [ ] **Step 3: Smoke test — create test repo**

```bash
~/.claude/scripts/new-repo.sh test-v2-repo generic-mvp 2>&1
```

Expected output includes:
- `add: .github/workflows/ci.yml`
- `add: .githooks/pre-commit (executable)`
- `wired: git hooks (.githooks/)`
- `Next steps:` section at end

- [ ] **Step 4: Verify test repo structure**

```bash
ls /Users/zuhur.ahmed/Codebases/test-v2-repo/.github/workflows/
ls /Users/zuhur.ahmed/Codebases/test-v2-repo/.githooks/
git -C /Users/zuhur.ahmed/Codebases/test-v2-repo config core.hooksPath
```

Expected: `ci.yml` present, `pre-commit` present, `core.hooksPath` = `.githooks`

- [ ] **Step 5: Test pre-commit hook fires**

```bash
cd /Users/zuhur.ahmed/Codebases/test-v2-repo
echo 'ANTHROPIC_API_KEY=sk-ant-supersecretkey12345678901234567890' > test-secret.txt
git add test-secret.txt
git commit -m "test commit with secret"
```

Expected: commit BLOCKED with `BLOCKED: Possible hardcoded secret` message.

- [ ] **Step 6: Clean up**

```bash
rm -rf /Users/zuhur.ahmed/Codebases/test-v2-repo
```

- [ ] **Step 7: Commit**

```bash
cd /Users/zuhur.ahmed/.claude
git add scripts/new-repo.sh 2>/dev/null && git commit -m "feat(scripts): update new-repo.sh to stamp CI + hooks + auto-wire" 2>/dev/null || echo "skipped"
```

---

## Task 8: Update `audit-repo.sh` to check for CI and hook files

**Files:**
- Modify: `~/.claude/scripts/audit-repo.sh`

- [ ] **Step 1: Add two new checks to audit script**

```bash
python3 << 'PYEOF'
path = '/Users/zuhur.ahmed/.claude/scripts/audit-repo.sh'
with open(path) as f:
    content = f.read()

# Add CI and hook checks before the secrets scan section
new_checks = '''
# 7. .github/workflows/ci.yml
if [[ -f "$TARGET/.github/workflows/ci.yml" ]]; then
  pass ".github/workflows/ci.yml — present"
else
  fail ".github/workflows/ci.yml — missing"
fi

# 8. .githooks/pre-commit
if [[ -f "$TARGET/.githooks/pre-commit" && -x "$TARGET/.githooks/pre-commit" ]]; then
  pass ".githooks/pre-commit — present and executable"
else
  fail ".githooks/pre-commit — missing or not executable"
fi

'''

# Insert before the secrets scan section
insert_before = '# 6. Secret scan'
if insert_before in content:
    with open(path, 'w') as f:
        f.write(content.replace(insert_before, new_checks + insert_before))
    print("Updated successfully")
else:
    print("ERROR: insertion point not found")
    print([l for l in content.split('\n') if 'Secret' in l or 'secret' in l])
PYEOF
```

- [ ] **Step 2: Verify**

```bash
grep -c "ci.yml\|pre-commit" /Users/zuhur.ahmed/.claude/scripts/audit-repo.sh
```

Expected: `4` or more (each check has 2 lines referencing the file)

- [ ] **Step 3: Commit**

```bash
cd /Users/zuhur.ahmed/.claude
git add scripts/audit-repo.sh 2>/dev/null && git commit -m "feat(scripts): audit-repo.sh checks for CI workflow and pre-commit hook" 2>/dev/null || echo "skipped"
```

---

## Self-Review

**Spec B coverage:**
- CI workflow per stack with validate-secrets → test → deploy — Tasks 1-4 ✓
- Pre-commit hook per stack (<2s, secrets + print/console.log) — Task 5 ✓
- Auto hook-wiring (Makefile in _shared, new-repo.sh wires on scaffold) — Tasks 6-7 ✓
- audit-repo.sh updated for CI and hook checks — Task 8 ✓

**Placeholder scan:** Tasks 1-4 have placeholder deploy steps intentionally (CI is a template, deploy target varies per project). Task 4 (generic-mvp) is intentionally minimal with `echo` stubs — these are template placeholders, not plan failures.

**Type consistency:** All scripts use `STACK_DIR`, `SHARED_DIR`, `TARGET` variables consistently with Spec A plan.
