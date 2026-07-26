# Template v2 Spec C — Global Hook Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the 3 global hooks so errors auto-persist to `.learnings/`, session state auto-saves, and the skill-index auto-rebuilds when skill files change.

**Architecture:** 4 independent fixes: (1) `error-detector.sh` gains auto-write to `.learnings/ERRORS.md`; (2) `session-end-dump.py` gains auto-write of session summary to `.learnings/SESSION_LOG.md`; (3) new `rebuild-skill-index-if-needed.py` script checks if written file is under `~/.claude/skills/` and triggers `generate-skill-index.sh`; (4) `~/.claude/settings.json` gets a new `PostToolUse(Write)` hook entry for the skill-index rebuild. Health-check CI wiring is tracked in Spec B — not repeated here.

**Tech Stack:** Bash heredocs (all files are outside Conductor workspace sandbox — use Bash in main session, not Write tool)

---

## File Map

| Action | Path |
|---|---|
| Modify | `~/.codex/skills/self-improving-agent/scripts/error-detector.sh` |
| Modify | `~/.claude/scripts/session-end-dump.py` |
| Create | `~/.claude/scripts/rebuild-skill-index-if-needed.py` |
| Modify | `~/.claude/settings.json` |

---

## Task 1: Fix `error-detector.sh` — auto-write to `.learnings/ERRORS.md`

**Files:**
- Modify: `~/.codex/skills/self-improving-agent/scripts/error-detector.sh`

The current script only prints an advisory to stdout. Claude must act manually. Fix: when an error pattern matches, auto-append a structured entry to `.learnings/ERRORS.md` in the current working directory.

- [ ] **Step 1: Overwrite error-detector.sh with auto-write version**

```bash
cat > /Users/zuhur.ahmed/.codex/skills/self-improving-agent/scripts/error-detector.sh << 'HEREDOC'
#!/bin/bash
# Self-Improvement Error Detector Hook
# Triggers on PostToolUse for Bash to detect command failures
# Reads CLAUDE_TOOL_OUTPUT environment variable

set -e

OUTPUT="${CLAUDE_TOOL_OUTPUT:-}"

ERROR_PATTERNS=(
    "error:"
    "Error:"
    "ERROR:"
    "failed"
    "FAILED"
    "command not found"
    "No such file"
    "Permission denied"
    "fatal:"
    "Exception"
    "Traceback"
    "npm ERR!"
    "ModuleNotFoundError"
    "SyntaxError"
    "TypeError"
    "exit code"
    "non-zero"
)

contains_error=false
matched_pattern=""
for pattern in "${ERROR_PATTERNS[@]}"; do
    if [[ "$OUTPUT" == *"$pattern"* ]]; then
        contains_error=true
        matched_pattern="$pattern"
        break
    fi
done

if [ "$contains_error" = true ]; then
    # Auto-append to .learnings/ERRORS.md in current working directory
    LEARNINGS_DIR="${PWD}/.learnings"
    mkdir -p "$LEARNINGS_DIR"
    ERRORS_FILE="$LEARNINGS_DIR/ERRORS.md"
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
    TRUNCATED_OUTPUT=$(echo "$OUTPUT" | head -20)

    cat >> "$ERRORS_FILE" << EOF

## ${TIMESTAMP} — matched: ${matched_pattern}

\`\`\`
${TRUNCATED_OUTPUT}
\`\`\`

---
EOF

    # Also print advisory to stdout so Claude sees it
    cat << 'ADVISORY'
<error-detected>
A command error was detected and logged to .learnings/ERRORS.md.

If this error required investigation to resolve, add a resolution note:
  echo "Resolution: <what fixed it>" >> .learnings/ERRORS.md

Use the self-improvement skill format: [ERR-YYYYMMDD-XXX]
</error-detected>
ADVISORY
fi
HEREDOC
echo "Exit: $?"
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x /Users/zuhur.ahmed/.codex/skills/self-improving-agent/scripts/error-detector.sh
echo "Exit: $?"
```

- [ ] **Step 3: Verify the auto-write logic**

```bash
# Simulate an error by setting the env var and running the script directly
CLAUDE_TOOL_OUTPUT="Error: command not found" /Users/zuhur.ahmed/.codex/skills/self-improving-agent/scripts/error-detector.sh
echo "Exit: $?"
# Check that the file was written
cat /Users/zuhur.ahmed/conductor/workspaces/-content-graph-main/tianjin/.learnings/ERRORS.md 2>/dev/null || echo "File not found — check PWD"
```

Expected: `.learnings/ERRORS.md` exists and contains an entry with timestamp and "matched: Error:".

- [ ] **Step 4: Clean up test file**

