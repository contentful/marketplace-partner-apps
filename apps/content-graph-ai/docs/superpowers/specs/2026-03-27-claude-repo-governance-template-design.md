# Claude Repo Governance Template System — Design Spec

**Date:** 2026-03-27
**Author:** Zuhur Ahmed
**Status:** Approved for implementation

---

## Problem

Starting a new repo is ad hoc. No standard CLAUDE.md, no pre-configured MCP servers, no consistent
directory structure. Each session Claude has to rediscover the stack, commands, and conventions from
scratch. With 15+ active codebases and more MVPs coming, this compounds into significant lost time.

---

## Goal

A reusable template system that stamps the right Claude config onto any new repo in under 30 seconds,
with an audit tool to bring existing repos up to standard.

---

## Architecture

Everything lives inside `~/.claude/` alongside existing config. No new repo required.

```
~/.claude/
  templates/
    _shared/                    # files that go into EVERY repo
      .gitignore-additions      # .cache/, .env.production.local, etc.
      docs/
        superpowers/            # superpowers skills expect this dir

    contentful-tool/            # Next.js + Vercel + Contentful + Gemini
      CLAUDE.md
      .mcp.json
      .env.example

    python-agent/               # FastAPI + uv + Supabase + Claude/Gemini
      CLAUDE.md
      .mcp.json
      .env.example

    full-stack-saas/            # Next.js + FastAPI + Supabase + Docker (Thesis-App pattern)
      CLAUDE.md
      .mcp.json
      .env.example

    generic-mvp/                # minimal baseline, no stack assumptions
      CLAUDE.md
      .mcp.json
      .env.example

  scripts/
    new-repo.sh                 # scaffold new repos from templates
    audit-repo.sh               # check existing repos for compliance
```

---

## CLAUDE.md Template Structure

Every CLAUDE.md uses the same 7 sections, filled differently per stack:

```
## Project Overview        — 2-3 sentences: what it does, who uses it
## Tech Stack              — table: layer → technology
## Key Directories         — annotated tree
## Development Commands    — copy-paste commands for dev/build/test/deploy
## Secrets & Environment   — how secrets are managed (Doppler pattern)
## Active MCP Servers      — what's in .mcp.json and why
## Security Rules          — link to global CLAUDE.md or inline
```

### Per-stack differences

| Section | contentful-tool | python-agent | full-stack-saas | generic-mvp |
|---|---|---|---|---|
| Stack | Next.js/Vercel/Gemini | FastAPI/uv/Supabase | Next.js+FastAPI+Docker | blank |
| Key commands | `vercel env pull`, `npx tsx scripts/` | `uv run`, `pytest`, `docker-compose` | both | git only |
| Secrets | `.env.production.local` via Vercel | `.env` via Doppler | Doppler + Vercel | `.env` |
| MCP servers | context7, github, supabase | supabase, github, ssh | all of the above | github only |

---

## .mcp.json Template Structure

All `.mcp.json` templates use `${ENV_VAR}` placeholders. The `new-repo.sh` script substitutes
from the environment at stamp time. No secrets are hardcoded.

### contentful-tool
- context7 (library docs)
- github (PRs, issues, search)
- supabase (if DB used)

### python-agent
- supabase (primary DB)
- github (PRs, issues)
- ssh (VPS deployment)

### full-stack-saas
- supabase, github, ssh, memory, gdrive (mirrors Thesis-App .mcp.json)

### generic-mvp
- github only; all others commented out as opt-in

---

## `new-repo.sh` — Scaffold Script

```
Usage: new-repo.sh <repo-name> <stack-type>
       new-repo.sh my-tool contentful-tool
       new-repo.sh my-agent python-agent

Stack types: contentful-tool | python-agent | full-stack-saas | generic-mvp
```

### Execution order

1. Create `~/Codebases/<repo-name>/`
2. `git init` + initial empty commit
3. Copy `~/.claude/templates/_shared/*` → repo root
4. Copy `~/.claude/templates/<stack-type>/CLAUDE.md` → repo root
5. Copy `~/.claude/templates/<stack-type>/.mcp.json` → repo root (substitute `${VAR}` from env)
6. Copy `~/.claude/templates/<stack-type>/.env.example` → `.env.example`
7. Create `docs/superpowers/specs/` directory
8. Create `.cache/` and add to `.gitignore`
9. Print ready message with path

### Optional flags (v1)

- `--patch <path>` — run on an existing repo instead of creating a new one; only adds missing files,
  never overwrites existing ones

### Out of scope for v1

- Supabase project creation (`--with-supabase` flag, future)
- Doppler project creation (`--with-doppler` flag, future)
- GitHub repo creation (use `gh repo create` manually)

---

## `audit-repo.sh` — Compliance Checker

```
Usage: audit-repo.sh [path]
       audit-repo.sh ~/Codebases/Thesis-App
       audit-repo.sh .
```

### Checks

- `CLAUDE.md` exists and contains all 7 required section headings
- `.mcp.json` exists
- `.env.example` exists
- `docs/superpowers/specs/` directory exists
- `.cache/` is listed in `.gitignore`
- No hardcoded secrets (scans for `sk-`, `Bearer `, `password =`, raw API key patterns)

### Output format

```
Auditing: ~/Codebases/my-repo
  CLAUDE.md        OK  (7/7 sections)
  .mcp.json        MISSING
  .env.example     OK
  docs/superpowers MISSING
  .gitignore       OK  (.cache/ excluded)
  secrets scan     OK

2 issues found.
Fix: cd ~/Codebases/my-repo && ~/.claude/scripts/new-repo.sh --patch . python-agent
```

---

## Governance Rules

1. **Templates are source-of-truth for new repos.** Existing repos are not auto-updated.
   Use `audit-repo.sh` to flag drift on demand.

2. **When global CLAUDE.md changes**, update `_shared/` and relevant stack templates at the
   same time. This is a 2-minute task.

3. **`~/.claude/` is already a git repo** (implied by existing structure). Templates are
   versioned automatically. `git log ~/.claude/templates/` shows when templates last changed.

---

## Implementation Order

| Step | Deliverable | Notes |
|---|---|---|
| 1 | 4x CLAUDE.md templates | Biggest ROI — content work |
| 2 | 4x .mcp.json templates | Use existing Thesis-App as reference |
| 3 | `new-repo.sh` | ~50 lines bash |
| 4 | `audit-repo.sh` | ~80 lines bash |
| 5 | Audit existing repos | Run against Thesis-App, content-graph, vibeship-scanner |

---

## Success Criteria

- New repo fully configured (CLAUDE.md + .mcp.json + dir structure) in under 30 seconds
- Audit script correctly identifies all 5 compliance issues on a bare repo
- All existing active repos pass audit after patch run
- No manual CLAUDE.md writing required for any new project in 2026
