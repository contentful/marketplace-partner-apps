#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const checkMode = process.argv.includes("--check");

const CURRENT_DOCS = [
  "README.md",
  "docs/current/HOW_THE_APP_WORKS.md",
  "docs/current/CLASSIFIER_LOGIC.md",
  "docs/current/TAXONOMY_APP.md",
  "docs/current/CLASSIFIER_OVERVIEW.md",
  "docs/current/CLASSIFIER_TOOL.md",
  "docs/current/ENTERPRISE_VENDOR_SETUP.md",
  "docs/current/CURRENT_RUNTIME_FACTS.md",
];

const STALE_PATTERNS = [
  {
    pattern: /api\/cron\/process-classification-queue\.ts/g,
    message: "stale cron file path",
  },
  {
    pattern: /api\/review\/approve\.ts/g,
    message: "stale approve route path",
  },
  {
    pattern: /src\/contentful-app\/sidebar\.html/g,
    message: "stale missing sidebar path",
  },
  {
    pattern: /\bnpm install\b/g,
    message: "stale install command; repo is standardized on npm ci",
  },
  {
    pattern: /no external NLP sidecar call/g,
    message: "stale sidebar/runtime behavior claim",
  },
  {
    pattern: /no dynamic few-shot retrieval/g,
    message: "stale sidebar/runtime behavior claim",
  },
  {
    pattern: /Prospect for broad public TOFU content/g,
    message: "stale audience policy claim",
  },
  {
    pattern: /gemini-2\.0-flash/g,
    message: "stale company lookup model reference",
  },
];

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(projectRoot, relativePath), content);
}

function extractLiteral(source, regex, label) {
  const match = source.match(regex);
  if (!match) {
    throw new Error(`Could not extract ${label}`);
  }
  return match[1];
}

function buildFactsDoc() {
  const classifierPipeline = read("api/_shared/config/classifierPipeline.ts");
  const contentSignals = read("api/_shared/utils/contentSignals.ts");
  const companyCache = read("api/_shared/utils/companyCache.ts");
  const vercelConfig = JSON.parse(read("vercel.json"));
  const packageJson = JSON.parse(read("package.json"));
  const cronSummary = Array.isArray(vercelConfig.crons)
    ? "- " +
      vercelConfig.crons
        .map((c) => `\`${c.schedule}\` → \`${c.path}\``)
        .join("\n- ")
    : "(none)";

  const promptVersion = extractLiteral(
    classifierPipeline,
    /CLASSIFIER_PROMPT_VERSION[\s\S]*?"([^"]+)";/,
    "classifier prompt version",
  );
  const factModel = extractLiteral(
    classifierPipeline,
    /CLASSIFIER_FACT_MODEL[\s\S]*?"([^"]+)";/,
    "fact model",
  );
  const subjectiveModel = extractLiteral(
    classifierPipeline,
    /CLASSIFIER_SUBJECTIVE_MODEL\s*=\s*[\s\S]*?"([^"]+)";/,
    "subjective model",
  );
  const bodySummaryChars = extractLiteral(
    contentSignals,
    /bodyLines\.join\(" "\)\.slice\(0,\s*(\d+)\)/,
    "body summary cap",
  );
  const companySearchModel = extractLiteral(
    companyCache,
    /GEMINI_SEARCH_MODEL\s*\|\|\s*"([^"]+)"/,
    "company search model",
  );
  const installCommand = vercelConfig.installCommand;
  const verifyCommand = packageJson.scripts["verify:classifier"];
  const docsCheckCommand = packageJson.scripts["docs:check"] || "not configured";
  const docsSyncCommand = packageJson.scripts["docs:sync"] || "not configured";

  return `# Current Runtime Facts

> GENERATED FILE. Do not edit manually.
> Update with \`npm run docs:sync\`.

## Install / Verification

- Local install command: \`npm ci\`
- Vercel install command: \`${installCommand}\`
- Classifier verification command: \`npm run verify:classifier\`
- Docs sync command: \`npm run docs:sync\`
- Docs check command: \`npm run docs:check\`

## Vercel Cron (from vercel.json)

${cronSummary}

## Runtime Defaults

- Prompt version: \`${promptVersion}\`
- Fact-stage model default: \`${factModel}\`
- Subjective-stage model default: \`${subjectiveModel}\`
- Company search model default: \`${companySearchModel}\`
- Signal body-summary cap: \`${bodySummaryChars}\` chars

## Canonical Route Files

- Classify route: \`api/tools/[tool]/execute.ts\`
- Review route: \`api/review/[action].ts\`
- Cron route: \`api/cron/[job].ts\`
- Webhook route: \`api/webhooks/contentful-classify.ts\`

## Current Runtime Notes

- The sidebar route uses the real deep-crawl classifier path; it is not a synthetic smoke-test path.
- NLP enrichment and dynamic few-shot retrieval can still run on the interactive path when configured.
- Audience is left blank unless the content has explicit audience evidence.
- Historical / research docs may mention older behavior; use \`docs/current/CLASSIFIER_LOGIC.md\`, \`docs/current/HOW_THE_APP_WORKS.md\`, and this file for the current contract.

## Guardrails

- Pre-commit runs classifier governance plus docs governance checks.
- CI runs \`npm run docs:check\` before the governed classifier verification path.
- Current-state docs should not reference retired single-file route aliases; they should point to the canonical dynamic route files listed above.
`;
}

function checkCurrentDocsForStalePatterns() {
  const failures = [];

  for (const relativePath of CURRENT_DOCS) {
    const absolutePath = path.join(projectRoot, relativePath);
    if (!fs.existsSync(absolutePath)) continue;
    const content = fs.readFileSync(absolutePath, "utf8");

    for (const rule of STALE_PATTERNS) {
      if (rule.pattern.test(content)) {
        failures.push(`${relativePath}: ${rule.message}`);
      }
      rule.pattern.lastIndex = 0;
    }
  }

  return failures;
}

const generatedFacts = buildFactsDoc();
const factsPath = "docs/current/CURRENT_RUNTIME_FACTS.md";
const existingFacts = fs.existsSync(path.join(projectRoot, factsPath))
  ? read(factsPath)
  : null;

if (checkMode) {
  const failures = checkCurrentDocsForStalePatterns();

  if ((existingFacts || "").trimEnd() !== generatedFacts.trimEnd()) {
    failures.push(
      "docs/current/CURRENT_RUNTIME_FACTS.md is out of date. Run `npm run docs:sync`.",
    );
  }

  if (failures.length > 0) {
    console.error("[docs-check] failed");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }

  console.log("[docs-check] OK");
  process.exit(0);
}

write(factsPath, generatedFacts);
console.log(`[docs-sync] updated ${factsPath}`);
