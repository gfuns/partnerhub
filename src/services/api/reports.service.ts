import apiService from './ApiService';

// Common query params
export interface ReportsQuery {
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  agent_id?: number;
  terminal_id?: number;
  service_type_id?: number;
  status?: string;
  export?: 'csv' | 'xlsx' | 'pdf';
}

export interface TransactionSummaryResponse {
  success: boolean;
  data: {
    total_count: number;
    total_volume: number;
    successful_count: number;
    failed_count: number;
    pending_count: number;
    success_rate: number;
    fees_total: number;
    by_day: Array<{ date: string; count: number; volume: number; fees: number }>;
  };
  meta?: any;
}

export interface TransactionDetailRow {
  id: number;
  reference: string;
  external_reference?: string;
  amount: number;
  fee: number;
  status: string;
  service_type: string;
  terminal_id?: number;
  terminal_name?: string;
  agent_id?: number;
  agent_name?: string;
  created_at: string;
  settlement_status?: string;
  bank_code?: string;
  account_number?: string;
  narration?: string;
}

export interface TransactionDetailResponse {
  success: boolean;
  data: TransactionDetailRow[];
  meta?: { page: number; per_page: number; total: number };
}

class ReportsService {
  // Transaction summary
  async getTransactionSummary(params?: ReportsQuery): Promise<TransactionSummaryResponse> {
    return apiService.get('/reports/transactions/summary', { baseURL: import.meta.env.VITE_API_BASE_URL + '/api/partner-hub', params });
  }

  // Transaction detail (paginated)
  async getTransactionDetail(params?: ReportsQuery): Promise<TransactionDetailResponse> {
    return apiService.get('/reports/transactions/detail', { baseURL: import.meta.env.VITE_API_BASE_URL + '/api/partner-hub', params });
  }

  // Other report endpoints (stubs)
  async getSettlements(params?: ReportsQuery) {
    return apiService.get('/reports/settlements', { baseURL: import.meta.env.VITE_API_BASE_URL + '/api/partner-hub', params });
  }

  async getWalletReport(params?: ReportsQuery) {
    return apiService.get('/reports/wallet', { baseURL: import.meta.env.VITE_API_BASE_URL + '/api/partner-hub', params });
  }

  async getTerminalsReport(params?: ReportsQuery) {
    return apiService.get('/reports/terminals', { baseURL: import.meta.env.VITE_API_BASE_URL + '/api/partner-hub', params });
  }

  async getAgentsReport(params?: ReportsQuery) {
    return apiService.get('/reports/agents', { baseURL: import.meta.env.VITE_API_BASE_URL + '/api/partner-hub', params });
  }

  async getCommissionsReport(params?: ReportsQuery) {
    return apiService.get('/reports/commissions', { baseURL: import.meta.env.VITE_API_BASE_URL + '/api/partner-hub', params });
  }

  async getVirtualAccountsUsage(params?: ReportsQuery) {
    return apiService.get('/reports/virtual-accounts/usage', { baseURL: import.meta.env.VITE_API_BASE_URL + '/api/partner-hub', params });
  }

  async getReconciliation(params?: ReportsQuery) {
    return apiService.get('/reports/reconciliation', { baseURL: import.meta.env.VITE_API_BASE_URL + '/api/partner-hub', params });
  }

  async getAuditLogs(params?: ReportsQuery) {
    return apiService.get('/reports/audit-logs', { baseURL: import.meta.env.VITE_API_BASE_URL + '/api/partner-hub', params });
  }
}

export const reportsService = new ReportsService();
export default reportsService;
