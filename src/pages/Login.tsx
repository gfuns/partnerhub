import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type AccountType = 'partner' | 'agent';

export default function Login() {
  const navigate = useNavigate();
  const { authenticate, isAuthenticated, isLoading, authState } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('partner');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated && !isLoading && !authState.requiresPasswordChange && !authState.requiresContextSelection) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await authenticate(email, password, accountType);
      
      if (result.requiresPasswordChange) {
        // User must change password first
        toast({
          title: 'Password Change Required',
          description: 'Please change your password to continue.',
        });
        navigate('/change-password');
      } else if (result.requiresContextSelection) {
        // User has multiple contexts to choose from
        navigate('/choose-account');
      } else if (result.requiresKycOnboarding) {
        // User must complete KYC onboarding
        toast({
          title: 'KYC Onboarding Required',
          description: 'Please complete your KYC verification to continue.',
        });
        // Navigate based on login type
        if (accountType === 'partner') {
          navigate('/partner-kyc-onboarding');
        } else {
          navigate('/kyc-onboarding');
        }
      } else {
        // User is fully authenticated
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.log(error);
      
      // Handle validation errors (422 with errors object)
      if (error.errors && Object.keys(error.errors).length > 0) {
        // Get the first validation error
        const firstErrorKey = Object.keys(error.errors)[0];
        const firstErrorMessages = error.errors[firstErrorKey];
        const firstError = Array.isArray(firstErrorMessages) ? firstErrorMessages[0] : firstErrorMessages;
        
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: firstError || error.message || 'Please check your input',
        });
      } else {
        // Display the API error message (e.g., "Invalid credentials")
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: error.message || 'Invalid email or password',
        });
      }
    } finally {
      setIsSubmitting(false);
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
            Manage terminals, track transactions, and grow your business with our enterprise-grade payment platform.
          </p>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="lg" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground">Sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Account Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('partner')}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    accountType === 'partner'
                      ? 'border-brand bg-brand/5 text-brand'
                      : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  Partner Admin / Staff
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('agent')}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    accountType === 'agent'
                      ? 'border-brand bg-brand/5 text-brand'
                      : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  Agent (Terminal Owner)
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
