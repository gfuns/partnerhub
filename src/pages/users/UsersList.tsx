import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Ban, Shield } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { PermissionGate } from '@/components/PermissionGate';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ActionButton } from '@/components/ActionButton';
import { TablePagination } from '@/components/TablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const mockUsers = [
  { id: '1', name: 'John Smith', email: 'john@partner.com', role: 'Admin', status: 'active', createdAt: '2024-01-10' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@partner.com', role: 'Manager', status: 'active', createdAt: '2024-01-08' },
  { id: '3', name: 'Mike Williams', email: 'mike@partner.com', role: 'Support', status: 'disabled', createdAt: '2024-01-05' },
  { id: '4', name: 'Emily Davis', email: 'emily@partner.com', role: 'Analyst', status: 'active', createdAt: '2024-01-03' },
  { id: '5', name: 'David Brown', email: 'david@partner.com', role: 'Support', status: 'active', createdAt: '2024-01-01' },
];

const roleColors: Record<string, string> = {
  Admin: 'bg-brand/10 text-brand border-brand/20',
  Manager: 'bg-success/10 text-success border-success/20',
  Support: 'bg-secondary text-secondary-foreground border-border',
  Analyst: 'bg-warning/10 text-warning border-warning/20',
};

export default function UsersList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);

  const pageSize = 10;

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDisable = () => {
    toast({
      title: 'User disabled',
      description: `${selectedUser?.name} has been disabled successfully.`,
    });
    setDisableDialogOpen(false);
    setSelectedUser(null);
  };

  const isSelf = (userId: string) => user?.id === userId;

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
        <StatusBadge status={item.status as 'active' | 'disabled'} size="sm" />
      ),
    },
    { key: 'createdAt', header: 'Created Date' },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (item: typeof mockUsers[0]) => (
        <div className="flex items-center gap-1">
          <ActionButton
            icon={Eye}
            tooltip="View Details"
            onClick={() => navigate(`/users/${item.id}`)}
          />
          <PermissionGate permission="users.edit">
            <ActionButton
              icon={Edit}
              tooltip="Edit User"
              onClick={() => navigate(`/users/${item.id}/edit`)}
            />
          </PermissionGate>
          <PermissionGate permission="users.disable">
            <ActionButton
              icon={Ban}
              tooltip={isSelf(item.id) ? "Cannot disable yourself" : "Disable User"}
              variant="destructive"
              disabled={isSelf(item.id) || item.status === 'disabled'}
              onClick={() => {
                setSelectedUser(item);
                setDisableDialogOpen(true);
              }}
            />
          </PermissionGate>
        </div>
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
            <Button onClick={() => navigate('/users/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Support">Support</SelectItem>
              <SelectItem value="Analyst">Analyst</SelectItem>
            </SelectContent>
          </Select>

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
      </div>

      <DataTable
        columns={columns}
        data={paginatedUsers}
        emptyMessage="No users found"
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredUsers.length}
        pageSize={pageSize}
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
