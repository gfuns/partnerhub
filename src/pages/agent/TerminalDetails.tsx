import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, CreditCard, TrendingUp, Receipt, Clock, MapPin, User, Banknote, QrCode, Wifi, KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { DetailCard, DetailRow } from '@/components/DetailCard';
import terminalsService from '@/services/api/terminals.service';

function mapStatus(apiStatus: Terminal['status']) {
  if (!apiStatus) return 'inactive';
  if (apiStatus === 'active') return 'active';
  if (apiStatus === 'suspended') return 'suspended';
  if (apiStatus === 'revoked') return 'revoked';
  return 'inactive';
}

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

  const formatNaira = (amount?: string | number | null) => {
    const n = Number(amount ?? 0) || 0;
    return n.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 });
  };

  const todayVolume = stats?.today?.volume ?? 0;
  const monthVolume = stats?.this_month?.volume ?? 0;
  const volumePctOfMonth = monthVolume ? Math.round((todayVolume / monthVolume) * 100) : 0;

  const todayTx = stats?.today?.transactions ?? 0;
  const monthTx = stats?.this_month?.transactions ?? 0;
  const txPctOfMonth = monthTx ? Math.round((todayTx / monthTx) * 100) : 0;

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

      {/* Terminal Details */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <DetailCard title="Terminal Details">
          <DetailRow label="Terminal ID" value={terminal?.terminal_id ?? '—'} />
          <DetailRow label="Serial Number" value={terminal?.serial_number ?? '—'} />
          <DetailRow label="POS Type" value={terminal?.pos_type ?? '—'} />
          <DetailRow label="Status" value={<StatusBadge status={mapStatus(terminal?.status)} />} />
          <DetailRow label="Assigned At" value={terminal?.assigned_at ? new Date(terminal.assigned_at).toLocaleString() : '—'} />
          <DetailRow
            label="Last Seen"
            value={
              terminal?.last_heartbeat_at ? (
                <div className="flex items-center gap-2">
                  <span
                    className={
                      `inline-block h-2 w-2 rounded-full ${
                        ((terminal as any)?.is_online || terminal?.online_status === 'online') ? 'bg-green-500' : 'bg-red-500'
                      }`
                    }
                  />
                  <span>{new Date(terminal.last_heartbeat_at).toLocaleString()}</span>
                </div>
              ) : (
                '—'
              )
            }
          />
          <DetailRow label="Balance" value={<span className="font-medium">{terminal?.balance ? formatNaira(terminal.balance) : '—'}</span>} />
        </DetailCard>

        {/* Agent Details */}
        {terminal?.agent && (
          <DetailCard title="Agent Details" actions={terminal.agent.contact_email && <a href={`mailto:${terminal.agent.contact_email}`}><User className="h-5 w-5" /></a>}>
            <DetailRow label="Business Name" value={terminal.agent.business_name ?? '—'} />
            <DetailRow label="Contact Name" value={terminal.agent.contact_name ?? '—'} />
            <DetailRow label="Contact Email" value={terminal.agent.contact_email ?? '—'} />
            <DetailRow label="Contact Phone" value={terminal.agent.contact_phone ?? '—'} />
          </DetailCard>
        )}
      </div>




      {/* KPIs and Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8 mt-8">
        <StatCard
          title="Today's Transactions"
          value={String(stats?.today?.transactions ?? 0)}
          change={{ value: txPctOfMonth, label: 'of month' }}
          trend={txPctOfMonth > 0 ? 'up' : 'neutral'}
          icon={Receipt}
        />
        <StatCard
          title="Today's Volume"
          value={stats?.today?.volume?.toLocaleString() ?? '0'}
          change={{ value: volumePctOfMonth, label: 'of month' }}
          trend={volumePctOfMonth > 0 ? 'up' : 'neutral'}
          icon={CreditCard}
        />
        <StatCard
          title="Success Rate"
          value={stats ? `${Math.round((stats.today.successful / Math.max(1, stats.today.transactions)) * 100)}%` : '—'}
          icon={TrendingUp}
        />
        <StatCard
          title="Failed Transactions"
          value={String(stats?.today?.failed ?? 0)}
          icon={Banknote}
        />
      </div>

      {/* Inflow Totals (Today) */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          title="Card Inflow (Today)"
          value={formatNaira(stats?.inflow_totals?.card?.today_volume ?? 0)}
          icon={CreditCard}
        />
        <StatCard
          title="Transfer Inflow (Today)"
          value={formatNaira(stats?.inflow_totals?.transfer?.today_volume ?? 0)}
          icon={Banknote}
        />
        {/* <StatCard
          title="Bill Inflow (Today)"
          value={formatNaira(stats?.inflow_totals?.bill?.today_volume ?? 0)}
          icon={Receipt}
        /> */}
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
              { key: 'type', header: 'Type', render: (t: any) => t.type_name ?? (t.type == '1' ? 'CREDIT' : 'DEBIT') },
              { key: 'amount', header: 'Amount', render: (t: any) => <span className="font-medium">{t.amount_formatted ?? t.amount}</span> },
              { key: 'status', header: 'Status', render: (t: any) => <StatusBadge status={t.status === 'success' || (t.status && t.status.includes('success')) ? 'success' : 'error'} size="sm" /> },
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
