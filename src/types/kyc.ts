// KYC Types for Agent Onboarding (Updated to match API documentation)

export type KycStatus = 
  | 'pending_onboarding'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type BusinessType = 
  | 'individual'
  | 'sme'
  | 'corporate';

export type IdType =
  | 'nin'
  | 'bvn'
  | 'drivers_license'
  | 'voters_card'
  | 'international_passport';

export type Gender = 'male' | 'female';

export type DocumentType =
  | 'valid_id'
  | 'utility_bill'
  | 'passport_photo'
  | 'cac_certificate'
  | 'cac_form_co7'
  | 'memorandum'
  | 'board_resolution'
  | 'director_id';

export type DocumentStatus =
  | 'not_uploaded'
  | 'pending'
  | 'approved'
  | 'verified'
  | 'rejected'
  | 'needs_correction';

// KYC Profile Data
export interface KycProfile {
  id?: number;
  business_type: BusinessType;
  id_type: IdType;
  id_number: string;
  date_of_birth?: string; // YYYY-MM-DD
  gender?: Gender;
  rc_number?: string; // Required for SME/Corporate
  tin_number?: string;
  bank_name: string;
  bank_code?: string;
  account_number: string; // 10 digits
  account_name: string;
  bvn: string; // 11 digits
  status?: string;
}

// Document Information
export interface KycDocument {
  id: number;
  document_type: DocumentType;
  document_label: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  review_notes: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
}

export interface RequiredDocument {
  type: DocumentType;
  label: string;
  required: boolean;
  max_size_kb: number;
  allowed_types: string[];
}

// Document in Status Response
export interface DocumentInStatus {
  label: string;
  required: boolean;
  uploaded: boolean;
  status: DocumentStatus;
  feedback: string | null;
  uploaded_at: string | null;
}

// KYC Status Response
export interface KycStatusResponse {
  success: boolean;
  data: {
    agent: {
      id: number;
      code: string;
      business_name: string;
    };
    kyc_status: KycStatus;
    kyc_status_label: string;
    business_type: BusinessType | null;
    profile_complete: boolean;
    documents_complete: boolean;
    completion_percentage: number;
    can_submit: boolean;
    documents: Record<string, DocumentInStatus>;
    corrections: any | null;
    submitted_at: string | null;
    approved_at: string | null;
  };
}

// KYC Profile Response
export interface KycProfileResponse {
  success: boolean;
  data: {
    agent: {
      id: number;
      code: string;
      business_name: string;
      contact_name: string;
      contact_email: string;
      contact_phone: string;
      address: string;
      city: string;
      state: string;
      lga: string;
      kyc_status: string;
    };
    profile: KycProfile;
    corrections?: KycCorrectionsData;
  };
}

// Documents List Response
export interface KycDocumentsResponse {
  success: boolean;
  data: {
    documents: KycDocument[];
    required_documents: RequiredDocument[];
  };
}

// Upload Document Response
export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  data: {
    document: KycDocument;
  };
}

// Submit KYC Response
export interface SubmitKycResponse {
  success: boolean;
  message: string;
  data: {
    kyc_status: KycStatus;
    submitted_at: string;
  };
}

// Corrections Response
export interface DocumentCorrection {
  document_id: number;
  comment: string;
}

export interface ProfileFieldCorrection {
  field_name: string;
  current_value: string;
  comment: string;
}

export interface KycCorrectionsData {
  document_corrections?: DocumentCorrection[];
  profile_corrections?: ProfileFieldCorrection[];
  general_comment?: string;
  total_corrections: number;
  reviewed_at: string;
  reviewer?: {
    name: string;
    email: string;
  };
}

export interface KycCorrectionsResponse {
  success: boolean;
  data: {
    agent: any;
    profile: any;
    corrections: KycCorrectionsData;
  };
}

// Document Download Response
export interface DocumentDownloadResponse {
  success: boolean;
  data: {
    download_url: string;
    file_name: string;
    mime_type: string;
  };
}

