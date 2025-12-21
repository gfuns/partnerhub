import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Receipt, CreditCard, Calendar, CheckCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Mock settlement data
const settlementData = {
  id: 'STL-001234',
  period: 'Jan 8-14, 2024',
  periodStart: '2024-01-08',
  periodEnd: '2024-01-14',
  amount: '₦125,000',
  grossAmount: '₦128,500',
  fees: '₦3,500',
  status: 'success',
  paidDate: '2024-01-16 09:00',
  transactionCount: 156,
  terminals: [
    { id: 'TRM-001', transactions: 98, amount: '₦78,000' },
    { id: 'TRM-002', transactions: 58, amount: '₦47,000' },
  ],
  bankDetails: {
    bank: 'First Bank',
    accountNumber: '****5678',
    accountName: 'Brown Enterprises',
  },
};

export default function SettlementDetails() {
  const { id } = useParams();

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settlements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settlements
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Settlement ${id || settlementData.id}`}
        description="View settlement details and breakdown."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settlement Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center justify-between">
              Settlement Summary
              <StatusBadge 
                status={settlementData.status as 'success' | 'pending'} 
                label={settlementData.status === 'success' ? 'Paid' : 'Pending'}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Settlement Period
                </p>
                <p className="font-medium">{settlementData.period}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Total Transactions
                </p>
                <p className="font-medium">{settlementData.transactionCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {settlementData.status === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  {settlementData.status === 'success' ? 'Paid On' : 'Expected Date'}
                </p>
                <p className="font-medium">{settlementData.paidDate}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Gross Amount</p>
                <p className="text-xl font-semibold">{settlementData.grossAmount}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Fees</p>
                <p className="text-xl font-semibold text-destructive">-{settlementData.fees}</p>
              </div>
              <div className="p-4 rounded-lg bg-success/10">
                <p className="text-sm text-muted-foreground">Net Amount</p>
                <p className="text-xl font-semibold text-success">{settlementData.amount}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-3">Bank Account</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Bank</p>
                  <p className="font-medium">{settlementData.bankDetails.bank}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="font-medium">{settlementData.bankDetails.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="font-medium">{settlementData.bankDetails.accountName}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terminal Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Terminal Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settlementData.terminals.map((terminal) => (
                <div key={terminal.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-medium">{terminal.id}</span>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Transactions</p>
                      <p className="font-medium">{terminal.transactions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-medium">{terminal.amount}</p>
                    </div>
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
