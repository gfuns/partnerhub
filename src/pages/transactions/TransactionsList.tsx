import { useState, useEffect } from 'react';
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
import transactionsService, { Transaction, TransactionListParams } from '@/services/api/transactions.service';

export default function TransactionsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [terminalId, setTerminalId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, [currentPage, perPage, searchQuery, statusFilter, typeFilter, startDate, endDate, minAmount, maxAmount, terminalId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params: TransactionListParams = {
        page: currentPage,
        per_page: perPage,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (minAmount) params.min_amount = parseFloat(minAmount);
      if (maxAmount) params.max_amount = parseFloat(maxAmount);
      if (terminalId) params.terminal_id = parseInt(terminalId);

      const response = await transactionsService.getTransactions(params);
      setTransactions(response.data);
      setTotalPages(response.meta.last_page);
      setTotalItems(response.meta.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const params: TransactionListParams = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (minAmount) params.min_amount = parseFloat(minAmount);
      if (maxAmount) params.max_amount = parseFloat(maxAmount);
      if (terminalId) params.terminal_id = parseInt(terminalId);

      transactionsService.exportTransactions(params);
      toast({
        title: 'Export started',
        description: 'Transaction export opened in new tab',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export transactions',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '₦0.00';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(numAmount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'trx',
      header: 'Transaction Ref',
      render: (item: Transaction) => <span className="font-mono text-xs">{item.trx}</span>,
    },
    {
      key: 'terminal',
      header: 'Terminal',
      render: (item: Transaction) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs">{item.terminal_id}</span>
          {item.agent_name && (
            <span className="text-xs text-muted-foreground">{item.agent_name}</span>
          )}
        </div>
      ),
    },
    {
      key: 'type_name',
      header: 'Type',
      render: (item: Transaction) => (
        <span className="text-xs uppercase font-medium">{item.type_name}</span>
      ),
    },
    {
      key: 'maskedpan',
      header: 'Card/Source',
      render: (item: Transaction) => (
        <span className="font-mono text-xs">{item.maskedpan || '-'}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: Transaction) => <span className="font-medium">{item.amount_formatted}</span>,
    },
    {
      key: 'fee',
      header: 'Fee',
      render: (item: Transaction) => (
        <span className="text-muted-foreground text-sm">{item.fee_formatted}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Transaction) => (
        <div className="flex flex-col gap-0.5">
          <StatusBadge status={item.status === 'success' ? 'success' : 'failed'} size="sm" />
          {item.status_desc && (
            <span className="text-xs text-muted-foreground">{item.status_desc}</span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (item: Transaction) => (
        <div className="flex flex-col">
          <span className="text-sm">{formatDate(item.created_at)}</span>
          <span className="text-xs text-muted-foreground">{item.time_ago}</span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="View and manage all transactions across your terminals."
        actions={
          <PermissionGate permission="transactions.export">
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </PermissionGate>
        }
      />


      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-44"
            />
          </div>
          {/* <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="1">Purchase</SelectItem>
                <SelectItem value="2">Withdrawal</SelectItem>
                <SelectItem value="3">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Min Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Max Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Terminal ID</label>
            <Input
              type="number"
              placeholder="Terminal ID"
              value={terminalId}
              onChange={(e) => setTerminalId(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs text-muted-foreground">Search</label>
            <Input
              placeholder="Search by ref, RRN, or narration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        emptyMessage={loading ? 'Loading transactions...' : 'No transactions found'}
      />

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Per page:</span>
          <Select value={perPage.toString()} onValueChange={(value) => setPerPage(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={perPage}
        />
      </div>
    </div>
  );
}
