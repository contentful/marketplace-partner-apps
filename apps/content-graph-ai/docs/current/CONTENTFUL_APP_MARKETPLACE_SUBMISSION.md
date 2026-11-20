# Contentful App Marketplace Submission

> Last updated: 2026-04-02

This document captures the current marketplace-submission framing for the Taxonomy Intelligence app.

## App Summary

- Contribution type: Standard Contribution
- App name: Taxonomy Intelligence
- Primary location: Contentful Entry Sidebar
- Core purpose: classify Contentful entries against native taxonomy and write the result back to `metadata.concepts` and governed entry fields

## Primary Function

Taxonomy Intelligence is an AI-powered content classifier for Contentful. It reads an entry's full content graph, classifies the content against the organization's controlled taxonomy, and writes the result back to Contentful in structured form.

The gap it fills is operational: Contentful taxonomy is powerful once configured, but manual tagging does not scale across large spaces. Taxonomy Intelligence automates that work while keeping human review in the loop for uncertain cases.

## Target Audience

- Content operations teams managing large Contentful spaces
- Marketing teams using taxonomy for personalization, reporting, routing, and distribution
- Enterprise teams with hundreds or thousands of entries where manual tagging is not viable
- Organizations that already invested in organization-level taxonomy and want to activate it operationally

## Key Features

### Entry Sidebar workflow

- One-click `Classify with AI` inside the Contentful editor
- Confidence-scored field table with reviewer-facing reasoning
- Human-review signaling for low-confidence results
- Save-draft or publish path back into Contentful

### Automatic classification

- Webhook-driven classification on publish/update
- Postgres-backed queue for background processing
- Loop guard to avoid self-triggering on taxonomy writeback

### Five-layer classifier pipeline

1. Layer 0: deterministic content-type constraints
2. Layer 1: signal extraction from URL, CTA, language, structure, and optional NLP sidecar enrichment
3. Layer 2: company enrichment and retrieval context
4. Layer 3: chained Gemini classification with dynamic few-shot retrieval
5. Layer 4: policy enforcement, allowed-label coercion, confidence routing, and review gating

### Classification coverage

The current classifier covers 20 fields across taxonomy-backed concepts and governed entry fields, including:

- taxonomy-style dimensions such as topic, funnel stage, industry, job function, job level, audience, product, use cases, company size, region, language, and asset sub-type
- governed entry fields such as asset type, schema type, competitive positioning, event name, event type, season, usage rights, and year published

### Human review loop

- Low-confidence results are routed to review instead of blindly auto-applied
- Review state is surfaced through the app and queue flow
- Human corrections feed the few-shot retrieval loop and confidence calibration inputs

### Batch classification

- Bulk classification scripts for larger corpora
- CSV export for human review
- Correction import path to improve future runs

### Accuracy and governance

- Versioned policy and prompt governance
- Deterministic replay fixtures
- Golden signal dataset checks
- Live repeatability harness for no-cache repeated-run drift measurement when model credentials are available

## Contentful Dependencies

- Contentful Taxonomy: required
- Contentful Webhooks: used for automatic classification
- Contentful Management API: writeback, review actions, webhook validation support
- Contentful Delivery API: recursive crawl over linked entries

## Third-Party Services

| Service | Required | Purpose |
|---|---|---|
| Google Gemini API | Yes | Two-stage AI classification |
| Vercel | Yes | Hosting for app routes and cron jobs |
| Postgres | Recommended | Job queue, review queue, persistence |
| Chroma | Optional | Semantic few-shot retrieval |
| NLP sidecar | Optional | GLiNER + zero-shot enrichment before LLM classification |

Minimum viable configuration is the classifier plus Contentful credentials and Gemini access. Postgres, Chroma, and the NLP sidecar improve operational quality but are not all required for a basic install.

## Real-World Usage

- Used against Contentful marketing content to classify pages and case studies
- Batch runs used for corpus-level review exports
- Human corrections are already part of the live feedback loop

## Generalization Work Remaining

- Dynamic taxonomy discovery per installation
- Configurable content-type profiles instead of Contentful-specific defaults
- Cleaner installation/setup UX for secrets and app parameters
- Better cold-start experience for few-shot examples in a new organization
- Simpler documented default path for installations that do not want the full queue stack

## Related Docs

- [TAXONOMY_APP.md](./TAXONOMY_APP.md)
- [HOW_THE_APP_WORKS.md](./HOW_THE_APP_WORKS.md)
- [CLASSIFIER_LOGIC.md](./CLASSIFIER_LOGIC.md)
