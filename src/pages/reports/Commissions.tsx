import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import FiltersPanel from '@/components/reports/FiltersPanel';
import reportsService from '@/services/api/reports.service';
import ExportButtons from '@/components/reports/ExportButtons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function CommissionsReport() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await reportsService.getCommissionsReport({ start_date: startDate, end_date: endDate } as any);
        // API: { success, data: { rows: [], meta, ... } }
        const d = resp?.data ?? {};
        setRows(Array.isArray(d.rows) ? d.rows : []);
      } catch (err) {
        console.warn('Failed to load commissions', err);
      }
    };
    fetch();
  }, [startDate, endDate]);

  const columns = [
    { key: 'service_type', header: 'Service', render: (r: any) => r.service_type?.name || r.service_type },
    { key: 'base_rate', header: 'Base Rate', render: (r: any) => r.base_rate },
    { key: 'partner_override', header: 'Partner Override', render: (r: any) => r.partner_override },
    { key: 'fee_collected', header: 'Fees Collected', render: (r: any) => r.total_fee_collected },
    { key: 'transactions', header: 'Transactions', render: (r: any) => r.transactions_count },
  ];

  return (
    <div>
      <PageHeader title="Commissions" description="Commission overrides and fee collection breakdown." />
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
      <FiltersPanel startDate={startDate} endDate={endDate} onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }} />
      <div className="flex justify-end mb-6">
        <ExportButtons reportKey="commissions" params={{ start_date: startDate, end_date: endDate }} />
      </div>
      <DataTable columns={columns} data={rows} emptyMessage="No commission data found" />
    </div>
  );
}
