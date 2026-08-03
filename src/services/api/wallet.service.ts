import apiService from '../ApiService';

// Wallet interfaces
export interface Wallet {
  id: number;
  partner_id?: number;
  agent_id?: number;
  available_balance: number;
  pending_balance: number;
  total_swept: number;
  total_settled: number;
  total_credited?: number;
  total_debited?: number;
  last_sweep_at: string | null;
  last_settlement_at: string | null;
  last_credit_at?: string | null;
  last_debit_at?: string | null;
  recent_transactions?: WalletTransaction[];
  created_at: string;
  updated_at: string;
  balance?: number;
  pending_settlements?: number;
}

export interface AgentWalletSummary {
  agent_id: number;
  agent_name: string;
  balance: number;
  available_balance: number;
  last_credit_at: string | null;
}

export interface WalletTransaction {
  id: number;
  wallet_id?: number;
  type: 'credit' | 'debit' | 'sweep_in' | 'settlement_out' | 'refund_in' | 'fee_out' | 'sweep' | 'settlement';
  reference?: string;
  amount: number;
  balance_before?: number;
  balance_after?: number;
  description: string;
  metadata?: Record<string, any> | null;
  status?: 'completed' | 'pending' | 'failed' | 'paid' | 'success' | 'error';
  direction?: 'credit' | 'debit';
  mode?: 'auto' | 'manual';
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

export interface SweepPreview {
  eligible_terminals: SweepableTerminal[];
  eligible_agent_wallets: AgentWalletSummary[];
  terminal_total_amount: number;
  agent_wallet_total_amount: number;
  total_amount: number;
}

export interface SweepSession {
  id: number;
  partner_id: number;
  mode: 'manual' | 'automatic';
  terminals_count: number;
  terminal_swept_count?: number;
  agent_wallet_swept_count?: number;
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
  source_type?: 'terminal' | 'agent_wallet';
  agent_id?: number;
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
  type?: 'sweep_in' | 'settlement_out' | 'refund_in' | 'fee_out' | 'sweep' | 'settlement';
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

export interface SweepPreviewResponse {
  status: string;
  data: SweepPreview;
}

export interface InitiateSweepRequest {
  terminal_ids?: number[];
  agent_ids?: number[];
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
  private agentWalletUrl = '/agent-wallet';
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
    try {
      return await apiService.get<WalletTransactionsResponse>(`${this.baseUrl}/history`, { params });
    } catch (error: any) {
      // Backward compatibility for older backend route
      if (error?.status === 404) {
        return apiService.get<WalletTransactionsResponse>(`${this.baseUrl}/transactions`, { params });
      }
      throw error;
    }
  }

  /**
   * Get agent wallet balance and info
   */
  async getAgentWallet(): Promise<WalletResponse> {
    return apiService.get<WalletResponse>(this.agentWalletUrl);
  }

  /**
   * Get agent wallet transaction history
   */
  async getAgentTransactions(params?: WalletTransactionsParams): Promise<WalletTransactionsResponse> {
    return apiService.get<WalletTransactionsResponse>(`${this.agentWalletUrl}/history`, { params });
  }

  /**
   * Get terminals with sweepable balance
   */
  async getSweepableTerminals(): Promise<SweepableTerminalsResponse> {
    return apiService.get<SweepableTerminalsResponse>('/terminals/sweepable');
  }

  /**
   * Get sweep preview for both terminals and agent wallets
   */
  async getSweepPreview(): Promise<SweepPreviewResponse> {
    try {
      return await apiService.get<SweepPreviewResponse>(`${this.sweepUrl}/preview`);
    } catch (error: any) {
      // Backward compatibility for older frontend flow that used terminal-only endpoint
      if (error?.status === 404) {
        const legacy = await this.getSweepableTerminals();
        return {
          status: legacy.status,
          data: {
            eligible_terminals: legacy.data,
            eligible_agent_wallets: [],
            terminal_total_amount: legacy.summary?.total_balance ?? 0,
            agent_wallet_total_amount: 0,
            total_amount: legacy.summary?.total_balance ?? 0,
          },
        };
      }
      throw error;
    }
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
    try {
      return await apiService.get<SweepSessionsResponse>(`${this.sweepUrl}/history`, { params });
    } catch (error: any) {
      // Backward compatibility for older backend route
      if (error?.status === 404) {
        return apiService.get<SweepSessionsResponse>(`${this.sweepUrl}/sessions`, { params });
      }
      throw error;
    }
  }

  /**
   * Get sweep session details
   */
  async getSweepSession(sessionId: number): Promise<{ status: string; data: SweepSession }> {
    try {
      return await apiService.get<{ status: string; data: SweepSession }>(`${this.sweepUrl}/${sessionId}`);
    } catch (error: any) {
      // Backward compatibility for older backend route
      if (error?.status === 404) {
        return apiService.get<{ status: string; data: SweepSession }>(`${this.sweepUrl}/sessions/${sessionId}`);
      }
      throw error;
    }
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
