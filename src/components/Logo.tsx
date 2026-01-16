import { useAuth } from '@/contexts/AuthContext';
import { CreditCard } from 'lucide-react';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'full';
  showText?: boolean;
}

export function Logo({ variant = 'dark', size = 'md', showText = true }: LogoProps) {
  const { partner, branding, getAssetUrl } = useAuth();

  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    full: 'h-10 max-h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    full: 'text-2xl',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    full: 28,
  };

  const colorClasses = variant === 'light' 
    ? 'text-sidebar-primary' 
    : 'text-foreground';

  // Get logo URL from branding
  const logoUrl = getAssetUrl(branding?.logo_url);

  // If there's a logo URL, show only the logo (no text)
  if (logoUrl) {
    return (
      <div className="flex items-center">
        <img
          src={logoUrl}
          alt={partner?.name || 'Logo'}
          className={`${sizeClasses[size]} w-auto object-contain`}
          style={{ maxWidth: size === 'full' ? '180px' : '140px' }}
        />
      </div>
    );
  }

  // Fallback: Show icon + partner name (or default Xtrapay)
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center rounded-lg bg-brand p-1.5">
        <CreditCard size={iconSizes[size]} className="text-brand-foreground" />
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-semibold ${colorClasses}`}>
          {partner?.name || 'Xtrapay'}
        </span>
      )}
    </div>
  );
}
