import { create } from 'zustand';
import { Call, TranscriptSegment, SystemStatus, CallFilters } from '@/types/call';
import { mockCalls, mockTranscripts } from '@/data/mockData';

interface CallStore {
  // State
  calls: Call[];
  transcripts: Record<string, TranscriptSegment[]>;
  filters: CallFilters;
  systemStatus: SystemStatus;
  isConnected: boolean;
  
  // Actions
  setCalls: (calls: Call[]) => void;
  addCall: (call: Call) => void;
  updateCall: (id: string, updates: Partial<Call>) => void;
  endCall: (id: string, endedAt: Date) => void;
  
  setTranscripts: (callId: string, segments: TranscriptSegment[]) => void;
  addTranscriptSegment: (segment: TranscriptSegment) => void;
  updateTranscriptSegment: (callId: string, segmentId: string, updates: Partial<TranscriptSegment>) => void;
  
  setFilters: (filters: Partial<CallFilters>) => void;
  setSystemStatus: (status: Partial<SystemStatus>) => void;
  setIsConnected: (connected: boolean) => void;
  
  // Selectors
  getLiveCalls: () => Call[];
  getPastCalls: () => Call[];
  getCallById: (id: string) => Call | undefined;
  getTranscriptByCallId: (callId: string) => TranscriptSegment[];
}

export const useCallStore = create<CallStore>((set, get) => ({
  // Initial state with mock data
  calls: mockCalls,
  transcripts: mockTranscripts,
  filters: {
    status: 'all',
    search: '',
    page: 1,
  },
  systemStatus: {
    backendConnected: true,
    lastEventTimestamp: new Date(),
    activeConnections: 1,
  },
  isConnected: true,

  // Actions
  setCalls: (calls) => set({ calls }),
  
  addCall: (call) => set((state) => ({
    calls: [call, ...state.calls],
  })),
  
  updateCall: (id, updates) => set((state) => ({
    calls: state.calls.map((call) =>
      call.id === id ? { ...call, ...updates } : call
    ),
  })),
  
  endCall: (id, endedAt) => set((state) => ({
    calls: state.calls.map((call) =>
      call.id === id ? { ...call, status: 'ended', endedAt } : call
    ),
  })),
  
  setTranscripts: (callId, segments) => set((state) => ({
    transcripts: { ...state.transcripts, [callId]: segments },
  })),
  
  addTranscriptSegment: (segment) => set((state) => {
    const existing = state.transcripts[segment.callId] || [];
    return {
      transcripts: {
        ...state.transcripts,
        [segment.callId]: [...existing, segment],
      },
    };
  }),
  
  updateTranscriptSegment: (callId, segmentId, updates) => set((state) => ({
    transcripts: {
      ...state.transcripts,
      [callId]: (state.transcripts[callId] || []).map((seg) =>
        seg.id === segmentId ? { ...seg, ...updates } : seg
      ),
    },
  })),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
  
  setSystemStatus: (status) => set((state) => ({
    systemStatus: { ...state.systemStatus, ...status },
  })),
  
  setIsConnected: (connected) => set({ isConnected: connected }),
  
  // Selectors
  getLiveCalls: () => get().calls.filter((call) => call.status === 'live'),
  getPastCalls: () => get().calls.filter((call) => call.status !== 'live'),
  getCallById: (id) => get().calls.find((call) => call.id === id),
  getTranscriptByCallId: (callId) => get().transcripts[callId] || [],
}));
