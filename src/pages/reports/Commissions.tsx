import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatCard } from '@/components/StatCard';
import FiltersPanel from '@/components/reports/FiltersPanel';
import reportsService from '@/services/api/reports.service';
import ExportButtons from '@/components/reports/ExportButtons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function CommissionsReport() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (startDate && endDate) {
        const resp = await reportsService.getCommissionsReport({ start_date: startDate, end_date: endDate } as any);
        const d = resp?.data ?? {};
        const payload = d.data ?? d;
        const rowsData = Array.isArray(payload.rows) ? payload.rows : (Array.isArray(payload.rows?.data) ? payload.rows.data : []);
        setRows(rowsData);
        setSummary(payload.summary ?? payload);
      } else {
        setRows([]);
      }
    } catch (err) {
      console.warn('Failed to load commissions', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load on mount and when dates change
  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const columns = [
    // { key: 'id', header: 'ID', render: (r: any) => r.id },
    { key: 'pos_trx_ref', header: 'Reference', render: (r: any) => r.pos_trx_ref || r.reference || '—' },
    { key: 'terminal', header: 'Terminal', render: (r: any) => r.terminal_id || '—' },
    { key: 'agent', header: 'Merchant', render: (r: any) => r.agent_name ?? '—' },
    { key: 'amount', header: 'Amount', render: (r: any) => formatCurrency(Number(r.amount || 0)) },
    {
      key: 'share', header: (localStorage.getItem('login_type') === 'agent' ? 'Merchant Share' : 'Partner Share'), render: (r: any) => {
        const isAgent = localStorage.getItem('login_type') === 'agent';
        const share = isAgent ? (r.agent_fee ?? r.agentFee ?? 0) : (r.partner_fee ?? r.partnerFee ?? 0);
        return formatCurrency(Number(share));
      }
    },
    { key: 'created_at', header: 'Date', render: (r: any) => formatDate(r.created_at) },
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
      <PageHeader title="Commissions" description="Commission overrides and fee collection breakdown." />
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
        <ExportButtons reportKey="commissions" params={{ start_date: startDate, end_date: endDate }} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <StatCard title="Total Transaction Amount" value={formatCurrency(Number(summary?.total_transaction_amount ?? 0))} />
        <StatCard title={localStorage.getItem('login_type') === 'agent' ? 'Total Agent Commission' : 'Total Partner Commission'} value={formatCurrency(Number(localStorage.getItem('login_type') === 'agent' ? (summary?.total_agent_commission ?? 0) : (summary?.total_partner_commission ?? 0)))} />
      </div>
      <DataTable columns={columns} data={rows} emptyMessage={loading ? "Loading..." : "No commission data found"} />
    </div>
  );
}
