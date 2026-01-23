import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import reportsService from '@/services/api/reports.service';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function ExportsList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchJobs = async () => {
    try {
      const resp = await reportsService.listExports();
      setJobs(resp.data || resp.data?.data || []);
    } catch (err) {
      toast({ title: 'Failed', description: 'Unable to load exports', variant: 'destructive' });
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const columns = [
    { key: 'id', header: 'Job ID', render: (r: any) => r.id },
    { key: 'report', header: 'Report', render: (r: any) => r.report },
    { key: 'status', header: 'Status', render: (r: any) => r.status },
    { key: 'created_at', header: 'Created', render: (r: any) => r.created_at },
    { key: 'actions', header: '', render: (r: any) => (
      r.status === 'completed' ? <Button variant="outline" size="sm" onClick={() => window.open(r.download_url, '_blank')}>Download</Button> : <Button variant="ghost" size="sm" onClick={fetchJobs}>Refresh</Button>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Download Center" description="Track background exports and downloads." />
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
      <DataTable columns={columns} data={jobs} emptyMessage="No export jobs found" />
    </div>
  );
}
