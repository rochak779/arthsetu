import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
// @ts-ignore - Resolved by Deno at runtime; types not needed in Node tooling
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

// Local type shim for editors/linters; Supabase Edge runtime provides Deno at runtime.
declare const Deno: {
  env: { get(name: string): string | undefined }
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
}

// Dynamic CORS helper: echo Origin and Access-Control-Request-Headers so
// clients (including supabase-js) can send x-client-info/apikey, etc.
function buildCorsHeaders(req: Request, extra?: HeadersInit) {
  const origin = req.headers.get('origin') ?? '*'
  const acrh = req.headers.get('access-control-request-headers') ?? 'authorization,content-type,apikey,x-client-info'
  const h = new Headers(extra ?? {})
  h.set('access-control-allow-origin', origin)
  h.set('access-control-allow-methods', 'POST, OPTIONS')
  h.set('access-control-allow-headers', acrh)
  h.set('access-control-max-age', '600')
  const prevVary = h.get('vary')
  h.set('vary', prevVary ? `${prevVary}, origin, access-control-request-headers` : 'origin, access-control-request-headers')
  return h
}

type HFLabel = 'positive' | 'neutral' | 'negative'
type TwUser = {
  id: string
  username: string
  name?: string
  verified?: boolean
  verified_type?: string | null
  created_at?: string
  protected?: boolean
  public_metrics?: { followers_count: number }
}

type ReqBody = { symbol: string; max?: number }

// Per-symbol cooldown (ms). Default 3 minutes. Can be overridden via env SENTIMENT_TTL_MS.
const TTL_MS = Number((globalThis as any)?.Deno?.env?.get('SENTIMENT_TTL_MS') ?? '180000')

