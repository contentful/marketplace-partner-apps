#!/usr/bin/env node

/* global console, process */

import fs from "node:fs";
import https from "node:https";
import http from "node:http";

const OPENAPI_URL = "http://localhost:8000/docs/openapi.json";
const OUTPUT_FILE = "filtered-openapi.json";
const INCLUDED_PATHS = [
  "/v1/style/",
  "/v1/internal/",
  "/v1/style-guides",
  "/internal/demo-feedback",
];

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

function filterPaths(openapiSpec, includedPaths) {
  const filteredSpec = { ...openapiSpec };

  if (!filteredSpec.paths) {
    console.warn("No paths found in OpenAPI spec");
    return filteredSpec;
  }

  const originalPathCount = Object.keys(filteredSpec.paths).length;
  const filteredPaths = {};

  for (const [path, pathItem] of Object.entries(filteredSpec.paths)) {
    const shouldInclude = includedPaths.some((includedPath) => path.startsWith(includedPath));

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
  const filteredSpec = filterPaths(openapiSpec, INCLUDED_PATHS);

  console.log(`Writing filtered spec to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filteredSpec, null, 2));

  console.log("✅ OpenAPI spec filtered successfully!");
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
