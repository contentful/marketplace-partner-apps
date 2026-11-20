#!/usr/bin/env node

/**
 * Changelog governance check.
 *
 * When policy files or ADRs change, require a changelog or governance action entry.
 * This ensures every policy/architecture change has an audit trail.
 */

import { execFileSync } from "node:child_process";

const POLICY_TRIGGER_FILES = [
  "api/_shared/config/classifierPolicy.ts",
  "api/_shared/config/classifierPipeline.ts",
  "api/_shared/config/contentTypeProfiles.ts",
  "api/_shared/config/taxonomyDefinition.ts",
  "config/",
];

const ADR_PREFIX = "docs/adr/";

const CHANGELOG_FILES = [
  "docs/governance/CHANGELOG.md",
  "docs/governance/TAXONOMY_GOVERNANCE_ACTIONS.md",
  "docs/governance/BULENT_TRANSCRIPT_POLICY_NOTES.md",
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

const touchesPolicy = changedFiles.some(
  (file) =>
    POLICY_TRIGGER_FILES.some((trigger) => file.startsWith(trigger)) ||
    file.startsWith(ADR_PREFIX),
);

if (!touchesPolicy) {
  process.exit(0);
}

const hasChangelogEntry = changedFiles.some((file) =>
  CHANGELOG_FILES.includes(file),
);

if (!hasChangelogEntry) {
  console.error(
    "\n[changelog-governance] Policy or ADR changed without a governance changelog entry.",
  );
  console.error("[changelog-governance] Add at least one of:");
  for (const file of CHANGELOG_FILES) {
    console.error(`  - ${file}`);
  }
  console.error(
    "\n[changelog-governance] Every policy/architecture change needs an audit trail.",
  );
  process.exit(1);
}

console.log("[changelog-governance] OK");