```bash
rm -f /Users/zuhur.ahmed/conductor/workspaces/-content-graph-main/tianjin/.learnings/ERRORS.md
rmdir /Users/zuhur.ahmed/conductor/workspaces/-content-graph-main/tianjin/.learnings 2>/dev/null || true
echo "Cleaned"
```

- [ ] **Step 5: Commit**

```bash
cd /Users/zuhur.ahmed/.codex
git add skills/self-improving-agent/scripts/error-detector.sh 2>/dev/null && git commit -m "feat(hooks): error-detector auto-writes to .learnings/ERRORS.md" 2>/dev/null || echo "skipped"
```

---

## Task 2: Fix `session-end-dump.py` — auto-save session summary

**Files:**
- Modify: `~/.claude/scripts/session-end-dump.py`

The current script only prints a checklist reminder. Fix: at Stop time, auto-write a timestamped summary to `.learnings/SESSION_LOG.md`.

- [ ] **Step 1: Overwrite session-end-dump.py with auto-save version**

```bash
cat > /Users/zuhur.ahmed/.claude/scripts/session-end-dump.py << 'HEREDOC'
#!/usr/bin/env python3
# Session End Dump - Auto-saves session summary + checkpoint reminder
# Triggered on Stop hook when session ends

import sys
import os
from datetime import datetime
from pathlib import Path

# --- Auto-save session summary to .learnings/SESSION_LOG.md ---

cwd = Path(os.getcwd())
learnings_dir = cwd / ".learnings"
session_log = learnings_dir / "SESSION_LOG.md"
errors_file = learnings_dir / "ERRORS.md"

timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

# Collect recent errors if any were logged this session
errors_summary = ""
if errors_file.exists():
    lines = errors_file.read_text().splitlines()
    # Count error entries (each starts with "## ")
    error_count = sum(1 for l in lines if l.startswith("## "))
    if error_count > 0:
        errors_summary = f"\n- Errors logged this session: {error_count} (see .learnings/ERRORS.md)"

# Only write if we're in a project dir (has .git or CLAUDE.md)
is_project = (cwd / ".git").exists() or (cwd / "CLAUDE.md").exists()

if is_project:
    learnings_dir.mkdir(exist_ok=True)
    with open(session_log, "a") as f:
        f.write(f"\n## {timestamp}\n")
        f.write(f"- Working directory: {cwd}\n")
        if errors_summary:
            f.write(errors_summary + "\n")
        f.write("\n---\n")

# --- Print checkpoint reminder to stdout ---

print("""<session-ending>
Session ending. Last chance to persist important state.

**Checkpoint these if valuable:**
- [ ] Incomplete tasks (save to Session_YYYYMMDD entity)
- [ ] Key learnings from this session
- [ ] Files modified (for context restoration)
- [ ] Decisions made (for future reference)
- [ ] Any "aha" moments worth preserving

**Skip checkpoint if:**
- Session was trivial (quick question/answer)
- Already checkpointed after last task
- Nothing new learned

**To checkpoint now:**
Say "checkpoint" before ending, or this context will be lost.
</session-ending>""")
HEREDOC
echo "Exit: $?"
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x /Users/zuhur.ahmed/.claude/scripts/session-end-dump.py
echo "Exit: $?"
```

- [ ] **Step 3: Verify the script runs without error**

```bash
cd /Users/zuhur.ahmed && python3 /Users/zuhur.ahmed/.claude/scripts/session-end-dump.py
echo "Exit: $?"
```

Expected: prints the `<session-ending>` block. No Python errors. If run from a project directory, writes to `.learnings/SESSION_LOG.md`.

- [ ] **Step 4: Commit**

```bash
cd /Users/zuhur.ahmed/.claude
git add scripts/session-end-dump.py 2>/dev/null && git commit -m "feat(hooks): session-end-dump auto-writes to .learnings/SESSION_LOG.md" 2>/dev/null || echo "skipped"
```

---

## Task 3: Create `rebuild-skill-index-if-needed.py`

**Files:**
- Create: `~/.claude/scripts/rebuild-skill-index-if-needed.py`

New script. Reads `CLAUDE_TOOL_INPUT` env var (set by the PostToolUse(Write) hook context) to get the file path that was just written. If it's under `~/.claude/skills/`, triggers `generate-skill-index.sh`.

- [ ] **Step 1: Create the script**

