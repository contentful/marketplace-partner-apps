#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const DOC_TRIGGER_PREFIXES = [
  "api/tools/",
  "api/review/",
  "api/cron/",
  "api/webhooks/",
  "api/health.ts",
  "api/_shared/config/",
  "api/_shared/tools/",
  "api/_shared/utils/",
  "api/_shared/storage/",
  "public/app/",
  "vercel.json",
  "package.json",
  ".npmrc",
  "docker-compose.enterprise.yml",
];

const CURRENT_STATE_DOCS = [
  "README.md",
  "docs/current/HOW_THE_APP_WORKS.md",
  "docs/current/CLASSIFIER_LOGIC.md",
  "docs/current/TAXONOMY_APP.md",
  "docs/current/CLASSIFIER_OVERVIEW.md",
  "docs/current/CLASSIFIER_TOOL.md",
  "docs/current/ENTERPRISE_VENDOR_SETUP.md",
  "docs/current/CURRENT_RUNTIME_FACTS.md",
];

function gitFiles(args) {
  const output = execFileSync("git", args, { encoding: "utf8" });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function safeGitFiles(args) {
  try {
    return gitFiles(args);
  } catch {
    return [];
  }
}

function hasGitRef(ref) {
  try {
    execFileSync("git", ["rev-parse", "--verify", ref], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getCiChangedFiles() {
  const baseRef = process.env.GITHUB_BASE_REF;
  if (baseRef) {
    for (const ref of [`origin/${baseRef}`, baseRef]) {
      if (!hasGitRef(ref)) continue;
      try {
        const mergeBase = execFileSync("git", ["merge-base", "HEAD", ref], {
          encoding: "utf8",
        }).trim();
        if (mergeBase) {
          return safeGitFiles([
            "diff",
            "--name-only",
            "--diff-filter=ACMR",
            `${mergeBase}...HEAD`,
          ]);
        }
      } catch {
        // Fall through to the next strategy.
      }
    }
  }

  if (hasGitRef("HEAD^")) {
    return safeGitFiles(["diff", "--name-only", "--diff-filter=ACMR", "HEAD^", "HEAD"]);
  }

  return [];
}

function fileMatchesTrigger(file) {
  return DOC_TRIGGER_PREFIXES.some((prefix) => file.startsWith(prefix));
}

const stagedFiles = safeGitFiles([
  "diff",
  "--cached",
  "--name-only",
  "--diff-filter=ACMR",
]);
const workingTreeFiles = safeGitFiles(["diff", "--name-only", "HEAD"]);
const localChangedFiles = [...stagedFiles, ...workingTreeFiles];
const changedFiles = Array.from(
  new Set(localChangedFiles.length > 0 ? localChangedFiles : getCiChangedFiles()),
);

if (changedFiles.length === 0) {
  process.exit(0);
}

const touchesDocTrigger = changedFiles.some(fileMatchesTrigger);
if (!touchesDocTrigger) {
  process.exit(0);
}

const hasCurrentDocChange = changedFiles.some((file) =>
  CURRENT_STATE_DOCS.includes(file),
);

if (!hasCurrentDocChange) {
  console.error(
    "\n[docs-governance] Runtime/config routes changed without a current-state documentation update.",
  );
  console.error("[docs-governance] Add at least one of:");
  for (const file of CURRENT_STATE_DOCS) {
    console.error(`  - ${file}`);
  }
  process.exit(1);
}

console.log("[docs-governance] OK");
