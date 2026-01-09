import { Clock, CheckCircle2, XCircle, AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface KycPendingProps {
  status: 'pending_review' | 'rejected' | 'suspended';
  rejectionReason?: string;
}

export default function KycPending({ status = 'pending_review', rejectionReason }: KycPendingProps) {
  const { logout } = useAuth();

  const statusConfig = {
    pending_review: {
      icon: Clock,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      title: 'Application Under Review',
      description: 'Your KYC documents have been submitted successfully. Our team is reviewing your application.',
      message: 'This usually takes 1-2 business days. We will notify you via email once your application is processed.',
    },
    rejected: {
      icon: XCircle,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
      title: 'Application Not Approved',
      description: 'Unfortunately, your KYC application was not approved.',
      message: rejectionReason || 'Please contact support for more information about why your application was rejected.',
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

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Button variant="ghost" size="sm" onClick={logout}>
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
                    <span>You'll receive an email notification with the result</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Once approved, you can access your full dashboard</span>
                  </li>
                </ul>
              </div>
            )}

            {(status === 'rejected' || status === 'suspended') && (
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