```bash
cat > /Users/zuhur.ahmed/.claude/scripts/rebuild-skill-index-if-needed.py << 'HEREDOC'
#!/usr/bin/env python3
# Skill Index Auto-Rebuild Hook
# Triggered on PostToolUse(Write) — checks if written file is under ~/.claude/skills/
# If yes, re-runs generate-skill-index.sh to keep skill-index.json fresh

import os
import subprocess
import json
from pathlib import Path

SKILLS_DIR = Path.home() / ".claude" / "skills"
GENERATE_SCRIPT = Path.home() / ".claude" / "scripts" / "generate-skill-index.sh"

# CLAUDE_TOOL_INPUT contains the JSON input passed to the Write tool
tool_input_raw = os.environ.get("CLAUDE_TOOL_INPUT", "{}")

try:
    tool_input = json.loads(tool_input_raw)
    written_file = tool_input.get("file_path", "")
except (json.JSONDecodeError, KeyError):
    written_file = ""

if not written_file:
    sys.exit(0)

written_path = Path(written_file).resolve()
skills_path = SKILLS_DIR.resolve()

# Only rebuild if the written file is inside the skills directory
if not str(written_path).startswith(str(skills_path)):
    exit(0)

if not GENERATE_SCRIPT.exists():
    print(f"[skill-index] generate-skill-index.sh not found at {GENERATE_SCRIPT}")
    exit(0)

result = subprocess.run(
    [str(GENERATE_SCRIPT)],
    capture_output=True,
    text=True,
    timeout=5
)

if result.returncode == 0:
    print(f"[skill-index] Rebuilt after write to {written_file}")
else:
    print(f"[skill-index] Rebuild failed: {result.stderr[:200]}")
HEREDOC
echo "Exit: $?"
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x /Users/zuhur.ahmed/.claude/scripts/rebuild-skill-index-if-needed.py
echo "Exit: $?"
```

- [ ] **Step 3: Verify the script runs without errors on a non-skills file**

```bash
CLAUDE_TOOL_INPUT='{"file_path":"/tmp/not-a-skill.txt"}' python3 /Users/zuhur.ahmed/.claude/scripts/rebuild-skill-index-if-needed.py
echo "Exit: $?"
```

Expected: exits silently (no output, exit 0) — file is not under skills dir.

- [ ] **Step 4: Verify the script triggers on a skills file**

```bash
CLAUDE_TOOL_INPUT="{\"file_path\":\"/Users/zuhur.ahmed/.claude/skills/test-skill.md\"}" python3 /Users/zuhur.ahmed/.claude/scripts/rebuild-skill-index-if-needed.py
echo "Exit: $?"
```

