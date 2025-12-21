import { CreditCard, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTable } from '@/components/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

const recentTransactions = [
  { id: '1', terminal: 'TRM-001', amount: '₦25,000', status: 'success', time: '2 min ago', type: 'Transfer' },
  { id: '2', terminal: 'TRM-001', amount: '₦150,000', status: 'success', time: '5 min ago', type: 'Withdrawal' },
  { id: '3', terminal: 'TRM-002', amount: '₦8,500', status: 'error', time: '8 min ago', type: 'Transfer' },
  { id: '4', terminal: 'TRM-001', amount: '₦45,000', status: 'success', time: '12 min ago', type: 'Deposit' },
  { id: '5', terminal: 'TRM-002', amount: '₦12,000', status: 'success', time: '15 min ago', type: 'Transfer' },
];

const columns = [
  { key: 'terminal', header: 'Terminal' },
  { key: 'type', header: 'Type' },
  { key: 'amount', header: 'Amount' },
  {
    key: 'status',
    header: 'Status',
    render: (item: typeof recentTransactions[0]) => (
      <StatusBadge status={item.status as 'success' | 'error'} size="sm" />
    ),
  },
  { key: 'time', header: 'Time' },
];

const myTerminals = [
  { id: '1', terminalId: 'TRM-001', status: 'online', lastSeen: 'Just now', todayVolume: '₦125,000' },
  { id: '2', terminalId: 'TRM-002', status: 'offline', lastSeen: '2 hours ago', todayVolume: '₦45,000' },
];

const terminalColumns = [
  { key: 'terminalId', header: 'Terminal ID' },
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

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}`}
        description="Here's an overview of your terminal activity today."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Today's Total"
          value="₦371,000"
          icon={Receipt}
          change={{ value: 15, label: 'vs yesterday' }}
          trend="up"
        />
        <StatCard
          title="My Terminals"
          value="2"
          icon={CreditCard}
        />
        <StatCard
          title="Success Rate"
          value="96.5%"
          icon={TrendingUp}
          change={{ value: 2.1, label: 'this week' }}
          trend="up"
        />
        <StatCard
          title="Pending Settlement"
          value="₦45,000"
          icon={Wallet}
        />
      </div>

      {/* Chart and Terminals */}
      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        {/* Weekly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Weekly Performance</CardTitle>
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

        {/* My Terminals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">My Terminals</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={terminalColumns} data={myTerminals} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={recentTransactions} />
        </CardContent>
      </Card>
    </div>
  );
}
