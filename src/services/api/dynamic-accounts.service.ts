import apiService from '../ApiService';

export type DynamicAccountStatus = 'pending' | 'credited' | 'expired' | 'cancelled' | 'returned';

export interface DynamicAccount {
  id: number;
  partner_id: number;
  account_number: string;
  account_name?: string;
  reference: string;
  expected_amount: number | null;
  must_match_amount: boolean;
  status: DynamicAccountStatus;
  provider?: string;
  meta?: Record<string, any>;
  payload?: {
    accountNumber?: string;
    accountName?: string;
  };
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DynamicAccountsListParams {
  status?: DynamicAccountStatus;
  page?: number;
  per_page?: number;
  partner_id?: number;
}

export interface DynamicAccountsListResponse {
  success: boolean;
  data: {
    data: DynamicAccount[];
    current_page: number;
    per_page: number;
    total: number;
    last_page?: number;
  };
}

export interface CreateDynamicAccountRequest {
  partner_id?: number;
  reference?: string;
  expected_amount?: number;
  must_match_amount?: boolean;
  meta?: Record<string, any>;
  expires_at?: string;
}

export interface DynamicAccountResponse {
  success: boolean;
  data: DynamicAccount;
  message?: string;
}

class DynamicAccountsService {
  private baseUrl = '/dynamic-accounts';

  async getDynamicAccounts(params?: DynamicAccountsListParams): Promise<DynamicAccountsListResponse> {
    return apiService.get<DynamicAccountsListResponse>(this.baseUrl, { params });
  }

  async createDynamicAccount(data: CreateDynamicAccountRequest): Promise<DynamicAccountResponse> {
    return apiService.post<DynamicAccountResponse>(this.baseUrl, data);
  }

  async getDynamicAccount(id: number): Promise<DynamicAccountResponse> {
    return apiService.get<DynamicAccountResponse>(`${this.baseUrl}/${id}`);
  }

  async cancelDynamicAccount(id: number): Promise<DynamicAccountResponse> {
    return apiService.post<DynamicAccountResponse>(`${this.baseUrl}/${id}/cancel`);
  }
}

export const dynamicAccountsService = new DynamicAccountsService();
export default dynamicAccountsService;
