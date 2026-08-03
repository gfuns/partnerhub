import { useState, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { TablePagination } from '@/components/TablePagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { walletService, Wallet, WalletTransaction, SweepableTerminal, SweepSession, AgentWalletSummary } from '@/services/api/wallet.service';

// Format currency
const formatCurrency = (amount: number) => {
  return '₦' + Number(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const toLabel = (value?: string | null, fallback: string = 'N/A') => {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function WalletPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAgentUser = user?.role?.startsWith('agent');

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsMeta, setTransactionsMeta] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sweep state
  const [sweepableTerminals, setSweepableTerminals] = useState<SweepableTerminal[]>([]);
  const [sweepableAgentWallets, setSweepableAgentWallets] = useState<AgentWalletSummary[]>([]);
  const [sweepSummary, setSweepSummary] = useState({
    total_terminals: 0,
    total_agent_wallets: 0,
    terminal_total_amount: 0,
    agent_wallet_total_amount: 0,
    total_amount: 0,
  });
  const [selectedTerminals, setSelectedTerminals] = useState<number[]>([]);
  const [selectedAgentWallets, setSelectedAgentWallets] = useState<number[]>([]);
  const [isSweepModalOpen, setIsSweepModalOpen] = useState(false);
  const [isLoadingSweepable, setIsLoadingSweepable] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);

  // Sweep history
  const [sweepHistory, setSweepHistory] = useState<SweepSession[]>([]);
  const [sweepHistoryMeta, setSweepHistoryMeta] = useState({ currentPage: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        isAgentUser ? walletService.getAgentWallet() : walletService.getWallet(),
        isAgentUser ? walletService.getAgentTransactions({ page: 1, per_page: 10 }) : walletService.getTransactions({ page: 1, per_page: 10 })
      ]);

      // Normalize wallet response: some endpoints return { data: { wallet: {...} } }
      const rawWallet: any = (walletRes as any).data;
      const walletObj: any = rawWallet?.wallet ?? rawWallet ?? null;
      if (walletObj && walletObj.pending_settlements !== undefined && walletObj.pending_balance === undefined) {
        walletObj.pending_balance = walletObj.pending_settlements;
      }
      setWallet(walletObj);

      // Transactions may be returned as array or wrapped
      const txRaw: any = (transactionsRes as any).data;
      const txArray: WalletTransaction[] = Array.isArray(txRaw) ? txRaw : (txRaw?.transactions ?? txRaw ?? []);
      const txMetaSource: any = (transactionsRes as any).meta ?? txRaw?.meta ?? {};

      setTransactions(txArray);
      setTransactionsMeta({
        currentPage: txMetaSource.current_page ?? 1,
        totalPages: txMetaSource.last_page ?? 1,
        total: txMetaSource.total ?? 0
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load wallet',
        description: error.message || 'Please try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async (page: number, type?: string, start?: string, end?: string) => {
    try {
      const params: any = { page, per_page: 10 };
      if (type && type !== 'all') {
        params.type = type;
      }
      if (start) params.start_date = start;
      if (end) params.end_date = end;

      const res = isAgentUser ? await walletService.getAgentTransactions(params) : await walletService.getTransactions(params);
      const txRaw: any = (res as any).data;
      const txArray: WalletTransaction[] = Array.isArray(txRaw) ? txRaw : (txRaw?.transactions ?? txRaw ?? []);
      const txMetaSource: any = (res as any).meta ?? txRaw?.meta ?? {};

      setTransactions(txArray);
      setTransactionsMeta({
        currentPage: txMetaSource.current_page ?? 1,
        totalPages: txMetaSource.last_page ?? 1,
        total: txMetaSource.total ?? 0
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load transactions',
        description: error.message || 'Please try again'
      });
    }
  };

  const handleTransactionFilterChange = (value: string) => {
    setTransactionFilter(value);
    loadTransactions(1, value, startDate, endDate);
  };

  const applyDateFilters = () => {
    loadTransactions(1, transactionFilter, startDate || undefined, endDate || undefined);
  };

  const setQuickRange = (range: 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth') => {
    const now = new Date();
    const format = (date: Date) => date.toISOString().slice(0, 10);

    let from = new Date(now);
    let to = new Date(now);

    if (range === 'last7') {
      from.setDate(now.getDate() - 6);
    } else if (range === 'last30') {
      from.setDate(now.getDate() - 29);
    } else if (range === 'thisMonth') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === 'lastMonth') {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    const start = format(from);
    const end = format(to);
    setStartDate(start);
    setEndDate(end);
    loadTransactions(1, transactionFilter, start, end);
  };

  const exportTransactionsCsv = () => {
    if (!transactions.length) {
      toast({ title: 'No data to export', description: 'Apply filters and try again.' });
      return;
    }

    const headers = ['ID', 'Type', 'Description', 'Amount', 'Direction', 'Status', 'Date'];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.type,
      tx.description || '',
      tx.amount,
      tx.direction || (tx.type === 'sweep_in' || tx.type === 'refund_in' || tx.type === 'sweep' ? 'credit' : 'debit'),
      tx.status,
      tx.created_at,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((field) => `"${String(field ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wallet-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const openSweepModal = async () => {
    setIsSweepModalOpen(true);
    setIsLoadingSweepable(true);
    setSelectedTerminals([]);
    setSelectedAgentWallets([]);

    try {
      const res = await walletService.getSweepPreview();
      const previewRaw: any = (res as any).data;
      const terminalsArray: SweepableTerminal[] = Array.isArray(previewRaw?.eligible_terminals)
        ? previewRaw.eligible_terminals
        : [];
      const agentWalletArray: AgentWalletSummary[] = Array.isArray(previewRaw?.eligible_agent_wallets)
        ? previewRaw.eligible_agent_wallets
        : [];
      setSweepableTerminals(terminalsArray);
      setSweepableAgentWallets(agentWalletArray);
      setSweepSummary({
        total_terminals: terminalsArray.length,
        total_agent_wallets: agentWalletArray.length,
        terminal_total_amount: Number(previewRaw?.terminal_total_amount ?? terminalsArray.reduce((sum, item) => sum + Number(item.balance || 0), 0)),
        agent_wallet_total_amount: Number(previewRaw?.agent_wallet_total_amount ?? agentWalletArray.reduce((sum, item) => sum + Number(item.available_balance ?? item.balance ?? 0), 0)),
        total_amount: Number(previewRaw?.total_amount ?? 0),
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load sweep sources',
        description: error.message || 'Please try again'
      });
    } finally {
      setIsLoadingSweepable(false);
    }
  };

  const toggleTerminalSelection = (terminalId: number) => {
    setSelectedTerminals(prev =>
      prev.includes(terminalId)
        ? prev.filter(id => id !== terminalId)
        : [...prev, terminalId]
    );
  };

  const toggleAllTerminals = () => {
    if (selectedTerminals.length === sweepableTerminals.length) {
      setSelectedTerminals([]);
    } else {
      setSelectedTerminals(sweepableTerminals.map(t => t.id));
    }
  };

  const toggleAgentSelection = (agentId: number) => {
    setSelectedAgentWallets((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const toggleAllAgentWallets = () => {
    if (selectedAgentWallets.length === sweepableAgentWallets.length) {
      setSelectedAgentWallets([]);
    } else {
      setSelectedAgentWallets(sweepableAgentWallets.map((item) => item.agent_id));
    }
  };

  const getSelectedAmount = () => {
    const terminalAmount = sweepableTerminals
      .filter(t => selectedTerminals.includes(t.id))
      .reduce((sum, t) => sum + t.balance, 0);

    const agentAmount = sweepableAgentWallets
      .filter((item) => selectedAgentWallets.includes(item.agent_id))
      .reduce((sum, item) => sum + Number(item.available_balance ?? item.balance ?? 0), 0);

    return terminalAmount + agentAmount;
  };

  const handleSweep = async () => {
    if (selectedTerminals.length === 0 && selectedAgentWallets.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No sources selected',
        description: 'Please select at least one terminal or merchant wallet to sweep'
      });
      return;
    }

    setIsSweeping(true);
    try {
      const res = await walletService.initiateSweep({
        terminal_ids: selectedTerminals,
        agent_ids: selectedAgentWallets,
      });

      const terminalCount = Number((res.data as any).terminal_swept_count ?? res.data.terminals_count ?? selectedTerminals.length);
      const agentCount = Number((res.data as any).agent_wallet_swept_count ?? selectedAgentWallets.length);

      toast({
        title: 'Sweep initiated',
        description: `Successfully swept ${formatCurrency(res.data.total_amount)} from ${terminalCount} terminal(s) and ${agentCount} merchant wallet(s)`
      });
      setIsSweepModalOpen(false);
      loadWalletData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sweep failed',
        description: error.message || 'Please try again'
      });
    } finally {
      setIsSweeping(false);
    }
  };

  const loadSweepHistory = async (page: number = 1) => {
    try {
      const res = await walletService.getSweepSessions({ page, per_page: 10 });
      setSweepHistory(res.data);
      setSweepHistoryMeta({
        currentPage: res.meta.current_page,
        totalPages: res.meta.last_page,
        total: res.meta.total
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load sweep history',
        description: error.message || 'Please try again'
      });
    }
  };

  // Transaction columns
  const transactionColumns = [
    {
      key: 'type',
      header: 'Type',
      render: (item: WalletTransaction) => {
        const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
          credit: { icon: ArrowDownToLine, label: 'Credit', color: 'text-success' },
          debit: { icon: ArrowUpFromLine, label: 'Debit', color: 'text-destructive' },
          sweep_in: { icon: ArrowDownToLine, label: 'Sweep In', color: 'text-success' },
          sweep: { icon: ArrowDownToLine, label: 'Sweep', color: 'text-success' },
          settlement_out: { icon: ArrowUpFromLine, label: 'Settlement', color: 'text-destructive' },
          settlement: { icon: ArrowUpFromLine, label: 'Settlement', color: 'text-destructive' },
          refund_in: { icon: RefreshCcw, label: 'Refund', color: 'text-success' },
          fee_out: { icon: ArrowUpFromLine, label: 'Fee', color: 'text-muted-foreground' }
        };
        const config = typeConfig[item.type] || { icon: WalletIcon, label: item.type, color: '' };
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span>{config.label}</span>
          </div>
        );
      }
    },
    {
      key: 'reference', header: 'Reference', render: (item: WalletTransaction) => (
        <span className="font-mono text-sm">{item.reference || `WALLET-TX-${item.id}`}</span>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: WalletTransaction) => {
        const isCredit = item.type === 'credit' || item.type === 'sweep_in' || item.type === 'refund_in' || item.type === 'sweep' || item.direction === 'credit';
        return (
          <span className={`font-medium ${isCredit ? 'text-success' : 'text-destructive'}`}>
            {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
          </span>
        );
      }
    },
    {
      key: 'balance_after', header: 'Balance After', render: (item: WalletTransaction) => (
        <span>{formatCurrency(item.balance_after || 0)}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: WalletTransaction) => {
        const rawStatus = (item.status || 'completed').toLowerCase();
        const normalizedStatus: 'success' | 'pending' | 'error' =
          rawStatus === 'pending' ? 'pending' : rawStatus === 'failed' || rawStatus === 'error' ? 'error' : 'success';

        return (
          <StatusBadge
            status={normalizedStatus}
            label={toLabel(rawStatus, 'Completed')}
            size="sm"
          />
        );
      }
    },
    {
      key: 'created_at', header: 'Date', render: (item: WalletTransaction) => (
        <span className="text-muted-foreground">{formatDate(item.created_at)}</span>
      )
    }
  ];

  // Sweep history columns
  const sweepHistoryColumns = [
    { key: 'created_at', header: 'Date', render: (item: SweepSession) => formatDate(item.created_at) },
    {
      key: 'mode',
      header: 'Mode',
      render: (item: SweepSession) => (
        <Badge className={item.mode === 'automatic' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
          {toLabel(item.mode, 'Manual')}
        </Badge>
      )
    },
    {
      key: 'terminals_count',
      header: 'Sources',
      render: (item: SweepSession) => {
        return `${item.source_count}`;
      }
      // render: (item: SweepSession) => {
      //   const terminalCount = item.terminal_swept_count ?? item.terminal_count ?? 0;
      //   const agentCount = item.agent_wallet_swept_count ?? 0;
      //   return `${terminalCount} terminals${agentCount > 0 ? `, ${agentCount} wallets` : ''}`;
      // }
    },
    {
      key: 'total_amount', header: 'Amount', render: (item: SweepSession) => (
        <span className="font-medium text-success">{formatCurrency(item.total_amount)}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: SweepSession) => (
        <StatusBadge
          status={item.status === 'completed' ? 'success' : item.status === 'partial' ? 'warning' : 'error'}
          label={toLabel(item.status, 'Unknown')}
          size="sm"
        />
      )
    },
    {
      key: 'initiated_by',
      header: 'Initiated By',
      render: (item: SweepSession) => item.initiated_by?.name || 'System'
    }
  ];

  // Loading skeleton
  if (isLoading) {
    return (
      <div>
        <PageHeader title="Wallet" description="Manage your wallet balance and transactions" />
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Wallet"
        description={isAgentUser ? 'Manage your merchant wallet balance and transaction history' : 'Manage your wallet balance, sweep terminal and merchant funds, and view transaction history'}
        actions={
          !isAgentUser ? (
            <Button onClick={openSweepModal}>
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Sweep to Partner Wallet
            </Button>
          ) : undefined
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(wallet?.available_balance || 0)}
            </div>
          </CardContent>
        </Card>

        <StatCard
          title="Pending Balance"
          value={formatCurrency(wallet?.pending_balance || 0)}
          icon={Clock}
        />

        <StatCard
          title="Total Swept"
          value={formatCurrency(wallet?.total_swept || 0)}
          icon={ArrowDownToLine}
        />

        <StatCard
          title="Total Settled"
          value={formatCurrency(wallet?.total_settled || 0)}
          icon={ArrowUpFromLine}
        />
      </div>

      {/* Quick Info */}
      {wallet && (
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Last Sweep</AlertTitle>
            <AlertDescription>
              {wallet.last_sweep_at ? formatDate(wallet.last_sweep_at) : 'No sweeps yet'}
            </AlertDescription>
          </Alert>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Last Settlement</AlertTitle>
            <AlertDescription>
              {wallet.last_settlement_at ? formatDate(wallet.last_settlement_at) : 'No settlements yet'}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Tabs for Transactions and Sweep History */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="sweeps" onClick={() => loadSweepHistory()}>Sweep History</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Transaction History</CardTitle>
                  <Button variant="outline" size="sm" onClick={exportTransactionsCsv}>
                    Export CSV
                  </Button>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <Tabs value={transactionFilter} onValueChange={handleTransactionFilterChange}>
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                      <TabsTrigger value="sweep" className="text-xs">Sweeps</TabsTrigger>
                      <TabsTrigger value="settlement" className="text-xs">Settlements</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 w-[160px]"
                    />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 w-[160px]"
                    />
                    <Button size="sm" variant="secondary" onClick={applyDateFilters}>Apply</Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setQuickRange('today')}>Today</Button>
                  <Button size="sm" variant="outline" onClick={() => setQuickRange('last7')}>Last 7 days</Button>
                  <Button size="sm" variant="outline" onClick={() => setQuickRange('last30')}>Last 30 days</Button>
                  <Button size="sm" variant="outline" onClick={() => setQuickRange('thisMonth')}>This month</Button>
                  <Button size="sm" variant="outline" onClick={() => setQuickRange('lastMonth')}>Last month</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={transactionColumns}
                data={transactions}
                emptyMessage="No transactions yet"
              />
              {transactionsMeta.totalPages > 1 && (
                <TablePagination
                  currentPage={transactionsMeta.currentPage}
                  totalPages={transactionsMeta.totalPages}
                  onPageChange={(page) => loadTransactions(page, transactionFilter, startDate, endDate)}
                  totalItems={transactionsMeta.total}
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sweeps">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sweep History</CardTitle>
              <CardDescription>History of terminal and merchant wallet sweeps</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={sweepHistoryColumns}
                data={sweepHistory}
                emptyMessage="No sweep history yet"
              />
              {sweepHistoryMeta.totalPages > 1 && (
                <TablePagination
                  currentPage={sweepHistoryMeta.currentPage}
                  totalPages={sweepHistoryMeta.totalPages}
                  onPageChange={loadSweepHistory}
                  totalItems={sweepHistoryMeta.total}
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sweep Modal */}
      <Dialog open={isSweepModalOpen} onOpenChange={setIsSweepModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sweep Balances</DialogTitle>
            <DialogDescription>
              Select terminal balances and merchant wallets to sweep into your partner wallet
            </DialogDescription>
          </DialogHeader>

          {isLoadingSweepable ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sweepableTerminals.length === 0 && sweepableAgentWallets.length === 0 ? (
            <Alert>
              <AlertTitle>No sweepable balances</AlertTitle>
              <AlertDescription>
                There are no terminal balances or merchant wallets available for sweep at the moment.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Terminals</p>
                  <p className="text-lg font-semibold">{sweepSummary.total_terminals}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Wallets</p>
                  <p className="text-lg font-semibold">{sweepSummary.total_agent_wallets}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sweepable</p>
                  <p className="text-lg font-semibold text-success">{formatCurrency(sweepSummary.total_amount || (sweepSummary.terminal_total_amount + sweepSummary.agent_wallet_total_amount))}</p>
                </div>
              </div>

              {/* Terminal Source */}
              {sweepableTerminals.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                    <Checkbox
                      checked={selectedTerminals.length === sweepableTerminals.length}
                      onCheckedChange={toggleAllTerminals}
                    />
                    <span className="text-sm font-medium">Select All Terminals</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {selectedTerminals.length} selected
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto mb-4">
                    {sweepableTerminals.map((terminal) => (
                      <div
                        key={terminal.id}
                        className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${selectedTerminals.includes(terminal.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                          }`}
                        onClick={() => toggleTerminalSelection(terminal.id)}
                      >
                        <Checkbox
                          checked={selectedTerminals.includes(terminal.id)}
                          onCheckedChange={() => toggleTerminalSelection(terminal.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{terminal.terminal_id}</p>
                          <p className="text-sm text-muted-foreground">{terminal.agent_name} ({terminal.agent_code})</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-success">{formatCurrency(terminal.balance)}</p>
                          {terminal.last_transaction_at && (
                            <p className="text-xs text-muted-foreground">
                              Last txn: {formatDate(terminal.last_transaction_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Merchant Wallet Source */}
              {sweepableAgentWallets.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                    <Checkbox
                      checked={selectedAgentWallets.length === sweepableAgentWallets.length}
                      onCheckedChange={toggleAllAgentWallets}
                    />
                    <span className="text-sm font-medium">Select All Merchant Wallets</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {selectedAgentWallets.length} selected
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto">
                    {sweepableAgentWallets.map((agentWallet) => (
                      <div
                        key={agentWallet.agent_id}
                        className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${selectedAgentWallets.includes(agentWallet.agent_id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                          }`}
                        onClick={() => toggleAgentSelection(agentWallet.agent_id)}
                      >
                        <Checkbox
                          checked={selectedAgentWallets.includes(agentWallet.agent_id)}
                          onCheckedChange={() => toggleAgentSelection(agentWallet.agent_id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{agentWallet.agent_name}</p>
                          <p className="text-sm text-muted-foreground">Agent ID: {agentWallet.agent_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-success">{formatCurrency(Number(agentWallet.available_balance ?? agentWallet.balance ?? 0))}</p>
                          {agentWallet.last_credit_at && (
                            <p className="text-xs text-muted-foreground">
                              Last credit: {formatDate(agentWallet.last_credit_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-end text-sm text-muted-foreground mt-3">
                Total selected: {formatCurrency(getSelectedAmount())}
              </div>
            </>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsSweepModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSweep}
              disabled={(selectedTerminals.length === 0 && selectedAgentWallets.length === 0) || isSweeping}
            >
              {isSweeping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  Sweep {selectedTerminals.length + selectedAgentWallets.length} Source{selectedTerminals.length + selectedAgentWallets.length !== 1 ? 's' : ''} ({formatCurrency(getSelectedAmount())})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Badge component inline since it might not be exported
function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
