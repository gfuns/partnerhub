import apiService from '../ApiService';

// Profile interfaces
export interface PartnerProfile {
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
}

export interface KycProfile {
  id: number;
  business_category: string;
  business_category_label: string;
  data: Record<string, any>;
  submitted_at: string | null;
}

export interface KycDocument {
  id: number;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
  uploaded_at: string;
}

export interface KycReview {
  id: number;
  decision: string;
  decision_label: string;
  remarks: string | null;
  reviewer: {
    id: number;
    name: string;
  };
  reviewed_at: string;
}

export interface HubSettings {
  hub_enabled: boolean;
  hub_url: string | null;
  agent_self_registration: boolean;
}

export interface WebhookSettings {
  webhook_url: string | null;
  has_webhook_secret: boolean;
}

export interface BrandingSettings {
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  primary_dark_color: string;
  primary_light_color: string;
  secondary_color: string;
  accent_color: string;
  sidebar_bg_color: string;
  sidebar_text_color: string;
  sidebar_active_bg_color: string;
  sidebar_active_text_color: string;
  sidebar_hover_bg_color: string;
  sidebar_logo_bg_color: string | null;
  header_bg_color: string;
  header_text_color: string;
  btn_primary_bg_color: string;
  btn_primary_text_color: string;
  btn_primary_hover_bg_color: string;
  btn_secondary_bg_color: string;
  btn_secondary_text_color: string;
  card_bg_color: string;
  card_border_color: string;
  body_bg_color: string;
  text_primary_color: string;
  text_secondary_color: string;
  text_muted_color: string;
  link_color: string;
  link_hover_color: string;
  success_color: string;
  warning_color: string;
  danger_color: string;
  info_color: string;
  border_color: string;
  border_radius: string;
  box_shadow: string;
  font_family: string;
  font_size_base: string;
  heading_font_family: string | null;
  custom_css: string | null;
  login_bg_color: string;
  login_bg_image_url: string | null;
  login_card_bg_color: string;
  login_welcome_message: string;
  footer_text: string;
  footer_bg_color: string;
  footer_text_color: string;
  dark_mode_enabled: boolean;
  dark_mode_bg_color: string;
  dark_mode_card_bg_color: string;
  dark_mode_text_color: string;
  is_active: boolean;
}

export interface PartnerStatistics {
  total_agents: number;
  approved_agents: number;
  total_terminals: number;
  total_documents: number;
  total_reviews: number;
}

export interface SettingsData {
  profile: PartnerProfile;
  kyc_profile: KycProfile | null;
  kyc_documents: KycDocument[];
  latest_kyc_review: KycReview | null;
  hub_settings: HubSettings;
  webhook: WebhookSettings;
  branding: BrandingSettings;
  settings: Record<string, any>;
  statistics: PartnerStatistics;
}

export interface SettingsResponse {
  status: string;
  data: SettingsData;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
}

export interface UpdateProfileResponse {
  status: string;
  message: string;
  data: {
    partner: PartnerProfile;
    locked_fields: string[];
  };
}

export interface BrandingResponse {
  status: string;
  data: {
    branding: BrandingSettings;
    has_custom_branding: boolean;
    defaults: Partial<BrandingSettings>;
  };
}

export interface UpdateBrandingRequest {
  primary_color?: string;
  primary_dark_color?: string;
  primary_light_color?: string;
  secondary_color?: string;
  accent_color?: string;
  sidebar_bg_color?: string;
  sidebar_text_color?: string;
  sidebar_active_bg_color?: string;
  sidebar_active_text_color?: string;
  sidebar_hover_bg_color?: string;
  sidebar_logo_bg_color?: string;
  header_bg_color?: string;
  header_text_color?: string;
  btn_primary_bg_color?: string;
  btn_primary_text_color?: string;
  btn_primary_hover_bg_color?: string;
  btn_secondary_bg_color?: string;
  btn_secondary_text_color?: string;
  card_bg_color?: string;
  card_border_color?: string;
  body_bg_color?: string;
  text_primary_color?: string;
  text_secondary_color?: string;
  text_muted_color?: string;
  link_color?: string;
  link_hover_color?: string;
  success_color?: string;
  warning_color?: string;
  danger_color?: string;
  info_color?: string;
  border_color?: string;
  border_radius?: string;
  box_shadow?: string;
  font_family?: string;
  font_size_base?: string;
  heading_font_family?: string;
  custom_css?: string;
  login_bg_color?: string;
  login_card_bg_color?: string;
  login_welcome_message?: string;
  footer_text?: string;
  footer_bg_color?: string;
  footer_text_color?: string;
  dark_mode_enabled?: boolean;
  dark_mode_bg_color?: string;
  dark_mode_card_bg_color?: string;
  dark_mode_text_color?: string;
  is_active?: boolean;
}

export interface UpdateBrandingResponse {
  status: string;
  message: string;
  data: {
    branding: BrandingSettings;
  };
}

export interface BrandingCssResponse {
  status: string;
  data: {
    css: string;
  };
}

export interface UploadBrandingImagesResponse {
  status: string;
  message: string;
  data: {
    branding: BrandingSettings;
  };
}

// Audit Log interfaces
export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  [key: string]: any;
}

export interface AuditLogParams {
  page?: number;
  per_page?: number;
  action?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface AuditLogResponse {
  success: boolean;
  data: AuditLog[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface AuditLogActionsResponse {
  success: boolean;
  data: Array<{
    action: string;
    description: string;
  }>;
}

class SettingsService {
  /**
   * Get all settings
   */
  async getSettings(): Promise<SettingsResponse> {
    return apiService.get('/settings');
  }

  /**
   * Update partner profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    return apiService.put('/settings/profile', data);
  }

  /**
   * Get branding settings
   */
  async getBranding(): Promise<BrandingResponse> {
    return apiService.get('/settings/branding');
  }

  /**
   * Update branding settings
   */
  async updateBranding(data: UpdateBrandingRequest): Promise<UpdateBrandingResponse> {
    return apiService.put('/settings/branding', data);
  }

  /**
   * Upload branding images (logo, logo_dark, favicon, login_bg_image)
   */
  async uploadBrandingImages(files: {
    logo?: File;
    logo_dark?: File;
    favicon?: File;
    login_bg_image?: File;
  }): Promise<UploadBrandingImagesResponse> {
    const formData = new FormData();
    if (files.logo) formData.append('logo', files.logo);
    if (files.logo_dark) formData.append('logo_dark', files.logo_dark);
    if (files.favicon) formData.append('favicon', files.favicon);
    if (files.login_bg_image) formData.append('login_bg_image', files.login_bg_image);

    return apiService.postMultipart('/settings/branding/images', formData);
  }

  /**
   * Reset branding to defaults
   */
  async resetBranding(): Promise<UpdateBrandingResponse> {
    return apiService.delete('/settings/branding');
  }

  /**
   * Get branding CSS variables
   */
  async getBrandingCss(): Promise<BrandingCssResponse> {
    return apiService.get('/settings/branding/css');
  }

  /**
   * View audit logs
   */
  async getAuditLogs(params?: AuditLogParams): Promise<AuditLogResponse> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.get(`/settings/audit-logs${queryString}`);
  }

  /**
   * List available log actions
   */
  async getAuditLogActions(): Promise<AuditLogActionsResponse> {
    return apiService.get('/settings/audit-logs/actions');
  }
}

export const settingsService = new SettingsService();
export default settingsService;
