/**
 * Public API Service
 * Used for unauthenticated endpoints (no auth token required)
 * e.g. merchant onboarding, partner branding
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const publicAxios = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

// ---- Types ----
export interface PublicBrandingResponse {
  success: boolean;
  data: {
    branding?: Record<string, any>;
    partner?: {
      name: string;
      logo_url?: string;
      [key: string]: any;
    };
    [key: string]: any;
  } | null;
  message?: string;
}

export interface PublicBanksResponse {
  success: boolean;
  data: Array<{ id: number; name: string; code: string; active?: boolean }>;
  message?: string;
}

export interface PublicVerifyAccountRequest {
  account_number: string;
  bank_code: string;
}

export interface PublicVerifyAccountResponse {
  success: boolean;
  data: {
    accountName: string;
    accountNumber: string;
    bankCode: string;
    bvn?: string;
    [key: string]: any;
  };
  message?: string;
}

export interface PublicOnboardMerchantRequest {
  // Agent / Business
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  lga?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  owner_email?: string;
  owner_phone?: string;
  // KYC Profile
  business_type: string;
  id_type: string;
  id_number: string;
  date_of_birth?: string;
  gender?: string;
  rc_number?: string;
  tin_number?: string;
  bank_name: string;
  bank_code?: string;
  account_number: string;
  account_name: string;
  bvn: string;
  // Context
  partner_subdomain?: string;
}

export interface PublicOnboardMerchantResponse {
  success: boolean;
  message: string;
  data?: {
    agent?: any;
    kyc_token?: string;
    [key: string]: any;
  };
}

export interface PublicKycUploadDocumentResponse {
  success: boolean;
  message: string;
  data?: {
    document?: any;
    [key: string]: any;
  };
}

class PublicService {
  /** Get partner branding by subdomain */
  async getBrandingBySubdomain(subdomain: string): Promise<PublicBrandingResponse> {
    const url = `/api/partner-hub/public/branding/${encodeURIComponent(subdomain)}`;
    const resp = await publicAxios.get(url);
    return resp.data;
  }

  /** Get list of banks (no auth required) */
  async getBanks(): Promise<PublicBanksResponse> {
    const resp = await publicAxios.get('/api/partner-hub/public/banks');
    return resp.data;
  }

  /** Verify bank account number (no auth required) */
  async verifyAccount(data: PublicVerifyAccountRequest): Promise<PublicVerifyAccountResponse> {
    const resp = await publicAxios.post('/api/partner-hub/public/banks/verify', data);
    return resp.data;
  }

  /**
   * Onboard a new merchant (agent creation + KYC initiation)
   * This is the combined public endpoint
   */
  async onboardMerchant(data: PublicOnboardMerchantRequest): Promise<PublicOnboardMerchantResponse> {
    const resp = await publicAxios.post('/api/partner-hub/public/onboard-merchant', data);
    return resp.data;
  }

  /**
   * Upload a KYC document using a temporary onboarding token
   * (returned after agent creation step)
   */
  async uploadKycDocument(
    kyc_token: string,
    document_type: string,
    file: File
  ): Promise<PublicKycUploadDocumentResponse> {
    const formData = new FormData();
    formData.append('document_type', document_type);
    formData.append('file', file);
    formData.append('kyc_token', kyc_token);
    const resp = await publicAxios.post('/api/partner-hub/public/onboard-merchant/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return resp.data;
  }
}

export const publicService = new PublicService();
export default publicService;
