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
    {
      key: 'file_type', header: 'File', render: (r: any) => {
        const ft = (r.file_type || r.params?.format || r.filters?.params?.format || '—').toUpperCase();
        const url = r.download_url;
        const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
        const full = url ? (String(url).startsWith('http') ? url : `${apiBase}${url}`) : null;
        return full ? (
          <a href={full} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {ft}
          </a>
        ) : ft;
      }
    },
    { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={(String(r.status || 'pending') as any)} /> },
    {
      key: 'created_at', header: 'Created', render: (r: any) => {
        try { return new Date(r.created_at).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return r.created_at || '—'; }
      }
    },
    {
      key: 'expires_at', header: 'Expires', render: (r: any) => {
        const ex = r.expires_at;
        if (!ex) return '-';
        try {
          const dt = new Date(ex);
          const now = new Date();
          const diff = dt.getTime() - now.getTime();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          let cls = 'text-muted-foreground';
          if (days < 0) cls = 'text-destructive';
          else if (days < 14) cls = 'text-destructive';
          else if (days < 30) cls = 'text-amber-600';
          const dateStr = dt.toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
          return (
            <div className={cls}>
              <div>{dateStr}</div>
              <div className="text-xs text-muted-foreground">{days >= 0 ? `${days} day${days !== 1 ? 's' : ''}` : 'expired'}</div>
            </div>
          );
        } catch {
          return ex;
        }
      }
    },
    {
      key: 'filters', header: 'Filters', render: (r: any) => {
        const p = r.filters?.params ?? r.params ?? {};
        const s = p.start_date || p.from || '-';
        const e = p.end_date || p.to || '-';
        return `${s} → ${e}`;
      }
    },
    {
      key: 'actions', header: '', render: (r: any) => {
        // Download only when download_url exists
        if (r.download_url) {
          return (
            <Button variant="outline" size="sm" onClick={() => {
              const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
              const link = String(r.download_url).startsWith('http') ? r.download_url : `${apiBase}${r.download_url}`;
              window.open(link, '_blank');
            }}>
              <Download className="mr-2 h-4 w-4" />Download
            </Button>
          );
        }

        // Refresh only when job is pending
        if (String(r.status || '').toLowerCase() === 'pending') {
          return (
            <Button variant="ghost" size="sm" onClick={fetchJobs}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
          );
        }

        return null;
      }
    },
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
