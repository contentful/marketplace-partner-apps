# Template v2 — Hardened for MVP — Design Spec

**Date:** 2026-03-27
**Status:** Approved for implementation
**Builds on:** `2026-03-27-claude-repo-governance-template-design.md`

---

## Problem

Template v1 gives new repos structure (CLAUDE.md, .mcp.json, .env.example) but no enforcement.
- CLAUDE.md anti-patterns are prose — Claude follows code blocks better than prose paragraphs
- No CI/CD structure — a new repo has no test gate, no deploy safety, no secrets validation
- No pre-commit hooks — broken code and hardcoded secrets can be committed with zero friction
- No observability guidance — Claude starts each session not knowing how the project logs or traces
- No feedback loops — global hooks detect errors but don't act on them

---

## Goal

Every repo scaffolded from `new-repo.sh` gets:
1. A CLAUDE.md with anti-patterns embedded in code blocks (not prose)
2. A CI workflow with secrets validation gate + test-before-deploy ordering
3. A fast pre-commit hook (<2s) that catches secrets and bad patterns
4. Automatic hook wiring on install/clone (postinstall or Makefile)
5. Hardened global hooks: error-detector writes to `.learnings/`, skill-index auto-rebuilds

Split into 3 independent specs (each ships independently):
- **Spec A** — CLAUDE.md hardening (4 new sections, anti-patterns in code blocks)
- **Spec B** — Starter files (CI workflow, pre-commit hook, auto hook-wiring)
- **Spec C** — Global hook improvements (error-detector, session-end-dump, skill-index rebuild)

---

## Spec A: CLAUDE.md Hardening

### 4 new sections added to all templates

```
## Error Handling Conventions
## Logging
## Observability
## Known Anti-Patterns & Bugs
```

### Anti-pattern format — code blocks not prose

Bad (prose, gets skimmed):
> Always use async_retry_with_backoff for external API calls.

Good (code block, Claude follows):
```python
# CORRECT
result = await async_retry_with_backoff(anthropic_client.messages.create, ...)

# NEVER — bare await with no retry
result = await anthropic_client.messages.create(...)
```

### Per-stack content

**contentful-tool additions:**
- Error handling: try/catch pattern around all Gemini calls, structured catch with field name
- Logging: pino logger, JSON format in prod, human format in dev
- Observability: LangSmith + Phoenix OTEL — add `LANGSMITH_API_KEY` and `PHOENIX_API_KEY` to .env.example
- Anti-patterns:
  - NEVER use `gemini-2.5-flash-lite` or any flash model for `generateObject` — MAX_TOKENS infinite loop
  - NEVER promote LLM-suggested field values without validating against taxonomy enum first
  - NEVER assume `.cache/feedback-corrections.json` exists on a new environment — seed it first
  - Always verify `CONTENTFUL_BOT_USER_ID` is set before deploying webhook handler

**python-agent additions:**
- Error handling: single base exception in `api/utils/error_handler.py` — NEVER create a parallel `errors.py`
- Logging: `logger_config.py` with `setup_logging()` / `get_logger()`, JSON output via `python-json-logger`
- Observability: request-ID middleware (`X-Request-ID` header, injected into every log line)
- Anti-patterns:
  - NEVER call external APIs (Anthropic, Supabase, Voyage) without `async_retry_with_backoff`
  - NEVER use bare `print()` — always `get_logger(__name__).info()`
  - NEVER set `CORS_ORIGINS=*` — always set `FRONTEND_URL` env var explicitly
  - NEVER use `supabase db push` for migrations — always `psql` directly

**full-stack-saas additions:**
- Error handling: FastAPI global handlers + Next.js `error.tsx` in every App Router segment
- Logging: backend JSON logger + frontend Sentry (DSN in env)
- Observability: Sentry for frontend errors, backend request-ID middleware
- Anti-patterns:
  - All of python-agent anti-patterns (FastAPI backend)
  - NEVER put sensitive vars in `NEXT_PUBLIC_` prefix
  - NEVER skip `error.tsx` — every `app/` segment needs one
  - Use `supabase/migrations/` (timestamped) ONLY — never add to `backend/migrations/`
  - Use `getUser()` not `getSession()` server-side

**generic-mvp additions:**
- Minimal: logging placeholder, error handling placeholder, note about observability options
- Anti-patterns: secrets, CORS, parameterized queries — the universal three

---

## Spec B: Starter Files

### New files per stack template

```
~/.claude/templates/<stack>/
  .github/
    workflows/
      ci.yml              ← test gate + deploy with secrets validation
  .githooks/
    pre-commit            ← fast hook: secrets scan + lint check
  package.json (JS stacks) or Makefile (Python stacks)
    ↳ postinstall/setup target wires .githooks automatically
```

### CI workflow structure (`ci.yml`)

