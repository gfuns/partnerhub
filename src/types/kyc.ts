// KYC Types for Agent Onboarding

export type KycStatus = 
  | 'pending_onboarding'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type BusinessType = 
  | 'individual_trader'
  | 'registered_business'
  | 'corporate';

export interface KycDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface KycSubmission {
  businessType: BusinessType;
  
  // Basic Information
  fullName: string;
  phoneNumber: string;
  email: string;
  businessName?: string;
  
  // Identity & Documents (varies by business type)
  // Individual Trader
  governmentIdUrl?: string;
  passportPhotoUrl?: string;
  
  // Registered Business
  cacNumber?: string;
  directorIdUrl?: string;
  businessAddressProofUrl?: string;
  
  // Corporate
  companyDocumentsUrl?: string;
  directorsListUrl?: string;
  
  // Declaration
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
