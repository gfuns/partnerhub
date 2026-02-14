import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { ChartContainer } from '@/components/ui/chart';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import * as Recharts from 'recharts';
import reportsService from '@/services/api/reports.service';
import FiltersPanel from '@/components/reports/FiltersPanel';
import ExportButtons from '@/components/reports/ExportButtons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function TransactionsSummary() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [summary, setSummary] = useState<any>(null);
  const [serviceType, setServiceType] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [agentId, setAgentId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // mock options
  const serviceTypes = [{ id: 'airtime', name: 'Airtime' }, { id: 'data', name: 'Data' }, { id: 'bill', name: 'Bill' }];
  const agents = [{ id: '1', name: 'Agent A' }, { id: '2', name: 'Agent B' }];

  const fetchReport = async () => {
    setLoading(true);
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    try {
      const resp = await reportsService.getTransactionsSummary(params);
      const rawData = resp as any;
      const data = rawData?.data?.data ?? rawData?.data ?? rawData;
      setSummary(data);
    } catch (err) {
      console.warn('Failed to load summary', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    fetchReport();
  }, []);


  // recent exports for this report
  const [recentExports, setRecentExports] = useState<any[]>([]);
  useEffect(() => {
    const loadExports = async () => {
      try {
        const resp = await reportsService.listExports();
        const jobs = resp?.data?.data ?? resp?.data ?? [];
        const arr = Array.isArray(jobs) ? jobs : [];
        setRecentExports(arr.filter((j: any) => j.report === 'transactions_summary').slice(0, 5));
      } catch (err) {
        // ignore
      }
    };
    loadExports();
  }, []);

  return (
    <div>
      <PageHeader title="Transaction Summary" description="High level transaction metrics." />

      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
      <FiltersPanel 
        startDate={startDate} 
        endDate={endDate} 
        onRun={fetchReport} 
        onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }}
      >
        {/* <div className="w-full mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="min-w-0">
            <Select value={serviceType || 'all'} onValueChange={(v) => setServiceType(v || undefined)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {serviceTypes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">
            <Select value={status || 'all'} onValueChange={(v) => setStatus(v || undefined)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">
            <Select value={agentId || 'all'} onValueChange={(v) => setAgentId(v || undefined)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div> */}
      </FiltersPanel>
      <div className="flex justify-end mb-6">
        {/* <ExportButtons reportKey="transactions_summary" params={{ start_date: startDate, end_date: endDate, service_type_id: serviceType, status, agent_id: agentId }} /> */}
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard title="Total Transactions" value={summary?.total_count ?? 0} />
        <StatCard title="Total Volume" value={summary?.total_volume ? `₦${Number(summary.total_volume).toLocaleString()}` : '₦0.00'} />
        <StatCard title="Success Rate" value={summary?.success_rate ? `${summary.success_rate}%` : '0%'} />
        <StatCard title="Fees Collected" value={summary?.fees_total ? `₦${Number(summary.fees_total).toLocaleString()}` : '₦0.00'} />
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Volume by Day</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={chartType === 'line' ? 'outline' : 'ghost'} onClick={() => setChartType('line')}>Line</Button>
              <Button size="sm" variant={chartType === 'bar' ? 'outline' : 'ghost'} onClick={() => setChartType('bar')}>Bar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ volume: { label: 'Volume' } }}>
              <div style={{ height: 320 }} className="w-full">
                <Recharts.ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <Recharts.LineChart data={summary?.by_day || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <Recharts.CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                      <Recharts.XAxis dataKey="day" tickFormatter={(d) => (d ? d.replace(/^\d{4}-/, '') : '')} />
                      <Recharts.YAxis domain={[0, 'dataMax']} tickFormatter={(v) => `₦${Number(v).toLocaleString()}`} />
                      <Recharts.Tooltip formatter={(value: any) => `₦${Number(value).toLocaleString()}`} labelFormatter={(label) => label} />
                      <Recharts.Line
                        type="monotone"
                        dataKey="volume"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        dot={{ r: Math.max(6, (summary?.by_day?.length === 1 ? 8 : 4)) }}
                        activeDot={{ r: 8 }}
                        isAnimationActive={false}
                      />
                    </Recharts.LineChart>
                  ) : (
                    <Recharts.BarChart data={summary?.by_day || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <Recharts.CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                      <Recharts.XAxis dataKey="day" tickFormatter={(d) => (d ? d.replace(/^\d{4}-/, '') : '')} />
                      <Recharts.YAxis domain={[0, 'dataMax']} tickFormatter={(v) => `₦${Number(v).toLocaleString()}`} />
                      <Recharts.Tooltip formatter={(value: any) => `₦${Number(value).toLocaleString()}`} labelFormatter={(label) => label} />
                      <Recharts.Bar dataKey="volume" fill="#4f46e5" />
                    </Recharts.BarChart>
                  )}
                </Recharts.ResponsiveContainer>
              </div>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {recentExports.length > 0 && (
        <div className="mt-4">
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
