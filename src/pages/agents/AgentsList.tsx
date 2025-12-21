import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Ban, CreditCard } from 'lucide-react';
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

const mockAgents = [
  { id: '1', businessName: 'ABC Enterprises', contactName: 'John Doe', phone: '+234 801 234 5678', terminals: 3, status: 'active', createdAt: '2024-01-15' },
  { id: '2', businessName: 'XYZ Holdings', contactName: 'Jane Smith', phone: '+234 802 345 6789', terminals: 5, status: 'active', createdAt: '2024-01-10' },
  { id: '3', businessName: 'Quick Mart', contactName: 'Mike Johnson', phone: '+234 803 456 7890', terminals: 2, status: 'disabled', createdAt: '2024-01-08' },
  { id: '4', businessName: 'Delta Services', contactName: 'Sarah Brown', phone: '+234 804 567 8901', terminals: 4, status: 'active', createdAt: '2024-01-05' },
  { id: '5', businessName: 'Prime Store', contactName: 'David Wilson', phone: '+234 805 678 9012', terminals: 1, status: 'disabled', createdAt: '2024-01-02' },
  { id: '6', businessName: 'Mega Ventures', contactName: 'Emily Davis', phone: '+234 806 789 0123', terminals: 6, status: 'active', createdAt: '2023-12-28' },
  { id: '7', businessName: 'Smart Solutions', contactName: 'Chris Martin', phone: '+234 807 890 1234', terminals: 2, status: 'active', createdAt: '2023-12-20' },
  { id: '8', businessName: 'Global Tech', contactName: 'Lisa Anderson', phone: '+234 808 901 2345', terminals: 8, status: 'active', createdAt: '2023-12-15' },
];

export default function AgentsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<typeof mockAgents[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredAgents = mockAgents.filter((agent) => {
    const matchesSearch =
      agent.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAgents.length / pageSize);
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDisable = () => {
    toast({
      title: 'Agent disabled',
      description: `${selectedAgent?.businessName} has been disabled successfully.`,
    });
    setDisableDialogOpen(false);
    setSelectedAgent(null);
  };

  const columns = [
    { 
      key: 'businessName', 
      header: 'Business Name',
      render: (item: typeof mockAgents[0]) => (
        <span className="font-medium">{item.businessName}</span>
      ),
    },
    { key: 'contactName', header: 'Contact Person' },
    { key: 'phone', header: 'Phone' },
    { 
      key: 'terminals', 
      header: 'Terminals',
      render: (item: typeof mockAgents[0]) => (
        <span className="font-medium">{item.terminals}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: typeof mockAgents[0]) => (
        <StatusBadge status={item.status as 'active' | 'disabled'} size="sm" />
      ),
    },
    { key: 'createdAt', header: 'Created' },
    {
      key: 'actions',
      header: '',
      className: 'w-32',
      render: (item: typeof mockAgents[0]) => (
        <div className="flex items-center gap-1">
          <ActionButton
            icon={Eye}
            label="View Agent"
            onClick={() => navigate(`/agents/${item.id}`)}
          />
          {hasPermission('agents.edit') && (
            <ActionButton
              icon={Edit}
              label="Edit Agent"
              onClick={() => navigate(`/agents/${item.id}/edit`)}
            />
          )}
          {hasPermission('agents.disable') && (
            <ActionButton
              icon={Ban}
              label="Disable Agent"
              onClick={() => {
                setSelectedAgent(item);
                setDisableDialogOpen(true);
              }}
            />
          )}
          <ActionButton
            icon={CreditCard}
            label="View Terminals"
            onClick={() => navigate(`/terminals?agent=${item.id}`)}
          />
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
              Add Agent
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={paginatedAgents}
        emptyMessage="No agents found"
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredAgents.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      <ConfirmDialog
        open={disableDialogOpen}
        onOpenChange={setDisableDialogOpen}
        title="Disable Agent"
        description={`Are you sure you want to disable ${selectedAgent?.businessName}? They will no longer be able to process transactions.`}
        confirmLabel="Disable"
        variant="destructive"
        onConfirm={handleDisable}
      />
    </div>
  );
}
