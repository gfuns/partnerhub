/**
 * Central export for all API services
 * Import from here to access any API service
 * 
 * Example usage:
 * import { authService, agentsService } from '@/services/api';
 * 
 * const agents = await agentsService.getAgents();
 * await authService.logout();
 */

export { authService } from './auth.service';
export { dashboardService } from './dashboard.service';
export { agentsService } from './agents.service';
export { kycService } from './kyc.service';
export { terminalsService } from './terminals.service';
export { transactionsService } from './transactions.service';
export { usersService } from './users.service';
export { settingsService } from './settings.service';

// Export types with explicit naming to avoid conflicts
export type {
  LoginRequest,
  LoginResponse,
  SelectContextRequest,
  SelectContextResponse,
  ChangePasswordRequest,
  ProfileResponse,
  UpdateProfileRequest as AuthUpdateProfileRequest,
  RefreshTokenResponse,
  User as ApiUser,
  Context as ApiContext,
  Partner as ApiPartner,
  Agent as ApiAgent,
  CurrentContext as ApiCurrentContext,
} from './auth.service';

export type {
  DashboardStats,
  DashboardData,
  StatValue,
  ChartData,
  RecentTransaction,
  GetDashboardParams,
} from './dashboard.service';

export type {
  Agent,
  AgentListParams,
  AgentListResponse,
  AgentSummary,
  AgentStats,
  AgentDetailsResponse,
  CreateAgentRequest,
  CreateAgentResponse,
  UpdateAgentRequest,
  UpdateAgentResponse,
  ToggleStatusResponse,
  DeleteAgentResponse,
  KycProfile,
  KycDocument,
  AgentTerminal,
  AgentUser,
} from './agents.service';

export type {
  KYCSubmission,
  KYCListParams,
  KYCListResponse,
  KYCSummary,
  ReviewDocumentRequest,
  ApproveKYCRequest,
  RejectKYCRequest,
  RequestCorrectionsRequest,
} from './kyc.service';

export type {
  Terminal,
  TerminalListParams,
  TerminalListResponse,
  TerminalSummary,
  AssignTerminalRequest,
  BulkAssignRequest,
} from './terminals.service';

export type {
  Transaction,
  TransactionListParams,
  TransactionListResponse,
  TransactionSummary,
  TransactionTrends,
  ExportParams,
} from './transactions.service';

export type {
  User,
  UserListParams,
  UserListResponse,
  Role,
  RolesResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from './users.service';

export type {
  Settings,
  SettingsResponse,
  UpdateProfileRequest as SettingsUpdateProfileRequest,
  UpdateWebhookRequest,
  UpdateHubRequest,
  AuditLog,
  AuditLogParams,
  AuditLogResponse,
  AuditLogActionsResponse,
} from './settings.service';
