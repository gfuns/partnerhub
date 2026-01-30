import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Shield, Edit, Mail, Ban, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DetailCard, DetailRow } from '@/components/DetailCard';
import { PermissionGate } from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import usersService, { UserDetail, Role } from '@/services/api/users.service';
import EditUserModal from './EditUserModal';

const roleColors: Record<string, string> = {
  partner_owner: 'bg-purple-500/10 text-purple-700 border-purple-200',
  partner_admin: 'bg-brand/10 text-brand border-brand/20',
  partner_staff: 'bg-blue-500/10 text-blue-700 border-blue-200',
  ops: 'bg-green-500/10 text-green-700 border-green-200',
  finance: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  viewer: 'bg-gray-500/10 text-gray-700 border-gray-200',
};

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resendingInvitation, setResendingInvitation] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUserDetails();
      fetchRoles();
    }
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await usersService.getUser(Number(id));
      if (response.success) {
        setUserDetail(response.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load user details',
        variant: 'destructive',
      });
      navigate('/users');
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

  const handleResendInvitation = async () => {
    if (!userDetail) return;

    try {
      setResendingInvitation(true);
      const response = await usersService.resendInvitation(userDetail.context_id);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastLogin = (dateString: string | null) => {
    if (!dateString) return 'Never logged in';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  const isSelf = userDetail?.context_id === currentUser?.currentContext?.id;
  const isOwner = userDetail?.role === 'partner_owner';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!userDetail) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={`${userDetail.user.first_name} ${userDetail.user.last_name}`}
        description={userDetail.user.email}
        actions={
          <div className="flex gap-2">
            <PermissionGate permission="users.edit">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                disabled={isSelf || isOwner}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </PermissionGate>
            <PermissionGate permission="users.edit">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendInvitation}
                disabled={resendingInvitation}
              >
                <Mail className="mr-2 h-4 w-4" />
                {resendingInvitation ? 'Sending...' : 'Resend Invitation'}
              </Button>
            </PermissionGate>
            <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <DetailCard title="User Profile">
            <DetailRow
              label="Name"
              value={
                <div className="flex items-center gap-2">
                  {userDetail.user.first_name} {userDetail.user.last_name}
                  {userDetail.is_primary && (
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 border-purple-200">
                      Owner
                    </Badge>
                  )}
                </div>
              }
            />
            <DetailRow label="Email" value={userDetail.user.email} />
            <DetailRow label="Phone" value={userDetail.user.phone || '-'} />
            <DetailRow
              label="Status"
              value={
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={userDetail.status === 'active' ? 'active' : 'disabled'}
                    size="sm"
                  />
                  {userDetail.user.status !== userDetail.status && (
                    <span className="text-xs text-muted-foreground">
                      (User Account: {userDetail.user.status})
                    </span>
                  )}
                </div>
              }
            />
            <DetailRow label="Last Login" value={formatLastLogin(userDetail.user.last_login_at)} />
            <DetailRow label="Added" value={formatDate(userDetail.created_at)} />
          </DetailCard>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Badge variant="outline" className={roleColors[userDetail.role] || ''}>
                  <Shield className="mr-1 h-3 w-3" />
                  {userDetail.role_label}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Permissions:</p>
                {userDetail.permissions && userDetail.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userDetail.permissions.map((permission, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific permissions defined</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditUserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={{
          context_id: userDetail.context_id,
          user_id: userDetail.user.id,
          first_name: userDetail.user.first_name,
          last_name: userDetail.user.last_name,
          email: userDetail.user.email,
          phone: userDetail.user.phone,
          avatar_url: userDetail.user.avatar_url,
          role: userDetail.role,
          role_label: userDetail.role_label,
          is_primary: userDetail.is_primary,
          status: userDetail.status,
          user_status: userDetail.user.status,
          last_login_at: userDetail.user.last_login_at,
          created_at: userDetail.created_at,
        }}
        roles={roles}
        onSuccess={fetchUserDetails}
      />
    </div>
  );
}
