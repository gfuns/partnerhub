import apiService from '../ApiService';
import {
  Ticket,
  TicketListItem,
  TicketDetail,
  TicketCategory,
  TicketMessage,
  TicketListParams,
  TicketListResponse,
  TicketDetailResponse,
  CategoriesResponse,
  CreateTicketRequest,
  CreateTicketResponse,
  AddMessageRequest,
  AddMessageResponse,
  UpdateTicketStatusRequest,
  EscalateTicketRequest,
  EscalateTicketResponse,
  CancelTicketRequest,
  TicketStatsResponse,
  TicketStatus,
} from '@/types/support';

class SupportService {
  // =====================================================
  // SHARED ENDPOINTS (used by both Agent and Partner)
  // =====================================================

  /**
   * Get ticket categories
   * GET /api/{context}/support/categories
   */
  async getCategories(): Promise<CategoriesResponse> {
    return apiService.get('/support/categories');
  }

  /**
   * Get ticket detail
   * GET /api/{context}/support/tickets/{id}
   */
  async getTicket(id: number | string): Promise<TicketDetailResponse> {
    return apiService.get(`/support/tickets/${id}`);
  }

  /**
   * Add message to ticket
   * POST /api/{context}/support/tickets/{id}/messages
   */
  async addMessage(ticketId: number | string, data: AddMessageRequest): Promise<AddMessageResponse> {
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      formData.append('message', data.message);
      if (data.is_internal) formData.append('is_internal', 'true');
      if ((data as any).sender_type) formData.append('sender_type', (data as any).sender_type);
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
      return apiService.postMultipart(`/support/tickets/${ticketId}/messages`, formData);
    }
    return apiService.post(`/support/tickets/${ticketId}/messages`, {
      message: data.message,
      is_internal: data.is_internal,
      ...(data as any).sender_type ? { sender_type: (data as any).sender_type } : {},
    });
  }

  // =====================================================
  // AGENT ENDPOINTS
  // =====================================================

  /**
   * List agent's tickets
   * GET /api/agent-hub/support/tickets
   */
  async getAgentTickets(params?: TicketListParams): Promise<TicketListResponse> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.get(`/support/tickets${queryString}`);
  }

  /**
   * Create ticket (Agent)
   * POST /api/agent-hub/support/tickets
   */
  async createAgentTicket(data: CreateTicketRequest): Promise<CreateTicketResponse> {
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      const categoryId = (data as any).support_category_id ?? (data as any).category_id;
      if (categoryId) formData.append('support_category_id', String(categoryId));
      formData.append('subject', data.subject);
      formData.append('description', data.description);
      if (data.terminal_id) formData.append('terminal_id', data.terminal_id.toString());
      if ((data as any).origin) formData.append('origin', (data as any).origin);
      const disputed = (data as any).disputed_amount ?? (data as any).amount;
      const txs = (data as any).transactions ?? (data as any).transaction_ids;
      if (disputed) formData.append('disputed_amount', String(disputed));
      if ((data as any).start_date) {
        formData.append('start_date', (data as any).start_date);
        formData.append('date_from', (data as any).start_date);
      }
      if ((data as any).end_date) {
        formData.append('end_date', (data as any).end_date);
        formData.append('date_to', (data as any).end_date);
      }
      if ((data as any).meta) {
        try {
          formData.append('meta', JSON.stringify((data as any).meta));
        } catch (e) {
          // ignore
        }
      }
      if (txs && Array.isArray(txs)) {
        txs.forEach((id: any) => formData.append('transactions[]', String(id)));
      }
      if (data.priority) formData.append('priority', data.priority);
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
      return apiService.postMultipart('/support/tickets', formData);
    }
    return apiService.post('/support/tickets', data);
  }

  /**
   * Cancel ticket (Agent - only if they created it)
   * POST /api/agent-hub/support/tickets/{id}/cancel
   */
  async cancelAgentTicket(ticketId: number | string, data?: CancelTicketRequest): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/support/tickets/${ticketId}/cancel`, data || {});
  }

  /**
   * Get agent ticket stats
   * GET /api/agent-hub/support/stats
   */
  async getAgentTicketStats(): Promise<TicketStatsResponse> {
    return apiService.get('/support/stats');
  }

  // =====================================================
  // PARTNER ENDPOINTS
  // =====================================================

  /**
   * List partner's tickets (all under partner)
   * GET /api/partner-hub/support/tickets
   */
  async getPartnerTickets(params?: TicketListParams): Promise<TicketListResponse> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.get(`/support/tickets${queryString}`);
  }

  /**
   * Create ticket (Partner - can be on behalf of agent/terminal)
   * POST /api/partner-hub/support/tickets
   */
  async createPartnerTicket(data: CreateTicketRequest): Promise<CreateTicketResponse> {
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      const categoryId = (data as any).support_category_id ?? (data as any).category_id;
      if (categoryId) formData.append('support_category_id', String(categoryId));
      formData.append('subject', data.subject);
      formData.append('description', data.description);
      if (data.agent_id) formData.append('agent_id', data.agent_id.toString());
      if (data.terminal_id) formData.append('terminal_id', data.terminal_id.toString());
      if ((data as any).origin) formData.append('origin', (data as any).origin);
      const disputedP = (data as any).disputed_amount ?? (data as any).amount;
      const txsP = (data as any).transactions ?? (data as any).transaction_ids;
      if (disputedP) formData.append('disputed_amount', String(disputedP));
      if ((data as any).start_date) {
        formData.append('start_date', (data as any).start_date);
        formData.append('date_from', (data as any).start_date);
      }
      if ((data as any).end_date) {
        formData.append('end_date', (data as any).end_date);
        formData.append('date_to', (data as any).end_date);
      }
      if ((data as any).meta) {
        try {
          formData.append('meta', JSON.stringify((data as any).meta));
        } catch (e) {}
      }
      if (txsP && Array.isArray(txsP)) {
        txsP.forEach((id: any) => formData.append('transactions[]', String(id)));
      }
      if (data.priority) formData.append('priority', data.priority);
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
      return apiService.postMultipart('/support/tickets', formData);
    }
    return apiService.post('/support/tickets', data);
  }

  /**
   * Convenience createTicket - POST /api/{context}/support/tickets
   * Uses ApiService prefix to target agent or partner hub based on login type
   */
  async createTicket(data: CreateTicketRequest): Promise<CreateTicketResponse> {
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      const categoryId = (data as any).support_category_id ?? (data as any).category_id;
      if (categoryId) formData.append('support_category_id', String(categoryId));
      formData.append('subject', data.subject);
      formData.append('description', data.description);
      if (data.agent_id) formData.append('agent_id', data.agent_id.toString());
      if (data.terminal_id) formData.append('terminal_id', data.terminal_id.toString());
      if ((data as any).origin) formData.append('origin', (data as any).origin);
      const disputedT = (data as any).disputed_amount ?? (data as any).amount;
      const txsT = (data as any).transactions ?? (data as any).transaction_ids;
      if (disputedT) formData.append('disputed_amount', String(disputedT));
      if ((data as any).start_date) {
        formData.append('start_date', (data as any).start_date);
        formData.append('date_from', (data as any).start_date);
      }
      if ((data as any).end_date) {
        formData.append('end_date', (data as any).end_date);
        formData.append('date_to', (data as any).end_date);
      }
      if ((data as any).meta) {
        try {
          formData.append('meta', JSON.stringify((data as any).meta));
        } catch (e) {}
      }
      if (txsT && Array.isArray(txsT)) {
        txsT.forEach((id: any) => formData.append('transactions[]', String(id)));
      }
      if (data.priority) formData.append('priority', data.priority);
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
      return apiService.postMultipart('/support/tickets', formData);
    }
    return apiService.post('/support/tickets', data);
  }

  /**
   * Generic tickets list endpoint that works for agent or partner context
   */
  async getTickets(params?: Record<string, any>): Promise<TicketListResponse> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.get(`/support/tickets${queryString}`);
  }

  /**
   * Update ticket status (Partner)
   * PUT /api/partner-hub/support/tickets/{id}/status
   */
  async updateTicketStatus(ticketId: number | string, data: UpdateTicketStatusRequest): Promise<{ success: boolean; message: string; data: { ticket: Ticket } }> {
    return apiService.put(`/support/tickets/${ticketId}/status`, data);
  }

  /**
   * Escalate ticket to Xtrapay (Partner)
   * POST /api/partner-hub/support/tickets/{id}/escalate
   */
  async escalateTicket(ticketId: number | string, data?: EscalateTicketRequest): Promise<EscalateTicketResponse> {
    return apiService.post(`/support/tickets/${ticketId}/escalate`, data || {});
  }

  /**
   * Cancel ticket (Partner)
   * POST /api/partner-hub/support/tickets/{id}/cancel
   */
  async cancelPartnerTicket(ticketId: number | string, data?: CancelTicketRequest): Promise<{ success: boolean; message: string }> {
    return apiService.post(`/support/tickets/${ticketId}/cancel`, data || {});
  }

  /**
   * Get partner ticket stats
   * GET /api/partner-hub/support/stats
   */
  async getPartnerTicketStats(): Promise<TicketStatsResponse> {
    return apiService.get('/support/stats');
  }

  /**
   * Get agents list for ticket creation (Partner)
   * GET /api/partner-hub/agents/dropdown
   */
  async getAgentsDropdown(): Promise<{ success: boolean; data: Array<{ id: number; code: string; business_name: string }> }> {
    return apiService.get('/agents/dropdown');
  }

  /**
   * Get terminals for agent (Partner)
   * GET /api/partner-hub/agents/{agentId}/terminals/dropdown
   */
  async getAgentTerminalsDropdown(agentId: number): Promise<{ success: boolean; data: Array<{ id: number; terminal_id: string; serial_number: string }> }> {
    return apiService.get(`/agents/${agentId}/terminals/dropdown`);
  }
}

export const supportService = new SupportService();
export default supportService;
