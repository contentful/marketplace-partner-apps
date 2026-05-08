# Agent Guide — global-find-replace

## What This App Does
Provides a full-page find-and-replace tool across all entries in a Contentful space. Lets editors search for text patterns in field values and replace them in bulk — useful for fixing typos, updating URLs, or rebranding across a large content set.

## Archetype
Standard Vite app. Page-only location.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page find/replace interface |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-icons` | Icons |
| `@contentful/react-apps-toolkit` | `useSDK()` |
| `@contentful/rich-text-plain-text-renderer` | Extracts text from rich-text fields for search |

## Source Layout

```
src/
├── App.tsx
├── locations/         # Page
├── assets/
├── components/
├── hooks/
├── services/          # CMA search and replace logic
├── types/
└── utils/
```

## Sharp Edges & Invariants

- **Destructive operation**: find-and-replace modifies entry field values in bulk. Always require explicit user confirmation before executing replacements.
- **CMA rate limits**: replacing across many entries fires many `entry.update()` calls. The `services/` layer must batch and throttle these (CMA limit: 7 req/s per space). Do not introduce unbounded parallel CMA writes.
- **Rich-text handling**: `@contentful/rich-text-plain-text-renderer` extracts plain text for search matching. Replacing text in rich-text fields is complex — it requires walking the Document node tree and replacing text nodes in place, not string-replacing the serialized value.
- **Field type awareness**: the search/replace logic must handle `Symbol`, `Text`, and `RichText` field types differently — plain string replacement works for Symbol/Text, but rich-text requires node traversal.
- Search results must show the entry ID, field, and locale so users can review before committing.

## Never / Always

- **Never** execute bulk replacements without explicit user confirmation.
- **Never** string-replace serialized rich-text JSON — always traverse the Document node tree.
- **Never** fire unbounded parallel CMA writes — always throttle.
