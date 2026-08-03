import apiService from '../ApiService';

export interface StatValue {
  value: number;
  change?: number;
  change_label?: string;
  percentage?: number;
  label?: string;
  formatted?: string;
}

export interface DashboardStats {
  total_terminals: StatValue;
  active_terminals: StatValue;
  todays_volume: StatValue;
  failed_transactions: StatValue;
  card_transactions?: {
    count: number;
    volume: number;
    formatted_volume: string;
  };
  transfer_transactions?: {
    count: number;
    volume: number;
    formatted_volume: string;
  };
}

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface RecentTransaction {
  id: number;
  reference: string;
  terminal: string;
  agent: string;
  amount: number;
  amount_formatted: string;
  status: string;
  time: string;
  created_at: string;
  terminal_name?: string;
  title?: string;
}

export interface WalletTransactionSummary {
  id: number;
  type: string;
  amount: string;
  currency: string;
  balance_before: string;
  balance_after: string;
  reference: string;
  channel: string;
  description: string;
  created_at: string;
}

export interface DashboardWallet {
  scope: string;
  balance: string;
  available_balance: number;
  total_credited: string;
  total_debited: string;
  last_credit_at: string | null;
  last_debit_at: string | null;
  recent_transactions: WalletTransactionSummary[];
}

export interface VirtualAccount {
  id: number;
  partner_id: number | null;
  agent_id: number | null;
  bank_name: string;
  bank_slug: string;
  account_name: string;
  account_number: string;
  reference: string;
  assignment: string;
  used: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_partner_owned: number;
  user_id?: number | null;
  account_id?: number | null;
  pos_id?: number | null;
  bvn?: string | null;
  rcNumber?: string | null;
  incorporationDate?: string | null;
  accountType?: string | null;
  deleted_at?: string | null;
}

export interface DashboardData {
  success: boolean;
  data: {
    stats: DashboardStats;
    transaction_volume: ChartData;
    terminal_activity: ChartData;
    recent_transactions: RecentTransaction[];
    wallet?: DashboardWallet | null;
    virtual_account?: VirtualAccount | null;
  };
}

export interface GetDashboardParams {
  start_date?: string;
  end_date?: string;
}

class DashboardService {
  /**
   * Get full dashboard data (stats, charts, activity)
   */
  async getDashboard(params?: GetDashboardParams): Promise<DashboardData> {
    return apiService.get('/dashboard', { params });
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
