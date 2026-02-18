import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import FiltersPanel from '@/components/reports/FiltersPanel';
import reportsService from '@/services/api/reports.service';
import ExportButtons from '@/components/reports/ExportButtons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';

export default function SettlementsReport() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(25);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchReport = async (p: number = page, pp: number = perPage, status?: string) => {
    setLoading(true);
    try {
      const params: any = { start_date: startDate, end_date: endDate, page: p, per_page: pp };
      if (status && status !== 'all') params.status = status;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      if (startDate && endDate) {
        const resp = await reportsService.getSettlements(params);
        // API: { success, data: { rows: [], meta, ... } }
        const d = resp?.data ?? {};
        const rowsData = Array.isArray(d.rows) ? d.rows : (d.rows ?? []);
        setRows(rowsData);
        const meta = d.meta ?? {};
        const currentPage = meta.page ?? p;
        const per_page = meta.per_page ?? pp;
        const total = meta.total ?? rowsData.length;
        setTotalItems(total);
        setPerPage(per_page);
        setPage(currentPage);
        setTotalPages(Math.max(1, Math.ceil(total / per_page)));
      }
    } catch (err) {
      console.warn('Failed to load settlements', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    fetchReport(1, perPage, statusFilter);
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const columns = [
    { key: 'id', header: 'Settlement ID', render: (r: any) => r.id },
    { key: 'requested_at', header: 'Requested', render: (r: any) => formatDate(r.created_at || r.requested_at) },
    { key: 'processed_at', header: 'Processed', render: (r: any) => {
        const val = r.approved_at || r.rejected_at || r.processed_at;
        return val ? formatDate(val) : '-';
      }
    },
    { key: 'amount', header: 'Amount', render: (r: any) => r.amount },
    { key: 'stamp_duty', header: 'Stamp Duty', render: (r: any) => r.stamp_duty },
    { key: 'fee', header: 'Fee', render: (r: any) => r.fee },
    { key: 'net_amount', header: 'Net Amount', render: (r: any) => r.net_amount },
    { key: 'status', header: 'Status', render: (r: any) => StatusBadge({ status: r.status }) },
  ];

  return (
    <div>
      <PageHeader title="Settlements" description="Overview of partner settlements." />
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
        <FiltersPanel 
          startDate={startDate} 
          endDate={endDate} 
          onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }} 
          onRun={() => fetchReport(1, perPage, statusFilter)}
        >
          <div className="flex items-center gap-2">
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
          </div>

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
          <ExportButtons reportKey="settlements" params={{ start_date: startDate, end_date: endDate, status: statusFilter }} />
        </div>

      <DataTable columns={columns} data={rows} emptyMessage={loading ? 'Loading...' : 'No settlements found'} />
      <div className="mt-4 flex items-center justify-end">
        <div className="text-sm text-muted-foreground mr-4">{totalItems} results</div>
        <div>
          <Button variant="ghost" size="sm" onClick={() => { if (page > 1) { fetchReport(page - 1, perPage, statusFilter); } }} disabled={page <= 1}>Prev</Button>
          <span className="px-3">{page} / {totalPages}</span>
          <Button variant="ghost" size="sm" onClick={() => { if (page < totalPages) { fetchReport(page + 1, perPage, statusFilter); } }} disabled={page >= totalPages}>Next</Button>
        </div>
      </div>
    </div>
  );
}
