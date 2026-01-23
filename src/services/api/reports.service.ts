import apiService from '../ApiService';

// Common query params for reports
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
  data: TransactionDetailRow[] | any;
  meta?: { page: number; per_page: number; total: number };
}

export interface ExportJob {
  id: string;
  report: string;
  params: any;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  download_url?: string | null;
}

class ReportsService {
  // Transaction summary
  private normalizeParams(params?: Record<string, any>) {
    if (!params) return {};
    const p: Record<string, any> = { ...params };
    // support UI fields -> API expected names
    if (p.service_type) {
      p.service_type_id = p.service_type;
      delete p.service_type;
    }
    if (p.serviceType) {
      p.service_type_id = p.serviceType;
      delete p.serviceType;
    }
    // agent id may come as agentId or agent_id
    if (p.agentId) {
      p.agent_id = p.agentId;
      delete p.agentId;
    }
    return p;
  }

  async getTransactionSummary(params?: ReportsQuery): Promise<TransactionSummaryResponse> {
    const q = this.normalizeParams(params as any);
    return apiService.get('/reports/transactions/summary', { params: q });
  }

  // backward-compatible alias used by some pages
  async getTransactionsSummary(params?: ReportsQuery): Promise<TransactionSummaryResponse> {
    return this.getTransactionSummary(params);
  }

  // Transaction detail (paginated)
  async getTransactionDetail(params?: ReportsQuery): Promise<TransactionDetailResponse> {
    const q = this.normalizeParams(params as any);
    return apiService.get('/reports/transactions/detail', { params: q });
  }

  // backward-compatible alias
  async getTransactionsDetail(params?: ReportsQuery): Promise<TransactionDetailResponse> {
    return this.getTransactionDetail(params);
  }

  // Start a background export job
  async startExport(report: string, params: any): Promise<{ success: boolean; data: { job_id: string } } & any> {
    const body = { report, params: this.normalizeParams(params) };
    return apiService.post('/reports/exports', body);
  }

  async getExportStatus(jobId: string): Promise<{ success: boolean; data: ExportJob } & any> {
    return apiService.get(`/reports/exports/${jobId}`);
  }

  async listExports(): Promise<{ success: boolean; data: ExportJob[] } & any> {
    return apiService.get('/reports/exports');
  }

  // Other report endpoints
  async getSettlements(params?: ReportsQuery) {
    return apiService.get('/reports/settlements', { params });
  }

  async getWalletReport(params?: ReportsQuery) {
    return apiService.get('/reports/wallet', { params });
  }

  async getTerminalsReport(params?: ReportsQuery) {
    return apiService.get('/reports/terminals', { params });
  }

  async getAgentsReport(params?: ReportsQuery) {
    return apiService.get('/reports/agents', { params });
  }

  async getCommissionsReport(params?: ReportsQuery) {
    return apiService.get('/reports/commissions', { params });
  }

  async getVirtualAccountsUsage(params?: ReportsQuery) {
    return apiService.get('/reports/virtual-accounts/usage', { params });
  }

  async getReconciliation(params?: ReportsQuery) {
    return apiService.get('/reports/reconciliation', { params });
  }

  async getAuditLogs(params?: ReportsQuery) {
    return apiService.get('/reports/audit-logs', { params });
  }
}

export const reportsService = new ReportsService();
export default reportsService;
