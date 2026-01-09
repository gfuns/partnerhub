import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { KycStatus } from '@/types/kyc';

export type UserRole = 'partner_admin' | 'partner_staff' | 'agent';

export interface Partner {
  id: string;
  name: string;
  logo_url?: string;
  brand_color?: string;
}

export interface AccountContext {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerLogoUrl?: string;
  partnerBrandColor?: string;
  role: UserRole;
  roleLabel: string;
  helperText?: string;
  kycStatus?: KycStatus;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  partner?: Partner;
  kycStatus?: KycStatus;
}

interface AuthContextType {
  user: User | null;
  partner: Partner | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingContexts: AccountContext[] | null;
  authenticate: (email: string, password: string, accountType: 'partner' | 'agent') => Promise<AccountContext[]>;
  selectContext: (context: AccountContext) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default Xtrapay branding
const DEFAULT_PARTNER: Partner = {
  id: 'xtrapay',
  name: 'Xtrapay',
  logo_url: undefined,
  brand_color: undefined,
};

// Role permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  partner_admin: [
    'dashboard.view',
    'agents.view', 'agents.create', 'agents.edit', 'agents.disable',
    'terminals.view', 'terminals.create', 'terminals.assign', 'terminals.revoke',
    'transactions.view', 'transactions.export',
    'reports.view', 'reports.export',
    'monitoring.view',
    'users.view', 'users.create', 'users.edit', 'users.disable',
    'settings.view', 'settings.edit',
  ],
  partner_staff: [
    'dashboard.view',
    'agents.view',
    'terminals.view',
    'transactions.view',
    'reports.view',
    'monitoring.view',
  ],
  agent: [
    'dashboard.view',
    'my-terminals.view',
    'transactions.view',
    'settlements.view',
    'commissions.view',
    'profile.view', 'profile.edit',
  ],
};

