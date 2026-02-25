import apiService from '../ApiService';
import { 
  KycStatus,
  KycStatusResponse,
  KycProfileResponse,
  KycProfile,
  KycDocumentsResponse,
  UploadDocumentResponse,
  SubmitKycResponse,
  KycCorrectionsResponse,
  DocumentType,
  DocumentDownloadResponse,
  KycChecklistItem,
  // Partner-side types
  KycSubmissionsListResponse,
  KycReviewSummaryResponse,
  KycDetailsResponse,
  StartReviewResponse,
  DocumentReviewPayload,
  DocumentReviewResponse,
  ApproveKycPayload,
  ApproveKycResponse,
  RejectKycPayload,
  RejectKycResponse,
  RequestCorrectionsPayload,
  RequestCorrectionsResponse,
  KycReviewStatus,
  BusinessType,
} from '../../types/kyc';

class KYCService {
  // =====================================================
  // AGENT-SIDE ENDPOINTS (for agent KYC onboarding)
  // =====================================================

  /**
   * Get KYC status overview for the authenticated agent
   * GET /api/agent-hub/kyc-onboarding/status
   */
  async getKycStatus(): Promise<KycStatusResponse> {
    return apiService.get<KycStatusResponse>('/kyc-onboarding/status');
  }

  /**
   * Get KYC profile for the authenticated agent
   * GET /api/agent-hub/kyc-onboarding/profile
   */
  async getKycProfile(): Promise<KycProfileResponse> {
    return apiService.get<KycProfileResponse>('/kyc-onboarding/profile');
  }

  /**
   * Update KYC profile for the authenticated agent
   * PUT /api/agent-hub/kyc-onboarding/profile
   */
  async updateKycProfile(profile: Partial<KycProfile>): Promise<KycProfileResponse> {
    return apiService.put<KycProfileResponse>('/kyc-onboarding/profile', profile);
  }

  /**
   * Get all documents for the authenticated agent
   * GET /api/agent-hub/kyc-onboarding/documents
   */
  async getDocuments(): Promise<KycDocumentsResponse> {
    return apiService.get<KycDocumentsResponse>('/kyc-onboarding/documents');
  }

  /**
   * Upload a document for KYC
   * POST /api/agent-hub/kyc-onboarding/documents
   * @param documentType - Type of document (e.g., 'valid_id', 'cac_certificate')
   * @param file - File to upload
   */
  async uploadDocument(
    documentType: DocumentType,
    file: File
  ): Promise<UploadDocumentResponse> {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);

    return apiService.post<UploadDocumentResponse>('/kyc-onboarding/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Delete a document
   * DELETE /api/agent-hub/kyc-onboarding/documents/{documentId}
   */
  async deleteDocument(documentId: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/kyc-onboarding/documents/${documentId}`);
  }

  /**
   * Submit KYC for review
   * POST /api/agent-hub/kyc-onboarding/submit
   */
  async submitKyc(data?: Record<string, any>): Promise<SubmitKycResponse> {
    return apiService.post<SubmitKycResponse>('/kyc-onboarding/submit', data || {});
  }

  /**
   * Get correction requests for the authenticated agent
   * GET /api/agent-hub/kyc-onboarding/corrections
   */
  async getCorrections(): Promise<KycCorrectionsResponse> {
    return apiService.get<KycCorrectionsResponse>('/kyc-onboarding/corrections');
  }

  /**
   * Download a document
   * GET /api/agent-hub/kyc-onboarding/documents/{documentId}/download
   */
  async downloadDocument(documentId: number): Promise<DocumentDownloadResponse> {
    return apiService.get<DocumentDownloadResponse>(`/kyc-onboarding/documents/${documentId}/download`);
  }

  // =====================================================
  // PARTNER-SIDE ENDPOINTS (for KYC review/approval)
  // =====================================================

  /**
   * Get KYC review summary statistics
   * GET /api/partner-hub/kyc/summary
   */
  async getSummary(): Promise<KycReviewSummaryResponse> {
    return apiService.get<KycReviewSummaryResponse>('/kyc/summary');
  }

  /**
   * List KYC submissions with filtering
   * GET /api/partner-hub/kyc
   */
  async getSubmissions(params?: {
    status?: string;
    business_type?: BusinessType;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<KycSubmissionsListResponse> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.get<KycSubmissionsListResponse>(`/kyc${queryString}`);
  }

  /**
   * Get KYC submission details for review
   * GET /api/partner-hub/kyc/{id}
   */
  async getKYCDetails(id: number | string): Promise<KycDetailsResponse> {
    return apiService.get<KycDetailsResponse>(`/kyc/${id}`);
  }

  /**
   * Start reviewing a KYC submission
   * POST /api/partner-hub/kyc/{id}/start-review
   */
  async startReview(id: number | string): Promise<StartReviewResponse> {
    return apiService.post<StartReviewResponse>(`/kyc/${id}/start-review`, {});
  }

  /**
   * Review a specific document
   * POST /api/partner-hub/kyc/{profileId}/documents/{docId}/review
   */
  async reviewDocument(
    profileId: number | string,
    docId: number | string,
    data: DocumentReviewPayload
  ): Promise<DocumentReviewResponse> {
    return apiService.post<DocumentReviewResponse>(
      `/kyc/${profileId}/documents/${docId}/review`,
      data
    );
  }

  /**
   * Approve KYC submission
   * POST /api/partner-hub/kyc/{id}/approve
   */
  async approve(id: number | string, data?: ApproveKycPayload): Promise<ApproveKycResponse> {
    return apiService.post<ApproveKycResponse>(`/kyc/${id}/approve`, data || {});
  }

  /**
   * Reject KYC submission
   * POST /api/partner-hub/kyc/{id}/reject
   */
  async reject(id: number | string, data: RejectKycPayload): Promise<RejectKycResponse> {
    return apiService.post<RejectKycResponse>(`/kyc/${id}/reject`, data);
  }

  /**
   * Request corrections from agent
   * POST /api/partner-hub/kyc/{id}/corrections
   */
  async requestCorrections(
    id: number | string,
    data: RequestCorrectionsPayload
  ): Promise<RequestCorrectionsResponse> {
    return apiService.post<RequestCorrectionsResponse>(`/kyc/${id}/request-corrections`, data);
  }
}

export const kycService = new KYCService();
export default kycService;
