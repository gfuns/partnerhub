import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated, isLoading, user, authState } = useAuth();

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
