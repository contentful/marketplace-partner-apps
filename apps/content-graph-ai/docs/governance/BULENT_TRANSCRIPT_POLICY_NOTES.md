# Bulent Transcript Policy Notes

Source:
- Bulent / Zuhur — Taxonomy AI follow-up transcript (local file; not in repository)
- Contentful — Tagging Taxonomy & Permissions workbook (local `.xlsx`; not in repository)

These notes capture the concrete taxonomy decisions stated in the meeting and how they should influence the classifier.

## Confirmed policy decisions

- Broad posts that are not explicitly targeting a vertical should not be forced into `Software, IT & Technology`.
- If a broad label is not available or not desired, `industry` should be left blank rather than guessed.
- Broad developer and educational guides can apply across startup, SMB, mid-market, and enterprise.
- `companySize` should not be inferred from logo mentions alone on broad educational content.
- `jobFunction` contains overlapping developer buckets that should eventually be merged upstream.
- For developer-heavy technical content, `Developers` is the clearest persona.
- Broad SEO pillars are mostly `Awareness (TOFU)`.
- Multi-select taxonomy is valid when values are truly applicable; Bulent described up to 3 audiences as acceptable in blog practice.
- `Studio` should no longer be treated as an active standalone product tag.
- `Studio` content should map to `Platform`.
- `Analytics` is a newer product area and should be treated distinctly where explicitly applicable.
- `Personalization` should only be applied when the page is actually about personalization, experimentation, or segmentation.
- API and TypeScript learning content about Contentful should map to `Platform`.
- `Personalization` is already present in the workbook as a topic for genuinely personalization-specific content.
- `Web Development` is already present in the workbook as a topic for API, developer, and technical web implementation content.
- `useCases` can legitimately take more than one value when the page truly spans them, such as `Websites` and `Omnichannel`.
- `Digital experiences`, `Omnichannel`, and `Websites` should remain separate concepts.
- Missing topics and use cases are an upstream taxonomy-governance issue, not something the classifier should invent locally.
- The workbook currently does not include `General audience`, `General business`, `Migration & Replatforming` as a use case, or `Analytics` as a product.

## Implementation implications

- Prefer deterministic blanks over overconfident guesses for `industry` and `companySize`.
- Keep `jobLevel` unset on broad SEO pages unless the page explicitly targets a seniority band.
- Use transcript-backed product mapping:
  - `Studio` -> `Platform`
  - `Analytics` -> `Analytics` once the workbook product list is updated
  - API education -> `Platform`
  - personalization/segmentation -> `Personalization`
- Treat missing taxonomy concepts as governance follow-up items for content owners.
