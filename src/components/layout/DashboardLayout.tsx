import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading, user, authState, branding, logoutRedirectPath } = useAuth();

  if (isLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: branding.body_bg_color }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: branding.primary_color, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={logoutRedirectPath} replace />;
  }

  // Determine if user is a partner or agent
  const isPartner = user?.loginType === 'partner';
  const isAgent = user?.loginType === 'agent' || user?.role?.startsWith('agent');

  // Check if user requires KYC onboarding
  if (user?.requiresKycOnboarding || authState.requiresKycOnboarding) {
    if (isPartner) {
      return <Navigate to="/partner-kyc-onboarding" replace />;
    } else {
      return <Navigate to="/kyc-onboarding" replace />;
    }
  }

  // KYC-based redirects for partners with specific statuses
  if (isPartner && user?.kycStatus) {
    switch (user.kycStatus) {
      case 'pending_onboarding':
        return <Navigate to="/partner-kyc-onboarding" replace />;
      case 'pending_review':
        return <Navigate to="/partner-kyc-pending?status=pending_review" replace />;
      case 'in_review':
        return <Navigate to="/partner-kyc-pending?status=in_review" replace />;
      case 'pending_correction':
        return <Navigate to="/partner-kyc-pending?status=pending_correction" replace />;
      case 'rejected':
        return <Navigate to="/partner-kyc-pending?status=rejected" replace />;
      case 'suspended':
        return <Navigate to="/partner-kyc-pending?status=suspended" replace />;
      // Only 'approved' status allows normal dashboard access
    }
  }

  // KYC-based redirects for agents with specific statuses
  if (isAgent && user?.kycStatus) {
    switch (user.kycStatus) {
      case 'pending_onboarding':
        return <Navigate to="/kyc-onboarding" replace />;
      case 'pending_review':
        return <Navigate to="/kyc-pending?status=pending_review" replace />;
      case 'in_review':
        return <Navigate to="/kyc-pending?status=in_review" replace />;
      case 'pending_correction':
        return <Navigate to="/kyc-pending?status=pending_correction" replace />;
      case 'rejected':
        return <Navigate to="/kyc-pending?status=rejected" replace />;
      case 'suspended':
        return <Navigate to="/kyc-pending?status=suspended" replace />;
      // Only 'approved' status allows normal dashboard access
    }
  }

  return (
    <div
      className="flex h-screen w-full"
      style={{ backgroundColor: branding.body_bg_color }}
    >
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
