// @ts-nocheck
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
    // Require an authenticated request (verify_jwt is enabled in config)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No Authorization header found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase clients: one for auth (anon key) and one for DB writes (service role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const kiteApiKey = Deno.env.get('KITE_API_KEY');

    console.log('Env presence check (kite-holdings):', {
      supabaseUrl: !!supabaseUrl,
      supabaseAnonKey: !!supabaseAnonKey,
      supabaseServiceKey: !!supabaseServiceKey,
      kiteApiKey: !!kiteApiKey,
    });

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Supabase environment variables are not fully configured');
      return new Response(JSON.stringify({ error: 'Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!kiteApiKey) {
      console.error('Kite API key not configured');
      return new Response(JSON.stringify({ error: 'Kite API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Derive the user ID from the Supabase session (ignore any user_id passed in body/query)
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('Failed to get user from session in kite-holdings:', userError?.message);
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    console.log('Kite holdings function invoked for authenticated user:', userId);

    // Initialize Supabase client
    // (already initialized above)

    // Get user's access token
    const { data: userData, error: dbUserError } = await supabase
      .from('users')
      .select('kite_accesstoken')
      .eq('user_id', userId)
      .single();

    if (dbUserError || !userData?.kite_accesstoken) {
      return new Response(JSON.stringify({ 
        error: 'User not found or no Kite access token available' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch holdings from Kite API
  // Normalize api_key and access token (strip quotes and trim spaces)
  const keyToUse = kiteApiKey ? kiteApiKey.trim().replace(/^\"|\"$/g, '') : '';
    const accessTokenRaw = userData.kite_accesstoken as string;
    const accessToken = accessTokenRaw ? accessTokenRaw.trim().replace(/^"|"$/g, '') : '';

    // Masked diagnostics
    console.log('Kite holdings header parts check:', {
      api_key_present: !!keyToUse,
      access_token_present: !!accessToken,
      api_key_preview: keyToUse ? `${keyToUse.slice(0, 4)}****` : 'none',
      access_token_preview: accessToken ? `****${accessToken.slice(-4)}` : 'none',
    });

    const holdingsResponse = await fetch('https://api.kite.trade/portfolio/holdings', {
      method: 'GET',
      headers: {
        // Kite Connect requires: token <api_key>:<access_token>
        'Authorization': `token ${keyToUse}:${accessToken}`,
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
    const err = error as any;
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: err?.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});