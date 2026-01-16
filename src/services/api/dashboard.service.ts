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
  status: 'success' | 'failed' | 'pending';
  time: string;
  created_at: string;
}

export interface DashboardData {
  success: boolean;
  data: {
    stats: DashboardStats;
    transaction_volume: ChartData;
    terminal_activity: ChartData;
    recent_transactions: RecentTransaction[];
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
