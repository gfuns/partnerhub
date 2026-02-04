// Support/Ticketing Types

export type TicketOrigin = 'terminal' | 'agent_dashboard' | 'partner_hub' | 'xtrapay_admin';

export type TicketStatus = 
  | 'open'
  | 'in_progress'
  | 'awaiting_partner'
  | 'awaiting_xtrapay'
  | 'awaiting_agent'
  | 'resolved'
  | 'closed'
  | 'canceled';

export type AssignmentType = 'partner' | 'xtrapay';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

// Category with rules
export interface TicketCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  requires_terminal: boolean;
  requires_agent: boolean;
  requires_transaction?: boolean;
  allows_multiple_transactions?: boolean;
  requires_amount?: boolean;
  requires_date_range?: boolean;
  requires_evidence?: boolean;
  evidence_types?: string[];
  auto_priority?: TicketPriority | string;
  auto_assignment?: string;
  default_priority: TicketPriority;
  sla_hours?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Ticket Attachment
export interface TicketAttachment {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

// Ticket Message
export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_type: 'agent' | 'partner' | 'xtrapay';
  sender_id: number;
  sender_name: string;
  message: string;
  is_internal: boolean; // Internal notes - not visible to agent
  attachments: TicketAttachment[];
  created_at: string;
}

// Agent Info (simplified)
export interface TicketAgentInfo {
  id: number;
  code: string;
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  name?: string;
  phone?: string;
}

// Terminal Info (simplified)
export interface TicketTerminalInfo {
  id: number;
  terminal_id: string;
  serial_number: string;
  status: string;
}

// Partner Info (simplified)
export interface TicketPartnerInfo {
  id: number;
  code: string;
  name: string;
  logo_url?: string;
}

// Main Ticket interface
export interface Ticket {
  id: number;
  ticket_number: string;
  ticket_ref?: string;
  origin: TicketOrigin;
  category_id: number;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to_type: AssignmentType;
  assigned_to_partner_id?: number;
  assigned_to_xtrapay_user_id?: number;
  // Relationships
  partner_id: number;
  partner?: TicketPartnerInfo;
  agent_id?: number;
  agent?: TicketAgentInfo;
  terminal_id?: number;
  terminal?: TicketTerminalInfo;
  // Creator info
  created_by_type: 'agent' | 'partner' | 'xtrapay';
  created_by_id: number;
  created_by_name: string;
  opened_by_type?: string;
  opened_by_id?: number;
  // Closure info
  closed_by_type?: string;
  closed_by_id?: number;
  closed_reason?: string;
  // Financial info
  disputed_amount?: number;
  expected_amount?: number;
  customer_charged_amount?: number;
  settlement_impact_amount?: number;
  // Escalation
  escalated_to_xtrapay_at?: string;
  escalated_by_partner_user_id?: number;
  // Timestamps
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  last_response_at?: string;
  // Counts
  message_count: number;
  unread_count?: number;
  // Flags
  is_escalated: boolean;
  escalated_at?: string;
}

// Ticket List Item (simplified for list views)
export interface TicketListItem {
  id: number;
  ticket_number: string;
  origin: TicketOrigin;
  category_name: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to_type: AssignmentType;
  agent_name?: string;
  terminal_id?: string;
  created_at: string;
  updated_at: string;
  is_escalated: boolean;
}

// Ticket Detail (full view)
export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
  attachments: TicketAttachment[];
  internal_notes?: TicketMessage[];
  transactions?: Array<{
    id: number;
    transaction_id: string;
    amount: number;
    rrn: string;
    stan: string;
    status: string;
    created_at: string;
  }>;
}

// =====================================================
// API Request/Response Types
// =====================================================

// List tickets params
export interface TicketListParams {
  status?: TicketStatus | 'all';
  category_id?: number;
  origin?: TicketOrigin;
  agent_id?: number;
  terminal_id?: number;
  assigned_to_type?: AssignmentType;
  priority?: TicketPriority;
  search?: string;
  start_date?: string;
  end_date?: string;
  per_page?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// List tickets response
export interface TicketListResponse {
  success: boolean;
  data: TicketListItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Ticket detail response
export interface TicketDetailResponse {
  success: boolean;
  data: TicketDetail;
}

// Categories response
export interface CategoriesResponse {
  success: boolean;
  data: TicketCategory[];
}

// Create ticket request
export interface CreateTicketRequest {
  category_id: number;
  subject: string;
  description: string;
  terminal_id?: number;
  agent_id?: number;
  priority?: TicketPriority;
  attachments?: File[];
}

// Create ticket response
export interface CreateTicketResponse {
  success: boolean;
  message: string;
  data: {
    ticket: Ticket;
  };
}

// Add message request
export interface AddMessageRequest {
  message: string;
  is_internal?: boolean;
  attachments?: File[];
}

// Add message response
export interface AddMessageResponse {
  success: boolean;
  message: string;
  data: {
    ticket_message: TicketMessage;
  };
}

// Update status request
export interface UpdateTicketStatusRequest {
  status: TicketStatus;
  comment?: string;
}

// Escalate ticket request
export interface EscalateTicketRequest {
  reason?: string;
}

// Escalate ticket response
export interface EscalateTicketResponse {
  success: boolean;
  message: string;
  data: {
    ticket: Ticket;
  };
}

// Cancel ticket request
export interface CancelTicketRequest {
  reason?: string;
}

// Ticket stats (for dashboard)
export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  awaiting_response: number;
  resolved: number;
  escalated: number;
}

export interface TicketStatsResponse {
  success: boolean;
  data: TicketStats;
}

// =====================================================
// UI Helper Constants
// =====================================================

export const TICKET_STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_partner', label: 'Awaiting Partner' },
  { value: 'awaiting_xtrapay', label: 'Awaiting Xtrapay' },
  { value: 'awaiting_agent', label: 'Awaiting Agent' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'canceled', label: 'Canceled' },
];

export const TICKET_PRIORITY_OPTIONS: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-gray-600' },
  { value: 'medium', label: 'Medium', color: 'text-blue-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
];

export const TICKET_ORIGIN_OPTIONS: { value: TicketOrigin; label: string }[] = [
  { value: 'terminal', label: 'Terminal' },
  { value: 'agent_dashboard', label: 'Agent Dashboard' },
  { value: 'partner_hub', label: 'Partner Hub' },
  { value: 'xtrapay_admin', label: 'Xtrapay Admin' },
];

// Status badge colors
export const TICKET_STATUS_COLORS: Record<TicketStatus, { bg: string; text: string }> = {
  open: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  in_progress: { bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
  awaiting_partner: { bg: 'bg-purple-500/10', text: 'text-purple-600' },
  awaiting_xtrapay: { bg: 'bg-indigo-500/10', text: 'text-indigo-600' },
  awaiting_agent: { bg: 'bg-orange-500/10', text: 'text-orange-600' },
  resolved: { bg: 'bg-green-500/10', text: 'text-green-600' },
  closed: { bg: 'bg-gray-500/10', text: 'text-gray-600' },
  canceled: { bg: 'bg-red-500/10', text: 'text-red-600' },
};

export const PRIORITY_COLORS: Record<TicketPriority, { bg: string; text: string }> = {
  low: { bg: 'bg-gray-500/10', text: 'text-gray-600' },
  medium: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-600' },
  urgent: { bg: 'bg-red-500/10', text: 'text-red-600' },
};
