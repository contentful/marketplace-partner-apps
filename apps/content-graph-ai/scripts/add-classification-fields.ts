#!/usr/bin/env tsx
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({
  path: resolve(process.cwd(), ".env.production.local"),
  override: false,
});
config({
  path: resolve(process.cwd(), ".vercel/.env.production.local"),
  override: true,
});
config({ path: resolve(process.cwd(), ".env.local"), override: false });

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const ENV_ID =
  process.env.CONTENTFUL_ENV_ID ||
  process.env.CONTENTFUL_ENVIRONMENT_ID ||
  "master";
const MGMT_TOKEN =
  process.env.CONTENTFUL_MANAGEMENT_TOKEN ||
  process.env.CONTENTFUL_ACCESS_TOKEN;

if (!SPACE_ID || !MGMT_TOKEN) {
  console.error(
    "❌ Missing required environment variables: CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN",
  );
  process.exit(1);
}

import contentfulManagement from "contentful-management";

async function addClassificationFields() {
  console.log(
    "🚀 Adding new classification fields to Contentful content type: aiDemoAsset...",
  );

  const client = contentfulManagement.createClient({
    accessToken: MGMT_TOKEN!,
  });

  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENV_ID);

  // Get the aiDemoAsset content type (this fetches the latest version)
  const contentType = await environment.getContentType("aiDemoAsset");
  console.log(
    `📦 Found content type: ${contentType.name} (version ${contentType.sys.version})`,
  );

  // Fields to add
  const newFields = [
    {
      id: "aiContentFormat",
      name: "AI Content Format",
      type: "Symbol",
      localized: false,
      required: false,
      validations: [],
      disabled: false,
      omitted: false,
    },
    {
      id: "aiContentFormatConfidence",
      name: "AI Content Format Confidence",
      type: "Number",
      localized: false,
      required: false,
      validations: [{ range: { min: 0, max: 1 } }],
      disabled: false,
      omitted: false,
    },
    {
      id: "aiTone",
      name: "AI Tone",
      type: "Symbol",
      localized: false,
      required: false,
      validations: [],
      disabled: false,
      omitted: false,
    },
    {
      id: "aiToneConfidence",
      name: "AI Tone Confidence",
      type: "Number",
      localized: false,
      required: false,
      validations: [{ range: { min: 0, max: 1 } }],
      disabled: false,
      omitted: false,
    },
    {
      id: "aiConversionIntent",
      name: "AI Conversion Intent",
      type: "Symbol",
      localized: false,
      required: false,
      validations: [],
      disabled: false,
      omitted: false,
    },
    {
      id: "aiConversionIntentConfidence",
      name: "AI Conversion Intent Confidence",
      type: "Number",
      localized: false,
      required: false,
      validations: [{ range: { min: 0, max: 1 } }],
      disabled: false,
      omitted: false,
    },
    {
      id: "aiCompetitorsMentioned",
      name: "AI Competitors Mentioned",
      type: "Boolean",
      localized: false,
      required: false,
      validations: [],
      disabled: false,
      omitted: false,
    },
    {
      id: "aiCompetitorNames",
      name: "AI Competitor Names",
      type: "Array",
      localized: false,
      required: false,
      validations: [],
      disabled: false,
      omitted: false,
      items: {
        type: "Symbol",
        validations: [],
      },
    },
    {
      id: "aiPositioningType",
      name: "AI Positioning Type",
      type: "Symbol",
      localized: false,
      required: false,
      validations: [],
      disabled: false,
      omitted: false,
    },
    {
      id: "aiRecommendedActions",
      name: "AI Recommended Actions",
      type: "Object",
      localized: false,
      required: false,
      validations: [],
      disabled: false,
      omitted: false,
    },
  ];

  console.log(
    `\n📝 Processing content type: ${contentType.name} (${contentType.sys.id}, version ${contentType.sys.version})`,
  );

  // Check which fields already exist
  const existingFieldIds = contentType.fields.map((f: { id: string }) => f.id);
  console.log(`\n   📋 Existing fields: ${existingFieldIds.join(", ")}`);

  const fieldsToAdd = newFields.filter((f) => !existingFieldIds.includes(f.id));

  if (fieldsToAdd.length > 0) {
    console.log(`\n   ➕ Adding ${fieldsToAdd.length} new fields...`);

    // Add new fields
    for (const field of fieldsToAdd) {
      contentType.fields.push(field as typeof contentType.fields[number]);
      console.log(`      - ${field.name}`);
    }
  }

  if (fieldsToAdd.length === 0) {
    console.log(`\n   ✅ All fields already exist!`);
  } else {
    try {
      console.log(`\n   💾 Saving changes...`);
      const updatedContentType = await contentType.update();
      console.log(
        `   ✅ Updated successfully (new version: ${updatedContentType.sys.version})`,
      );

      // Publish the content type
      console.log(`   📤 Publishing...`);
      await updatedContentType.publish();
      console.log(`   ✅ Published successfully!`);
    } catch (error: unknown) {
      console.error(`\n   ❌ Error updating content type:`);
      const errTyped = error as { message?: string; details?: { errors?: Array<{ name?: string; details?: string; value?: string }> } };
      console.error(`      ${errTyped.message}`);
      if (errTyped.details?.errors) {
        errTyped.details.errors.forEach((err) => {
          console.error(`      - ${err.name}: ${err.details || err.value}`);
        });
      }
      throw error;
    }
  }

  console.log("\n✨ Migration complete!");
}

addClassificationFields().catch(console.error);
