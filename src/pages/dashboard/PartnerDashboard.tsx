import { CreditCard, Users, Receipt, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
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
  BarChart,
  Bar,
} from 'recharts';

// Mock data
const transactionData = [
  { date: 'Mon', volume: 45000, count: 120 },
  { date: 'Tue', volume: 52000, count: 145 },
  { date: 'Wed', volume: 48000, count: 132 },
  { date: 'Thu', volume: 61000, count: 168 },
  { date: 'Fri', volume: 55000, count: 155 },
  { date: 'Sat', volume: 67000, count: 189 },
  { date: 'Sun', volume: 43000, count: 115 },
];

const terminalActivity = [
  { hour: '00', active: 12 },
  { hour: '04', active: 8 },
  { hour: '08', active: 45 },
  { hour: '12', active: 67 },
  { hour: '16', active: 78 },
  { hour: '20', active: 56 },
  { hour: '23', active: 34 },
];

const recentTransactions = [
  { id: '1', terminal: 'TRM-001', amount: '₦25,000', status: 'success', time: '2 min ago', agent: 'John Doe' },
  { id: '2', terminal: 'TRM-042', amount: '₦150,000', status: 'success', time: '5 min ago', agent: 'Jane Smith' },
  { id: '3', terminal: 'TRM-015', amount: '₦8,500', status: 'error', time: '8 min ago', agent: 'Mike Johnson' },
  { id: '4', terminal: 'TRM-033', amount: '₦45,000', status: 'pending', time: '12 min ago', agent: 'Sarah Brown' },
  { id: '5', terminal: 'TRM-027', amount: '₦12,000', status: 'success', time: '15 min ago', agent: 'David Wilson' },
];

const columns = [
  { key: 'terminal', header: 'Terminal' },
  { key: 'agent', header: 'Agent' },
  { key: 'amount', header: 'Amount' },
  {
    key: 'status',
    header: 'Status',
    render: (item: typeof recentTransactions[0]) => (
      <StatusBadge status={item.status as 'success' | 'error' | 'pending'} size="sm" />
    ),
  },
  { key: 'time', header: 'Time' },
];

export default function PartnerDashboard() {
  const { user, partner } = useAuth();

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}`}
        description={`Here's what's happening with ${partner?.name || 'your business'} today.`}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Terminals"
          value="156"
          icon={CreditCard}
          change={{ value: 12, label: 'from last month' }}
          trend="up"
        />
        <StatCard
          title="Active Terminals"
          value="142"
          icon={TrendingUp}
          change={{ value: 8, label: 'currently online' }}
          trend="up"
        />
        <StatCard
          title="Today's Volume"
          value="₦4.2M"
          icon={Receipt}
          change={{ value: 23, label: 'vs yesterday' }}
          trend="up"
        />
        <StatCard
          title="Failed Transactions"
          value="12"
          icon={AlertTriangle}
          change={{ value: -5, label: 'from yesterday' }}
          trend="down"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        {/* Transaction Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Transaction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={transactionData}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
                    dataKey="volume"
                    stroke="hsl(var(--brand))"
                    strokeWidth={2}
                    fill="url(#colorVolume)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Terminal Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Terminal Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={terminalActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [value, 'Active Terminals']}
                  />
                  <Bar dataKey="active" fill="hsl(var(--brand))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
