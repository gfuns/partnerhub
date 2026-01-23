import { cn } from '@/lib/utils';
import { TicketStatus, TicketPriority, TICKET_STATUS_COLORS, PRIORITY_COLORS } from '@/types/support';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export function TicketStatusBadge({ status, size = 'md' }: TicketStatusBadgeProps) {
  const colors = TICKET_STATUS_COLORS[status] || TICKET_STATUS_COLORS.open;
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium capitalize',
        colors.bg,
        colors.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      {label}
    </span>
  );
}

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}

export function TicketPriorityBadge({ priority, size = 'md' }: TicketPriorityBadgeProps) {
  const colors = PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium capitalize',
        colors.bg,
        colors.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      {priority}
    </span>
  );
}

interface EscalatedBadgeProps {
  className?: string;
}

export function EscalatedBadge({ className }: EscalatedBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-600',
        className
      )}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      Escalated
    </span>
  );
}
