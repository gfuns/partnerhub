import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Ban, CreditCard, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { PermissionGate } from '@/components/PermissionGate';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ActionButton } from '@/components/ActionButton';
import { TablePagination } from '@/components/TablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { agentsService, Agent } from '@/services/api';
import { toast as sonnerToast } from 'sonner';

export default function AgentsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycStatusFilter, setKycStatusFilter] = useState('all');
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchAgents();
  }, [currentPage, pageSize, searchQuery, statusFilter, kycStatusFilter]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        per_page: pageSize,
        sort_by: 'created_at',
        sort_order: 'desc' as const,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (kycStatusFilter !== 'all') params.kyc_status = kycStatusFilter;

      const response = await agentsService.getAgents(params);
      setAgents(response.data);
      setTotalItems(response.meta.total);
      setTotalPages(response.meta.last_page);
    } catch (error: any) {
      sonnerToast.error('Failed to load agents', {
        description: error.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedAgent) return;

    try {
      const response = await agentsService.toggleStatus(selectedAgent.id);
      sonnerToast.success(response.message);
      setToggleDialogOpen(false);
      setSelectedAgent(null);
      fetchAgents();
    } catch (error: any) {
      sonnerToast.error('Failed to update agent status', {
        description: error.message || 'Please try again',
      });
    }
  };

  const columns = [
    { 
      key: 'code', 
      header: 'Agent Code',
      render: (item: Agent) => (
        <span className="font-mono font-medium">{item.code}</span>
      ),
    },
    { 
      key: 'business_name', 
      header: 'Business Name',
      render: (item: Agent) => (
        <div>
          <p className="font-medium">{item.business_name}</p>
          <p className="text-sm text-muted-foreground">{item.contact_email}</p>
        </div>
      ),
    },
    { 
      key: 'phone', 
      header: 'Phone',
      render: (item: Agent) => item.contact_phone,
    },
    { 
      key: 'location', 
      header: 'Location',
      render: (item: Agent) => (
        <span className="text-sm">{item.city}, {item.state}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Agent) => (
        <StatusBadge status={item.status || 'pending'} size="sm" />
      ),
    },
    {
      key: 'kyc_status',
      header: 'KYC Status',
      render: (item: Agent) => (
        <StatusBadge status={item.kyc_status} size="sm" />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-32',
      render: (item: Agent) => (
        <div className="flex items-center gap-1">
          <ActionButton
            icon={Eye}
            label="View Agent"
            onClick={() => navigate(`/agents/${item.id}`)}
          />
          {hasPermission('agents.edit') && item.kyc_status !== 'pending_onboarding' && (
            <ActionButton
              icon={Edit}
              label="Edit Agent"
              onClick={() => navigate(`/agents/${item.id}/edit`)}
            />
          )}
          {hasPermission('agents.edit') && item.status !== 'pending' && item.kyc_status !== 'pending_onboarding' && item.kyc_status !== 'pending_correction' && (
            <ActionButton
              icon={Ban}
              label={item.status === 'suspended' ? 'Activate Agent' : 'Suspend Agent'}
              onClick={() => {
                setSelectedAgent(item);
                setToggleDialogOpen(true);
              }}
            />
          )}
          {item.kyc_status !== 'pending_onboarding' && item.kyc_status !== 'pending_correction' && (
            <ActionButton
              icon={CreditCard}
              label="View Terminals"
              onClick={() => navigate(`/agents/${item.id}?tab=terminals`)}
            />
          )}
          {/* Partner-initiated onboarding CTA for agents pending onboarding or pending correction */}
          {(item.kyc_status === 'pending_onboarding' || item.kyc_status === 'pending_correction') && hasPermission('kyc.onboard') && (
            <ActionButton
              icon={UserPlus}
              label="Onboard"
              onClick={() => navigate(`/agents/${item.id}?tab=kyc`)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Agents"
        description="Manage your terminal agents and their assignments."
        actions={
          <PermissionGate permission="agents.create">
            <Button onClick={() => navigate('/agents/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={kycStatusFilter} onValueChange={(value) => {
          setKycStatusFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="KYC Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KYC</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading agents...</div>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={agents}
            emptyMessage="No agents found"
          />

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </>
      )}

      <ConfirmDialog
        open={toggleDialogOpen}
        onOpenChange={setToggleDialogOpen}
        title={selectedAgent?.status === 'suspended' ? 'Activate Agent' : 'Suspend Agent'}
        description={
          selectedAgent?.status === 'suspended'
            ? `Are you sure you want to activate ${selectedAgent?.business_name}? They will be able to process transactions again.`
            : `Are you sure you want to suspend ${selectedAgent?.business_name}? They will no longer be able to process transactions.`
        }
        confirmLabel={selectedAgent?.status === 'suspended' ? 'Activate' : 'Suspend'}
        variant="destructive"
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}
