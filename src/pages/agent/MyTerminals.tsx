import { Eye } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const mockTerminals = [
  { id: '1', terminalId: 'TRM-001', status: 'online', lastSeen: 'Just now', todayVolume: '₦125,000', todayTransactions: 45, successRate: '97.8%' },
  { id: '2', terminalId: 'TRM-002', status: 'offline', lastSeen: '2 hours ago', todayVolume: '₦45,000', todayTransactions: 18, successRate: '94.4%' },
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
      <StatusBadge status={item.status as 'online' | 'offline'} size="sm" />
    ),
  },
  { key: 'lastSeen', header: 'Last Seen' },
  { key: 'todayVolume', header: "Today's Volume" },
  { key: 'todayTransactions', header: 'Transactions' },
  { key: 'successRate', header: 'Success Rate' },
  {
    key: 'actions',
    header: '',
    className: 'w-12',
    render: () => (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
];

export default function MyTerminals() {
  const onlineCount = mockTerminals.filter(t => t.status === 'online').length;

  return (
    <div>
      <PageHeader
        title="My Terminals"
        description={`You have ${mockTerminals.length} terminals assigned (${onlineCount} online).`}
      />

      <DataTable
        columns={columns}
        data={mockTerminals}
        emptyMessage="No terminals assigned to you"
      />
    </div>
  );
}
