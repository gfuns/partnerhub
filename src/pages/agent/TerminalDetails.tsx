import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, CreditCard, TrendingUp, Receipt, Clock } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import terminalsService from '@/services/api/terminals.service';

export default function AgentTerminalDetails() {
  const { id } = useParams();

  const { data: terminalResp, isLoading: loadingTerminal } = useQuery({
    queryKey: ['terminal', id],
    queryFn: () => terminalsService.getTerminal(id!),
    enabled: !!id,
  });

  const terminal = terminalResp?.data?.terminal;
  const stats = terminalResp?.data?.stats;

  const { data: txResp, isLoading: loadingTx } = useQuery({
    queryKey: ['terminal_tx', id],
    queryFn: () => terminalsService.getRecentTransactions(id!),
    enabled: !!id,
  });

  const transactions = txResp?.data ?? [];

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
        title={`Terminal ${terminal?.terminal_id ?? id}`}
        description={terminal?.name ?? 'View terminal details and recent activity.'}
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
              <p className="text-lg font-mono font-medium">{terminal?.terminal_id ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">
                <StatusBadge status={terminal?.status === 'active' ? 'online' : 'offline'} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Heartbeat</p>
              <p className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {terminal?.last_seen_at ? new Date(terminal.last_seen_at).toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned Agent</p>
              <p className="text-lg font-medium">{terminal?.agent?.business_name ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          title="Today's Transactions"
          value={String(stats?.today?.transactions ?? terminal?.today_transaction_count ?? 0)}
          icon={Receipt}
        />
        <StatCard
          title="Today's Volume"
          value={(stats?.today?.volume ?? terminal?.today_transaction_volume ?? 0).toString()}
          icon={CreditCard}
        />
        <StatCard
          title="Success Rate"
          value={stats ? `${Math.round((stats.today.successful / Math.max(1, stats.today.transactions)) * 100)}%` : '—'}
          icon={TrendingUp}
        />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/agent/transactions?terminal=${terminal?.id ?? ''}`}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'trx', header: 'Ref', render: (t: any) => <span className="font-mono text-sm">{t.trx ?? t.ref}</span> },
              { key: 'type', header: 'Type', render: (t: any) => t.type_name ?? t.type == '1' ? 'CREDIT' : 'DEBIT' },
              { key: 'amount', header: 'Amount', render: (t: any) => <span className="font-medium">{t.amount_formatted ?? t.amount}</span> },
              { key: 'status', header: 'Status', render: (t: any) => <StatusBadge status={t.status === 'success' || t.status.includes('success') ? 'success' : 'error'} size="sm" /> },
              { key: 'created_at', header: 'Date', render: (t: any) => new Date(t.created_at).toLocaleString() },
              { key: 'actions', header: '', className: 'w-12', render: (t: any) => (<Link to={`/agent/transactions/${t.id}`}><ActionButton icon={Eye} tooltip="View Details" variant="ghost" /></Link>) },
            ]}
            data={transactions}
            isLoading={loadingTx}
            emptyMessage="No transactions yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
