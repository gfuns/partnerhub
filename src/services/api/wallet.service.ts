import apiService from '../ApiService';

// Wallet interfaces
export interface Wallet {
  id: number;
  partner_id: number;
  available_balance: number;
  pending_balance: number;
  total_swept: number;
  total_settled: number;
  last_sweep_at: string | null;
  last_settlement_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: number;
  wallet_id: number;
  type: 'sweep_in' | 'settlement_out' | 'refund_in' | 'fee_out';
  reference: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  metadata: Record<string, any> | null;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

// Sweep interfaces
export interface SweepableTerminal {
  id: number;
  terminal_id: string;
  agent_name: string;
  agent_code: string;
  balance: number;
  last_transaction_at: string | null;
}

export interface SweepSession {
  id: number;
  partner_id: number;
  mode: 'manual' | 'automatic';
  terminals_count: number;
  total_amount: number;
  status: 'completed' | 'partial' | 'failed';
  initiated_by: {
    id: number;
    name: string;
  } | null;
  completed_at: string | null;
  created_at: string;
  terminals?: SweepTerminalDetail[];
}

export interface SweepTerminalDetail {
  terminal_id: string;
  agent_name: string;
  amount: number;
  status: 'success' | 'failed';
  error?: string;
}

export interface SweepConfig {
  auto_sweep_enabled: boolean;
  sweep_schedule: 'daily' | 'weekly' | 'monthly' | null;
  sweep_time: string | null;
  min_sweep_amount: number;
}

// Request/Response interfaces
export interface WalletResponse {
  status: string;
  data: Wallet;
}

export interface WalletTransactionsParams {
  type?: 'sweep_in' | 'settlement_out' | 'refund_in' | 'fee_out';
  status?: 'completed' | 'pending' | 'failed';
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface WalletTransactionsResponse {
  status: string;
  data: WalletTransaction[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface SweepableTerminalsResponse {
  status: string;
  data: SweepableTerminal[];
  summary: {
    total_terminals: number;
    total_balance: number;
  };
}

export interface InitiateSweepRequest {
  terminal_ids: number[];
}

export interface InitiateSweepResponse {
  status: string;
  message: string;
  data: SweepSession;
}

export interface SweepSessionsParams {
  status?: 'completed' | 'partial' | 'failed';
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface SweepSessionsResponse {
  status: string;
  data: SweepSession[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface SweepConfigResponse {
  status: string;
  data: SweepConfig;
}

export interface UpdateSweepConfigRequest {
  auto_sweep_enabled?: boolean;
  sweep_schedule?: 'daily' | 'weekly' | 'monthly';
  sweep_time?: string;
  min_sweep_amount?: number;
}

// Wallet Service
class WalletService {
  private baseUrl = '/wallet';
  private sweepUrl = '/sweep';

  /**
   * Get wallet balance and info
   */
  async getWallet(): Promise<WalletResponse> {
    return apiService.get<WalletResponse>(this.baseUrl);
  }

  /**
   * Get wallet transaction history
   */
  async getTransactions(params?: WalletTransactionsParams): Promise<WalletTransactionsResponse> {
    return apiService.get<WalletTransactionsResponse>(`${this.baseUrl}/transactions`, { params });
  }

  /**
   * Get terminals with sweepable balance
   */
  async getSweepableTerminals(): Promise<SweepableTerminalsResponse> {
    return apiService.get<SweepableTerminalsResponse>('/terminals/sweepable');
  }

  /**
   * Initiate manual sweep for selected terminals
   */
  async initiateSweep(data: InitiateSweepRequest): Promise<InitiateSweepResponse> {
    return apiService.post<InitiateSweepResponse>(this.sweepUrl, data);
  }

  /**
   * Get sweep history/sessions
   */
  async getSweepSessions(params?: SweepSessionsParams): Promise<SweepSessionsResponse> {
    return apiService.get<SweepSessionsResponse>(`${this.sweepUrl}/sessions`, { params });
  }

  /**
   * Get sweep session details
   */
  async getSweepSession(sessionId: number): Promise<{ status: string; data: SweepSession }> {
    return apiService.get<{ status: string; data: SweepSession }>(`${this.sweepUrl}/sessions/${sessionId}`);
  }

  /**
   * Get sweep configuration
   */
  async getSweepConfig(): Promise<SweepConfigResponse> {
    return apiService.get<SweepConfigResponse>(`${this.sweepUrl}/config`);
  }

  /**
   * Update sweep configuration
   */
  async updateSweepConfig(data: UpdateSweepConfigRequest): Promise<SweepConfigResponse> {
    return apiService.put<SweepConfigResponse>(`${this.sweepUrl}/config`, data);
  }
}

export const walletService = new WalletService();
export default walletService;
