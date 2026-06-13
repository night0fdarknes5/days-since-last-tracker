import { get, put } from "@vercel/blob";

const STORAGE_PATH = "incident/last-incident-time.json";

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return null;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();

  if (!rawBody) {
    return null;
  }

  return JSON.parse(rawBody);
}

async function readStoredIncidentTime() {
  const result = await get(STORAGE_PATH, {
    access: "private",
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  const content = await new Response(result.stream).text();

  if (!content) {
    return null;
  }

  const parsed = JSON.parse(content);
  const lastIncidentTime = parsed && typeof parsed === "object" ? parsed.lastIncidentTime : null;

  return typeof lastIncidentTime === "number" && Number.isFinite(lastIncidentTime) ? lastIncidentTime : null;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const lastIncidentTime = await readStoredIncidentTime();

      sendJson(res, 200, { lastIncidentTime });
      return;
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : "Failed to load incident time.",
      });
      return;
    }
  }

  if (req.method === "POST") {
    try {
      const body = await readRequestBody(req);
      const lastIncidentTime = body && typeof body === "object" ? body.lastIncidentTime : null;

      if (typeof lastIncidentTime !== "number" || !Number.isFinite(lastIncidentTime)) {
        sendJson(res, 400, { error: "lastIncidentTime must be a finite number." });
        return;
      }

      await put(
        STORAGE_PATH,
        JSON.stringify({ lastIncidentTime }),
        {
          access: "private",
          allowOverwrite: true,
          contentType: "application/json",
          cacheControlMaxAge: 60,
        },
      );
      sendJson(res, 200, { lastIncidentTime });
      return;
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : "Failed to save incident time.",
      });
      return;
    }
  }

  res.setHeader("Allow", "GET, POST");
  sendJson(res, 405, { error: "Method not allowed." });
}