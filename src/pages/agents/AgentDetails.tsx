import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Ban, CreditCard, TrendingUp, Activity } from 'lucide-react';
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

// Mock data
const mockAgent = {
  id: '1',
  businessName: 'ABC Enterprises',
  businessAddress: '123 Main Street, Lagos',
  businessPhone: '+234 801 234 5678',
  contactName: 'John Doe',
  contactEmail: 'john@abcent.com',
  contactPhone: '+234 802 345 6789',
  status: 'active',
  createdAt: '2024-01-15',
  totalTerminals: 5,
  activeTerminals: 4,
  totalVolume: '₦12,500,000',
};

const mockTerminals = [
  { id: '1', terminalId: 'TRM-001', status: 'online', lastSeen: 'Just now', transactions: 156 },
  { id: '2', terminalId: 'TRM-002', status: 'online', lastSeen: '5 min ago', transactions: 89 },
  { id: '3', terminalId: 'TRM-003', status: 'offline', lastSeen: '2 hours ago', transactions: 234 },
  { id: '4', terminalId: 'TRM-004', status: 'online', lastSeen: 'Just now', transactions: 67 },
  { id: '5', terminalId: 'TRM-005', status: 'offline', lastSeen: '1 day ago', transactions: 0 },
];

const mockTransactions = [
  { id: '1', reference: 'TXN-001234', amount: '₦25,000', type: 'Transfer', status: 'success', date: '2024-01-15 10:32' },
  { id: '2', reference: 'TXN-001235', amount: '₦150,000', type: 'Withdrawal', status: 'success', date: '2024-01-15 10:28' },
  { id: '3', reference: 'TXN-001236', amount: '₦8,500', type: 'Transfer', status: 'error', date: '2024-01-15 10:25' },
  { id: '4', reference: 'TXN-001237', amount: '₦45,000', type: 'Deposit', status: 'pending', date: '2024-01-15 10:20' },
];

export default function AgentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);

  const handleDisable = () => {
    toast({
      title: 'Agent disabled',
      description: `${mockAgent.businessName} has been disabled successfully.`,
    });
    setDisableDialogOpen(false);
  };

  const terminalColumns = [
    { 
      key: 'terminalId', 
      header: 'Terminal ID',
      render: (item: typeof mockTerminals[0]) => (
        <span className="font-mono font-medium">{item.terminalId}</span>
      ),
    },
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
  ];

  const transactionColumns = [
    { 
      key: 'reference', 
      header: 'Reference',
      render: (item: typeof mockTransactions[0]) => (
        <span className="font-mono text-sm">{item.reference}</span>
      ),
    },
    { key: 'type', header: 'Type' },
    { 
      key: 'amount', 
      header: 'Amount',
      render: (item: typeof mockTransactions[0]) => (
        <span className="font-medium">{item.amount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: typeof mockTransactions[0]) => (
        <StatusBadge status={item.status as 'success' | 'error' | 'pending'} size="sm" />
      ),
    },
    { key: 'date', header: 'Date' },
  ];

  return (
    <div>
      <PageHeader
        title={mockAgent.businessName}
        description={`Agent ID: ${id}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/agents')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <PermissionGate permission="agents.edit">
              <Button variant="outline" onClick={() => navigate(`/agents/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </PermissionGate>
            <PermissionGate permission="agents.disable">
              <Button variant="destructive" onClick={() => setDisableDialogOpen(true)}>
                <Ban className="mr-2 h-4 w-4" />
                Disable
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="terminals">Terminals</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total Terminals"
              value={mockAgent.totalTerminals}
              icon={CreditCard}
            />
            <StatCard
              title="Active Terminals"
              value={mockAgent.activeTerminals}
              icon={Activity}
              change={{ value: 80, label: 'utilization' }}
              trend="up"
            />
            <StatCard
              title="Total Volume"
              value={mockAgent.totalVolume}
              icon={TrendingUp}
            />
          </div>

          {/* Agent Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <DetailCard title="Business Information">
              <DetailRow label="Business Name" value={mockAgent.businessName} />
              <DetailRow label="Business Address" value={mockAgent.businessAddress} />
              <DetailRow label="Business Phone" value={mockAgent.businessPhone} />
              <DetailRow label="Status" value={<StatusBadge status={mockAgent.status as 'active'} size="sm" />} />
              <DetailRow label="Created" value={mockAgent.createdAt} />
            </DetailCard>

            <DetailCard title="Contact Person">
              <DetailRow label="Name" value={mockAgent.contactName} />
              <DetailRow label="Email" value={mockAgent.contactEmail} />
              <DetailRow label="Phone" value={mockAgent.contactPhone} />
            </DetailCard>
          </div>
        </TabsContent>

        <TabsContent value="terminals">
          <DataTable
            columns={terminalColumns}
            data={mockTerminals}
            onRowClick={(item) => navigate(`/terminals/${item.id}`)}
            emptyMessage="No terminals assigned to this agent"
          />
        </TabsContent>

        <TabsContent value="transactions">
          <DataTable
            columns={transactionColumns}
            data={mockTransactions}
            onRowClick={(item) => navigate(`/transactions/${item.id}`)}
            emptyMessage="No transactions for this agent"
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={disableDialogOpen}
        onOpenChange={setDisableDialogOpen}
        title="Disable Agent"
        description={`Are you sure you want to disable ${mockAgent.businessName}? All terminals will be suspended and the agent will no longer be able to process transactions.`}
        confirmLabel="Disable Agent"
        variant="destructive"
        onConfirm={handleDisable}
      />
    </div>
  );
}
