import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Eye, Edit, Ban, Shield } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { PermissionGate } from '@/components/PermissionGate';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const mockUsers = [
  { id: '1', name: 'John Smith', email: 'john@partner.com', role: 'Admin', status: 'online', lastActive: 'Just now' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@partner.com', role: 'Manager', status: 'online', lastActive: '5 min ago' },
  { id: '3', name: 'Mike Williams', email: 'mike@partner.com', role: 'Support', status: 'offline', lastActive: '2 hours ago' },
  { id: '4', name: 'Emily Davis', email: 'emily@partner.com', role: 'Analyst', status: 'online', lastActive: '15 min ago' },
  { id: '5', name: 'David Brown', email: 'david@partner.com', role: 'Support', status: 'offline', lastActive: '1 day ago' },
];

const roleColors: Record<string, string> = {
  Admin: 'bg-brand/10 text-brand border-brand/20',
  Manager: 'bg-success/10 text-success border-success/20',
  Support: 'bg-secondary text-secondary-foreground border-border',
  Analyst: 'bg-warning/10 text-warning border-warning/20',
};

export default function UsersList() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDisable = () => {
    toast({
      title: 'User disabled',
      description: `${selectedUser?.name} has been disabled successfully.`,
    });
    setDisableDialogOpen(false);
    setSelectedUser(null);
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { 
      key: 'role', 
      header: 'Role',
      render: (item: typeof mockUsers[0]) => (
        <Badge variant="outline" className={roleColors[item.role] || ''}>
          <Shield className="mr-1 h-3 w-3" />
          {item.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: typeof mockUsers[0]) => (
        <StatusBadge status={item.status as 'online' | 'offline'} size="sm" />
      ),
    },
    { key: 'lastActive', header: 'Last Active' },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: typeof mockUsers[0]) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <PermissionGate permission="users.edit">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
            </PermissionGate>
            <PermissionGate permission="users.disable">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setSelectedUser(item);
                  setDisableDialogOpen(true);
                }}
              >
                <Ban className="mr-2 h-4 w-4" />
                Disable User
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
        title="Users"
        description="Manage partner staff accounts and permissions."
        actions={
          <PermissionGate permission="users.create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        emptyMessage="No users found"
      />

      <ConfirmDialog
        open={disableDialogOpen}
        onOpenChange={setDisableDialogOpen}
        title="Disable User"
        description={`Are you sure you want to disable ${selectedUser?.name}? They will no longer be able to access the platform.`}
        confirmLabel="Disable"
        variant="destructive"
        onConfirm={handleDisable}
      />
    </div>
  );
}
