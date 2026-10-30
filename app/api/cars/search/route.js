// Server-side car rental route: holds NOTTE_API_KEY and calls the Anything API
// "Rentalcars.com Car Rental Search" function. The browser/app only ever talks
// to THIS route, never to Notte directly.
//
// The hotel route (app/api/search/route.js) is untouched and keeps its own
// contract; this file only mirrors its structure so both stay easy to follow.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FUNCTION_ID = "527ffa59-a927-4afb-be04-ae6e260288b2"; // Rentalcars.com Car Rental Search
const MCP_URL = "https://anything.notte.cc/mcp";

// '*' is fine here: no cookies/credentials are used, and the Capacitor app has its own origin.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body, status = 200) => Response.json(body, { status, headers: cors });

// Best-effort rate limit (in-memory; serverless instances don't share it).
// Kept separate from the hotel route so the two features never eat each other's quota.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 6;
}

const int = (v, min, max, d) => Math.min(max, Math.max(min, Number.isFinite(+v) ? Math.trunc(+v) : d));
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = (s) => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// The MCP reply may be the response itself or nested inside a wrapper,
// so we walk down to the object that actually carries `vehicles`.
function findVehicles(o, depth = 0) {
  if (!o || typeof o !== "object" || depth > 6) return null;
  if (Array.isArray(o.vehicles)) return o;
  for (const k of Object.keys(o)) {
    const r = findVehicles(o[k], depth + 1);
    if (r) return r;
  }
  return null;
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(request) {
  const key = process.env.NOTTE_API_KEY;
  if (!key) return json({ error: "server_not_configured" }, 500);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return json({ error: "rate_limited" }, 429);

  let b;
  try { b = await request.json(); } catch { return json({ error: "bad_request" }, 400); }

  const pickup_location = str(b.pickup_location, 120);
  const pickup_date = b.pickup_date;
  const dropoff_date = b.dropoff_date;
  if (!pickup_location || !isDate(pickup_date) || !isDate(dropoff_date) || dropoff_date < pickup_date) {
    return json({ error: "bad_request" }, 400);
  }

  const variables = {
    pickup_location,
    dropoff_location: str(b.dropoff_location, 120), // "" = same as pick-up (function default)
    pickup_date,
    pickup_time: isTime(b.pickup_time) ? b.pickup_time : "10:00",
    dropoff_date,
    dropoff_time: isTime(b.dropoff_time) ? b.dropoff_time : "10:00",
    driver_age: int(b.driver_age, 18, 99, 30),
    currency: /^[A-Z]{3}$/.test(b.currency) ? b.currency : "GBP", // function's own default
    page: int(b.page, 1, 20, 1),
  };

  const client = new Client({ name: "stayfinder-cars", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(new URL(MCP_URL), {
        requestInit: { headers: { Authorization: `Bearer ${key}` } },
      })
    );
    const r = await client.callTool(
      { name: "run", arguments: { function_id: FUNCTION_ID, variables } },
      undefined,
      { timeout: 55_000 }
    );
    if (r.isError) return json({ error: "upstream_error" }, 502);

    let data = r.structuredContent;
    if (!data) {
      const text = r.content?.find((c) => c.type === "text")?.text;
      try { data = JSON.parse(text); } catch { data = null; }
    }
    const found = findVehicles(data);
    if (!found) return json({ error: "unexpected_response" }, 502);

    const vehicles = found.vehicles;
    const err =
      found.error && (found.error.code || found.error.message)
        ? { code: String(found.error.code || ""), message: String(found.error.message || "") }
        : null;

    // No cars (or the site reported a problem such as a bad location or a WAF
    // block) still comes back as a normal JSON body, so the UI can pick its own
    // empty vs error state instead of guessing from an HTTP status.
    if (!vehicles.length) {
      return json({
        success: false,
        error: err || { code: "NO_RESULTS", message: "No cars matched those details." },
      });
    }
    return json({ success: true, vehicles, search_metadata: found.search_metadata || null });
  } catch (e) {
    const msg = String(e?.message || "");
    if (/401|403|unauthor/i.test(msg)) return json({ error: "bad_api_key" }, 502);
    if (/timeout|timed out/i.test(msg)) return json({ error: "timeout" }, 504);
    return json({ error: "upstream_error" }, 502);
  } finally {
    client.close().catch(() => {});
  }
}
