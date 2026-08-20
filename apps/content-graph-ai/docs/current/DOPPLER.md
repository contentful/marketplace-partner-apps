# Secrets: Doppler

All runtime secrets for this app are stored in **Doppler**, not committed to git. Treat `.env.example` as a **key checklist** only; values always come from Doppler (or your team’s secret sync into Vercel).

## Vercel (production / preview)

Use the **Doppler Vercel integration** so Preview and Production environments receive the same keys as your Doppler configs (for example `prd` / `preview`). See [Doppler + Vercel](https://docs.doppler.com/docs/vercel).

Required variables match `.env.example` and the README “Required Environment Variables” table (including `CRON_SECRET` for cron routes and a 64-character `CONTENTFUL_WEBHOOK_SECRET` when webhook signing is enabled).

## Local development

1. Install the [Doppler CLI](https://docs.doppler.com/docs/install-cli).
2. `doppler login`
3. From the repo root, either run `doppler setup` and select this project, or rely on committed `doppler.yaml` if your project name is `content-graph`.
4. Start the app with secrets injected:

```bash
npm run start:doppler
```

That runs the repo-native local dev server with environment variables from the Doppler **config** selected in `doppler.yaml` (default `dev`). Switch configs with `doppler configure` or by editing `doppler.yaml`.

If you explicitly want Vercel CLI emulation instead of the local server, use:

```bash
npm run start:vercel
```

## Optional: `.env.production.local`

You can still copy `.env.example` → `.env.production.local` for offline work or tools that only read dotenv files. Do **not** commit `.env*.local`. Prefer `npm run start:doppler` when possible so secrets stay in Doppler.

## CI

Inject secrets in GitHub Actions (or other CI) with [Doppler in CI](https://docs.doppler.com/docs/github-actions) using a service token, or rely on Vercel’s synced env for preview deployments.

The live-trace automation in [`.github/workflows/live-trace.yml`](../../.github/workflows/live-trace.yml) can use either:

- a GitHub secret named `DOPPLER_TOKEN`, which runs `doppler run --config ...` inside the workflow, or
- direct GitHub Actions secrets for `CONTENTFUL_SPACE_ID`, `CONTENTFUL_MANAGEMENT_TOKEN`, `CONTENTFUL_CDA_TOKEN`, and `GOOGLE_GENERATIVE_AI_API_KEY`

Either path still uses the local Docker vendor stack in CI for Chroma, Phoenix, Postgres, and the NLP sidecar.
