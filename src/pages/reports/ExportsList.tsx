import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import reportsService from '@/services/api/reports.service';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Download, RefreshCw } from 'lucide-react';

export default function ExportsList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchJobs = async () => {
    try {
      const resp = await reportsService.listExports();
      const arr = resp.data || resp.data?.data || [];
      setJobs(Array.isArray(arr) ? arr : []);
    } catch (err) {
      toast({ title: 'Failed', description: 'Unable to load exports', variant: 'destructive' });
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const types = Array.from(new Set(jobs.map((j: any) => j.type).filter(Boolean)));
  const filtered = filterType === 'all' ? jobs : jobs.filter((j: any) => j.type === filterType);

  const columns = [
    { key: 'id', header: 'Job ID', render: (r: any) => r.id },
    { key: 'type', header: 'Type', render: (r: any) => (r.type || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) },
    { key: 'file_type', header: 'File', render: (r: any) => (r.file_type || r.params?.format || r.filters?.params?.format || '—').toUpperCase() },
    { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={(String(r.status || 'pending') as any)} /> },
    { key: 'created_at', header: 'Created', render: (r: any) => {
      try { return new Date(r.created_at).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return r.created_at || '—'; }
    } },
    { key: 'filters', header: 'Filters', render: (r: any) => {
      const p = r.filters?.params ?? r.params ?? {};
      const s = p.start_date || p.from || '-';
      const e = p.end_date || p.to || '-';
      return `${s} → ${e}`;
    } },
    { key: 'actions', header: '', render: (r: any) => (
      r.status === 'completed' && r.download_url ? (
        <Button variant="outline" size="sm" onClick={() => window.open(r.download_url, '_blank')}>
          <Download className="mr-2 h-4 w-4" />Download
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={fetchJobs}>
          <RefreshCw className="mr-2 h-4 w-4" />Refresh
        </Button>
      )
    ) },
  ];

  return (
    <div>
      <PageHeader title="Download Center" description="Track background exports and downloads." />
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
          <Select value={filterType} onValueChange={(v) => setFilterType(v || 'all')}>
            <SelectTrigger className="h-8 w-48">
              <SelectValue placeholder="Filter by report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {types.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Button variant="outline" size="sm" onClick={fetchJobs}>
            <RefreshCw className="mr-2 h-4 w-4" />Refresh
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No export jobs found" />
    </div>
  );
}
