import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Receipt, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const commissionData = {
  id: 'COM-001234',
  period: 'Jan 8-14, 2024',
  transactions: 245,
  volume: '₦1,250,000',
  commission: '₦12,500',
  rate: '1.0%',
  status: 'success',
  paidDate: '2024-01-16',
  terminals: [
    { id: 'TRM-001', transactions: 156, volume: '₦780,000', commission: '₦7,800' },
    { id: 'TRM-002', transactions: 89, volume: '₦470,000', commission: '₦4,700' },
  ],
};

export default function CommissionDetails() {
  const { id } = useParams();
  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/commissions"><ArrowLeft className="mr-2 h-4 w-4" />Back to Commissions</Link>
        </Button>
      </div>
      <PageHeader title={`Commission ${id || commissionData.id}`} description="View commission breakdown by terminal." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center justify-between">
              Commission Summary
              <StatusBadge status={commissionData.status as 'success' | 'pending'} label={commissionData.status === 'success' ? 'Paid' : 'Pending'} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div><p className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />Period</p><p className="font-medium">{commissionData.period}</p></div>
              <div><p className="text-sm text-muted-foreground flex items-center gap-2"><Receipt className="h-4 w-4" />Transactions</p><p className="font-medium">{commissionData.transactions}</p></div>
              <div><p className="text-sm text-muted-foreground">Commission Rate</p><p className="font-medium">{commissionData.rate}</p></div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Total Volume</p><p className="text-xl font-semibold">{commissionData.volume}</p></div>
              <div className="p-4 rounded-lg bg-success/10"><p className="text-sm text-muted-foreground">Commission Earned</p><p className="text-xl font-semibold text-success">{commissionData.commission}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base font-medium">Terminal Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commissionData.terminals.map((terminal) => (
                <div key={terminal.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2"><span className="font-mono font-medium">{terminal.id}</span><CreditCard className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-muted-foreground">Txns</p><p className="font-medium">{terminal.transactions}</p></div>
                    <div><p className="text-muted-foreground">Volume</p><p className="font-medium">{terminal.volume}</p></div>
                    <div><p className="text-muted-foreground">Comm.</p><p className="font-medium text-success">{terminal.commission}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
