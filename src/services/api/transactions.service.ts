import apiService from '../ApiService';

export interface Transaction {
  id: number;
  trx: string;
  ref: string;
  rrn: string;
  type: number;
  type_name: string;
  amount: number;
  amount_formatted: string;
  fee: number;
  fee_formatted: string;
  status: string;
  status_code: string;
  status_desc: string;
  narration: string;
  gateway: string;
  maskedpan: string;
  cardscheme: string | null;
  terminal_id: string;
  terminal_name: string | null;
  agent_name: string;
  agent_code: string;
  created_at: string;
  source?: string;
  time_ago: string;
}

export interface TransactionListParams {
  search?: string;
  status?: string;
  type?: string;
  terminal_id?: number;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  per_page?: number;
  page?: number;
}

export interface TransactionListResponse {
  success: boolean;
  data: Transaction[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface TransactionSummary {
  success: boolean;
  data: {
    today: {
      count: number;
      volume: number;
      fees: number;
    };
    yesterday: {
      count: number;
      volume: number;
      fees: number;
    };
    this_week: {
      count: number;
      volume: number;
      fees: number;
    };
    this_month: {
      count: number;
      volume: number;
      fees: number;
    };
  };
}

export interface TransactionTrends {
  success: boolean;
  data: {
    daily: Array<{
      date: string;
      count: number;
      volume: number;
    }>;
    weekly: Array<{
      week: string;
      count: number;
      volume: number;
    }>;
    monthly: Array<{
      month: string;
      count: number;
      volume: number;
    }>;
  };
}

export interface TransactionDetailsResponse {
  success: boolean;
  data: Transaction;
}

class TransactionsService {
  /**
   * List transactions with filters and pagination
   * GET /api/partner-hub/transactions
   */
  async getTransactions(params?: TransactionListParams): Promise<TransactionListResponse> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.get(`/transactions${queryString}`);
  }

  /**
   * Get transaction summary statistics
   * GET /api/partner-hub/transactions/summary
   */
  async getSummary(): Promise<TransactionSummary> {
    return apiService.get('/transactions/summary');
  }

  /**
   * Get transaction trends
   * GET /api/partner-hub/transactions/trends
   */
  async getTrends(params?: { period?: string }): Promise<TransactionTrends> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.get(`/transactions/trends${queryString}`);
  }

  /**
   * Export transactions to Excel
   * GET /api/partner-hub/transactions/export
   */
  exportTransactions(params?: TransactionListParams): void {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const urlParams = new URLSearchParams();
    urlParams.append('token', token);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          urlParams.append(key, String(value));
        }
      });
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const exportUrl = `${apiBaseUrl}/api/partner-hub/transactions/export?${urlParams.toString()}`;
    
    window.open(exportUrl, '_blank');
  }

  /**
   * Get transaction details
   * GET /api/partner-hub/transactions/{id}
   */
  async getTransaction(id: number | string): Promise<TransactionDetailsResponse> {
    return apiService.get(`/transactions/${id}`);
  }
}

export const transactionsService = new TransactionsService();
export default transactionsService;
