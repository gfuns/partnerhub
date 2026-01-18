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
import { walletService, Wallet, WalletTransaction, SweepableTerminal, SweepSession } from '@/services/api/wallet.service';

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

export default function WalletPage() {
  const { toast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsMeta, setTransactionsMeta] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  
  // Sweep state
  const [sweepableTerminals, setSweepableTerminals] = useState<SweepableTerminal[]>([]);
  const [sweepSummary, setSweepSummary] = useState({ total_terminals: 0, total_balance: 0 });
  const [selectedTerminals, setSelectedTerminals] = useState<number[]>([]);
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
        walletService.getWallet(),
        walletService.getTransactions({ page: 1, per_page: 10 })
      ]);
      
      // Normalize wallet response: some endpoints return { data: { wallet: {...} } }
      const rawWallet: any = (walletRes as any).data;
      const walletObj: any = rawWallet?.wallet ?? rawWallet ?? null;
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

  const loadTransactions = async (page: number, type?: string) => {
    try {
      const params: any = { page, per_page: 10 };
      if (type && type !== 'all') {
        params.type = type;
      }
      const res = await walletService.getTransactions(params);
      setTransactions(res.data);
      setTransactionsMeta({
        currentPage: res.meta.current_page,
        totalPages: res.meta.last_page,
        total: res.meta.total
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
    loadTransactions(1, value);
  };

  const openSweepModal = async () => {
    setIsSweepModalOpen(true);
    setIsLoadingSweepable(true);
    setSelectedTerminals([]);
    
    try {
      const res = await walletService.getSweepableTerminals();
      // terminals may be wrapped
      const terminalsRaw: any = (res as any).data;
      const terminalsArray: SweepableTerminal[] = Array.isArray(terminalsRaw) ? terminalsRaw : (terminalsRaw?.data ?? terminalsRaw ?? []);
      const summary: any = (res as any).summary ?? terminalsRaw?.summary ?? { total_terminals: terminalsArray.length, total_balance: terminalsArray.reduce((s: number, t: any) => s + (t.balance || 0), 0) };

      setSweepableTerminals(terminalsArray);
      setSweepSummary(summary);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load terminals',
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

  const getSelectedAmount = () => {
    return sweepableTerminals
      .filter(t => selectedTerminals.includes(t.id))
      .reduce((sum, t) => sum + t.balance, 0);
  };

  const handleSweep = async () => {
    if (selectedTerminals.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No terminals selected',
        description: 'Please select at least one terminal to sweep'
      });
      return;
    }

    setIsSweeping(true);
    try {
      const res = await walletService.initiateSweep({ terminal_ids: selectedTerminals });
      toast({
        title: 'Sweep initiated',
        description: `Successfully swept ${formatCurrency(res.data.total_amount)} from ${res.data.terminals_count} terminals`
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
          sweep_in: { icon: ArrowDownToLine, label: 'Sweep In', color: 'text-success' },
          settlement_out: { icon: ArrowUpFromLine, label: 'Settlement', color: 'text-destructive' },
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
    { key: 'reference', header: 'Reference', render: (item: WalletTransaction) => (
      <span className="font-mono text-sm">{item.reference}</span>
    )},
    {
      key: 'amount',
      header: 'Amount',
      render: (item: WalletTransaction) => {
        const isCredit = item.type === 'sweep_in' || item.type === 'refund_in';
        return (
          <span className={`font-medium ${isCredit ? 'text-success' : 'text-destructive'}`}>
            {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
          </span>
        );
      }
    },
    { key: 'balance_after', header: 'Balance After', render: (item: WalletTransaction) => (
      <span>{formatCurrency(item.balance_after)}</span>
    )},
    {
      key: 'status',
      header: 'Status',
      render: (item: WalletTransaction) => (
        <StatusBadge 
          status={item.status as 'success' | 'pending' | 'error'} 
          label={item.status.charAt(0).toUpperCase() + item.status.slice(1)} 
          size="sm" 
        />
      )
    },
    { key: 'created_at', header: 'Date', render: (item: WalletTransaction) => (
      <span className="text-muted-foreground">{formatDate(item.created_at)}</span>
    )}
  ];

  // Sweep history columns
  const sweepHistoryColumns = [
    { key: 'created_at', header: 'Date', render: (item: SweepSession) => formatDate(item.created_at) },
    { 
      key: 'mode', 
      header: 'Mode', 
      render: (item: SweepSession) => (
        <Badge className={item.mode === 'automatic' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
          {item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}
        </Badge>
      )
    },
    { key: 'terminals_count', header: 'Terminals', render: (item: SweepSession) => item.terminals_count },
    { key: 'total_amount', header: 'Amount', render: (item: SweepSession) => (
      <span className="font-medium text-success">{formatCurrency(item.total_amount)}</span>
    )},
    {
      key: 'status',
      header: 'Status',
      render: (item: SweepSession) => (
        <StatusBadge 
          status={item.status === 'completed' ? 'success' : item.status === 'partial' ? 'warning' : 'error'} 
          label={item.status.charAt(0).toUpperCase() + item.status.slice(1)} 
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
        description="Manage your wallet balance, sweep terminal funds, and view transaction history"
        actions={
          <Button onClick={openSweepModal}>
            <ArrowDownToLine className="h-4 w-4 mr-2" />
            Sweep from Terminals
          </Button>
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Transaction History</CardTitle>
                <Tabs value={transactionFilter} onValueChange={handleTransactionFilterChange}>
                  <TabsList className="h-8">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="sweep_in" className="text-xs">Sweeps</TabsTrigger>
                    <TabsTrigger value="settlement_out" className="text-xs">Settlements</TabsTrigger>
                    <TabsTrigger value="refund_in" className="text-xs">Refunds</TabsTrigger>
                  </TabsList>
                </Tabs>
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
                  onPageChange={(page) => loadTransactions(page, transactionFilter)}
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
              <CardDescription>History of terminal balance sweeps</CardDescription>
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
            <DialogTitle>Sweep Terminal Balances</DialogTitle>
            <DialogDescription>
              Select terminals to sweep their balances to your wallet
            </DialogDescription>
          </DialogHeader>

          {isLoadingSweepable ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sweepableTerminals.length === 0 ? (
            <Alert>
              <AlertTitle>No terminals with balance</AlertTitle>
              <AlertDescription>
                There are no terminals with sweepable balance at the moment.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Terminals</p>
                  <p className="text-lg font-semibold">{sweepSummary.total_terminals}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-lg font-semibold text-success">{formatCurrency(sweepSummary.total_balance)}</p>
                </div>
              </div>

              {/* Select All */}
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <Checkbox 
                  checked={selectedTerminals.length === sweepableTerminals.length}
                  onCheckedChange={toggleAllTerminals}
                />
                <span className="text-sm font-medium">Select All</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {selectedTerminals.length} selected • {formatCurrency(getSelectedAmount())}
                </span>
              </div>

              {/* Terminal List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {sweepableTerminals.map(terminal => (
                  <div 
                    key={terminal.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTerminals.includes(terminal.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
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

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsSweepModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSweep} 
              disabled={selectedTerminals.length === 0 || isSweeping}
            >
              {isSweeping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  Sweep {selectedTerminals.length} Terminal{selectedTerminals.length !== 1 ? 's' : ''} ({formatCurrency(getSelectedAmount())})
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
