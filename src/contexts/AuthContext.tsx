import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { KycStatus } from '@/types/kyc';
import { authService, ApiContext, ApiUser, ApiPartner, ApiAgent, ApiCurrentContext } from '@/services/api';
import { toast } from 'sonner';
import { BrandingSettings, DEFAULT_BRANDING, getAssetUrl } from './BrandingContext';

export type UserRole = 'partner_admin' | 'partner_staff' | 'agent';

// Partner data from login response
export interface PartnerData {
  profile: {
    id: number;
    code: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    description: string | null;
    logo_url: string | null;
    status: number;
    status_label: string;
    kyc_status: string;
    kyc_status_label: string;
    requires_kyc_onboarding: boolean;
    is_kyc_approved: boolean;
    can_onboard_agents: boolean;
    can_assign_terminals: boolean;
    created_at: string;
  };
  kyc_profile: {
    id: number;
    business_category: string;
    business_category_label: string;
    data: Record<string, any>;
    submitted_at: string | null;
  } | null;
  kyc_documents: Array<{
    id: number;
    document_type: string;
    file_name: string | null;
    file_url: string;
    status: string;
    uploaded_at: string;
  }>;
  latest_kyc_review: {
    id: number;
    decision: string;
    decision_label: string;
    remarks: string | null;
    reviewer: {
      id: number;
      name: string | null;
    };
    reviewed_at: string;
  } | null;
  hub_settings: {
    hub_enabled: boolean;
    hub_url: string | null;
    agent_self_registration: boolean;
  };
  branding: BrandingSettings;
  settings: Record<string, any>;
  statistics: {
    total_agents: number;
    approved_agents: number;
    total_terminals: number;
    total_documents: number;
    total_reviews: number;
  };
}

export interface Partner {
  id: number;
  name: string;
  logo_url?: string;
  brand_color?: string;
  code: string;
}

export interface AccountContext {
  id: number;
  type: 'partner' | 'agent';
  entityId: number;
  entityName: string;
  role: string;
  roleLabel: string;
  permissions?: string[];
  isPrimary: boolean;
  // Display properties for UI
  partnerName?: string;
  partnerLogoUrl?: string;
  partnerBrandColor?: string;
  helperText?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  permissions: string[];
  mustChangePassword: boolean;
  loginType?: 'partner' | 'agent';
  partner?: Partner;
  currentContext?: AccountContext;
  requiresKycOnboarding?: boolean;
  kycStatus?: string;
}

export interface AuthState {
  requiresPasswordChange: boolean;
  requiresContextSelection: boolean;
  requiresKycOnboarding: boolean;
}

