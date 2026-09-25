import "dotenv/config";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || "master";
const ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;

const BASE_URL = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/${ENV_ID}`;

async function checkAiFields() {
  console.log("🔍 Checking Content Types for AI fields...");

  // Check a few key types
  const typesToCheck = ["componentArticle", "page", "componentBlogEntry"];

  for (const typeId of typesToCheck) {
    try {
      const url = `${BASE_URL}/content_types/${typeId}?access_token=${ACCESS_TOKEN}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`⚠️ Could not fetch type ${typeId}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const aiFields = (data.fields as Array<{ id: string; type: string }>).filter((f) => f.id.startsWith("ai"));

      console.log(`\n📄 Type: ${data.name} (${typeId})`);
      if (aiFields.length > 0) {
        console.log(`   ✅ Found ${aiFields.length} AI fields:`);
        aiFields.forEach((f) =>
          console.log(`      - ${f.id} (${f.type})`),
        );
      } else {
        console.log(`   ❌ NO AI fields found (e.g. aiTopic, aiPersona).`);
        console.log(`      Writing to this type will FAIL.`);
      }
    } catch (e: unknown) {
      console.error(e instanceof Error ? e.message : String(e));
    }
  }
}

checkAiFields();
