import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Ban, RefreshCw, FileText, Monitor, CheckCircle, XCircle, Wifi, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { PermissionGate } from '@/components/PermissionGate';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ReassignModal } from '@/components/ReassignModal';
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
import terminalsService, { Terminal, TerminalListParams } from '@/services/api/terminals.service';
import agentsService from '@/services/api/agents.service';

interface Agent {
  id: string;
  name: string;
}

export default function TerminalsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);

  const pageSize = 15;

  useEffect(() => {
    loadTerminals();
    loadAgents();
    loadStats();
  }, [currentPage, searchQuery, statusFilter, assignedFilter]);

  const loadTerminals = async () => {
    try {
      setLoading(true);
      const params: TerminalListParams = {
        page: currentPage,
        per_page: pageSize,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter as any;
      if (assignedFilter === 'assigned') params.assigned = true;
      if (assignedFilter === 'unassigned') params.assigned = false;

      const response = await terminalsService.getTerminals(params);
      setTerminals(response.data);
      // stats are now fetched from a separate endpoint
      setStats(null);
      setTotalPages(response.meta.last_page);
      setTotalItems(response.meta.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load terminals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await terminalsService.getStats();
      // apiService.get returns response.data, but ensure compatibility
      const statsData = response?.data ?? response;
      setStats(statsData || null);
    } catch (error: any) {
      console.warn('Failed to load terminal stats', error);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await agentsService.getAgents({ per_page: 1000 });
      setAgents(response.data.map((a: any) => ({ id: String(a.id), name: a.business_name })));
    } catch (error) {
      console.error('Failed to load merchants:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedTerminal) return;
    try {
      await terminalsService.toggleStatus(selectedTerminal.id);
      toast({
        title: 'Success',
        description: `Terminal ${selectedTerminal.status === 'active' ? 'deactivated' : 'activated'} successfully`,
      });
      setToggleDialogOpen(false);
      setSelectedTerminal(null);
      loadTerminals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update terminal status',
        variant: 'destructive',
      });
    }
  };

  const handleUnassign = async () => {
    if (!selectedTerminal) return;
    try {
      await terminalsService.unassignTerminal(selectedTerminal.id);
      toast({
        title: 'Success',
        description: `Terminal ${selectedTerminal.terminal_id} unassigned successfully`,
      });
      setUnassignDialogOpen(false);
      setSelectedTerminal(null);
      loadTerminals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unassign terminal',
        variant: 'destructive',
      });
    }
  };

  const handleReassign = async (agentId: string, virtualAccountData?: any) => {
    if (!selectedTerminal) return;
    try {
      const payload: any = { agent_id: Number(agentId) };
      if (virtualAccountData) {
        payload.has_virtual_account = true;
        payload.bank_id = virtualAccountData.bank_id;
        payload.account_number = virtualAccountData.account_number;
        payload.account_name = virtualAccountData.account_name;
      }
      await terminalsService.assignTerminal(selectedTerminal.id, payload);
      const agent = agents.find(a => a.id === agentId);
      toast({
        title: 'Success',
        description: `Terminal ${selectedTerminal.terminal_id} reassigned to ${agent?.name}`,
      });
      setReassignModalOpen(false);
      setSelectedTerminal(null);
      loadTerminals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reassign terminal',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '₦0.00';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatLastSeen = (dateStr: string | undefined) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const columns = [
    {
      key: 'terminal_id',
      header: 'Terminal ID',
      render: (item: Terminal) => (
        <span className="font-mono font-medium">{item.terminal_id}</span>
      ),
    },
    {
      key: 'serial_number',
      header: 'Serial Number',
      render: (item: Terminal) => (
        <span className="font-mono text-sm">{item.serial_number}</span>
      ),
    },
    {
      key: 'agent',
      header: 'Merchant',
      render: (item: Terminal) => (
        <span>{item.agent?.business_name || 'Unassigned'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Terminal) => (
        <StatusBadge
          status={item.status === 'active' ? 'active' : item.status === 'revoked' ? 'revoked' : 'suspended'}
          size="sm"
        />
      ),
    },
    {
      key: 'terminal_balance',
      header: "Terminal Balance",
      render: (item: Terminal) => (
        <span className="font-medium">{formatCurrency(Number(item.balance ?? 0))}</span>
      ),
    },
    {
      key: 'today_transaction_volume',
      header: "Today's Volume",
      render: (item: Terminal) => (
        <span className="font-medium">{formatCurrency(item.today_transaction_volume)}</span>
      ),
    },
    {
      key: 'today_transaction_count',
      header: "Transactions",
      render: (item: Terminal) => (
        <span className="text-muted-foreground">{item.today_transaction_count || 0}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-40',
      render: (item: Terminal) => (
        <div className="flex items-center gap-1">
          <ActionButton
            icon={Eye}
            tooltip="View Details"
            onClick={() => navigate(`/terminals/${item.id}`)}
          />
          <PermissionGate permission="terminals.manage">
            <ActionButton
              icon={Ban}
              tooltip={item.status === 'active' ? 'Deactivate' : 'Activate'}
              variant={item.status === 'active' ? 'destructive' : 'default'}
              disabled={item.status === 'revoked'}
              onClick={() => {
                setSelectedTerminal(item);
                setToggleDialogOpen(true);
              }}
            />
          </PermissionGate>
          <PermissionGate permission="terminals.assign">
            <ActionButton
              icon={RefreshCw}
              tooltip="Reassign"
              disabled={item.status === 'revoked' || !item.agent_id}
              onClick={() => {
                setSelectedTerminal(item);
                setReassignModalOpen(true);
              }}
            />
          </PermissionGate>
          <ActionButton
            icon={FileText}
            tooltip="View Transactions"
            onClick={() => navigate(`/terminals/${item.id}?tab=transactions`)}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Terminals"
        description="Manage POS terminals and their assignments."
        actions={
          <PermissionGate permission="terminals.create">
            <Button onClick={() => navigate('/terminals/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Issue POS
            </Button>
          </PermissionGate>
        }
      />

      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <StatCard
            title="Total Terminals"
            value={stats.total || 0}
            icon={Monitor}
            subtitle={`${stats.recent_30_days || 0} added in last 30 days`}
          />
          <StatCard
            title="Active"
            value={stats.active || 0}
            icon={CheckCircle}
            subtitle={`${stats.assigned || 0} assigned`}
          />
          <StatCard
            title="Unassigned"
            value={stats.unassigned || 0}
            icon={XCircle}
            subtitle={`${stats.with_virtual_accounts || 0} with virtual accounts`}
          />
          <StatCard
            title="Today's Volume"
            value={`₦${(stats.today?.transaction_volume || 0).toLocaleString()}`}
            icon={TrendingUp}
            subtitle={`${stats.today?.transaction_count || 0} transactions`}
          />
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search terminals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assignedFilter} onValueChange={setAssignedFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Assignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={terminals}
        emptyMessage={loading ? 'Loading terminals...' : 'No terminals found'}
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        pageSize={pageSize}
      />

      <ConfirmDialog
        open={toggleDialogOpen}
        onOpenChange={setToggleDialogOpen}
        title={selectedTerminal?.status === 'active' ? 'Deactivate Terminal' : 'Activate Terminal'}
        description={`Are you sure you want to ${selectedTerminal?.status === 'active' ? 'deactivate' : 'activate'} ${selectedTerminal?.terminal_id}?`}
        confirmLabel={selectedTerminal?.status === 'active' ? 'Deactivate' : 'Activate'}
        variant={selectedTerminal?.status === 'active' ? 'destructive' : 'default'}
        onConfirm={handleToggleStatus}
      />

      <ConfirmDialog
        open={unassignDialogOpen}
        onOpenChange={setUnassignDialogOpen}
        title="Unassign Terminal"
        description={`Are you sure you want to unassign ${selectedTerminal?.terminal_id} from ${selectedTerminal?.agent?.business_name}?`}
        confirmLabel="Unassign"
        variant="destructive"
        onConfirm={handleUnassign}
      />

      <ReassignModal
        open={reassignModalOpen}
        onOpenChange={setReassignModalOpen}
        title="Reassign Terminal"
        description={`Select a new merchant for ${selectedTerminal?.terminal_id}`}
        agents={agents}
        currentAgentId={selectedTerminal?.agent_id?.toString()}
        onConfirm={handleReassign}
      />
    </div>
  );
}
