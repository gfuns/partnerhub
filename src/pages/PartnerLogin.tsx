import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/contexts/BrandingContext';
import { brandingService } from '@/services/api/branding.service';

export default function PartnerLogin() {
    const navigate = useNavigate();
    const { authenticate, isAuthenticated, isLoading, authState } = useAuth();
    const { toast } = useToast();
    const { setBranding, getAssetUrl, branding: ctxBranding } = useBranding();

    // Local copy of partner/branding returned by public branding endpoint
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
                if (resp.data.partner) {
                    setRemotePartner(resp.data.partner);
                }
                setBranding(payload as any);
            }
        } catch (err) {
            console.warn('Could not fetch branding for this host', err);
        }
    }, [setBranding]);

    useEffect(() => {
        fetchBranding();
    }, [fetchBranding]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isAuthenticated && !isLoading && !authState.requiresPasswordChange && !authState.requiresContextSelection) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Partner login is always 'partner' account type
            const result = await authenticate(email, password, 'partner');

            if (result.requiresPasswordChange) {
                toast({
                    title: 'Password Change Required',
                    description: 'Please change your password to continue.',
                });
                navigate('/change-password');
            } else if (result.requiresContextSelection) {
                navigate('/choose-account');
            } else if (result.requiresKycOnboarding) {
                toast({
                    title: 'KYC Onboarding Required',
                    description: 'Please complete your KYC verification to continue.',
                });
                navigate('/partner-kyc-onboarding');
            } else {
                toast({
                    title: 'Welcome back!',
                    description: 'You have successfully logged in.',
                });
                navigate('/dashboard');
            }
        } catch (error: any) {
            console.log(error);

            if (error.errors && Object.keys(error.errors).length > 0) {
                const firstErrorKey = Object.keys(error.errors)[0];
                const firstErrorMessages = error.errors[firstErrorKey];
                const firstError = Array.isArray(firstErrorMessages) ? firstErrorMessages[0] : firstErrorMessages;

                toast({
                    variant: 'destructive',
                    title: 'Validation Error',
                    description: firstError || error.message || 'Please check your input',
                });
            } else {
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
                        {remotePartner?.name || activeBranding.partner_name || 'Partner POS Platform'}
                    </h1>
                    <p className="text-lg" style={{ color: activeBranding.sidebar_text_color || undefined }}>
                        Manage terminals, track transactions, and grow your business with our enterprise-grade payment platform.
                    </p>
                </div>
            </div>

            {/* Right panel - Login form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12" style={{ background: activeBranding.login_bg_color || undefined }}>
                <div className="w-full max-w-md rounded-md p-6 lg:p-8" style={{ background: activeBranding.login_card_bg_color || undefined, boxShadow: activeBranding.box_shadow || undefined }}>
                    <div className="lg:hidden mb-8 flex justify-center">
                        {logoUrl ? (
                            <img src={logoUrl} alt={remotePartner?.name || 'Logo'} className="h-12 w-auto object-contain" />
                        ) : (
                            <Logo size="lg" />
                        )}
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold" style={{ color: activeBranding.text_primary_color || undefined }}>Partner Sign in</h2>
                        <p className="mt-2 text-sm" style={{ color: activeBranding.text_secondary_color || undefined }}>
                            {activeBranding.login_welcome_message || 'Enter your partner credentials to access your dashboard'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
