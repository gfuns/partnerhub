import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import FiltersPanel from '@/components/reports/FiltersPanel';
import reportsService from '@/services/api/reports.service';
import ExportButtons from '@/components/reports/ExportButtons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AgentsReport() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await reportsService.getAgentsReport();
        // API: { success, data: { rows: [], meta, ... } }
        const d = resp?.data ?? {};
        setRows(Array.isArray(d.rows) ? d.rows : []);
      } catch (err) {
        console.warn('Failed to load agents report', err);
      }
    };
    fetch();
  }, []);

  const columns = [
    { key: 'agent_id', header: 'Agent ID', render: (r: any) => r.agent_id },
    { key: 'business_name', header: 'Business', render: (r: any) => r.business_name },
    { key: 'transactions', header: 'Transactions', render: (r: any) => r.total_transactions },
    { key: 'volume', header: 'Volume', render: (r: any) => r.total_volume },
    { key: 'kyc', header: 'KYC Status', render: (r: any) => r.kyc_status },
  ];

  return (
    <div>
      <PageHeader title="Agent Performance" description="Agent-level KPIs and earnings." />
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
      <FiltersPanel onRangeChange={() => {}} />
      <div className="flex justify-end mb-6">
        <ExportButtons reportKey="agents" params={{}} />
      </div>
      <DataTable columns={columns} data={rows} emptyMessage="No agents found" />
    </div>
  );
}
