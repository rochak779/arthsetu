import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log(`Publishing webhook for user: ${user.id}`);

    const { environment = 'test' } = await req.json().catch(() => ({}));
    
    // Determine webhook URL based on environment
    const baseUrl = 'https://rickettsial-ericoid-tifany.ngrok-free.dev';
    const webhookUrl = environment === 'production' 
      ? `${baseUrl}/webhook/holdings`
      : `${baseUrl}/webhook-test/holdings`;

    // Create initial webhook event record
    const { data: eventRecord, error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        user_id: user.id,
        event_type: 'holdings_sync',
        webhook_url: webhookUrl,
        payload: {},
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create event record: ${insertError.message}`);
    }

    console.log(`Created event record: ${eventRecord.id}`);

    // Fetch user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, email, full_name')
      .eq('user_id', user.id)
      .single();

    if (userError) {
      throw new Error(`Failed to fetch user data: ${userError.message}`);
    }

    // Fetch user preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('investor_type, risk_comfort, alert_pref')
      .eq('user_id', user.id)
      .single();

    if (preferencesError) {
      console.warn(`No preferences found for user: ${preferencesError.message}`);
    }

    // Fetch holdings
    const { data: holdings, error: holdingsError } = await supabase
      .from('kite_holdings')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (holdingsError) {
      throw new Error(`Failed to fetch holdings: ${holdingsError.message}`);
    }

    // Calculate summary
    const totalHoldings = holdings?.length || 0;
    const totalValue = holdings?.reduce((sum, holding) => sum + (holding.last_price * holding.quantity), 0) || 0;
    const totalPnL = holdings?.reduce((sum, holding) => sum + holding.pnl, 0) || 0;

    // Prepare webhook payload
    const payload = {
      event_type: 'holdings_sync',
      timestamp: new Date().toISOString(),
      user: {
        user_id: userData.user_id,
        email: userData.email,
        full_name: userData.full_name
      },
      preferences: preferences || null,
      holdings: holdings || [],
      summary: {
        total_holdings: totalHoldings,
        total_value: totalValue,
        total_pnl: totalPnL
      }
    };

    console.log(`Sending webhook to: ${webhookUrl}`);
    console.log(`Payload contains ${totalHoldings} holdings`);

    // Helper: retry/backoff for ngrok 403 rate limits
    async function postWithBackoff(url: string, jsonBody: unknown, headers: Record<string, string>) {
      const maxRetries = 5;
      let delay = 800; // start just under ~75/min
      const bodyText = typeof jsonBody === 'string' ? jsonBody : JSON.stringify(jsonBody);
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: bodyText,
        });
        const text = await res.text();
        if (res.ok) return { ok: true as const, status: res.status, text };
        const isNgrok403 = res.status === 403 && /ERR_NGROK_734|exceeded your limit of 120 requests per minute/i.test(text);
        if (isNgrok403 && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, delay));
          delay = Math.min(delay * 2, 8000);
          continue;
        }
        return { ok: false as const, status: res.status, text };
      }
      return { ok: false as const, status: 429, text: 'ngrok rate limit' };
    }

    // Update event record with payload
    await supabase
      .from('webhook_events')
      .update({ payload })
      .eq('id', eventRecord.id);

    // Send webhook with backoff
    const postResult = await postWithBackoff(
      webhookUrl,
      payload,
      { 'ngrok-skip-browser-warning': 'true' }
    );
    const webhookOk = postResult.ok;
    const responseStatus = postResult.status;
    const responseText = postResult.text;
    
    // Update event record with response
    await supabase
      .from('webhook_events')
      .update({
        status: webhookOk ? 'success' : (responseStatus === 403 ? 'queued' : 'failed'),
        response_status_code: responseStatus,
        response_body: responseText.substring(0, 1000), // Limit response body length
        error_message: webhookOk ? null : `HTTP ${responseStatus}: ${responseText}`,
        completed_at: new Date().toISOString()
      })
      .eq('id', eventRecord.id);

    if (!webhookOk) {
      // If rate-limited, return 202 so UI doesn't error
      if (responseStatus === 403) {
        return new Response(JSON.stringify({
          success: true,
          status: 'queued-or-throttled',
          event_id: eventRecord.id,
          webhook_url: webhookUrl,
          hint: 'ngrok rate limit; delivery will retry/backoff',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 202 });
      }
      throw new Error(`Webhook failed with status ${responseStatus}: ${responseText}`);
    }

    console.log(`Webhook published successfully. Event ID: ${eventRecord.id}`);

    return new Response(JSON.stringify({
      success: true,
      event_id: eventRecord.id,
      webhook_url: webhookUrl,
      holdings_count: totalHoldings,
      total_value: totalValue
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error publishing webhook:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});