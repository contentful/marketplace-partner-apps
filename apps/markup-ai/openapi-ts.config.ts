import { defaultPlugins, defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./filtered-openapi.json",
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
