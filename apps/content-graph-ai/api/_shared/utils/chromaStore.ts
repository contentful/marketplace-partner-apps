let collectionIdPromise: Promise<string> | null = null;

function getChromaUrl(): string {
  return (process.env.CHROMA_URL || "").replace(/\/+$/, "");
}

function getChromaCollection(): string {
  return process.env.CHROMA_COLLECTION || "content-graph-corrections";
}

function hasChromaConfig(): boolean {
  return Boolean(getChromaUrl());
}

function chromaQuery(path: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${getChromaUrl()}${path}${separator}tenant=default_tenant&database=default_database`;
}

async function chromaFetch(path: string, init?: RequestInit): Promise<Record<string, unknown> | null> {
  const response = await fetch(chromaQuery(path), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!response.ok) {
    const j = json as Record<string, unknown> | null;
    const message =
      typeof j?.["error"] === "string"
        ? j["error"]
        : typeof j?.["detail"] === "string"
          ? j["detail"]
          : typeof j?.["message"] === "string"
            ? j["message"]
            : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return json as Record<string, unknown> | null;
}

async function ensureCollectionId(): Promise<string | null> {
  if (!hasChromaConfig()) return null;
  if (!collectionIdPromise) {
    collectionIdPromise = (async () => {
      const collection = await chromaFetch("/api/v1/collections", {
        method: "POST",
        body: JSON.stringify({
          name: getChromaCollection(),
          get_or_create: true,
        }),
      });
      return String(collection?.id || "");
    })();
  }
  return collectionIdPromise;
}

export async function resetChromaCollection(): Promise<void> {
  if (!hasChromaConfig()) return;
  try {
    await chromaFetch(
      `/api/v1/collections/${encodeURIComponent(getChromaCollection())}`,
      {
        method: "DELETE",
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("not found") && !message.includes("Not Found")) {
      throw error;
    }
  }
  collectionIdPromise = null;
}

export async function upsertCorrectionToChroma(params: {
  entryId: string;
  title: string;
  url: string;
  embedding: number[];
  fields: Record<string, string | string[]>;
  contentType?: string;
  notes?: string;
}) {
  const collectionId = await ensureCollectionId();
  if (!collectionId) return;

  await chromaFetch(`/api/v1/collections/${collectionId}/upsert`, {
    method: "POST",
    body: JSON.stringify({
      ids: [params.entryId],
      embeddings: [params.embedding],
      documents: [`${params.title}\n${params.url}`],
      metadatas: [
        {
          entryId: params.entryId,
          title: params.title,
          url: params.url,
          contentType: params.contentType || "",
          notes: params.notes || "",
          fields: JSON.stringify(params.fields || {}),
        },
      ],
    }),
  });
}

export async function queryCorrectionsFromChroma(params: {
  embedding: number[];
  limit?: number;
}): Promise<
  Array<{
    entryId: string;
    similarity: number;
    metadata: Record<string, string>;
  }>
> {
  const collectionId = await ensureCollectionId();
  if (!collectionId) return [];

  const result = await chromaFetch(
    `/api/v1/collections/${collectionId}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        query_embeddings: [params.embedding],
        n_results: params.limit ?? 5,
        include: ["metadatas", "distances"],
      }),
    },
  );

  const ids = (result?.ids as string[][])?.[0] ?? [];
  const metadatas = (result?.metadatas as Record<string, string>[][])?.[0] ?? [];
  const distances = (result?.distances as number[][])?.[0] ?? [];

  return ids.map((id: string, index: number) => ({
    entryId: id,
    similarity:
      typeof distances[index] === "number" ? 1 - Number(distances[index]) : 0,
    metadata: (metadatas[index] as Record<string, string>) || {},
  }));
}

export async function chromaHealthcheck(): Promise<boolean> {
  if (!hasChromaConfig()) return false;
  try {
    await chromaFetch("/api/v1/heartbeat");
    return true;
  } catch {
    return false;
  }
}
