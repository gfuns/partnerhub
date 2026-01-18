import apiService from '../ApiService';

// Commission Types
export type CommissionType = 'percentage' | 'flat';
export type ServiceCategory = 'pos' | 'bills' | 'transfers' | 'collections';

// Service Type
export interface ServiceType {
  id: number;
  name: string;
  slug: string;
  category: ServiceCategory;
  icon: string;
  is_active: boolean;
}

// Commission interfaces
export interface Commission {
  id: number;
  service_type_id: number;
  service_type?: ServiceType;
  type: CommissionType;
  value: number;
  cap: number;
  min_amount: number | null;
  max_amount: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Partner Commission (with markup)
export interface PartnerCommission {
  id: number;
  service_type_id: number;
  service_type: ServiceType;
  xtrapay_base: {
    type: CommissionType;
    value: number;
    cap: number;
  };
  partner_markup: {
    type: CommissionType;
    value: number;
    cap: number;
  } | null;
  effective_rate: {
    type: CommissionType;
    value: number;
    cap: number;
  };
  is_active: boolean;
}

// Effective Commission (for agents - view only)
export interface EffectiveCommission {
  id: number;
  service_type_id: number;
  service_type: ServiceType;
  type: CommissionType;
  value: number;
  cap: number;
  min_amount: number | null;
  max_amount: number | null;
}

// Request/Response interfaces
export interface CommissionListParams {
  category?: ServiceCategory;
  page?: number;
  per_page?: number;
}

export interface CommissionListResponse {
  status: string;
  data: {
    commissions: Array<{
      service_type: ServiceType;
      xtrapay_commission: {
        type: CommissionType;
        value: string | number;
        cap: string | number;
      };
      partner_markup: ({
        id?: number;
        type: CommissionType;
        value: string | number;
        cap: string | number;
        is_active?: boolean;
      }) | null;
      has_partner_markup: boolean;
    }>;
    service_categories: Record<string, string>;
  };
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface EffectiveCommissionResponse {
  status: string;
  data: EffectiveCommission[];
}

export interface SetCommissionRequest {
  service_type_id: number;
  type: CommissionType;
  value: number;
  cap?: number;
}

export interface BulkSetCommissionRequest {
  commissions: SetCommissionRequest[];
}

export interface CommissionResponse {
  status: string;
  message: string;
  data: PartnerCommission;
}

export interface BulkCommissionResponse {
  status: string;
  message: string;
  data: {
    updated: number;
    failed: number;
    errors?: Record<string, string>;
  };
}

// Fee calculation helper
export function calculateFee(amount: number, type: CommissionType, value: number, cap: number): number {
  let fee: number;
  if (type === 'percentage') {
    fee = amount * (value / 100);
  } else {
    fee = value;
  }
  
  if (cap > 0 && fee > cap) {
    fee = cap;
  }
  
  return fee;
}

// Format money helper
export function formatMoney(amount: number, currency: string = '₦'): string {
  return currency + Number(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Commission Service
class CommissionService {
  private baseUrl = '/commissions';

  /**
   * Get all partner commissions with Xtrapay base rates
   */
  async getCommissions(params?: CommissionListParams): Promise<CommissionListResponse> {
    return apiService.get<CommissionListResponse>(this.baseUrl, { params });
  }

  /**
   * Get effective rates (final rates that agents see)
   */
  async getEffectiveRates(): Promise<EffectiveCommissionResponse> {
    return apiService.get<EffectiveCommissionResponse>(`${this.baseUrl}/effective`);
  }

  /**
   * Set or update partner markup for a service
   */
  async setCommission(data: SetCommissionRequest): Promise<CommissionResponse> {
    return apiService.post<CommissionResponse>(this.baseUrl, data);
  }

  /**
   * Bulk update partner markups
   */
  async bulkSetCommissions(data: BulkSetCommissionRequest): Promise<BulkCommissionResponse> {
    return apiService.post<BulkCommissionResponse>(`${this.baseUrl}/bulk`, data);
  }

  /**
   * Remove partner markup for a service (revert to base rate)
   */
  async removeCommission(serviceTypeId: number): Promise<{ status: string; message: string }> {
    return apiService.delete(`${this.baseUrl}/${serviceTypeId}`);
  }

  /**
   * Terminal-level commissions
   * These endpoints allow overriding partner markups at a specific terminal.
   */
  async getTerminalCommissions(terminalId: number | string, params?: CommissionListParams): Promise<CommissionListResponse> {
    return apiService.get<CommissionListResponse>(`/terminals/${terminalId}/commissions`, { params });
  }

  async setTerminalCommission(terminalId: number | string, data: SetCommissionRequest): Promise<CommissionResponse> {
    return apiService.post<CommissionResponse>(`/terminals/${terminalId}/commissions`, data);
  }

  async bulkSetTerminalCommissions(terminalId: number | string, data: BulkSetCommissionRequest): Promise<BulkCommissionResponse> {
    return apiService.post<BulkCommissionResponse>(`/terminals/${terminalId}/commissions/bulk`, data);
  }

  async removeTerminalCommission(terminalId: number | string, serviceTypeId: number): Promise<{ status: string; message: string }> {
    return apiService.delete(`/terminals/${terminalId}/commissions/${serviceTypeId}`);
  }
}

export const commissionService = new CommissionService();
export default commissionService;
