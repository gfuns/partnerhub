import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { brandingService } from '@/services/api/branding.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, authState, changePassword, logout, isLoading, logoutRedirectPath } = useAuth();
  const { toast } = useToast();
  const { setBranding, getAssetUrl, branding: ctxBranding } = useBranding();

  const [remoteBranding, setRemoteBranding] = useState<any | null>(null);
  const [remotePartner, setRemotePartner] = useState<any | null>(null);

  const fetchBranding = useCallback(async () => {
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      const parts = host.split('.').filter(Boolean);
      const subdomain = parts.length >= 3 ? parts[0] : '';

      const resp = await brandingService.getBrandingBySubdomain(subdomain);
      if (resp && resp.success && resp.data) {
        const payload = (resp.data.branding) ? resp.data.branding : resp.data;
        setRemoteBranding(payload);
        if (resp.data.partner) setRemotePartner(resp.data.partner);
        setBranding(payload as any);
      }
    } catch (err) {
      // ignore branding fetch failures
      console.warn('Branding fetch failed', err);
    }
  }, [setBranding]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate(logoutRedirectPath);
    }
  }, [user, navigate, logoutRedirectPath]);

  const handleLogout = async () => {
    try {
      const redirectTo = logoutRedirectPath;
      await logout();
      navigate(redirectTo);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: 'Please try again',
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      toast({
        title: 'Password changed successfully',
        description: 'You can now use your new password to login',
      });

      // Navigate based on user login_type and KYC status
      if (user?.loginType === 'agent') {
        // Agent users - check KYC status
        const kycStatus = user?.kycStatus;

        if (kycStatus === 'pending_onboarding' || !kycStatus || user?.requiresKycOnboarding) {
          navigate('/kyc-onboarding');
        } else if (kycStatus === 'pending_review' || kycStatus === 'pending_correction') {
          navigate('/kyc-pending');
        } else if (kycStatus === 'approved') {
          navigate('/dashboard');
        } else {
          // For other statuses (rejected, etc), go to kyc-pending
          navigate('/kyc-pending');
        }
      } else if (user?.loginType === 'partner') {
        // Partner users - check KYC status
        const kycStatus = user?.kycStatus;

        if (kycStatus === 'pending_onboarding' || user?.requiresKycOnboarding || authState.requiresKycOnboarding) {
          navigate('/partner-kyc-onboarding');
        } else if (kycStatus === 'pending_review' || kycStatus === 'pending_correction') {
          navigate('/partner-kyc-pending');
        } else if (kycStatus === 'approved') {
          navigate('/dashboard');
        } else {
          // For other statuses, check if KYC onboarding is required
          if (authState.requiresKycOnboarding) {
            navigate('/partner-kyc-onboarding');
          } else {
            navigate('/dashboard');
          }
        }
      } else {
        // Default fallback
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to change password',
        description: error.message || 'Please check your current password and try again',
      });
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const activeBranding = remoteBranding || ctxBranding || {};
  const logoUrl = getAssetUrl(remotePartner?.logo_url ?? activeBranding.logo_url);

  return (
    <div
      className="min-h-screen flex"
      style={{ background: activeBranding.login_bg_color || undefined, fontFamily: activeBranding.font_family || undefined }}
    >
      {/* Left panel - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12"
        style={{ background: activeBranding.sidebar_bg_color || undefined, color: activeBranding.sidebar_text_color || undefined }}
      >
        <div className="max-w-md text-center">
          <div className="mb-8 flex justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt={remotePartner?.name || 'Logo'} className="h-16 w-auto object-contain" />
            ) : (
              <Logo variant="light" size="lg" />
            )}
          </div>
          <h1 className="text-3xl font-semibold mb-4" style={{ color: activeBranding.sidebar_text_color || undefined }}>
            Secure Your Account
          </h1>
          <p className="text-lg" style={{ color: activeBranding.sidebar_text_color || undefined }}>
            For security reasons, you must change your password before continuing.
          </p>
        </div>
      </div>

      {/* Right panel - Password Change Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12" style={{ background: activeBranding.login_bg_color || undefined }}>
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt={remotePartner?.name || 'Logo'} className="h-12 w-auto object-contain" />
            ) : (
              <Logo size="lg" />
            )}
          </div>

          <Card style={{ background: activeBranding.login_card_bg_color || undefined, boxShadow: activeBranding.box_shadow || undefined }}>
            <CardHeader>
              <CardTitle style={{ color: activeBranding.text_primary_color || undefined }}>Change Password</CardTitle>
              <CardDescription style={{ color: activeBranding.text_secondary_color || undefined }}>
                Please create a new secure password to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">{/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      placeholder="Enter your current password"
                      value={formData.currentPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, currentPassword: e.target.value });
                        setErrors({ ...errors, currentPassword: '' });
                      }}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      placeholder="Enter new password (min 8 characters)"
                      value={formData.newPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, newPassword: e.target.value });
                        setErrors({ ...errors, newPassword: '' });
                      }}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        setErrors({ ...errors, confirmPassword: '' });
                      }}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium mb-2">Password requirements:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <span className={formData.newPassword.length >= 8 ? 'text-green-600' : ''}>
                        • At least 8 characters
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={formData.newPassword !== formData.currentPassword && formData.newPassword ? 'text-green-600' : ''}>
                        • Different from current password
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? 'text-green-600' : ''}>
                        • Passwords match
                      </span>
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                  style={{
                    background: activeBranding.btn_primary_bg_color || undefined,
                    color: activeBranding.btn_primary_text_color || undefined,
                    borderRadius: activeBranding.border_radius || undefined,
                    fontFamily: activeBranding.font_family || undefined,
                    boxShadow: activeBranding.box_shadow || undefined,
                    border: activeBranding.btn_primary_bg_color ? 'none' : undefined,
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => {
                    if (activeBranding.btn_primary_hover_bg_color) {
                      (e.currentTarget as HTMLButtonElement).style.background = activeBranding.btn_primary_hover_bg_color;
                    }
                  }}
                  onMouseOut={e => {
                    if (activeBranding.btn_primary_bg_color) {
                      (e.currentTarget as HTMLButtonElement).style.background = activeBranding.btn_primary_bg_color;
                    }
                  }}
                >
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </Button>

                {/* Logout Option */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                  style={{ borderRadius: activeBranding.border_radius || undefined }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout Instead
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
