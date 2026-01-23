import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import FiltersPanel from '@/components/reports/FiltersPanel';
import reportsService from '@/services/api/reports.service';
import ExportButtons from '@/components/reports/ExportButtons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function SettlementsReport() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await reportsService.getSettlements({ start_date: startDate, end_date: endDate });
        // API: { success, data: { rows: [], meta, ... } }
        const d = resp?.data ?? {};
        setRows(Array.isArray(d.rows) ? d.rows : []);
      } catch (err) {
        console.warn('Failed to load settlements', err);
      }
    };
    fetch();
  }, [startDate, endDate]);

  const columns = [
    { key: 'settlement_id', header: 'Settlement ID', render: (r: any) => r.settlement_id },
    { key: 'requested_at', header: 'Requested', render: (r: any) => r.requested_at },
    { key: 'processed_at', header: 'Processed', render: (r: any) => r.processed_at },
    { key: 'amount', header: 'Amount', render: (r: any) => r.amount },
    { key: 'status', header: 'Status', render: (r: any) => r.status },
  ];

  return (
    <div>
      <PageHeader title="Settlements" description="Overview of partner settlements." />
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
      <FiltersPanel startDate={startDate} endDate={endDate} onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }} />
      <div className="flex justify-end mb-6">
        <ExportButtons reportKey="settlements" params={{ start_date: startDate, end_date: endDate }} />
      </div>
      <DataTable columns={columns} data={rows} emptyMessage="No settlements found" />
    </div>
  );
}
