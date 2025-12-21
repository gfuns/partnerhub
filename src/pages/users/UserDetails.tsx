import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DetailCard, DetailRow } from '@/components/DetailCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const mockUser = {
  id: '1',
  name: 'John Smith',
  email: 'john@partner.com',
  role: 'Admin',
  status: 'active',
  createdAt: '2024-01-15',
  lastActive: 'Just now',
};

const rolePermissions: Record<string, string[]> = {
  Admin: ['Dashboard', 'Agents (Full)', 'Terminals (Full)', 'Transactions (Full)', 'Reports (Full)', 'Users (Full)', 'Settings (Full)'],
  Manager: ['Dashboard', 'Agents (Full)', 'Terminals (Full)', 'Transactions (View)', 'Reports (View)'],
  Support: ['Dashboard', 'Agents (View)', 'Terminals (View)', 'Transactions (View)'],
  Analyst: ['Dashboard', 'Reports (Full)', 'Transactions (View)'],
};

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title={mockUser.name}
        description={mockUser.email}
        actions={<Button variant="ghost" onClick={() => navigate('/users')}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard title="User Profile">
          <DetailRow label="Name" value={mockUser.name} />
          <DetailRow label="Email" value={mockUser.email} />
          <DetailRow label="Status" value={<StatusBadge status={mockUser.status as 'active'} size="sm" />} />
          <DetailRow label="Last Active" value={mockUser.lastActive} />
          <DetailRow label="Created" value={mockUser.createdAt} />
        </DetailCard>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Badge variant="outline" className="bg-brand/10 text-brand border-brand/20">
                <Shield className="mr-1 h-3 w-3" />
                {mockUser.role}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Permissions:</p>
              <div className="flex flex-wrap gap-2">
                {(rolePermissions[mockUser.role] || []).map((permission, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">{permission}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
