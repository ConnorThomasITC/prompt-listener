import { useState } from 'react';
import { Call } from '@/types/call';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useCallStore } from '@/store/callStore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TicketPlus, AlertCircle } from 'lucide-react';

interface UpdateTicketModalProps {
  call: Call | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdateTicketModal = ({ call, open, onOpenChange }: UpdateTicketModalProps) => {
  const { toast } = useToast();
  const updateCall = useCallStore((state) => state.updateCall);
  const [ticketId, setTicketId] = useState(call?.ticketId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!call) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await api.updateTicket(call.id, ticketId || undefined);

      if (result.ok) {
        updateCall(call.id, {
          ticketId: result.data.ticketId,
          hasTicketUpdate: true,
        });
        
        toast({
          title: 'Ticket Updated',
          description: result.message || 'Transcript successfully pushed to ConnectWise Manage',
        });
        
        onOpenChange(false);
      } else {
        setError(result.message || 'Failed to update ticket');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TicketPlus className="h-5 w-5 text-primary" />
            Update Ticket
          </DialogTitle>
          <DialogDescription>
            Push the call transcript to ConnectWise Manage. You can optionally specify an existing ticket ID.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Call Info */}
          {call && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">From:</span>
                  <p className="font-mono">{call.fromNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">To:</span>
                  <p className="font-mono">{call.toNumber}</p>
                </div>
                {call.agentName && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Agent:</span>
                    <p>{call.agentName}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ticket ID Input */}
          <div className="space-y-2">
            <Label htmlFor="ticketId">Ticket ID (optional)</Label>
            <Input
              id="ticketId"
              placeholder="e.g., TKT-2024-1234"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to create a new ticket automatically
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? 'Updating...' : 'Update Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
