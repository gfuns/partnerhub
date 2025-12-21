import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Eye, Edit, Ban } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { PermissionGate } from '@/components/PermissionGate';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const mockAgents = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+234 801 234 5678', terminals: 3, status: 'online', location: 'Lagos' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+234 802 345 6789', terminals: 5, status: 'online', location: 'Abuja' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', phone: '+234 803 456 7890', terminals: 2, status: 'offline', location: 'Port Harcourt' },
  { id: '4', name: 'Sarah Brown', email: 'sarah@example.com', phone: '+234 804 567 8901', terminals: 4, status: 'online', location: 'Ibadan' },
  { id: '5', name: 'David Wilson', email: 'david@example.com', phone: '+234 805 678 9012', terminals: 1, status: 'offline', location: 'Kano' },
];

export default function AgentsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<typeof mockAgents[0] | null>(null);

  const filteredAgents = mockAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDisable = () => {
    toast({
      title: 'Agent disabled',
      description: `${selectedAgent?.name} has been disabled successfully.`,
    });
    setDisableDialogOpen(false);
    setSelectedAgent(null);
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'location', header: 'Location' },
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
        <StatusBadge status={item.status as 'online' | 'offline'} size="sm" />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: typeof mockAgents[0]) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/agents/${item.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <PermissionGate permission="agents.edit">
              <DropdownMenuItem onClick={() => navigate(`/agents/${item.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Agent
              </DropdownMenuItem>
            </PermissionGate>
            <PermissionGate permission="agents.disable">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setSelectedAgent(item);
                  setDisableDialogOpen(true);
                }}
              >
                <Ban className="mr-2 h-4 w-4" />
                Disable Agent
              </DropdownMenuItem>
            </PermissionGate>
          </DropdownMenuContent>
        </DropdownMenu>
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

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredAgents}
        emptyMessage="No agents found"
      />

      <ConfirmDialog
        open={disableDialogOpen}
        onOpenChange={setDisableDialogOpen}
        title="Disable Agent"
        description={`Are you sure you want to disable ${selectedAgent?.name}? They will no longer be able to process transactions.`}
        confirmLabel="Disable"
        variant="destructive"
        onConfirm={handleDisable}
      />
    </div>
  );
}
