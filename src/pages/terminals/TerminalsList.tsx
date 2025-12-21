import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Ban, Pause, RefreshCw, FileText } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
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

const mockTerminals = [
  { id: '1', terminalId: 'TRM-001', agentId: '1', agent: 'John Doe Enterprises', status: 'online', lastSeen: 'Just now', todayVolume: '₦1,250,000', location: 'Lagos' },
  { id: '2', terminalId: 'TRM-002', agentId: '1', agent: 'John Doe Enterprises', status: 'online', lastSeen: '5 min ago', todayVolume: '₦890,000', location: 'Lagos' },
  { id: '3', terminalId: 'TRM-003', agentId: '2', agent: 'Jane Smith POS', status: 'offline', lastSeen: '2 hours ago', todayVolume: '₦0', location: 'Abuja' },
  { id: '4', terminalId: 'TRM-004', agentId: '3', agent: 'Mike Johnson Store', status: 'online', lastSeen: 'Just now', todayVolume: '₦670,000', location: 'Port Harcourt' },
  { id: '5', terminalId: 'TRM-005', agentId: '', agent: 'Unassigned', status: 'offline', lastSeen: 'Never', todayVolume: '₦0', location: '-' },
  { id: '6', terminalId: 'TRM-006', agentId: '4', agent: 'Sarah Brown Agency', status: 'revoked', lastSeen: '1 week ago', todayVolume: '₦0', location: 'Kano' },
];

const mockAgents = [
  { id: '1', name: 'John Doe Enterprises' },
  { id: '2', name: 'Jane Smith POS' },
  { id: '3', name: 'Mike Johnson Store' },
  { id: '4', name: 'Sarah Brown Agency' },
];

export default function TerminalsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<typeof mockTerminals[0] | null>(null);

  const pageSize = 10;

  const filteredTerminals = mockTerminals.filter((terminal) => {
    const matchesSearch =
      terminal.terminalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      terminal.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      terminal.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || terminal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTerminals.length / pageSize);
  const paginatedTerminals = filteredTerminals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleRevoke = () => {
    toast({
      title: 'Terminal revoked',
      description: `${selectedTerminal?.terminalId} has been revoked successfully.`,
    });
    setRevokeDialogOpen(false);
    setSelectedTerminal(null);
  };

  const handleSuspend = () => {
    toast({
      title: 'Terminal suspended',
      description: `${selectedTerminal?.terminalId} has been suspended.`,
    });
    setSuspendDialogOpen(false);
    setSelectedTerminal(null);
  };

  const handleReassign = (agentId: string) => {
    const agent = mockAgents.find(a => a.id === agentId);
    toast({
      title: 'Terminal reassigned',
      description: `${selectedTerminal?.terminalId} has been reassigned to ${agent?.name}.`,
    });
    setReassignModalOpen(false);
    setSelectedTerminal(null);
  };

  const columns = [
    { 
      key: 'terminalId', 
      header: 'Terminal ID',
      render: (item: typeof mockTerminals[0]) => (
        <span className="font-mono font-medium">{item.terminalId}</span>
      ),
    },
    { key: 'agent', header: 'Agent Name' },
    {
      key: 'status',
      header: 'Status',
      render: (item: typeof mockTerminals[0]) => (
        <StatusBadge status={item.status as 'online' | 'offline' | 'revoked'} size="sm" />
      ),
    },
    { key: 'lastSeen', header: 'Last Seen' },
    { 
      key: 'todayVolume', 
      header: "Today's Volume",
      render: (item: typeof mockTerminals[0]) => (
        <span className="font-medium">{item.todayVolume}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-40',
      render: (item: typeof mockTerminals[0]) => (
        <div className="flex items-center gap-1">
          <ActionButton
            icon={Eye}
            tooltip="View Details"
            onClick={() => navigate(`/terminals/${item.id}`)}
          />
          <PermissionGate permission="terminals.revoke">
            <ActionButton
              icon={Ban}
              tooltip="Revoke"
              variant="destructive"
              disabled={item.status === 'revoked'}
              onClick={() => {
                setSelectedTerminal(item);
                setRevokeDialogOpen(true);
              }}
            />
          </PermissionGate>
          <PermissionGate permission="terminals.suspend">
            <ActionButton
              icon={Pause}
              tooltip="Suspend"
              disabled={item.status === 'revoked' || item.status === 'offline'}
              onClick={() => {
                setSelectedTerminal(item);
                setSuspendDialogOpen(true);
              }}
            />
          </PermissionGate>
          <PermissionGate permission="terminals.assign">
            <ActionButton
              icon={RefreshCw}
              tooltip="Reassign"
              disabled={item.status === 'revoked'}
              onClick={() => {
                setSelectedTerminal(item);
                setReassignModalOpen(true);
              }}
            />
          </PermissionGate>
          <ActionButton
            icon={FileText}
            tooltip="View Transactions"
            onClick={() => navigate(`/transactions?terminal=${item.terminalId}`)}
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
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={paginatedTerminals}
        emptyMessage="No terminals found"
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredTerminals.length}
        pageSize={pageSize}
      />

      <ConfirmDialog
        open={revokeDialogOpen}
        onOpenChange={setRevokeDialogOpen}
        title="Revoke Terminal"
        description={`Are you sure you want to revoke ${selectedTerminal?.terminalId}? This terminal will no longer be able to process transactions.`}
        confirmLabel="Revoke"
        variant="destructive"
        onConfirm={handleRevoke}
      />

      <ConfirmDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        title="Suspend Terminal"
        description={`Are you sure you want to suspend ${selectedTerminal?.terminalId}? The terminal will be temporarily disabled.`}
        confirmLabel="Suspend"
        variant="destructive"
        onConfirm={handleSuspend}
      />

      <ReassignModal
        open={reassignModalOpen}
        onOpenChange={setReassignModalOpen}
        title="Reassign Terminal"
        description={`Select a new agent for ${selectedTerminal?.terminalId}`}
        agents={mockAgents}
        currentAgentId={selectedTerminal?.agentId}
        onConfirm={handleReassign}
      />
    </div>
  );
}
