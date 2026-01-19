import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { brandingService } from '@/services/api/branding.service';

const Index = () => {
  const { isAuthenticated, isLoading, user, authState } = useAuth();
  const { setBranding } = useBranding();

  const [loadingBranding, setLoadingBranding] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = useCallback(async () => {
    setLoadingBranding(true);
    setError(null);

    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      const parts = host.split('.').filter(Boolean);
      const subdomain = parts.length >= 3 ? parts[0] : '';

      // If no subdomain, still attempt to call with empty string — backend may respond accordingly
      const resp = await brandingService.getBrandingBySubdomain(subdomain);

      if (resp && resp.success && resp.data) {
        // Save branding and apply
        setBranding(resp.data as any);
      } else {
        setError('We could not find a workspace for this address. Try again.');
      }
    } catch (err) {
      setError('We had trouble preparing your workspace. Tap to try again.');
    } finally {
      setLoadingBranding(false);
    }
  }, [setBranding]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  // While fetching branding, show a neutral loading screen — do not render defaults
  if (loadingBranding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto mb-4 animate-spin rounded-full border-4 border-gray-200 border-t-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Welcome</h2>
          <p className="text-sm text-gray-600 mt-2">Getting your workspace ready…</p>
        </div>
      </div>
    );
  }

  // On error, show friendly message with retry
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Almost there</h2>
          <p className="mt-3 text-gray-600">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => fetchBranding()}
              className="inline-flex items-center px-4 py-2 bg-brand text-white rounded-md"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // After branding is applied, continue with normal app flow
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Determine if user is a partner or agent
    const isPartner = user?.loginType === 'partner';
    const isAgent = user?.loginType === 'agent' || user?.role?.startsWith('agent');

    // Check if KYC onboarding is required
    if (user?.requiresKycOnboarding || authState.requiresKycOnboarding) {
      if (isPartner) {
        return <Navigate to="/partner-kyc-onboarding" replace />;
      } else {
        return <Navigate to="/kyc-onboarding" replace />;
      }
    }

    // Check KYC status for partners
    if (isPartner && user?.kycStatus) {
      switch (user.kycStatus) {
        case 'pending_onboarding':
          return <Navigate to="/partner-kyc-onboarding" replace />;
        case 'pending_review':
        case 'in_review':
        case 'pending_correction':
        case 'rejected':
        case 'suspended':
          return <Navigate to="/partner-kyc-pending" replace />;
      }
    }

    // Check KYC status for agents
    if (isAgent && user?.kycStatus) {
      switch (user.kycStatus) {
        case 'pending_onboarding':
          return <Navigate to="/kyc-onboarding" replace />;
        case 'pending_review':
        case 'in_review':
        case 'pending_correction':
        case 'rejected':
        case 'suspended':
          return <Navigate to="/kyc-pending" replace />;
      }
    }

    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default Index;
