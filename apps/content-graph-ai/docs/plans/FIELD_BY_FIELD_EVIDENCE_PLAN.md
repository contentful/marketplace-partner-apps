# Field-by-Field Evidence Plan

This plan corrects the architectural drift between the intended product and the current implementation.

The intended product is an extremely accurate, field-by-field classifier. That means each taxonomy field should be decided from the right evidence for that field, not from one broad semantic pass plus cleanup rules.

## Goal

Build a shared structured evidence map once per content item, then resolve each major taxonomy field from field-specific evidence rules, with narrow LLM tie-breakers only when ambiguity remains.

## Principles

- Prefer explicit evidence over broad inference.
- Use the whole content structurally, not as one flat keyword bag.
- Keep `blank` as a valid outcome when evidence is weak.
- Store provenance for every final field decision.
- Use LLMs to resolve ambiguity, not to invent unsupported certainty.

## Shared Evidence Map

Every page should be decomposed once into evidence zones:

- `title`
- `slug`
- `hero`
- `subtitle`
- `summary`
- `sectionHeadings`
- `bodySections`
- `quoteBlocks`
- `speakerMetadata`
- `ctaBlocks`
- `footerBoilerplate`

Each extracted evidence item should carry:

- `text`
- `zone`
- `weight`
- `source`
- `position`

## Field Rules

### jobFunction

Question answered:

- Who is this content written for by role?

Primary evidence:

- hero
- summary
- explicit audience-addressing phrases in high-signal sections

Weak or excluded evidence:

- quoted customer titles
- speaker metadata
- footer text
- incidental body mentions

Decision rule:

- Only set `jobFunction` when the page clearly reads as written with that role in mind.
- Case studies should often stay blank unless the page explicitly addresses a role.

### jobLevel

Question answered:

- What seniority level is the content aimed at?

Primary evidence:

- explicit seniority phrases
- speaker metadata
- title-style role evidence
- high-signal summary language

Decision rule:

- Seniority may use speaker/title evidence.
- Do not force executive labels from broad strategic tone alone.

### audience

Question answered:

- Is this for prospects, customers, partners, community, or internal audiences?

Primary evidence:

- explicit audience language
- strong URL and page-type signals such as docs, partners, careers

Decision rule:

- Do not default broad public content to `Prospect`.
- Leave blank unless the audience class is explicit enough.

### topic

Question answered:

- What is the content fundamentally about?

Primary evidence:

- title
- slug
- hero
- summary
- repeated central framing across core body sections

Weak evidence:

- isolated mentions in quotes
- footer/CTA spillover

Decision rule:

- Choose the smallest set of central topics.
- Suppress secondary feature inflation from incidental mentions.

### useCases

Question answered:

- Why would someone use the product in the context described by this page?

Primary evidence:

- explicit value framing
- challenge/solution sections
- outcomes sections
- high-signal summary copy

Decision rule:

- Use only the main use cases actually supported by the page.
- Keep caps enforced and avoid kitchen-sink tagging.

### industry

Question answered:

- Which vertical is this content actually targeting?

Primary evidence:

- explicit vertical framing
- solution-page structure
- strong industry phrases in hero/summary

Weak or excluded evidence:

- customer logos
- partner lists
- random named brands

Decision rule:

- Prefer explicit target-vertical evidence over company-logo noise.
- Leave blank when no clear target vertical exists.

### funnelStage

Question answered:

- Where does this content sit in the buyer journey?

Primary evidence:

- CTA structure
- offer type
- page type
- depth of proof and evaluation framing

Decision rule:

- Funnel stage should not be derived from topic or seniority.
- Resolve independently from intent evidence.

### competitivePositioning

Question answered:

- Does the content explicitly position against competitors or incumbent categories?

Primary evidence:

- explicit comparison language
- named controlled-taxonomy competitor mentions
- incumbent category framing

Weak or excluded evidence:

- customer proof logos
- adjacent vendor mentions without comparison context

Decision rule:

- Only preserve competitor tags when the comparison intent is explicit enough.

## Rollout

### Phase 1

- Create a shared evidence-map helper.
- Add provenance structures for final field decisions.
- Move `jobFunction`, `jobLevel`, and `industry` to section-aware evidence rules.

### Phase 2

- Move `topic`, `useCases`, and `funnelStage` to field-specific evidence resolution.
- Keep LLM usage as a bounded tie-breaker over candidate labels.

### Phase 3

- Update Phoenix evals to score per-field evidence provenance quality.
- Expand regression fixtures by page family:
  - product
  - solution
  - case study
  - webinar
  - ebook
  - docs

## Acceptance Criteria

- Each major taxonomy field has a documented evidence policy.
- Each major taxonomy field can emit provenance.
- Case-study `jobFunction` no longer comes from speaker-title leakage.
- Industry no longer comes from logo leakage.
- Topic and use-case inflation drop on broad platform and case-study pages.
- Live traces show field decisions tied to scoped evidence rather than broad body guesses.

## Non-Goals

- One generic whole-page keyword system for all fields.
- Making every field depend on the same evidence zones.
- Using the LLM as the sole decider for semantic fields.
