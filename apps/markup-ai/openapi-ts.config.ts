import { defaultPlugins, defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./filtered-openapi.json",
  parser: {
    filters: {
      // Prune schema components not referenced by any included operation so the
      // generated client only emits types in use. Without this, the path filter
      // in scripts/filter-openapi.js leaves orphaned `components.schemas` (e.g.
      // the now-unused TargetResponse / ConstantsResponse) in the output.
      orphans: false,
    },
  },
  output: {
    format: "prettier",
    path: "src/api-client",
  },

  plugins: [
    ...defaultPlugins,
    "@hey-api/client-fetch",
    {
      enums: "typescript",
      name: "@hey-api/typescript",
    },
    {
      name: "@tanstack/react-query",
      // Infinite query variants use v5 type signatures; the project pins react-query v4.
      infiniteQueryOptions: false,
    },
  ],
});
