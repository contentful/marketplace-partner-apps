import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { updateContentfulEntryWithClassification } from "../_shared/tools/contentfulAppTool.js";
import { validateAppToken } from "../_shared/utils/appAuth.js";
import {
  linkAssetToLabels,
  upsertAssetNode,
  upsertTaxonomyNodes,
} from "../_shared/graph/pgGraph.js";
import { resolveHumanReview } from "../_shared/utils/reviewQueue.js";
import { saveCorrectionWithEmbedding } from "../_shared/utils/feedbackStore.js";
import { buildEmbedText } from "../_shared/utils/embeddingCache.js";
import { CLASSIFIER_AUTO_FEEDBACK_ON_APPROVE } from "../_shared/config/classifierPipeline.js";
import { logger } from "../_shared/utils/logger.js";
import {
  coerceSingleAllowed,
  coerceToAllowed,
  getStaticAllowedLabelsFlat,
} from "../_shared/tools/classificationTool.js";

// Minimum classification shape required for a valid approve payload.
// Validates that the key taxonomy fields are present with the expected structure
// before allowing a writeback to Contentful. Uses passthrough() so callers
// can include extra fields (fieldProvenance, cached, debugTrace, etc.)
// without failing validation.
const ClassificationShapeSchema = z
  .object({
    assetType: z.object({ value: z.string().min(1), confidence: z.number() }),
    funnelStage: z.object({ value: z.string().min(1), confidence: z.number() }),
    language: z.object({ value: z.string().min(1), confidence: z.number() }),
    schemaType: z.object({ value: z.string().min(1), confidence: z.number() }),
  })
  .passthrough();

const ApproveBodySchema = z.object({
  entryId: z.string().trim().min(1),
  classification: ClassificationShapeSchema,
  locale: z.string().trim().min(1).optional(),
  lastClassifiedAt: z.string().trim().min(1).optional(),
  spaceId: z.string().trim().min(1).optional(),
  environmentId: z.string().trim().min(1).optional(),
  publish: z.boolean().optional(),
});

