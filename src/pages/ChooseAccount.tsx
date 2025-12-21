import { useNavigate, Navigate } from 'react-router-dom';
import { Building2, User, Briefcase } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth, AccountContext } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

function getRoleIcon(role: string) {
  switch (role) {
    case 'partner_admin':
      return <Building2 className="h-5 w-5" />;
    case 'partner_staff':
      return <Briefcase className="h-5 w-5" />;
    case 'agent':
      return <User className="h-5 w-5" />;
    default:
      return <User className="h-5 w-5" />;
  }
}

function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' {
  switch (role) {
    case 'partner_admin':
      return 'default';
    case 'partner_staff':
      return 'secondary';
    case 'agent':
      return 'outline';
    default:
      return 'secondary';
  }
}

export default function ChooseAccount() {
  const navigate = useNavigate();
  const { pendingContexts, selectContext, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  // If no pending contexts, redirect to login
  if (!pendingContexts || pendingContexts.length === 0) {
    return <Navigate to="/login" replace />;
  }

  const handleSelectContext = (context: AccountContext) => {
    try {
      selectContext(context);
      toast({
        title: 'Welcome back!',
        description: `Signed in as ${context.roleLabel} at ${context.partnerName}`,
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to select account. Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <Logo variant="light" size="lg" />
          </div>
          <h1 className="text-3xl font-semibold text-sidebar-primary mb-4">
            Partner POS Platform
          </h1>
          <p className="text-sidebar-foreground text-lg">
            You have access to multiple accounts. Select the one you want to use for this session.
          </p>
        </div>
      </div>

      {/* Right panel - Account Selection */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-lg">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="lg" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground">Choose Account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Select the account you want to access
            </p>
          </div>

          <div className="space-y-4">
            {pendingContexts.map((context) => (
              <button
                key={context.id}
                onClick={() => handleSelectContext(context)}
                className="w-full p-5 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-brand/50 transition-all duration-200 text-left group"
              >
                <div className="flex items-start gap-4">
                  {/* Partner Logo or Fallback */}
                  <div 
                    className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ 
                      backgroundColor: context.partnerBrandColor 
                        ? `hsl(${context.partnerBrandColor} / 0.15)` 
                        : 'hsl(var(--muted))'
                    }}
                  >
                    {context.partnerLogoUrl ? (
                      <img 
                        src={context.partnerLogoUrl} 
                        alt={context.partnerName}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <span 
                        className="text-xl font-bold"
                        style={{ 
                          color: context.partnerBrandColor 
                            ? `hsl(${context.partnerBrandColor})` 
                            : 'hsl(var(--muted-foreground))'
                        }}
                      >
                        {context.partnerName.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground group-hover:text-brand transition-colors truncate">
                        {context.partnerName}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getRoleBadgeVariant(context.role)} className="flex items-center gap-1.5">
                        {getRoleIcon(context.role)}
                        <span>{context.roleLabel}</span>
                      </Badge>
                      
                      {context.helperText && (
                        <span className="text-xs text-muted-foreground">
                          • {context.helperText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex-shrink-0 text-muted-foreground group-hover:text-brand transition-colors">
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Back to login link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Sign in with a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
