# ContentGraph Taxonomy App

> **Last Updated:** April 2, 2026

This document describes the Contentful sidebar app and the operational taxonomy-classification workflow around it.

## Overview

The ContentGraph Taxonomy App is a Contentful Entry Sidebar application that:
1. Crawls entry content, including linked entries up to 4 levels deep
2. Runs the same governed 5-layer classifier used by the queue worker
3. Writes classifications directly to Contentful's native `metadata.concepts` plus governed entry fields
4. Provides a UI for review, approve, save-draft, and publish actions
5. Shares the same review-routing and policy-enforcement model as automated classification

For the marketplace-positioned product summary, see [CONTENTFUL_APP_MARKETPLACE_SUBMISSION.md](./CONTENTFUL_APP_MARKETPLACE_SUBMISSION.md).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Contentful Sidebar App                        │
│                   (public/app/sidebar.html)                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│       /api/tools/[tool]/execute?tool=classify-content            │
│                                                                  │
│  1. Fetch entry from Contentful                                  │
│  2. Deep crawl linked entries (4 levels)                         │
│  3. Extract signals + optional NLP enrichment                    │
│  4. Run 5-layer classifier pipeline                              │
│  5. Return classification result + review state                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /api/review/[action]                          │
│                                                                  │
│  1. Load organization taxonomy                                   │
│  2. Resolve classification labels → concept IDs                  │
│  3. Update entry's metadata.concepts                             │
│  4. Optionally publish entry                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Sidebar UI Design

### Layout Structure

```
┌──────────────────────────────────────┐
│  AI Classification     [Content Graph]│  <- Header card with badge
│  Entry: xxx • Type: page • Locale: en │
├──────────────────────────────────────┤
│  [    Classify with AI    ]          │  <- Primary action button
│  [      Save Draft        ]          │  <- Secondary (disabled until classified)
│  [       Publish          ]          │  <- Success button (disabled until classified)
├──────────────────────────────────────┤
│  Status: 5 fields classified         │  <- Results card (hidden until classified)
│  ┌────────────────────────────────┐  │
│  │ 85% avg │ Ready │ [Copy All]  │  │  <- Pills + copy button
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Field      │ Value    │ Conf  │  │  <- Classification table
│  │ Topic      │ AI       │  92%  │  │
│  │ Audience   │ Marketer │  78%  │  │
│  │ Funnel     │ TOFU     │  65%  │  │  <- Row highlighted (< 70%)
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Reasoning          [Read more]│  │  <- Collapsible reasoning
│  │ This content discusses...     │  │
│  └────────────────────────────────┘  │
├──────────────────────────────────────┤
│  ▸ Classification payload            │  <- Expandable JSON view
├──────────────────────────────────────┤
│  ▸ Diagnostics                       │  <- Debug tools
└──────────────────────────────────────┘
```

### UI Components

#### Status Pills
- **Average confidence pill**: Shows overall classification confidence (green if all fields ≥70%, yellow otherwise)
- **Review status pill**: Shows "Ready" (green) or "X need review" (yellow) based on low-confidence fields
- **Copy All button**: Copies entire classification JSON to clipboard

#### Classification Table
- Shows only fields with meaningful values (filters out defaults like "N/A", "Unknown")
- Rows with confidence < 70% are highlighted in yellow/orange
- Confidence displayed as percentage

#### Reasoning Section
- Collapsed by default (shows first ~60px)
- "Read more" button expands to show full reasoning
- "Show less" button collapses it back

### Color Scheme

```css
--bg: #f5f7fb;           /* Page background */
--card: #ffffff;         /* Card background */
--accent: #0f7cff;       /* Primary blue */
--text: #0f172a;         /* Main text */
--muted: #5f6b7b;        /* Secondary text */
--border: #d8dde3;       /* Borders */

/* Status colors */
--ok: #059669;           /* Green for success */
--warn: #d97706;         /* Orange for warnings */
```

## Classification Flow

### Step 1: Classify with AI

When the user clicks "Classify with AI":

1. **Deep Crawl** (`RecursiveContentCrawler`)
   - Fetches the current entry
   - Recursively follows reference fields up to 4 levels deep
   - Extracts text from all text/rich-text fields
   - Concatenates into a single text blob

2. **5-layer classification** (`classifyContent`)
   - Layer 0: deterministic content-type constraints
   - Layer 1: signal extraction from URL, CTA, language, and structure, with optional NLP sidecar enrichment
   - Layer 2: company enrichment and retrieval context
   - Layer 3: chained Gemini classification
   - Layer 4: allowed-label coercion, overrides, confidence routing, and review decisions
   - Current classifier coverage spans 20 fields across taxonomy-backed concepts and governed entry fields

3. **Display Results**
   - Renders classification table with confidence indicators
   - Highlights low-confidence fields (< 70%)
   - Shows AI reasoning

### Batch Reviewer Exports

For bulk review runs, use [scripts/classify-pillar-pages.ts](../../scripts/classify-pillar-pages.ts).

- The native batch CSV includes every classifier field plus `AI Reasoning`, `Review Reasons`, confidences, and review tiering.
- Reviewer-facing exports may post-process the native `AI Reasoning` field to remove deterministic lock text and the appended final snapshot, leaving only Gemini's rationale.
- If you change the reasoning prompt contract, rerun the batch. Existing exports will not retroactively gain the new reasoning format.

