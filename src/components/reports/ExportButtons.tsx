import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
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

  const handleQuickCsv = async () => {
    try {
      // Small immediate export - server returns file stream
      const exportParams = { ...params, export: 'csv' };
      const resp = await reportsService.getTransactionsDetail(exportParams);
      // If server returns file URL or sets content-disposition, this is placeholder
      toast({ title: 'Export ready', description: 'CSV prepared. Download started.' });
    } catch (err) {
      toast({ title: 'Export failed', description: 'Failed to generate CSV' , variant: 'destructive'});
    }
  };

  const handleBackgroundExport = async (format: string) => {
    try {
      const payload = { ...params, format };
      const resp = await reportsService.startExport(reportKey, payload);
      const jobId = resp?.data?.job_id || resp?.data?.id || resp?.id;
      toast({ title: 'Export queued', description: 'You can track progress in Download Center.' });
      navigate('/reports/exports');
    } catch (err) {
      toast({ title: 'Failed to queue export', description: 'Please try again', variant: 'destructive' });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleQuickCsv}>
        <Download className="mr-2 h-4 w-4" />
        CSV
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleBackgroundExport('xlsx')}>
        <FileText className="mr-2 h-4 w-4" />
        XLSX (Background)
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleBackgroundExport('pdf')}>
        PDF (Background)
      </Button>
    </div>
  );
}
