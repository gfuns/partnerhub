import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Ban, Shield, Mail, UserCog } from 'lucide-react';
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
import usersService, { User, Role } from '@/services/api/users.service';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';

const roleColors: Record<string, string> = {
  partner_owner: 'bg-purple-500/10 text-purple-700 border-purple-200',
  partner_admin: 'bg-brand/10 text-brand border-brand/20',
  partner_staff: 'bg-blue-500/10 text-blue-700 border-blue-200',
  ops: 'bg-green-500/10 text-green-700 border-green-200',
  finance: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  viewer: 'bg-gray-500/10 text-gray-700 border-gray-200',
};

export default function UsersList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, getAssetUrl } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(15);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resendingInvitation, setResendingInvitation] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [currentPage, searchQuery, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersService.getUsers({
        page: currentPage,
        per_page: perPage,
        search: searchQuery || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (response.success) {
        setUsers(response.data);
        setTotalPages(response.meta.last_page);
        setTotal(response.meta.total);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await usersService.getRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const response = await usersService.deleteUser(selectedUser.context_id);
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message,
        });
        fetchUsers();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove user access',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleResendInvitation = async (user: User) => {
    try {
      setResendingInvitation(true);
      const response = await usersService.resendInvitation(user.context_id);
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resend invitation',
        variant: 'destructive',
      });
    } finally {
      setResendingInvitation(false);
    }
  };

  const isSelf = (contextId: number) => {
    // Check if this is the current user's context
    return currentUser?.context_id === contextId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatLastLogin = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (item: User) => (
        <div className="flex items-center gap-3">
          {item.avatar_url ? (
            <img
              src={getAssetUrl(item.avatar_url) || ''}
              alt={`${item.first_name} ${item.last_name}`}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand text-sm font-medium">
              {item.first_name[0]}{item.last_name[0]}
            </div>
          )}
          <div>
            <div className="font-medium">
              {item.first_name} {item.last_name}
              {item.is_primary && (
                <Badge variant="outline" className="ml-2 text-xs bg-purple-500/10 text-purple-700 border-purple-200">
                  Owner
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{item.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (item: User) => (
        <span className="text-sm">{item.phone || '-'}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (item: User) => (
        <Badge variant="outline" className={roleColors[item.role] || ''}>
          <Shield className="mr-1 h-3 w-3" />
          {item.role_label}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: User) => (
        <div className="flex flex-col gap-1">
          <StatusBadge 
            status={item.status === 'active' ? 'active' : 'disabled'} 
            size="sm" 
          />
          {item.user_status !== item.status && (
            <span className="text-xs text-muted-foreground">
              User Access is: {item.user_status}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'last_login_at',
      header: 'Last Login',
      render: (item: User) => (
        <span className="text-sm">{formatLastLogin(item.last_login_at)}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Added',
      render: (item: User) => (
        <span className="text-sm">{formatDate(item.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-32',
      render: (item: User) => (
        <div className="flex items-center gap-1">
          {item?.status === 'active' && (
            <>
            
            <ActionButton
              icon={Eye}
              tooltip="View Details"
              onClick={() => navigate(`/users/${item.context_id}`)}
            />
            <PermissionGate permission="users.edit">
              <ActionButton
                icon={Edit}
                tooltip={isSelf(item.context_id) || item.role === 'partner_owner' ? 'Cannot edit' : 'Edit User'}
                onClick={() => {
                  setSelectedUser(item);
                  setEditModalOpen(true);
                }}
                disabled={isSelf(item.context_id) || item.role === 'partner_owner'}
              />
            </PermissionGate>
            <PermissionGate permission="users.edit">
              <ActionButton
                icon={Mail}
                tooltip="Resend Invitation"
                onClick={() => handleResendInvitation(item)}
                disabled={resendingInvitation}
              />
            </PermissionGate>
            </>
          )}
          <PermissionGate permission="users.delete">
            <ActionButton
              icon={Ban}
              tooltip={
                isSelf(item.context_id)
                  ? 'Cannot remove yourself'
                  : item.role === 'partner_owner'
                  ? 'Cannot remove owner'
                  : 'Remove Access'
              }
              variant="destructive"
              disabled={isSelf(item.context_id) || item.role === 'partner_owner'}
              onClick={() => {
                setSelectedUser(item);
                setDeleteDialogOpen(true);
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
            <Button onClick={() => setCreateModalOpen(true)}>
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
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex gap-3">
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
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
        data={users}
        loading={loading}
        emptyMessage="No users found"
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={total}
        pageSize={perPage}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove User Access"
        description={
          selectedUser
            ? `Are you sure you want to remove access for ${selectedUser.first_name} ${selectedUser.last_name}? They will no longer be able to access this partner account.`
            : ''
        }
        confirmLabel="Remove Access"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchUsers}
        roles={roles}
      />

      {selectedUser && (
        <EditUserModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          user={selectedUser}
          roles={roles}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
}
