import { useEffect, useRef } from 'react';
import { useCallStore } from '@/store/callStore';
import { api, subscribeToRealtimeUpdates } from '@/lib/api';

export const useRealtimeSubscription = () => {
  const store = useCallStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Load initial data
    const loadInitialData = async () => {
      store.setIsLoading(true);
      try {
        // Fetch all calls (not just paginated)
        const liveResult = await api.getCalls({ status: 'live' });
        const endedResult = await api.getCalls({ status: 'ended' });
        
        const allCalls = [...liveResult.data, ...endedResult.data];
        store.setCalls(allCalls);
        
        store.setIsConnected(true);
        store.setSystemStatus({ 
          backendConnected: true,
          lastEventTimestamp: new Date(),
        });
      } catch (error) {
        console.error('Failed to load initial data:', error);
        store.setIsConnected(false);
      } finally {
        store.setIsLoading(false);
      }
    };

    loadInitialData();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToRealtimeUpdates({
      onCallChange: (call, eventType) => {
        console.log('Realtime call update:', eventType, call.id);
        store.upsertCall(call);
        store.setSystemStatus({ lastEventTimestamp: new Date() });
      },
      onTranscriptSegment: (segment) => {
        console.log('Realtime transcript segment:', segment.callId);
        store.addTranscriptSegment(segment);
      },
    });

    return () => {
      unsubscribe();
      hasInitialized.current = false;
    };
  }, []); // Empty dependency array - store is stable
};
