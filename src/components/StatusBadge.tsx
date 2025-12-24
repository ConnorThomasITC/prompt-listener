import { CallStatus, CallDirection, Speaker } from '@/types/call';
import { cn } from '@/lib/utils';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, CheckCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: CallStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = {
    live: {
      icon: Phone,
      label: 'Live',
      className: 'bg-success/20 text-success border border-success/30',
    },
    ended: {
      icon: CheckCircle,
      label: 'Ended',
      className: 'bg-muted text-muted-foreground border border-border',
    },
    failed: {
      icon: AlertCircle,
      label: 'Failed',
      className: 'bg-destructive/20 text-destructive border border-destructive/30',
    },
  };

  const { icon: Icon, label, className: statusClass } = config[status];

  return (
    <span className={cn('status-badge', statusClass, className)}>
      {status === 'live' && <span className="live-indicator mr-1" />}
      {status !== 'live' && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
};

interface DirectionBadgeProps {
  direction: CallDirection;
  className?: string;
}

export const DirectionBadge = ({ direction, className }: DirectionBadgeProps) => {
  const config = {
    inbound: {
      icon: PhoneIncoming,
      label: 'Inbound',
      className: 'bg-primary/10 text-primary border border-primary/20',
    },
    outbound: {
      icon: PhoneOutgoing,
      label: 'Outbound',
      className: 'bg-accent/10 text-accent-foreground border border-accent/20',
    },
  };

  const { icon: Icon, label, className: dirClass } = config[direction];

  return (
    <span className={cn('status-badge', dirClass, className)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

interface SpeakerBadgeProps {
  speaker: Speaker;
  className?: string;
}

export const SpeakerBadge = ({ speaker, className }: SpeakerBadgeProps) => {
  const config = {
    caller: {
      label: 'Caller',
      className: 'text-primary',
    },
    agent: {
      label: 'Agent',
      className: 'text-success',
    },
    unknown: {
      label: 'Unknown',
      className: 'text-muted-foreground',
    },
  };

  const { label, className: speakerClass } = config[speaker];

  return (
    <span className={cn('text-xs font-medium uppercase tracking-wide', speakerClass, className)}>
      {label}
    </span>
  );
};

interface TicketBadgeProps {
  ticketId: string | null;
  hasUpdate: boolean;
  className?: string;
}

export const TicketBadge = ({ ticketId, hasUpdate, className }: TicketBadgeProps) => {
  if (!ticketId) return null;

  return (
    <span
      className={cn(
        'status-badge',
        hasUpdate
          ? 'bg-success/20 text-success border border-success/30'
          : 'bg-warning/20 text-warning border border-warning/30',
        className
      )}
    >
      <CheckCircle className="h-3 w-3" />
      {ticketId}
    </span>
  );
};
