import { z } from "zod";
import type { Logger } from "../types.js";
import { PIIScrubber } from "../utils/piiScrubber.js";
import { fetchContentfulAssets } from "./contentfulTool.js";
import { createContentfulManagementClient } from "../utils/contentfulManagementClient.js";
import {
  classifyContent,
  type AllowedTaxonomyLabels,
} from "./classificationTool.js";
import { CONTENTFUL_REVIEW_TAG_ID } from "../config/classifierPipeline.js";
import {
  getAllowedTaxonomyLabels,
  keepNonTargetSchemeConcepts,
  loadOrganizationTaxonomy,
  resolveBestConceptId,
  resolveConceptIds,
  toConceptLinks,
} from "./contentfulTaxonomyTool.js";
import {
  ensureContentTypeWritebackFields,
  ensureOrganizationTaxonomy,
} from "../utils/contentfulProvisioning.js";

// Schema for content classification data that will be displayed in the Contentful App
export const ContentClassificationSchema = z.object({
  entryId: z.string(),
  title: z.string(),
  contentType: z.string(),
  classification: z.object({
    assetType: z.object({ value: z.string(), confidence: z.number() }),
    assetSubType: z.object({
      value: z.array(z.string()),
      confidence: z.number(),
    }),
    product: z.object({ value: z.array(z.string()), confidence: z.number() }),
    jobLevel: z.object({ value: z.array(z.string()), confidence: z.number() }),
    jobFunction: z.object({
      value: z.array(z.string()),
      confidence: z.number(),
    }),
    audience: z.object({ value: z.array(z.string()), confidence: z.number() }),
    topic: z.object({ value: z.array(z.string()), confidence: z.number() }),
    useCases: z.object({ value: z.array(z.string()), confidence: z.number() }),
    funnelStage: z.object({ value: z.string(), confidence: z.number() }),
    industry: z.object({ value: z.array(z.string()), confidence: z.number() }),
    companySize: z.object({
      value: z.array(z.string()),
      confidence: z.number(),
    }),
    region: z.object({ value: z.array(z.string()), confidence: z.number() }),
    event: z
      .object({
        value: z.string().optional(),
        confidence: z.number().optional(),
      })
      .optional(),
    eventType: z
      .object({
        value: z.string().optional(),
        confidence: z.number().optional(),
      })
      .optional(),
    season: z
      .object({
        value: z.string().optional(),
        confidence: z.number().optional(),
      })
      .optional(),
    yearPublished: z
      .object({
        value: z.string().optional(),
        confidence: z.number().optional(),
      })
      .optional(),
    usageRights: z.object({ value: z.string(), confidence: z.number() }),
  }),
  competitivePositioning: z
    .object({
      mentionsCompetitors: z.boolean(),
      competitorNames: z.array(z.string()).optional(),
      competitorCategories: z.array(z.string()).optional(),
      positioningType: z.string().optional(),
    })
    .optional(),
  recommendedActions: z
    .array(
      z.object({
        action: z.string(),
        priority: z.enum(["high", "medium", "low"]),
        reason: z.string(),
      }),
    )
    .optional(),
  lastClassified: z.string(),
  needsReview: z.boolean(),
  reasoning: z.string().optional(),
});

export type ContentClassification = z.infer<typeof ContentClassificationSchema>;

function normalizeScalar(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
}

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeScalar(item))
    .filter((item): item is string => Boolean(item));
}

function setEntryField(params: {
  entry: { fields: Record<string, Record<string, unknown>> };
  fieldIds: Set<string>;
  fieldId: string;
  locale: string;
  value: unknown;
  updatedFields: string[];
}) {
  if (!params.fieldIds.has(params.fieldId)) return;
  if (params.value === undefined) return;

  params.entry.fields = params.entry.fields || {};
  params.entry.fields[params.fieldId] =
    params.entry.fields[params.fieldId] || {};

  const previousValue = params.entry.fields[params.fieldId][params.locale];
  const nextSerialized = JSON.stringify(params.value);
  const previousSerialized = JSON.stringify(previousValue);
  if (nextSerialized === previousSerialized) return;

  params.entry.fields[params.fieldId][params.locale] = params.value;
  params.updatedFields.push(params.fieldId);
}

