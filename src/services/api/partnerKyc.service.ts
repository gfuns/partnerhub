import { apiService } from '../ApiService';

// Types
export interface BusinessCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface FormField {
  id: number;
  template_id: number;
  template_name: string;
  label: string;
  field_type: 'text' | 'textarea' | 'select' | 'checkbox' | 'file' | 'date' | 'email' | 'number';
  is_required: boolean;
  options: string[] | null;
  order: number;
}

export interface ChecklistItem {
  id: number;
  template_id: number;
  template_name: string;
  name: string;
  description: string;
  document_required: boolean;
  order: number;
}

export interface CategoryRequirements {
  category: BusinessCategory;
  form_fields: FormField[];
  checklist_items: ChecklistItem[];
}

export interface KycDocument {
  id: number;
  document_type: string;
  file_url: string;
  uploaded_at: string;
}

export interface KycProfile {
  business_category: string;
  data: Record<string, any>;
  submitted_at: string | null;
}

export interface KycStatusResponse {
  kyc_status: 'pending_onboarding' | 'pending_review' | 'approved' | 'rejected' | 'suspended';
  business_name: string;
  code: string;
  has_profile: boolean;
  business_category: string | null;
  profile_submitted: boolean;
  submitted_at: string | null;
  documents_count: number;
  available_statuses: Record<string, string>;
}

export interface ReviewHistory {
  id: number;
  decision: string;
  remarks: string;
  reviewed_at: string;
  reviewer: {
    name: string;
    email: string;
  };
}

const partnerKycService = {
  /**
   * Get all business categories
   */
  async getBusinessCategories(): Promise<{ status: string; data: BusinessCategory[] }> {
    return apiService.get('/business-categories');
  },

  /**
   * Get form fields for a specific category
   */
  async getCategoryFields(categorySlug: string): Promise<{ status: string; data: { category: BusinessCategory; fields: FormField[] } }> {
    return apiService.get(`/business-categories/${categorySlug}/fields`);
  },

  /**
   * Get checklist for a specific category
   */
  async getCategoryChecklist(categorySlug: string): Promise<{ status: string; data: { category: BusinessCategory; checklist_items: ChecklistItem[] } }> {
    return apiService.get(`/business-categories/${categorySlug}/checklist`);
  },

  /**
   * Get complete requirements (fields + checklist) for a category
   */
  async getCategoryRequirements(categorySlug: string): Promise<{ status: string; data: CategoryRequirements }> {
    return apiService.get(`/business-categories/${categorySlug}/requirements`);
  },

  /**
   * Get current KYC status
   */
  async getKycStatus(): Promise<{ status: string; data: KycStatusResponse }> {
    return apiService.get('/partner-kyc/status');
  },

  /**
   * Save KYC profile as draft
   */
  async saveProfile(data: { business_category: string; data: Record<string, any> }): Promise<{ status: string; message: string; data: { id: number; business_category: string } }> {
    return apiService.post('/partner-kyc/profile', data);
  },

  /**
   * Get saved KYC profile
   */
  async getProfile(): Promise<{ status: string; data: KycProfile }> {
    return apiService.get('/partner-kyc/profile');
  },

  /**
   * Submit KYC profile for review
   */
  async submitProfile(): Promise<{ status: string; message: string; data: { kyc_status: string; submitted_at: string } }> {
    return apiService.post('/partner-kyc/profile/submit');
  },

  /**
   * Upload a document
   */
  async uploadDocument(file: File, documentType: string): Promise<{ status: string; message: string; data: KycDocument }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);

    return apiService.post('/partner-kyc/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Get all uploaded documents
   */
  async getDocuments(): Promise<{ status: string; data: KycDocument[] }> {
    return apiService.get('/partner-kyc/documents');
  },

  /**
   * Delete a document
   */
  async deleteDocument(documentId: number): Promise<{ status: string; message: string }> {
    return apiService.delete(`/partner-kyc/documents/${documentId}`);
  },

  /**
   * Get review history
   */
  async getReviewHistory(): Promise<{ status: string; data: ReviewHistory[] }> {
    return apiService.get('/partner-kyc/reviews');
  },
};

export default partnerKycService;