const CorrectBodySchema = z.object({
  entryId: z.string().trim().min(1),
  title: z.string().optional(),
  url: z.string().optional(),
  contentType: z.string().optional(),
  notes: z.string().optional(),
  correctedBy: z.string().optional(),
  fields: z
    .record(z.string(), z.unknown())
    .refine((value) => Object.keys(value).length > 0, {
      message: "fields must be a non-empty object of corrected values",
    }),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = Array.isArray(req.query.action)
    ? req.query.action[0]
    : req.query.action;

  if (!action) {
    return res.status(400).json({ error: "Missing review action" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!validateAppToken(req, res)) return;

  if (action === "approve") {
    try {
      const parsed = ApproveBodySchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid approve payload",
          issues: parsed.error.flatten(),
        });
      }

      const {
        entryId,
        classification: parsedClassification,
        locale,
        lastClassifiedAt,
        spaceId,
        environmentId,
        publish,
      } = parsed.data;
      const classification = parsedClassification as Record<string, { value?: unknown; confidence?: number } | null | undefined> & {
        title?: string;
        needsReview?: boolean;
        overallConfidence?: number;
      };

      const envSpace = process.env.CONTENTFUL_SPACE_ID;
      if (spaceId && envSpace && spaceId !== envSpace) {
        return res.status(400).json({
          success: false,
          message: `spaceId override not allowed. Use space ${envSpace}.`,
        });
      }

      // Fix 1: Coerce all taxonomy fields in the classification to valid allowed
      // values before writing to Contentful. This prevents hallucinated labels
      // (values not in the canonical taxonomy) from reaching the CMS.
      {
        const allowedFlat = getStaticAllowedLabelsFlat();
        const cls = classification as Record<
          string,
          { value?: unknown; confidence?: number } | null | undefined
        >;
        const multiFields = [
          "assetSubType",
          "product",
          "topic",
          "useCases",
          "industry",
          "jobLevel",
          "jobFunction",
          "audience",
          "companySize",
          "region",
        ];
        const singleFields = ["funnelStage", "language"];
        for (const field of multiFields) {
          const entry = cls[field];
          if (!entry || !Array.isArray(entry.value)) continue;
          const allowed = allowedFlat[field];
          if (!allowed?.length) continue;
          entry.value = coerceToAllowed({
            values: entry.value as string[],
            allowed,
          });
        }
        for (const field of singleFields) {
          const entry = cls[field];
          if (!entry || typeof entry.value !== "string") continue;
          const allowed = allowedFlat[field];
          if (!allowed?.length) continue;
          const coerced = coerceSingleAllowed({ value: entry.value as string, allowed });
          if (coerced !== undefined) entry.value = coerced;
          else entry.value = "";
        }
      }

      const updateResp = await updateContentfulEntryWithClassification({
        entryId,
        classification,
        locale,
        lastClassifiedAt,
        logger,
        spaceId,
        environmentId,
        publish: !!publish,
        writeFields: true,
        applyConcepts: true,
      });

      const space = spaceId || process.env.CONTENTFUL_SPACE_ID;
      const envId =
        environmentId ||
        process.env.CONTENTFUL_ENV_ID ||
        process.env.CONTENTFUL_ENVIRONMENT_ID ||
        "master";
      const entryUrl = space
        ? `https://app.contentful.com/spaces/${space}/environments/${envId}/entries/${entryId}`
        : undefined;

      try {
        const topic0 = (Array.isArray(classification?.topic?.value)
          ? classification.topic.value[0]
          : classification?.topic?.value) as string | undefined;
        const audience0 = (Array.isArray(classification?.audience?.value)
          ? classification.audience.value[0]
          : classification?.audience?.value) as string | undefined;
        const industry0 = (Array.isArray(classification?.industry?.value)
          ? classification.industry.value[0]
          : classification?.industry?.value) as string | undefined;
        const funnelStage0 = classification?.funnelStage?.value as string | undefined;

        await upsertAssetNode(entryId, {
          title: classification?.title,
          url: entryUrl,
        });
        await upsertTaxonomyNodes({
          topic: topic0,
          persona: audience0,
          industry: industry0,
          funnelStage: funnelStage0,
        });
        await linkAssetToLabels(
          entryId,
          {
            topic: topic0,
            persona: audience0,
            industry: industry0,
            funnelStage: funnelStage0,
          },
          {
            topic: classification?.topic?.confidence,
            persona: classification?.audience?.confidence,
            industry: classification?.industry?.confidence,
            funnelStage: classification?.funnelStage?.confidence,
          },
        );
      } catch (graphError) {
        logger.warn("Graph update failed after Contentful update", {
          error: String(graphError),
        });
      }

      await resolveHumanReview(entryId);

      // Auto-feedback loop: every editor approval becomes a confirmed correction
      // (confirmationCount=2) so it is immediately eligible for few-shot retrieval
      // on the next classification run, without waiting for manual review cycles.
      // Controlled by CLASSIFIER_AUTO_FEEDBACK_ON_APPROVE (default: true).
      if (CLASSIFIER_AUTO_FEEDBACK_ON_APPROVE)
        try {
          const approvedFields: Record<string, unknown> = {};
          const scalarFields = [
            "assetType",
            "schemaType",
            "funnelStage",
            "language",
            "usageRights",
          ];
          const arrayFields = [
            "assetSubType",
            "product",
            "topic",
            "useCases",
            "industry",
            "jobLevel",
            "jobFunction",
            "audience",
            "companySize",
            "region",
          ];
          for (const f of scalarFields) {
            const v = classification?.[f]?.value;
            if (v != null && v !== "") approvedFields[f] = v;
          }
          for (const f of arrayFields) {
            const v = classification?.[f]?.value;
            if (Array.isArray(v) && v.length > 0) approvedFields[f] = v;
          }

          // Fix 3: Filter approvedFields through allowed taxonomy before storing
          // as ground truth in feedbackStore. Hallucinated values from the LLM
          // that passed coercion earlier are dropped here to prevent poisoning
          // the few-shot retrieval corpus.
          {
            const allowedFlat = getStaticAllowedLabelsFlat();
            for (const field of arrayFields) {
              const v = approvedFields[field];
              if (!Array.isArray(v)) continue;
              const allowed = allowedFlat[field];
              if (!allowed?.length) continue;
              const filtered = coerceToAllowed({
                values: v as string[],
                allowed,
              });
              if (filtered.length > 0) approvedFields[field] = filtered;
              else delete approvedFields[field];
            }
            for (const field of scalarFields) {
              const v = approvedFields[field];
              if (typeof v !== "string") continue;
              const allowed = allowedFlat[field];
              if (!allowed?.length) continue;
              const coerced = coerceSingleAllowed({ value: v, allowed });
              if (coerced !== undefined) approvedFields[field] = coerced;
              else delete approvedFields[field];
            }
          }

          if (Object.keys(approvedFields).length > 0) {
            const topicHints = [
              ...(Array.isArray(approvedFields.topic)
                ? (approvedFields.topic as string[])
                : []),
              ...(Array.isArray(approvedFields.useCases)
                ? (approvedFields.useCases as string[])
                : []),
              typeof approvedFields.funnelStage === "string"
                ? approvedFields.funnelStage
                : "",
            ].filter(Boolean);

            const embedText = buildEmbedText({
              title: classification?.title ?? entryId,
              slug: entryUrl ?? entryId,
              contentType: "",
              topicHints,
              bodySample: "",
            });

            await saveCorrectionWithEmbedding(
              {
                entryId,
                title: classification?.title ?? entryId,
                url: entryUrl ?? entryId,
                correctedAt: new Date().toISOString(),
                correctedBy: "editor-approval",
                // confirmationCount=1: approvals are saved as corrections but require
                // a second independent signal before entering few-shot retrieval.
                // This prevents the LLM from training on its own outputs immediately.
                confirmationCount: 1,
                fields: approvedFields as Record<string, string | string[]>,
              },
              embedText,
            );
          }
        } catch (feedbackError) {
          logger.warn("Auto-feedback save failed after approval", {
            error: String(feedbackError),
          });
        }

      const resp = updateResp as {
        updatedFields?: string[];
        published?: boolean;
        taxonomySkipped?: boolean;
        provisioning?: {
          taxonomy?: { ensured?: boolean; schemesCreated?: number; conceptsCreated?: number; error?: string };
          fields?: { ensured?: boolean; createdFieldIds?: string[] };
        };
      };
      return res.status(200).json({
        success: true,
        entryId,
        updatedFields: resp?.updatedFields,
        published: !!resp?.published,
        taxonomySkipped: !!resp?.taxonomySkipped,
        provisioning: {
          taxonomy: {
            ensured: !!resp?.provisioning?.taxonomy?.ensured,
            schemesCreated: Number(resp?.provisioning?.taxonomy?.schemesCreated || 0),
            conceptsCreated: Number(resp?.provisioning?.taxonomy?.conceptsCreated || 0),
            error: resp?.provisioning?.taxonomy?.error,
          },
          fields: {
            ensured: !!resp?.provisioning?.fields?.ensured,
            createdFieldIds: Array.isArray(resp?.provisioning?.fields?.createdFieldIds)
              ? resp.provisioning!.fields!.createdFieldIds!
              : [],
          },
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Approval failed", { error: msg });
      return res.status(500).json({
        success: false,
        message: "Approval failed",
      });
    }
  }

  if (action === "correct") {
    const parsed = CorrectBodySchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid correction payload",
        issues: parsed.error.flatten(),
      });
    }

    const { entryId, title, url, contentType, fields, notes, correctedBy } =
      parsed.data;

    // Fix 2: Validate that every taxonomy field in the correction payload
    // contains only values that exist in the canonical allowed set.
    // Unknown field names are passed through unchanged (they may be non-taxonomy
    // fields like title, url, etc.). Invalid taxonomy values are rejected with
    // a 400 so the editor can fix them before they become ground-truth corrections.
    {
      const allowedFlat = getStaticAllowedLabelsFlat();
      const invalidFields: string[] = [];
      for (const [fieldName, value] of Object.entries(fields)) {
        const allowed = allowedFlat[fieldName];
        if (!allowed) continue; // not a taxonomy field — skip
        const values = Array.isArray(value) ? value : [value];
        const invalid = values.filter(
          (v) => typeof v === "string" && !allowed.includes(v),
        );
        if (invalid.length > 0) {
          invalidFields.push(`${fieldName}: ${invalid.join(", ")}`);
        }
      }
      if (invalidFields.length > 0) {
        return res.status(400).json({
          error: `Invalid taxonomy values: ${invalidFields.join("; ")}`,
        });
      }
    }

    try {
      const correction = {
        entryId,
        title: String(title ?? entryId),
        url: String(url ?? ""),
        contentType: String(contentType ?? ""),
        correctedAt: new Date().toISOString(),
        correctedBy: String(correctedBy ?? "sidebar-app"),
        notes: notes ? String(notes) : undefined,
        fields,
      };

      const topicHints = [
        ...(Array.isArray(fields.topic)
          ? fields.topic
          : fields.topic
            ? [fields.topic]
            : []),
        ...(Array.isArray(fields.useCases) ? fields.useCases : []),
        fields.funnelStage ?? "",
      ].filter(Boolean);

      const embedText = buildEmbedText({
        title: correction.title,
        slug: correction.url,
        contentType: correction.contentType,
        topicHints,
        bodySample: correction.notes ?? "",
      });

      await saveCorrectionWithEmbedding(correction, embedText);

      return res.status(200).json({
        success: true,
        entryId,
        correctedFields: Object.keys(fields),
        embeddingQueued: true,
      });
    } catch (error: unknown) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "correction_failed",
          entryId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return res.status(500).json({ error: "Correction failed" });
    }
  }

  return res.status(404).json({ error: `Unknown review action: ${action}` });
}
