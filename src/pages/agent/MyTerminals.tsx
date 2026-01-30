import { Link } from 'react-router-dom';
import { Eye, FileText } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ActionButton } from '@/components/ActionButton';
import { StatCard } from '@/components/StatCard';
import { CreditCard, Wifi, WifiOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import terminalsService, { Terminal, TransactionListParams, Transaction } from '@/services/api/terminals.service';
import { useState } from 'react';
import { TablePagination } from '@/components/TablePagination';

function mapStatus(apiStatus: Terminal['status']) {
  if (!apiStatus) return 'offline';
  if (apiStatus === 'active') return 'online';
  if (apiStatus === 'suspended') return 'suspended';
  return 'offline';
}

export default function MyTerminals() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, isLoading } = useQuery({
    queryKey: ['agent_terminals', currentPage, pageSize],
    queryFn: () => terminalsService.getTerminals({ per_page: pageSize, page: currentPage }),
    keepPreviousData: true,
  });

  const terminals: Terminal[] = data?.data ?? [];

  const meta = data?.meta;
  const total = meta?.total ?? terminals.length;
  const totalPages = meta?.last_page ?? 1;
  const onlineCount = terminals.filter(t => t.status === 'active').length;
  const offlineCount = terminals.filter(t => t.status !== 'active').length;

  const columns = [
    {
      key: 'terminal_id',
      header: 'Terminal ID',
      render: (item: Terminal) => <span className="font-mono font-medium">{item.terminal_id}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Terminal) => <StatusBadge status={mapStatus(item.online_status) as any} size="sm" />,
    },
    { key: 'last_seen_at', header: 'Last Seen', render: (item: Terminal) => item.last_seen_at ? new Date(item.last_seen_at).toLocaleString() : '—' },
    {
      key: 'today_transaction_volume',
      header: "Today's Volume",
      render: (item: Terminal) => (
        <span className="font-medium">{item.today_transaction_volume ? item.today_transaction_volume.toLocaleString() : '—'}</span>
      ),
    },
    { key: 'today_transaction_count', header: 'Transactions', render: (item: Terminal) => item.today_transaction_count ?? 0 },
    { key: 'pos_type', header: 'POS Type', render: (item: Terminal) => item.pos_type ?? '—' },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (item: Terminal) => (
        <div className="flex items-center gap-1">
          <Link to={`/my-terminals/${item.id}`}>
            <ActionButton icon={Eye} tooltip="View Details" variant="ghost" />
          </Link>
          <Link to={`/agent/transactions?terminal=${item.id}`}>
            <ActionButton icon={FileText} tooltip="View Transactions" variant="ghost" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="My Terminals" description={`You have ${total} terminals assigned.`} />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard title="Total Terminals" value={String(total)} icon={CreditCard} />
        <StatCard title="Online" value={String(onlineCount)} icon={Wifi} />
        <StatCard title="Offline" value={String(offlineCount)} icon={WifiOff} />
      </div>

      <DataTable columns={columns} data={terminals} isLoading={isLoading} emptyMessage="No terminals assigned to you" />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={total}
        onPageChange={(p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)))}
        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
      />
    </div>
  );
}
