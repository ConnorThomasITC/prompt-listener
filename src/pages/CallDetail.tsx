import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCallStore } from '@/store/callStore';
import { api, RealtimeConnection } from '@/lib/api';
import { StatusBadge, DirectionBadge, TicketBadge } from '@/components/StatusBadge';
import { TranscriptViewer } from '@/components/TranscriptViewer';
import { UpdateTicketModal } from '@/components/UpdateTicketModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Phone,
  User,
  Clock,
  Calendar,
  TicketPlus,
  Save,
  ExternalLink,
  Loader2,
} from 'lucide-react';

const CallDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const calls = useCallStore((state) => state.calls);
  const transcripts = useCallStore((state) => state.transcripts);
  const addTranscriptSegment = useCallStore((state) => state.addTranscriptSegment);
  const updateCall = useCallStore((state) => state.updateCall);

  const call = useMemo(() => {
    return calls.find((c) => c.id === id);
  }, [calls, id]);

  const callTranscripts = useMemo(() => {
    return transcripts[id || ''] || [];
  }, [transcripts, id]);

  const [notes, setNotes] = useState(call?.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [duration, setDuration] = useState('');

  // Calculate duration
  useEffect(() => {
    if (!call) return;

    const updateDuration = () => {
      const end = call.endedAt || new Date();
      const diff = end.getTime() - call.startedAt.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      if (hours > 0) {
        setDuration(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateDuration();
    
    if (call.status === 'live') {
      const interval = setInterval(updateDuration, 1000);
      return () => clearInterval(interval);
    }
  }, [call]);

  // Connect to realtime for live calls
  useEffect(() => {
    if (!call || call.status !== 'live') return;

    const connection = new RealtimeConnection();
    
    connection.connect({
      onTranscriptSegment: (segment) => {
        if (segment.callId === id) {
          addTranscriptSegment(segment);
        }
      },
    });

    return () => connection.disconnect();
  }, [id, call?.status, addTranscriptSegment]);

  const handleSaveNotes = async () => {
    if (!call) return;
    
    setSavingNotes(true);
    try {
      await api.saveNotes(call.id, notes);
      updateCall(call.id, { notes });
      toast({
        title: 'Notes Saved',
        description: 'Your notes have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingNotes(false);
    }
  };

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground mb-4">Call not found</p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StatusBadge status={call.status} />
            <DirectionBadge direction={call.direction} />
            {call.ticketId && (
              <TicketBadge ticketId={call.ticketId} hasUpdate={call.hasTicketUpdate} />
            )}
          </div>
          
          <h1 className="text-2xl font-bold">
            {call.direction === 'inbound' ? call.fromNumber : call.toNumber}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {call.agentName && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {call.agentName}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {duration}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(call.startedAt, 'MMM d, yyyy HH:mm')}
              {call.status === 'live' && (
                <span className="ml-1 text-success animate-pulse-subtle">● Live</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setTicketModalOpen(true)}>
            <TicketPlus className="h-4 w-4 mr-2" />
            Update Ticket
          </Button>
          {call.ticketId && (
            <Button variant="outline" asChild>
              <a
                href={`https://connectwise.example.com/ticket/${call.ticketId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in CW
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transcript - Main Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transcript</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <TranscriptViewer
                segments={callTranscripts}
                isLive={call.status === 'live'}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Call Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Call Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">From</p>
                  <p className="font-mono">{call.fromNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">To</p>
                  <p className="font-mono">{call.toNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Queue / DN</p>
                  <p>{call.queueOrDn || '--'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Started</p>
                  <p>{format(call.startedAt, 'HH:mm:ss')}</p>
                </div>
                {call.endedAt && (
                  <>
                    <div>
                      <p className="text-muted-foreground mb-1">Ended</p>
                      <p>{format(call.endedAt, 'HH:mm:ss')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Duration</p>
                      <p className="font-mono">{duration}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Add notes about this call..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
              />
              <Button
                onClick={handleSaveNotes}
                disabled={savingNotes || notes === call.notes}
                className="w-full"
              >
                {savingNotes ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Notes
              </Button>
            </CardContent>
          </Card>

          {/* Ticket Status */}
          {call.hasTicketUpdate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Update</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-success">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  Transcript pushed to {call.ticketId}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated {formatDistanceToNow(new Date(), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Update Ticket Modal */}
      <UpdateTicketModal
        call={call}
        open={ticketModalOpen}
        onOpenChange={setTicketModalOpen}
      />
    </div>
  );
};

export default CallDetail;
