import { useState } from 'react';
import { Download, Calendar, FileText, TrendingUp, Wallet, Coins, Server, Users, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const reportTypes = [
  {
    id: 'transactions_summary',
    title: 'Transactions Summary',
    description: 'High-level transaction metrics and trends',
    icon: CreditCard,
    route: '/reports/transactions/summary',
    lastGenerated: '2024-01-19 23:59',
  },
  {
    id: 'transactions_detail',
    title: 'Transactions Detail',
    description: 'Detailed transaction rows for auditing and reconciliation',
    icon: FileText,
    route: '/reports/transactions/detail',
    lastGenerated: '2024-01-19 23:59',
  },
  {
    id: 'settlements',
    title: 'Settlements',
    description: 'Overview of settlements requested and completed',
    icon: Wallet,
    route: '/reports/settlements',
    lastGenerated: '2024-01-19 18:00',
  },
  {
    id: 'commissions',
    title: 'Commissions',
    description: 'Commission breakdown and overrides',
    icon: Coins,
    route: '/reports/commissions',
    lastGenerated: '2024-01-18 12:00',
  },
  {
    id: 'terminals',
    title: 'Terminal Activity',
    description: 'Per-terminal performance and assignment history',
    icon: Server,
    route: '/reports/terminals',
    lastGenerated: '2024-01-17 23:59',
  },
  {
    id: 'agents',
    title: 'Merchants Performance',
    description: 'Merchant-level KPIs and earnings',
    icon: Users,
    route: '/reports/agents',
    lastGenerated: '2024-01-16 23:59',
  },
  {
    id: 'wallet',
    title: 'Wallet & Balance',
    description: 'Partner wallet activities and current balances',
    icon: Wallet,
    route: '/reports/wallet',
    lastGenerated: '2024-01-15 09:00',
  },
  {
    id: 'exports',
    title: 'Download Center',
    description: 'Track background exports and download prepared files',
    icon: Download,
    route: '/reports/exports',
    lastGenerated: '2024-01-19 12:00',
  },
];

export default function ReportsList() {
  const { toast } = useToast();
  const [selected, setSelected] = useState(reportTypes[0].id);
  const navigate = useNavigate();

  const active = reportTypes.find((r) => r.id === selected) || reportTypes[0];

  return (
    <div>
      <PageHeader title="Reports" description="Select a report to view its details and run it with filters." />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="col-span-1 space-y-2">
          {reportTypes.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              className={`w-full text-left p-4 rounded border ${selected === r.id ? 'border-primary bg-primary/5' : 'border-border bg-background'} hover:shadow-sm`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded bg-muted p-2">
                  <r.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="col-span-1 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{active.title}</CardTitle>
              <CardDescription>{active.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">Last generated: {active.lastGenerated}</div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => navigate(active.route)}>Open Report</Button>
                  <Button variant="outline" onClick={() => { toast({ title: 'Export queued', description: `${active.title} export queued.` }); navigate('/reports/exports'); }}>
                    Queue Export
                  </Button>
                </div>
              </div>

              <div className="text-sm">
                <p>{active.description}</p>
                <p className="mt-3 text-xs text-muted-foreground">Click "Open Report" to configure filters, run the report and download results. Recent exports are available on each report page for quick redownload.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
