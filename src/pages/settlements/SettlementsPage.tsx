import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Banknote, 
  Building2, 
  Plus, 
  Eye, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  ArrowRight,
  Shield,
  BadgeCheck,
  BadgeAlert
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ActionButton } from '@/components/ActionButton';
import { TablePagination } from '@/components/TablePagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  settlementService, 
  SettlementAccount,
  SettlementRequest,
  SettlementStatus,
  Bank,
  SettlementEligibility,
  calculateSettlementFee
} from '@/services/api/settlement.service';
import { walletService } from '@/services/api/wallet.service';

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

// Status colors and icons
const statusConfig: Record<SettlementStatus, { color: string; icon: any; label: string }> = {
  pending: { color: 'warning', icon: Clock, label: 'Pending' },
  approved: { color: 'info', icon: CheckCircle2, label: 'Approved' },
  processing: { color: 'info', icon: Loader2, label: 'Processing' },
  paid: { color: 'success', icon: CheckCircle2, label: 'Paid' },
  rejected: { color: 'destructive', icon: XCircle, label: 'Rejected' },
  failed: { color: 'destructive', icon: AlertCircle, label: 'Failed' }
};

export default function SettlementsPage() {
  const { toast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [settlements, setSettlements] = useState<SettlementRequest[]>([]);
  const [settlementsMeta, setSettlementsMeta] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [settlementStats, setSettlementStats] = useState<{
    pending_count: number;
    pending_amount: number;
    paid_this_month: number;
    total_paid: number;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Bank accounts state
  const [accounts, setAccounts] = useState<SettlementAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  
  // Eligibility
  const [eligibility, setEligibility] = useState<SettlementEligibility | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  // Add account modal
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccountBankCode, setNewAccountBankCode] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [isResolvingAccount, setIsResolvingAccount] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  
  // Request settlement modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete account confirmation
  const [accountToDelete, setAccountToDelete] = useState<SettlementAccount | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);
  
  // Details modal
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementRequest | null>(null);

  useEffect(() => {
    loadData();
    // prefetch banks separately to avoid modal loading issues
    fetchBanks();
  }, []);

  useEffect(() => {
    if (isAddAccountModalOpen && banks.length === 0 && !isLoadingBanks) {
      fetchBanks();
    }
  }, [isAddAccountModalOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settlementsRes, accountsRes, banksRes, eligibilityRes, walletRes] = await Promise.all([
        settlementService.getSettlements({ page: 1, per_page: 10 }),
        settlementService.getSettlementAccounts(),
        settlementService.getBanks(),
        settlementService.checkEligibility(),
        walletService.getWallet()
      ]);
      
      // Normalize settlements response: API may return { data: [...] } or { data: { settlements: [...], stats } }
      const rawSettlements: any = (settlementsRes as any).data;
      const settlementsArray: SettlementRequest[] = Array.isArray(rawSettlements)
        ? rawSettlements
        : (rawSettlements?.settlements ?? rawSettlements ?? []);

      const settlementsMetaSource: any = (settlementsRes as any).meta ?? rawSettlements?.meta ?? {};

      setSettlements(settlementsArray);
      setSettlementsMeta({
        currentPage: settlementsMetaSource.current_page ?? 1,
        totalPages: settlementsMetaSource.last_page ?? 1,
        total: settlementsMetaSource.total ?? 0
      });

      // Stats might be at root or inside data
      const statsSource = (settlementsRes as any).stats ?? (rawSettlements as any)?.stats;
      if (statsSource) {
        setSettlementStats(statsSource);
      }

      // Normalize accounts response: some endpoints return { data: { accounts: [...] } }
      const rawAccounts: any = (accountsRes as any).data;
      const accountsArray: SettlementAccount[] = Array.isArray(rawAccounts)
        ? rawAccounts
        : (rawAccounts?.accounts ?? rawAccounts ?? []);
      setAccounts(accountsArray);

      // Banks usually come as an array in data
      setBanks((banksRes as any).data ?? []);
      // Normalize backend eligibility shapes into the frontend `SettlementEligibility` shape
      const rawEligibility: any = (eligibilityRes as any).data ?? (eligibilityRes as any) ?? null;
      if (rawEligibility) {
        // New backend format example: { wallet_balance, pending_settlements, available_balance, min_request_amount, can_request, max_requestable }
        if (rawEligibility.can_request !== undefined) {
          setEligibility({
            is_eligible: !!rawEligibility.can_request,
            reason: rawEligibility.reason ?? undefined,
            wallet_balance: parseFloat(rawEligibility.wallet_balance ?? rawEligibility.available_balance ?? 0),
            has_verified_account: !!rawEligibility.has_verified_account,
            min_amount: rawEligibility.min_request_amount ?? rawEligibility.min_amount ?? 0,
            max_amount: rawEligibility.max_requestable ?? rawEligibility.max_amount ?? 0,
            fee_type: rawEligibility.fee_type ?? 'flat',
            fee_value: rawEligibility.fee_value ?? 0,
            stamp_duty: rawEligibility.stamp_duty ?? 0
          } as SettlementEligibility);
        } else {
          setEligibility(rawEligibility as SettlementEligibility);
        }
      } else {
        setEligibility(null);
      }

      // Wallet response may be { data: { wallet: {...} } } or { data: {...} }
      const rawWallet: any = (walletRes as any).data;
      const walletObj: any = rawWallet?.wallet ?? rawWallet ?? null;
      
      setWalletBalance(walletObj?.available_balance ?? walletObj?.availableBalance ?? 0);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load data',
        description: error.message || 'Please try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      setIsLoadingBanks(true);
      const res = await settlementService.getBanks();
      setBanks((res as any).data ?? []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load banks', description: error.message || 'Please try again' });
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const loadSettlements = async (page: number, status?: string) => {
    try {
      const params: any = { page, per_page: 10 };
      if (status && status !== 'all') {
        params.status = status;
      }
      const res = await settlementService.getSettlements(params);
      const raw: any = (res as any).data;
      const arr: SettlementRequest[] = Array.isArray(raw) ? raw : (raw?.settlements ?? raw ?? []);
      const metaSource: any = (res as any).meta ?? raw?.meta ?? {};

      setSettlements(arr);
      setSettlementsMeta({
        currentPage: metaSource.current_page ?? 1,
        totalPages: metaSource.last_page ?? 1,
        total: metaSource.total ?? 0
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load settlements',
        description: error.message || 'Please try again'
      });
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    loadSettlements(1, value);
  };

  // Account number resolution
  const handleAccountNumberChange = async (value: string) => {
    setNewAccountNumber(value);
    setNewAccountName('');
    
    if (value.length === 10 && newAccountBankCode) {
      setIsResolvingAccount(true);
      try {
        const res = await settlementService.resolveBankAccount({
          bank_code: newAccountBankCode,
          account_number: value
        });
        console.log(res);
        
        setNewAccountName(((res.data as any).accountName || (res.data as any).account_name || '').toUpperCase());
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Could not resolve account',
          description: error.message || 'Please verify the account details'
        });
      } finally {
        setIsResolvingAccount(false);
      }
    }
  };

  const handleBankChange = (value: string) => {
    setNewAccountBankCode(value);
    if (newAccountNumber.length === 10) {
      handleAccountNumberChange(newAccountNumber);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccountBankCode || !newAccountNumber || !newAccountName) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please fill in all account details'
      });
      return;
    }

    setIsSavingAccount(true);
    try {
      // Derive bank name from selected bank code or fallback value
      const matchedBank = banks.find(b => b.code === newAccountBankCode) ?? banks.find(b => newAccountBankCode.startsWith(b.name));
      const bankNameToSend = matchedBank ? matchedBank.name : newAccountBankCode;

      await settlementService.addSettlementAccount({
        bank_name: bankNameToSend,
        bank_code: newAccountBankCode,
        account_number: newAccountNumber,
        account_name: newAccountName
      } as any);

      toast({
        title: 'Account added',
        description: 'Your bank account has been added for verification'
      });

      setIsAddAccountModalOpen(false);
      resetAccountForm();
      loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to add account',
        description: error.message || 'Please try again'
      });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const resetAccountForm = () => {
    setNewAccountBankCode('');
    setNewAccountNumber('');
    setNewAccountName('');
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;

    setIsDeletingAccount(true);
    try {
      await settlementService.removeSettlementAccount(accountToDelete.id);
      toast({
        title: 'Account removed',
        description: 'The bank account has been removed'
      });
      setAccountToDelete(null);
      loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to remove account',
        description: error.message || 'Please try again'
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleSetPrimaryAccount = async (accountId: number) => {
    setSettingPrimaryId(accountId);
    try {
      await settlementService.setPrimaryAccount(accountId);

      toast({
        title: 'Primary account updated',
        description: 'Primary settlement account set successfully'
      });

      loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to set primary account',
        description: error.message || 'Please try again'
      });
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const handleRequestSettlement = async () => {
    const amount = parseFloat(settlementAmount);
    
    if (!amount || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid amount',
        description: 'Please enter a valid amount'
      });
      return;
    }

    if (!selectedAccountId) {
      toast({
        variant: 'destructive',
        title: 'No account selected',
        description: 'Please select a bank account'
      });
      return;
    }

    if (eligibility && amount < eligibility.min_amount) {
      toast({
        variant: 'destructive',
        title: 'Amount too low',
        description: `Minimum settlement amount is ${formatCurrency(eligibility.min_amount)}`
      });
      return;
    }

    if (eligibility && amount > eligibility.max_amount) {
      toast({
        variant: 'destructive',
        title: 'Amount too high',
        description: `Maximum settlement amount is ${formatCurrency(eligibility.max_amount)}`
      });
      return;
    }

    if (amount > walletBalance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient balance',
        description: 'The amount exceeds your available balance'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await settlementService.requestSettlement({
        amount,
        settlement_account_id: parseInt(selectedAccountId),
        notes: settlementNotes || undefined
      });

      toast({
        title: 'Settlement requested',
        description: 'Your settlement request has been submitted for approval'
      });

      setIsRequestModalOpen(false);
      setSettlementAmount('');
      setSelectedAccountId('');
      setSettlementNotes('');
      loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to request settlement',
        description: error.message || 'Please try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get verified accounts for settlement (support backend `status` or legacy `verification_status`)
  const verifiedAccounts = accounts.filter(a => {
    const s = (a as any).status ?? (a as any).verification_status;
    return s === 'verified';
  });

  // Calculate fee preview
  const getFeePreview = () => {
    const amount = parseFloat(settlementAmount) || 0;
    if (!eligibility || amount <= 0) return null;
    return calculateSettlementFee(amount, eligibility.fee_type, eligibility.fee_value);
  };

  // Settlement columns
  const settlementColumns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (item: SettlementRequest) => (
        <span className="font-mono text-sm">{item.reference}</span>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: SettlementRequest) => (
        <div>
          <p className="font-semibold">{formatCurrency(item.amount)}</p>
          {item.fee > 0 && (
            <p className="text-xs text-muted-foreground">Fee: {formatCurrency(item.fee)}</p>
          )}
        </div>
      )
    },
    {
      key: 'net_amount',
      header: 'Net Amount',
      render: (item: SettlementRequest) => (
        <span className="font-medium text-success">{formatCurrency(item.net_amount)}</span>
      )
    },
    {
      key: 'account',
      header: 'Bank Account',
      render: (item: SettlementRequest) => (
        item.settlement_account ? (
          <div>
            <p className="font-medium">{item.settlement_account.bank_name}</p>
            <p className="text-sm text-muted-foreground">****{item.settlement_account.account_number.slice(-4)}</p>
          </div>
        ) : '-'
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: SettlementRequest) => {
        const config = statusConfig[item.status?.toLowerCase()];
        let status = config.label.toLowerCase();
        if (status === 'approved') {
          status = 'pending_payment';
        }
        
        return (
          <StatusBadge 
            status={status as any} 
            label={status} 
            size="sm" 
          />
        );
      }
    },
    {
      key: 'created_at',
      header: 'Requested',
      render: (item: SettlementRequest) => (
        <span className="text-muted-foreground">{formatDate(item.created_at)}</span>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: SettlementRequest) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedSettlement(item)}>
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  // Loading skeleton
  if (isLoading) {
    return (
      <div>
        <PageHeader title="Settlements" description="Request settlements to your bank account" />
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map(i => (
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

  // Check eligibility
  const canRequestSettlement = eligibility?.is_eligible && verifiedAccounts.length > 0;

  return (
    <div>
      <PageHeader 
        title="Settlements" 
        description="Request settlements from your wallet to your bank account"
        actions={
          <Button 
            onClick={() => setIsRequestModalOpen(true)}
            disabled={!canRequestSettlement}
          >
            <Banknote className="h-4 w-4 mr-2" />
            Request Settlement
          </Button>
        }
      />

      {/* Eligibility Warning */}
      {eligibility && !eligibility.is_eligible && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Settlement Not Available</AlertTitle>
          <AlertDescription>{eligibility.reason}</AlertDescription>
        </Alert>
      )}

      {/* No verified account warning */}
      {verifiedAccounts.length === 0 && (
        <Alert className="mb-6">
          <Building2 className="h-4 w-4" />
          <AlertTitle>No Verified Bank Account</AlertTitle>
          <AlertDescription>
            You need to add and verify a bank account before you can request settlements.
            <Button variant="link" className="p-0 h-auto ml-1" onClick={() => setIsAddAccountModalOpen(true)}>
              Add Bank Account
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(walletBalance)}
            </div>
          </CardContent>
        </Card>
        
        <StatCard 
          title="Pending Settlements" 
          // value={`${settlementStats?.pending_count ?? 0} • ${formatCurrency(settlementStats?.pending_amount ?? 0)}`} 
          value={`${formatCurrency(settlementStats?.pending_amount ?? 0)}`} 
          icon={Clock}
        />
        
        <StatCard 
          title="Paid This Month" 
          value={formatCurrency(settlementStats?.paid_this_month || 0)} 
          icon={CheckCircle2}
        />
        
        <StatCard 
          title="Total Paid" 
          value={formatCurrency(settlementStats?.total_paid || 0)} 
          icon={Banknote}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="settlements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settlements">Settlement History</TabsTrigger>
          <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="settlements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Settlement Requests</CardTitle>
                <Tabs value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <TabsList className="h-8">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                    <TabsTrigger value="approved" className="text-xs">Pending Payment</TabsTrigger>
                    <TabsTrigger value="paid" className="text-xs">Paid</TabsTrigger>
                    <TabsTrigger value="rejected" className="text-xs">Rejected</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={settlementColumns} 
                data={Array.isArray(settlements) ? settlements : []} 
                emptyMessage="No settlement requests yet" 
              />
              {settlementsMeta.totalPages > 1 && (
                <TablePagination
                  currentPage={settlementsMeta.currentPage}
                  totalPages={settlementsMeta.totalPages}
                  onPageChange={(page) => loadSettlements(page, statusFilter)}
                  totalItems={settlementsMeta.total}
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Bank Accounts</CardTitle>
                  <CardDescription>Manage your settlement bank accounts</CardDescription>
                </div>
                <Button onClick={() => setIsAddAccountModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Bank Accounts</h3>
                  <p className="text-muted-foreground mb-4">Add a bank account to receive settlements</p>
                  <Button onClick={() => setIsAddAccountModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Account
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {accounts.map(account => (
                    <Card key={account.id} className={account.is_primary ? 'border-primary' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{account.bank_name}</p>
                              <p className="text-sm text-muted-foreground">{account.account_number}</p>
                              <p className="text-sm">{account.account_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const acctStatus = (account as any).status ?? (account as any).verification_status;
                              if (acctStatus === 'verified') return <BadgeCheck className="h-5 w-5 text-success" />;
                              if (acctStatus === 'pending') return <Clock className="h-5 w-5 text-warning" />;
                              return <BadgeAlert className="h-5 w-5 text-destructive" />;
                            })()}
                            {!account.is_primary && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetPrimaryAccount(account.id)}
                                disabled={settingPrimaryId === account.id}
                              >
                                {settingPrimaryId === account.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Making...
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Make Primary
                                  </>
                                )}
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setAccountToDelete(account)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <StatusBadge 
                            status={
                              ((account as any).status ?? (account as any).verification_status) === 'verified' ? 'success' : 
                              ((account as any).status ?? (account as any).verification_status) === 'pending' ? 'warning' : 'error'
                            }
                            label={
                              ((account as any).status ?? (account as any).verification_status)
                                ? ((account as any).status ?? (account as any).verification_status).charAt(0).toUpperCase() + ((account as any).status?.replace(/_/g, ' ') ?? (account as any).verification_status?.replace(/_/g, ' ')).slice(1)
                                : 'Unknown'
                            }
                            size="sm"
                          />
                          {account.is_primary && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Primary</span>
                          )}
                        </div>
                        {account.rejection_reason && (
                          <p className="text-sm text-destructive mt-2">{account.rejection_reason}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Account Modal */}
      <Dialog open={isAddAccountModalOpen} onOpenChange={setIsAddAccountModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Add a bank account to receive settlements. Account will need to be verified before use.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Bank</Label>
              <Select value={newAccountBankCode} onValueChange={handleBankChange}>
                <SelectTrigger disabled={isLoadingBanks || banks.length === 0}>
                  <SelectValue placeholder={isLoadingBanks ? 'Loading banks...' : (banks.length === 0 ? 'No banks available' : 'Select bank')} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingBanks ? (
                    <SelectItem value="__loading_banks__" disabled>Loading banks...</SelectItem>
                  ) : banks.length === 0 ? (
                    <SelectItem value="__no_banks__" disabled>No banks available</SelectItem>
                  ) : (
                    banks.map((bank, idx) => (
                      <SelectItem
                        key={bank.code ?? `${bank.name}-${idx}`}
                        value={bank.code ?? `${bank.name}-${idx}`}
                      >
                        {bank.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Account Number</Label>
              <Input 
                type="text"
                maxLength={10}
                placeholder="Enter 10-digit account number"
                value={newAccountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div>
              <Label>Account Name</Label>
              <div className="relative">
                <Input 
                  type="text"
                  placeholder="Account name will be resolved"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  readOnly={true}
                />
                {isResolvingAccount && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAccountModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddAccount} 
              disabled={!newAccountBankCode || !newAccountNumber || !newAccountName || isSavingAccount}
            >
              {isSavingAccount ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Settlement Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Settlement</DialogTitle>
            <DialogDescription>
              Transfer funds from your wallet to your bank account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Stamp Duty Notice */}
            {eligibility?.stamp_duty && eligibility.stamp_duty > 0 && (
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded text-yellow-800 text-sm">
                <strong>Notice:</strong> This settlement will attract a stamp duty of {formatCurrency(eligibility.stamp_duty)}.
              </div>
            )}
            {/* Balance Display */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(walletBalance)}</p>
            </div>

            {/* Amount Input */}
            <div>
              <Label>Amount to Settle</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                <Input 
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Enter amount"
                  className="pl-8"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                />
              </div>
              {eligibility && (
                <p className="text-xs text-muted-foreground mt-1">
                  Min: {formatCurrency(eligibility.min_amount)} • Max: {formatCurrency(eligibility.max_amount)}
                </p>
              )}
            </div>

            {/* Fee Preview */}
            {getFeePreview() && (
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Requested Amount</span>
                  <span>{formatCurrency(parseFloat(settlementAmount))}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Settlement Fee ({eligibility?.fee_type === 'percentage' ? `${eligibility.fee_value}%` : `₦${eligibility?.fee_value}`})</span>
                  <span>-{formatCurrency(getFeePreview()!.fee)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>You Will Receive</span>
                  <span className="text-success">{formatCurrency(getFeePreview()!.netAmount)}</span>
                </div>
              </div>
            )}

            {/* Account Selection */}
            <div>
              <Label>Settlement Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {verifiedAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.bank_name} - ****{account.account_number.slice(-4)} ({account.account_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea 
                placeholder="Add any notes for this settlement"
                value={settlementNotes}
                onChange={(e) => setSettlementNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestSettlement} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Request Settlement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settlement Details Modal */}
      <Dialog open={!!selectedSettlement} onOpenChange={() => setSelectedSettlement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settlement Details</DialogTitle>
          </DialogHeader>

          {selectedSettlement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Reference</Label>
                  <p className="font-mono">{selectedSettlement.reference}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <StatusBadge 
                      status={(statusConfig as any)[selectedSettlement.status]?.color ?? 'warning'}
                      label={(statusConfig as any)[selectedSettlement.status]?.label ?? (selectedSettlement.status ?? 'Unknown')}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-semibold">{formatCurrency(selectedSettlement.amount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fee</Label>
                  <p>{formatCurrency(selectedSettlement.fee)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Net Amount</Label>
                  <p className="font-semibold text-success">{formatCurrency(selectedSettlement.net_amount)}</p>
                </div>
              </div>

              {selectedSettlement.settlement_account && (
                <div>
                  <Label className="text-muted-foreground">Bank Account</Label>
                  <p>{selectedSettlement.settlement_account.bank_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSettlement.settlement_account.account_number} - {selectedSettlement.settlement_account.account_name}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Requested By</Label>
                  <p>{selectedSettlement.requested_by_name ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested At</Label>
                  <p>{formatDate(selectedSettlement.created_at)}</p>
                </div>
              </div>

              {selectedSettlement.approved_by && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Approved By</Label>
                    <p>{selectedSettlement.approved_by?.name ?? '—'}</p>
                  </div>
                  {selectedSettlement.approved_at && (
                    <div>
                      <Label className="text-muted-foreground">Approved At</Label>
                      <p>{formatDate(selectedSettlement.approved_at)}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedSettlement.paid_at && (
                <div>
                  <Label className="text-muted-foreground">Paid At</Label>
                  <p>{formatDate(selectedSettlement.paid_at)}</p>
                </div>
              )}

              {selectedSettlement.payment_reference && (
                <div>
                  <Label className="text-muted-foreground">Payment Reference</Label>
                  <p className="font-mono">{selectedSettlement.payment_reference}</p>
                </div>
              )}

              {selectedSettlement.rejection_reason && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Rejection Reason</AlertTitle>
                  <AlertDescription>{selectedSettlement.rejection_reason}</AlertDescription>
                </Alert>
              )}

              {selectedSettlement.failure_reason && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Failure Reason</AlertTitle>
                  <AlertDescription>{selectedSettlement.failure_reason}</AlertDescription>
                </Alert>
              )}

              {selectedSettlement.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p>{selectedSettlement.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={!!accountToDelete} onOpenChange={() => setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Bank Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this bank account? This action cannot be undone.
              {accountToDelete && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="font-medium">{accountToDelete.bank_name}</p>
                  <p className="text-sm">{accountToDelete.account_number} - {accountToDelete.account_name}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
