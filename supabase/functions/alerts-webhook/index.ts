// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

async function verifySignature(req: Request, secret: string) {
  const signature = req.headers.get('x-signature') || '';
  if (!secret || !signature) return false;
  const raw = new Uint8Array(await req.arrayBuffer());
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, raw));
  // Convert provided signature from hex to bytes
  const provided = new Uint8Array(signature.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? []);
  const ok = timingSafeEqual(digest, provided);
  return { ok, rawBody: raw };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Env
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('ALERTS_WEBHOOK_SECRET') || '';

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Service not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // HMAC verification using raw body
    const verification = await verifySignature(req, webhookSecret);
    if (!verification || !verification.ok) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Reconstruct body JSON from raw
    const bodyText = new TextDecoder().decode(verification.rawBody);
    const payload = JSON.parse(bodyText);

    // Validate minimal fields
    const { external_id, user_id = null, symbol = null, title = null, summary = null, full_summary = null, action = 'hold', priority = 'medium', confidence = 'medium', last_price = null, change_pct = null, link = null, source = 'n8n', category = null, expires_at = null, payload: extra = null } = payload || {};

    if (!external_id) {
      return new Response(JSON.stringify({ error: 'external_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Insert / upsert
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error: upsertError } = await supabase
      .from('alerts')
      .upsert({
        external_id,
        user_id,
        symbol,
        title,
        summary,
        full_summary,
        action,
        priority,
        confidence,
        last_price,
        change_pct,
        link,
        source,
        category,
        expires_at,
        payload: extra,
        created_at: new Date().toISOString(),
      }, { onConflict: 'external_id' });

    if (upsertError) {
      return new Response(JSON.stringify({ error: 'DB upsert failed', details: upsertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server_error', details: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  }
});
