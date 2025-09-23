import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle unsupported methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'Method not allowed',
      message: 'Only GET and POST methods are supported'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Kite callback function invoked');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    let request_token, user_id, status;
    
    // Handle GET requests (redirects from Zerodha KITE)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      request_token = url.searchParams.get('request_token');
      status = url.searchParams.get('status');
      user_id = url.searchParams.get('user_id'); // Optional, can be null
      
      console.log('GET request parameters:');
      console.log('- request_token:', request_token);
      console.log('- status:', status);
      console.log('- user_id:', user_id);
      console.log('- All query params:', Object.fromEntries(url.searchParams.entries()));
      
      // For GET requests, just confirm receipt
      if (!request_token) {
        console.error('Missing request_token in GET request');
        return new Response(JSON.stringify({ 
          error: 'Request token is required',
          method: req.method
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check for failed/cancelled login
      if (status && status !== 'success') {
        console.error('Kite login failed with status:', status);
        return new Response(JSON.stringify({ 
          error: 'Kite login failed or was cancelled',
          status: status
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Return success response for GET request
      return new Response(JSON.stringify({
        message: "GET callback received",
        request_token: request_token,
        user_id: user_id || null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle POST requests (token exchange and storage)
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        request_token = body.request_token;
        user_id = body.user_id;
        console.log('POST request - parsed body successfully');
        console.log('- request_token:', !!request_token);
        console.log('- user_id:', !!user_id);
      } catch (jsonError) {
        console.error('Failed to parse JSON body:', jsonError);
        return new Response(JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: jsonError.message
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate required fields for POST
      const missingFields = [];
      if (!request_token) missingFields.push('request_token');
      if (!user_id) missingFields.push('user_id');

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        return new Response(JSON.stringify({ 
          error: 'Missing required fields',
          missing_fields: missingFields,
          received: {
            request_token: !!request_token,
            user_id: !!user_id
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Proceeding with token exchange for user:', user_id);
    }

    // Get environment variables (shared by both paths for POST)
    const kiteApiKey = Deno.env.get('KITE_API_KEY');
    const kiteApiSecret = Deno.env.get('KITE_API_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment variables check:');
    console.log('- KITE_API_KEY:', !!kiteApiKey);
    console.log('- KITE_API_SECRET:', !!kiteApiSecret);
    console.log('- SUPABASE_URL:', !!supabaseUrl);
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);

    // Validate environment variables for token exchange
    if (!kiteApiKey || !kiteApiSecret) {
      console.error('Kite API credentials not configured');
      return new Response(JSON.stringify({ 
        error: 'Kite API credentials not configured',
        missing: {
          api_key: !kiteApiKey,
          api_secret: !kiteApiSecret
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return new Response(JSON.stringify({ 
        error: 'Supabase credentials not configured',
        missing: {
          url: !supabaseUrl,
          service_key: !supabaseServiceKey
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Validate environment variables for token exchange
    if (!kiteApiKey || !kiteApiSecret) {
      console.error('Kite API credentials not configured');
      return new Response(JSON.stringify({ 
        error: 'Kite API credentials not configured',
        missing: {
          api_key: !kiteApiKey,
          api_secret: !kiteApiSecret
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return new Response(JSON.stringify({ 
        error: 'Supabase credentials not configured',
        missing: {
          url: !supabaseUrl,
          service_key: !supabaseServiceKey
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate checksum for Kite API with validation
    if (!request_token || request_token.length < 10) {
      console.error('Invalid request token format:', request_token);
      return new Response(JSON.stringify({ 
        error: 'Invalid request token format',
        token_length: request_token?.length || 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating checksum for Kite API...');
    const checksumString = `${kiteApiKey}${request_token}${kiteApiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(checksumString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('Checksum generated successfully');

    // Exchange request token for access token
    console.log('Making token exchange request to Kite API...');
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
      console.error('Kite token exchange failed with status:', tokenResponse.status);
      console.error('Kite error response:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to exchange token',
        details: errorText,
        status: tokenResponse.status
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Token exchange successful, parsing response...');
    const responseText = await tokenResponse.text();
    console.log('Raw response from Kite:', responseText);
    
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Kite response as JSON:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON response from Kite API',
        details: parseError.message,
        raw_response: responseText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Parsed token data structure:', Object.keys(tokenData));
    
    if (!tokenData?.data?.access_token) {
      console.error('No access token in response:', tokenData);
      return new Response(JSON.stringify({ 
        error: 'No access token received from Kite',
        response_structure: Object.keys(tokenData || {}),
        response_data: tokenData
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const accessToken = tokenData.data.access_token;
    console.log('Access token extracted successfully, length:', accessToken.length);

    // Initialize Supabase client with error handling
    console.log('Initializing Supabase client...');
    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
      console.log('Supabase client initialized successfully');
    } catch (clientError) {
      console.error('Failed to initialize Supabase client:', clientError);
      return new Response(JSON.stringify({ 
        error: 'Failed to initialize database connection',
        details: clientError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store access token in users table with comprehensive error handling
    console.log('Storing access token for user:', user_id);
    const { error: updateError } = await supabase
      .from('users')
      .update({
        kite_accesstoken: accessToken,
        last_login_date: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Database update error details:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to store access token in database',
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Access token stored successfully for user:', user_id);

    // Return success with redirect information for frontend
    const frontendUrl = Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '') || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl.replace('.supabase.co', '.lovableproject.com')}/portfolio?kite_connected=true`;

    return new Response(JSON.stringify({ 
      status: 'success',
      user_id: user_id,
      message: 'Kite account connected successfully',
      redirect_url: redirectUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Critical error in kite-callback function:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
      type: error.name,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});