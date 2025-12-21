import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Coins, TrendingUp, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ActionButton } from '@/components/ActionButton';
import { TablePagination } from '@/components/TablePagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const monthlyCommissions = [
  { month: 'Aug', amount: 45000 },
  { month: 'Sep', amount: 52000 },
  { month: 'Oct', amount: 48000 },
  { month: 'Nov', amount: 61000 },
  { month: 'Dec', amount: 55000 },
  { month: 'Jan', amount: 67000 },
];

const mockCommissions = [
  { id: 'COM-001234', period: 'Jan 8-14, 2024', transactions: 245, volume: '₦1,250,000', commission: '₦12,500', status: 'success' },
  { id: 'COM-001235', period: 'Jan 1-7, 2024', transactions: 189, volume: '₦890,000', commission: '₦8,900', status: 'pending' },
  { id: 'COM-001236', period: 'Dec 25-31, 2023', transactions: 156, volume: '₦720,000', commission: '₦7,200', status: 'success' },
  { id: 'COM-001237', period: 'Dec 18-24, 2023', transactions: 278, volume: '₦1,450,000', commission: '₦14,500', status: 'success' },
  { id: 'COM-001238', period: 'Dec 11-17, 2023', transactions: 234, volume: '₦1,120,000', commission: '₦11,200', status: 'success' },
];

const columns = [
  { key: 'period', header: 'Period' },
  { key: 'transactions', header: 'Transactions' },
  { key: 'volume', header: 'Volume' },
  { 
    key: 'commission', 
    header: 'Commission',
    render: (item: typeof mockCommissions[0]) => (
      <span className="font-medium text-success">{item.commission}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (item: typeof mockCommissions[0]) => (
      <StatusBadge status={item.status as 'success' | 'pending'} label={item.status === 'success' ? 'Paid' : 'Pending'} size="sm" />
    ),
  },
  {
    key: 'actions',
    header: '',
    className: 'w-12',
    render: (item: typeof mockCommissions[0]) => (
      <Link to={`/agent/commissions/${item.id}`}>
        <ActionButton icon={Eye} tooltip="View Details" variant="ghost" />
      </Link>
    ),
  },
];

export default function Commissions() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalThisMonth = 67000;
  const totalEarned = monthlyCommissions.reduce((acc, m) => acc + m.amount, 0);
  const pendingAmount = 8900;

  return (
    <div>
      <PageHeader title="Commissions" description="Track your earnings and commission breakdown." />
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard title="Total Earned" value={`₦${totalEarned.toLocaleString()}`} icon={Coins} />
        <StatCard title="This Month" value={`₦${totalThisMonth.toLocaleString()}`} icon={Calendar} change={{ value: 21.8, label: 'vs last month' }} trend="up" />
        <StatCard title="Pending" value={`₦${pendingAmount.toLocaleString()}`} icon={TrendingUp} />
      </div>
      <Card className="mb-8">
        <CardHeader><CardTitle className="text-base font-medium">Monthly Trend</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCommissions}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `₦${value / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Commission']} />
                <Bar dataKey="amount" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <DataTable columns={columns} data={mockCommissions} emptyMessage="No commissions yet" />
      <TablePagination currentPage={currentPage} totalPages={1} onPageChange={setCurrentPage} totalItems={mockCommissions.length} pageSize={pageSize} />
    </div>
  );
}
