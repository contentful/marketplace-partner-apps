#!/usr/bin/env tsx
/**
 * Simple Test Content Setup Script (No Database Required)
 *
 * This is a lightweight version that directly calls Contentful APIs
 * without requiring PostgreSQL or full Mastra initialization.
 */

import "dotenv/config";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const MGMT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN!;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || "master";

if (!SPACE_ID || !MGMT_TOKEN) {
  console.error("❌ Missing required environment variables:");
  console.error("   CONTENTFUL_SPACE_ID:", SPACE_ID ? "✓" : "✗");
  console.error("   CONTENTFUL_MANAGEMENT_TOKEN:", MGMT_TOKEN ? "✓" : "✗");
  process.exit(1);
}

async function setupContentModel() {
  console.log("📋 Setting up content model with taxonomy fields...\n");

  const contentful = await import("contentful-management");
  const client = contentful.createClient({ accessToken: MGMT_TOKEN });

  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENV_ID);

  const contentTypeId = "aiDemoAsset";

  type ContentTypeRef = { fields: Array<{ id: string; name?: string; type?: string; required?: boolean; localized?: boolean; disabled?: boolean; omitted?: boolean; validations?: unknown[] }>; update(): Promise<ContentTypeRef>; publish(): Promise<void> };
  // Try to get existing content type
  let ct: ContentTypeRef;
  try {
    ct = (await environment.getContentType(contentTypeId)) as unknown as ContentTypeRef;
    console.log(`✅ Found existing content type: ${contentTypeId}`);
  } catch {
    // Create new content type
    console.log(`📝 Creating new content type: ${contentTypeId}`);

    const baseFields = [
      {
        id: "title",
        name: "Title",
        type: "Symbol",
        required: true,
        localized: true,
        disabled: false,
        omitted: false,
        validations: [],
      },
      {
        id: "url",
        name: "URL",
        type: "Symbol",
        required: false,
        localized: true,
        disabled: false,
        omitted: false,
        validations: [],
      },
      {
        id: "summary",
        name: "Summary",
        type: "Text",
        required: false,
        localized: true,
        disabled: false,
        omitted: false,
        validations: [],
      },
      {
        id: "body",
        name: "Body",
        type: "RichText",
        required: false,
        localized: true,
        disabled: false,
        omitted: false,
        validations: [],
      },
    ];

    ct = (await environment.createContentTypeWithId(contentTypeId, {
      name: "AI Demo Asset",
      displayField: "title",
      fields: baseFields,
    })) as unknown as ContentTypeRef;
    await ct.publish();
    ct = (await environment.getContentType(contentTypeId)) as unknown as ContentTypeRef;
  }

  // Add taxonomy fields
  const TOPICS = [
    "Industry Trends",
    "Product Features",
    "How To",
    "Case Study",
    "Company News",
    "Comparison",
    "General",
    "Thought Leadership",
    "Headless CMS",
    "Digital Transformation",
    "Localization",
    "API-First",
    "Content Modeling",
  ];
  const INTENTS = [
    "Awareness",
    "Consideration",
    "Decision",
    "Lifecycle",
    "Post-Purchase",
  ];
  const PERSONAS = [
    "Decision Makers",
    "Technical Users",
    "End Users",
    "Partners",
    "Investors",
    "General Audience",
    "Content Creators",
    "Digital Leaders",
    "Architects",
  ];
  const FUNNEL = [
    "Top Of Funnel",
    "Middle Of Funnel",
    "Bottom Of Funnel",
    "Post-Purchase",
    "Lifecycle",
  ];
  const INDUSTRIES = [
    "Technology",
    "Healthcare",
    "Finance",
    "Retail",
    "Manufacturing",
    "General Business",
    "E-commerce",
    "Media",
    "Travel",
    "Education",
  ];
  const SEGMENTS = ["SMB", "Mid-Market", "Enterprise"];

  const taxonomyFields = [
    {
      id: "aiTopic",
      name: "AI Topic",
      type: "Symbol",
      validations: [{ in: TOPICS }],
    },
    {
      id: "aiIntent",
      name: "AI Intent",
      type: "Symbol",
      validations: [{ in: INTENTS }],
    },
    {
      id: "aiPersona",
      name: "AI Persona",
      type: "Symbol",
      validations: [{ in: PERSONAS }],
    },
    {
      id: "aiFunnelStage",
      name: "AI Funnel Stage",
      type: "Symbol",
      validations: [{ in: FUNNEL }],
    },
    {
      id: "aiIndustry",
      name: "AI Industry",
      type: "Symbol",
      validations: [{ in: INDUSTRIES }],
    },
    {
      id: "aiSegment",
      name: "AI Segment",
      type: "Symbol",
      validations: [{ in: SEGMENTS }],
    },
    { id: "aiConfidence", name: "AI Overall Confidence", type: "Number" },
    { id: "aiLastClassified", name: "AI Last Classified At", type: "Date" },
    { id: "aiNeedsReview", name: "AI Needs Review", type: "Boolean" },
  ];

  const existingFieldIds = new Set(ct.fields.map((f) => f.id));
  let addedCount = 0;

  for (const spec of taxonomyFields) {
    if (!existingFieldIds.has(spec.id)) {
      ct.fields.push({
        id: spec.id,
        name: spec.name,
        type: spec.type,
        required: false,
        localized: true,
        disabled: false,
        omitted: false,
        validations: spec.validations || [],
      });
      addedCount++;
      console.log(`   ✓ Added field: ${spec.id}`);
    }
  }

  if (addedCount > 0) {
    const updated = await ct.update();
    await updated.publish();
    console.log(`\n✅ Added ${addedCount} taxonomy fields to ${contentTypeId}`);
  } else {
    console.log(`\n✅ All taxonomy fields already exist on ${contentTypeId}`);
  }
}

async function main() {
  console.log("🚀 Simple Test Content Setup\n");
  console.log(`Space: ${SPACE_ID}`);
  console.log(`Environment: ${ENV_ID}\n`);

  try {
    await setupContentModel();

    console.log("\n🎉 Setup complete!");
    console.log("\n📝 Next steps:");
    console.log("   1. Go to Contentful and create some test entries");
    console.log("   2. Use the Sidebar App to classify content");
    console.log("   3. Test the webhook by publishing an entry");
  } catch (error) {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  }
}

main();
