import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type UserRole = 'partner_admin' | 'partner_staff' | 'agent';

export interface Partner {
  id: string;
  name: string;
  logo_url?: string;
  brand_color?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  partner?: Partner;
}

interface AuthContextType {
  user: User | null;
  partner: Partner | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, accountType: 'partner' | 'agent') => Promise<void>;
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

// Mock users for demo
const MOCK_USERS: Record<string, User> = {
  'partner@demo.com': {
    id: '1',
    email: 'partner@demo.com',
    name: 'John Smith',
    role: 'partner_admin',
    permissions: [
      'dashboard.view',
      'agents.view', 'agents.create', 'agents.edit', 'agents.disable',
      'terminals.view', 'terminals.create', 'terminals.assign', 'terminals.revoke',
      'transactions.view', 'transactions.export',
      'reports.view', 'reports.export',
      'monitoring.view',
      'users.view', 'users.create', 'users.edit', 'users.disable',
      'settings.view', 'settings.edit',
    ],
    partner: {
      id: 'page-financials',
      name: 'Page Financials',
      logo_url: undefined,
      brand_color: '215 25% 50%',
    },
  },
  'staff@demo.com': {
    id: '2',
    email: 'staff@demo.com',
    name: 'Sarah Johnson',
    role: 'partner_staff',
    permissions: [
      'dashboard.view',
      'agents.view',
      'terminals.view',
      'transactions.view',
      'reports.view',
      'monitoring.view',
    ],
    partner: {
      id: 'page-financials',
      name: 'Page Financials',
      logo_url: undefined,
      brand_color: '215 25% 50%',
    },
  },
  'agent@demo.com': {
    id: '3',
    email: 'agent@demo.com',
    name: 'Michael Brown',
    role: 'agent',
    permissions: [
      'dashboard.view',
      'my-terminals.view',
      'transactions.view',
      'settlements.view',
      'commissions.view',
      'profile.view', 'profile.edit',
    ],
    partner: {
      id: 'page-financials',
      name: 'Page Financials',
      logo_url: undefined,
      brand_color: '215 25% 50%',
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const login = useCallback(async (email: string, password: string, accountType: 'partner' | 'agent') => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = MOCK_USERS[email.toLowerCase()];
    
    if (!mockUser) {
      setIsLoading(false);
      throw new Error('Invalid credentials');
    }

    // Validate account type matches user role
    if (accountType === 'agent' && mockUser.role !== 'agent') {
      setIsLoading(false);
      throw new Error('Invalid account type for this user');
    }
    
    if (accountType === 'partner' && mockUser.role === 'agent') {
      setIsLoading(false);
      throw new Error('Invalid account type for this user');
    }

    setUser(mockUser);
    localStorage.setItem('xtrapay_user', JSON.stringify(mockUser));
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
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
        login,
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
