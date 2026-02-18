import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import FiltersPanel from '@/components/reports/FiltersPanel';
import reportsService from '@/services/api/reports.service';
import ExportButtons from '@/components/reports/ExportButtons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function WalletReport() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const resp = await reportsService.getWalletReport({ start_date: startDate, end_date: endDate });
      // API: { success, data: { wallet, terminal_balance, wallet_transactions, analysis, category_breakdown, filters } }
      const d = resp?.data ?? {};
      const payload = d.data ?? d; // handle nested or direct
      setSummary(payload);
      const txs = Array.isArray(payload.wallet_transactions)
        ? payload.wallet_transactions
        : (Array.isArray(payload.wallet_transactions?.data) ? payload.wallet_transactions.data : []);
      setRows(txs);
    } catch (err) {
      console.warn('Failed to load wallet', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const columns = [
    { key: 'date', header: 'Date', render: (r: any) => formatDate(r.created_at || r.date) },
    { key: 'type', header: 'Type', render: (r: any) => r.type || r.title || '—' },
    { key: 'amount', header: 'Amount', render: (r: any) => formatCurrency(Number(r.amount || r.value || 0)) },
    { key: 'balance_after', header: 'Balance', render: (r: any) => formatCurrency(Number(r.balance_after || r.new_balance || 0)) },
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
      <PageHeader title="Wallet & Balance" description="Partner wallet overview and ledger." />

      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
      <FiltersPanel startDate={startDate} endDate={endDate} onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }} onRun={fetchReport} />
      <div className="flex justify-end mb-6">
        {/* <ExportButtons reportKey="wallet" params={{ start_date: startDate, end_date: endDate }} /> */}
      </div>
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard title="Wallet Balance" value={formatCurrency(Number(summary?.wallet?.balance ?? 0))} />
        <StatCard title="Terminal Balance" value={formatCurrency(Number(summary?.terminal_balance ?? 0))} />
        <StatCard title="Unswept Sweepable" value={formatCurrency(Number(summary?.analysis?.total_unswept_sweepable ?? summary?.analysis?.total_unsweepable ?? 0))} />
        <StatCard title="Total Swept" value={formatCurrency(Number(summary?.wallet?.total_swept ?? 0))} />
      </div>
      <DataTable columns={columns} data={rows} emptyMessage={loading ? "Loading..." : "No wallet transactions found"} />
    </div>
  );
}
