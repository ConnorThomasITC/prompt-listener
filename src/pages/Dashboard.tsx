import { useState, useEffect, useMemo } from 'react';
import { Call } from '@/types/call';
import { useCallStore } from '@/store/callStore';
import { RealtimeConnection } from '@/lib/api';
import { LiveCallCard } from '@/components/LiveCallCard';
import { PastCallsTable } from '@/components/PastCallsTable';
import { SearchBar } from '@/components/SearchBar';
import { UpdateTicketModal } from '@/components/UpdateTicketModal';
import { DateRange } from 'react-day-picker';
import { Phone, History } from 'lucide-react';

const Dashboard = () => {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  const calls = useCallStore((state) => state.calls);
  const addTranscriptSegment = useCallStore((state) => state.addTranscriptSegment);
  const setSystemStatus = useCallStore((state) => state.setSystemStatus);

  // Connect to realtime updates
  useEffect(() => {
    const connection = new RealtimeConnection();
    
    connection.connect({
      onTranscriptSegment: (segment) => {
        addTranscriptSegment(segment);
        setSystemStatus({ lastEventTimestamp: new Date() });
      },
      onConnectionChange: (connected) => {
        setSystemStatus({ backendConnected: connected });
      },
    });

    return () => connection.disconnect();
  }, [addTranscriptSegment, setSystemStatus]);

  // Memoize filtered calls
  const liveCalls = useMemo(() => {
    return calls.filter((call) => call.status === 'live');
  }, [calls]);
  
  const filteredPastCalls = useMemo(() => {
    let pastCalls = calls.filter((call) => call.status !== 'live');
    
    if (search) {
      const searchLower = search.toLowerCase();
      pastCalls = pastCalls.filter(
        (call) =>
          call.fromNumber.toLowerCase().includes(searchLower) ||
          call.toNumber.toLowerCase().includes(searchLower) ||
          call.agentName?.toLowerCase().includes(searchLower) ||
          call.ticketId?.toLowerCase().includes(searchLower)
      );
    }

    if (dateRange?.from) {
      pastCalls = pastCalls.filter((call) => call.startedAt >= dateRange.from!);
    }
    if (dateRange?.to) {
      pastCalls = pastCalls.filter((call) => call.startedAt <= dateRange.to!);
    }

    // Sort newest first
    pastCalls.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    
    return pastCalls;
  }, [calls, search, dateRange]);

  // Pagination
  const pageSize = 10;
  const totalPages = Math.ceil(filteredPastCalls.length / pageSize);
  const paginatedCalls = useMemo(() => {
    return filteredPastCalls.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredPastCalls, page]);

  const handleUpdateTicket = (call: Call) => {
    setSelectedCall(call);
    setTicketModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Calls - Left Column */}
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/10">
              <Phone className="h-4 w-4 text-success" />
            </div>
            <h2 className="text-lg font-semibold">Live Calls</h2>
            {liveCalls.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-success/20 text-success">
                {liveCalls.length}
              </span>
            )}
          </div>

          {liveCalls.length === 0 ? (
            <div className="console-card text-center py-12">
              <Phone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No active calls</p>
              <p className="text-sm text-muted-foreground/70">
                Live calls will appear here in real-time
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {liveCalls.map((call) => (
                <LiveCallCard
                  key={call.id}
                  call={call}
                  onUpdateTicket={handleUpdateTicket}
                />
              ))}
            </div>
          )}
        </div>

        {/* Past Calls - Right Column */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
              <History className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Past Calls</h2>
            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
              {filteredPastCalls.length}
            </span>
          </div>

          <PastCallsTable
            calls={paginatedCalls}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Update Ticket Modal */}
      <UpdateTicketModal
        call={selectedCall}
        open={ticketModalOpen}
        onOpenChange={setTicketModalOpen}
      />
    </div>
  );
};

export default Dashboard;
