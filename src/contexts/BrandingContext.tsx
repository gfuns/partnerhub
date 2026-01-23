import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Branding interface matching the API response
export interface BrandingSettings {
  id?: number;
  partner_id?: number;
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
  heading_font_family?: string | null;
  custom_css?: string | null;
  login_bg_color: string;
  login_bg_image_url?: string | null;
  login_card_bg_color: string;
  login_welcome_message?: string | null;
  footer_text?: string | null;
  footer_bg_color: string;
  footer_text_color: string;
  dark_mode_enabled: boolean;
  dark_mode_bg_color: string;
  dark_mode_card_bg_color: string;
  dark_mode_text_color: string;
  is_active: boolean;
  // New branding keys for full dynamic styling
  icon_color: string;
  icon_active_color: string;
  icon_muted_color: string;
  icon_success_color: string;
  icon_warning_color: string;
  icon_danger_color: string;
  icon_info_color: string;
  card_shadow: string;
  card_header_bg_color: string;
  card_footer_bg_color: string;
  btn_secondary_hover_bg_color: string;
  btn_secondary_border_color: string;
  btn_disabled_bg_color: string;
  btn_disabled_text_color: string;
  table_header_bg_color: string;
  table_header_text_color: string;
  table_row_bg_color: string;
  table_row_alt_bg_color: string;
  table_row_hover_bg_color: string;
  table_border_color: string;
  input_bg_color: string;
  input_border_color: string;
  input_text_color: string;
  input_placeholder_color: string;
  input_focus_border_color: string;
  alert_success_bg_color: string;
  alert_success_text_color: string;
  alert_warning_bg_color: string;
  alert_warning_text_color: string;
  alert_danger_bg_color: string;
  alert_danger_text_color: string;
  alert_info_bg_color: string;
  alert_info_text_color: string;
  loader_color: string;
  divider_color: string;
  tooltip_bg_color: string;
  tooltip_text_color: string;
  progress_bar_color: string;
  switch_active_color: string;
  switch_bg_color: string;
  checkbox_active_color: string;
  checkbox_bg_color: string;
  stat_icon_color: string;
  stat_icon_bg_color: string;
  stat_icon_success_color: string;
  stat_icon_warning_color: string;
  stat_icon_danger_color: string;
  stat_icon_info_color: string;
}

