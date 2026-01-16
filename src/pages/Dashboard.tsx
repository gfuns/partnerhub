import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PartnerDashboard from './dashboard/PartnerDashboard';
import AgentDashboard from './dashboard/AgentDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is an agent and redirect based on KYC status
    if (user?.loginType === 'agent') {
      const kycStatus = user?.kycStatus;
      const requiresKycOnboarding = user?.requiresKycOnboarding;
      
      if (requiresKycOnboarding || kycStatus === 'pending_onboarding') {
        navigate('/kyc-onboarding', { replace: true });
      } else if (kycStatus === 'pending_review' || kycStatus === 'pending_correction') {
        navigate('/kyc-pending', { replace: true });
      } else if (kycStatus === 'rejected') {
        navigate('/kyc-onboarding', { replace: true }); // Allow resubmission
      }
      // If approved, stay on dashboard
    }

    // Check if user is a partner and redirect based on KYC status
    if (user?.loginType === 'partner') {
      const kycStatus = user?.kycStatus;
      const requiresKycOnboarding = user?.requiresKycOnboarding;
      
      if (requiresKycOnboarding || kycStatus === 'pending_onboarding') {
        navigate('/partner-kyc-onboarding', { replace: true });
      } else if (kycStatus === 'pending_review') {
        navigate('/partner-kyc-pending', { replace: true });
      } else if (kycStatus === 'rejected') {
        navigate('/partner-kyc-onboarding', { replace: true }); // Allow resubmission
      } else if (kycStatus === 'suspended') {
        navigate('/partner-kyc-pending', { replace: true });
      }
      // If approved, stay on dashboard
    }
  }, [user, navigate]);

  // Check if user is an agent based on loginType
  if (user?.loginType === 'agent') {
    // Only render if KYC is approved
    if (user?.kycStatus === 'approved') {
      return <AgentDashboard />;
    }
    // Return null while redirecting
    return null;
  }

  // For partners, only render dashboard if KYC is approved
  if (user?.loginType === 'partner') {
    if (user?.kycStatus === 'approved') {
      return <PartnerDashboard />;
    }
    // Return null while redirecting
    return null;
  }

  return <PartnerDashboard />;
}
