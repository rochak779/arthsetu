// Chatbot webhook proxy with detailed logging and CORS
// Reads target URL from env CHATBOT_TARGET_URL
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Local type shim for editors/linters; Supabase Edge runtime provides Deno at runtime.
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const allowCors = (resp: Response) => {
  const h = new Headers(resp.headers);
  // Permissive CORS for debugging; consider restricting in production
  if (!h.has("access-control-allow-origin")) h.set("access-control-allow-origin", "*");
  h.set("access-control-allow-headers", "authorization, content-type");
  h.set("access-control-allow-methods", "POST, OPTIONS");
  return new Response(resp.body, { status: resp.status, headers: h });
};

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
      return allowCors(new Response(null, { status: 204 }));
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
      return allowCors(
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
    return allowCors(
      new Response(text, { status: upstreamRes.status, headers: { "content-type": contentType } })
    );
  } catch (e: unknown) {
    const ms = Date.now() - started;
    const msg = typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
    console.error(`[chatbot][${reqId}] error after ${ms}ms`, msg);
    return allowCors(
      new Response(
        JSON.stringify({ error: "chatbot_webhook_failed", details: msg }),
        { status: 502, headers: { "content-type": "application/json" } }
      )
    );
  }
});
