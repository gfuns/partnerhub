import { Coins, TrendingUp, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const monthlyCommissions = [
  { month: 'Aug', amount: 45000 },
  { month: 'Sep', amount: 52000 },
  { month: 'Oct', amount: 48000 },
  { month: 'Nov', amount: 61000 },
  { month: 'Dec', amount: 55000 },
  { month: 'Jan', amount: 67000 },
];

const mockCommissions = [
  { id: '1', period: 'Jan 8-14, 2024', transactions: 245, volume: '₦1,250,000', commission: '₦12,500', rate: '1.0%' },
  { id: '2', period: 'Jan 1-7, 2024', transactions: 189, volume: '₦890,000', commission: '₦8,900', rate: '1.0%' },
  { id: '3', period: 'Dec 25-31, 2023', transactions: 156, volume: '₦720,000', commission: '₦7,200', rate: '1.0%' },
  { id: '4', period: 'Dec 18-24, 2023', transactions: 278, volume: '₦1,450,000', commission: '₦14,500', rate: '1.0%' },
  { id: '5', period: 'Dec 11-17, 2023', transactions: 234, volume: '₦1,120,000', commission: '₦11,200', rate: '1.0%' },
];

const columns = [
  { key: 'period', header: 'Period' },
  { key: 'transactions', header: 'Transactions' },
  { key: 'volume', header: 'Volume' },
  { key: 'rate', header: 'Rate' },
  { 
    key: 'commission', 
    header: 'Commission',
    render: (item: typeof mockCommissions[0]) => (
      <span className="font-medium text-success">{item.commission}</span>
    ),
  },
];

export default function Commissions() {
  const totalThisMonth = 67000;
  const totalLastMonth = 55000;
  const percentChange = ((totalThisMonth - totalLastMonth) / totalLastMonth * 100).toFixed(1);

  return (
    <div>
      <PageHeader
        title="Commissions"
        description="Track your earnings and commission breakdown."
      />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          title="This Month"
          value={`₦${totalThisMonth.toLocaleString()}`}
          icon={Coins}
          change={{ value: parseFloat(percentChange), label: 'vs last month' }}
          trend="up"
        />
        <StatCard
          title="Last Month"
          value={`₦${totalLastMonth.toLocaleString()}`}
          icon={Calendar}
        />
        <StatCard
          title="Commission Rate"
          value="1.0%"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCommissions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `₦${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Commission']}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Commission Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={mockCommissions.slice(0, 4)}
              emptyMessage="No commissions yet"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
