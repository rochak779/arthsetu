import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type HFLabel = 'positive' | 'neutral' | 'negative'

type ReqBody = { symbol: string; max?: number }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const twitterBearer = Deno.env.get('TWITTER_BEARER_TOKEN')!
    const hfToken = Deno.env.get('HF_API_TOKEN')!
    const hfModel = 'tabularisai/multilingual-sentiment-analysis'

    const supabase = createClient(supabaseUrl, serviceKey)

    // Require auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'unauthorized' }, 401)

    const { symbol, max = 25 } = (await req.json().catch(() => ({}))) as ReqBody
    if (!symbol) return json({ error: 'symbol_required' }, 400)
    const sym = String(symbol).toUpperCase().trim()
    const cap = clamp(Number(max), 1, 50)

    // State
    const { data: state } = await supabase
      .from('market_sentiment_state')
      .select('since_id')
      .eq('symbol', sym)
      .maybeSingle()
    const since_id = state?.since_id ?? undefined

    // Twitter search recent
    const query = `${sym} -is:retweet -is:reply`
    const url = new URL('https://api.twitter.com/2/tweets/search/recent')
    url.searchParams.set('query', query)
    url.searchParams.set('max_results', String(clamp(cap, 10, 50)))
    url.searchParams.set('sort_order', 'recency')
    if (since_id) url.searchParams.set('since_id', since_id)
    url.searchParams.set('tweet.fields', 'created_at,lang,public_metrics,possibly_sensitive')

    const twRes = await fetch(url, { headers: { Authorization: `Bearer ${twitterBearer}` } })
    const twText = await twRes.text()
    if (!twRes.ok) return json({ error: 'twitter_fetch_failed', status: twRes.status, details: twText }, 502)
    const tw = JSON.parse(twText) as {
      data?: Array<{
        id: string
        text: string
        created_at: string
        lang?: string
        possibly_sensitive?: boolean
        public_metrics?: { retweet_count: number; reply_count: number; like_count: number; quote_count: number }
      }>
      meta?: { newest_id?: string }
    }

    const tweets = tw.data ?? []
    if (tweets.length === 0) {
      await supabase.from('market_sentiment_state').upsert({ symbol: sym, last_run_at: new Date().toISOString(), since_id: tw.meta?.newest_id ?? since_id ?? null })
      return json({ symbol: sym, fetched: 0, analyzed: 0, inserted: 0, updated: 0 }, 200)
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
      if (!hfRes.ok) return json({ error: 'hf_inference_failed', status: hfRes.status, details: bodyText }, 502)
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
      const row = {
        symbol: sym,
        tweet_id: t.id,
        tweet_text: t.text,
        tweet_created_at: t.created_at,
        author_id: null as string | null,
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

    return json({ symbol: sym, fetched: tweets.length, analyzed: results.length, inserted, updated, model: hfModel })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return json({ error: 'unexpected', details: msg }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'content-type': 'application/json' } })
}
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
