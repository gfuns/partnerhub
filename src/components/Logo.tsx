import { useAuth } from '@/contexts/AuthContext';
import { CreditCard } from 'lucide-react';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ variant = 'dark', size = 'md', showText = true }: LogoProps) {
  const { partner } = useAuth();

  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const colorClasses = variant === 'light' 
    ? 'text-sidebar-primary' 
    : 'text-foreground';

  // If partner has a logo, show it
  if (partner?.logo_url) {
    return (
      <div className="flex items-center gap-2">
        <img
          src={partner.logo_url}
          alt={partner.name}
          className={`${sizeClasses[size]} object-contain`}
        />
        {showText && (
          <span className={`${textSizes[size]} font-semibold ${colorClasses}`}>
            {partner.name}
          </span>
        )}
      </div>
    );
  }

  // Default Xtrapay logo
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center justify-center rounded-lg bg-brand p-1.5 ${variant === 'light' ? '' : ''}`}>
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
