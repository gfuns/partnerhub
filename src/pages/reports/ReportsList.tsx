import { useState } from 'react';
import { Download, Calendar, FileText, TrendingUp, Wallet, Coins } from 'lucide-react';
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

const reportTypes = [
  {
    id: 'daily',
    title: 'Daily Report',
    description: 'Transaction summary for the current or selected day',
    icon: Calendar,
    lastGenerated: '2024-01-15 23:59',
  },
  {
    id: 'monthly',
    title: 'Monthly Report',
    description: 'Comprehensive monthly transaction and performance report',
    icon: FileText,
    lastGenerated: '2024-01-01 00:00',
  },
  {
    id: 'settlement',
    title: 'Settlement Summary',
    description: 'Overview of all settlements and pending amounts',
    icon: Wallet,
    lastGenerated: '2024-01-15 18:00',
  },
  {
    id: 'commission',
    title: 'Commission Summary',
    description: 'Breakdown of commissions earned across all agents',
    icon: Coins,
    lastGenerated: '2024-01-15 12:00',
  },
  {
    id: 'performance',
    title: 'Performance Report',
    description: 'Terminal and agent performance analytics',
    icon: TrendingUp,
    lastGenerated: '2024-01-14 23:59',
  },
];

export default function ReportsList() {
  const { toast } = useToast();
  const [period, setPeriod] = useState('today');

  const handleDownload = (reportId: string) => {
    const report = reportTypes.find(r => r.id === reportId);
    toast({
      title: 'Generating report',
      description: `${report?.title} is being generated and will download shortly.`,
    });
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and download business reports."
      />

      <div className="mb-6">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last7days">Last 7 Days</SelectItem>
            <SelectItem value="last30days">Last 30 Days</SelectItem>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <Card key={report.id} className="transition-shadow hover:shadow-card-hover">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-secondary p-2">
                  <report.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Last generated: {report.lastGenerated}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(report.id)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
