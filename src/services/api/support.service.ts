import apiService from '../ApiService';

export interface Category {
  id: number;
  name: string;
  requires_terminal?: boolean;
  requires_agent?: boolean;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender: string;
  sender_role: string;
  body: string;
  attachments?: any[];
  created_at: string;
}

export interface Ticket {
  id: number | string;
  ticket_ref?: string;
  origin?: string;
  category?: Category;
  subject?: string;
  description?: string;
  terminal_id?: number | null;
  agent_id?: number | null;
  assigned_to?: 'partner' | 'xtrapay' | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  messages?: TicketMessage[];
}

export interface TicketListParams {
  status?: string;
  category?: string | number;
  terminal_id?: number | string;
  agent_id?: number | string;
  origin?: string;
  per_page?: number;
  page?: number;
}

export interface TicketListResponse {
  success: boolean;
  data: Ticket[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface TicketDetailsResponse {
  success: boolean;
  data: Ticket;
}

export interface CreateTicketRequest {
  category_id: number;
  subject: string;
  description: string;
  terminal_id?: number | null;
  agent_id?: number | null;
  origin?: string;
}

class SupportService {
  async getCategories(): Promise<{ success: boolean; data: Category[] }> {
    return apiService.get('/support/categories');
  }

  async getTickets(params?: TicketListParams): Promise<TicketListResponse> {
    const qs = params ? apiService.buildQueryString(params as any) : '';
    return apiService.get(`/support/tickets${qs}`);
  }

  async getTicket(id: number | string): Promise<TicketDetailsResponse> {
    return apiService.get(`/support/tickets/${id}`);
  }

  async createTicket(payload: CreateTicketRequest, attachments?: File[]): Promise<any> {
    if (attachments && attachments.length) {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      attachments.forEach((f) => fd.append('attachments[]', f));
      return apiService.postMultipart('/support/tickets', fd);
    }

    return apiService.post('/support/tickets', payload);
  }

  async addMessage(ticketId: number | string, body: string, attachments?: File[]) {
    if (attachments && attachments.length) {
      const fd = new FormData();
      fd.append('body', body);
      attachments.forEach((f) => fd.append('attachments[]', f));
      return apiService.postMultipart(`/support/tickets/${ticketId}/messages`, fd);
    }

    return apiService.post(`/support/tickets/${ticketId}/messages`, { body });
  }

  async escalateToXtrapay(ticketId: number | string) {
    return apiService.post(`/support/tickets/${ticketId}/escalate`);
  }

  async updateStatus(ticketId: number | string, status: string) {
    return apiService.patch(`/support/tickets/${ticketId}/status`, { status });
  }
}

export const supportService = new SupportService();
export default supportService;
