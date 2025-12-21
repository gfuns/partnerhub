import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Download, Eye } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { PermissionGate } from '@/components/PermissionGate';
import { ActionButton } from '@/components/ActionButton';
import { TablePagination } from '@/components/TablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const mockTransactions = [
  { id: '1', reference: 'TXN-001234', terminal: 'TRM-001', agent: 'John Doe Enterprises', amount: '₦25,000', type: 'Transfer', status: 'success', date: '2024-01-15 10:32:15' },
  { id: '2', reference: 'TXN-001235', terminal: 'TRM-042', agent: 'Jane Smith POS', amount: '₦150,000', type: 'Withdrawal', status: 'success', date: '2024-01-15 10:28:45' },
  { id: '3', reference: 'TXN-001236', terminal: 'TRM-015', agent: 'Mike Johnson Store', amount: '₦8,500', type: 'Transfer', status: 'failed', date: '2024-01-15 10:25:30' },
  { id: '4', reference: 'TXN-001237', terminal: 'TRM-033', agent: 'Sarah Brown Agency', amount: '₦45,000', type: 'Deposit', status: 'pending', date: '2024-01-15 10:20:00' },
  { id: '5', reference: 'TXN-001238', terminal: 'TRM-027', agent: 'David Wilson', amount: '₦12,000', type: 'Transfer', status: 'success', date: '2024-01-15 10:15:22' },
  { id: '6', reference: 'TXN-001239', terminal: 'TRM-001', agent: 'John Doe Enterprises', amount: '₦78,000', type: 'Withdrawal', status: 'success', date: '2024-01-15 10:10:08' },
  { id: '7', reference: 'TXN-001240', terminal: 'TRM-042', agent: 'Jane Smith POS', amount: '₦5,000', type: 'Airtime', status: 'success', date: '2024-01-15 10:05:55' },
  { id: '8', reference: 'TXN-001241', terminal: 'TRM-015', agent: 'Mike Johnson Store', amount: '₦200,000', type: 'Transfer', status: 'failed', date: '2024-01-15 10:00:12' },
  { id: '9', reference: 'TXN-001242', terminal: 'TRM-001', agent: 'John Doe Enterprises', amount: '₦35,000', type: 'Transfer', status: 'success', date: '2024-01-15 09:55:00' },
  { id: '10', reference: 'TXN-001243', terminal: 'TRM-033', agent: 'Sarah Brown Agency', amount: '₦90,000', type: 'Withdrawal', status: 'success', date: '2024-01-15 09:50:00' },
];

export default function TransactionsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const terminalFilter = searchParams.get('terminal') || '';
  const agentFilter = searchParams.get('agent') || '';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  const filteredTransactions = mockTransactions.filter((txn) => {
    const matchesSearch =
      txn.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.terminal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.agent.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    const matchesTerminal = !terminalFilter || txn.terminal === terminalFilter;
    const matchesAgent = !agentFilter || txn.agent.toLowerCase().includes(agentFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesType && matchesTerminal && matchesAgent;
  });

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExport = () => {
    toast({
      title: 'Export started',
      description: 'Your transaction report is being generated.',
    });
  };

  const columns = [
    { 
      key: 'reference', 
      header: 'Transaction ID',
      render: (item: typeof mockTransactions[0]) => (
        <span className="font-mono text-sm">{item.reference}</span>
      ),
    },
    { 
      key: 'terminal', 
      header: 'Terminal ID',
      render: (item: typeof mockTransactions[0]) => (
        <span className="font-mono text-sm">{item.terminal}</span>
      ),
    },
    { key: 'agent', header: 'Agent Name' },
    { 
      key: 'amount', 
      header: 'Amount',
      render: (item: typeof mockTransactions[0]) => (
        <span className="font-medium">{item.amount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: typeof mockTransactions[0]) => (
        <StatusBadge status={item.status as 'success' | 'failed' | 'pending'} size="sm" />
      ),
    },
    { key: 'date', header: 'Date' },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: typeof mockTransactions[0]) => (
        <ActionButton
          icon={Eye}
          tooltip="View Details"
          onClick={() => navigate(`/transactions/${item.id}`)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Transactions"
        description={
          terminalFilter 
            ? `Showing transactions for terminal ${terminalFilter}` 
            : agentFilter 
              ? `Showing transactions for ${agentFilter}`
              : "View and manage all transaction records."
        }
        actions={
          <PermissionGate permission="transactions.export">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Transfer">Transfer</SelectItem>
              <SelectItem value="Withdrawal">Withdrawal</SelectItem>
              <SelectItem value="Deposit">Deposit</SelectItem>
              <SelectItem value="Airtime">Airtime</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedTransactions}
        emptyMessage="No transactions found"
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredTransactions.length}
        pageSize={pageSize}
      />
    </div>
  );
}
