import apiService from '../ApiService';

export interface Agent {
  id: number;
  business_name: string;
  code: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface Terminal {
  id: number;
  terminal_id: string;
  serial_number: string;
  name?: string;
  status: 'active' | 'suspended' | 'revoked';
  online_status?: 'online' | 'offline';
  partner_id: number;
  agent_id?: number;
  agent?: Agent;
  assigned_at?: string;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
  balance?: string;
  today_transaction_volume?: number;
  today_transaction_count?: number;
  pos_type?: string;
}

export interface TerminalListParams {
  terminal_id?: string;
  name?: string;
  search?: string;
  status?: 'active' | 'suspended' | 'revoked';
  assigned?: boolean;
  filter_agent_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface TerminalListResponse {
  success: boolean;
  data: Terminal[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface TerminalStats {
  today: {
    transactions: number;
    volume: number;
    successful: number;
    failed: number;
  };
  this_month: {
    transactions: number;
    volume: number;
    successful: number;
    failed: number;
  };
  inflow_totals?: {
    card?: {
      today_count: number;
      today_volume: number;
      month_count: number;
      month_volume: number;
    };
    transfer?: {
      today_count: number;
      today_volume: number;
      month_count: number;
      month_volume: number;
    };
    bill?: {
      today_count: number;
      today_volume: number;
      month_count: number;
      month_volume: number;
    };
  };
  last_transaction?: {
    created_at: string;
    status: string;
    amount: number;
    tran_id: string;
  };
}

export interface TerminalDetailsResponse {
  success: boolean;
  data: {
    terminal: Terminal;
    stats: TerminalStats;
  };
}

export interface TerminalSummary {
  success: boolean;
  data: {
    total: number;
    active: number;
    inactive: number;
    assigned: number;
    unassigned: number;
  };
}

export interface AssignTerminalRequest {
  agent_id: number;
  has_virtual_account?: boolean;
  bank_id?: number;
  account_number?: string;
  account_name?: string;
}

export interface AssignBySerialRequest extends AssignTerminalRequest {
  serial_number: string;
}

export interface BulkAssignRequest {
  terminal_ids: number[];
  agent_id: number;
}

export interface Transaction {
  id: number;
  user_id: number;
  pos_id: number;
  title: string;
  service: string;
  icon: string;
  description: string;
  narration: string;
  amount: string;
  discount: string;
  fee: string;
  total: string;
  init_bal: string;
  new_bal: string;
  from: string;
  to: string;
  profit: string;
  sys_fee: string;
  point: string;
  agg_share: string;
  sh_share: string;
  trx: string;
  ref: string;
  transactionRef: string | null;
  sessionId: string | null;
  purchase_code: string | null;
  rechargePIN: string | null;
  type: number;
  rrn: string;
  stan: string;
  maskedpan: string;
  cardscheme: string | null;
  status_code: string;
  status_desc: string;
  gateway: string;
  gateway_response: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionListParams {
  start_date?: string;
  end_date?: string;
  type?: string;
  status?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface TransactionListResponse {
  success: boolean;
  data: Transaction[];
  summary: {
    total_count: number;
    total_amount: number;
    total_fees: number;
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

class TerminalsService {
  /**
   * List terminals with pagination and filters
   * GET /api/partner-hub/terminals
   */
  async getTerminals(params?: TerminalListParams): Promise<TerminalListResponse> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.get(`/terminals${queryString}`);
  }

  /**
   * Get terminal statistics
   * GET /api/partner-hub/terminals/summary
   */
  async getSummary(): Promise<TerminalSummary> {
    return apiService.get('/terminals/summary');
  }

  /**
   * List unassigned terminals
   * GET /api/partner-hub/terminals/unassigned
   */
  async getUnassigned(): Promise<{ success: boolean; data: Terminal[] }> {
    return apiService.get('/terminals/unassigned');
  }

  /**
   * Get monitoring data for terminals (live status + alerts)
   * GET /api/partner-hub/terminals/monitoring
   */
  async getMonitoring(params?: Record<string, any>): Promise<any> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.get(`/terminals/monitoring${queryString}`);
  }

  /**
   * Get terminal details with stats
   * GET /api/partner-hub/terminals/{id}
   */
  async getTerminal(id: number | string): Promise<TerminalDetailsResponse> {
    return apiService.get(`/terminals/${id}`);
  }

  /**
   * Assign terminal to agent
   * POST /api/partner-hub/terminals/{id}/assign
   */
  async assignTerminal(id: number | string, data: AssignTerminalRequest): Promise<any> {
    return apiService.post(`/terminals/${id}/assign`, data);
  }

  /**
   * Unassign terminal from agent
   * POST /api/partner-hub/terminals/{id}/unassign
   */
  async unassignTerminal(id: number | string): Promise<any> {
    return apiService.post(`/terminals/${id}/unassign`);
  }

  /**
   * Toggle terminal status (active/inactive)
   * PATCH /api/partner-hub/terminals/{id}/toggle-status
   */
  async toggleStatus(id: number | string): Promise<any> {
    return apiService.patch(`/terminals/${id}/toggle-status`);
  }

  /**
   * Get terminal transactions with filtering
   * GET /api/partner-hub/terminals/{id}/transactions
   */
  async getTransactions(id: number | string, params?: TransactionListParams): Promise<TransactionListResponse> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.get(`/terminals/${id}/transactions${queryString}`);
  }

  async getRecentTransactions(id: number | string, params?: TransactionListParams): Promise<TransactionListResponse> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.get(`/terminals/${id}/recent-transactions${queryString}`);
  }

  /**
   * Export terminal transactions to Excel
   * GET /api/partner-hub/terminals/{id}/transactions/export
   */
  async exportTransactions(id: number | string, params?: TransactionListParams, filename?: string): Promise<void> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.downloadFile(`/terminals/${id}/transactions/export${queryString}`, filename);
  }

  /**
   * Bulk assign terminals to agent
   * POST /api/partner-hub/terminals/bulk-assign
   */
  async bulkAssign(data: BulkAssignRequest): Promise<any> {
    return apiService.post('/terminals/bulk-assign', data);
  }

  /**
   * Get terminal by serial number
   * POST /api/partner-hub/terminals/by-serial-number
   */
  async getBySerialNumber(serial_number: string): Promise<{ success: boolean; data: Terminal }> {
    return apiService.post('/terminals/by-serial-number', { serial_number });
  }

  /**
   * Assign terminal by serial number
   * POST /api/partner-hub/terminals/assign-by-serial
   */
  async assignBySerial(data: AssignBySerialRequest): Promise<any> {
    return apiService.post('/terminals/assign-by-serial', data);
  }

  /**
   * Add virtual account to terminal
   * POST /api/partner-hub/terminals/{id}/add-virtual-account
   */
  async addVirtualAccount(terminalId: number | string, data: { bank_id: number; account_number: string; account_name: string }): Promise<any> {
    return apiService.post(`/terminals/${terminalId}/add-virtual-account`, data);
  }

  /**
   * Remove virtual account from terminal
   * DELETE /api/partner-hub/terminals/{id}/remove-virtual-account
   */
  async removeVirtualAccount(terminalId: number | string): Promise<any> {
    return apiService.delete(`/terminals/${terminalId}/remove-virtual-account`);
  }
}

export const terminalsService = new TerminalsService();
export default terminalsService;
