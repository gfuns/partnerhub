import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // KYC-based redirects for agents
  if (user?.role === 'agent' && user?.kycStatus) {
    switch (user.kycStatus) {
      case 'pending_onboarding':
        return <Navigate to="/kyc-onboarding" replace />;
      case 'pending_review':
        return <Navigate to="/kyc-pending?status=pending_review" replace />;
      case 'rejected':
        return <Navigate to="/kyc-pending?status=rejected" replace />;
      case 'suspended':
        return <Navigate to="/kyc-pending?status=suspended" replace />;
      // 'approved' status allows normal dashboard access
    }
  }

  return (
    <div className="flex h-screen w-full bg-background">
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
