import { cn } from '@/lib/utils';

type StatusType = 'online' | 'offline' | 'pending' | 'pending_onboarding' | 'in_review' | 'success' | 'error' | 'failed' | 'warning' | 'active' | 'disabled' | 'revoked' | 'suspended' | 'approved' | 'rejected' | 'pending_review' | 'paid';

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
  active: {
    bg: 'bg-success/10',
    text: 'text-success',
    dot: 'bg-success',
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
    dot: 'bg-success',
  },
  paid: {
    bg: 'bg-success/10',
    text: 'text-success',
    dot: 'bg-success',
  },
  offline: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  disabled: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  pending: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    dot: 'bg-warning',
  },
  pending_onboarding: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600',
    dot: 'bg-orange-500',
  },
  in_review: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    dot: 'bg-warning',
  },
  suspended: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    dot: 'bg-warning',
  },
  error: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    dot: 'bg-destructive',
  },
  failed: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    dot: 'bg-destructive',
  },
  revoked: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    dot: 'bg-destructive',
  },
  approved: {
    bg: 'bg-success/10',
    text: 'text-success',
    dot: 'bg-success',
  },
  rejected: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    dot: 'bg-destructive',
  },
  pending_review: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    dot: 'bg-destructive',
  },
};

const statusLabels: Record<StatusType, string> = {
  online: 'Online',
  active: 'Active',
  offline: 'Offline',
  disabled: 'Disabled',
  pending: 'Pending',
  pending_onboarding: 'Pending Onboarding',
  in_review: 'In Review',
  success: 'Success',
  error: 'Failed',
  failed: 'Failed',
  warning: 'Warning',
  suspended: 'Suspended',
  revoked: 'Revoked',
  approved: 'Approved',
  rejected: 'Rejected',
  pending_review: 'Pending Review',
  paid: 'Paid'
};

export function StatusBadge({ status, label, showDot = true, size = 'md' }: StatusBadgeProps) {
  const styles = statusStyles[status.toLowerCase()] || statusStyles.pending; // Fallback to pending if status is unknown
  const displayLabel = label || statusLabels[status] || status; // Show raw status if no label    

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
      {displayLabel.replace(/_/g, ' ')}
    </span>
  );
}
