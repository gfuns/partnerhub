import { Link } from 'react-router-dom';
import { Eye, FileText } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ActionButton } from '@/components/ActionButton';
import { StatCard } from '@/components/StatCard';
import { CreditCard, Wifi, WifiOff } from 'lucide-react';

const mockTerminals = [
  { id: '1', terminalId: 'TRM-001', status: 'online', lastSeen: 'Just now', todayVolume: '₦125,000', todayTransactions: 45, successRate: '97.8%' },
  { id: '2', terminalId: 'TRM-002', status: 'offline', lastSeen: '2 hours ago', todayVolume: '₦45,000', todayTransactions: 18, successRate: '94.4%' },
  { id: '3', terminalId: 'TRM-003', status: 'suspended', lastSeen: '1 day ago', todayVolume: '₦0', todayTransactions: 0, successRate: '-' },
];

const columns = [
  { 
    key: 'terminalId', 
    header: 'Terminal ID',
    render: (item: typeof mockTerminals[0]) => (
      <span className="font-mono font-medium">{item.terminalId}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (item: typeof mockTerminals[0]) => (
      <StatusBadge status={item.status as 'online' | 'offline' | 'suspended'} size="sm" />
    ),
  },
  { key: 'lastSeen', header: 'Last Seen' },
  { 
    key: 'todayVolume', 
    header: "Today's Volume",
    render: (item: typeof mockTerminals[0]) => (
      <span className="font-medium">{item.todayVolume}</span>
    ),
  },
  { key: 'todayTransactions', header: 'Transactions' },
  { key: 'successRate', header: 'Success Rate' },
  {
    key: 'actions',
    header: '',
    className: 'w-24',
    render: (item: typeof mockTerminals[0]) => (
      <div className="flex items-center gap-1">
        <Link to={`/my-terminals/${item.id}`}>
          <ActionButton icon={Eye} tooltip="View Details" variant="ghost" />
        </Link>
        <Link to={`/agent/transactions?terminal=${item.terminalId}`}>
          <ActionButton icon={FileText} tooltip="View Transactions" variant="ghost" />
        </Link>
      </div>
    ),
  },
];

export default function MyTerminals() {
  const onlineCount = mockTerminals.filter(t => t.status === 'online').length;
  const offlineCount = mockTerminals.filter(t => t.status === 'offline').length;

  return (
    <div>
      <PageHeader
        title="My Terminals"
        description={`You have ${mockTerminals.length} terminals assigned.`}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          title="Total Terminals"
          value={mockTerminals.length.toString()}
          icon={CreditCard}
        />
        <StatCard
          title="Online"
          value={onlineCount.toString()}
          icon={Wifi}
        />
        <StatCard
          title="Offline"
          value={offlineCount.toString()}
          icon={WifiOff}
        />
      </div>

      <DataTable
        columns={columns}
        data={mockTerminals}
        emptyMessage="No terminals assigned to you"
      />
    </div>
  );
}
