import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockQuote {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  pChange: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
}

const fetchNSEQuote = async (symbol: string): Promise<StockQuote | null> => {
  try {
    console.log(`Fetching NSE quote for symbol: ${symbol}`);
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
    };

    const response = await fetch(
      `https://www.nseindia.com/api/quote-equity?symbol=${symbol.toUpperCase()}`,
      { headers }
    );

    if (!response.ok) {
      console.error(`NSE API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.priceInfo) {
      console.error('No price info in NSE response');
      return null;
    }

    const priceInfo = data.priceInfo;
    const lastPrice = priceInfo.lastPrice || 0;
    const previousClose = priceInfo.previousClose || priceInfo.close || 0;
    const change = lastPrice - previousClose;
    const pChange = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      symbol: symbol.toUpperCase(),
      name: data.info?.companyName || symbol,
      lastPrice,
      change,
      pChange,
      open: priceInfo.open,
      high: priceInfo.intraDayHighLow?.max || priceInfo.high,
      low: priceInfo.intraDayHighLow?.min || priceInfo.low,
      previousClose,
    };
  } catch (error) {
    console.error('Error fetching NSE quote:', error);
    return null;
  }
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Stock quote request for: ${symbol}`);

    const quote = await fetchNSEQuote(symbol);

    if (!quote) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch stock quote' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully fetched quote for ${symbol}:`, quote);

    return new Response(
      JSON.stringify(quote),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in stock-quote function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
