import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit, Ban, CreditCard, TrendingUp, Activity, Users, CalendarCheck, FileCheck, Plus, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { DetailCard, DetailRow } from '@/components/DetailCard';
import { PermissionGate } from '@/components/PermissionGate';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import partnerService from '@/services/api/partner.service';
import partnerAgentKycService from '@/services/api/partnerAgentKyc.service';
import { useAuth } from '@/contexts/AuthContext';
import OnboardAgentModal from '@/components/agents/OnboardAgentModal';
import { agentsService, Agent, AgentTerminal, AgentUser, AgentStats, TerminalDetails, Bank } from '@/services/api/agents.service';

export default function AgentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { getAssetUrl } = useAuth();
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [assignTerminalDialogOpen, setAssignTerminalDialogOpen] = useState(false);
  const [terminalSerialNumber, setTerminalSerialNumber] = useState('');
  const [validatedTerminal, setValidatedTerminal] = useState<TerminalDetails | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Virtual Account states
  const [hasVirtualAccount, setHasVirtualAccount] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [selectedBankCode, setSelectedBankCode] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  // Onboarding dialog/state for partner-initiated KYC
  const [onboardDialogOpen, setOnboardDialogOpen] = useState(false);
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardProfile, setOnboardProfile] = useState<Record<string, any>>({});
  const [onboardDocuments, setOnboardDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAgentDetails();
    }
  }, [id]);

  // Controlled tab state — allow selecting via ?tab= query param
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  useEffect(() => {
    // Fetch banks when virtual account is enabled
    if (hasVirtualAccount && banks.length === 0) {
      fetchBanks();
    }
  }, [hasVirtualAccount]);

  const fetchBanks = async () => {
    try {
      setIsLoadingBanks(true);
      // Prefer partner virtual banks when agent's partner id is available
      if (agent && agent.partner_id) {
        try {
          const resp = await partnerService.getVirtualBanks(agent.partner_id);
          // API expected: { status, data: [...] }
          setBanks(resp.data ?? resp?.data ?? []);
          return;
        } catch (err) {
          // fallback to global banks list
        }
      }

      const response = await agentsService.getBanks();
      setBanks(response.data ?? []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load banks list',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const fetchAgentDetails = async () => {
    try {
      setIsLoading(true);
      const response = await agentsService.getAgent(Number(id));
      setAgent(response.data.agent);
      setStats(response.data.stats || null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load agent details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOnboardingData = async (agentId: number) => {
    try {
      setOnboardLoading(true);
      const [statusResp, profileResp, docsResp] = await Promise.all([
        partnerAgentKycService.getStatus(agentId).catch(() => null),
        partnerAgentKycService.getProfile(agentId).catch(() => null),
        partnerAgentKycService.getDocuments(agentId).catch(() => null),
      ]);

      if (profileResp && profileResp.data) setOnboardProfile(profileResp.data.profile || profileResp.data);
      if (docsResp && docsResp.data) setOnboardDocuments(docsResp.data.documents || docsResp.data);
    } catch (err) {
      console.warn('Failed to load onboarding data', err);
    } finally {
      setOnboardLoading(false);
    }
  };

  const handleValidateTerminal = async () => {
    if (!terminalSerialNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a terminal serial number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsValidating(true);
      const response = await agentsService.getTerminalBySerialNumber({
        serial_number: terminalSerialNumber.trim(),
      });
      
      // Check if terminal is already assigned
      if (response.data.agent_id !== null) {
        toast({
          title: 'Terminal Already Assigned',
          description: 'This terminal has already been assigned to another agent',
          variant: 'destructive',
        });
        setAssignTerminalDialogOpen(false);
        setTerminalSerialNumber('');
        setValidatedTerminal(null);
        return;
      }
      
      setValidatedTerminal(response.data);
      toast({
        title: 'Terminal Validated',
        description: 'Terminal found and ready for assignment',
      });
    } catch (error: any) {
      toast({
        title: 'Validation Failed',
        description: error.response?.data?.message || 'Terminal not found or does not belong to this partner',
        variant: 'destructive',
      });
      setValidatedTerminal(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAssignTerminal = async () => {
    if (!agent || !terminalSerialNumber.trim()) return;

    // Validate virtual account details if enabled
    if (hasVirtualAccount) {
      if ((!selectedBankId && !selectedBankCode) || !accountNumber || !accountName) {
        toast({
          title: 'Validation Error',
          description: 'Please complete all virtual account fields',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setIsAssigning(true);
      const payload: any = {
        serial_number: terminalSerialNumber.trim(),
        agent_id: agent.id,
        has_virtual_account: hasVirtualAccount,
      };

      if (hasVirtualAccount) {
        if (selectedBankId) payload.bank_id = selectedBankId;
        else if (selectedBankCode) payload.bank_code = selectedBankCode;
        payload.account_number = accountNumber;
        payload.account_name = accountName;
      }

      await agentsService.assignTerminalBySerial(payload);
      toast({
        title: 'Success',
        description: 'Terminal assigned successfully',
      });
      setAssignTerminalDialogOpen(false);
      setTerminalSerialNumber('');
      setValidatedTerminal(null);
      resetVirtualAccountFields();
      fetchAgentDetails();
    } catch (error: any) {
      toast({
        title: 'Assignment Failed',
        description: error.response?.data?.message || 'Failed to assign terminal',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleVerifyAccount = async () => {
    if (!accountNumber || !selectedBankCode) {
      toast({
        title: 'Validation Error',
        description: 'Please enter account number and select bank',
        variant: 'destructive',
      });
      return;
    }

    if (accountNumber.length !== 10) {
      toast({
        title: 'Validation Error',
        description: 'Account number must be 10 digits',
        variant: 'destructive',
      });
      return;
    }

    // bank_code should be the selected bank code value
    const bankCode = selectedBankCode;
    if (!bankCode) {
      toast({
        title: 'Error',
        description: 'Selected bank not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsVerifyingAccount(true);
      const response = await agentsService.verifyAccount({
        account_number: accountNumber,
        bank_code: bankCode,
      });
      setAccountName(response.data.accountName);
      toast({
        title: 'Account Verified',
        description: 'Account details verified successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.response?.data?.message || 'Failed to verify account',
        variant: 'destructive',
      });
      setAccountName('');
    } finally {
      setIsVerifyingAccount(false);
    }
  };

  const resetVirtualAccountFields = () => {
    setHasVirtualAccount(false);
    setSelectedBankId(null);
    setAccountNumber('');
    setAccountName('');
  };

  const handleCancelAssignment = () => {
    setTerminalSerialNumber('');
    setValidatedTerminal(null);
    resetVirtualAccountFields();
  };

  const handleCloseAssignDialog = () => {
    setAssignTerminalDialogOpen(false);
    setTerminalSerialNumber('');
    setValidatedTerminal(null);
    resetVirtualAccountFields();
  };

  const handleToggleStatus = async () => {
    if (!agent) return;
    
    try {
      await agentsService.toggleStatus(agent.id);
      toast({
        title: 'Success',
        description: `Agent ${agent.status === 'active' ? 'suspended' : 'activated'} successfully`,
      });
      setDisableDialogOpen(false);
      fetchAgentDetails();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update agent status',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Loading..."
          description="Fetching agent details"
          actions={
            <Button variant="ghost" onClick={() => navigate('/agents')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          }
        />
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div>
        <PageHeader
          title="Agent Not Found"
          description="The requested agent could not be found"
          actions={
            <Button variant="ghost" onClick={() => navigate('/agents')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agents
            </Button>
          }
        />
      </div>
    );
  }

  const terminalColumns = [
    { 
      key: 'terminal_id', 
      header: 'Terminal ID',
      render: (item: AgentTerminal) => (
        <span className="font-mono font-medium">{item.terminal_id}</span>
      ),
    },
    { 
      key: 'serial_number', 
      header: 'Serial Number',
      render: (item: AgentTerminal) => (
        <span className="text-sm">{item.serial_number}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: AgentTerminal) => (
        <StatusBadge status={item.status as any} size="sm" />
      ),
    },
  ];

  const userColumns = [
    { 
      key: 'name', 
      header: 'Name',
      render: (item: AgentUser) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {item.partner_user.first_name} {item.partner_user.last_name}
          </span>
          <span className="text-xs text-muted-foreground">{item.partner_user.email}</span>
        </div>
      ),
    },
    { 
      key: 'phone', 
      header: 'Phone',
      render: (item: AgentUser) => (
        <span className="text-sm">{item.partner_user.phone}</span>
      ),
    },
    { 
      key: 'role', 
      header: 'Role',
      render: (item: AgentUser) => (
        <div className="flex items-center gap-2">
          <span className="text-sm capitalize">{item.role.replace('_', ' ')}</span>
          {item.is_primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: AgentUser) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={item.status as any} size="sm" />
          <StatusBadge status={item.partner_user.status as any} size="sm" />
        </div>
      ),
    },
    { 
      key: 'last_login', 
      header: 'Last Login',
      render: (item: AgentUser) => (
        <span className="text-sm">
          {item.partner_user.last_login_at 
            ? new Date(item.partner_user.last_login_at).toLocaleString() 
            : 'Never'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={agent.business_name}
        description={`Agent Code: ${agent.code}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/agents')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <PermissionGate permission="agents.edit">
              <Button variant="outline" onClick={() => navigate(`/agents/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </PermissionGate>
            <PermissionGate permission="agents.disable">
              <Button 
                variant={agent.status === 'suspended' ? 'default' : 'destructive'} 
                onClick={() => setDisableDialogOpen(true)}
              >
                <Ban className="mr-2 h-4 w-4" />
                {agent.status === 'suspended' ? 'Activate' : 'Suspend'}
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="kyc">KYC Details</TabsTrigger>
          <TabsTrigger value="terminals">Terminals ({agent.terminals?.length || 0})</TabsTrigger>
          <TabsTrigger value="users">Users ({agent.user_contexts?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                title="Total Terminals"
                value={stats.total_terminals}
                icon={CreditCard}
              />
              <StatCard
                title="Active Terminals"
                value={stats.active_terminals}
                icon={Activity}
                change={{ 
                  value: stats.total_terminals > 0 
                    ? Math.round((stats.active_terminals / stats.total_terminals) * 100) 
                    : 0, 
                  label: 'active' 
                }}
                trend="up"
              />
              <StatCard
                title="Total Users"
                value={agent.user_contexts?.length || 0}
                icon={Users}
              />
              <StatCard
                title="KYC Documents"
                value={agent.kyc_documents?.length || 0}
                icon={FileCheck}
              />
            </div>
          )}

          {/* Agent Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <DetailCard title="Business Information">
              <DetailRow label="Business Name" value={agent.business_name} />
              <DetailRow label="Agent Code" value={<span className="font-mono">{agent.code}</span>} />
              {/* <DetailRow label="Partner ID" value={agent.partner_id} /> */}
              <DetailRow label="Address" value={agent.address} />
              <DetailRow label="City" value={agent.city} />
              <DetailRow label="State" value={agent.state} />
              {agent.lga && <DetailRow label="LGA" value={agent.lga} />}
              <DetailRow label="Status" value={<StatusBadge status={agent.status || 'pending'} size="sm" />} />
            </DetailCard>

            <DetailCard title="Contact Information">
              <DetailRow label="Contact Name" value={agent.contact_name} />
              <DetailRow label="Contact Email" value={agent.contact_email} />
              <DetailRow label="Contact Phone" value={agent.contact_phone} />
            </DetailCard>
          </div>

          {/* Dates & Timeline */}
          <div className="grid gap-6 md:grid-cols-2">
            <DetailCard title="Important Dates">
              <DetailRow label="Created At" value={new Date(agent.created_at).toLocaleString()} />
              <DetailRow label="Last Updated" value={new Date(agent.updated_at).toLocaleString()} />
              {agent.kyc_submitted_at && (
                <DetailRow label="KYC Submitted" value={new Date(agent.kyc_submitted_at).toLocaleString()} />
              )}
              {agent.kyc_approved_at && (
                <DetailRow label="KYC Approved" value={new Date(agent.kyc_approved_at).toLocaleString()} />
              )}
              {agent.deleted_at && (
                <DetailRow label="Deleted At" value={new Date(agent.deleted_at).toLocaleString()} />
              )}
            </DetailCard>

            <DetailCard title="KYC Status">
              <DetailRow label="Current Status" value={<StatusBadge status={agent.kyc_status} size="sm" />} />
              <DetailRow label="Business Type" value={agent.kyc_profile?.business_type || 'Not set'} />
              <DetailRow 
                label="Submitted" 
                value={agent.kyc_submitted_at ? 'Yes' : 'No'} 
              />
              <DetailRow 
                label="Approved" 
                value={agent.kyc_approved_at ? 'Yes' : 'No'} 
              />
            </DetailCard>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {stats && (
            <>
              {/* Today's Performance */}
              <DetailCard title="Today's Performance">
                <DetailRow label="Transactions" value={stats.today.transactions.toLocaleString()} />
                <DetailRow 
                  label="Volume" 
                  value={`₦${stats.today.volume.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                />
                <DetailRow 
                  label="Success Rate" 
                  value={`${stats.today.success_rate}%`} 
                />
              </DetailCard>

              {/* This Month's Performance */}
              <DetailCard title="This Month's Performance">
                <DetailRow label="Transactions" value={stats.this_month.transactions.toLocaleString()} />
                <DetailRow 
                  label="Volume" 
                  value={`₦${stats.this_month.volume.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                />
                <DetailRow 
                  label="Success Rate" 
                  value={`${stats.this_month.success_rate}%`} 
                />
              </DetailCard>

              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                  title="Today's Transactions"
                  value={stats.today.transactions}
                  icon={Activity}
                />
                <StatCard
                  title="Today's Volume"
                  value={`₦${(stats.today.volume / 1000000).toFixed(2)}M`}
                  icon={TrendingUp}
                />
                <StatCard
                  title="Today's Success Rate"
                  value={`${stats.today.success_rate}%`}
                  icon={CalendarCheck}
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="kyc" className="space-y-6">
            {/* Partner onboarding actions */}
            {agent && (agent.kyc_status === 'pending_onboarding' || agent.kyc_status === 'pending_correction') && hasPermission && hasPermission('kyc.onboard') && (
              <div className="flex justify-end">
                <Button onClick={() => { setOnboardDialogOpen(true); }}>
                  {agent.kyc_status === 'pending_onboarding' ? 'Start Onbaording' : 'Update KYC'}
                </Button>
              </div>
            )}
          {/* KYC Profile */}
          {agent.kyc_profile ? (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <DetailCard title="Business Details">
                  <DetailRow label="Business Type" value={agent.kyc_profile.business_type} />
                  {agent.kyc_profile.rc_number && <DetailRow label="RC Number" value={agent.kyc_profile.rc_number} />}
                  {agent.kyc_profile.tin_number && <DetailRow label="TIN Number" value={agent.kyc_profile.tin_number} />}
                  {agent.kyc_profile.cac_document && <DetailRow label="CAC Document" value={agent.kyc_profile.cac_document} />}
                </DetailCard>

                <DetailCard title="Personal Information">
                  {agent.kyc_profile.id_type && <DetailRow label="ID Type" value={agent.kyc_profile.id_type?.replace(/_/g, ' ').toUpperCase()} />}
                  {agent.kyc_profile.id_number && <DetailRow label="ID Number" value={agent.kyc_profile.id_number} />}
                  {agent.kyc_profile.date_of_birth && (
                    <DetailRow label="Date of Birth" value={new Date(agent.kyc_profile.date_of_birth).toLocaleDateString()} />
                  )}
                  {agent.kyc_profile.gender && <DetailRow label="Gender" value={agent.kyc_profile.gender?.toUpperCase()} />}
                  {agent.kyc_profile.bvn && <DetailRow label="BVN" value={agent.kyc_profile.bvn} />}
                </DetailCard>
              </div>

              <DetailCard title="Banking Information">
                {agent.kyc_profile.bank_name && <DetailRow label="Bank Name" value={agent.kyc_profile.bank_name} />}
                {agent.kyc_profile.account_number && <DetailRow label="Account Number" value={agent.kyc_profile.account_number} />}
                {agent.kyc_profile.account_name && <DetailRow label="Account Name" value={agent.kyc_profile.account_name?.toUpperCase()} />}
              </DetailCard>

              <DetailCard title="KYC Timeline">
                <DetailRow
                  label="Profile Created"
                  value={new Date(agent.kyc_profile.created_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                />
                <DetailRow
                  label="Last Updated"
                  value={new Date(agent.kyc_profile.updated_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                />
                {agent.kyc_profile.submitted_at && (
                  <DetailRow
                    label="Submitted At"
                    value={new Date(agent.kyc_profile.submitted_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  />
                )}
              </DetailCard>

              {/* KYC Documents */}
              {agent.kyc_documents && agent.kyc_documents.length > 0 && (
                <DetailCard title="KYC Documents">
                  <div className="space-y-2">
                    {agent.kyc_documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{doc?.document_name?.toUpperCase() || doc?.document_type?.replace(/_/g, ' ')?.toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">{doc.status}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.open(getAssetUrl(doc.file_url) || '', '_blank')}>
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </DetailCard>
              )}

            <OnboardAgentModal
              open={onboardDialogOpen}
              onOpenChange={setOnboardDialogOpen}
              agentId={agent.id}
              onSuccess={fetchAgentDetails}
            />
            </>
          ) : (
            <DetailCard title="KYC Profile">
              <p className="text-muted-foreground">No KYC information available</p>
            </DetailCard>
          )}
        </TabsContent>

        <TabsContent value="terminals">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setAssignTerminalDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Assign Terminal
              </Button>
            </div>
            <DataTable
              columns={terminalColumns}
              data={agent.terminals || []}
              onRowClick={(item) => navigate(`/terminals/${item.id}`)}
              emptyMessage="No terminals assigned to this agent"
            />
          </div>
        </TabsContent>

        <TabsContent value="users">
          <DataTable
            columns={userColumns}
            data={agent.user_contexts || []}
            emptyMessage="No users assigned to this agent"
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={disableDialogOpen}
        onOpenChange={setDisableDialogOpen}
        title={agent.status === 'suspended' ? 'Activate Agent' : 'Suspend Agent'}
        description={
          agent.status === 'suspended'
            ? `Are you sure you want to activate ${agent.business_name}? The agent will be able to process transactions again.`
            : `Are you sure you want to suspend ${agent.business_name}? All terminals will be suspended and the agent will no longer be able to process transactions.`
        }
        confirmLabel={agent.status === 'suspended' ? 'Activate Agent' : 'Suspend Agent'}
        variant={agent.status === 'suspended' ? 'default' : 'destructive'}
        onConfirm={handleToggleStatus}
      />

      {/* Assign Terminal Dialog */}
      <Dialog open={assignTerminalDialogOpen} onOpenChange={handleCloseAssignDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Terminal to Agent</DialogTitle>
            <DialogDescription>
              Enter the terminal serial number to validate and assign it to this agent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serial-number">Terminal Serial Number *</Label>
              <Input
                id="serial-number"
                placeholder="Enter serial number"
                value={terminalSerialNumber}
                onChange={(e) => setTerminalSerialNumber(e.target.value)}
                disabled={isValidating || isAssigning}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isValidating && !validatedTerminal) {
                    handleValidateTerminal();
                  }
                }}
              />
            </div>

            {validatedTerminal && (
              <>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Terminal ID</div>
                        <div className="font-mono font-medium">{validatedTerminal.terminal_id}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Serial Number</div>
                        <div className="font-mono">{validatedTerminal.serial_number}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">POS Type</div>
                        <div>{validatedTerminal.pos_type}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Status</div>
                        <StatusBadge status={validatedTerminal.status as any} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Virtual Account Section */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="has-virtual-account">Virtual Account</Label>
                      <div className="text-sm text-muted-foreground">
                        Does this terminal have an assigned virtual account?
                      </div>
                    </div>
                    <Switch
                      id="has-virtual-account"
                      checked={hasVirtualAccount}
                      onCheckedChange={async (val) => {
                        // When enabling, verify partner eligibility then fetch partner virtual banks
                        if (val) {
                          if (!agent) {
                            toast({ title: 'Error', description: 'Agent not loaded', variant: 'destructive' });
                            return;
                          }

                          try {
                            const res = await partnerService.canAssignVirtualAccount(agent.partner_id);
                            // Accept multiple possible response shapes
                            const allowed = res?.data?.can_assign ?? res?.data?.canAssign ?? res?.data?.allowed ?? res?.data ?? false;
                            if (!allowed) {
                              toast({ title: 'Not Eligible', description: 'Partner is not eligible to assign virtual accounts', variant: 'destructive' });
                              return;
                            }

                            setHasVirtualAccount(true);
                            // fetch virtual banks for partner
                            try {
                              const banksResp = await partnerService.getVirtualBanks(agent.partner_id);
                              setBanks(banksResp?.data ?? banksResp ?? []);
                            } catch (err) {
                              // if fetching virtual banks failed, attempt general banks
                              await fetchBanks();
                            }
                          } catch (error: any) {
                            toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to check eligibility', variant: 'destructive' });
                          }
                        } else {
                          // turning off
                          setHasVirtualAccount(false);
                          setSelectedBankId(null);
                          setAccountNumber('');
                          setAccountName('');
                        }
                      }}
                      disabled={isAssigning}
                    />
                  </div>

                  {hasVirtualAccount && (
                    <div className="space-y-4 pl-4 border-l-2">
                      <div className="space-y-2">
                        <Label htmlFor="bank-name">Bank Name *</Label>
                        <Select
                          value={selectedBankCode || ''}
                          onValueChange={(value) => {
                            // value is bank.code when available, fall back to id string
                            setSelectedBankCode(value || null);
                            const found = banks.find(b => (b.code && b.code === value) || (b.id && b.id.toString() === value));
                            if (found && found.id) setSelectedBankId(found.id);
                            else setSelectedBankId(null);
                            setAccountName(''); // Reset account name when bank changes
                          }}
                          disabled={isLoadingBanks || isAssigning}
                        >
                          <SelectTrigger id="bank-name">
                            <SelectValue placeholder={isLoadingBanks ? "Loading banks..." : "Select bank"} />
                          </SelectTrigger>
                          <SelectContent>
                            {banks.map((bank) => (
                              <SelectItem key={bank.id ?? bank.code} value={bank.code ?? (bank.id?.toString() ?? '')}>
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="account-number">Account Number *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="account-number"
                            placeholder="Enter 10-digit account number"
                            value={accountNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setAccountNumber(value);
                              setAccountName(''); // Reset account name when number changes
                            }}
                            disabled={isAssigning}
                            maxLength={10}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleVerifyAccount}
                            disabled={!accountNumber || accountNumber.length !== 10 || !selectedBankCode || isVerifyingAccount || isAssigning}
                          >
                            {isVerifyingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isVerifyingAccount ? 'Verifying...' : 'Verify'}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="account-name">Account Name *</Label>
                        <Input
                          id="account-name"
                          placeholder="Account name will appear after verification"
                          value={accountName}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            {!validatedTerminal ? (
              <>
                <Button variant="outline" onClick={handleCloseAssignDialog} disabled={isValidating}>
                  Cancel
                </Button>
                <Button onClick={handleValidateTerminal} disabled={isValidating || !terminalSerialNumber.trim()}>
                  {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Validate Terminal
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancelAssignment} disabled={isAssigning}>
                  Cancel
                </Button>
                <Button onClick={handleAssignTerminal} disabled={isAssigning}>
                  {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assign Terminal
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
