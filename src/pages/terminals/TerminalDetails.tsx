import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Ban, Activity, TrendingUp, Clock, Download, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { DetailCard, DetailRow } from '@/components/DetailCard';
import { PermissionGate } from '@/components/PermissionGate';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import terminalsService, { Terminal, TerminalStats, Transaction, TransactionListParams } from '@/services/api/terminals.service';
import { TablePagination } from '@/components/TablePagination';
import { commissionService, PartnerCommission, CommissionType } from '@/services/api/commission.service';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function TerminalDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [stats, setStats] = useState<TerminalStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);

  // Transaction filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [transactionSummary, setTransactionSummary] = useState<any>(null);

  const defaultTab = searchParams.get('tab') || 'overview';
  const pageSize = 15;

  // Terminal-level commissions
  const [terminalCommissions, setTerminalCommissions] = useState<PartnerCommission[]>([]);
  const [isCommissionsLoading, setIsCommissionsLoading] = useState(false);
  const [isEditCommissionOpen, setIsEditCommissionOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<PartnerCommission | null>(null);
  const [markupType, setMarkupType] = useState<CommissionType>('percentage');
  const [markupValue, setMarkupValue] = useState<string>('0');
  const [markupCap, setMarkupCap] = useState<string>('0');
  const [isSavingCommission, setIsSavingCommission] = useState(false);

  useEffect(() => {
    if (id) {
      loadTerminalDetails();
    }
  }, [id]);

  useEffect(() => {
    if (id && defaultTab === 'transactions') {
      loadTransactions();
    }
  }, [id, currentPage, startDate, endDate, typeFilter, statusFilter, minAmount, maxAmount, searchQuery]);

  const handleTabChange = (value: string) => {
    if (value === 'transactions' && id && transactions.length === 0) {
      loadTransactions();
    }

    if (value === 'commissions' && id && terminalCommissions.length === 0) {
      loadTerminalCommissions();
    }
  };

  const loadTerminalDetails = async () => {
    try {
      setLoading(true);
      const response = await terminalsService.getTerminal(id!);
      setTerminal(response.data.terminal);
      setStats(response.data.stats);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load terminal details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const params: TransactionListParams = {
        page: currentPage,
        per_page: pageSize,
      };

      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (minAmount) params.min_amount = parseFloat(minAmount);
      if (maxAmount) params.max_amount = parseFloat(maxAmount);
      if (searchQuery) params.search = searchQuery;

      const response = await terminalsService.getTransactions(id!, params);
      setTransactions(response.data);
      setTransactionSummary(response.summary);
      setTotalPages(response.meta.last_page);
      setTotalItems(response.meta.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load transactions',
        variant: 'destructive',
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadTerminalCommissions = async () => {
    if (!id) return;
    try {
      setIsCommissionsLoading(true);
      const response = await commissionService.getTerminalCommissions(id);
      const apiCommissions = response.data.commissions || [];

      const mapped: PartnerCommission[] = apiCommissions.map((item: any) => {
        const base = item.xtrapay_commission || {};
        const pm = item.partner_markup;
        const tm = item.terminal_markup;

        const baseType: CommissionType = base.type || 'percentage';
        const pmType: CommissionType = pm?.type || 'percentage';
        const tmType: CommissionType = tm?.type || pmType;

        const baseValue = Number(base.value) || 0;
        const baseCap = Number(base.cap) || 0;

        const pmValue = pm ? Number(pm.value) : 0;
        const pmCap = pm ? Number(pm.cap) : 0;

        const tmValue = tm ? Number(tm.value) : 0;
        const tmCap = tm ? Number(tm.cap) : 0;

        // If terminal markup exists, it should override partner markup for effective rate
        const appliedMarkup = item.has_terminal_markup ? tm : pm;
        const appliedValue = item.has_terminal_markup ? tmValue : pmValue;
        const appliedCap = item.has_terminal_markup ? tmCap : pmCap;
        const appliedType = item.has_terminal_markup ? tmType : pmType;

        const effectiveValue = baseType === 'percentage' && appliedMarkup ? baseValue + appliedValue : (baseType === 'flat' ? baseValue + appliedValue : baseValue + appliedValue);
        const effectiveCap = baseCap + appliedCap;

        return {
          id: item.service_type?.id ?? Math.random(),
          service_type_id: item.service_type?.id ?? 0,
          service_type: item.service_type,
          xtrapay_base: {
            type: baseType,
            value: baseValue,
            cap: baseCap,
          },
          partner_markup: pm
            ? {
                type: pmType,
                value: pmValue,
                cap: pmCap,
              }
            : null,
          // keep terminal_markup on the object using partner_markup field for UI editing compatibility
          // but we'll prefer terminal_markup where appropriate
          effective_rate: {
            type: appliedType || baseType,
            value: effectiveValue,
            cap: effectiveCap,
          },
          is_active: (tm?.is_active ?? pm?.is_active) ?? true,
          // attach raw terminal_markup for reference
          // @ts-ignore - extend shape dynamically
          terminal_markup: tm ? { type: tmType, value: tmValue, cap: tmCap, is_active: tm.is_active } : null,
          // also indicate presence boolean (mirrors API)
          // @ts-ignore
          has_terminal_markup: Boolean(item.has_terminal_markup),
        } as PartnerCommission;
      });

      setTerminalCommissions(mapped);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load terminal commissions', description: error.message || 'Please try again' });
    } finally {
      setIsCommissionsLoading(false);
    }
  };

  const openEditCommissionModal = (commission: PartnerCommission) => {
    setEditingCommission(commission);
    // Prefer terminal_markup if present (it overrides partner markup)
    // @ts-ignore - terminal_markup may be attached dynamically
    const tm = (commission as any).terminal_markup;
    if (tm) {
      setMarkupType(tm.type as CommissionType);
      setMarkupValue(String(tm.value));
      setMarkupCap(String(tm.cap));
    } else if (commission.partner_markup) {
      setMarkupType(commission.partner_markup.type);
      setMarkupValue(commission.partner_markup.value.toString());
      setMarkupCap(commission.partner_markup.cap.toString());
    } else {
      setMarkupType('percentage');
      setMarkupValue('0');
      setMarkupCap('0');
    }
    setIsEditCommissionOpen(true);
  };

  const closeEditCommissionModal = () => {
    setIsEditCommissionOpen(false);
    setEditingCommission(null);
  };

  const handleSaveTerminalMarkup = async () => {
    if (!editingCommission || !id) return;

    const value = parseFloat(markupValue);
    const cap = parseFloat(markupCap);

    if (isNaN(value) || value < 0) {
      toast({ variant: 'destructive', title: 'Invalid value', description: 'Markup value must be 0 or greater' });
      return;
    }

    if (markupType === 'percentage' && value > 100) {
      toast({ variant: 'destructive', title: 'Invalid value', description: 'Percentage value cannot exceed 100' });
      return;
    }

    setIsSavingCommission(true);
    try {
      await commissionService.setTerminalCommission(id, {
        service_type_id: editingCommission.service_type_id,
        type: markupType,
        value,
        cap: cap || 0,
      });

      toast({ title: 'Commission updated', description: `Markup for ${editingCommission.service_type.name} updated for this terminal` });
      closeEditCommissionModal();
      loadTerminalCommissions();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to save', description: error.message || 'Please try again' });
    } finally {
      setIsSavingCommission(false);
    }
  };

  const handleRemoveTerminalMarkup = async () => {
    if (!editingCommission || !id) return;
    setIsSavingCommission(true);
    try {
      await commissionService.removeTerminalCommission(id, editingCommission.service_type_id);
      toast({ title: 'Markup removed', description: `Markup for ${editingCommission.service_type.name} removed for this terminal` });
      closeEditCommissionModal();
      loadTerminalCommissions();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to remove markup', description: error.message || 'Please try again' });
    } finally {
      setIsSavingCommission(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!terminal) return;
    try {
      await terminalsService.toggleStatus(terminal.id);
      toast({
        title: 'Success',
        description: `Terminal ${terminal.status === 'active' ? 'deactivated' : 'activated'} successfully`,
      });
      setToggleDialogOpen(false);
      loadTerminalDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update terminal status',
        variant: 'destructive',
      });
    }
  };

  const handleUnassign = async () => {
    if (!terminal) return;
    try {
      await terminalsService.unassignTerminal(terminal.id);
      toast({
        title: 'Success',
        description: `Terminal ${terminal.terminal_id} unassigned successfully`,
      });
      setUnassignDialogOpen(false);
      loadTerminalDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unassign terminal',
        variant: 'destructive',
      });
    }
  };

  const handleExportTransactions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive',
        });
        return;
      }

      const params = new URLSearchParams();
      params.append('token', token);
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (minAmount) params.append('min_amount', minAmount);
      if (maxAmount) params.append('max_amount', maxAmount);
      if (searchQuery) params.append('search', searchQuery);

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const exportUrl = `${apiBaseUrl}/api/partner-hub/terminals/${id}/transactions/export?${params.toString()}`;
      
      window.open(exportUrl, '_blank');

      toast({
        title: 'Success',
        description: 'Export started in new tab',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export transactions',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '₦0.00';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatCommission = (type: CommissionType, value: number, cap: number) => {
    if (type === 'percentage') {
      const capText = cap > 0 ? ` (Cap: ₦${cap.toLocaleString()})` : '';
      return `${value}%${capText}`;
    } else {
      return `₦${value.toLocaleString()}`;
    }
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

  const formatLastSeen = (dateStr: string | undefined) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const transactionColumns = [
    {
      key: 'trx',
      header: 'Transaction Ref',
      render: (item: Transaction) => <span className="font-mono text-xs">{item.trx}</span>,
    },
    {
      key: 'rrn',
      header: 'RRN',
      render: (item: Transaction) => <span className="font-mono text-xs">{item.rrn || '-'}</span>,
    },
    { 
      key: 'service', 
      header: 'Type',
      render: (item: Transaction) => (
        <span className="text-xs uppercase font-medium">{item.service}</span>
      ),
    },
    {
      key: 'from',
      header: 'Card/Source',
      render: (item: Transaction) => (
        <span className="font-mono text-xs">{item.from || item.maskedpan || '-'}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: Transaction) => <span className="font-medium">{formatCurrency(parseFloat(item.amount))}</span>,
    },
    {
      key: 'fee',
      header: 'Fee',
      render: (item: Transaction) => <span className="text-muted-foreground">{formatCurrency(parseFloat(item.fee))}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Transaction) => (
        <div className="flex flex-col gap-0.5">
          <StatusBadge status={item.status === 'success' ? 'online' : 'offline'} size="sm" />
          {item.status_desc && (
            <span className="text-xs text-muted-foreground">{item.status_desc}</span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (item: Transaction) => formatDate(item.created_at),
    },
  ];

  if (loading || !terminal) {
    return <div className="p-6">Loading terminal details...</div>;
  }

  const virtualAccounts = (terminal as any).virtual_accounts || [];

  return (
    <div>
      <PageHeader
        title={terminal.terminal_id}
        description={terminal.agent ? `Assigned to ${terminal.agent.business_name}` : 'Unassigned'}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {terminal.agent_id && (
              <PermissionGate permission="terminals.unassign">
                <Button variant="outline" onClick={() => setUnassignDialogOpen(true)}>
                  Unassign
                </Button>
              </PermissionGate>
            )}
            <PermissionGate permission="terminals.manage">
              <Button
                variant={terminal.status === 'active' ? 'destructive' : 'default'}
                onClick={() => setToggleDialogOpen(true)}
                disabled={terminal.status === 'revoked'}
              >
                <Ban className="mr-2 h-4 w-4" />
                {terminal.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <Tabs defaultValue={defaultTab} className="space-y-6" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          {/* <TabsTrigger value="commissions">Commissions</TabsTrigger> */}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Today's Volume"
              value={formatCurrency(stats?.today.volume)}
              icon={TrendingUp}
              subtitle={`${stats?.today.transactions || 0} transactions`}
            />
            <StatCard
              title="Success Rate"
              value={stats?.today.transactions ? `${Math.round((stats.today.successful / stats.today.transactions) * 100)}%` : '0%'}
              icon={CheckCircle}
              subtitle={`${stats?.today.successful || 0} successful`}
            />
            <StatCard
              title="Failed Today"
              value={stats?.today.failed || 0}
              icon={XCircle}
            />
            <StatCard
              title="Last Seen"
              value={formatLastSeen(terminal.last_seen_at)}
              icon={Clock}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailCard title="Terminal Information">
              <DetailRow label="Terminal ID" value={<span className="font-mono">{terminal.terminal_id}</span>} />
              <DetailRow label="Serial Number" value={<span className="font-mono">{terminal.serial_number}</span>} />
              <DetailRow
                label="Status"
                value={
                  <StatusBadge
                    status={terminal.status === 'active' ? 'online' : terminal.status === 'revoked' ? 'revoked' : 'offline'}
                    size="sm"
                  />
                }
              />
              <DetailRow label="Balance" value={<span className="font-medium">{formatCurrency(parseFloat(terminal.balance || '0'))}</span>} />
              <DetailRow label="Created" value={formatDate(terminal.created_at)} />
              {terminal.assigned_at && (
                <DetailRow label="Assigned On" value={formatDate(terminal.assigned_at)} />
              )}
            </DetailCard>

            <DetailCard title="Merchant Information">
              {terminal.agent ? (
                <>
                  <DetailRow label="Business Name" value={terminal.agent.business_name} />
                  <DetailRow label="Merchant Code" value={terminal.agent.code} />
                  {terminal.agent.contact_name && (
                    <DetailRow label="Contact Name" value={terminal.agent.contact_name} />
                  )}
                  {terminal.agent.contact_phone && (
                    <DetailRow label="Contact Phone" value={terminal.agent.contact_phone} />
                  )}
                  {terminal.agent.contact_email && (
                    <DetailRow label="Contact Email" value={terminal.agent.contact_email} />
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No agent assigned</p>
              )}
            </DetailCard>

            {virtualAccounts.length > 0 && (
              <DetailCard title="Virtual Accounts">
                <div className="space-y-3">
                  {virtualAccounts.map((va: any) => (
                    <div key={va.id} className="p-3 rounded-lg border bg-muted/20">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Bank Name</div>
                          <div className="font-medium">{va.bank_name}</div>

                          <div className="text-xs text-muted-foreground mt-2">Account Number</div>
                          <div className="text-sm font-mono">{va.account_number}</div>

                          <div className="text-xs text-muted-foreground mt-2">Account Name</div>
                          <div className="text-sm">{(va.account_name.toUpperCase() || '').toString()}</div>
                        </div>
                        <div className="text-sm text-muted-foreground ml-4">{va.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </DetailCard>
            )}
          </div>

          <DetailCard title="Monthly Performance">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{stats?.this_month.transactions || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.this_month.volume)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {stats?.this_month.transactions
                    ? `${Math.round((stats.this_month.successful / stats.this_month.transactions) * 100)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </DetailCard>

          {stats?.last_transaction && (
            <DetailCard title="Last Transaction">
              <DetailRow label="Transaction ID" value={<span className="font-mono">{stats.last_transaction.ref}</span>} />
              <DetailRow label="Amount" value={formatCurrency(stats.last_transaction.amount)} />
              <DetailRow
                label="Status"
                value={<StatusBadge status={stats.last_transaction.status === 'success' ? 'online' : 'offline'} size="sm" />}
              />
              <DetailRow label="Date" value={formatDate(stats.last_transaction.created_at)} />
            </DetailCard>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex flex-col gap-4">
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
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end flex-1">
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
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xs text-muted-foreground">Search</label>
                  <Input
                    placeholder="Search by reference or narration..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </div>
              <Button onClick={handleExportTransactions} variant="outline" className="self-end">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {transactionSummary && (
            <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Count</p>
                <p className="text-lg font-semibold">{transactionSummary.total_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-lg font-semibold">{formatCurrency(transactionSummary.total_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-lg font-semibold">{formatCurrency(transactionSummary.total_fees)}</p>
              </div>
            </div>
          )}

          <DataTable
            columns={transactionColumns}
            data={transactions}
            emptyMessage={loadingTransactions ? 'Loading transactions...' : 'No transactions found'}
          />

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            pageSize={pageSize}
          />
        </TabsContent>
        <TabsContent value="commissions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Terminal Commissions</h3>
            <div>
              <Button variant="outline" onClick={loadTerminalCommissions}>Refresh</Button>
            </div>
          </div>

          <div>
            {isCommissionsLoading ? (
              <div>Loading commissions...</div>
            ) : (
              <div className="space-y-4">
                {terminalCommissions.map((item) => (
                  <div key={item.service_type_id} className="flex items-center justify-between p-4 bg-muted rounded">
                    <div>
                      <div className="font-medium">{item.service_type.name}</div>
                      <div className="text-sm text-muted-foreground">Base: {formatCommission(item.xtrapay_base.type, item.xtrapay_base.value, item.xtrapay_base.cap)}</div>
                      {/** Prefer showing terminal markup if present (it overrides partner markup) */}
                      <div className="text-sm text-muted-foreground">
                        { (item as any).terminal_markup ? (
                          <span>Terminal Markup: +{formatCommission((item as any).terminal_markup.type, (item as any).terminal_markup.value, (item as any).terminal_markup.cap)} <span className="text-xs text-muted-foreground">(overrides partner)</span></span>
                        ) : item.partner_markup ? (
                          <span>Partner Markup: +{formatCommission(item.partner_markup.type, item.partner_markup.value, item.partner_markup.cap)}</span>
                        ) : (
                          '-'
                        ) }
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEditCommissionModal(item)}>Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog open={isEditCommissionOpen} onOpenChange={setIsEditCommissionOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Terminal Markup</DialogTitle>
                <DialogDescription>
                  Set a commission markup for this terminal for the selected service.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div>
                  <Label>Type</Label>
                  <Select value={markupType} onValueChange={(v: CommissionType) => setMarkupType(v as CommissionType)}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Value</Label>
                  <Input type="number" value={markupValue} onChange={(e) => setMarkupValue(e.target.value)} />
                </div>

                <div>
                  <Label>Cap (₦)</Label>
                  <Input type="number" value={markupCap} onChange={(e) => setMarkupCap(e.target.value)} />
                </div>
              </div>

              <DialogFooter>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleRemoveTerminalMarkup} disabled={isSavingCommission}>Remove</Button>
                  <Button onClick={handleSaveTerminalMarkup} disabled={isSavingCommission}>Save</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={toggleDialogOpen}
        onOpenChange={setToggleDialogOpen}
        title={terminal.status === 'active' ? 'Deactivate Terminal' : 'Activate Terminal'}
        description={`Are you sure you want to ${terminal.status === 'active' ? 'deactivate' : 'activate'} ${terminal.terminal_id}?`}
        confirmLabel={terminal.status === 'active' ? 'Deactivate' : 'Activate'}
        variant={terminal.status === 'active' ? 'destructive' : 'default'}
        onConfirm={handleToggleStatus}
      />

      <ConfirmDialog
        open={unassignDialogOpen}
        onOpenChange={setUnassignDialogOpen}
        title="Unassign Terminal"
        description={`Are you sure you want to unassign ${terminal.terminal_id} from ${terminal.agent?.business_name}? The terminal balance must be zero to proceed.`}
        confirmLabel="Unassign"
        variant="destructive"
        onConfirm={handleUnassign}
      />
    </div>
  );
}
