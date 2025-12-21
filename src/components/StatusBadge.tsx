import { cn } from '@/lib/utils';

type StatusType = 'online' | 'offline' | 'pending' | 'success' | 'error' | 'warning';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

const statusStyles: Record<StatusType, { bg: string; text: string; dot: string }> = {
  online: {
    bg: 'bg-success/10',
    text: 'text-success',
    dot: 'bg-success',
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
    dot: 'bg-success',
  },
  offline: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  pending: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    dot: 'bg-warning',
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    dot: 'bg-warning',
  },
  error: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    dot: 'bg-destructive',
  },
};

const statusLabels: Record<StatusType, string> = {
  online: 'Online',
  offline: 'Offline',
  pending: 'Pending',
  success: 'Success',
  error: 'Failed',
  warning: 'Warning',
};

export function StatusBadge({ status, label, showDot = true, size = 'md' }: StatusBadgeProps) {
  const styles = statusStyles[status];
  const displayLabel = label || statusLabels[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        styles.bg,
        styles.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full',
            styles.dot,
            status === 'online' && 'animate-pulse-dot',
            size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
          )}
        />
      )}
      {displayLabel}
    </span>
  );
}
