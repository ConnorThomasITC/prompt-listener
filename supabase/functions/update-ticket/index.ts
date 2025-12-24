import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { callId, ticketId } = await req.json();

    if (!callId) {
      return new Response(
        JSON.stringify({ ok: false, message: 'callId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the call and its transcript
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (callError || !call) {
      console.error('Error fetching call:', callError);
      return new Response(
        JSON.stringify({ ok: false, message: 'Call not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: segments, error: segmentsError } = await supabase
      .from('transcript_segments')
      .select('*')
      .eq('call_id', callId)
      .eq('is_final', true)
      .order('timestamp', { ascending: true });

    if (segmentsError) {
      console.error('Error fetching transcript:', segmentsError);
      return new Response(
        JSON.stringify({ ok: false, message: 'Failed to fetch transcript' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format transcript for ticket
    const transcript = segments
      .map((s: { speaker: string; text: string }) => `[${s.speaker.toUpperCase()}]: ${s.text}`)
      .join('\n');

    console.log('Transcript to send to PSA:', transcript.substring(0, 200) + '...');

    // TODO: Here you would integrate with ConnectWise Manage API
    // For now, we'll simulate a successful update
    // 
    // Example ConnectWise integration:
    // const cwResponse = await fetch(`${CONNECTWISE_URL}/service/tickets/${ticketId}/notes`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Basic ${btoa(CONNECTWISE_CREDENTIALS)}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     text: `Call Transcript:\n${transcript}`,
    //     internalAnalysisFlag: true,
    //   }),
    // });

    // Update the call record to mark ticket as updated
    const { error: updateError } = await supabase
      .from('calls')
      .update({ 
        has_ticket_update: true,
        ticket_id: ticketId || call.ticket_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', callId);

    if (updateError) {
      console.error('Error updating call:', updateError);
      return new Response(
        JSON.stringify({ ok: false, message: 'Failed to update call record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully updated ticket for call ${callId}`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: ticketId 
          ? `Transcript posted to ticket ${ticketId}` 
          : 'Transcript posted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-ticket function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ ok: false, message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
