import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

const mockTransactions = [
  { id: 'TXN-001234', terminalId: 'TRM-001', amount: '₦25,000', status: 'success', date: '2024-01-15 14:32', type: 'Transfer' },
  { id: 'TXN-001235', terminalId: 'TRM-001', amount: '₦150,000', status: 'success', date: '2024-01-15 14:28', type: 'Withdrawal' },
  { id: 'TXN-001236', terminalId: 'TRM-002', amount: '₦8,500', status: 'error', date: '2024-01-15 14:25', type: 'Transfer' },
  { id: 'TXN-001237', terminalId: 'TRM-001', amount: '₦45,000', status: 'success', date: '2024-01-15 14:20', type: 'Deposit' },
  { id: 'TXN-001238', terminalId: 'TRM-002', amount: '₦12,000', status: 'success', date: '2024-01-15 14:15', type: 'Transfer' },
  { id: 'TXN-001239', terminalId: 'TRM-001', amount: '₦78,000', status: 'success', date: '2024-01-15 14:10', type: 'Withdrawal' },
  { id: 'TXN-001240', terminalId: 'TRM-002', amount: '₦5,000', status: 'pending', date: '2024-01-15 14:05', type: 'Transfer' },
  { id: 'TXN-001241', terminalId: 'TRM-001', amount: '₦92,000', status: 'success', date: '2024-01-15 14:00', type: 'Deposit' },
];

const terminals = [
  { id: 'all', label: 'All Terminals' },
  { id: 'TRM-001', label: 'TRM-001' },
  { id: 'TRM-002', label: 'TRM-002' },
];

const columns = [
  { 
    key: 'id', 
    header: 'Transaction ID',
    render: (item: typeof mockTransactions[0]) => (
      <span className="font-mono text-sm">{item.id}</span>
    ),
  },
  { 
    key: 'terminalId', 
    header: 'Terminal',
    render: (item: typeof mockTransactions[0]) => (
      <span className="font-mono text-sm">{item.terminalId}</span>
    ),
  },
  { key: 'type', header: 'Type' },
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
      <StatusBadge 
        status={item.status as 'success' | 'error' | 'pending'} 
        size="sm" 
      />
    ),
  },
  { key: 'date', header: 'Date' },
  {
    key: 'actions',
    header: '',
    className: 'w-12',
    render: (item: typeof mockTransactions[0]) => (
      <Link to={`/agent/transactions/${item.id}`}>
        <ActionButton icon={Eye} tooltip="View Details" variant="ghost" />
      </Link>
    ),
  },
];

export default function AgentTransactions() {
  const [searchParams] = useSearchParams();
  const terminalFilter = searchParams.get('terminal') || 'all';
  
  const [search, setSearch] = useState('');
  const [selectedTerminal, setSelectedTerminal] = useState(terminalFilter);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredTransactions = mockTransactions.filter(t => {
    const matchesSearch = search === '' || 
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.terminalId.toLowerCase().includes(search.toLowerCase());
    const matchesTerminal = selectedTerminal === 'all' || t.terminalId === selectedTerminal;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    return matchesSearch && matchesTerminal && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedData = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      <PageHeader
        title="My Transactions"
        description="View all transactions from your terminals."
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Terminal" />
          </SelectTrigger>
          <SelectContent>
            {terminals.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="error">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-[200px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, 'PP') : 'From date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-[200px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, 'PP') : 'To date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
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
