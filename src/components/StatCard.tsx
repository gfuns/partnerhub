

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useBranding } from '@/contexts/BrandingContext';
// Auto-fit text component for value
export function AutoFitText({ value, color }: { value: string | number, color: string }) {
  const ref = React.useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = React.useState(2); // rem
  const displayValue = abbreviateNumber(value);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reset font size
    setFontSize(2);
    // Shrink font size if overflowing
    const resize = () => {
      if (!el) return;
      let size = 2;
      el.style.fontSize = size + 'rem';
      while (el.scrollWidth > el.offsetWidth && size > 1) {
        size -= 0.1;
        el.style.fontSize = size + 'rem';
      }
      setFontSize(size);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [displayValue]);

  return (
    <p
      ref={ref}
      className="font-semibold"
      style={{ color, fontSize: fontSize + 'rem', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      title={typeof value === 'number' ? value.toLocaleString() : value}
    >
      {displayValue}
    </p>
  );
}

function abbreviateNumber(value: string | number): string {
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
    if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
    if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(2).replace(/\.00$/, '') + 'K';
    return value.toString();
  }
  // Try to parse string as number
  const num = Number(value);
  if (!isNaN(num)) return abbreviateNumber(num);
  return value;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export function StatCard({ title, value, change, icon: Icon, trend, subtitle }: StatCardProps) {
  const { branding } = useBranding();
    return (
      <div
        className="rounded-lg border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover w-full max-w-full overflow-hidden"
        style={{ boxShadow: branding.card_shadow, borderColor: branding.card_border_color, background: branding.card_bg_color }}
      >
        <div className="flex items-start justify-between w-full max-w-full overflow-hidden">
          <div className="space-y-2 min-w-0 w-full">
            <p className="text-sm font-medium truncate" style={{ color: branding.text_muted_color }}>{title}</p>
            <AutoFitText value={value} color={branding.text_primary_color} />
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate" style={{ color: branding.text_muted_color }}>{subtitle}</p>
            )}
            {change && (
            <p
              className={cn(
                'text-xs font-medium truncate',
                trend === 'up' && 'text-success',
                trend === 'down' && 'text-destructive',
                trend === 'neutral' && 'text-muted-foreground'
              )}
              style={trend === 'up' ? { color: branding.success_color }
                : trend === 'down' ? { color: branding.danger_color }
                : { color: branding.text_muted_color }}
            >
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {change.value > 0 ? '+' : ''}{change.value}% {change.label}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className="rounded-lg p-3 flex-shrink-0"
            style={{ background: branding.stat_icon_bg_color }}
          >
            <Icon className="h-5 w-5" style={{ color: branding.stat_icon_color }} />
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 640px) {
          .statcard-responsive * {
            font-size: 90% !important;
          }
        }
        @media (max-width: 480px) {
          .statcard-responsive * {
            font-size: 80% !important;
          }
        }
      `}</style>
    </div>
  );
}
