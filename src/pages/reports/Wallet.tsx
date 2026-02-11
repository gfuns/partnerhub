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

  const fetchReport = async () => {
    setLoading(true);
    try {
      const resp = await reportsService.getWalletReport();
      // API: { success, data: { rows: [], meta, ...summaryFields } }
      const d = resp?.data ?? {};
      setSummary(d);
      setRows(Array.isArray(d.rows) ? d.rows : []);
    } catch (err) {
      console.warn('Failed to load wallet', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    fetchReport();
  }, []);

  const columns = [
    { key: 'date', header: 'Date', render: (r: any) => r.date },
    { key: 'type', header: 'Type', render: (r: any) => r.type },
    { key: 'amount', header: 'Amount', render: (r: any) => r.amount },
    { key: 'balance_after', header: 'Balance', render: (r: any) => r.balance_after },
  ];

  return (
    <div>
      <PageHeader title="Wallet & Balance" description="Partner wallet overview and ledger." />

      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
      <FiltersPanel onRangeChange={() => {}} onRun={fetchReport} />
      <div className="flex justify-end mb-6">
        <ExportButtons reportKey="wallet" params={{}} />
      </div>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard title="Current Balance" value={summary?.current_balance ?? '₦0.00'} />
        <StatCard title="Available" value={summary?.available_balance ?? '₦0.00'} />
        <StatCard title="Pending" value={summary?.pending_balance ?? '₦0.00'} />
      </div>
      <DataTable columns={columns} data={rows} emptyMessage={loading ? "Loading..." : "No wallet transactions found"} />
    </div>
  );
}