Expected: prints `[skill-index] Rebuilt after write to ...` OR `generate-skill-index.sh not found` (if script doesn't exist yet — both are acceptable). No Python traceback.

- [ ] **Step 5: Fix missing import in script**

The script references `sys` without importing it. Fix:

```bash
sed -i '' 's/^import os$/import os\nimport sys/' /Users/zuhur.ahmed/.claude/scripts/rebuild-skill-index-if-needed.py
head -5 /Users/zuhur.ahmed/.claude/scripts/rebuild-skill-index-if-needed.py
```

Expected: lines 1-5 include both `import os` and `import sys`.

- [ ] **Step 6: Commit**

```bash
cd /Users/zuhur.ahmed/.claude
git add scripts/rebuild-skill-index-if-needed.py 2>/dev/null && git commit -m "feat(scripts): add rebuild-skill-index-if-needed.py for auto skill-index updates" 2>/dev/null || echo "skipped"
```

---

## Task 4: Wire `PostToolUse(Write)` hook in `~/.claude/settings.json`

**Files:**
- Modify: `~/.claude/settings.json`

Add a new entry to the `PostToolUse` hooks array that fires `rebuild-skill-index-if-needed.py` when the Write tool is used.

- [ ] **Step 1: Read current PostToolUse hooks array**

```bash
python3 -c "
import json
with open('/Users/zuhur.ahmed/.claude/settings.json') as f:
    s = json.load(f)
hooks = s.get('hooks', {}).get('PostToolUse', [])
print(f'Current PostToolUse hooks count: {len(hooks)}')
for h in hooks:
    print(' matcher:', h.get('matcher', '(none)'), '| commands:', [x.get('command','')[:60] for x in h.get('hooks',[])])
"
```

Expected: 3 existing entries (Skill, Bash, and the catch-all spark observer).

- [ ] **Step 2: Add Write hook via Python (safe JSON manipulation)**

```bash
python3 << 'PYEOF'
import json
from pathlib import Path

settings_path = Path('/Users/zuhur.ahmed/.claude/settings.json')
with open(settings_path) as f:
    settings = json.load(f)

# The new hook entry to add
new_hook = {
    "matcher": "Write",
    "hooks": [
        {
            "type": "command",
            "command": "python3 ~/.claude/scripts/rebuild-skill-index-if-needed.py",
            "timeout": 5,
            "statusMessage": "Checking skill index..."
        }
    ]
}

post_tool_use = settings.setdefault('hooks', {}).setdefault('PostToolUse', [])

# Check if Write matcher already exists
already_exists = any(h.get('matcher') == 'Write' for h in post_tool_use)
if already_exists:
    print("Write hook already exists — skipping")
else:
    # Insert after the Bash entry (index 1), before the catch-all
    bash_idx = next((i for i, h in enumerate(post_tool_use) if h.get('matcher') == 'Bash'), -1)
    insert_at = bash_idx + 1 if bash_idx >= 0 else len(post_tool_use) - 1
    post_tool_use.insert(insert_at, new_hook)
    with open(settings_path, 'w') as f:
        json.dump(settings, f, indent=2)
    print(f"Write hook inserted at position {insert_at}")
    print(f"Total PostToolUse hooks: {len(post_tool_use)}")

PYEOF
echo "Exit: $?"
```

Expected: `Write hook inserted at position 2` (or similar). Exit 0.

- [ ] **Step 3: Verify the hook was written correctly**

```bash
python3 -c "
import json
with open('/Users/zuhur.ahmed/.claude/settings.json') as f:
    s = json.load(f)
hooks = s.get('hooks', {}).get('PostToolUse', [])
print(f'Total PostToolUse hooks: {len(hooks)}')
for h in hooks:
    print(' matcher:', repr(h.get('matcher', '')), '| cmd:', [x.get('command','')[:70] for x in h.get('hooks',[])])
"
```

Expected: 4 total PostToolUse hooks including one with `matcher: "Write"` pointing to `rebuild-skill-index-if-needed.py`.

- [ ] **Step 4: Validate JSON is well-formed**

```bash
python3 -m json.tool /Users/zuhur.ahmed/.claude/settings.json > /dev/null && echo "JSON valid" || echo "JSON INVALID"
```

Expected: `JSON valid`

- [ ] **Step 5: Commit**

```bash
cd /Users/zuhur.ahmed/.claude
git add settings.json 2>/dev/null && git commit -m "feat(hooks): wire PostToolUse(Write) to auto-rebuild skill-index" 2>/dev/null || echo "skipped"
```

---

## Task 5: Add `.learnings/` to `_shared/.gitignore-additions`

**Files:**
- Modify: `~/.claude/templates/_shared/.gitignore-additions`

`.learnings/` is session-specific state that should not be committed. Ensure it's in the shared gitignore baseline so every new repo from a template gets it.

- [ ] **Step 1: Check current content**

```bash
cat /Users/zuhur.ahmed/.claude/templates/_shared/.gitignore-additions
```

- [ ] **Step 2: Add .learnings/ if not already present**

```bash
if grep -q "\.learnings/" /Users/zuhur.ahmed/.claude/templates/_shared/.gitignore-additions; then
    echo ".learnings/ already present — skipping"
else
    echo "" >> /Users/zuhur.ahmed/.claude/templates/_shared/.gitignore-additions
    echo "# Session learnings — auto-written by hooks, not committed" >> /Users/zuhur.ahmed/.claude/templates/_shared/.gitignore-additions
    echo ".learnings/" >> /Users/zuhur.ahmed/.claude/templates/_shared/.gitignore-additions
    echo "Added .learnings/"
fi
```

- [ ] **Step 3: Verify**

```bash
grep "learnings" /Users/zuhur.ahmed/.claude/templates/_shared/.gitignore-additions
```

Expected: `.learnings/` is present.

- [ ] **Step 4: Commit**

```bash
cd /Users/zuhur.ahmed/.claude
git add templates/_shared/.gitignore-additions 2>/dev/null && git commit -m "feat(templates): add .learnings/ to shared gitignore" 2>/dev/null || echo "skipped"
```

---

## Self-Review

**Spec C coverage:**
- error-detector.sh auto-writes to `.learnings/ERRORS.md` — Task 1 ✓
- session-end-dump.py auto-writes to `.learnings/SESSION_LOG.md` — Task 2 ✓
- rebuild-skill-index-if-needed.py script created — Task 3 ✓
- PostToolUse(Write) hook wired in settings.json — Task 4 ✓
- `.learnings/` added to shared gitignore — Task 5 ✓
- health-check.sh CI wiring: covered in Spec B Task 1-4 (post-deploy step in each CI template) — not repeated here ✓

**Placeholder scan:** No TBDs. All bash commands are complete. Python scripts contain the full implementation, not stubs.

**Type consistency:** `CLAUDE_TOOL_INPUT` env var in Task 3 matches the Claude Code hook contract (JSON-encoded tool input). `CLAUDE_TOOL_OUTPUT` in Task 1 matches the existing working pattern in the original error-detector.sh.

**Ordering:** Tasks are independent and can run in parallel except Task 4 which depends on Task 3 existing first.
