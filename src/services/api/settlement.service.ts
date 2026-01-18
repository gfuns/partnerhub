import apiService from '../ApiService';

// Settlement Account interfaces
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface SettlementAccount {
  id: number;
  partner_id: number;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  verification_status: VerificationStatus;
  is_primary: boolean;
  verified_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

// Settlement Request interfaces
export type SettlementStatus = 'pending' | 'approved' | 'processing' | 'paid' | 'rejected' | 'failed';

export interface SettlementRequest {
  id: number;
  partner_id: number;
  settlement_account_id: number;
  settlement_account?: SettlementAccount;
  reference: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: SettlementStatus;
  payment_reference: string | null;
  rejection_reason: string | null;
  failure_reason: string | null;
  notes: string | null;
  // Some APIs return requested_by as a numeric user id, others return an object.
  requested_by: number | { id: number; name: string };
  // Some API responses include a flattened name field
  requested_by_name?: string | null;
  approved_by: {
    id: number;
    name: string;
  } | null;
  created_at: string;
  approved_at: string | null;
  processed_at: string | null;
  paid_at: string | null;
}

// Settlement Config (from Xtrapay admin)
export interface SettlementConfig {
  is_settlement_enabled: boolean;
  settlement_mode: 'manual' | 'automatic';
  auto_settlement_threshold: number;
  settlement_schedule: 'daily' | 'weekly' | 'monthly' | 'instant';
  min_settlement_amount: number;
  max_settlement_amount: number;
  settlement_fee_type: 'percentage' | 'flat';
  settlement_fee_value: number;
}

// Bank for dropdown
export interface Bank {
  code: string;
  name: string;
}

// Request/Response interfaces
export interface SettlementAccountsResponse {
  status: string;
  data: SettlementAccount[];
}

export interface AddSettlementAccountRequest {
  bank_code: string;
  account_number: string;
  account_name: string;
}

export interface AddSettlementAccountResponse {
  status: string;
  message: string;
  data: SettlementAccount;
}

export interface ResolveBankAccountRequest {
  bank_code: string;
  account_number: string;
}

export interface ResolveBankAccountResponse {
  status: string;
  data: {
    account_name: string;
    account_number: string;
    bank_code: string;
  };
}

export interface SettlementRequestsParams {
  status?: SettlementStatus;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface SettlementStats {
  pending_count: number;
  pending_amount: number;
  paid_this_month: number;
  total_paid: number;
}

export interface SettlementRequestsData {
  settlements: SettlementRequest[];
  meta: PaginationMeta;
  stats?: SettlementStats;
}

export interface SettlementRequestsResponse {
  status: string;
  data: SettlementRequestsData;
}

export interface CreateSettlementRequest {
  amount: number;
  settlement_account_id: number;
  notes?: string;
}

export interface CreateSettlementResponse {
  status: string;
  message: string;
  data: SettlementRequest;
}

export interface SettlementConfigResponse {
  status: string;
  data: SettlementConfig;
}

export interface SettlementEligibility {
  is_eligible: boolean;
  reason?: string;
  wallet_balance: number;
  has_verified_account: boolean;
  min_amount: number;
  max_amount: number;
  fee_type: 'percentage' | 'flat';
  fee_value: number;
  stamp_duty?: number;
}

export interface SettlementEligibilityResponse {
  status: string;
  data: SettlementEligibility;
}

// Calculate settlement fee
export function calculateSettlementFee(
  amount: number, 
  feeType: 'percentage' | 'flat', 
  feeValue: number
): { fee: number; netAmount: number } {
  let fee: number;
  if (feeType === 'percentage') {
    fee = amount * (feeValue / 100);
  } else {
    fee = feeValue;
  }
  
  return {
    fee: Math.round(fee * 100) / 100,
    netAmount: Math.round((amount - fee) * 100) / 100
  };
}

// Settlement Service
class SettlementService {
  private baseUrl = '/settlements';
  private accountsUrl = '/settlement-accounts';

  /**
   * Get list of banks
   */
  async getBanks(): Promise<{ status: string; data: Bank[] }> {
    return apiService.get<{ status: string; data: Bank[] }>('/banks');
  }

  /**
   * Resolve bank account name
   */
  async resolveBankAccount(data: ResolveBankAccountRequest): Promise<ResolveBankAccountResponse> {
    // Endpoint updated: use /banks/verify (expects { account_number, bank_code })
    return apiService.post<ResolveBankAccountResponse>('/banks/verify', data);
  }

  /**
   * Get partner's settlement accounts
   */
  async getSettlementAccounts(): Promise<SettlementAccountsResponse> {
    return apiService.get<SettlementAccountsResponse>(this.accountsUrl);
  }

  /**
   * Add a new settlement account
   */
  async addSettlementAccount(data: AddSettlementAccountRequest): Promise<AddSettlementAccountResponse> {
    return apiService.post<AddSettlementAccountResponse>(this.accountsUrl, data);
  }

  /**
   * Set account as primary
   */
  async setPrimaryAccount(accountId: number): Promise<{ status: string; message: string }> {
    return apiService.post(`${this.accountsUrl}/${accountId}/set-primary`);
  }

  /**
   * Remove a settlement account
   */
  async removeSettlementAccount(accountId: number): Promise<{ status: string; message: string }> {
    return apiService.delete(`${this.accountsUrl}/${accountId}`);
  }

  /**
   * Check settlement eligibility
   */
  async checkEligibility(): Promise<SettlementEligibilityResponse> {
    return apiService.get<SettlementEligibilityResponse>(`${this.baseUrl}/eligibility`);
  }

  /**
   * Get settlement configuration
   */
  async getConfig(): Promise<SettlementConfigResponse> {
    return apiService.get<SettlementConfigResponse>(`${this.baseUrl}/config`);
  }

  /**
   * Get settlement requests history
   */
  async getSettlements(params?: SettlementRequestsParams): Promise<SettlementRequestsResponse> {
    return apiService.get<SettlementRequestsResponse>(this.baseUrl, { params });
  }

  /**
   * Get settlement request details
   */
  async getSettlement(settlementId: number): Promise<{ status: string; data: SettlementRequest }> {
    return apiService.get<{ status: string; data: SettlementRequest }>(`${this.baseUrl}/${settlementId}`);
  }

  /**
   * Request a new settlement
   */
  async requestSettlement(data: CreateSettlementRequest): Promise<CreateSettlementResponse> {
    return apiService.post<CreateSettlementResponse>(this.baseUrl, data);
  }
}

export const settlementService = new SettlementService();
export default settlementService;
