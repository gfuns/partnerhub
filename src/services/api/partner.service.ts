import apiService from '../ApiService';

export interface PartnerSettings {
  [key: string]: any;
}

export interface KycProfile {
  id: number;
  business_category: string;
  business_category_label: string;
  data: Record<string, any>;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KycDocument {
  id: number;
  document_type: string;
  document_type_label: string;
  file_url: string;
  status: string;
  status_label: string;
  created_at: string;
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

export interface PartnerStatistics {
  total_agents: number;
  approved_agents: number;
  total_terminals: number;
  total_documents: number;
  total_reviews: number;
}

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
  logo_url: string | null;
  status: number;
  status_label: string;
  kyc_status: string;
  kyc_status_label: string;
  requires_kyc_onboarding: boolean;
  is_kyc_approved: boolean;
  can_onboard_agents: boolean;
  can_assign_terminals: boolean;
  settings: PartnerSettings;
  created_at: string;
  updated_at: string;
  kyc_profile: KycProfile | null;
  kyc_documents: KycDocument[];
  latest_kyc_review: KycReview | null;
  statistics: PartnerStatistics;
}

export interface PartnerProfileResponse {
  status: string;
  data: PartnerProfile;
}

export interface UpdatePartnerProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

class PartnerService {
  /**
   * Get partner profile
   */
  async getProfile(): Promise<PartnerProfileResponse> {
    const response = await apiService.get<PartnerProfileResponse>('/partner/profile');
    return response;
  }

  /**
   * Update partner profile
   */
  async updateProfile(data: UpdatePartnerProfileRequest): Promise<PartnerProfileResponse> {
    const response = await apiService.put<PartnerProfileResponse>('/partner/profile', data);
    return response;
  }

  /**
   * Upload partner logo
   */
  async uploadLogo(file: File): Promise<{ status: string; data: { logo_url: string } }> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await apiService.post<{ status: string; data: { logo_url: string } }>(
      '/partner/logo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  }
}

const partnerService = new PartnerService();
export default partnerService;