```yaml
# All stacks follow this ordering:
validate-secrets → test → deploy

# validate-secrets job:
# - Checks that all required secrets exist
# - Fails fast with a clear message listing missing secrets
# - Required secrets listed as comments at top of file

# test job (needs: validate-secrets):
# - Stack-specific: pytest / npm test / npx tsx
# - Must pass before deploy runs

# deploy job (needs: test):
# - Stack-specific: vercel --prod / docker-compose / etc.
# - Has post-deploy health check step
```

Per-stack CI variants:
- `contentful-tool`: TypeScript compile + golden dataset check + deploy to Vercel
- `python-agent`: pytest + ruff/black check + docker build + VPS deploy via SSH
- `full-stack-saas`: backend pytest + frontend lint/build + Vercel deploy (frontend) + VPS deploy (backend)
- `generic-mvp`: minimal — just lint check + placeholder deploy step

### Pre-commit hook (all stacks, <2s)

Three checks only:
1. Secret pattern scan — `sk-`, `Bearer `, `ANTHROPIC_API_KEY=sk-` in staged files
2. `console.log` in non-test source files (JS/TS stacks)
3. `print(` in non-test Python files (Python stacks)

Full compilation runs in CI only. Local hook is a last-second sanity check, not a full gate.

### Auto hook-wiring

JS/TS stacks (`package.json` addition):
```json
"scripts": {
  "postinstall": "git config core.hooksPath .githooks && echo 'Git hooks wired'"
}
```

Python stacks (`Makefile` addition):
```makefile
setup:
	git config core.hooksPath .githooks
	uv sync
	@echo "Dev environment ready"
```

### `new-repo.sh` update

- Stamp `.github/workflows/ci.yml` and `.githooks/pre-commit` from template
- Run `git config core.hooksPath .githooks` immediately after scaffold
- Make `.githooks/pre-commit` executable (`chmod +x`)
- Print setup checklist at end: required GitHub secrets to create

---

## Spec C: Global Hook Improvements

### 1. `error-detector.sh` — actually write to `.learnings/`

Current: prints advisory to stdout, Claude must act manually.
Fix: when error pattern matches, append structured entry to `.learnings/ERRORS.md` automatically.

```bash
# Auto-append to .learnings/ERRORS.md
mkdir -p .learnings
echo "## $(date '+%Y-%m-%d %H:%M') — $MATCHED_PATTERN" >> .learnings/ERRORS.md
echo "Command output: $CLAUDE_TOOL_OUTPUT" >> .learnings/ERRORS.md
echo "---" >> .learnings/ERRORS.md
```

`.learnings/` added to `_shared/.gitignore-additions` (session-specific, not committed).

### 2. `session-end-dump.py` — save state automatically

Current: prints a checklist reminder. Claude must act to save anything.
Fix: at session end, automatically write a timestamped summary to `.learnings/SESSION_LOG.md`:
- Session date/time
- Working directory
- Last 5 Bash commands run (from `~/.claude/history.jsonl` if available)
- Any errors detected this session (from `.learnings/ERRORS.md`)
- Print the checklist as before (human still reviews)

### 3. `skill-index.json` — auto-rebuild trigger

Current: stale index = wrong skill suggestions, silently.
Fix: add a `PostToolUse(Write)` hook that checks if the written file is under `~/.claude/skills/` and if so runs `~/.claude/scripts/generate-skill-index.sh`.

```json
{
  "PostToolUse": [
    {
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "python3 ~/.claude/scripts/rebuild-skill-index-if-needed.py",
        "timeout": 3
      }]
    }
  ]
}
```

### 4. `health-check.sh` — wire into CI

Current: manually run only.
Fix: call it as the last step of `deploy` job in every CI template. If health check fails, the deploy job fails and GitHub notifies.

---

## Implementation Order

| Spec | Tasks | Dependencies |
|---|---|---|
| A | Expand 4 CLAUDE.md templates | None — content work |
| B | Add CI + hooks + auto-wiring + update new-repo.sh | A should complete first (CI references patterns from CLAUDE.md) |
| C | Fix error-detector, session-end-dump, skill-index hook | None — independent of A/B |

A and C can run in parallel. B depends on A being done.

---

## Success Criteria

- `new-repo.sh my-project full-stack-saas` produces a repo where:
  - CLAUDE.md has 11 sections including error handling, logging, observability, anti-patterns
  - `.github/workflows/ci.yml` exists with validate-secrets → test → deploy ordering
  - `.githooks/pre-commit` exists, is executable, runs in <2s
  - `npm install` / `make setup` auto-wires the hooks
  - First `git commit` with a fake secret fails the pre-commit hook
  - First push to main runs CI, validate-secrets job lists missing secrets clearly
- `audit-repo.sh` updated to check for the 3 new files
- Global hooks: errors auto-logged to `.learnings/`, skill-index rebuilds when skills change