// Business Type Options for UI
export const BUSINESS_TYPE_OPTIONS = [
  { value: 'individual' as BusinessType, label: 'Individual / Sole Proprietor', description: 'Solo entrepreneur, no registered business' },
  { value: 'sme' as BusinessType, label: 'SME (Registered Business Name)', description: 'Registered business name (BN)' },
  { value: 'corporate' as BusinessType, label: 'Corporate (Limited Company)', description: 'Registered limited company (Ltd, PLC)' },
];

// ID Type Options for UI
export const ID_TYPE_OPTIONS = [
  { value: 'nin' as IdType, label: 'National Identification Number (NIN)' },
  // { value: 'bvn' as IdType, label: 'Bank Verification Number (BVN)' },
  { value: 'drivers_license' as IdType, label: "Driver's License" },
  { value: 'voters_card' as IdType, label: "Voter's Card" },
  { value: 'international_passport' as IdType, label: 'International Passport' },
];

// Gender Options for UI
export const GENDER_OPTIONS = [
  { value: 'male' as Gender, label: 'Male' },
  { value: 'female' as Gender, label: 'Female' },
];

// File validation constants
export const MAX_FILE_SIZES = {
  image: 2048, // 2MB for passport photos
  document: 5120, // 5MB for most documents
  memorandum: 10240, // 10MB for memorandum
};

export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png'],
  pdf: ['application/pdf'],
  all: ['image/jpeg', 'image/png', 'application/pdf'],
};

// Helper function to get required documents by business type
export function getRequiredDocuments(businessType: BusinessType): DocumentType[] {
  switch (businessType) {
    case 'individual':
      return ['valid_id', 'utility_bill', 'passport_photo'];
    case 'sme':
      return ['valid_id', 'cac_certificate', 'utility_bill', 'passport_photo'];
    case 'corporate':
      return ['cac_certificate', 'cac_form_co7', 'memorandum', 'director_id', 'utility_bill'];
    default:
      return [];
  }
}

// Legacy types for backward compatibility (will be removed later)
export interface KycSubmission {
  businessType: BusinessType;
  fullName: string;
  phoneNumber: string;
  email: string;
  businessName?: string;
  governmentIdUrl?: string;
  passportPhotoUrl?: string;
  cacNumber?: string;
  directorIdUrl?: string;
  businessAddressProofUrl?: string;
  companyDocumentsUrl?: string;
  directorsListUrl?: string;
  declarationAccepted: boolean;
  submittedAt?: string;
}

export interface KycChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  comment?: string;
}

export const DEFAULT_KYC_CHECKLIST: Omit<KycChecklistItem, 'checked' | 'comment'>[] = [
  { id: 'business_exists', label: 'Business exists physically' },
  { id: 'id_matches', label: 'ID matches applicant' },
  { id: 'phone_verified', label: 'Phone number verified' },
  { id: 'address_verified', label: 'Address verified' },
  { id: 'bank_confirmed', label: 'Bank account confirmed' },
];

export interface AgentWithKyc {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  terminals: number;
  kycStatus: KycStatus;
  kycSubmission?: KycSubmission;
  rejectionReason?: string;
  createdAt: string;
}

// =====================================================
// PARTNER-SIDE KYC REVIEW TYPES
// =====================================================

// KYC Review Status (Partner Perspective)
export type KycReviewStatus = 
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'needs_correction';

// Agent Info in KYC Submission
export interface KycAgentInfo {
  id: number;
  code: string;
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  lga: string;
  kyc_status: KycStatus;
  business_type?: BusinessType;
}

// KYC Document in Submission
export interface KycSubmissionDocument {
  id: number;
  agent_id: number;
  document_type: DocumentType;
  document_name: string | null;
  file_path: string;
  file_url: string | null;
  file_type: string | null;
  file_size: number;
  status: DocumentStatus;
  rejection_reason: string | null;
  uploaded_at: string | null;
  verified_at: string | null;
  verified_by: number | null;
  created_at: string;
  updated_at: string;
}

// KYC Submission in List
export interface KycSubmissionListItem {
  id: number;
  agent_id: number;
  business_type: BusinessType;
  id_type: IdType;
  id_number: string;
  status?: KycReviewStatus; // Optional since API may not always include it
  submitted_at: string;
  created_at: string;
  updated_at: string;
  agent: KycAgentInfo;
  documents: KycSubmissionDocument[];
  reviews: any[];
}

