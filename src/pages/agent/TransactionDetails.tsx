import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, CreditCard, Calendar, Hash } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Mock transaction data
const transactionData = {
  id: 'TXN-001234',
  reference: 'REF-ABC123XYZ',
  terminalId: 'TRM-001',
  amount: '₦25,000',
  fee: '₦50',
  total: '₦25,050',
  status: 'success',
  type: 'Transfer',
  date: '2024-01-15 14:32:00',
  recipient: {
    bank: 'First Bank',
    accountNumber: '****5678',
    accountName: 'John Doe',
  },
  timeline: [
    { status: 'Initiated', time: '2024-01-15 14:32:00', completed: true },
    { status: 'Processing', time: '2024-01-15 14:32:05', completed: true },
    { status: 'Completed', time: '2024-01-15 14:32:08', completed: true },
  ],
};

export default function AgentTransactionDetails() {
  const { id } = useParams();

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/agent/transactions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transactions
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Transaction ${id || transactionData.id}`}
        description="View transaction details and status."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transaction Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center justify-between">
              Transaction Summary
              <StatusBadge status={transactionData.status as 'success' | 'error' | 'pending'} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Transaction ID
                </p>
                <p className="font-mono font-medium">{transactionData.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Reference
                </p>
                <p className="font-mono font-medium">{transactionData.reference}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Terminal
                </p>
                <p className="font-mono font-medium">{transactionData.terminalId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date & Time
                </p>
                <p className="font-medium">{transactionData.date}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Type</p>
              <p className="font-medium">{transactionData.type}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-xl font-semibold">{transactionData.amount}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Fee</p>
                <p className="text-xl font-semibold">{transactionData.fee}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">{transactionData.total}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-3">Recipient Details</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Bank</p>
                  <p className="font-medium">{transactionData.recipient.bank}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="font-medium">{transactionData.recipient.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="font-medium">{transactionData.recipient.accountName}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {transactionData.timeline.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {event.completed ? (
                      <CheckCircle className="h-6 w-6 text-success" />
                    ) : (
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    )}
                    {index < transactionData.timeline.length - 1 && (
                      <div className="w-px h-full bg-border mt-2" />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className="font-medium">{event.status}</p>
                    <p className="text-sm text-muted-foreground">{event.time}</p>
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
