/**
 * API Services Quick Reference
 * 
 * Import what you need:
 */

// Import services
import {
  authService,
  dashboardService,
  agentsService,
  kycService,
  terminalsService,
  transactionsService,
  usersService,
  settingsService,
} from '@/services/api';

// Import types
import type {
  LoginRequest,
  Agent,
  CreateAgentRequest,
  Terminal,
  Transaction,
  User,
} from '@/services/api';

/**
 * Common Patterns
 */

// ============================================
// 1. LIST WITH PAGINATION
// ============================================
const getAgentsList = async () => {
  const response = await agentsService.getAgents({
    page: 1,
    per_page: 20,
    search: 'john',
    status: 'active',
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  
  console.log(response.data); // Array of agents
  console.log(response.meta); // Pagination info
};

// ============================================
// 2. GET SINGLE ITEM
// ============================================
const getAgentDetail = async (id: string) => {
  const response = await agentsService.getAgent(id);
  console.log(response.data); // Single agent object
};

// ============================================
// 3. CREATE
// ============================================
const createNewAgent = async () => {
  const data: CreateAgentRequest = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    business_name: 'John Business',
  };
  
  const response = await agentsService.createAgent(data);
  console.log(response.data); // Created agent
};

// ============================================
// 4. UPDATE
// ============================================
const updateAgent = async (id: string) => {
  const response = await agentsService.updateAgent(id, {
    name: 'Updated Name',
  });
  console.log(response.data); // Updated agent
};

// ============================================
// 5. DELETE
// ============================================
const deleteAgent = async (id: string) => {
  await agentsService.deleteAgent(id);
};

// ============================================
// 6. FILE UPLOAD
// ============================================
const uploadLogo = async (file: File) => {
  const response = await settingsService.uploadLogo(
    file,
    (progressEvent) => {
      const percent = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      console.log(`Upload progress: ${percent}%`);
    }
  );
};

// ============================================
// 7. FILE DOWNLOAD/EXPORT
// ============================================
const exportTransactions = async () => {
  await transactionsService.exportTransactions({
    format: 'excel',
    status: 'successful',
    date_from: '2024-01-01',
    date_to: '2024-12-31',
  });
  // File downloads automatically
};

// ============================================
// 8. ERROR HANDLING
// ============================================
const handleApiCall = async () => {
  try {
    const response = await agentsService.createAgent(data);
    // Success
  } catch (error: any) {
    console.error(error.message); // User-friendly message
    console.error(error.status); // HTTP status code
    
    // Validation errors
    if (error.errors) {
      Object.keys(error.errors).forEach(field => {
        console.error(`${field}: ${error.errors[field].join(', ')}`);
      });
    }
  }
};

// ============================================
// 9. WITH REACT HOOK
// ============================================
import { useApi } from '@/hooks/useApi';

function MyComponent() {
  const { data, loading, error, execute } = useApi(
    agentsService.getAgents,
    { 
      showErrorToast: true,
      showSuccessToast: false 
    }
  );

  useEffect(() => {
    execute({ page: 1, per_page: 20 });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
}

// ============================================
// 10. WITH REACT QUERY
// ============================================
import { useQuery, useMutation } from '@tanstack/react-query';

function MyComponent() {
  // Fetch data
  const { data, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsService.getAgents({ page: 1 })
  });

  // Mutate data
  const createMutation = useMutation({
    mutationFn: agentsService.createAgent,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });

  return <div>{/* Render */}</div>;
}

/**
 * All Available Services
 */

// Auth
authService.login({ email, password });
authService.logout();
authService.selectContext({ context_id });
authService.changePassword({ current_password, new_password, new_password_confirmation });
authService.getProfile();
authService.updateProfile({ name, email });
authService.isAuthenticated();

// Dashboard
dashboardService.getDashboard();
dashboardService.getSummary();

// Agents
agentsService.getAgents({ page, per_page, search, status });
agentsService.getSummary();
agentsService.createAgent(data);
agentsService.getAgent(id);
agentsService.updateAgent(id, data);
agentsService.toggleStatus(id, status);
agentsService.deleteAgent(id);

// KYC
kycService.getSubmissions({ page, status });
kycService.getSummary();
kycService.getKYCDetails(id);
kycService.startReview(id);
kycService.reviewDocument(id, docId, { status, notes });
kycService.approve(id, { notes });
kycService.reject(id, { reason, notes });
kycService.requestCorrections(id, { fields, notes });

// Terminals
terminalsService.getTerminals({ page, status, agent_id });
terminalsService.getSummary();
terminalsService.getUnassigned();
terminalsService.getTerminal(id);
terminalsService.assignTerminal(id, { agent_id });
terminalsService.unassignTerminal(id);
terminalsService.toggleStatus(id, status);
terminalsService.bulkAssign({ terminal_ids, agent_id });

// Transactions
transactionsService.getTransactions({ page, status, date_from, date_to });
transactionsService.getSummary({ status, date_from });
transactionsService.getTrends();
transactionsService.getTransaction(id);
transactionsService.exportTransactions({ format, status });

// Users
usersService.getUsers({ page, role, status });
usersService.getRoles();
usersService.createUser({ name, email, role });
usersService.getUser(id);
usersService.updateUser(id, data);
usersService.deleteUser(id);
usersService.resendInvitation(id);

// Settings
settingsService.getSettings();
settingsService.updateProfile(data);
settingsService.uploadLogo(file, onProgress);
settingsService.updateWebhook({ url, secret, events });
settingsService.updateHub({ theme, notifications_enabled });
settingsService.getAuditLogs({ page, action, date_from });
settingsService.getAuditLogActions();
