const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LOCATION_LIST_KEY = "locations";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
}

async function callRedis(commandParts) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error("Missing Upstash Redis environment variables");
  }

  const response = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(commandParts)
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || "Redis request failed");
  }

  return data;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const countParam = Number(req.query.count || 20);
    const count = Number.isFinite(countParam) ? Math.max(1, Math.min(100, countParam)) : 20;

    const listResponse = await callRedis(["LRANGE", LOCATION_LIST_KEY, -count, -1]);
    const items = Array.isArray(listResponse.result)
      ? listResponse.result.map((entry) => {
          try {
            return JSON.parse(entry);
          } catch {
            return { raw: entry };
          }
        })
      : [];

    return json(res, 200, {
      ok: true,
      count: items.length,
      items
    });
  } catch (error) {
    return json(res, 500, {
      error: error.message || "Failed to fetch locations"
    });
  }
}
