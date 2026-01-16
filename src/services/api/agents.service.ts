import apiService from '../ApiService';

export interface KycProfile {
  id: number;
  agent_id: number;
  business_type: string;
  id_type: string | null;
  id_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  rc_number: string | null;
  tin_number: string | null;
  cac_document: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  bvn: string | null;
  data: any | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KycDocument {
  id: number;
  type?: string;
  document_name: string;
  document_type: string;
  status: string;
  file_url: string;
}

export interface AgentTerminal {
  id: number;
  terminal_id: string;
  serial_number: string;
  status: string;
}

export interface AgentUser {
  id: number;
  partner_user_id: number;
  partner_id: number;
  agent_id: number;
  role: string;
  is_primary: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  partner_user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    status: string;
    must_change_password: boolean;
    email_verified_at: string | null;
    last_login_at: string | null;
    last_login_ip: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

export interface Agent {
  id: number;
  partner_id: number;
  code: string;
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  lga: string | null;
  status?: 'active' | 'pending' | 'suspended';
  kyc_status: 'pending' | 'pending_onboarding' | 'in_review' | 'approved' | 'rejected' | 'pending_review';
  kyc_submitted_at: string | null;
  kyc_approved_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  kyc_profile?: KycProfile;
  kyc_documents?: KycDocument[];
  terminals?: AgentTerminal[];
  user_contexts?: AgentUser[];
}

export interface AgentStats {
  total_terminals: number;
  active_terminals: number;
  today: {
    transactions: number;
    volume: number;
    success_rate: number;
  };
  this_month: {
    transactions: number;
    volume: number;
    success_rate: number;
  };
}

export interface AgentDetailsResponse {
  success: boolean;
  data: {
    agent: Agent;
    stats: AgentStats;
  };
}

export interface AgentListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: 'active' | 'pending' | 'suspended';
  kyc_status?: 'pending' | 'in_review' | 'approved' | 'rejected';
  business_type?: 'individual' | 'sole_proprietorship' | 'limited_company' | 'partnership';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface AgentListResponse {
  success: boolean;
  data: Agent[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface AgentSummary {
  success: boolean;
  data: {
    total: number;
    active: number;
    pending_kyc: number;
    suspended: number;
    by_business_type: {
      individual: number;
      sole_proprietorship: number;
      limited_company: number;
      partnership: number;
    };
  };
}

export interface CreateAgentRequest {
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  lga?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  owner_email?: string;
  owner_phone?: string;
}

export interface CreateAgentResponse {
  success: boolean;
  message: string;
  data: {
    agent: Agent;
  };
}

export interface UpdateAgentRequest {
  business_name?: string;
  address?: string;
  city?: string;
  state?: string;
  lga?: string;
}

export interface UpdateAgentResponse {
  success: boolean;
  message: string;
  data: {
    agent: Agent;
  };
}

export interface ToggleStatusResponse {
  success: boolean;
  message: string;
  data: {
    agent: Agent;
  };
}

export interface DeleteAgentResponse {
  success: boolean;
  message: string;
}

export interface TerminalBySerialNumberRequest {
  serial_number: string;
}

export interface TerminalDetails {
  id: number;
  terminal_id: string;
  serial_number: string;
  partner_id: number;
  agent_id: number | null;
  status: string;
  pos_type: string;
}

export interface TerminalBySerialNumberResponse {
  success: boolean;
  data: TerminalDetails;
  message?: string;
}

export interface AssignTerminalBySerialRequest {
  serial_number: string;
  agent_id: number;
  has_virtual_account?: boolean;
  bank_id?: number;
  account_number?: string;
  account_name?: string;
}

export interface AssignTerminalBySerialResponse {
  success: boolean;
  message: string;
  data: {
    terminal: TerminalDetails;
  };
}

export interface Bank {
  id: number;
  name: string;
  code: string;
  active: boolean;
}

export interface BanksListResponse {
  success: boolean;
  data: Bank[];
  message?: string;
}

export interface VerifyAccountRequest {
  account_number: string;
  bank_code: string;
}

export interface VerifyAccountResponse {
  success: boolean;
  data: {
    bankCode: string;
    accountName: string;
    accountNumber: string;
    transactionReference: string;
    bvn: string;
    responseMessage: string;
    responseCode: string;
  };
  message?: string;
}

class AgentsService {
  /**
   * List agents with pagination and filters
   */
  async getAgents(params?: AgentListParams): Promise<AgentListResponse> {
    return apiService.get('/agents', { params });
  }

  /**
   * Get agent statistics summary
   */
  async getSummary(): Promise<AgentSummary> {
    return apiService.get('/agents/summary');
  }

  /**
   * Get agent details with stats
   */
  async getAgent(id: number): Promise<AgentDetailsResponse> {
    return apiService.get(`/agents/${id}`);
  }

  /**
   * Create new agent
   */
  async createAgent(data: CreateAgentRequest): Promise<CreateAgentResponse> {
    return apiService.post('/agents', data);
  }

  /**
   * Update agent
   */
  async updateAgent(id: number, data: UpdateAgentRequest): Promise<UpdateAgentResponse> {
    return apiService.put(`/agents/${id}`, data);
  }

  /**
   * Toggle agent status (active ↔ suspended)
   */
  async toggleStatus(id: number): Promise<ToggleStatusResponse> {
    return apiService.patch(`/agents/${id}/toggle-status`);
  }

  /**
   * Delete agent
   */
  async deleteAgent(id: number): Promise<DeleteAgentResponse> {
    return apiService.delete(`/agents/${id}`);
  }

  /**
   * Get terminal details by serial number
   */
  async getTerminalBySerialNumber(data: TerminalBySerialNumberRequest): Promise<TerminalBySerialNumberResponse> {
    return apiService.post('/terminals/by-serial-number', data);
  }

  /**
   * Assign terminal to agent by serial number
   */
  async assignTerminalBySerial(data: AssignTerminalBySerialRequest): Promise<AssignTerminalBySerialResponse> {
    return apiService.post('/terminals/assign-by-serial', data);
  }

  /**
   * Get list of banks
   */
  async getBanks(): Promise<BanksListResponse> {
    return apiService.get('/banks');
  }

  /**
   * Verify bank account details
   */
  async verifyAccount(data: VerifyAccountRequest): Promise<VerifyAccountResponse> {
    return apiService.post('/banks/verify', data);
  }
}

export const agentsService = new AgentsService();
export default agentsService;
