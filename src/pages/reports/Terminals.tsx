import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import FiltersPanel from '@/components/reports/FiltersPanel';
import reportsService from '@/services/api/reports.service';
import ExportButtons from '@/components/reports/ExportButtons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function TerminalsReport() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await reportsService.getTerminalsReport();
        // API: { success, data: { rows: [], meta, ... } }
        const d = resp?.data ?? {};
        setRows(Array.isArray(d.rows) ? d.rows : []);
      } catch (err) {
        console.warn('Failed to load terminals report', err);
      }
    };
    fetch();
  }, []);

  const columns = [
    { key: 'terminal_id', header: 'Terminal ID', render: (r: any) => r.terminal_id },
    { key: 'serial', header: 'Serial', render: (r: any) => r.serial },
    { key: 'agent', header: 'Assigned To', render: (r: any) => r.assigned_to_agent },
    { key: 'transactions', header: 'Transactions', render: (r: any) => r.total_transactions },
    { key: 'volume', header: 'Volume', render: (r: any) => r.total_volume },
  ];

  return (
    <div>
      <PageHeader title="Terminal Activity" description="Per-terminal performance and assignment history." />
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
      <FiltersPanel onRangeChange={() => {}} />
      <div className="flex justify-end mb-6">
        <ExportButtons reportKey="terminals" params={{}} />
      </div>
      <DataTable columns={columns} data={rows} emptyMessage="No terminals found" />
    </div>
  );
}
