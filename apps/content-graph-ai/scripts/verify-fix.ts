import "dotenv/config";

async function verify() {
  const baseUrl = "http://localhost:3000";
  console.log(`Verifying endpoints at ${baseUrl}...`);

  const endpoints = [
    "/api/slack/health",
    "/graph/search",
    "/api/tools/classify-content/execute",
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: endpoint.includes("execute") ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: endpoint.includes("execute") ? JSON.stringify({}) : undefined,
      });
      console.log(`${endpoint}: ${res.status} ${res.statusText}`);
      if (res.ok || res.status === 400) {
        console.log(await res.json());
      } else {
        console.log(await res.text());
      }
    } catch (e) {
      console.error(`${endpoint} failed:`, e);
    }
  }
}

verify();
