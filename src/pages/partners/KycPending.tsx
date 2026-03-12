import { Clock, CheckCircle2, XCircle, AlertTriangle, LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function PartnerKycPending() {
  const { logout, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/partner', { replace: true });
  };

  const status = user?.kycStatus || 'pending_review';

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/partner" replace />;
  }

  // Redirect approved partners to dashboard
  if (user?.kycStatus === 'approved') {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect pending_onboarding to KYC wizard
  if (user?.kycStatus === 'pending_onboarding') {
    return <Navigate to="/partner-kyc-onboarding" replace />;
  }

  const statusConfig = {
    pending_review: {
      icon: Clock,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      title: 'Application Under Review',
      description: 'Your KYC documents have been submitted successfully. Our team is reviewing your application.',
      message: 'This usually takes 2-3 business days. We will notify you via email once your application is processed.',
    },
    rejected: {
      icon: XCircle,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
      title: 'Application Not Approved',
      description: 'Unfortunately, your KYC application was not approved.',
      message: 'Please contact support for more information about why your application was rejected and how to resubmit.',
    },
    suspended: {
      icon: AlertTriangle,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
      title: 'Account Suspended',
      description: 'Your account has been suspended.',
      message: 'Please contact support for assistance with reactivating your account.',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_review;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className={cn('mx-auto mb-4 p-4 rounded-full w-fit', config.bgColor)}>
              <Icon className={cn('h-12 w-12', config.iconColor)} />
            </div>
            <CardTitle className="text-xl">{config.title}</CardTitle>
            <CardDescription className="text-base">{config.description}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">{config.message}</p>

            {status === 'pending_review' && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Our team will verify your submitted documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                    <span>We'll review your business information and compliance requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                    <span>You'll receive an email notification once approved</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Upon approval, you can start managing agents and terminals</span>
                  </li>
                </ul>
              </div>
            )}

            {status === 'rejected' && (
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/partner-kyc-onboarding')}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Resubmit Application
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.location.href = 'mailto:support@xtrapay.com?subject=KYC Application Rejected';
                  }}
                >
                  Contact Support
                </Button>
              </div>
            )}

            {status === 'suspended' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.href = 'mailto:support@xtrapay.com?subject=Account Suspended';
                }}
              >
                Contact Support
              </Button>
            )}

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Need help?{' '}
                <a
                  href="mailto:support@xtrapay.com"
                  className="text-primary hover:underline"
                >
                  Contact our support team
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
