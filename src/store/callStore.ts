import { create } from 'zustand';
import { Call, TranscriptSegment, SystemStatus, CallFilters } from '@/types/call';

interface CallStore {
  // State
  calls: Call[];
  transcripts: Record<string, TranscriptSegment[]>;
  filters: CallFilters;
  systemStatus: SystemStatus;
  isConnected: boolean;
  isLoading: boolean;
  
  // Actions
  setCalls: (calls: Call[]) => void;
  addCall: (call: Call) => void;
  updateCall: (id: string, updates: Partial<Call>) => void;
  upsertCall: (call: Call) => void;
  endCall: (id: string, endedAt: Date) => void;
  
  setTranscripts: (callId: string, segments: TranscriptSegment[]) => void;
  addTranscriptSegment: (segment: TranscriptSegment) => void;
  updateTranscriptSegment: (callId: string, segmentId: string, updates: Partial<TranscriptSegment>) => void;
  
  setFilters: (filters: Partial<CallFilters>) => void;
  setSystemStatus: (status: Partial<SystemStatus>) => void;
  setIsConnected: (connected: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  
  // Selectors
  getLiveCalls: () => Call[];
  getPastCalls: () => Call[];
  getCallById: (id: string) => Call | undefined;
  getTranscriptByCallId: (callId: string) => TranscriptSegment[];
}

export const useCallStore = create<CallStore>((set, get) => ({
  // Initial state - empty until loaded from database
  calls: [],
  transcripts: {},
  filters: {
    status: 'all',
    search: '',
    page: 1,
  },
  systemStatus: {
    backendConnected: false,
    lastEventTimestamp: null,
    activeConnections: 0,
  },
  isConnected: false,
  isLoading: true,

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

  upsertCall: (call) => set((state) => {
    const existingIndex = state.calls.findIndex((c) => c.id === call.id);
    if (existingIndex >= 0) {
      const newCalls = [...state.calls];
      newCalls[existingIndex] = call;
      return { calls: newCalls };
    }
    return { calls: [call, ...state.calls] };
  }),
  
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
      systemStatus: {
        ...state.systemStatus,
        lastEventTimestamp: new Date(),
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
  
  setIsConnected: (connected) => set((state) => ({ 
    isConnected: connected,
    systemStatus: {
      ...state.systemStatus,
      backendConnected: connected,
      activeConnections: connected ? 1 : 0,
    },
  })),

  setIsLoading: (loading) => set({ isLoading: loading }),
  
  // Selectors
  getLiveCalls: () => get().calls.filter((call) => call.status === 'live'),
  getPastCalls: () => get().calls.filter((call) => call.status !== 'live'),
  getCallById: (id) => get().calls.find((call) => call.id === id),
  getTranscriptByCallId: (callId) => get().transcripts[callId] || [],
}));
