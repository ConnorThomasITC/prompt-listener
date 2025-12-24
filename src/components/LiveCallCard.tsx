import { useMemo } from 'react';
import { Call } from '@/types/call';
import { useCallStore } from '@/store/callStore';
import { StatusBadge, DirectionBadge, TicketBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Eye, TicketPlus, User, Clock, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface LiveCallCardProps {
  call: Call;
  onUpdateTicket: (call: Call) => void;
}

export const LiveCallCard = ({ call, onUpdateTicket }: LiveCallCardProps) => {
  const navigate = useNavigate();
  const transcripts = useCallStore((state) => state.transcripts);
  const [duration, setDuration] = useState('');

  const callTranscripts = useMemo(() => {
    return transcripts[call.id] || [];
  }, [transcripts, call.id]);

  // Update duration every second
  useEffect(() => {
    const updateDuration = () => {
      const diff = Date.now() - call.startedAt.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [call.startedAt]);

  const latestTranscript = callTranscripts[callTranscripts.length - 1];
  const hasFinalTranscripts = callTranscripts.some((t) => t.isFinal);

  return (
    <Card className="console-card pulse-glow animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusBadge status={call.status} />
            <DirectionBadge direction={call.direction} />
          </div>
          <div className="flex items-center gap-1 text-sm font-mono text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {duration}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Phone Numbers */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">From</p>
            <p className="text-sm font-mono">{call.fromNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">To</p>
            <p className="text-sm font-mono">{call.toNumber}</p>
          </div>
        </div>

        {/* Agent & Queue */}
        <div className="flex items-center gap-4 text-sm">
          {call.agentName && (
            <div className="flex items-center gap-1.5 text-foreground">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {call.agentName}
            </div>
          )}
          {call.queueOrDn && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {call.queueOrDn}
            </div>
          )}
        </div>

        {/* Ticket Badge */}
        {call.ticketId && (
          <TicketBadge ticketId={call.ticketId} hasUpdate={call.hasTicketUpdate} />
        )}

        {/* Live Transcript Preview */}
        {latestTranscript && (
          <div className="rounded-md bg-muted/50 p-3 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-2">
              Latest transcript
              {!latestTranscript.isFinal && (
                <span className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </p>
            <p className="text-sm font-mono text-foreground/80 line-clamp-2">
              <span className={latestTranscript.speaker === 'agent' ? 'text-success' : 'text-primary'}>
                [{latestTranscript.speaker}]
              </span>{' '}
              {latestTranscript.text}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/calls/${call.id}`)}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            View
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onUpdateTicket(call)}
            disabled={!hasFinalTranscripts}
          >
            <TicketPlus className="h-4 w-4 mr-1.5" />
            Update Ticket
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
