import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Wallet, Clock, CheckCircle, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ActionButton } from '@/components/ActionButton';
import { TablePagination } from '@/components/TablePagination';

const mockSettlements = [
  { id: 'STL-001234', period: 'Jan 8-14, 2024', amount: '₦125,000', status: 'success', paidDate: '2024-01-16 09:00', transactionCount: 156 },
  { id: 'STL-001235', period: 'Jan 1-7, 2024', amount: '₦89,500', status: 'pending', paidDate: '-', transactionCount: 98 },
  { id: 'STL-001236', period: 'Dec 25-31, 2023', amount: '₦156,000', status: 'success', paidDate: '2024-01-02 09:00', transactionCount: 189 },
  { id: 'STL-001237', period: 'Dec 18-24, 2023', amount: '₦78,200', status: 'success', paidDate: '2023-12-26 09:00', transactionCount: 112 },
  { id: 'STL-001238', period: 'Dec 11-17, 2023', amount: '₦234,000', status: 'success', paidDate: '2023-12-19 09:00', transactionCount: 267 },
  { id: 'STL-001239', period: 'Dec 4-10, 2023', amount: '₦167,500', status: 'success', paidDate: '2023-12-12 09:00', transactionCount: 198 },
];

const columns = [
  { 
    key: 'id', 
    header: 'Settlement ID',
    render: (item: typeof mockSettlements[0]) => (
      <span className="font-mono text-sm">{item.id}</span>
    ),
  },
  { key: 'period', header: 'Period' },
  { 
    key: 'transactionCount', 
    header: 'Transactions',
    render: (item: typeof mockSettlements[0]) => (
      <span>{item.transactionCount}</span>
    ),
  },
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
  { key: 'paidDate', header: 'Paid Date' },
  {
    key: 'actions',
    header: '',
    className: 'w-12',
    render: (item: typeof mockSettlements[0]) => (
      <Link to={`/agent/settlements/${item.id}`}>
        <ActionButton icon={Eye} tooltip="View Details" variant="ghost" />
      </Link>
    ),
  },
];

export default function Settlements() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const pendingAmount = mockSettlements
    .filter(s => s.status === 'pending')
    .reduce((acc, s) => acc + parseInt(s.amount.replace(/[^0-9]/g, '')), 0);

  const totalPaid = mockSettlements
    .filter(s => s.status === 'success')
    .reduce((acc, s) => acc + parseInt(s.amount.replace(/[^0-9]/g, '')), 0);

  const totalPages = Math.ceil(mockSettlements.length / pageSize);
  const paginatedData = mockSettlements.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
          icon={Calendar}
        />
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
        emptyMessage="No settlements yet"
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={mockSettlements.length}
        pageSize={pageSize}
      />
    </div>
  );
}
