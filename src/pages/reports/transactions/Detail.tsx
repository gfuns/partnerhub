import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import FiltersPanel from '@/components/reports/FiltersPanel';
import reportsService from '@/services/api/reports.service';
import ExportButtons from '@/components/reports/ExportButtons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TablePagination } from '@/components/TablePagination';
import { StatusBadge } from '@/components/StatusBadge';

export default function TransactionsDetail() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(25);
  const [totalItems, setTotalItems] = useState<number>(0);

  const fetchReport = async (p: number = page, pp: number = perPage) => {
    setLoading(true);
    const params: any = { per_page: pp, page: p };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    if (startDate && endDate) {
      try {
        const resp = await reportsService.getTransactionsDetail(params);
        const raw = resp as any;
        const payload = raw?.data?.data ?? raw?.data ?? raw;
        const d = payload?.data ?? payload;
        const rowsArr = Array.isArray(d?.rows) ? d.rows : Array.isArray(payload?.rows) ? payload.rows : [];
        setRows(rowsArr);
        const meta = d?.meta ?? payload?.meta ?? {};
        const total = meta?.total ?? meta?.total_items ?? 0;
        const currentPage = meta?.page ?? p;
        const per_page = meta?.per_page ?? meta?.perPage ?? pp;
        setTotalItems(Number(total));
        setPage(Number(currentPage));
        setPerPage(Number(per_page));
      } catch (err) {
        console.warn('Failed to load transactions', err);
        setRows([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    }
  };

  // Initial load on mount
  useEffect(() => {
    fetchReport(1, perPage);
  }, [startDate, endDate]);

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
    { key: 'reference', header: 'Reference', render: (r: any) => r.trx || r.ref || r.transactionRef || '—' },
    { key: 'amount', header: 'Amount', render: (r: any) => {
      const a = r.total ?? r.amount ?? r.total_amount ?? 0;
      const num = Number(a) || 0;
      return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    } },
    { key: 'status', header: 'Status', render: (r: any) => (
      <StatusBadge status={(String(r.status || 'pending') as any)} />
    ) },
    { key: 'service', header: 'Service', render: (r: any) => r.service || r.title || '—' },
    { key: 'terminal', header: 'Terminal', render: (r: any) => r.terminal?.terminal_id || (r.terminal?.id ? `#${r.terminal.id}` : r.pos_id) || '—' },
    { key: 'merchant', header: 'Merchant', render: (r: any) => r.pos?.agent?.business_name || '—' },
    { key: 'gateway', header: 'Source', render: (r: any) => {
      if (r?.inflow) return String(r.inflow).toUpperCase();
      if (r?.maskedpan) return 'CARD';
      return '—';
    } },
    { key: 'description', header: 'Description', render: (r: any) => (
      <div className="max-w-xs truncate">{r.description || r.narration || '—'}</div>
    ) },
    { key: 'created_at', header: 'Created', render: (r: any) => {
      try {
        return new Date(r.created_at).toLocaleString('en-NG', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
      } catch (e) {
        return r.created_at || '—';
      }
    } },
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
        onRun={() => { setPage(1); fetchReport(1, perPage); }}
      />
      <div className="flex justify-end mb-6">
        <ExportButtons reportKey="transactions_detail" params={{ start_date: startDate, end_date: endDate }} />
      </div>

      <DataTable columns={columns} data={rows} loading={loading} emptyMessage={loading ? "Loading..." : "No transactions found"} />

      <TablePagination
        currentPage={page}
        totalPages={Math.max(1, Math.ceil(totalItems / perPage))}
        pageSize={perPage}
        totalItems={totalItems}
        onPageChange={(p) => { setPage(p); fetchReport(p, perPage); }}
        onPageSizeChange={(size) => { setPerPage(size); setPage(1); fetchReport(1, size); }}
      />

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
