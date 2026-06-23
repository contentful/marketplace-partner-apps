#!/usr/bin/env node

/* global console, process */

import fs from "node:fs";
import https from "node:https";
import http from "node:http";

// Use dev OpenAPI spec so codegen works without a local API server; switch to localhost when developing API locally.
const OPENAPI_URL = "https://api.dev.markup.ai/docs/openapi.json";
const OUTPUT_FILE = "filtered-openapi.json";
const INCLUDED_PATHS = [
  "/agents/",
  "/v1/terminology/domains",
  "/account/config",
  "/auth/organizations",
];

// Exact-match paths: included only when the request path equals the entry, with
// NO sub-path inclusion.
// - `/account` needs this because its many `/account/*` siblings (members,
//   apikeys, groups, access-policies, …) must stay out of the generated client
//   — only the bare `GET /account` (current org + user) is wanted.
// - `/style-agent/style-guides` is the style-guide LIST op (replaces the
//   deprecated `/internal/targets` list). Exact-match keeps the deprecated
//   `/style-agent/targets*` routes and the `/style-agent/style-guides/{id}`
//   detail op out — no consumer needs the detail endpoint.
const INCLUDED_EXACT_PATHS = ["/account", "/style-agent/style-guides"];

function downloadOpenAPISpec(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    client
      .get(url, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            const spec = JSON.parse(data);
            resolve(spec);
          } catch (error) {
            reject(new Error(`Failed to parse OpenAPI spec: ${error.message}`));
          }
        });
      })
      .on("error", (error) => {
        reject(new Error(`Failed to download OpenAPI spec: ${error.message}`));
      });
  });
}

function filterPaths(openapiSpec, includedPaths, includedExactPaths) {
  const filteredSpec = { ...openapiSpec };

  if (!filteredSpec.paths) {
    console.warn("No paths found in OpenAPI spec");
    return filteredSpec;
  }

  const originalPathCount = Object.keys(filteredSpec.paths).length;
  const filteredPaths = {};

  for (const [path, pathItem] of Object.entries(filteredSpec.paths)) {
    const shouldInclude =
      includedExactPaths.includes(path) ||
      includedPaths.some((includedPath) => path.startsWith(includedPath));

    if (shouldInclude) {
      filteredPaths[path] = pathItem;
    }
  }

  filteredSpec.paths = filteredPaths;

  const filteredPathCount = Object.keys(filteredPaths).length;
  console.log(`Filtered OpenAPI spec: ${originalPathCount} → ${filteredPathCount} paths`);
  console.log(`Included paths: ${Object.keys(filteredPaths).join(", ")}`);

  return filteredSpec;
}

try {
  console.log(`Downloading OpenAPI spec from ${OPENAPI_URL}...`);
  const openapiSpec = await downloadOpenAPISpec(OPENAPI_URL);

  console.log("Filtering paths...");
  const filteredSpec = filterPaths(openapiSpec, INCLUDED_PATHS, INCLUDED_EXACT_PATHS);

  console.log(`Writing filtered spec to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filteredSpec, null, 2));

  console.log("✅ OpenAPI spec filtered successfully!");
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
