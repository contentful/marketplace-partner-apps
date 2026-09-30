import "dotenv/config";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || "master";
const ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;

if (!SPACE_ID || !ACCESS_TOKEN) {
  console.error(
    "❌ Missing CONTENTFUL_SPACE_ID or CONTENTFUL_ACCESS_TOKEN in .env",
  );
  process.exit(1);
}

const BASE_URL = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/${ENV_ID}`;

async function testConnection() {
  console.log(`🔌 Testing connection to Space: ${SPACE_ID} (${ENV_ID})...`);

  try {
    // 1. Fetch Content Types (Verifies Token & Space)
    const ctUrl = `${BASE_URL}/content_types?access_token=${ACCESS_TOKEN}`;
    const ctRes = await fetch(ctUrl);

    if (!ctRes.ok) {
      throw new Error(
        `API Error: ${ctRes.status} ${ctRes.statusText} - ${await ctRes.text()}`,
      );
    }

    const ctData = await ctRes.json();
    console.log(`✅ Connection Successful!`);
    console.log(`📚 Found ${ctData.total} Content Types:`);

    ctData.items.forEach((ct: { name: string; sys: { id: string } }) => {
      console.log(`   - ${ct.name} (ID: ${ct.sys.id})`);
    });

    // 2. Fetch a few entries to see what data looks like
    console.log("\n🔎 Fetching recent entries...");
    const entriesUrl = `${BASE_URL}/entries?access_token=${ACCESS_TOKEN}&limit=3`;
    const entriesRes = await fetch(entriesUrl);
    const entriesData = await entriesRes.json();

    console.log(`✅ Found ${entriesData.total} total Entries.`);
    console.log("   Recent 3 entries:");
    entriesData.items.forEach((entry: { sys: { id: string; contentType: { sys: { id: string } } }; fields: Record<string, unknown> }) => {
      const contentTypeId = entry.sys.contentType.sys.id;
      // Try to find a title field
      const title =
        entry.fields.title ||
        entry.fields.name ||
        entry.fields.headline ||
        entry.sys.id;
      console.log(`   - [${contentTypeId}] ${JSON.stringify(title)}`);
    });
  } catch (error: unknown) {
    console.error("❌ Connection Failed:", error instanceof Error ? error.message : String(error));
  }
}

testConnection();
