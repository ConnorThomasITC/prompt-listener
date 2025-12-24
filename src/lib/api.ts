import { supabase } from '@/integrations/supabase/client';
import { Call, TranscriptSegment, ApiResponse, PaginatedResponse, CallFilters } from '@/types/call';

// Helper to convert DB row to Call type
const mapDbCallToCall = (row: {
  id: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  direction: string;
  from_number: string;
  to_number: string;
  agent_name: string | null;
  queue_or_dn: string | null;
  ticket_id: string | null;
  has_ticket_update: boolean;
  notes: string | null;
}): Call => ({
  id: row.id,
  startedAt: new Date(row.started_at),
  endedAt: row.ended_at ? new Date(row.ended_at) : null,
  status: row.status as Call['status'],
  direction: row.direction as Call['direction'],
  fromNumber: row.from_number,
  toNumber: row.to_number,
  agentName: row.agent_name,
  queueOrDn: row.queue_or_dn,
  ticketId: row.ticket_id,
  hasTicketUpdate: row.has_ticket_update,
  notes: row.notes,
});

// Helper to convert DB row to TranscriptSegment
const mapDbSegmentToSegment = (row: {
  id: string;
  call_id: string;
  speaker: string;
  text: string;
  is_final: boolean;
  timestamp: string;
}): TranscriptSegment => ({
  id: row.id,
  callId: row.call_id,
  speaker: row.speaker as TranscriptSegment['speaker'],
  text: row.text,
  isFinal: row.is_final,
  timestamp: new Date(row.timestamp),
});

// API Client
export const api = {
  // Fetch calls with optional filters
  async getCalls(filters?: CallFilters): Promise<PaginatedResponse<Call>> {
    const page = filters?.page || 1;
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = supabase
      .from('calls')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      const search = `%${filters.search}%`;
      query = query.or(`from_number.ilike.${search},to_number.ilike.${search},agent_name.ilike.${search},ticket_id.ilike.${search}`);
    }

    if (filters?.startDate) {
      query = query.gte('started_at', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('started_at', filters.endDate.toISOString());
    }

    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching calls:', error);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    const total = count || 0;

    return {
      data: (data || []).map(mapDbCallToCall),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  // Fetch single call by ID
  async getCallById(id: string): Promise<ApiResponse<Call | null>> {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching call:', error);
      return {
        data: null,
        ok: false,
        message: 'Call not found',
      };
    }

    return {
      data: mapDbCallToCall(data),
      ok: true,
    };
  },

  // Fetch transcript for a call
  async getTranscript(callId: string): Promise<ApiResponse<TranscriptSegment[]>> {
    const { data, error } = await supabase
      .from('transcript_segments')
      .select('*')
      .eq('call_id', callId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching transcript:', error);
      return {
        data: [],
        ok: false,
        message: 'Failed to fetch transcript',
      };
    }

    return {
      data: (data || []).map(mapDbSegmentToSegment),
      ok: true,
    };
  },

  // Update ticket with transcript
  async updateTicket(
    callId: string,
    ticketId?: string
  ): Promise<ApiResponse<{ ticketId: string }>> {
    const { data, error } = await supabase.functions.invoke('update-ticket', {
      body: { callId, ticketId },
    });

    if (error) {
      console.error('Error updating ticket:', error);
      return {
        data: { ticketId: '' },
        ok: false,
        message: error.message || 'Failed to update ticket',
      };
    }

    return {
      data: { ticketId: ticketId || data?.ticketId || '' },
      ok: data?.ok ?? true,
      message: data?.message || 'Transcript successfully pushed to ConnectWise Manage',
    };
  },

  // Save call notes
  async saveNotes(callId: string, notes: string): Promise<ApiResponse<null>> {
    const { error } = await supabase
      .from('calls')
      .update({ notes })
      .eq('id', callId);

    if (error) {
      console.error('Error saving notes:', error);
      return {
        data: null,
        ok: false,
        message: 'Failed to save notes',
      };
    }

    return {
      data: null,
      ok: true,
      message: 'Notes saved successfully',
    };
  },
};

// Realtime subscription helper
export const subscribeToRealtimeUpdates = (callbacks: {
  onCallChange?: (call: Call, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onTranscriptSegment?: (segment: TranscriptSegment) => void;
}) => {
  const channel = supabase
    .channel('db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'calls' },
      (payload) => {
        console.log('Call change:', payload);
        if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
          callbacks.onCallChange?.(
            mapDbCallToCall(payload.new as Parameters<typeof mapDbCallToCall>[0]),
            payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
          );
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'transcript_segments' },
      (payload) => {
        console.log('Transcript segment:', payload);
        if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
          callbacks.onTranscriptSegment?.(
            mapDbSegmentToSegment(payload.new as Parameters<typeof mapDbSegmentToSegment>[0])
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
