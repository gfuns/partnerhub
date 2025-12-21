import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, CreditCard, User } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DetailCard, DetailRow } from '@/components/DetailCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const mockTransaction = {
  id: 'TXN-001234',
  terminalId: 'TRM-001',
  agent: 'ABC Enterprises',
  amount: '₦25,000',
  type: 'Transfer',
  status: 'success',
  createdAt: '2024-01-15 10:32:15',
  processedAt: '2024-01-15 10:32:18',
  completedAt: '2024-01-15 10:32:20',
};

export default function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const timeline = [
    { label: 'Created', time: mockTransaction.createdAt, icon: Clock, status: 'completed' },
    { label: 'Processed', time: mockTransaction.processedAt, icon: AlertCircle, status: 'completed' },
    { label: 'Completed', time: mockTransaction.completedAt, icon: CheckCircle, status: 'completed' },
  ];

  return (
    <div>
      <PageHeader
        title={mockTransaction.id}
        description="Transaction details"
        actions={
          <Button variant="ghost" onClick={() => navigate('/transactions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transactions
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Transaction Summary</span>
                <StatusBadge status={mockTransaction.status as 'success'} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-semibold">{mockTransaction.amount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="text-lg font-medium">{mockTransaction.type}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailCard title="Terminal Info">
              <DetailRow label="Terminal ID" value={<span className="font-mono">{mockTransaction.terminalId}</span>} />
              <DetailRow label="Agent" value={mockTransaction.agent} />
            </DetailCard>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-success" />
                    </div>
                    {index < timeline.length - 1 && <div className="w-px h-full bg-border flex-1 my-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
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
