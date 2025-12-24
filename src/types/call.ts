export type CallStatus = 'live' | 'ended' | 'failed';
export type CallDirection = 'inbound' | 'outbound';
export type Speaker = 'caller' | 'agent' | 'unknown';

export interface Call {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  status: CallStatus;
  direction: CallDirection;
  fromNumber: string;
  toNumber: string;
  agentName: string | null;
  queueOrDn: string | null;
  ticketId: string | null;
  hasTicketUpdate: boolean;
  notes: string | null;
}

export interface TranscriptSegment {
  id: string;
  callId: string;
  speaker: Speaker;
  text: string;
  isFinal: boolean;
  timestamp: Date;
}

export interface RealtimeEvent {
  type: 'call.started' | 'call.updated' | 'transcript.segment' | 'call.ended';
  call?: Call;
  segment?: TranscriptSegment;
  callId?: string;
  endedAt?: Date;
}

export interface ApiResponse<T> {
  data: T;
  ok: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CallFilters {
  status?: CallStatus | 'all';
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
}

export interface SystemStatus {
  backendConnected: boolean;
  lastEventTimestamp: Date | null;
  activeConnections: number;
}