Deno.serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: buildCorsHeaders(req) })
  }

  const reqId = crypto.randomUUID().slice(0, 8)
  const started = Date.now()
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const twitterBearer = Deno.env.get('TWITTER_BEARER_TOKEN')!
    const hfToken = Deno.env.get('HF_API_TOKEN')!
    const hfModel = 'tabularisai/multilingual-sentiment-analysis'

    const supabase = createClient(supabaseUrl, serviceKey)

    // Require auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.warn(`[analyze][${reqId}] missing auth header`)
      return json(req, { error: 'unauthorized' }, 401)
    }

    const bodyText = await req.text()
    console.log(`[analyze][${reqId}] start`, { hasAuth: true, len: bodyText.length })
    const { symbol, max = 25 } = (bodyText ? JSON.parse(bodyText) : ({} as ReqBody)) as ReqBody
    if (!symbol) return json(req, { error: 'symbol_required', message: 'Please provide a stock symbol (e.g., HDFCBANK).' }, 400)
    const sym = String(symbol).toUpperCase().trim()
    const cap = clamp(Number(max), 1, 50)

    // State (includes last_run_at to enforce cooldown)
    const { data: state } = await supabase
      .from('market_sentiment_state')
      .select('since_id,last_run_at')
      .eq('symbol', sym)
      .maybeSingle()
    const since_id = state?.since_id ?? undefined

    // Cooldown: skip if we ran too recently
    if (state?.last_run_at) {
      const last = new Date(state.last_run_at).getTime()
      const age = Date.now() - last
      if (age < TTL_MS) {
        const nextAllowedAt = new Date(last + TTL_MS).toISOString()
        console.log(`[analyze][${reqId}] cooldown skip for ${sym}`, { ageMs: age, ttlMs: TTL_MS })
        return json(req, {
          symbol: sym,
          skipped: true,
          reason: 'cooldown',
          nextAllowedAt,
          message: `Please wait a bit. You can analyze ${sym} again after ${new Date(last + TTL_MS).toLocaleTimeString()}.`,
          stale: true,
        }, 200)
      }
    }

    // Load trusted allowlist for this symbol
    const { data: trusted } = await supabase
      .from('trusted_accounts')
      .select('handle')
      .contains('symbols', [sym])
    const allow = new Set((trusted ?? []).map((r: { handle: string }) => String(r.handle).toLowerCase()))

    // Twitter search recent with author expansion
    const fromClause = allow.size > 0 ? ` (${Array.from(allow).slice(0,20).map(h => `from:${h}`).join(' OR ')})` : ''
    const query = `${sym} -is:retweet -is:reply${fromClause}`
    const url = new URL('https://api.twitter.com/2/tweets/search/recent')
    url.searchParams.set('query', query)
  // Reduce request size to conserve rate limits
  url.searchParams.set('max_results', String(clamp(cap, 10, 20)))
    url.searchParams.set('sort_order', 'recency')
    if (since_id) url.searchParams.set('since_id', since_id)
    url.searchParams.set('tweet.fields', 'created_at,lang,public_metrics,possibly_sensitive,author_id')
    url.searchParams.set('expansions', 'author_id')
    url.searchParams.set('user.fields', 'username,verified,verified_type,public_metrics,created_at,protected,name')

    const twRes = await fetch(url, { headers: { Authorization: `Bearer ${twitterBearer}` } })
    const twText = await twRes.text()
    if (!twRes.ok) {
      // Inspect rate-limit headers and apply soft backoff
      const rate = {
        limit: twRes.headers.get('x-rate-limit-limit'),
        remaining: twRes.headers.get('x-rate-limit-remaining'),
        reset: twRes.headers.get('x-rate-limit-reset'),
        retryAfter: twRes.headers.get('retry-after'),
      }
      console.warn(`[analyze][${reqId}] twitter_fetch_failed`, { status: twRes.status, ...rate, len: twText.length })

      if (twRes.status === 429) {
        const retryAfterSec = Number(rate.retryAfter ?? '0') || 60
        // Mark last_run_at to throttle subsequent calls
        await supabase.from('market_sentiment_state').upsert({
          symbol: sym,
          last_run_at: new Date().toISOString(),
          since_id: since_id ?? null,
        })
        return json(req, {
          symbol: sym,
          skipped: true,
          reason: 'rate_limited',
          retryAfterSec,
          rate,
          message: `Twitter rate limit hit. Please try again in about ${Math.ceil(retryAfterSec / 60)} minute(s).`,
          stale: true,
          details: twText,
        }, 200)
      }

      // Other Twitter errors: return soft skip and serve stale
      return json(req, {
        symbol: sym,
        skipped: true,
        reason: 'twitter_error',
        status: twRes.status,
        message: 'Unable to fetch latest tweets right now. Showing your last saved results.',
        stale: true,
        details: twText,
      }, 200)
    }
    const tw = JSON.parse(twText) as {
      data?: Array<{
        id: string
        text: string
        created_at: string
        lang?: string
        author_id: string
        possibly_sensitive?: boolean
        public_metrics?: { retweet_count: number; reply_count: number; like_count: number; quote_count: number }
      }>
      includes?: { users?: TwUser[] }
      meta?: { newest_id?: string }
    }

    // Map users
    const users = new Map<string, TwUser>((tw.includes?.users ?? []).map(u => [u.id, u]))

    // Verify/allowlist filter
    const minFollowers = 10000
    const isTrustedAuthor = (u: TwUser): boolean => {
      const uname = (u.username || '').toLowerCase()
      if (allow.has(uname)) return true
      const verified = Boolean(u.verified) || (!!u.verified_type && u.verified_type.toLowerCase() !== 'none')
      const followers = u.public_metrics?.followers_count ?? 0
      const ageDays = u.created_at ? Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000*60*60*24)) : 0
      const pub = !u.protected
      return verified && followers >= minFollowers && ageDays >= 180 && pub
    }

    let tweets = (tw.data ?? []).filter(t => {
      const u = users.get(t.author_id)
      return !!u && isTrustedAuthor(u)
    })
    if (tweets.length === 0) {
      await supabase.from('market_sentiment_state').upsert({ symbol: sym, last_run_at: new Date().toISOString(), since_id: tw.meta?.newest_id ?? since_id ?? null })
      console.log(`[analyze][${reqId}] no tweets after filters for ${sym}`)
      return json(req, { symbol: sym, fetched: 0, analyzed: 0, inserted: 0, updated: 0 }, 200)
    }

    // Batch to HF
    const CHUNK = 16
    const results: { id: string; label: HFLabel; score: number }[] = []
    for (let i = 0; i < tweets.length; i += CHUNK) {
      const batch = tweets.slice(i, i + CHUNK)
      const input = batch.map(t => t.text)
      const hfRes = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(hfModel)}` , {
        method: 'POST',
        headers: { Authorization: `Bearer ${hfToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ inputs: input, options: { wait_for_model: true } })
      })
      const bodyText = await hfRes.text()
      if (!hfRes.ok) {
        console.warn(`[analyze][${reqId}] hf_inference_failed`, { status: hfRes.status, len: bodyText.length })
        return json(req, { error: 'hf_inference_failed', status: hfRes.status, details: bodyText }, 502)
      }
      const pred = JSON.parse(bodyText) as Array<Array<{ label: string; score: number }>> | Array<{ label: string; score: number }>
      const normalized: Array<Array<{ label: string; score: number }>> = Array.isArray(pred[0]) ? pred as any : [pred as any]
      normalized.forEach((choices, idx) => {
        const top = [...choices].sort((a, b) => b.score - a.score)[0]
        const lbl = String(top.label).toLowerCase()
        const mapped: HFLabel = lbl.includes('pos') ? 'positive' : lbl.includes('neg') ? 'negative' : 'neutral'
        results.push({ id: batch[idx].id, label: mapped, score: top.score })
      })
      await sleep(200)
    }

    // Upsert rows
    let inserted = 0
    let updated = 0
    for (const t of tweets) {
      const r = results.find(x => x.id === t.id)
      if (!r) continue
      const u = users.get(t.author_id)
      const row = {
        symbol: sym,
        tweet_id: t.id,
        tweet_text: t.text,
        tweet_created_at: t.created_at,
        author_id: u?.id ?? null,
        lang: t.lang ?? null,
        retweet_count: t.public_metrics?.retweet_count ?? 0,
        reply_count: t.public_metrics?.reply_count ?? 0,
        like_count: t.public_metrics?.like_count ?? 0,
        quote_count: t.public_metrics?.quote_count ?? 0,
        possibly_sensitive: t.possibly_sensitive ?? false,
        sentiment_label: r.label,
        sentiment_score: r.score,
        model: hfModel,
      }
      const { error, status } = await supabase
        .from('market_sentiments')
        .upsert(row, { onConflict: 'tweet_id', ignoreDuplicates: false })
      if (error) continue
      if (status === 201) inserted++
      else updated++
    }

  await supabase.from('market_sentiment_state').upsert({ symbol: sym, since_id: tw.meta?.newest_id ?? since_id ?? null, last_run_at: new Date().toISOString() })

    const ms = Date.now() - started
    console.log(`[analyze][${reqId}] done in ${ms}ms`, { symbol: sym, fetched: tweets.length, analyzed: results.length, inserted, updated })
    return json(req, { symbol: sym, fetched: tweets.length, analyzed: results.length, inserted, updated, model: hfModel })
  } catch (e) {
    const ms = Date.now() - started
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[analyze][${reqId}] error after ${ms}ms`, msg)
    return json(req, { error: 'analyze_failed', details: msg }, 502)
  }
})

function json(req: Request | null, data: unknown, status = 200) {
  const base = { 'content-type': 'application/json' } as HeadersInit
  const headers = req ? buildCorsHeaders(req, base) : new Headers(base)
  return new Response(JSON.stringify(data), { status, headers })
}
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
