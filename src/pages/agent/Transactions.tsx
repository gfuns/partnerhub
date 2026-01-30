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
import { useQuery } from '@tanstack/react-query';
import transactionsService from '@/services/api/transactions.service';
import terminalsService from '@/services/api/terminals.service';

const columns = [
  {
    key: 'trx',
    header: 'Transaction ID',
    render: (item: any) => <span className="font-mono text-sm">{item.trx ?? item.ref ?? item.id}</span>,
  },
  { key: 'terminal', header: 'Terminal', render: (item: any) => <span className="font-mono text-sm">{item.terminal_name ?? item.terminal_id ?? '—'}</span> },
  { key: 'type', header: 'Type', render: (item: any) => item.type_name ?? item.type },
  { key: 'amount', header: 'Amount', render: (item: any) => <span className="font-medium">{item.amount_formatted ?? item.amount}</span> },
  { key: 'status', header: 'Status', render: (item: any) => <StatusBadge status={(item.status || '').toString().includes('success') ? 'success' : ((item.status || '').toString().includes('pending') ? 'pending' : 'error')} size="sm" /> },
  { key: 'created_at', header: 'Date', render: (item: any) => item.created_at ? new Date(item.created_at).toLocaleString() : '—' },
  { key: 'actions', header: '', className: 'w-12', render: (item: any) => (<Link to={`/agent/transactions/${item.id}`}><ActionButton icon={Eye} tooltip="View Details" variant="ghost" /></Link>) },
];

export default function AgentTransactions() {
  const [searchParams] = useSearchParams();
  const terminalFilter = searchParams.get('terminal') || 'all';
  console.log(terminalFilter);
  
  const [search, setSearch] = useState('');
  const [selectedTerminal, setSelectedTerminal] = useState(terminalFilter);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data: terminalsResp } = useQuery({
    queryKey: ['agent_terminals_list'],
    queryFn: () => terminalsService.getTerminals({ per_page: 100 }),
  });
  console.log(selectedTerminal);
  

  const terminalOptions = [{ id: 'all', label: 'All Terminals' }, ...(terminalsResp?.data?.map((t: any) => ({ id: t.id?.toString(), label: t.terminal_id })) || [])];

  const { data: txResp, isLoading } = useQuery({
    queryKey: ['agent_transactions', currentPage, pageSize, search, selectedTerminal, selectedStatus, dateFrom, dateTo],
    queryFn: () => {
      const params: any = { per_page: pageSize, page: currentPage };
      if (search) params.search = search;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedTerminal && selectedTerminal !== 'all') params.terminal_id = selectedTerminal;
      if (dateFrom) params.start_date = format(dateFrom, 'yyyy-MM-dd');
      if (dateTo) params.end_date = format(dateTo, 'yyyy-MM-dd');
      return transactionsService.getTransactions(params);
    },
    keepPreviousData: true,
  });

  const transactions = txResp?.data ?? [];
  const meta = txResp?.meta ?? { current_page: 1, last_page: 1, per_page: pageSize, total: transactions.length };
  const totalPages = meta.last_page || 1;

  const paginatedData = transactions;

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
            {terminalOptions.map(t => (
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
        isLoading={isLoading}
        emptyMessage="No transactions found"
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={meta.total || 0}
        onPageChange={(p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)))}
        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
      />
    </div>
  );
}
