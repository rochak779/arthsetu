import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INDIAN_API_KEY = Deno.env.get('INDIAN_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'trending';

    let apiUrl = '';
    
    switch (endpoint) {
      case 'trending':
        apiUrl = 'https://stock.indianapi.in/trending';
        break;
      case 'most_active':
        apiUrl = 'https://stock.indianapi.in/historical_data?stock_name=&period=1m&filter=default';
        break;
      case 'price_shockers':
        apiUrl = 'https://stock.indianapi.in/price_shockers';
        break;
      default:
        throw new Error('Invalid endpoint');
    }

    console.log(`Fetching market data from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'x-api-key': INDIAN_API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Market data fetched successfully for ${endpoint}`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in market-data function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to fetch market data' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});