### Step 2: Save/Publish

When the user clicks "Save Draft" or "Publish":

1. **Load Organization Taxonomy**
   - Fetches all concept schemes and concepts from Contentful org API
   - Builds lookup maps for label → concept ID resolution

2. **Resolve Concept IDs**
   - Maps classification labels to actual Contentful concept IDs
   - Uses fuzzy matching (Jaccard similarity) for non-exact matches
   - Minimum score threshold: 0.6

3. **Update Entry**
   - Preserves existing concepts from non-target schemes
   - Merges new AI-classified concepts
   - Writes to `entry.metadata.concepts`
   - Optionally publishes if entry was previously published

### Error Handling

- **422 Taxonomy errors**: If concepts aren't enabled for the space, the app retries without concepts and shows a warning
- **Missing schemes**: Logs which schemes couldn't be found, continues with available ones
- **Low confidence**: Highlights fields needing human review
- **Policy enforcement**: Invalid or non-canonical labels are coerced or rejected before writeback

### Sidebar Authentication

- The sidebar sends `X-App-Token` on classify/review requests using the Contentful app installation parameter `appToken`
- The app definition must declare `appToken` as an installation parameter of type `Secret`
- The sidebar reads `sdk.parameters.installation.appToken` directly from the Contentful App SDK; runtime CMA access to `AppInstallation` is not permitted from inside the app iframe
- Diagnostics may include a SHA-256 fingerprint of the in-memory app token for mismatch debugging; this is safe to compare because it is not the raw secret

## Key Files

| File | Purpose |
|------|---------|
| `public/app/sidebar.html` | Main sidebar UI (HTML + JS + CSS) |
| `api/tools/[tool]/execute.ts` | Classification API endpoint implementation |
| `api/review/[action].ts` | Save/publish and correction API endpoint |
| `api/_shared/tools/contentfulAppTool.ts` | Contentful update logic |
| `api/_shared/tools/contentfulTaxonomyTool.ts` | Taxonomy resolution |
| `api/_shared/tools/classificationTool.ts` | AI classification |
| `api/_shared/tools/classificationRuntimePolicy.ts` | Deterministic post-processing, coercion, and review routing |
| `api/_shared/utils/recursiveCrawler.ts` | Deep content extraction |
| `scripts/setup-taxonomy.ts` | Create missing taxonomy concepts |

## Taxonomy Structure

The app uses Contentful's organization-level taxonomy with these concept schemes:

| Scheme | ID | Example Concepts |
|--------|----|--------------------|
| Media type | `6iTmYSodF3GoSjR8RsizS0` | Demo, Ebook, Webinar |
| Topic | `topic` | AI, Headless CMS, Content operations |
| Persona | `persona` | Developer, Marketer, Marketing leader |
| Funnel stage | `funnelStage` | TOFU, MOFU, BOFU |
| Industry | `industry` | Financial Services, Retail, Technology |
| Job function | `jobFunction` | Marketing, Engineering, Product |
| Job level | `jobLevel` | C-level, Director, Manager |
| Product | `productName` | Platform, Studio, AI |
| Region | `region` | North America, EMEA, Asia Pacific |
| Company size | `companySize` | Enterprise, Commercial, Small business |
| Use-case | `useCase` | Personalization, Localization, Websites |
| Language | `language` | US English, French |

See `docs/taxonomy-concepts.md` for complete concept IDs.

## Setup

### 1. Install the App in Contentful

Configure the app with:
- **Entry Sidebar** location pointing to `/app/sidebar.html`
- Assign to relevant content types (e.g., `page`)

### 2. Ensure Taxonomy Exists

Run the setup script to create any missing concepts:

```bash
# Dry run first
CONTENTFUL_SPACE_ID=xxx CONTENTFUL_MANAGEMENT_TOKEN=xxx npx tsx scripts/setup-taxonomy.ts --dry-run

# Create missing concepts
CONTENTFUL_SPACE_ID=xxx CONTENTFUL_MANAGEMENT_TOKEN=xxx npx tsx scripts/setup-taxonomy.ts
```

### 3. Enable Taxonomy for Space

In Contentful:
1. Go to Settings → Taxonomy
2. Enable the taxonomy feature for your space
3. The app will gracefully degrade if taxonomy isn't enabled (shows warning)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CONTENTFUL_SPACE_ID` | Yes | Target space ID |
| `CONTENTFUL_MANAGEMENT_TOKEN` | Yes | CMA token with write access |
| `CONTENTFUL_ENV_ID` | No | Environment (default: `master`) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | For AI classification (Gemini) |

## Troubleshooting

### "Taxonomy concepts not enabled for space"

The space doesn't have taxonomy enabled. Go to Settings → Taxonomy in Contentful to enable it.

### Classification shows "Untitled"

The entry doesn't have a `title` or `name` field, or it's empty. The classifier will still work using body content.

### Low confidence on all fields

The content may be too short or generic. The deep crawl extracts linked content - ensure referenced entries have substantive text.

### 422 errors on save

Usually means concept IDs don't match what's in the organization. Run `scripts/setup-taxonomy.ts` to sync.
