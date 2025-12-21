import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Eye, UserPlus, Ban, Power } from 'lucide-react';
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

const mockTerminals = [
  { id: '1', terminalId: 'TRM-001', agent: 'John Doe', status: 'online', lastSeen: 'Just now', transactions: 156, location: 'Lagos' },
  { id: '2', terminalId: 'TRM-002', agent: 'John Doe', status: 'online', lastSeen: '5 min ago', transactions: 89, location: 'Lagos' },
  { id: '3', terminalId: 'TRM-003', agent: 'Jane Smith', status: 'offline', lastSeen: '2 hours ago', transactions: 234, location: 'Abuja' },
  { id: '4', terminalId: 'TRM-004', agent: 'Mike Johnson', status: 'online', lastSeen: 'Just now', transactions: 67, location: 'Port Harcourt' },
  { id: '5', terminalId: 'TRM-005', agent: 'Unassigned', status: 'offline', lastSeen: 'Never', transactions: 0, location: '-' },
];

export default function TerminalsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<typeof mockTerminals[0] | null>(null);

  const filteredTerminals = mockTerminals.filter(
    (terminal) =>
      terminal.terminalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      terminal.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      terminal.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRevoke = () => {
    toast({
      title: 'Terminal revoked',
      description: `${selectedTerminal?.terminalId} has been revoked successfully.`,
    });
    setRevokeDialogOpen(false);
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
    { key: 'agent', header: 'Agent' },
    { key: 'location', header: 'Location' },
    {
      key: 'status',
      header: 'Status',
      render: (item: typeof mockTerminals[0]) => (
        <StatusBadge status={item.status as 'online' | 'offline'} size="sm" />
      ),
    },
    { key: 'lastSeen', header: 'Last Seen' },
    { 
      key: 'transactions', 
      header: 'Transactions',
      render: (item: typeof mockTerminals[0]) => (
        <span className="font-medium">{item.transactions}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: typeof mockTerminals[0]) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/terminals/${item.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <PermissionGate permission="terminals.assign">
              <DropdownMenuItem onClick={() => navigate(`/terminals/${item.id}/assign`)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign to Agent
              </DropdownMenuItem>
            </PermissionGate>
            <PermissionGate permission="terminals.revoke">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setSelectedTerminal(item);
                  setRevokeDialogOpen(true);
                }}
              >
                <Ban className="mr-2 h-4 w-4" />
                Revoke Terminal
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

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search terminals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTerminals}
        emptyMessage="No terminals found"
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
    </div>
  );
}