export async function getContentClassificationsForApp(params: {
  entryIds?: string[];
  limit?: number;
  contentType?: string;
  runId?: string;
  spaceId?: string; // Added for dynamic space support
  environmentId?: string; // Added for dynamic environment support
  logger?: Logger;
}) {
  const {
    entryIds,
    limit = 20,
    contentType,
    runId,
    logger,
    spaceId,
    environmentId,
  } = params;

  logger?.info(
    "🔧 [ContentfulAppTool] Getting classifications for Contentful App",
    {
      entryIds: entryIds?.length || "all",
      limit,
      contentType,
      runId,
    },
  );

  try {
    // Initialize Contentful client
    let environmentClient: {
      getEntry(id: string): Promise<unknown>;
    } | null = null;
    let allowedLabels: AllowedTaxonomyLabels | undefined;
    type SpaceObj = {
      name?: string;
      sys?: { organization?: { sys?: { id?: string } } };
      getEnvironment(id: string): Promise<typeof environmentClient>;
    };
    try {
      let spaceObj: SpaceObj | null = null;
      const effectiveSpaceId = spaceId || process.env.CONTENTFUL_SPACE_ID!;
      const effectiveEnvId =
        environmentId ||
        process.env.CONTENTFUL_ENV_ID ||
        process.env.CONTENTFUL_ENVIRONMENT_ID ||
        "master";
      const MGMT_TOKEN =
        process.env.CONTENTFUL_MANAGEMENT_TOKEN ||
        process.env.CONTENTFUL_ACCESS_TOKEN;
      if (effectiveSpaceId && MGMT_TOKEN) {
        const client = await createContentfulManagementClient(MGMT_TOKEN) as {
          getSpace(id: string): Promise<SpaceObj>;
        };
        spaceObj = await client.getSpace(effectiveSpaceId);
        environmentClient = await spaceObj.getEnvironment(
          effectiveEnvId as string,
        );

        const orgId = spaceObj?.sys?.organization?.sys?.id as
          | string
          | undefined;
        if (orgId) {
          allowedLabels = await getAllowedTaxonomyLabels({
            orgId,
            token: MGMT_TOKEN,
            logger,
          });
        }
      }
    } catch {
      logger?.warn(
        "⚠️ [ContentfulAppTool] Could not initialize Contentful client; entry-id lookup and field reuse will be skipped",
      );
    }

    const classifications: ContentClassification[] = [];
    const diagnostics: Array<Record<string, unknown>> = [];

    // Build assets to classify
    let assetsToClassify: Array<{
      id: string;
      title?: string;
      contentType: string;
      textContent: string;
    }>;
    if (entryIds && entryIds.length > 0 && environmentClient) {
      // Directly fetch specific entries by ID
      const { extractTextContent } = await import("./contentfulTool.js");
      const ids = Array.from(new Set(entryIds)).slice(0, limit);
      const tmp: Array<{
        id: string;
        title?: string;
        contentType: string;
        textContent: string;
      }> = [];
      for (const id of ids) {
        try {
          const entry = (await environmentClient.getEntry(id)) as {
            sys: { id: string; contentType?: { sys?: { id?: string } } };
            fields: Record<string, Record<string, unknown>>;
          };
          const contentTypeId = entry?.sys?.contentType?.sys?.id || "unknown";
          if (contentType && contentTypeId !== contentType) continue; // respect filter if provided
          const textContent = extractTextContent(
            entry.fields || {},
            contentTypeId,
            logger,
          );
          const rawTitle =
            entry.fields?.["title"]?.["en-US"] ||
            entry.fields?.["name"]?.["en-US"] ||
            id;
          const { scrubbedContent } = PIIScrubber.scrubContent(
            String(rawTitle || ""),
          );
          tmp.push({
            id,
            title: scrubbedContent,
            contentType: contentTypeId,
            textContent,
          });
        } catch {
          logger?.warn(
            "⚠️ [ContentfulAppTool] Could not fetch entry by ID; skipping",
            { entryId: id },
          );
        }
      }
      assetsToClassify = tmp;
    } else {
      // Fall back to list fetch
      const fetchResult = await fetchContentfulAssets({
        limit,
        skip: 0,
        contentTypes: contentType ? [contentType] : undefined,
        logger,
      });
      assetsToClassify = entryIds
        ? fetchResult.assets.filter((asset) =>
            (entryIds as string[]).includes(asset.id),
          )
        : fetchResult.assets.slice(0, limit);
    }

    logger?.info("📝 [ContentfulAppTool] Classifying content for App display", {
      assetsToProcess: assetsToClassify.length,
    });

    // Classify each asset and format for the App
    for (const asset of assetsToClassify) {
      try {
        // reuse existing AI fields check REMOVED for simplicity during migration to new taxonomy
        // (Assume we always want to re-classify or the old fields don't match new schema anyway)

        const t0 = Date.now();
        const classificationResult = await classifyContent({
          asset,
          logger,
          allowedLabels,
        });
        const ms = Date.now() - t0;

        // Map to App format
        const classificationData = {
          assetType: classificationResult.assetType,
          assetSubType: classificationResult.assetSubType,
          schemaType: classificationResult.schemaType,
          product: classificationResult.product,
          jobLevel: classificationResult.jobLevel,
          jobFunction: classificationResult.jobFunction,
          audience: classificationResult.audience,
          topic: classificationResult.topic,
          useCases: classificationResult.useCases,
          funnelStage: classificationResult.funnelStage,
          industry: classificationResult.industry,
          companySize: classificationResult.companySize,
          region: classificationResult.region,
          language: classificationResult.language,
          event: classificationResult.event,
          eventType: classificationResult.eventType,
          season: classificationResult.season,
          yearPublished: classificationResult.yearPublished,
          usageRights: classificationResult.usageRights,
        };

        const confidences = [
          classificationResult.assetType.confidence,
          classificationResult.funnelStage.confidence,
          classificationResult.usageRights.confidence,
        ];
        const uniform = confidences.every((c) => c === confidences[0]);

        diagnostics.push({
          entryId: asset.id,
          runId,
          source: "model",
          uniformConfidences: uniform,
          confidences,
          timings: { ms },
          request: {
            resourceId: "app-classification",
            titleLen: (asset.title || "").length,
            textLen: (asset.textContent || "").length,
            scrubbedPreview: PIIScrubber.scrubContent(
              asset.textContent.slice(0, 160),
            ).scrubbedContent,
          },
          response: { parsedOk: true },
        });

        const classification: ContentClassification = {
          entryId: asset.id,
          title: asset.title || "Untitled",
          contentType: asset.contentType,
          classification: classificationData as unknown as ContentClassification["classification"],
          competitivePositioning: classificationResult.competitivePositioning,
          recommendedActions: (classificationResult as Record<string, unknown>).recommendedActions as ContentClassification["recommendedActions"],
          lastClassified: new Date().toISOString(),
          needsReview: classificationResult.needsReview || false,
          reasoning: classificationResult.reasoning,
        };

        classifications.push(classification);

        logger?.info("✅ [ContentfulAppTool] Classified content for App", {
          entryId: asset.id,
          needsReview: classification.needsReview,
          avgConfidence: classificationResult.overallConfidence,
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        logger?.error("❌ [ContentfulAppTool] Error classifying content", {
          error:
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : error,
          entryId: asset.id,
        });

        // Fallback
        diagnostics.push({
          entryId: asset.id,
          runId,
          source: "error",
          request: {
            resourceId: "app-classification",
            titleLen: (asset.title || "").length,
            textLen: (asset.textContent || "").length,
          },
          response: { parsedOk: false, parseError: errMsg },
        });
      }
    }

    const summary = `Generated ${classifications.length} classifications for Contentful App display. ${classifications.filter((c) => c.needsReview).length} need human review.`;

    return {
      classifications,
      total: classifications.length,
      summary,
      timestamp: new Date().toISOString(),
      diagnostics,
    };
  } catch (error) {
    logger?.error(
      "❌ [ContentfulAppTool] Error getting classifications for App",
      {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      },
    );
    throw new Error(
      `Failed to get classifications for Contentful App: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function updateContentfulEntryWithClassification(params: {
  entryId: string;
  classification: Record<
    string,
    { value?: unknown; confidence?: number } | null | undefined
  > & { needsReview?: boolean; competitivePositioning?: unknown };
  locale?: string;
  spaceId?: string;
  environmentId?: string;
  publish?: boolean;
  writeFields?: boolean;
  applyConcepts?: boolean;
  logger?: Logger;
  lastClassifiedAt?: string;
}) {
  const {
    entryId,
    classification,
    locale,
    lastClassifiedAt,
    spaceId,
    environmentId,
    publish,
    writeFields = true,
    applyConcepts = true,
    logger,
  } = params;

  logger?.info(
    "🔧 [ContentfulAppTool] Updating Contentful entry with classification",
    {
      entryId,
    },
  );

  // Determine target locale for writing fields
  const loc =
    (locale as string) || process.env.CONTENTFUL_DEFAULT_LOCALE || "en-US";

  try {
    // Initialize Contentful Management API client
    const SPACE_ID = spaceId || process.env.CONTENTFUL_SPACE_ID!;
    const ENV_ID =
      environmentId ||
      process.env.CONTENTFUL_ENV_ID ||
      process.env.CONTENTFUL_ENVIRONMENT_ID ||
      "master";
    const MGMT_TOKEN =
      process.env.CONTENTFUL_MANAGEMENT_TOKEN ||
      process.env.CONTENTFUL_ACCESS_TOKEN;
    if (!MGMT_TOKEN) {
      throw new Error(
        "Missing Contentful management token. Set CONTENTFUL_MANAGEMENT_TOKEN or CONTENTFUL_ACCESS_TOKEN.",
      );
    }
    type CmaEntry = {
      sys: {
        contentType?: { sys?: { id?: string } };
        publishedVersion?: number;
      };
      fields: Record<string, Record<string, unknown>>;
      metadata?: {
        tags?: { sys: { id: string; type?: string; linkType?: string } }[];
        concepts?: { sys: { id: string; type: string; linkType: string } }[];
      };
      update(): Promise<CmaEntry>;
      publish(): Promise<CmaEntry>;
    };
    type CmaEnvironment = {
      getEntry(id: string): Promise<CmaEntry>;
      getContentType(id: string): Promise<{ fields: { id: string }[] }>;
    };
    type CmaSpace = {
      sys?: { organization?: { sys?: { id?: string } } };
      getEnvironment(id: string): Promise<CmaEnvironment>;
    };
    const client = (await createContentfulManagementClient(MGMT_TOKEN)) as {
      getSpace(id: string): Promise<CmaSpace>;
    };

    const space = await client.getSpace(SPACE_ID);
    const environment = await space.getEnvironment(ENV_ID as string);

    // Get the entry
    let entry = await environment.getEntry(entryId);
    const wasPublished = !!(
      entry?.sys as Record<string, unknown> | undefined
    )?.["publishedVersion"];
    const contentTypeId = entry?.sys?.contentType?.sys?.id;
    let fieldProvisioning = {
      ensured: false,
      createdFieldIds: [] as string[],
      fieldIds: new Set<string>(),
    };
    if (contentTypeId) {
      const contentType = await environment.getContentType(contentTypeId);
      fieldProvisioning = {
        ...fieldProvisioning,
        fieldIds: new Set<string>(
          contentType.fields.map(
            (field: { id: string }) => field.id,
          ),
        ),
      };
      if (writeFields) {
        try {
          fieldProvisioning = await ensureContentTypeWritebackFields({
            environment: environment as unknown as Parameters<typeof ensureContentTypeWritebackFields>[0]["environment"],
            contentTypeId,
            logger,
          });
        } catch (fieldProvisioningError) {
          logger?.warn(
            "⚠️ [ContentfulAppTool] Failed to provision writeback fields; continuing with existing fields",
            {
              entryId,
              contentTypeId,
              error:
                fieldProvisioningError instanceof Error
                  ? fieldProvisioningError.message
                  : String(fieldProvisioningError),
            },
          );
        }
      }
    }

    const updatedFields: string[] = [];
    let taxonomyProvisioning = {
      ensured: false,
      schemesCreated: 0,
      conceptsCreated: 0,
      error: undefined as string | undefined,
    };

    // Also write to Contentful Taxonomy (metadata.concepts) when possible.
    // This uses Concept Schemes that already exist on the Organization.
    try {
      const orgId = space?.sys?.organization?.sys?.id as string | undefined;
      if (applyConcepts && orgId) {
        try {
          taxonomyProvisioning = {
            ...(await ensureOrganizationTaxonomy({
              orgId,
              token: MGMT_TOKEN,
              logger,
            })),
            error: undefined,
          };
        } catch (taxonomySetupError) {
          taxonomyProvisioning.error =
            taxonomySetupError instanceof Error
              ? taxonomySetupError.message
              : String(taxonomySetupError);
          logger?.warn(
            "⚠️ [ContentfulAppTool] Failed to provision organization taxonomy before write",
            {
              entryId,
              error: taxonomyProvisioning.error,
            },
          );
        }

        const taxonomy = await loadOrganizationTaxonomy({
          orgId,
          token: MGMT_TOKEN,
        });

        // Find scheme ID by label (case-insensitive, partial match)
        const findSchemeIdByLabel = (
          wantedLabel: string,
        ): string | undefined => {
          const want = wantedLabel.toLowerCase().replace(/[^a-z0-9]/g, "");
          for (const [id, scheme] of taxonomy.schemesById.entries()) {
            const label = String(
              (scheme?.prefLabel as Record<string, string> | undefined)?.[
                "en-US"
              ] ||
                (scheme?.prefLabel as Record<string, string> | undefined)?.[
                  "en"
                ] ||
                "",
            )
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            // Exact match or contains match
            if (label === want || label.includes(want) || want.includes(label))
              return id;
          }
          // Also try matching the scheme ID itself
          for (const [id] of taxonomy.schemesById.entries()) {
            const normId = id.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (normId === want || normId.includes(want)) return id;
          }
          return undefined;
        };

        // Look up actual scheme IDs from organization taxonomy
        const schemeIds = {
          mediaType:
            findSchemeIdByLabel("Media type") ||
            findSchemeIdByLabel("mediatype") ||
            findSchemeIdByLabel("asset sub-type"),
          topic: findSchemeIdByLabel("topic"),
          persona:
            findSchemeIdByLabel("persona") || findSchemeIdByLabel("audience"),
          product:
            findSchemeIdByLabel("product") ||
            findSchemeIdByLabel("productName"),
          jobLevel:
            findSchemeIdByLabel("job level") || findSchemeIdByLabel("joblevel"),
          jobFunction:
            findSchemeIdByLabel("job function") ||
            findSchemeIdByLabel("jobfunction"),
          useCases:
            findSchemeIdByLabel("use case") || findSchemeIdByLabel("usecase"),
          funnelStage:
            findSchemeIdByLabel("funnel stage") ||
            findSchemeIdByLabel("funnelstage") ||
            findSchemeIdByLabel("funnel"),
          industry: findSchemeIdByLabel("industry"),
          companySize:
            findSchemeIdByLabel("company size") ||
            findSchemeIdByLabel("companysize"),
          region: findSchemeIdByLabel("region"),
          language: findSchemeIdByLabel("language"),
        };

        // Log which schemes were found for debugging
        logger?.info("📊 [ContentfulAppTool] Taxonomy scheme lookup", {
          found: Object.entries(schemeIds)
            .filter(([, v]) => v)
            .map(([k]) => k),
          missing: Object.entries(schemeIds)
            .filter(([, v]) => !v)
            .map(([k]) => k),
          availableSchemes: Array.from(taxonomy.schemesById.entries()).map(
            ([id, s]) => ({
              id,
              label:
                (s?.prefLabel as Record<string, string> | undefined)?.["en-US"] ||
                (s?.prefLabel as Record<string, string> | undefined)?.["en"],
            }),
          ),
        });

        const targetSchemeIds = Object.values(schemeIds).filter(
          Boolean,
        ) as string[];
        const existingConceptIds: string[] = (
          entry?.metadata?.concepts || []
        )
          .map(
            (c: { sys?: { id?: string } }) => c?.sys?.id,
          )
          .filter((id): id is string => Boolean(id));

        const preserved = keepNonTargetSchemeConcepts({
          existingConceptIds,
          taxonomy,
          targetSchemeIds,
        });

        // Only resolve concepts for schemes that were found
        const desiredConceptIds: string[] = [];

        if (schemeIds.mediaType && classification.assetSubType?.value) {
          desiredConceptIds.push(
            ...resolveConceptIds({
              taxonomy,
              schemeId: schemeIds.mediaType,
              labels: Array.isArray(classification.assetSubType.value)
                ? classification.assetSubType.value
                : [],
            }),
          );
        }
        if (schemeIds.topic && classification.topic?.value) {
          desiredConceptIds.push(
            ...resolveConceptIds({
              taxonomy,
              schemeId: schemeIds.topic,
              labels: Array.isArray(classification.topic.value)
                ? classification.topic.value
                : [],
            }),
          );
        }
        if (schemeIds.persona && classification.audience?.value) {
          desiredConceptIds.push(
            ...resolveConceptIds({
              taxonomy,
              schemeId: schemeIds.persona,
              labels: Array.isArray(classification.audience.value)
                ? classification.audience.value
                : [],
            }),
          );
        }
        if (schemeIds.product && classification.product?.value) {
          desiredConceptIds.push(
            ...resolveConceptIds({
              taxonomy,
              schemeId: schemeIds.product,
              labels: Array.isArray(classification.product.value)
                ? classification.product.value
                : [],
            }),
          );
        }
        if (schemeIds.jobLevel && classification.jobLevel?.value) {
          desiredConceptIds.push(
            ...resolveConceptIds({
              taxonomy,
              schemeId: schemeIds.jobLevel,
              labels: Array.isArray(classification.jobLevel.value)
                ? classification.jobLevel.value
                : [],
            }),
          );
        }
        if (schemeIds.jobFunction && classification.jobFunction?.value) {
          desiredConceptIds.push(
            ...resolveConceptIds({
              taxonomy,
              schemeId: schemeIds.jobFunction,
              labels: Array.isArray(classification.jobFunction.value)
                ? classification.jobFunction.value
                : [],
            }),
          );
        }
        if (schemeIds.useCases && classification.useCases?.value) {
          desiredConceptIds.push(
            ...resolveConceptIds({
              taxonomy,
              schemeId: schemeIds.useCases,
              labels: Array.isArray(classification.useCases.value)
                ? classification.useCases.value
                : [],
            }),
          );
        }
        if (schemeIds.funnelStage && classification.funnelStage?.value) {
          const funnelId = resolveBestConceptId({
            taxonomy,
            schemeId: schemeIds.funnelStage,
            labels: [String(classification.funnelStage.value)],
          });
          if (funnelId) desiredConceptIds.push(funnelId);
        }
        if (schemeIds.industry && classification.industry?.value) {
          desiredConceptIds.push(
            ...resolveConceptIds({
              taxonomy,
              schemeId: schemeIds.industry,
              labels: Array.isArray(classification.industry.value)
                ? classification.industry.value
                : [],
            }),
          );
        }
        if (schemeIds.companySize && classification.companySize?.value) {
          desiredConceptIds.push(
            ...resolveConceptIds({
              taxonomy,
              schemeId: schemeIds.companySize,
              labels: Array.isArray(classification.companySize.value)
                ? classification.companySize.value
                : [],
            }),
          );
        }
        if (schemeIds.region && classification.region?.value) {
          desiredConceptIds.push(
            ...resolveConceptIds({
              taxonomy,
              schemeId: schemeIds.region,
              labels: Array.isArray(classification.region.value)
                ? classification.region.value
                : [],
            }),
          );
        }
        if (schemeIds.language && classification.language?.value) {
          const langId = resolveBestConceptId({
            taxonomy,
            schemeId: schemeIds.language,
            labels: [String(classification.language.value)],
          });
          if (langId) desiredConceptIds.push(langId);
        }

        logger?.info("📊 [ContentfulAppTool] Resolved concept IDs", {
          count: desiredConceptIds.length,
          ids: desiredConceptIds.slice(0, 5),
        });

        const merged = Array.from(
          new Set([...preserved, ...desiredConceptIds]),
        ).filter((id) => taxonomy.conceptsById.has(id));
        entry.metadata = entry.metadata || {};
        entry.metadata.concepts = toConceptLinks(merged);
        updatedFields.push("metadata.concepts");
      } else if (applyConcepts) {
        logger?.warn(
          "⚠️ [ContentfulAppTool] No organization ID on space; skipping taxonomy write",
          { entryId },
        );
      }
    } catch (e) {
      logger?.warn(
        "⚠️ [ContentfulAppTool] Failed to write taxonomy concepts; continuing with field updates",
        {
          entryId,
          error: e instanceof Error ? e.message : String(e),
        },
      );
    }

    if (writeFields) {
      const reviewReasonsText = Array.isArray(classification?.reviewReasons)
        ? classification.reviewReasons.join("\n")
        : "";
      type ConfidenceCalibration = {
        dataBacked?: boolean;
        overall?: { dataBacked?: boolean };
      };
      const confidenceCalibration = classification?.confidenceCalibration as
        | ConfidenceCalibration
        | null
        | undefined;
      const confidenceDataBacked =
        confidenceCalibration?.dataBacked ??
        confidenceCalibration?.overall?.dataBacked ??
        false;

      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiAssetType",
        locale: loc,
        value: normalizeScalar(classification?.assetType?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiAssetSubType",
        locale: loc,
        value: normalizeArray(classification?.assetSubType?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiSchemaType",
        locale: loc,
        value: normalizeScalar(classification?.schemaType?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiProduct",
        locale: loc,
        value: normalizeArray(classification?.product?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiJobLevel",
        locale: loc,
        value: normalizeArray(classification?.jobLevel?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiJobFunction",
        locale: loc,
        value: normalizeArray(classification?.jobFunction?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiAudience",
        locale: loc,
        value: normalizeArray(classification?.audience?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiTopic",
        locale: loc,
        value: normalizeArray(classification?.topic?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiUseCases",
        locale: loc,
        value: normalizeArray(classification?.useCases?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiFunnelStage",
        locale: loc,
        value: normalizeScalar(classification?.funnelStage?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiIndustry",
        locale: loc,
        value: normalizeArray(classification?.industry?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiCompanySize",
        locale: loc,
        value: normalizeArray(classification?.companySize?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiRegion",
        locale: loc,
        value: normalizeArray(classification?.region?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiLanguage",
        locale: loc,
        value: normalizeScalar(classification?.language?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiUsageRights",
        locale: loc,
        value: normalizeScalar(classification?.usageRights?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiEvent",
        locale: loc,
        value: normalizeScalar(classification?.event?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiEventType",
        locale: loc,
        value: normalizeScalar(classification?.eventType?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiSeason",
        locale: loc,
        value: normalizeScalar(classification?.season?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiYearPublished",
        locale: loc,
        value: normalizeScalar(classification?.yearPublished?.value),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiOverallConfidence",
        locale: loc,
        value:
          typeof classification?.overallConfidence === "number"
            ? classification.overallConfidence
            : undefined,
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiConfidenceDataBacked",
        locale: loc,
        value: Boolean(confidenceDataBacked),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiReviewReasons",
        locale: loc,
        value: reviewReasonsText || null,
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiNeedsReview",
        locale: loc,
        value: Boolean(classification?.needsReview),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiLastClassified",
        locale: loc,
        value: lastClassifiedAt || new Date().toISOString(),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiReasoning",
        locale: loc,
        value: normalizeScalar(classification?.reasoning),
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiRecommendedActions",
        locale: loc,
        value: classification?.recommendedActions || null,
        updatedFields,
      });
      setEntryField({
        entry,
        fieldIds: fieldProvisioning.fieldIds,
        fieldId: "aiCompetitivePositioning",
        locale: loc,
        value: classification?.competitivePositioning || null,
        updatedFields,
      });
    }

    if (CONTENTFUL_REVIEW_TAG_ID) {
      type TagLink = { sys: { id: string; type?: string; linkType?: string } };
      const entryMeta = entry.metadata as
        | { tags?: TagLink[] }
        | null
        | undefined;
      const existingTags: TagLink[] = Array.isArray(entryMeta?.tags)
        ? [...(entryMeta!.tags as TagLink[])]
        : [];
      const hasReviewTag = existingTags.some(
        (tag) => tag?.sys?.id === CONTENTFUL_REVIEW_TAG_ID,
      );
      const shouldHaveReviewTag = Boolean(classification?.needsReview);

      if (shouldHaveReviewTag && !hasReviewTag) {
        entry.metadata = entry.metadata || {};
        (entry.metadata as { tags?: TagLink[] }).tags = [
          ...existingTags,
          {
            sys: {
              type: "Link",
              linkType: "Tag",
              id: CONTENTFUL_REVIEW_TAG_ID,
            },
          },
        ];
        updatedFields.push("metadata.tags");
      } else if (!shouldHaveReviewTag && hasReviewTag) {
        entry.metadata = entry.metadata || {};
        (entry.metadata as { tags?: TagLink[] }).tags = existingTags.filter(
          (tag) => tag?.sys?.id !== CONTENTFUL_REVIEW_TAG_ID,
        );
        updatedFields.push("metadata.tags");
      }
    }

    const pendingFieldSnapshot = JSON.parse(JSON.stringify(entry.fields || {}));
    const pendingTagSnapshot = JSON.parse(
      JSON.stringify(
        (entry.metadata as { tags?: unknown[] } | undefined)?.tags || [],
      ),
    );

    // Save the entry - with retry on taxonomy concept errors
    let updatedEntry;
    let taxonomySkipped = false;
    try {
      updatedEntry = await entry.update();
    } catch (updateError: unknown) {
      // Check if it's a 422 error about invalid taxonomy concepts
      const errorMsg =
        (updateError as { message?: string } | undefined)?.message ||
        String(updateError);
      const is422 =
        errorMsg.includes("422") || errorMsg.includes("Validation error");
      const isConceptError =
        errorMsg.includes("TaxonomyConcept") || errorMsg.includes("concepts");

      if (is422 && isConceptError && (entry.metadata?.concepts?.length ?? 0) > 0) {
        logger?.warn(
          "⚠️ [ContentfulAppTool] Taxonomy concepts rejected by Contentful - retrying without concepts",
          {
            entryId,
            conceptCount: entry.metadata?.concepts?.length ?? 0,
            error: errorMsg.slice(0, 500),
          },
        );

        // Remove concepts and retry
        entry.metadata!.concepts = [];
        const conceptsIdx = updatedFields.indexOf("metadata.concepts");
        if (conceptsIdx > -1) updatedFields.splice(conceptsIdx, 1);
        taxonomySkipped = true;

        // Refetch entry to get fresh version number and retry without concepts
        entry = await environment.getEntry(entryId);
        entry.fields = pendingFieldSnapshot;
        entry.metadata = entry.metadata || {};
        (entry.metadata as { tags?: unknown[] }).tags = pendingTagSnapshot;
        entry.metadata!.concepts = [];

        updatedEntry = await entry.update();
        logger?.info(
          "✅ [ContentfulAppTool] Retry succeeded without taxonomy concepts",
          { entryId },
        );
      } else {
        throw updateError;
      }
    }

    let didPublish = false;
    if (publish && wasPublished) {
      try {
        await updatedEntry.publish();
        didPublish = true;
      } catch (e) {
        logger?.warn(
          "⚠️ [ContentfulAppTool] Failed to publish updated entry; leaving as draft",
          {
            entryId,
            error: e instanceof Error ? e.message : String(e),
          },
        );
      }
    }

    logger?.info(
      "✅ [ContentfulAppTool] Updated Contentful entry with classifications",
      {
        entryId,
        updatedFields,
        published: didPublish,
        taxonomySkipped,
      },
    );

    return {
      success: true,
      entryId,
      message: taxonomySkipped
        ? `Updated entry ${entryId} (taxonomy concepts skipped - not enabled for this space)`
        : `Successfully updated entry ${entryId} with AI classifications`,
      updatedFields,
      published: didPublish,
      taxonomySkipped,
      provisioning: {
        taxonomy: taxonomyProvisioning,
        fields: {
          ensured: fieldProvisioning.ensured,
          createdFieldIds: fieldProvisioning.createdFieldIds,
        },
      },
    };
  } catch (error) {
    logger?.error("❌ [ContentfulAppTool] Error updating Contentful entry", {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
      entryId,
    });
    throw new Error(
      `Failed to update Contentful entry: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
