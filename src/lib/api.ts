import { Call, TranscriptSegment, ApiResponse, PaginatedResponse, CallFilters } from '@/types/call';
import { mockCalls, mockTranscripts } from '@/data/mockData';

// Base URL for API - can be configured in settings
let BASE_URL = '/api';

export const setApiBaseUrl = (url: string) => {
  BASE_URL = url;
};

export const getApiBaseUrl = () => BASE_URL;

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// API Client
export const api = {
  // Fetch calls with optional filters
  async getCalls(filters?: CallFilters): Promise<PaginatedResponse<Call>> {
    await delay(300);
    
    let filtered = [...mockCalls];
    
    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter((call) => call.status === filters.status);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (call) =>
          call.fromNumber.toLowerCase().includes(search) ||
          call.toNumber.toLowerCase().includes(search) ||
          call.agentName?.toLowerCase().includes(search) ||
          call.ticketId?.toLowerCase().includes(search)
      );
    }
    
    if (filters?.startDate) {
      filtered = filtered.filter((call) => call.startedAt >= filters.startDate!);
    }
    
    if (filters?.endDate) {
      filtered = filtered.filter((call) => call.startedAt <= filters.endDate!);
    }
    
    // Sort by startedAt descending
    filtered.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    
    const page = filters?.page || 1;
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    };
  },
  
  // Fetch single call by ID
  async getCallById(id: string): Promise<ApiResponse<Call | null>> {
    await delay(200);
    const call = mockCalls.find((c) => c.id === id);
    return {
      data: call || null,
      ok: !!call,
      message: call ? undefined : 'Call not found',
    };
  },
  
  // Fetch transcript for a call
  async getTranscript(callId: string): Promise<ApiResponse<TranscriptSegment[]>> {
    await delay(200);
    const transcript = mockTranscripts[callId] || [];
    return {
      data: transcript,
      ok: true,
    };
  },
  
  // Update ticket with transcript
  async updateTicket(
    callId: string,
    ticketId?: string
  ): Promise<ApiResponse<{ ticketId: string }>> {
    await delay(1000);
    
    // Simulate success/failure
    const success = Math.random() > 0.1;
    
    if (success) {
      const newTicketId = ticketId || `TKT-2024-${Math.floor(Math.random() * 9000 + 1000)}`;
      return {
        data: { ticketId: newTicketId },
        ok: true,
        message: 'Transcript successfully pushed to ConnectWise Manage',
      };
    }
    
    return {
      data: { ticketId: '' },
      ok: false,
      message: 'Failed to update ticket. Please try again.',
    };
  },
  
  // Save call notes
  async saveNotes(callId: string, notes: string): Promise<ApiResponse<null>> {
    await delay(300);
    return {
      data: null,
      ok: true,
      message: 'Notes saved successfully',
    };
  },
};

// WebSocket/SSE simulation
export class RealtimeConnection {
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: {
    onCallStarted?: (call: Call) => void;
    onCallUpdated?: (call: Partial<Call> & { id: string }) => void;
    onTranscriptSegment?: (segment: TranscriptSegment) => void;
    onCallEnded?: (callId: string, endedAt: Date) => void;
    onConnectionChange?: (connected: boolean) => void;
  } = {};
  
  connect(callbacks: typeof this.callbacks) {
    this.callbacks = callbacks;
    this.callbacks.onConnectionChange?.(true);
    
    // Simulate periodic transcript updates for live calls
    this.intervalId = setInterval(() => {
      const liveCalls = mockCalls.filter((c) => c.status === 'live');
      if (liveCalls.length > 0) {
        const randomCall = liveCalls[Math.floor(Math.random() * liveCalls.length)];
        
        // Simulate new transcript segment
        const newSegment: TranscriptSegment = {
          id: Math.random().toString(36).substring(2, 15),
          callId: randomCall.id,
          speaker: Math.random() > 0.5 ? 'agent' : 'caller',
          text: this.getRandomPhrase(),
          isFinal: Math.random() > 0.3,
          timestamp: new Date(),
        };
        
        this.callbacks.onTranscriptSegment?.(newSegment);
      }
    }, 5000);
    
    return this;
  }
  
  disconnect() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.callbacks.onConnectionChange?.(false);
  }
  
  private getRandomPhrase(): string {
    const phrases = [
      "Let me check on that for you...",
      "I understand, one moment please.",
      "Could you provide more details?",
      "I'm looking into this now.",
      "That's a great question.",
      "Yes, I can help with that.",
      "Let me verify your information.",
      "Is there anything else you need?",
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}
