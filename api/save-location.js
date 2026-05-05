const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LOCATION_LIST_KEY = "locations";
const MAX_ITEMS = 1000;

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
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const { latitude, longitude, accuracyMeters, capturedAt, source, userAgent, timeZone } = req.body || {};

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return json(res, 400, { error: "Invalid latitude/longitude" });
    }

    const entry = {
      id: crypto.randomUUID(),
      latitude,
      longitude,
      accuracyMeters: typeof accuracyMeters === "number" ? accuracyMeters : null,
      capturedAt: capturedAt || new Date().toISOString(),
      source: source || "unknown",
      timeZone: timeZone || "unknown",
      userAgent: typeof userAgent === "string" ? userAgent.slice(0, 300) : "unknown"
    };

    await callRedis(["RPUSH", LOCATION_LIST_KEY, JSON.stringify(entry)]);
    await callRedis(["LTRIM", LOCATION_LIST_KEY, -MAX_ITEMS, -1]);

    return json(res, 200, {
      ok: true,
      id: entry.id,
      storedAt: entry.capturedAt
    });
  } catch (error) {
    return json(res, 500, {
      error: error.message || "Failed to save location"
    });
  }
}
