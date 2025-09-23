import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

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
    console.log('Kite callback function invoked');
    const { request_token, user_id } = await req.json();
    console.log('Received callback for user:', user_id, 'with token:', request_token ? 'present' : 'missing');

    if (!request_token || !user_id) {
      return new Response(JSON.stringify({ 
        error: 'Request token and user ID are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const kiteApiKey = Deno.env.get('KITE_API_KEY');
    const kiteApiSecret = Deno.env.get('KITE_API_SECRET');
    console.log('Kite credentials available - API Key:', !!kiteApiKey, 'API Secret:', !!kiteApiSecret);

    if (!kiteApiKey || !kiteApiSecret) {
      console.error('Kite API credentials not configured');
      return new Response(JSON.stringify({ 
        error: 'Kite API credentials not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate checksum for Kite API
    const checksumString = `${kiteApiKey}${request_token}${kiteApiSecret}`;
    const checksum = createHash("sha256").update(checksumString).toString("hex");

    // Exchange request token for access token
    const tokenResponse = await fetch('https://api.kite.trade/session/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3',
      },
      body: new URLSearchParams({
        api_key: kiteApiKey,
        request_token: request_token,
        checksum: checksum,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Kite token exchange failed:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to exchange token',
        details: errorText
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.data.access_token;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store access token in users table
    const { error: updateError } = await supabase
      .from('users')
      .update({
        kite_accesstoken: accessToken,
        last_login_date: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Error updating user with access token:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to store access token',
        details: updateError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully stored access token for user:', user_id);

    return new Response(JSON.stringify({ 
      status: 'success',
      user_id: user_id,
      access_token: accessToken
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in kite-callback function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});