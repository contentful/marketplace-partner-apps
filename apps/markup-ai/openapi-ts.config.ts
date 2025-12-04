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
    "@tanstack/react-query",
  ],
});
