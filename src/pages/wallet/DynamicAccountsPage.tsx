import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Eye, Ban, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { DataTable } from '@/components/DataTable';
import { TablePagination } from '@/components/TablePagination';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  dynamicAccountsService,
  type DynamicAccount,
  type DynamicAccountStatus,
} from '@/services/api/dynamic-accounts.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

const statusOptions: Array<{ label: string; value: DynamicAccountStatus }> = [
  { label: 'Pending', value: 'pending' },
  { label: 'Credited', value: 'credited' },
  { label: 'Expired', value: 'expired' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Returned', value: 'returned' },
];

const statusStyles: Record<DynamicAccountStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  credited: 'bg-success/15 text-success',
  expired: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/15 text-destructive',
  returned: 'bg-blue-500/15 text-blue-700',
};

const toIso = (localDateTime?: string) => {
  if (!localDateTime) return undefined;
  const d = new Date(localDateTime);
  return d.toISOString();
};

const safeJson = (value: string): Record<string, any> | undefined => {
  if (!value.trim()) return undefined;
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Metadata must be a JSON object.');
  }
  return parsed;
};

export default function DynamicAccountsPage() {
  const { toast } = useToast();
  const { partner } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rows, setRows] = useState<DynamicAccount[]>([]);
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 1, total: 0, perPage: 10 });
  const [statusFilter, setStatusFilter] = useState<'all' | DynamicAccountStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [reference, setReference] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [mustMatchAmount, setMustMatchAmount] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [metaJson, setMetaJson] = useState('');

  const [selectedAccount, setSelectedAccount] = useState<DynamicAccount | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [pendingCancelId, setPendingCancelId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadDynamicAccounts = async (page = 1, showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    if (!showSpinner) setIsLoading(true);

    try {
      const params: Record<string, any> = {
        page,
        per_page: meta.perPage,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (partner?.id) params.partner_id = partner.id;

      const res = await dynamicAccountsService.getDynamicAccounts(params);
      const payload = res.data;
      const items = Array.isArray(payload?.data) ? payload.data : [];
      const lastPage = payload?.last_page || Math.max(1, Math.ceil((payload?.total || 0) / (payload?.per_page || 10)));

      setRows(items);
      setMeta({
        currentPage: payload?.current_page || 1,
        totalPages: lastPage,
        total: payload?.total || 0,
        perPage: payload?.per_page || 10,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load dynamic accounts',
        description: error?.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDynamicAccounts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (!autoRefresh) return;

    const hasPending = rows.some((row) => row.status === 'pending');
    if (!hasPending) return;

    const timer = setInterval(() => {
      loadDynamicAccounts(meta.currentPage, true);
    }, 30000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, rows, meta.currentPage]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((item) => {
      return (
        item.reference?.toLowerCase().includes(term) ||
        item.account_number?.toLowerCase().includes(term)
      );
    });
  }, [rows, searchTerm]);

  const openDetails = async (id: number) => {
    try {
      const res = await dynamicAccountsService.getDynamicAccount(id);
      setSelectedAccount(res.data);
      setIsDetailOpen(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load account details',
        description: error?.message || 'Please try again.',
      });
    }
  };

  const handleCreate = async () => {
    try {
      setIsCreating(true);

      const payload: Record<string, any> = {
        must_match_amount: mustMatchAmount,
      };

      if (partner?.id) payload.partner_id = partner.id;
      if (reference.trim()) payload.reference = reference.trim();
      if (expectedAmount.trim()) payload.expected_amount = Number(expectedAmount);
      payload.meta = safeJson(metaJson);
      payload.expires_at = toIso(expiresAt);

      await dynamicAccountsService.createDynamicAccount(payload);

      toast({
        title: 'Dynamic account created',
        description: 'A new virtual account has been created successfully.',
      });

      setReference('');
      setExpectedAmount('');
      setMustMatchAmount(false);
      setExpiresAt('');
      setMetaJson('');
      setIsCreateOpen(false);
      loadDynamicAccounts(1);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create dynamic account',
        description: error?.message || 'Please check your input and try again.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = async () => {
    if (!pendingCancelId) return;

    try {
      setIsCancelling(true);
      await dynamicAccountsService.cancelDynamicAccount(pendingCancelId);
      toast({
        title: 'Account cancelled',
        description: 'The dynamic account was cancelled successfully.',
      });
      setPendingCancelId(null);
      loadDynamicAccounts(meta.currentPage);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Cancel failed',
        description: error?.message || 'Please try again.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const columns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (item: DynamicAccount) => (
        <div>
          <p className="font-medium">{item.reference}</p>
          <p className="text-xs text-muted-foreground">{item.provider || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'account_number',
      header: 'Account',
      render: (item: DynamicAccount) => (
        <div>
          <p className="font-mono text-sm">{item.account_number}</p>
          <p className="text-xs text-muted-foreground">{item.account_name || item.payload?.accountName || '-'}</p>
        </div>
      ),
    },
    {
      key: 'expected_amount',
      header: 'Expected Amount',
      render: (item: DynamicAccount) => (
        <span>
          {item.expected_amount ? `NGN ${Number(item.expected_amount).toLocaleString()}` : 'Open amount'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: DynamicAccount) => (
        <Badge className={statusStyles[item.status]}>{item.status}</Badge>
      ),
    },
    {
      key: 'expires_at',
      header: 'Expires',
      render: (item: DynamicAccount) => (
        <span className="text-sm text-muted-foreground">
          {item.expires_at ? new Date(item.expires_at).toLocaleString() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: DynamicAccount) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => openDetails(item.id)}>
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>
          <PermissionGate permission="virtual_accounts.manage">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setPendingCancelId(item.id)}
              disabled={item.status !== 'pending'}
            >
              <Ban className="mr-1 h-3.5 w-3.5" />
              Cancel
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dynamic Virtual Accounts"
        description="Create and manage dynamic virtual accounts for payment collections."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => loadDynamicAccounts(meta.currentPage, true)} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <PermissionGate permission="virtual_accounts.manage">
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Dynamic Account
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Filter by status, search by reference/account number, and manage pending requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | DynamicAccountStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem value={s.value} key={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Search</Label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by reference or account number"
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} id="auto-refresh-pending" />
              <Label htmlFor="auto-refresh-pending" className="text-sm">Auto refresh pending (30s)</Label>
            </div>
          </div>

          <DataTable columns={columns} data={filteredRows} isLoading={isLoading} emptyMessage="No dynamic accounts found" />

          {meta.totalPages > 1 && (
            <TablePagination
              currentPage={meta.currentPage}
              totalPages={meta.totalPages}
              pageSize={meta.perPage}
              totalItems={meta.total}
              onPageChange={(page) => loadDynamicAccounts(page)}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Dynamic Account</DialogTitle>
            <DialogDescription>Provide optional constraints and metadata for this virtual account.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ref">Reference (optional)</Label>
              <Input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="INV-2026-001" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected-amount">Expected amount (optional)</Label>
              <Input
                id="expected-amount"
                type="number"
                min="0"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(e.target.value)}
                placeholder="10000"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={mustMatchAmount} onCheckedChange={setMustMatchAmount} id="must-match" />
              <Label htmlFor="must-match">Must match expected amount</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires-at">Expiry (optional)</Label>
              <Input id="expires-at" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta">Metadata JSON (optional)</Label>
              <Textarea
                id="meta"
                rows={4}
                value={metaJson}
                onChange={(e) => setMetaJson(e.target.value)}
                placeholder='{"customer_name": "John Doe", "order_id": "ORD-123"}'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dynamic Account Details</DialogTitle>
            <DialogDescription>Reference and collection details.</DialogDescription>
          </DialogHeader>

          {selectedAccount && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium">{selectedAccount.reference}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={statusStyles[selectedAccount.status]}>{selectedAccount.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-mono">{selectedAccount.account_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Account Name</span>
                <span>{selectedAccount.account_name || selectedAccount.payload?.accountName || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expected Amount</span>
                <span>{selectedAccount.expected_amount ? `NGN ${Number(selectedAccount.expected_amount).toLocaleString()}` : 'Open amount'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Must Match Amount</span>
                <span>{selectedAccount.must_match_amount ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expires At</span>
                <span>{selectedAccount.expires_at ? new Date(selectedAccount.expires_at).toLocaleString() : '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Metadata</span>
                <pre className="mt-1 overflow-x-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(selectedAccount.meta || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingCancelId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingCancelId(null);
        }}
        title="Cancel dynamic account"
        description="This action will cancel the account and it can no longer receive payments."
        confirmLabel={isCancelling ? 'Cancelling...' : 'Cancel account'}
        variant="destructive"
        onConfirm={handleCancel}
      />
    </div>
  );
}
