import { useState, useEffect } from 'react';
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
import { dashboardService } from '@/services/api';
import { toast } from 'sonner';
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

export default function AgentDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getDashboard();
      setDashboardData(response.data);
    } catch (error: any) {
      toast.error('Failed to load dashboard data', {
        description: error.message || 'Please try refreshing the page',
      });
    } finally {
      setLoading(false);
    }
  };

  // Transform data for charts
  const weeklyData = dashboardData?.transaction_volume
    ? dashboardData.transaction_volume.labels.map((label: string, index: number) => ({
        day: label,
        amount: dashboardData.transaction_volume.data[index],
      }))
    : [];

  const recentTransactions = dashboardData?.recent_transactions || [];

  const columns = [
    { 
      key: 'reference', 
      header: 'Transaction ID',
      render: (item: any) => (
        <span className="font-mono text-sm">{item.reference}</span>
      ),
    },
    { key: 'terminal', header: 'Terminal' },
    { 
      key: 'amount_formatted', 
      header: 'Amount',
      render: (item: any) => (
        <span className="font-medium">{item.amount_formatted}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => (
        <StatusBadge status={item.status as 'success' | 'error'} size="sm" />
      ),
    },
    { key: 'time', header: 'Time' },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: any) => (
        <Link to={`/agent/transactions/${item.id}`}>
          <ActionButton icon={Eye} tooltip="View Details" variant="ghost" />
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const displayName = (() => {
    const name = user?.firstName || user?.email?.split('@')[0] || '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  })();

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description="Here's an overview of your terminal activity today."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Terminals"
          value={dashboardData?.stats?.total_terminals?.value?.toString() || '0'}
          icon={CreditCard}
          change={{ 
            value: dashboardData?.stats?.total_terminals?.change || 0, 
            label: dashboardData?.stats?.total_terminals?.change_label || 'from last month' 
          }}
          trend={dashboardData?.stats?.total_terminals?.change && dashboardData.stats.total_terminals.change > 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Active Terminals"
          value={dashboardData?.stats?.active_terminals?.value?.toString() || '0'}
          icon={TrendingUp}
          change={{ 
            value: dashboardData?.stats?.active_terminals?.percentage || 0, 
            label: dashboardData?.stats?.active_terminals?.label || 'currently online' 
          }}
          trend="up"
        />
        <StatCard
          title="Today's Volume"
          value={dashboardData?.stats?.todays_volume?.formatted || '₦0.00'}
          icon={Wallet}
          change={{ 
            value: dashboardData?.stats?.todays_volume?.change || 0, 
            label: dashboardData?.stats?.todays_volume?.change_label || 'vs yesterday' 
          }}
          trend={dashboardData?.stats?.todays_volume?.change && dashboardData.stats.todays_volume.change > 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Failed Transactions"
          value={dashboardData?.stats?.failed_transactions?.value?.toString() || '0'}
          icon={Receipt}
          change={{ 
            value: dashboardData?.stats?.failed_transactions?.change || 0, 
            label: dashboardData?.stats?.failed_transactions?.change_label || 'from yesterday' 
          }}
          trend={dashboardData?.stats?.failed_transactions?.change && dashboardData.stats.failed_transactions.change < 0 ? 'down' : 'up'}
        />
        <StatCard
          title="Card Transactions"
          value={dashboardData?.stats?.card_transactions?.formatted_volume || '₦0.00'}
          icon={CreditCard}
          subtitle={`${dashboardData?.stats?.card_transactions?.count || 0} transactions`}
        />
        <StatCard
          title="Transfer Transactions"
          value={dashboardData?.stats?.transfer_transactions?.formatted_volume || '₦0.00'}
          icon={TrendingUp}
          subtitle={`${dashboardData?.stats?.transfer_transactions?.count || 0} transactions`}
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

        {/* Terminal Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Terminal Activity (24 Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData?.terminal_activity ? dashboardData.terminal_activity.labels.map((label: string, index: number) => ({
                  hour: label,
                  active: dashboardData.terminal_activity.data[index],
                })) : []}>
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
                  <Bar dataKey="active" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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
