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

const YAHOO_URL_PRIMARY = 'https://query2.finance.yahoo.com/v7/finance/quote?symbols=%5ENSEI,%5EBSESN&region=IN&lang=en-IN';
const YAHOO_URL_FALLBACK = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5ENSEI,%5EBSESN&region=IN&lang=en-IN';
const YAHOO_CHART_URL = (sym: string) => `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?region=IN&lang=en-IN&range=1d&interval=2m`;
const Y_REFERER_NSEI = 'https://finance.yahoo.com/quote/%5ENSEI';
const Y_REFERER_BSESN = 'https://finance.yahoo.com/quote/%5EBSESN';
const NSE_ALL_INDICES = 'https://www.nseindia.com/api/allIndices';
const CACHE_TTL_MS = 30_000; // 30 seconds

let cache: { data: Payload; expiresAt: number } | null = null;
let yahooCookie = '';
let nseCookie = '';

async function warmUpYahoo(): Promise<string> {
  // Grab cookies by visiting the finance quote page first
  const warm = await fetch('https://finance.yahoo.com/quote/%5ENSEI', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
  // Collate cookies if present
  const setCookie = warm.headers.get('set-cookie') || '';
  // Normalize cookie header for reuse
  yahooCookie = setCookie
    .split(',')
    .map((c) => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
  return yahooCookie;
}

async function fetchYahooQuotes(): Promise<Payload> {
  const cookie = yahooCookie || (await warmUpYahoo().catch(() => ''));
  const commonHeaders: HeadersInit = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Connection': 'keep-alive',
    'Referer': Y_REFERER_NSEI,
  };
  if (cookie) {
    (commonHeaders as any)['cookie'] = cookie;
  }

  // Try primary host first, then fallback
  let res = await fetch(YAHOO_URL_PRIMARY, { headers: commonHeaders }).catch(() => undefined as any);
  if (!res || !res.ok) {
    const text = res ? await res.text() : 'no-response';
    console.log(`Yahoo primary failed: ${res?.status} ${res?.statusText} ${text}`);
    res = await fetch(YAHOO_URL_FALLBACK, { headers: commonHeaders }).catch(() => undefined as any);
  }

  if (!res || !res.ok) {
    // Try chart fallback per symbol before failing
    const cfNifty = await fetchYahooChart('^NSEI', cookie);
    const cfSensex = await fetchYahooChart('^BSESN', cookie);
    if (!cfNifty && !cfSensex) {
      const text = res ? await res.text() : 'no-response';
      throw new Error(`Yahoo fetch failed: ${res?.status} ${res?.statusText} ${text}`);
    }
    return buildPayload(cfNifty, cfSensex);
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

  // Fill missing via chart fallback if needed
  if (!nifty) nifty = await fetchYahooChart('^NSEI', cookie);
  if (!sensex) sensex = await fetchYahooChart('^BSESN', cookie);

  return buildPayload(nifty, sensex);
}

function buildPayload(nifty: IndexInfo | null, sensex: IndexInfo | null): Payload {
  return {
    lastUpdated: new Date().toISOString(),
    indices: { nifty, sensex },
  };
}

async function fetchYahooChart(symbol: string, cookie?: string): Promise<IndexInfo | null> {
  const headers: HeadersInit = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Connection': 'keep-alive',
    'Referer': symbol === '^BSESN' ? Y_REFERER_BSESN : Y_REFERER_NSEI,
  };
  if (cookie) (headers as any)['cookie'] = cookie;
  try {
    const res = await fetch(YAHOO_CHART_URL(symbol), { headers });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    const price = Number(
      meta?.regularMarketPrice ?? meta?.previousClose ?? meta?.chartPreviousClose ?? NaN,
    );
    let changePct = Number(meta?.regularMarketChangePercent ?? NaN);
    if (!Number.isFinite(changePct)) {
      const prev = Number(meta?.previousClose ?? meta?.chartPreviousClose ?? NaN);
      if (Number.isFinite(price) && Number.isFinite(prev) && prev) {
        changePct = ((price - prev) / prev) * 100;
      }
    }
    return Number.isFinite(price) && Number.isFinite(changePct) ? { price, changePct } : null;
  } catch (_e) {
    return null;
  }
}

async function warmUpNSE(): Promise<string> {
  const res = await fetch('https://www.nseindia.com/', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  const setCookie = res.headers.get('set-cookie') || '';
  nseCookie = setCookie
    .split(',')
    .map((c) => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
  return nseCookie;
}

async function fetchNiftyFromNSE(): Promise<IndexInfo | null> {
  const cookie = nseCookie || (await warmUpNSE().catch(() => ''));
  const headers: HeadersInit = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/',
    'x-requested-with': 'XMLHttpRequest',
  };
  if (cookie) (headers as any)['cookie'] = cookie;
  try {
    const res = await fetch(NSE_ALL_INDICES, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    const data: any[] = json?.data || [];
    const nifty = data.find(
      (d: any) =>
        (d?.index && String(d.index).toUpperCase() === 'NIFTY 50') ||
        (d?.indexSymbol && String(d.indexSymbol).toUpperCase() === 'NIFTY 50'),
    );
    if (!nifty) return null;
    const price = Number(nifty?.last ?? nifty?.lastPrice ?? nifty?.value ?? NaN);
    const changePct = Number(nifty?.percentChange ?? nifty?.pChange ?? NaN);
    return Number.isFinite(price) && Number.isFinite(changePct) ? { price, changePct } : null;
  } catch (_e) {
    return null;
  }
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

    let data = await fetchYahooQuotes();

    // If either index is missing, try NSE fallback for NIFTY only (Yahoo often fails temporarily)
    if (!data.indices?.nifty) {
      const nseNifty = await fetchNiftyFromNSE();
      if (nseNifty) {
        data = { ...data, indices: { ...data.indices, nifty: nseNifty } } as Payload;
      }
    }

    cache = { data, expiresAt: now + CACHE_TTL_MS };

    return new Response(JSON.stringify({ ...data, stale: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('indices-snapshot error:', error);
    const err = (error as any)?.message || 'Failed to fetch indices';
    // Serve stale cache if available
    if (cache?.data) {
      return new Response(JSON.stringify({ ...cache.data, stale: true, error: err }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // No cache: return empty-but-200 payload to avoid frontend 500s
    const empty: Payload = {
      lastUpdated: new Date().toISOString(),
      indices: { nifty: null, sensex: null },
      stale: true,
    } as any;
    return new Response(JSON.stringify({ ...empty, error: err }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
