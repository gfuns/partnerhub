import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import FiltersPanel from '@/components/reports/FiltersPanel';
import reportsService from '@/services/api/reports.service';
import ExportButtons from '@/components/reports/ExportButtons';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function TerminalsReport() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // default to last 7 days
  const getIso = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  const defaultEnd = getIso(today);
  const defaultStart = getIso(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
  const [startDate, setStartDate] = useState<string | undefined>(defaultStart);
  const [endDate, setEndDate] = useState<string | undefined>(defaultEnd);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(25);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchReport = async (p: number = page, pp: number = perPage, status?: string) => {
    setLoading(true);
    try {
      const params: any = { start_date: startDate, end_date: endDate, page: p, per_page: pp };
      // if (status && status !== 'all') params.status = status;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      // Only fetch when both dates are provided
      if (startDate && endDate) {
        const resp = await reportsService.getTerminalsReport({ start_date: startDate, end_date: endDate });
        // API: { success, data: { rows: [], meta, ... } }
        const d = resp?.data ?? {};
        // API may return rows inside d.rows.data or directly d.rows
        const rowsData = Array.isArray(d.rows) ? d.rows : (Array.isArray(d.rows?.data) ? d.rows.data : []);
        setRows(rowsData);
      } else {
        setRows([]);
      }
    } catch (err) {
      console.warn('Failed to load terminals report', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load on mount (will only fetch when defaults are present)
  useEffect(() => {
    fetchReport(1, perPage, statusFilter);
  }, [startDate, endDate]);

  const columns = [
    { key: 'terminal_id', header: 'Terminal ID', render: (r: any) => r.terminal_id },
    { key: 'name', header: 'Name', render: (r: any) => r.name || '—' },
    { key: 'agent', header: 'Agent', render: (r: any) => r.agent?.name || '—' },
    { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={r.status || 'offline'} /> },
    { key: 'last_seen', header: 'Last Seen', render: (r: any) => formatDate(r.last_heartbeat_at) },
    { key: 'balance', header: 'Balance', render: (r: any) => formatCurrency(Number(r.balance || 0)) },
    { key: 'transactions', header: 'Txns', render: (r: any) => r.total_transactions ?? 0 },
    { key: 'success_amount', header: 'Success Amount', render: (r: any) => formatCurrency(Number(r.total_successful_amount || 0)) },
    { key: 'card_txns', header: 'Card Txns', render: (r: any) => r.card_transactions ?? 0 },
    { key: 'transfer_txns', header: 'Transfer Txns', render: (r: any) => r.transfer_transactions ?? 0 },
    { key: 'uptime', header: 'Uptime %', render: (r: any) => (r.uptime_percent != null ? `${r.uptime_percent}%` : '—') },
  ];

  function formatDate(dateStr?: string) {
    if (!dateStr) return '-';
    try { return new Date(dateStr).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return dateStr; }
  }

  function formatCurrency(amount: number) {
    try { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(amount); } catch { return String(amount); }
  }

  return (
    <div>
      <PageHeader title="Terminal Activity" description="Per-terminal performance and assignment history." />
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
      <FiltersPanel
        startDate={startDate}
        endDate={endDate}
        onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        onRun={() => fetchReport(1, perPage, statusFilter)}
      >
        {/* <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Status</label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); fetchReport(1, perPage, v); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div> */}

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Per page</label>
          <Select value={String(perPage)} onValueChange={(v) => { const pp = Number(v); setPerPage(pp); fetchReport(1, pp, statusFilter); }}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FiltersPanel>
      <div className="flex justify-end mb-6">
        <ExportButtons reportKey="terminals" params={{ start_date: startDate, end_date: endDate }} />
      </div>
      <DataTable columns={columns} data={rows} emptyMessage={loading ? "Loading..." : "No terminals found"} />
    </div>
  );
}
