import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, CreditCard, Calendar, Hash } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import transactionsService from '@/services/api/transactions.service';

// Transaction details fetched from API

export default function AgentTransactionDetails() {
  const { id } = useParams();
  const { data: txResp, isLoading: loadingTx } = useQuery({
    queryKey: ['agent_transaction', id],
    queryFn: () => transactionsService.getTransaction(id!),
    enabled: !!id,
  });

  const transaction = (txResp?.data as any)?.transaction ?? txResp?.data;

  const gatewayResponse = (() => {
    try {
      return transaction?.gateway_response ? JSON.parse(transaction.gateway_response) : null;
    } catch (e) {
      return null;
    }
  })();

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
        title={`Transaction ${transaction?.trx ?? transaction?.ref ?? id}`}
        description={transaction?.narration ?? 'View transaction details and status.'}
      />

      <div>
        {/* Transaction Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center justify-between">
              Transaction Summary
              <StatusBadge status={(transaction?.status) === 'success' ? 'success' : ((transaction?.status || '').toString().includes('pending') ? 'pending' : 'error')} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Transaction ID
                </p>
                <p className="font-mono font-medium">{transaction?.trx ?? transaction?.ref ?? transaction?.id ?? '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Reference
                </p>
                <p className="font-mono font-medium">{transaction?.ref ?? transaction?.trx ?? '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">RRN</p>
                <p className="font-mono font-medium">{transaction?.rrn ?? '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Terminal
                </p>
                <p className="font-mono font-medium">{transaction?.terminal?.id ?? transaction?.terminal_name ?? '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date & Time
                </p>
                <p className="font-medium">{transaction?.created_at ? new Date(transaction.created_at).toLocaleString() : '—'}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Type</p>
              <p className="font-medium">{transaction?.type_name ?? transaction?.type ?? '—'}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-xl font-semibold">{transaction?.amount_formatted ?? (transaction?.amount != null ? transaction.amount.toLocaleString() : '—')}</p>
              </div>
              {/* <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Fee</p>
                <p className="text-xl font-semibold">{transaction?.fee_formatted ?? (transaction?.fee != null ? transaction.fee.toLocaleString() : '—')}</p>
              </div> */}
              {/* <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">
                  {transaction?.amount != null && transaction?.fee != null
                    ? ((transaction.amount + transaction.fee).toLocaleString())
                    : transaction?.amount_formatted ?? '—'}
                </p>
              </div> */}
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-3">Recipient / Details</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Narration</p>
                  <p className="font-medium">{transaction?.narration ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status Description</p>
                  <p className="font-medium">{transaction?.status_desc ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="font-medium">{transaction?.source?.toUpperCase() ?? '—'}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Card (masked)</p>
                  <p className="font-medium">{transaction?.maskedpan ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">STAN</p>
                  <p className="font-medium">{transaction?.stan ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Agent</p>
                  <p className="font-medium">{transaction?.agent?.name ?? transaction?.agent?.code ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Terminal Serial</p>
                  <p className="font-medium">{transaction?.terminal?.serial ?? '—'}</p>
                </div>
              </div>

              {/* {gatewayResponse && (
                <div className="mt-4">
                  <Separator />
                  <p className="text-sm text-muted-foreground mt-4 mb-2">Gateway Response</p>
                  <pre className="rounded-md bg-muted p-3 overflow-auto text-xs">
                    {JSON.stringify(gatewayResponse, null, 2)}
                  </pre>
                </div>
              )} */}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  {(transaction?.status === 'success' || (transaction?.status_code || '').toString().includes('success')) ? (
                    <CheckCircle className="h-6 w-6 text-success" />
                  ) : (
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="pb-6">
                  <p className="font-medium">{transaction?.status ?? 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{transaction?.created_at ? new Date(transaction.created_at).toLocaleString() : '—'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
