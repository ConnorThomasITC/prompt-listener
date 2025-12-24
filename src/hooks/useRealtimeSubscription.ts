import { useEffect } from 'react';
import { useCallStore } from '@/store/callStore';
import { api, subscribeToRealtimeUpdates } from '@/lib/api';

export const useRealtimeSubscription = () => {
  const { 
    setCalls, 
    upsertCall, 
    addTranscriptSegment, 
    setIsConnected, 
    setIsLoading,
    setSystemStatus 
  } = useCallStore();

  useEffect(() => {
    // Load initial data
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch all calls (not just paginated)
        const liveResult = await api.getCalls({ status: 'live' });
        const endedResult = await api.getCalls({ status: 'ended' });
        
        const allCalls = [...liveResult.data, ...endedResult.data];
        setCalls(allCalls);
        
        setIsConnected(true);
        setSystemStatus({ 
          backendConnected: true,
          lastEventTimestamp: new Date(),
        });
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToRealtimeUpdates({
      onCallChange: (call, eventType) => {
        console.log('Realtime call update:', eventType, call.id);
        upsertCall(call);
        setSystemStatus({ lastEventTimestamp: new Date() });
      },
      onTranscriptSegment: (segment) => {
        console.log('Realtime transcript segment:', segment.callId);
        addTranscriptSegment(segment);
      },
    });

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [setCalls, upsertCall, addTranscriptSegment, setIsConnected, setIsLoading, setSystemStatus]);
};
