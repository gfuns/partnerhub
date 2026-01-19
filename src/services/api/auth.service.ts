import apiService from '../ApiService';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

export interface Partner {
  id: number;
  name: string;
  logo_url: string | null;
  code: string;
  kyc_status?: string;
}

export interface Agent {
  id: number;
  business_name: string;
  code: string;
  kyc_status?: string;
}

export interface Context {
  id: number;
  role: string;
  role_label: string;
  is_primary: boolean;
  partner: Partner | null;
  agent: Agent | null;
  permissions?: string[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    login_type: 'partner' | 'agent';
    kyc_status?: string;
    contexts: Context[];
    selected_context: CurrentContext | null;
    requires_password_change: boolean;
    requires_context_selection: boolean;
    requires_kyc_onboarding?: boolean;
    partner_data?: Record<string, any>; // Partner branding and settings data
    token: string;
    token_expires_at: string;
  };
}

export interface SelectContextRequest {
  context_id: number;
}

export interface SelectContextResponse {
  success: boolean;
  message: string;
  data: {
    context: CurrentContext;
    kyc_status?: string;
    requires_kyc_onboarding?: boolean;
  };
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface CurrentContext {
  id: number;
  role: string;
  role_label: string;
  is_primary: boolean;
  partner: Partner | null;
  agent: Agent | null;
  permissions: string[];
}

export interface ProfileResponse {
  success: boolean;
  data: {
    user: User;
    contexts: Context[];
    current_context: CurrentContext | null;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    expires_at: string;
  };
}

class AuthService {
  /**
   * Login with email and password
   * @param credentials - Email and password
   * @param loginType - 'partner' or 'agent' to determine which hub to authenticate against
   */
  async login(credentials: LoginRequest, loginType: 'partner' | 'agent' = 'partner'): Promise<LoginResponse> {
    // Store login type BEFORE making the request so getApiPrefix() can use it
    localStorage.setItem('login_type', loginType);
    // Determine subdomain from current host and include as query param when present
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const hostParts = host.split('.').filter(Boolean);
    let subdomain = '';
    if (hostParts.length >= 3) {
      subdomain = hostParts[0];
    }

    const loginUrl = subdomain ? `/login?subdomain=${encodeURIComponent(subdomain)}` : '/login';

    const response = await apiService.post<LoginResponse>(loginUrl, credentials);
    
    // Store token
    if (response.data.token) {
      apiService.setToken(response.data.token);
      // Update login type from response (in case backend returns different value)
      localStorage.setItem('login_type', response.data.login_type);
    }
    
    return response;
  }

  /**
   * Logout current session
   */
  async logout(): Promise<void> {
    try {
      await apiService.post('/logout');
    } finally {
      apiService.clearTokens();
      localStorage.removeItem('login_type');
    }
  }

  /**
   * Logout all sessions
   */
  async logoutAll(): Promise<void> {
    try {
      await apiService.post('/logout-all');
    } finally {
      apiService.clearTokens();
    }
  }

  /**
   * Select partner/agent context
   */
  async selectContext(data: SelectContextRequest): Promise<SelectContextResponse> {
    return apiService.post<SelectContextResponse>('/select-context', data);
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<any> {
    return apiService.post('/change-password', data);
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ProfileResponse> {
    return apiService.get('/profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
    return apiService.put<ProfileResponse>('/profile', data);
  }

  /**
   * Refresh token to extend session
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    return apiService.post<RefreshTokenResponse>('/refresh-token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!apiService.getToken();
  }
}

export const authService = new AuthService();
export default authService;
