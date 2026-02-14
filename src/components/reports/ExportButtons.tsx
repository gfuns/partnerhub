import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import reportsService from '@/services/api/reports.service';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type Props = {
  reportKey: string;
  params?: any;
};

export default function ExportButtons({ reportKey, params = {} }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();
  // sanitize params to remove undefined/null values before sending to server
  const sanitize = (p: Record<string, any>) => Object.fromEntries(
    Object.entries(p || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );

  const handleQuickCsv = async () => {
    try {
      // Small immediate export - server returns file stream
      const exportParams = sanitize({ ...params, export: 'csv' });
      const resp = await reportsService.getTransactionsDetail(exportParams);
      // If server returns file URL or sets content-disposition, this is placeholder
      toast({ title: 'Export ready', description: 'CSV prepared. Download started.' });
    } catch (err) {
      toast({ title: 'Export failed', description: 'Failed to generate CSV' , variant: 'destructive'});
    }
  };

  const handleBackgroundExport = async (format: string) => {
    try {
      // For background exports call the same report endpoint with an `export: true` flag
      const payload = sanitize({ ...params, format, export: true });

      // map known report keys to their fetching methods on reportsService
      const reportCallMap: Record<string, (p: any) => Promise<any>> = {
        transactions_summary: (p) => reportsService.getTransactionsSummary(p),
        transactions_detail: (p) => reportsService.getTransactionsDetail(p),
        settlements: (p) => reportsService.getSettlements(p),
        wallet: (p) => reportsService.getWalletReport(p),
        terminals: (p) => reportsService.getTerminalsReport(p),
        agents: (p) => reportsService.getAgentsReport(p),
        commissions: (p) => reportsService.getCommissionsReport(p),
        'virtual_accounts_usage': (p) => reportsService.getVirtualAccountsUsage(p),
        reconciliation: (p) => reportsService.getReconciliation(p),
        audit_logs: (p) => reportsService.getAuditLogs(p),
      };

      let resp;
      const caller = reportCallMap[reportKey];
      if (caller) {
        resp = await caller(payload);
      } else {
        // fallback to legacy startExport which queues server-side export
        resp = await reportsService.startExport(reportKey, payload);
      }

      // server may return a job id or directly a file link; show queued message and navigate to exports
      toast({ title: 'Export queued', description: 'You can track progress in Download Center.' });
      navigate('/reports/exports');
    } catch (err) {
      toast({ title: 'Failed to queue export', description: 'Please try again', variant: 'destructive' });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* <Button variant="outline" size="sm" onClick={handleQuickCsv}>
        <Download className="mr-2 h-4 w-4" />
        CSV
      </Button> */}
      <Button variant="ghost" size="sm" onClick={() => handleBackgroundExport('xlsx')}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        XLSX (Background)
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleBackgroundExport('pdf')}>
        <FileText className="mr-2 h-4 w-4" />
        PDF (Background)
      </Button>
    </div>
  );
}
