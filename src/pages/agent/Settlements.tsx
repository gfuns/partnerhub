import { Wallet, Clock, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';

const mockSettlements = [
  { id: '1', reference: 'STL-001234', amount: '₦125,000', status: 'success', date: '2024-01-15', paidAt: '2024-01-16 09:00' },
  { id: '2', reference: 'STL-001235', amount: '₦89,500', status: 'pending', date: '2024-01-14', paidAt: '-' },
  { id: '3', reference: 'STL-001236', amount: '₦156,000', status: 'success', date: '2024-01-13', paidAt: '2024-01-14 09:00' },
  { id: '4', reference: 'STL-001237', amount: '₦78,200', status: 'success', date: '2024-01-12', paidAt: '2024-01-13 09:00' },
  { id: '5', reference: 'STL-001238', amount: '₦234,000', status: 'success', date: '2024-01-11', paidAt: '2024-01-12 09:00' },
];

const columns = [
  { 
    key: 'reference', 
    header: 'Reference',
    render: (item: typeof mockSettlements[0]) => (
      <span className="font-mono text-sm">{item.reference}</span>
    ),
  },
  { key: 'date', header: 'Settlement Date' },
  { 
    key: 'amount', 
    header: 'Amount',
    render: (item: typeof mockSettlements[0]) => (
      <span className="font-medium">{item.amount}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (item: typeof mockSettlements[0]) => (
      <StatusBadge 
        status={item.status as 'success' | 'pending'} 
        label={item.status === 'success' ? 'Paid' : 'Pending'}
        size="sm" 
      />
    ),
  },
  { key: 'paidAt', header: 'Paid At' },
];

export default function Settlements() {
  const pendingAmount = mockSettlements
    .filter(s => s.status === 'pending')
    .reduce((acc, s) => acc + parseInt(s.amount.replace(/[^0-9]/g, '')), 0);

  const totalPaid = mockSettlements
    .filter(s => s.status === 'success')
    .reduce((acc, s) => acc + parseInt(s.amount.replace(/[^0-9]/g, '')), 0);

  return (
    <div>
      <PageHeader
        title="Settlements"
        description="View your settlement history and pending payments."
      />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          title="Pending Settlement"
          value={`₦${pendingAmount.toLocaleString()}`}
          icon={Clock}
        />
        <StatCard
          title="Total Paid (This Month)"
          value={`₦${totalPaid.toLocaleString()}`}
          icon={CheckCircle}
        />
        <StatCard
          title="Next Settlement"
          value="Tomorrow"
          icon={Wallet}
        />
      </div>

      <DataTable
        columns={columns}
        data={mockSettlements}
        emptyMessage="No settlements found"
      />
    </div>
  );
}
