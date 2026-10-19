# Live Classify Smoke Log

Date: 2026-03-19
Status: retired

The earlier version of this file documented a direct synthetic `asset` payload sent to `POST /api/tools/classify-content/execute`.

That request shape is no longer supported.

Current behavior:

- `classify-content/execute` requires a real Contentful `entryId`
- the route always performs a deep crawl before classification
- the sidebar and standalone classify UI now call only that execution path

A replacement log should only be captured from a real entry-backed run.
