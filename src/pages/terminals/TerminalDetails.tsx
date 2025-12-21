import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Pause, RefreshCw, Activity, TrendingUp, Clock } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { DetailCard, DetailRow } from '@/components/DetailCard';
import { PermissionGate } from '@/components/PermissionGate';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const mockTerminal = {
  id: 'TRM-001',
  agent: 'ABC Enterprises',
  agentId: '1',
  status: 'online',
  lastSeen: '2024-01-15 10:32:15',
  todayVolume: '₦2,500,000',
  todayTransactions: 156,
  createdAt: '2024-01-01',
};

const mockTransactions = [
  { id: '1', reference: 'TXN-001234', amount: '₦25,000', type: 'Transfer', status: 'success', date: '2024-01-15 10:32' },
  { id: '2', reference: 'TXN-001235', amount: '₦150,000', type: 'Withdrawal', status: 'success', date: '2024-01-15 10:28' },
];

const mockActivityLog = [
  { id: '1', event: 'Transaction processed', details: 'TXN-001234 - ₦25,000', timestamp: '2024-01-15 10:32:15' },
  { id: '2', event: 'Heartbeat received', details: 'Terminal online', timestamp: '2024-01-15 10:30:00' },
  { id: '3', event: 'Transaction processed', details: 'TXN-001233 - ₦15,000', timestamp: '2024-01-15 10:25:00' },
];

export default function TerminalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

  const handleRevoke = () => {
    toast({ title: 'Terminal revoked', description: `${mockTerminal.id} has been revoked.` });
    setRevokeDialogOpen(false);
  };

  const handleSuspend = () => {
    toast({ title: 'Terminal suspended', description: `${mockTerminal.id} has been suspended.` });
    setSuspendDialogOpen(false);
  };

  const transactionColumns = [
    { key: 'reference', header: 'Reference', render: (item: typeof mockTransactions[0]) => <span className="font-mono text-sm">{item.reference}</span> },
    { key: 'type', header: 'Type' },
    { key: 'amount', header: 'Amount', render: (item: typeof mockTransactions[0]) => <span className="font-medium">{item.amount}</span> },
    { key: 'status', header: 'Status', render: (item: typeof mockTransactions[0]) => <StatusBadge status={item.status as 'success'} size="sm" /> },
    { key: 'date', header: 'Date' },
  ];

  const activityColumns = [
    { key: 'event', header: 'Event', render: (item: typeof mockActivityLog[0]) => <span className="font-medium">{item.event}</span> },
    { key: 'details', header: 'Details' },
    { key: 'timestamp', header: 'Time' },
  ];

  return (
    <div>
      <PageHeader
        title={mockTerminal.id}
        description={`Assigned to ${mockTerminal.agent}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/terminals')}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
            <PermissionGate permission="terminals.revoke">
              <Button variant="outline" onClick={() => setSuspendDialogOpen(true)}><Pause className="mr-2 h-4 w-4" />Suspend</Button>
              <Button variant="destructive" onClick={() => setRevokeDialogOpen(true)}><Ban className="mr-2 h-4 w-4" />Revoke</Button>
            </PermissionGate>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Today's Volume" value={mockTerminal.todayVolume} icon={TrendingUp} />
            <StatCard title="Transactions" value={mockTerminal.todayTransactions} icon={Activity} />
            <StatCard title="Last Seen" value="Just now" icon={Clock} />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <DetailCard title="Terminal Information">
              <DetailRow label="Terminal ID" value={<span className="font-mono">{mockTerminal.id}</span>} />
              <DetailRow label="Status" value={<StatusBadge status={mockTerminal.status as 'online'} size="sm" />} />
              <DetailRow label="Last Heartbeat" value={mockTerminal.lastSeen} />
              <DetailRow label="Created" value={mockTerminal.createdAt} />
            </DetailCard>
            <DetailCard title="Agent Information">
              <DetailRow label="Agent" value={mockTerminal.agent} />
              <DetailRow label="Agent ID" value={mockTerminal.agentId} />
            </DetailCard>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <DataTable columns={transactionColumns} data={mockTransactions} emptyMessage="No transactions" />
        </TabsContent>

        <TabsContent value="activity">
          <DataTable columns={activityColumns} data={mockActivityLog} emptyMessage="No activity" />
        </TabsContent>
      </Tabs>

      <ConfirmDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen} title="Revoke Terminal" description={`Are you sure you want to revoke ${mockTerminal.id}?`} confirmLabel="Revoke" variant="destructive" onConfirm={handleRevoke} />
      <ConfirmDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen} title="Suspend Terminal" description={`Are you sure you want to suspend ${mockTerminal.id}?`} confirmLabel="Suspend" variant="destructive" onConfirm={handleSuspend} />
    </div>
  );
}
