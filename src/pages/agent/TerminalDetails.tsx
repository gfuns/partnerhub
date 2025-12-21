import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, CreditCard, TrendingUp, Receipt, Clock } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock terminal data
const terminalData = {
  terminalId: 'TRM-001',
  status: 'online',
  lastSeen: '2024-01-15 14:32:00',
  partner: 'Page Financials',
  todayTransactions: 45,
  todayVolume: '₦125,000',
  successRate: '97.8%',
  assignedDate: '2024-01-01',
};

const recentTransactions = [
  { id: 'TXN-001234', amount: '₦25,000', status: 'success', date: '2024-01-15 14:32', type: 'Transfer' },
  { id: 'TXN-001235', amount: '₦150,000', status: 'success', date: '2024-01-15 14:28', type: 'Withdrawal' },
  { id: 'TXN-001236', amount: '₦8,500', status: 'error', date: '2024-01-15 14:25', type: 'Transfer' },
  { id: 'TXN-001237', amount: '₦45,000', status: 'success', date: '2024-01-15 14:20', type: 'Deposit' },
  { id: 'TXN-001238', amount: '₦12,000', status: 'success', date: '2024-01-15 14:15', type: 'Transfer' },
];

const columns = [
  { 
    key: 'id', 
    header: 'Transaction ID',
    render: (item: typeof recentTransactions[0]) => (
      <span className="font-mono text-sm">{item.id}</span>
    ),
  },
  { key: 'type', header: 'Type' },
  { 
    key: 'amount', 
    header: 'Amount',
    render: (item: typeof recentTransactions[0]) => (
      <span className="font-medium">{item.amount}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (item: typeof recentTransactions[0]) => (
      <StatusBadge status={item.status as 'success' | 'error'} size="sm" />
    ),
  },
  { key: 'date', header: 'Date' },
  {
    key: 'actions',
    header: '',
    className: 'w-12',
    render: (item: typeof recentTransactions[0]) => (
      <Link to={`/agent/transactions/${item.id}`}>
        <ActionButton icon={Eye} tooltip="View Details" variant="ghost" />
      </Link>
    ),
  },
];

export default function AgentTerminalDetails() {
  const { id } = useParams();

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/my-terminals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Terminals
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Terminal ${id || terminalData.terminalId}`}
        description="View terminal details and recent activity."
      />

      {/* Overview Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base font-medium">Terminal Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Terminal ID</p>
              <p className="text-lg font-mono font-medium">{terminalData.terminalId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">
                <StatusBadge status={terminalData.status as 'online' | 'offline'} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Heartbeat</p>
              <p className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {terminalData.lastSeen}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned Partner</p>
              <p className="text-lg font-medium">{terminalData.partner}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          title="Today's Transactions"
          value={terminalData.todayTransactions.toString()}
          icon={Receipt}
        />
        <StatCard
          title="Today's Volume"
          value={terminalData.todayVolume}
          icon={CreditCard}
        />
        <StatCard
          title="Success Rate"
          value={terminalData.successRate}
          icon={TrendingUp}
        />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/agent/transactions?terminal=${terminalData.terminalId}`}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={recentTransactions} 
            emptyMessage="No transactions yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