// Default branding values (Xtrapay defaults)
export const DEFAULT_BRANDING: BrandingSettings = {
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  primary_color: '#6576ff',
  primary_dark_color: '#4a5bd9',
  primary_light_color: '#e0e4ff',
  secondary_color: '#364a63',
  accent_color: '#1ee0ac',
  sidebar_bg_color: '#1c2b46',
  sidebar_text_color: '#b7c2d0',
  sidebar_active_bg_color: '#101924',
  sidebar_active_text_color: '#ffffff',
  sidebar_hover_bg_color: '#253a57',
  sidebar_logo_bg_color: null,
  header_bg_color: '#ffffff',
  header_text_color: '#364a63',
  btn_primary_bg_color: '#6576ff',
  btn_primary_text_color: '#ffffff',
  btn_primary_hover_bg_color: '#5664d2',
  btn_secondary_bg_color: '#e5e9f2',
  btn_secondary_text_color: '#526484',
  card_bg_color: '#ffffff',
  card_border_color: '#e5e9f2',
  body_bg_color: '#f5f6fa',
  text_primary_color: '#364a63',
  text_secondary_color: '#8094ae',
  text_muted_color: '#b7c2d0',
  link_color: '#6576ff',
  link_hover_color: '#5664d2',
  success_color: '#1ee0ac',
  warning_color: '#f4bd0e',
  danger_color: '#e85347',
  info_color: '#09c2de',
  border_color: '#e5e9f2',
  border_radius: '4px',
  box_shadow: '0 1px 3px rgba(0,0,0,0.1)',
  font_family: 'Nunito, sans-serif',
  font_size_base: '14px',
  heading_font_family: null,
  custom_css: null,
  login_bg_color: '#f5f6fa',
  login_bg_image_url: null,
  login_card_bg_color: '#ffffff',
  login_welcome_message: null,
  footer_text: null,
  footer_bg_color: '#ffffff',
  footer_text_color: '#8094ae',
  dark_mode_enabled: false,
  dark_mode_bg_color: '#101924',
  dark_mode_card_bg_color: '#1c2b46',
  dark_mode_text_color: '#b7c2d0',
  is_active: true,
  // New branding keys (defaults)
  icon_color: '#364a63',
  icon_active_color: '#ff6600',
  icon_muted_color: '#b7c2d0',
  icon_success_color: '#1ee0ac',
  icon_warning_color: '#f4bd0e',
  icon_danger_color: '#e85347',
  icon_info_color: '#09c2de',
  card_shadow: '0 1px 3px rgba(0,0,0,0.1)',
  card_header_bg_color: '#f5f6fa',
  card_footer_bg_color: '#f5f6fa',
  btn_secondary_hover_bg_color: '#dbeafe',
  btn_secondary_border_color: '#e5e9f2',
  btn_disabled_bg_color: '#e5e9f2',
  btn_disabled_text_color: '#b7c2d0',
  table_header_bg_color: '#f5f6fa',
  table_header_text_color: '#364a63',
  table_row_bg_color: '#ffffff',
  table_row_alt_bg_color: '#f5f6fa',
  table_row_hover_bg_color: '#e0e4ff',
  table_border_color: '#e5e9f2',
  input_bg_color: '#ffffff',
  input_border_color: '#e5e9f2',
  input_text_color: '#364a63',
  input_placeholder_color: '#b7c2d0',
  input_focus_border_color: '#ff6600',
  alert_success_bg_color: '#e6fffa',
  alert_success_text_color: '#1ee0ac',
  alert_warning_bg_color: '#fffbe6',
  alert_warning_text_color: '#f4bd0e',
  alert_danger_bg_color: '#fff0f0',
  alert_danger_text_color: '#e85347',
  alert_info_bg_color: '#e6f7ff',
  alert_info_text_color: '#09c2de',
  loader_color: '#ff6600',
  divider_color: '#e5e9f2',
  tooltip_bg_color: '#101924',
  tooltip_text_color: '#ffffff',
  progress_bar_color: '#ff6600',
  switch_active_color: '#ff6600',
  switch_bg_color: '#e5e9f2',
  checkbox_active_color: '#ff6600',
  checkbox_bg_color: '#ffffff',
  stat_icon_color: '#ff6600',
  stat_icon_bg_color: '#e0e4ff',
  stat_icon_success_color: '#1ee0ac',
  stat_icon_warning_color: '#f4bd0e',
  stat_icon_danger_color: '#e85347',
  stat_icon_info_color: '#09c2de',
};

interface BrandingContextType {
  branding: BrandingSettings;
  setBranding: (branding: BrandingSettings) => void;
  resetBranding: () => void;
  getAssetUrl: (path: string | null | undefined) => string | null;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

/**
 * Get full URL for an asset path
 * Prepends the API base URL if the path is a relative path
 */
export function getAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  
  // If already an absolute URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Prepend the API base URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  // Ensure no double slashes
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${cleanBase}${cleanPath}`;
}

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

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBrandingState] = useState<BrandingSettings>(() => {
    // Try to load from localStorage
    const stored = localStorage.getItem('xtrapay_branding');
    if (stored) {
      try {
        return { ...DEFAULT_BRANDING, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_BRANDING;
      }
    }
    return DEFAULT_BRANDING;
  });

  // Track whether branding has been explicitly applied (we don't want to show defaults before backend branding is fetched)
  const [brandingApplied, setBrandingApplied] = useState<boolean>(() => {
    // If there's stored branding, do not auto-apply on first render — wait for explicit apply
    return false;
  });

  // Apply branding to document only after explicit apply
  useEffect(() => {
    if (brandingApplied) {
      applyBrandingToDocument(branding);
    }
  }, [branding, brandingApplied]);

  const setBranding = useCallback((newBranding: BrandingSettings) => {
    const merged = { ...DEFAULT_BRANDING, ...newBranding };
    setBrandingState(merged);
    localStorage.setItem('xtrapay_branding', JSON.stringify(merged));
    setBrandingApplied(true);
    // applyBrandingToDocument will run via effect when brandingApplied becomes true
  }, []);

  const resetBranding = useCallback(() => {
    setBrandingState(DEFAULT_BRANDING);
    localStorage.removeItem('xtrapay_branding');
  }, []);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        setBranding,
        resetBranding,
        getAssetUrl,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
