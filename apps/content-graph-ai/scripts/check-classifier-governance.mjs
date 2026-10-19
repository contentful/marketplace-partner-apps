#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const CLASSIFIER_RUNTIME_FILES = [
  "api/_shared/tools/classificationTool.ts",
  "api/_shared/prompts/classifierPrompts.ts",
  "api/_shared/utils/contentSignals.ts",
  "api/_shared/utils/confidenceCalibration.ts",
  "api/_shared/utils/companyCache.ts",
  "api/_shared/utils/googleProvider.ts",
  "api/_shared/config/classifierPipeline.ts",
  "scripts/classify-pillar-pages.ts",
];

const POLICY_FILES = [
  "api/_shared/config/classifierPolicy.ts",
  "api/_shared/config/classifierPipeline.ts",
  "api/_shared/prompts/classifierPrompts.ts",
  "seeds/confidence-calibration.json",
];

const DOC_FILES = [
  "docs/current/CLASSIFIER_LOGIC.md",
  "docs/current/HOW_THE_APP_WORKS.md",
  "docs/governance/TAXONOMY_GOVERNANCE_ACTIONS.md",
  "docs/governance/BULENT_TRANSCRIPT_POLICY_NOTES.md",
  "docs/current/ENTERPRISE_VENDOR_SETUP.md",
];

const EVAL_FILES = [
  "scripts/test-classifier.ts",
  "scripts/golden-dataset-check.ts",
  "scripts/calibrate-confidence.ts",
  "tests/golden-signal-fixtures.json",
  "tests/synthetic-research-fixtures.json",
  "seeds/confidence-calibration.json",
];

function getStagedFiles() {
  try {
    const output = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
      { encoding: "utf8" },
    );

    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getWorkingTreeFiles() {
  try {
    const output = execFileSync("git", ["diff", "--name-only", "HEAD"], {
      encoding: "utf8",
    });

    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
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
          return getFilesFromDiff(`${mergeBase}...HEAD`);
        }
      } catch {
        // Fall through to the next strategy.
      }
    }
  }

  if (hasGitRef("HEAD^")) {
    return getFilesFromDiff("HEAD^", "HEAD");
  }

  return [];
}

function getFilesFromDiff(...rangeArgs) {
  try {
    const output = execFileSync(
      "git",
      ["diff", "--name-only", "--diff-filter=ACMR", ...rangeArgs],
      { encoding: "utf8" },
    );

    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function includesAny(files, candidates) {
  return files.some((file) => candidates.includes(file));
}

function printFailure(message, requiredFiles) {
  console.error(`\n[classifier-governance] ${message}`);
  console.error("[classifier-governance] Required companion changes are missing.");
  console.error("[classifier-governance] Add at least one of:");
  for (const file of requiredFiles) {
    console.error(`  - ${file}`);
  }
}

const stagedFiles = getStagedFiles();
const workingTreeFiles = getWorkingTreeFiles();
const localChangedFiles = [...stagedFiles, ...workingTreeFiles];
const changedFiles = Array.from(
  new Set(localChangedFiles.length > 0 ? localChangedFiles : getCiChangedFiles()),
);

if (changedFiles.length === 0) {
  process.exit(0);
}

const touchesClassifierRuntime = includesAny(
  changedFiles,
  CLASSIFIER_RUNTIME_FILES,
);

if (!touchesClassifierRuntime) {
  process.exit(0);
}

const hasPolicyChange = includesAny(changedFiles, POLICY_FILES);
const hasDocChange = includesAny(changedFiles, DOC_FILES);
const hasEvalChange = includesAny(changedFiles, EVAL_FILES);

let failed = false;

if (!hasPolicyChange) {
  printFailure(
    "Classifier runtime changed without a versioned policy/prompt/calibration asset update.",
    POLICY_FILES,
  );
  failed = true;
}

if (!hasDocChange) {
  printFailure(
    "Classifier runtime changed without a documentation update.",
    DOC_FILES,
  );
  failed = true;
}

if (!hasEvalChange) {
  printFailure(
    "Classifier runtime changed without an evaluation or calibration artifact update.",
    EVAL_FILES,
  );
  failed = true;
}

if (failed) {
  console.error(
    "\n[classifier-governance] This hook exists to keep taxonomy and prompt changes enterprise-safe.",
  );
  console.error(
    "[classifier-governance] Runtime logic changes must travel with policy, docs, and eval changes.",
  );
  process.exit(1);
}

console.log("[classifier-governance] OK");
