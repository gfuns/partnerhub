import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import FiltersPanel from '@/components/reports/FiltersPanel';
import reportsService from '@/services/api/reports.service';
import ExportButtons from '@/components/reports/ExportButtons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function TransactionsDetail() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    const params: any = { per_page: 25 };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    try {
      const resp = await reportsService.getTransactionsDetail(params);
      // API: { success, data: { rows: [], meta, ... } }
      const d = resp?.data ?? {};
      setRows(Array.isArray(d.rows) ? d.rows : []);
    } catch (err) {
      console.warn('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    fetchReport();
  }, []);

  // recent exports for this report
  const [recentExports, setRecentExports] = useState<any[]>([]);
  useEffect(() => {
    const loadExports = async () => {
      try {
        const resp = await reportsService.listExports();
        const jobs = resp.data || resp.data?.data || [];
        setRecentExports(jobs.filter((j: any) => j.report === 'transactions_detail').slice(0, 5));
      } catch (err) {
        // ignore
      }
    };
    loadExports();
  }, []);

  const columns = [
    { key: 'reference', header: 'Reference', render: (r: any) => r.reference },
    { key: 'amount', header: 'Amount', render: (r: any) => `₦${Number(r.amount).toLocaleString()}` },
    { key: 'status', header: 'Status', render: (r: any) => r.status },
    { key: 'service_type', header: 'Service', render: (r: any) => r.service_type },
    { key: 'terminal', header: 'Terminal', render: (r: any) => r.terminal_name || r.terminal_id },
    { key: 'agent', header: 'Agent', render: (r: any) => r.agent_name || r.agent_id },
    { key: 'created_at', header: 'Created', render: (r: any) => r.created_at },
  ];

  return (
    <div>
      <PageHeader title="Transaction Detail" description="Detailed transaction rows for auditing and reconciliation." />

      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
      <FiltersPanel 
        startDate={startDate} 
        endDate={endDate} 
        onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }} 
        onRun={fetchReport}
      />
      <div className="flex justify-end mb-6">
        <ExportButtons reportKey="transactions_detail" params={{ start_date: startDate, end_date: endDate }} />
      </div>

      <DataTable columns={columns} data={rows} emptyMessage={loading ? "Loading..." : "No transactions found"} />

      {recentExports.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Recent Exports</h3>
          <div className="space-y-2">
            {recentExports.map((job: any) => (
              <div key={job.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{job.report}</div>
                  <div className="text-xs text-muted-foreground">{job.created_at}</div>
                </div>
                <div>
                  {job.status === 'completed' && job.download_url ? (
                    <button className="text-sm text-primary" onClick={() => window.open(job.download_url, '_blank')}>Download</button>
                  ) : (
                    <span className="text-sm text-muted-foreground">{job.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
