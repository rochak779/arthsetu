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
    let userId;
    
    // Handle both GET and POST requests
    if (req.method === 'GET') {
      const url = new URL(req.url);
      userId = url.searchParams.get('user_id');
    } else if (req.method === 'POST') {
      const body = await req.json();
      userId = body.user_id;
    }

    console.log('Received request for user:', userId);

    if (!userId) {
      console.error('User ID is required but not provided');
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate environment variables
    const kiteApiKey = Deno.env.get('KITE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    console.log('Environment check:');
    console.log('- KITE_API_KEY:', !!kiteApiKey);
    console.log('- SUPABASE_URL:', !!supabaseUrl);
    
    if (!kiteApiKey) {
      console.error('Kite API key not configured');
      return new Response(JSON.stringify({ 
        error: 'Kite API key not configured',
        details: 'KITE_API_KEY environment variable is missing'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!supabaseUrl) {
      console.error('Supabase URL not configured');
      return new Response(JSON.stringify({ 
        error: 'Supabase URL not configured',
        details: 'SUPABASE_URL environment variable is missing'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate callback URL and login URL
    const callbackUrl = `${supabaseUrl}/functions/v1/kite-callback`;
    
    // Generate Kite login URL with proper state parameter and callback
    const loginUrl = `https://kite.zerodha.com/connect/login?api_key=${kiteApiKey}&v=3&state=${encodeURIComponent(userId)}`;

    console.log('Generated URLs:');
    console.log('- Login URL:', loginUrl);
    console.log('- Callback URL:', callbackUrl);
    console.log('- User ID in state:', userId);

    return new Response(JSON.stringify({ 
      login_url: loginUrl,
      callback_url: callbackUrl,
      user_id: userId,
      instructions: 'Redirect user to login_url. After Kite authentication, user will be redirected to callback_url.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Critical error in kite-login-url function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    if (errorStack) {
      console.error('Error stack:', errorStack);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: errorMessage,
      type: errorName,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});