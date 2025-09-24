// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type IndexInfo = { price: number; changePct: number };
type Payload = {
  lastUpdated: string;
  indices: {
    nifty: IndexInfo | null;
    sensex: IndexInfo | null;
  };
  stale?: boolean;
};

const YAHOO_URL = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5ENSEI,%5EBSESN';
const CACHE_TTL_MS = 30_000; // 30 seconds

let cache: { data: Payload; expiresAt: number } | null = null;

async function fetchYahooQuotes(): Promise<Payload> {
  const res = await fetch(YAHOO_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Connection': 'keep-alive',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo fetch failed: ${res.status} ${res.statusText} ${text}`);
  }

  const json = await res.json();
  const result = json?.quoteResponse?.result || [];

  let nifty: IndexInfo | null = null;
  let sensex: IndexInfo | null = null;

  for (const item of result) {
    const symbol = item?.symbol as string;
    const price = Number(item?.regularMarketPrice ?? item?.price);
    const changePct = Number(item?.regularMarketChangePercent ?? item?.changePercent);

    if (symbol === '^NSEI') {
      nifty = Number.isFinite(price) && Number.isFinite(changePct)
        ? { price, changePct }
        : null;
    } else if (symbol === '^BSESN') {
      sensex = Number.isFinite(price) && Number.isFinite(changePct)
        ? { price, changePct }
        : null;
    }
  }

  return {
    lastUpdated: new Date().toISOString(),
    indices: { nifty, sensex },
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const now = Date.now();
    if (cache && cache.expiresAt > now) {
      return new Response(JSON.stringify({ ...cache.data, stale: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await fetchYahooQuotes();
    cache = { data, expiresAt: now + CACHE_TTL_MS };

    return new Response(JSON.stringify({ ...data, stale: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('indices-snapshot error:', error);
    const err = error as any;
    // Serve stale cache if available
    if (cache?.data) {
      return new Response(JSON.stringify({ ...cache.data, stale: true, error: err?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: err?.message || 'Failed to fetch indices' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
