import { useState, useEffect } from 'react';
import { 
  Percent, 
  DollarSign, 
  Edit2, 
  Save, 
  X as XIcon,
  Calculator,
  Info,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { 
  commissionService, 
  PartnerCommission, 
  ServiceCategory,
  CommissionType,
  calculateFee,
  formatMoney 
} from '@/services/api/commission.service';

// Category colors
const categoryColors: Record<ServiceCategory, string> = {
  pos: 'bg-blue-100 text-blue-800',
  bills: 'bg-green-100 text-green-800',
  transfers: 'bg-purple-100 text-purple-800',
  collections: 'bg-orange-100 text-orange-800'
};

// Category labels
const categoryLabels: Record<ServiceCategory, string> = {
  pos: 'POS',
  bills: 'Bills',
  transfers: 'Transfers',
  collections: 'Collections'
};

export default function CommissionsPage() {
  const { toast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [commissions, setCommissions] = useState<PartnerCommission[]>([]);
  const [filteredCommissions, setFilteredCommissions] = useState<PartnerCommission[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<PartnerCommission | null>(null);
  const [markupType, setMarkupType] = useState<CommissionType>('percentage');
  const [markupValue, setMarkupValue] = useState<string>('0');
  const [markupCap, setMarkupCap] = useState<string>('0');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCommissions();
  }, []);

  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredCommissions(commissions);
    } else {
      setFilteredCommissions(commissions.filter(c => c.service_type.category === activeCategory));
    }
  }, [activeCategory, commissions]);

  const loadCommissions = async () => {
    setIsLoading(true);
    try {
      const response = await commissionService.getCommissions();
      // API returns { status, data: { commissions: [...], service_categories: {...} } }
      const apiCommissions = response.data.commissions || [];

      // Map API items to `PartnerCommission` shape expected by the UI
      const mapped: PartnerCommission[] = apiCommissions.map((item: any) => {
        const base = item.xtrapay_commission || {};
        const pm = item.partner_markup;

        const baseType: CommissionType = base.type || 'percentage';
        const pmType: CommissionType = pm?.type || 'percentage';

        const baseValue = Number(base.value) || 0;
        const baseCap = Number(base.cap) || 0;

        const pmValue = pm ? Number(pm.value) : 0;
        const pmCap = pm ? Number(pm.cap) : 0;

        const effectiveValue = baseType === 'percentage' && pm ? baseValue + pmValue : (baseType === 'flat' ? baseValue + pmValue : baseValue + pmValue);
        const effectiveCap = baseCap + pmCap;

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
          effective_rate: {
            type: baseType,
            value: effectiveValue,
            cap: effectiveCap,
          },
          is_active: pm?.is_active ?? true,
        } as PartnerCommission;
      });

      setCommissions(mapped);
      setFilteredCommissions(mapped);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load commissions',
        description: error.message || 'Please try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (commission: PartnerCommission) => {
    setEditingCommission(commission);
    if (commission.partner_markup) {
      setMarkupType(commission.partner_markup.type);
      setMarkupValue(commission.partner_markup.value.toString());
      setMarkupCap(commission.partner_markup.cap.toString());
    } else {
      setMarkupType('percentage');
      setMarkupValue('0');
      setMarkupCap('0');
    }
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCommission(null);
  };

  const handleSaveMarkup = async () => {
    if (!editingCommission) return;

    const value = parseFloat(markupValue);
    const cap = parseFloat(markupCap);

    if (isNaN(value) || value < 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid value',
        description: 'Markup value must be 0 or greater'
      });
      return;
    }

    if (markupType === 'percentage' && value > 100) {
      toast({
        variant: 'destructive',
        title: 'Invalid value',
        description: 'Percentage value cannot exceed 100'
      });
      return;
    }

    setIsSaving(true);
    try {
      await commissionService.setCommission({
        service_type_id: editingCommission.service_type_id,
        type: markupType,
        value,
        cap: cap || 0
      });

      toast({
        title: 'Commission updated',
        description: `Markup for ${editingCommission.service_type.name} has been updated`
      });

      closeEditModal();
      loadCommissions();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to save',
        description: error.message || 'Please try again'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMarkup = async () => {
    if (!editingCommission) return;

    setIsSaving(true);
    try {
      await commissionService.removeCommission(editingCommission.service_type_id);

      toast({
        title: 'Markup removed',
        description: `Markup for ${editingCommission.service_type.name} has been reset to base rate`
      });

      closeEditModal();
      loadCommissions();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to remove markup',
        description: error.message || 'Please try again'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate preview fees
  const calculatePreviewFees = (amount: number) => {
    if (!editingCommission) return { base: 0, markup: 0, total: 0 };
    
    const base = calculateFee(
      amount, 
      editingCommission.xtrapay_base.type, 
      editingCommission.xtrapay_base.value, 
      editingCommission.xtrapay_base.cap
    );
    
    const markupVal = parseFloat(markupValue) || 0;
    const capVal = parseFloat(markupCap) || 0;
    const markup = calculateFee(amount, markupType, markupVal, capVal);
    
    return { base, markup, total: base + markup };
  };

  // Format commission display
  const formatCommission = (type: CommissionType, value: number, cap: number) => {
    if (type === 'percentage') {
      const capText = cap > 0 ? ` (Cap: ₦${cap.toLocaleString()})` : '';
      return `${value}%${capText}`;
    } else {
      return `₦${value.toLocaleString()}`;
    }
  };

  // Table columns
  const columns = [
    {
      key: 'service',
      header: 'Service',
      render: (item: PartnerCommission) => (
        <div>
          <p className="font-medium">{item.service_type.name}</p>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${categoryColors[item.service_type.category]}`}>
            {categoryLabels[item.service_type.category]}
          </span>
        </div>
      )
    },
    {
      key: 'xtrapay_base',
      header: 'Xtrapay Base',
      render: (item: PartnerCommission) => (
        <div className="text-muted-foreground">
          {formatCommission(item.xtrapay_base.type, item.xtrapay_base.value, item.xtrapay_base.cap)}
        </div>
      )
    },
    {
      key: 'your_markup',
      header: 'Your Markup',
      render: (item: PartnerCommission) => (
        item.partner_markup ? (
          <div className="text-primary font-medium">
            +{formatCommission(item.partner_markup.type, item.partner_markup.value, item.partner_markup.cap)}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      )
    },
    {
      key: 'effective_rate',
      header: 'Total (Agent Sees)',
      render: (item: PartnerCommission) => (
        <div className="font-semibold text-success">
          {formatCommission(item.effective_rate.type, item.effective_rate.value, item.effective_rate.cap)}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: PartnerCommission) => (
        <StatusBadge 
          status={item.is_active ? 'success' : 'disabled'} 
          label={item.is_active ? 'Active' : 'Inactive'} 
          size="sm" 
        />
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: PartnerCommission) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit Markup</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
  ];

  // Loading skeleton
  if (isLoading) {
    return (
      <div>
        <PageHeader title="Commissions" description="Configure your markup on transaction fees" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Commissions" 
        description="Configure your markup on top of Xtrapay base rates. Agents will see the combined rate."
        actions={
          <Button variant="outline" onClick={loadCommissions}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Info Alert */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>How Commission Markup Works</AlertTitle>
        <AlertDescription>
          Xtrapay sets the base commission rate for each service. You can add your own markup on top of the base rate.
          The combined rate is what your agents will see and be charged. You cannot set a rate below the Xtrapay base.
        </AlertDescription>
      </Alert>

      {/* Category Filter */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Services</TabsTrigger>
          <TabsTrigger value="pos">POS</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Commission Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={filteredCommissions} 
            emptyMessage="No commissions configured" 
          />
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Commission Markup</DialogTitle>
            <DialogDescription>
              {editingCommission?.service_type.name}
            </DialogDescription>
          </DialogHeader>

          {editingCommission && (
            <div className="space-y-6">
              {/* Base Rate Display */}
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-muted-foreground">Xtrapay Base Rate (Read-only)</Label>
                <p className="text-lg font-semibold mt-1">
                  {formatCommission(
                    editingCommission.xtrapay_base.type, 
                    editingCommission.xtrapay_base.value, 
                    editingCommission.xtrapay_base.cap
                  )}
                </p>
              </div>

              {/* Markup Input */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Markup Type</Label>
                    <Select value={markupType} onValueChange={(v) => setMarkupType(v as CommissionType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="flat">Flat (₦)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Markup Value</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={markupValue} 
                        onChange={(e) => setMarkupValue(e.target.value)}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {markupType === 'percentage' ? '%' : '₦'}
                      </span>
                    </div>
                  </div>
                </div>

                {markupType === 'percentage' && (
                  <div>
                    <Label>Cap (Maximum Fee)</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        min="0"
                        step="1"
                        value={markupCap} 
                        onChange={(e) => setMarkupCap(e.target.value)}
                        placeholder="0 = No cap"
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Set to 0 for no cap on the markup
                    </p>
                  </div>
                )}
              </div>

              {/* Fee Preview Calculator */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Fee Preview</Label>
                </div>
                <div className="space-y-2">
                  {[1000, 10000, 100000].map(amount => {
                    const { base, markup, total } = calculatePreviewFees(amount);
                    return (
                      <div key={amount} className="grid grid-cols-4 gap-2 text-sm">
                        <span className="text-muted-foreground">{formatMoney(amount)}</span>
                        <span className="text-muted-foreground">Base: {formatMoney(base)}</span>
                        <span className="text-primary">+{formatMoney(markup)}</span>
                        <span className="font-semibold text-success">= {formatMoney(total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Effective Rate Display */}
              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <Label className="text-success">Total Rate (What Agents See)</Label>
                <p className="text-xl font-bold text-success mt-1">
                  {formatCommission(
                    editingCommission.xtrapay_base.type,
                    editingCommission.xtrapay_base.value + (parseFloat(markupValue) || 0),
                    editingCommission.xtrapay_base.cap + (parseFloat(markupCap) || 0)
                  )}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            {editingCommission?.partner_markup && (
              <Button 
                variant="destructive" 
                onClick={handleRemoveMarkup}
                disabled={isSaving}
                className="mr-auto"
              >
                Remove Markup
              </Button>
            )}
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveMarkup} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Markup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
