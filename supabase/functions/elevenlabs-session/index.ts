import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    console.log('🚀 ElevenLabs session request received');

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      console.error('❌ Missing ELEVENLABS_API_KEY');
      throw new Error('ElevenLabs API key not configured');
    }

    // You'll need to replace this with your actual agent ID from ElevenLabs dashboard
    // For now, we'll get it from the request body or use a default one
    const { agent_id } = await req.json().catch(() => ({}));
    const AGENT_ID = agent_id || Deno.env.get('ELEVENLABS_AGENT_ID') || 'your-agent-id-here';
    
    console.log('🔑 Generating signed URL for agent:', AGENT_ID);

    // Generate signed URL for the ElevenLabs agent
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Signed URL generated successfully');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in elevenlabs-session function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate session URL';
    
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});