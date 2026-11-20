# Job Role Normalization

> Last updated: 2026-04-03

This repo now uses a governed title-style normalization layer for `jobFunction` and `jobLevel`.

It is designed around three metadata best-practice principles:

1. controlled vocabularies instead of freeform role labels
2. explicit alias mapping instead of one-off prompt guessing
3. preserve ambiguity when evidence is weak

## Why This Exists

The old approach mixed together:

- page-level role inference
- person-title normalization
- broad body-keyword matching

That made the classifier too eager to invent roles from weak context.

The new structure separates concerns:

- `jobRoleNormalization.ts`
  - governed source families and aliases
- `jobRoleNormalization.ts` helper
  - exact-title / contains / excludes matching
- `classificationRuntimePolicy.ts`
  - applies title-style normalization as a bounded post-processing step

## Best-Practice Basis

This structure follows the same patterns used in standard metadata systems:

- OCLC metadata guidance: controlled vocabularies, preferred terms, and cross-reference terms
- ESCO: occupations with preferred and non-preferred labels
- O\*NET: standardized occupation taxonomy and alternate titles

References:

- https://help.oclc.org/Metadata_Services/CONTENTdm/CONTENTdm_Administration/Collection_administration/070Use_controlled_vocabulary
- https://help.oclc.org/Metadata_Services/CONTENTdm/Get_started/best_practices
- https://esco.ec.europa.eu/en/classification/occupation-main
- https://esco.ec.europa.eu/en/about-esco/escopedia/escopedia/occupation
- https://www.onetcenter.org/taxonomy.html

## Runtime Shape

The runtime now uses this order:

1. keep the model output if there is no strong title-style match
2. if a governed title/style alias matches, normalize to the allowed taxonomy label
3. do not let broad body text casually override the role taxonomy

Case-study exception:

- case studies now use the full page differently for `jobFunction` and `jobLevel`
- `jobFunction` only survives explicit audience-style phrasing such as `for marketing teams` or `helps ecommerce teams`
- speaker titles inside the story can still inform `jobLevel`, but they do not automatically become the page’s target `jobFunction`
- if explicit audience evidence is absent, `jobFunction` stays blank instead of preserving a weak model guess like `Sales` or `Marketing`

This means:

- explicit title evidence can normalize roles cleanly
- weak page context does not force unnecessary role labels
- `jobFunction` should read as the page's primary buyer or evaluator roles, not a dump of every adjacent team mentioned in product copy
- `jobFunction` and `jobLevel` remain softer than deterministic fields like `language` or `region`

## Supported Job Function Families

Current governed source families mapped into the app taxonomy:

- `Content`
- `Digital`
- `Engineering`
- `IT/Engineering`
- `Marketing`
- `Product`
- `Retail / ecommerce`
- `Sales`
- `Procurement`
- `Web Development`

Each family supports:

- `exactTitles`
- `contains`
- `excludes`

## Supported Job Level Families

Current governed title-level mapping:

- `C-Level`
- `VP`
- `Director`
- `Manager`
- `Individual Contributor`
- `Consultant`

## Source of Truth

The governed configuration lives in:

- [jobRoleNormalization.ts](../../api/_shared/config/jobRoleNormalization.ts)

The helper logic lives in:

- [jobRoleNormalization.ts](../../api/_shared/utils/jobRoleNormalization.ts)

The classifier runtime integration lives in:

- [classificationRuntimePolicy.ts](../../api/_shared/tools/classificationRuntimePolicy.ts)

## Important Boundaries

This layer is intentionally narrow.

It is for title-style normalization, not for freeform audience inference.

Examples:

- `Chief Marketing Officer` -> `jobFunction=Marketing`, `jobLevel=C-Level`
- `Web Developer` -> `jobFunction=Web Development`, `jobLevel=Individual Contributor`
- a broad product page that happens to mention APIs does **not** automatically become `Web Development`

## Known Gaps

The mar ops source mapping is richer than the current app taxonomy.

Not everything has a clean destination label yet.

Examples:

- `Customer Experience` is present in the source mapping but not yet a first-class app taxonomy label
- executive-style role families mostly map through `jobLevel`, not `jobFunction`
- multilingual title coverage is seeded but not exhaustive

So this should be treated as a governed normalization backbone, not the final complete occupation ontology.