// KYC Submissions List Response
export interface KycSubmissionsListResponse {
  success: boolean;
  data: KycSubmissionListItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// KYC Review Summary/Statistics
export interface KycReviewSummary {
  pending: number;
  under_review: number;
  needs_correction: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface KycReviewSummaryResponse {
  success: boolean;
  data: KycReviewSummary;
}

// Checklist Template
export interface KycChecklistTemplate {
  id: number;
  name: string;
  description: string;
  applies_to: BusinessType | 'all';
  is_active: boolean;
  version: number;
  items: KycChecklistTemplateItem[];
}

export interface KycChecklistTemplateItem {
  id: number;
  template_id: number;
  label: string;
  description: string;
  is_required: boolean;
  sort_order: number;
  category: 'identity' | 'address' | 'business' | 'bank' | 'other';
}

// Document Checklist Item
export interface DocumentChecklistItem {
  item_name: DocumentType;
  description: string;
  is_required: boolean;
  is_uploaded: boolean;
  document?: {
    id: number;
    file_url: string;
    status: DocumentStatus;
    comment: string | null;
    uploaded_at: string;
  };
}

// KYC Profile with full details
export interface KycProfileDetails {
  id: number;
  agent_id: number;
  business_type: BusinessType;
  id_type: IdType;
  id_number: string;
  date_of_birth?: string;
  gender?: Gender;
  rc_number?: string;
  tin_number?: string;
  bank_name: string;
  bank_code?: string;
  account_number: string;
  account_name: string;
  bvn: string;
  status?: KycReviewStatus; // Optional since API may not always return it
  submitted_at: string;
  reviewed_by?: number | null;
  approved_at?: string | null;
  approved_by?: number | null;
  rejection_reason?: string | null;
  agent: KycAgentInfo;
  documents: KycSubmissionDocument[];
  reviews: any[];
}

// KYC Details Response
export interface KycDetailsResponse {
  success: boolean;
  data: {
    kyc_profile: KycProfileDetails;
    checklist?: KycChecklistTemplate;
    document_checklist: DocumentChecklistItem[];
  };
}

// Start Review Response
export interface StartReviewResponse {
  success: boolean;
  message: string;
  data: {
    kyc_profile: {
      id: number;
      status: KycReviewStatus;
      reviewed_by: number;
    };
  };
}

// Document Review Request/Response
export interface DocumentReviewPayload {
  status: 'approved' | 'rejected' | 'needs_correction';
  comment?: string;
}

export interface DocumentReviewResponse {
  success: boolean;
  message: string;
  data: {
    document: KycSubmissionDocument;
  };
}

// Approve KYC Request/Response
export interface ApproveKycPayload {
  comment?: string;
}

export interface ApproveKycResponse {
  success: boolean;
  message: string;
  data: {
    kyc_profile: KycProfileDetails;
  };
}

// Reject KYC Request/Response
export interface RejectKycPayload {
  reason: string;
}

export interface RejectKycResponse {
  success: boolean;
  message: string;
  data: {
    kyc_profile: KycProfileDetails;
  };
}

// Request Corrections Payload/Response
export interface DocumentCorrectionItem {
  document_id: number;
  comment: string;
}

export interface ProfileFieldCorrectionItem {
  field_name: string;
  current_value?: string;
  comment: string;
}

export interface RequestCorrectionsPayload {
  document_corrections?: DocumentCorrectionItem[];
  profile_corrections?: ProfileFieldCorrectionItem[];
  general_comment?: string;
}

export interface RequestCorrectionsResponse {
  success: boolean;
  message: string;
  data: {
    kyc_profile: KycProfileDetails;
  };
}

// Status badge configuration helper
export const KYC_REVIEW_STATUS_CONFIG = {
  submitted: {
    label: 'Pending Review',
    color: 'yellow',
    variant: 'warning' as const,
  },
  under_review: {
    label: 'Under Review',
    color: 'blue',
    variant: 'default' as const,
  },
  needs_correction: {
    label: 'Needs Correction',
    color: 'orange',
    variant: 'warning' as const,
  },
  approved: {
    label: 'Approved',
    color: 'green',
    variant: 'success' as const,
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    variant: 'destructive' as const,
  },
};
