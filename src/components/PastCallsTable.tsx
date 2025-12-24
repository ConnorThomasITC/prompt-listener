import { Call } from '@/types/call';
import { StatusBadge, DirectionBadge, TicketBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

interface PastCallsTableProps {
  calls: Call[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PastCallsTable = ({ calls, page, totalPages, onPageChange }: PastCallsTableProps) => {
  const navigate = useNavigate();

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return '--';
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (calls.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No past calls found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>From / To</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call) => (
              <TableRow
                key={call.id}
                className="cursor-pointer hover:bg-muted/20"
                onClick={() => navigate(`/calls/${call.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={call.status} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <DirectionBadge direction={call.direction} />
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                      {call.fromNumber} → {call.toNumber}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{call.agentName || '--'}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">
                    {formatDuration(call.startedAt, call.endedAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="text-sm">
                      {format(call.startedAt, 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(call.startedAt, 'HH:mm')} ({formatDistanceToNow(call.startedAt, { addSuffix: true })})
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <TicketBadge ticketId={call.ticketId} hasUpdate={call.hasTicketUpdate} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
