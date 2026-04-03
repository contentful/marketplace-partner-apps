# Gemini Pipeline Update

Date: 2026-03-14

## Target Architecture

```text
[Layer 1] NLP Pre-processing (GLiNER-style entities, zero-shot intent)
        ↓
[Layer 2] External Data (Company Cache)
        ↓
[Layer 3] Prompt Chain + Dynamic Vector Few-Shot
        ├─> Prompt A: Fact Classification
        └─> Prompt B: Subjective Classification
        ↓
[Layer 4] Strict Structured Validation + Overrides
```

## Required Changes

### 1. Replace Regex-Only Layer 1 With NLP-First Pre-processing

- Use a lightweight local entity/intent layer before Gemini.
- Entity extraction must catch paraphrased product, competitor, and company mentions.
- Intent detection must catch pricing/demo/documentation intent without exact CTA phrases.
- Regex heuristics remain only as a fallback.

### 2. Break Monolithic Prompting Into Chained Stages

- Separate objective facts from subjective judgement.
- Prompt A should classify fields like topic, product, schema, use case, industry.
- Prompt B should classify fields like audience, funnel stage, and job level using Prompt A output.
- Structured output must stay strict and schema-bound.

### 3. Dynamic Few-Shot Retrieval

- Replace static example injection with semantic retrieval over corrected examples.
- Use embeddings to select the most structurally similar reviewed pages for each classification.
- Keep the retrieval layer observable so reviewers can see which examples were used.

### 4. Taxonomy Hardening

- Merge ambiguous tags that are too semantically close for reliable AI separation.
- Push deterministic business decisions down into the override layer instead of asking the model to guess.
- Case-study and pricing behavior should be hard-coded where business rules are already settled.

### 5. Observability

- Log exact prompts, few-shot examples, token usage, latency, and review routing.
- Make every classification explainable after the fact.
- Persist traces in a form that can be reviewed during taxonomy disputes.

### 6. Async Processing and Rate Limits

- Webhooks must enqueue jobs, not block on classification.
- Background workers must process the queue with retry/backoff behavior.
- Bulk reclassification must be safe for large backfills.

### 7. Human-in-the-Loop

- Low-confidence output must route to review instead of silently applying defaults.
- The system should persist a review queue item, tag the entry for review when configured, and alert Slack.

### 8. PromptOps

- Prompt versions must be explicit and reviewable.
- Prompt changes must run against a deterministic dataset in CI before merge.
- Golden datasets must live in the repo, not in ad hoc local state.