// Mock account contexts for demo users
const MOCK_USER_CONTEXTS: Record<string, { name: string; contexts: AccountContext[] }> = {
  'partner@demo.com': {
    name: 'John Smith',
    contexts: [
      {
        id: 'ctx-1',
        partnerId: 'page-financials',
        partnerName: 'Page Financials',
        partnerLogoUrl: undefined,
        partnerBrandColor: '215 25% 50%',
        role: 'partner_admin',
        roleLabel: 'Partner Admin',
      },
    ],
  },
  'staff@demo.com': {
    name: 'Sarah Johnson',
    contexts: [
      {
        id: 'ctx-2',
        partnerId: 'page-financials',
        partnerName: 'Page Financials',
        partnerLogoUrl: undefined,
        partnerBrandColor: '215 25% 50%',
        role: 'partner_staff',
        roleLabel: 'Partner Staff',
      },
    ],
  },
  'agent@demo.com': {
    name: 'Michael Brown',
    contexts: [
      {
        id: 'ctx-3',
        partnerId: 'page-financials',
        partnerName: 'Page Financials',
        partnerLogoUrl: undefined,
        partnerBrandColor: '215 25% 50%',
        role: 'agent',
        roleLabel: 'Agent',
        helperText: '5 terminals',
        kycStatus: 'approved' as KycStatus,
      },
    ],
  },
  // Multi-context user for demo
  'multi@demo.com': {
    name: 'Alex Thompson',
    contexts: [
      {
        id: 'ctx-4',
        partnerId: 'page-financials',
        partnerName: 'Page Financials',
        partnerLogoUrl: undefined,
        partnerBrandColor: '215 25% 50%',
        role: 'partner_admin',
        roleLabel: 'Partner Admin',
      },
      {
        id: 'ctx-5',
        partnerId: 'quickpay-ng',
        partnerName: 'QuickPay Nigeria',
        partnerLogoUrl: undefined,
        partnerBrandColor: '142 76% 36%',
        role: 'partner_staff',
        roleLabel: 'Partner Staff',
      },
      {
        id: 'ctx-6',
        partnerId: 'fintech-solutions',
        partnerName: 'Fintech Solutions',
        partnerLogoUrl: undefined,
        partnerBrandColor: '262 83% 58%',
        role: 'agent',
        roleLabel: 'Agent',
        helperText: '12 terminals',
        kycStatus: 'approved' as KycStatus,
      },
    ],
  },
  // Mock Agent #1 - Pending Onboarding (KYC wizard flow)
  'newagent@demo.com': {
    name: 'Peter Okonkwo',
    contexts: [
      {
        id: 'ctx-7',
        partnerId: 'page-financials',
        partnerName: 'Page Financials',
        partnerLogoUrl: undefined,
        partnerBrandColor: '215 25% 50%',
        role: 'agent',
        roleLabel: 'Agent',
        helperText: 'Pending KYC',
        kycStatus: 'pending_onboarding' as KycStatus,
      },
    ],
  },
  // Mock Agent #2 - Pending Review (under review)
  'reviewagent@demo.com': {
    name: 'Grace Adeyemi',
    contexts: [
      {
        id: 'ctx-8',
        partnerId: 'page-financials',
        partnerName: 'Page Financials',
        partnerLogoUrl: undefined,
        partnerBrandColor: '215 25% 50%',
        role: 'agent',
        roleLabel: 'Agent',
        helperText: 'Under Review',
        kycStatus: 'pending_review' as KycStatus,
      },
    ],
  },
  // Mock Agent #3 - Rejected
  'rejectedagent@demo.com': {
    name: 'Samuel Adewale',
    contexts: [
      {
        id: 'ctx-9',
        partnerId: 'page-financials',
        partnerName: 'Page Financials',
        partnerLogoUrl: undefined,
        partnerBrandColor: '215 25% 50%',
        role: 'agent',
        roleLabel: 'Agent',
        kycStatus: 'rejected' as KycStatus,
      },
    ],
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingContexts, setPendingContexts] = useState<AccountContext[] | null>(null);
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const [authenticatedName, setAuthenticatedName] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('xtrapay_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Apply brand color to CSS variables
  useEffect(() => {
    if (user?.partner?.brand_color) {
      document.documentElement.style.setProperty('--brand', user.partner.brand_color);
    } else {
      document.documentElement.style.setProperty('--brand', '215 25% 50%');
    }
  }, [user?.partner?.brand_color]);

  const authenticate = useCallback(async (email: string, password: string, accountType: 'partner' | 'agent'): Promise<AccountContext[]> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUserData = MOCK_USER_CONTEXTS[email.toLowerCase()];
    
    if (!mockUserData) {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }

    // Filter contexts by account type
    const filteredContexts = mockUserData.contexts.filter(ctx => {
      if (accountType === 'agent') {
        return ctx.role === 'agent';
      } else {
        return ctx.role === 'partner_admin' || ctx.role === 'partner_staff';
      }
    });

    if (filteredContexts.length === 0) {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }

    // Store authenticated email and name for context selection
    setAuthenticatedEmail(email.toLowerCase());
    setAuthenticatedName(mockUserData.name);
    setPendingContexts(filteredContexts);
    setIsLoading(false);

    return filteredContexts;
  }, []);

  const selectContext = useCallback((context: AccountContext) => {
    if (!authenticatedEmail || !authenticatedName) {
      throw new Error('Not authenticated');
    }

    const newUser: User = {
      id: context.id,
      email: authenticatedEmail,
      name: authenticatedName,
      role: context.role,
      permissions: ROLE_PERMISSIONS[context.role],
      partner: {
        id: context.partnerId,
        name: context.partnerName,
        logo_url: context.partnerLogoUrl,
        brand_color: context.partnerBrandColor,
      },
      kycStatus: context.kycStatus,
    };

    setUser(newUser);
    setPendingContexts(null);
    setAuthenticatedEmail(null);
    setAuthenticatedName(null);
    localStorage.setItem('xtrapay_user', JSON.stringify(newUser));
  }, [authenticatedEmail, authenticatedName]);

  const logout = useCallback(() => {
    setUser(null);
    setPendingContexts(null);
    setAuthenticatedEmail(null);
    setAuthenticatedName(null);
    localStorage.removeItem('xtrapay_user');
  }, []);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);

  const partner = user?.partner || DEFAULT_PARTNER;

  return (
    <AuthContext.Provider
      value={{
        user,
        partner,
        isAuthenticated: !!user,
        isLoading,
        pendingContexts,
        authenticate,
        selectContext,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