interface AuthContextType {
  user: User | null;
  partner: Partner | null;
  partnerData: PartnerData | null;
  branding: BrandingSettings;
  authState: AuthState;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingContexts: AccountContext[] | null;
  authenticate: (email: string, password: string, loginType?: 'partner' | 'agent') => Promise<{ 
    success: boolean; 
    requiresPasswordChange: boolean; 
    requiresContextSelection: boolean;
    requiresKycOnboarding: boolean;
    contexts?: AccountContext[];
  }>;
  selectContext: (contextId: number) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutRedirectPath: string;
  hasPermission: (permission: string) => boolean;
  updateKycStatus: (newStatus: string, requiresOnboarding: boolean) => void;
  getAssetUrl: (path: string | null | undefined) => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default Xtrapay branding
const DEFAULT_PARTNER: Partner = {
  id: 0,
  name: 'Xtrapay',
  logo_url: undefined,
  brand_color: undefined,
  code: 'XTRAPAY',
};

/**
 * Apply branding CSS variables to the document
 */
function applyBrandingToDocument(branding: BrandingSettings) {
  const root = document.documentElement;
  
  // Primary colors
  root.style.setProperty('--brand-primary', branding.primary_color);
  root.style.setProperty('--brand-primary-dark', branding.primary_dark_color);
  root.style.setProperty('--brand-primary-light', branding.primary_light_color);
  root.style.setProperty('--brand-secondary', branding.secondary_color);
  root.style.setProperty('--brand-accent', branding.accent_color);
  
  // Sidebar colors
  root.style.setProperty('--brand-sidebar-bg', branding.sidebar_bg_color);
  root.style.setProperty('--brand-sidebar-text', branding.sidebar_text_color);
  root.style.setProperty('--brand-sidebar-active-bg', branding.sidebar_active_bg_color);
  root.style.setProperty('--brand-sidebar-active-text', branding.sidebar_active_text_color);
  root.style.setProperty('--brand-sidebar-hover-bg', branding.sidebar_hover_bg_color);
  if (branding.sidebar_logo_bg_color) {
    root.style.setProperty('--brand-sidebar-logo-bg', branding.sidebar_logo_bg_color);
  }
  
  // Header colors
  root.style.setProperty('--brand-header-bg', branding.header_bg_color);
  root.style.setProperty('--brand-header-text', branding.header_text_color);
  
  // Button colors
  root.style.setProperty('--brand-btn-primary-bg', branding.btn_primary_bg_color);
  root.style.setProperty('--brand-btn-primary-text', branding.btn_primary_text_color);
  root.style.setProperty('--brand-btn-primary-hover', branding.btn_primary_hover_bg_color);
  root.style.setProperty('--brand-btn-secondary-bg', branding.btn_secondary_bg_color);
  root.style.setProperty('--brand-btn-secondary-text', branding.btn_secondary_text_color);
  
  // Card colors
  root.style.setProperty('--brand-card-bg', branding.card_bg_color);
  root.style.setProperty('--brand-card-border', branding.card_border_color);
  
  // Body colors
  root.style.setProperty('--brand-body-bg', branding.body_bg_color);
  
  // Text colors
  root.style.setProperty('--brand-text-primary', branding.text_primary_color);
  root.style.setProperty('--brand-text-secondary', branding.text_secondary_color);
  root.style.setProperty('--brand-text-muted', branding.text_muted_color);
  
  // Link colors
  root.style.setProperty('--brand-link', branding.link_color);
  root.style.setProperty('--brand-link-hover', branding.link_hover_color);
  
  // Status colors
  root.style.setProperty('--brand-success', branding.success_color);
  root.style.setProperty('--brand-warning', branding.warning_color);
  root.style.setProperty('--brand-danger', branding.danger_color);
  root.style.setProperty('--brand-info', branding.info_color);
  
  // Border and styling
  root.style.setProperty('--brand-border', branding.border_color);
  root.style.setProperty('--brand-border-radius', branding.border_radius);
  root.style.setProperty('--brand-box-shadow', branding.box_shadow);
  
  // Typography
  root.style.setProperty('--brand-font-family', branding.font_family);
  root.style.setProperty('--brand-font-size', branding.font_size_base);
  if (branding.heading_font_family) {
    root.style.setProperty('--brand-heading-font', branding.heading_font_family);
  }
  
  // Login colors
  root.style.setProperty('--brand-login-bg', branding.login_bg_color);
  root.style.setProperty('--brand-login-card-bg', branding.login_card_bg_color);
  
  // Footer colors
  root.style.setProperty('--brand-footer-bg', branding.footer_bg_color);
  root.style.setProperty('--brand-footer-text', branding.footer_text_color);
  
  // Dark mode colors
  root.style.setProperty('--brand-dark-bg', branding.dark_mode_bg_color);
  root.style.setProperty('--brand-dark-card-bg', branding.dark_mode_card_bg_color);
  root.style.setProperty('--brand-dark-text', branding.dark_mode_text_color);
  
  // Apply custom CSS if provided
  let customStyleEl = document.getElementById('partner-custom-css');
  if (branding.custom_css) {
    if (!customStyleEl) {
      customStyleEl = document.createElement('style');
      customStyleEl.id = 'partner-custom-css';
      document.head.appendChild(customStyleEl);
    }
    customStyleEl.textContent = branding.custom_css;
  } else if (customStyleEl) {
    customStyleEl.remove();
  }
  
  // Update favicon if provided
  if (branding.favicon_url) {
    const faviconUrl = getAssetUrl(branding.favicon_url);
    if (faviconUrl) {
      let faviconEl = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!faviconEl) {
        faviconEl = document.createElement('link');
        faviconEl.rel = 'icon';
        document.head.appendChild(faviconEl);
      }
      faviconEl.href = faviconUrl;
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingContexts, setPendingContexts] = useState<AccountContext[] | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    requiresPasswordChange: false,
    requiresContextSelection: false,
    requiresKycOnboarding: false,
  });

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('xtrapay_user');
    const storedAuthState = localStorage.getItem('xtrapay_auth_state');
    const storedPartnerData = localStorage.getItem('xtrapay_partner_data');
    const storedBranding = localStorage.getItem('xtrapay_branding');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedAuthState) {
      setAuthState(JSON.parse(storedAuthState));
    }
    if (storedPartnerData) {
      setPartnerData(JSON.parse(storedPartnerData));
    }
    if (storedBranding) {
      const parsedBranding = { ...DEFAULT_BRANDING, ...JSON.parse(storedBranding) };
      setBranding(parsedBranding);
      applyBrandingToDocument(parsedBranding);
    }
    setIsLoading(false);

    // Listen for auto-logout events from ApiService
    const handleAutoLogout = (event: CustomEvent) => {
      console.log('Auto logout triggered:', event.detail.reason);
      toast.error('Your session has expired. Please login again.');
      logout();
    };

    window.addEventListener('auth:logout', handleAutoLogout as EventListener);

    return () => {
      window.removeEventListener('auth:logout', handleAutoLogout as EventListener);
    };
  }, []);

  /**
   * Helper function to store partner data and apply branding
   */
  const storePartnerDataAndBranding = (data: PartnerData | null) => {
    if (data) {
      setPartnerData(data);
      localStorage.setItem('xtrapay_partner_data', JSON.stringify(data));
      
      if (data.branding) {
        const newBranding = { ...DEFAULT_BRANDING, ...data.branding };
        setBranding(newBranding);
        localStorage.setItem('xtrapay_branding', JSON.stringify(newBranding));
        applyBrandingToDocument(newBranding);
      }
    }
  };

  /**
   * Helper function to convert API context to AccountContext
   */
  const convertApiContext = (apiContext: ApiContext | ApiCurrentContext): AccountContext => {
    // Determine type and entity info from partner or agent
    const isPartner = apiContext.partner !== null;
    const partner = apiContext.partner;
    const agent = apiContext.agent;
    
    return {
      id: apiContext.id,
      type: isPartner ? 'partner' : 'agent',
      entityId: isPartner ? partner?.id || 0 : agent?.id || 0,
      entityName: isPartner ? partner?.name || '' : agent?.business_name || '',
      role: apiContext.role,
      roleLabel: apiContext.role_label,
      permissions: apiContext.permissions || [],
      isPrimary: apiContext.is_primary,
      // Display properties for UI
      partnerName: isPartner ? partner?.name : agent?.business_name,
      partnerLogoUrl: partner?.logo_url || undefined,
      helperText: isPartner ? `Code: ${partner?.code}` : `Code: ${agent?.code}`,
    };
  };

  /**
   * Authenticate user with email and password
   */
  const authenticate = useCallback(async (email: string, password: string, loginType: 'partner' | 'agent' = 'partner') => {
    setIsLoading(true);
    
    try {
      const response = await authService.login({ email, password }, loginType);      

      // Persist login type so post-logout redirects work even after user is cleared
      localStorage.setItem('xtrapay_login_type', response.data.login_type || loginType);

      const { user: apiUser, contexts, selected_context, requires_password_change, requires_context_selection, requires_kyc_onboarding, token, partner_data } = response.data;

      // Store partner_data and apply branding if available
      if (partner_data) {
        storePartnerDataAndBranding(partner_data as PartnerData);
      }

      // Check if password change is required
      // Still store full user data including permissions and context for after password change
      if (requires_password_change) {
        // Build full user data even for password change flow
        let fullUser: User;
        
        if (selected_context) {
          const accountContext = convertApiContext(selected_context);
          
          // Determine partner info
          let partnerInfo: Partner | undefined;
          if (selected_context.partner) {
            partnerInfo = {
              id: selected_context.partner.id,
              name: selected_context.partner.name,
              logo_url: selected_context.partner.logo_url || undefined,
              code: selected_context.partner.code,
            };
          }
          
          // Get KYC status
          let kycStatus: string | undefined;
          if (response.data.login_type === 'agent') {
            kycStatus = selected_context.agent?.kyc_status;
          } else if (response.data.login_type === 'partner') {
            kycStatus = response.data.kyc_status || selected_context.partner?.kyc_status;
          }
          
          fullUser = {
            id: apiUser.id,
            email: apiUser.email,
            firstName: apiUser.first_name,
            lastName: apiUser.last_name,
            phone: apiUser.phone,
            avatarUrl: apiUser.avatar_url,
            role: accountContext.role,
            permissions: selected_context.permissions || [],
            mustChangePassword: true,
            loginType: response.data.login_type,
            partner: partnerInfo,
            currentContext: accountContext,
            requiresKycOnboarding: requires_kyc_onboarding,
            kycStatus: kycStatus,
          };
        } else {
          // No selected context yet - minimal user
          fullUser = {
            id: apiUser.id,
            email: apiUser.email,
            firstName: apiUser.first_name,
            lastName: apiUser.last_name,
            phone: apiUser.phone,
            avatarUrl: apiUser.avatar_url,
            role: '',
            permissions: [],
            mustChangePassword: true,
            loginType: response.data.login_type,
            requiresKycOnboarding: requires_kyc_onboarding,
          };
        }
        
        setUser(fullUser);
        setAuthState({
          requiresPasswordChange: true,
          requiresContextSelection: false,
          requiresKycOnboarding: requires_kyc_onboarding || false,
        });
        
        localStorage.setItem('xtrapay_user', JSON.stringify(fullUser));
        localStorage.setItem('xtrapay_auth_state', JSON.stringify({
          requiresPasswordChange: true,
          requiresContextSelection: false,
          requiresKycOnboarding: requires_kyc_onboarding || false,
        }));
        
        setIsLoading(false);
        return {
          success: true,
          requiresPasswordChange: true,
          requiresContextSelection: false,
          requiresKycOnboarding: requires_kyc_onboarding || false,
        };
      }

      // Check if context selection is required (multiple contexts)
      if (requires_context_selection && !selected_context) {
        const accountContexts = contexts.map(convertApiContext);
        
        const tempUser: User = {
          id: apiUser.id,
          email: apiUser.email,
          firstName: apiUser.first_name,
          lastName: apiUser.last_name,
          phone: apiUser.phone,
          avatarUrl: apiUser.avatar_url,
          role: '',
          permissions: [],
          mustChangePassword: false,
          loginType: response.data.login_type,
        };
        
        setUser(tempUser);
        setPendingContexts(accountContexts);
        setAuthState({
          requiresPasswordChange: false,
          requiresContextSelection: true,
          requiresKycOnboarding: false,
        });
        
        localStorage.setItem('xtrapay_user', JSON.stringify(tempUser));
        localStorage.setItem('xtrapay_auth_state', JSON.stringify({
          requiresPasswordChange: false,
          requiresContextSelection: true,
          requiresKycOnboarding: false,
        }));
        
        setIsLoading(false);
        return {
          success: true,
          requiresPasswordChange: false,
          requiresContextSelection: true,
          requiresKycOnboarding: false,
          contexts: accountContexts,
        };
      }

      // If context is already selected (single context or auto-selected), use it
      if (selected_context) {
        const accountContext = convertApiContext(selected_context);
        
        // Determine partner info
        let partnerInfo: Partner | undefined;
        if (selected_context.partner) {
          partnerInfo = {
            id: selected_context.partner.id,
            name: selected_context.partner.name,
            logo_url: selected_context.partner.logo_url || undefined,
            code: selected_context.partner.code,
          };
        }
        
        // Get KYC status: for agents from agent object, for partners from partner object or root level
        let kycStatus: string | undefined;
        if (response.data.login_type === 'agent') {
          kycStatus = selected_context.agent?.kyc_status;
        } else if (response.data.login_type === 'partner') {
          // For partners, use root level kyc_status or partner's kyc_status
          kycStatus = response.data.kyc_status || selected_context.partner?.kyc_status;
        }
        
        const newUser: User = {
          id: apiUser.id,
          email: apiUser.email,
          firstName: apiUser.first_name,
          lastName: apiUser.last_name,
          phone: apiUser.phone,
          avatarUrl: apiUser.avatar_url,
          role: accountContext.role,
          permissions: selected_context.permissions || [],
          mustChangePassword: false,
          loginType: response.data.login_type,
          partner: partnerInfo,
          currentContext: accountContext,
          requiresKycOnboarding: requires_kyc_onboarding,
          kycStatus: kycStatus,
        };
        
        setUser(newUser);
        setAuthState({
          requiresPasswordChange: false,
          requiresContextSelection: false,
          requiresKycOnboarding: requires_kyc_onboarding || false,
        });
        
        localStorage.setItem('xtrapay_user', JSON.stringify(newUser));
        localStorage.setItem('xtrapay_auth_state', JSON.stringify({
          requiresPasswordChange: false,
          requiresContextSelection: false,
          requiresKycOnboarding: requires_kyc_onboarding || false,
        }));
        
        setIsLoading(false);
        return {
          success: true,
          requiresPasswordChange: false,
          requiresContextSelection: false,
          requiresKycOnboarding: requires_kyc_onboarding || false,
        };
      }

      throw new Error('No context available for user');
    } catch (error: any) {
      setIsLoading(false);
      console.error('Authentication error:', error);
      // Error is now the formatted ApiError object from ApiService.handleError()
      // It has: { message: string, errors?: Record<string, string[]>, status?: number }
      throw error;
    }
  }, []);

  /**
   * Select context after authentication
   */
  const selectContext = useCallback(async (contextId: number) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await authService.selectContext({ context_id: contextId });
      const apiContext = response.data.context;
      const accountContext = convertApiContext(apiContext);

      // Determine partner info
      let partnerInfo: Partner | undefined;
      if (apiContext.partner) {
        partnerInfo = {
          id: apiContext.partner.id,
          name: apiContext.partner.name,
          logo_url: apiContext.partner.logo_url || undefined,
          code: apiContext.partner.code,
        };
      }

      // Get KYC status based on login type
      let kycStatus: string | undefined;
      const requires_kyc_onboarding = response.data.requires_kyc_onboarding || false;
      
      if (user.loginType === 'agent') {
        kycStatus = apiContext.agent?.kyc_status;
      } else if (user.loginType === 'partner') {
        kycStatus = response.data.kyc_status || apiContext.partner?.kyc_status;
      }

      const updatedUser: User = {
        ...user,
        role: accountContext.role,
        permissions: accountContext.permissions || [],
        mustChangePassword: false,
        partner: partnerInfo,
        currentContext: accountContext,
        requiresKycOnboarding: requires_kyc_onboarding,
        kycStatus: kycStatus,
      };

      setUser(updatedUser);
      setPendingContexts(null);
      setAuthState({
        requiresPasswordChange: false,
        requiresContextSelection: false,
        requiresKycOnboarding: requires_kyc_onboarding,
      });
      
      localStorage.setItem('xtrapay_user', JSON.stringify(updatedUser));
      localStorage.setItem('xtrapay_auth_state', JSON.stringify({
        requiresPasswordChange: false,
        requiresContextSelection: false,
        requiresKycOnboarding: requires_kyc_onboarding,
      }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to select context');
      throw error;
    }
  }, [user]);

  /**
   * Change password (required for must_change_password users)
   */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string, confirmation: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmation,
      });

      // Update user state to remove password change requirement
      const updatedUser: User = {
        ...user,
        mustChangePassword: false,
      };

      setUser(updatedUser);
      setAuthState({
        ...authState,
        requiresPasswordChange: false,
      });
      
      localStorage.setItem('xtrapay_user', JSON.stringify(updatedUser));
      localStorage.setItem('xtrapay_auth_state', JSON.stringify({
        ...authState,
        requiresPasswordChange: false,
      }));

      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
      throw error;
    }
  }, [user, authState]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setPendingContexts(null);
      setPartnerData(null);
      setBranding(DEFAULT_BRANDING);
      setAuthState({
        requiresPasswordChange: false,
        requiresContextSelection: false,
        requiresKycOnboarding: false,
      });
      localStorage.removeItem('xtrapay_user');
      localStorage.removeItem('xtrapay_auth_state');
      localStorage.removeItem('xtrapay_partner_data');
      localStorage.removeItem('xtrapay_branding');
      
      // Reset branding to defaults
      applyBrandingToDocument(DEFAULT_BRANDING);
    }
  }, []);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);

  const updateKycStatus = useCallback((newStatus: string, requiresOnboarding: boolean) => {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      kycStatus: newStatus,
      requiresKycOnboarding: requiresOnboarding,
    };

    const updatedAuthState: AuthState = {
      ...authState,
      requiresKycOnboarding: requiresOnboarding,
    };

    setUser(updatedUser);
    setAuthState(updatedAuthState);

    // Update localStorage
    localStorage.setItem('xtrapay_user', JSON.stringify(updatedUser));
    localStorage.setItem('xtrapay_auth_state', JSON.stringify(updatedAuthState));
  }, [user, authState]);

  const partner = user?.partner || DEFAULT_PARTNER;

  return (
    <AuthContext.Provider
      value={{
        user,
        partner,
        partnerData,
        branding,
        authState,
        isAuthenticated: !!user && !authState.requiresPasswordChange,
        isLoading,
        pendingContexts,
        authenticate,
        selectContext,
        changePassword,
        logout,
        logoutRedirectPath: user?.loginType === 'partner'
          ? '/partner'
          : (typeof window !== 'undefined' && localStorage.getItem('xtrapay_login_type') === 'partner' ? '/partner' : '/login'),
        hasPermission,
        updateKycStatus,
        getAssetUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('useAuth called outside AuthProvider — returning fallback context');
    const fallback: AuthContextType = {
      user: null,
      partner: DEFAULT_PARTNER,
      partnerData: null,
      branding: DEFAULT_BRANDING,
      authState: { requiresPasswordChange: false, requiresContextSelection: false, requiresKycOnboarding: false },
      isAuthenticated: false,
      isLoading: true,
      pendingContexts: null,
      authenticate: async () => { throw new Error('No AuthProvider available'); },
      selectContext: async () => { throw new Error('No AuthProvider available'); },
      changePassword: async () => { throw new Error('No AuthProvider available'); },
      logout: async () => {},
      logoutRedirectPath: '/login',
      hasPermission: () => false,
      updateKycStatus: () => {},
      getAssetUrl: getAssetUrl,
    };
    return fallback;
  }
  return context;
}

// Re-export getAssetUrl for convenience
export { getAssetUrl } from './BrandingContext';
