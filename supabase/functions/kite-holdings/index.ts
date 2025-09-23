import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's access token
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('kite_accesstoken')
      .eq('user_id', userId)
      .single();

    if (userError || !userData?.kite_accesstoken) {
      return new Response(JSON.stringify({ 
        error: 'User not found or no Kite access token available' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch holdings from Kite API
    const holdingsResponse = await fetch('https://api.kite.trade/portfolio/holdings', {
      method: 'GET',
      headers: {
        'Authorization': `token ${userData.kite_accesstoken}`,
        'X-Kite-Version': '3',
      },
    });

    if (!holdingsResponse.ok) {
      const errorText = await holdingsResponse.text();
      console.error('Kite holdings fetch failed:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch holdings from Kite',
        details: errorText
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const holdingsData = await holdingsResponse.json();
    const holdings = holdingsData.data;

    // Clear existing holdings
    const { error: deleteError } = await supabase
      .from('kite_holdings')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error clearing existing holdings:', deleteError);
    }

    // Insert new holdings
    if (holdings && holdings.length > 0) {
      const holdingsToInsert = holdings.map((holding: any) => ({
        user_id: userId,
        tradingsymbol: holding.tradingsymbol,
        exchange: holding.exchange,
        instrument_token: holding.instrument_token,
        product: holding.product,
        quantity: holding.quantity,
        average_price: holding.average_price,
        last_price: holding.last_price,
        pnl: holding.pnl,
        collateral_quantity: holding.collateral_quantity || 0,
        t1_quantity: holding.t1_quantity || 0,
        raw: holding,
      }));

      const { error: insertError } = await supabase
        .from('kite_holdings')
        .insert(holdingsToInsert);

      if (insertError) {
        console.error('Error inserting holdings:', insertError);
        return new Response(JSON.stringify({ 
          error: 'Failed to store holdings',
          details: insertError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`Successfully fetched and stored ${holdings?.length || 0} holdings for user:`, userId);

    return new Response(JSON.stringify({ 
      status: 'success',
      holdings_count: holdings?.length || 0,
      data: holdings
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in kite-holdings function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});