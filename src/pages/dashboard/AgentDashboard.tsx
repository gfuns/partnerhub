import { Link } from 'react-router-dom';
import { CreditCard, Receipt, TrendingUp, Wallet, Eye } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

// Mock data
const weeklyData = [
  { day: 'Mon', amount: 45000 },
  { day: 'Tue', amount: 52000 },
  { day: 'Wed', amount: 48000 },
  { day: 'Thu', amount: 61000 },
  { day: 'Fri', amount: 55000 },
  { day: 'Sat', amount: 67000 },
  { day: 'Sun', amount: 43000 },
];

const transactionStatusData = [
  { name: 'Success', value: 156, color: 'hsl(var(--success))' },
  { name: 'Failed', value: 8, color: 'hsl(var(--destructive))' },
];

const recentTransactions = [
  { id: 'TXN-001234', terminal: 'TRM-001', amount: '₦25,000', status: 'success', date: '2024-01-15 14:32', type: 'Transfer' },
  { id: 'TXN-001235', terminal: 'TRM-001', amount: '₦150,000', status: 'success', date: '2024-01-15 14:28', type: 'Withdrawal' },
  { id: 'TXN-001236', terminal: 'TRM-002', amount: '₦8,500', status: 'error', date: '2024-01-15 14:25', type: 'Transfer' },
  { id: 'TXN-001237', terminal: 'TRM-001', amount: '₦45,000', status: 'success', date: '2024-01-15 14:20', type: 'Deposit' },
  { id: 'TXN-001238', terminal: 'TRM-002', amount: '₦12,000', status: 'success', date: '2024-01-15 14:15', type: 'Transfer' },
];

const columns = [
  { 
    key: 'id', 
    header: 'Transaction ID',
    render: (item: typeof recentTransactions[0]) => (
      <span className="font-mono text-sm">{item.id}</span>
    ),
  },
  { key: 'terminal', header: 'Terminal' },
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

const myTerminals = [
  { id: '1', terminalId: 'TRM-001', status: 'online', lastSeen: 'Just now', todayVolume: '₦125,000' },
  { id: '2', terminalId: 'TRM-002', status: 'offline', lastSeen: '2 hours ago', todayVolume: '₦45,000' },
];

const terminalColumns = [
  { 
    key: 'terminalId', 
    header: 'Terminal ID',
    render: (item: typeof myTerminals[0]) => (
      <span className="font-mono font-medium">{item.terminalId}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (item: typeof myTerminals[0]) => (
      <StatusBadge status={item.status as 'online' | 'offline'} size="sm" />
    ),
  },
  { key: 'lastSeen', header: 'Last Seen' },
  { key: 'todayVolume', header: "Today's Volume" },
];

export default function AgentDashboard() {
  const { user } = useAuth();

  const totalTransactions = transactionStatusData.reduce((acc, item) => acc + item.value, 0);
  const successRate = ((transactionStatusData[0].value / totalTransactions) * 100).toFixed(1);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}`}
        description="Here's an overview of your terminal activity today."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Today's Transactions"
          value={totalTransactions.toString()}
          icon={Receipt}
          change={{ value: 12, label: 'vs yesterday' }}
          trend="up"
        />
        <StatCard
          title="Today's Total"
          value="₦371,000"
          icon={Wallet}
          change={{ value: 15, label: 'vs yesterday' }}
          trend="up"
        />
        <StatCard
          title="Active Terminals"
          value="2"
          icon={CreditCard}
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          icon={TrendingUp}
          change={{ value: 2.1, label: 'this week' }}
          trend="up"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        {/* Weekly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Transaction Volume (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `₦${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Volume']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Success vs Failed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Success vs Failed Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="flex items-center gap-8">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={transactionStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {transactionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  {transactionStatusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-2xl font-semibold">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Terminals */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">My Terminals</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/my-terminals">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={terminalColumns} data={myTerminals} />
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/agent/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={recentTransactions} />
        </CardContent>
      </Card>
    </div>
  );
}
