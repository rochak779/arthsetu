// Chatbot webhook proxy with detailed logging and CORS
// Reads target URL from env CHATBOT_TARGET_URL
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Local type shim for editors/linters; Supabase Edge runtime provides Deno at runtime.
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

function withCors(req: Request, resp: Response) {
  const origin = req.headers.get("origin") ?? "*";
  const requestedHeaders = req.headers.get("access-control-request-headers")
    ?? "authorization,apikey,content-type,x-client-info";
  const h = new Headers(resp.headers);
  h.set("access-control-allow-origin", origin);
  h.set("access-control-allow-methods", "POST, OPTIONS");
  h.set("access-control-allow-headers", requestedHeaders);
  // Help caches & proxies vary by origin/headers
  const varyPrev = h.get("vary");
  h.set("vary", varyPrev ? `${varyPrev}, origin, access-control-request-headers` : "origin, access-control-request-headers");
  return new Response(resp.body, { status: resp.status, headers: h });
}

function redactHeaders(h: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of h.entries()) obj[k] = k.toLowerCase() === "authorization" ? "<redacted>" : v;
  return obj;
}

Deno.serve(async (req: Request) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  const started = Date.now();
  try {
    if (req.method === "OPTIONS") {
      const origin = req.headers.get("origin") ?? "*";
      const requestedHeaders = req.headers.get("access-control-request-headers")
        ?? "authorization,apikey,content-type,x-client-info";
      return new Response(null, {
        status: 204,
        headers: new Headers({
          "access-control-allow-origin": origin,
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": requestedHeaders,
          "vary": "origin, access-control-request-headers",
          // Optionally cache preflight for a bit
          "access-control-max-age": "600",
        }),
      });
    }

    const url = new URL(req.url);
    const bodyText = await req.text();
    console.log(`[chatbot][${reqId}] incoming ${req.method} ${url.pathname}`, {
      len: bodyText.length,
      headers: redactHeaders(req.headers),
    });

    const target = Deno.env.get("CHATBOT_TARGET_URL") || "";
    if (!target) {
      console.warn(`[chatbot][${reqId}] CHATBOT_TARGET_URL not set`);
      return withCors(
        req,
        new Response(JSON.stringify({ error: "target_not_configured" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        })
      );
    }

    const upstreamRes = await fetch(target, {
      method: "POST",
      headers: { "content-type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: bodyText,
    }).catch((e) => {
      console.error(`[chatbot][${reqId}] upstream fetch error`, String(e));
      throw e;
    });

    const text = await upstreamRes.text();
    const ms = Date.now() - started;
    console.log(`[chatbot][${reqId}] upstream ${upstreamRes.status} in ${ms}ms`, {
      ok: upstreamRes.ok,
      preview: text.slice(0, 300),
    });

    const contentType = upstreamRes.headers.get("content-type") || "application/json";
    return withCors(
      req,
      new Response(text, { status: upstreamRes.status, headers: { "content-type": contentType } })
    );
  } catch (e: unknown) {
    const ms = Date.now() - started;
    const msg = typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
    console.error(`[chatbot][${reqId}] error after ${ms}ms`, msg);
    return withCors(
      req,
      new Response(
        JSON.stringify({ error: "chatbot_webhook_failed", details: msg }),
        { status: 502, headers: { "content-type": "application/json" } }
      )
    );
  }
});
