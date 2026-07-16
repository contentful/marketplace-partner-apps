#!/usr/bin/env tsx

import "dotenv/config";
import { createClient } from "@arizeai/phoenix-client";
import {
  createPrompt,
  getPrompt,
  promptVersion,
} from "@arizeai/phoenix-client/prompts";
import {
  CLASSIFIER_FACT_MODEL,
  CLASSIFIER_PROMPT_VERSION,
  CLASSIFIER_SUBJECTIVE_MODEL,
} from "../api/_shared/config/classifierPipeline.js";
import {
  buildFactPrompt,
  buildSubjectivePrompt,
} from "../api/_shared/prompts/classifierPrompts.js";

function resolvePhoenixBaseUrl(): string {
  if (process.env.PHOENIX_HOST) return process.env.PHOENIX_HOST;
  const collector = process.env.PHOENIX_COLLECTOR_ENDPOINT;
  if (collector) return collector.replace(/\/v1\/traces$/, "");
  return "http://127.0.0.1:6006";
}

function buildPromptSections() {
  return {
    contentQualityBlock: "{{contentQualityBlock}}",
    signalBlock: "{{signalBlock}}",
    companyBlock: "{{companyBlock}}",
    contentBlock: "{{contentBlock}}",
    allowedBlock: "{{allowedBlock}}",
    fewShotBlock: "{{fewShotBlock}}",
    assetId: "{{assetId}}",
    contentType: "{{contentType}}",
  };
}

function asMessageTemplate(prompt: string) {
  return [
    {
      role: "user" as const,
      content: prompt,
    },
  ];
}

function samePromptVersion(
  existing: Record<string, unknown> | null,
  params: { modelName: string; promptBody: string; description: string },
): boolean {
  const template = existing?.template as Record<string, unknown> | undefined;
  const messages = template?.messages as Array<Record<string, unknown>> | undefined;
  const existingContent =
    template?.type === "chat"
      ? messages?.[0]?.content
      : undefined;
  return (
    existing?.model_name === params.modelName &&
    existing?.description === params.description &&
    existingContent === params.promptBody
  );
}

async function syncPrompt(params: {
  client: ReturnType<typeof createClient>;
  name: string;
  promptBody: string;
  modelName: string;
  stage: "fact" | "subjective";
}) {
  let existing: Record<string, unknown> | null = null;
  try {
    existing = await getPrompt({
      client: params.client,
      prompt: { name: params.name },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/\b404\b/.test(message)) {
      throw error;
    }
  }
  const description = `${params.stage} stage prompt for classifier version ${CLASSIFIER_PROMPT_VERSION}`;
  if (
    existing &&
    samePromptVersion(existing, {
      modelName: params.modelName,
      promptBody: params.promptBody,
      description,
    })
  ) {
    return {
      name: params.name,
      status: "unchanged",
      versionId: existing.id,
      modelName: params.modelName,
    };
  }

  const created = await createPrompt({
    client: params.client,
    name: params.name,
    description: `Content taxonomy ${params.stage} stage prompt`,
    metadata: {
      classifierPromptVersion: CLASSIFIER_PROMPT_VERSION,
      stage: params.stage,
      repo: "content-graph",
    },
    version: promptVersion({
      description,
      modelProvider: "GOOGLE",
      modelName: params.modelName,
      template: asMessageTemplate(params.promptBody),
      invocationParameters: {
        temperature: 0,
      },
    }),
  });

  return {
    name: params.name,
    status: existing ? "updated" : "created",
    versionId: created.id,
    modelName: params.modelName,
  };
}

async function main() {
  const baseUrl = resolvePhoenixBaseUrl();
  const client = createClient({
    options: {
      baseUrl,
      headers: process.env.PHOENIX_API_KEY
        ? { Authorization: `Bearer ${process.env.PHOENIX_API_KEY}` }
        : undefined,
    },
  });

  const sections = buildPromptSections();
  const factPrompt = buildFactPrompt(sections);
  const subjectivePrompt = buildSubjectivePrompt({
    ...sections,
    factSummaryBlock: "{{factSummaryBlock}}",
  });

  const results = await Promise.all([
    syncPrompt({
      client,
      name: "content-taxonomy-fact-stage",
      promptBody: factPrompt,
      modelName: CLASSIFIER_FACT_MODEL,
      stage: "fact",
    }),
    syncPrompt({
      client,
      name: "content-taxonomy-subjective-stage",
      promptBody: subjectivePrompt,
      modelName: CLASSIFIER_SUBJECTIVE_MODEL,
      stage: "subjective",
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        phoenixBaseUrl: baseUrl,
        classifierPromptVersion: CLASSIFIER_PROMPT_VERSION,
        results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
