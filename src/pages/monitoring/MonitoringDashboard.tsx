import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import terminalsService from '@/services/api/terminals.service';

// State will be populated from API: GET /terminals/monitoring

const terminalColumns = [
  {
    key: 'terminal_id',
    header: 'Terminal ID',
    render: (item: any) => (
      <span className="font-mono font-medium">{item.terminal_id || item.terminalId || item.id}</span>
    ),
  },
  { key: 'agent', header: 'Merchant', render: (item: any) => (
    item.agent && typeof item.agent === 'object'
      ? item.agent.business_name || String(item.agent.id)
      : item.agent
      ? `${item.agent}`
      : '—'
  ) },
  {
    key: 'status',
    header: 'Status',
    render: (item: any) => (
      <StatusBadge status={(item.online_status || item.status) as 'online' | 'offline' | 'warning'} size="sm" />
    ),
  },
  { key: 'last_ping', header: 'Last Ping', render: (item: any) => item.last_ping || item.lastPing || '—' },
  { key: 'uptime', header: 'Uptime', render: (item: any) => {
    const u = item.uptime ?? item.uptime_percent;
    return typeof u === 'number' ? `${u}%` : (u || '—');
  } },
];

export default function MonitoringDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [stats, setStats] = useState<{ total: number; online: number; offline: number; warnings: number }>({
    total: 0,
    online: 0,
    offline: 0,
    warnings: 0,
  });
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchMonitoring = async () => {
    setLoading(true);
    try {
      const resp = await terminalsService.getMonitoring();
      // API shape: { success: true, data: { total_terminals, online, offline, warnings, live_status: [...] } }
      const body = resp?.data ?? resp;
      const d = body?.data ?? body;
      setTerminals(Array.isArray(d?.live_status) ? d.live_status : []);
      setAlerts(Array.isArray(d?.alerts) ? d.alerts : []);
      // use stats from API when available
      if (typeof d?.online === 'number') setStats({
        total: d.total_terminals ?? (Array.isArray(d.live_status) ? d.live_status.length : 0),
        online: d.online,
        offline: d.offline,
        warnings: d.warnings,
      });
    } catch (err) {
      console.warn('Failed to load monitoring data', err);
      setTerminals([]);
      setAlerts([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMonitoring();
  };

  useEffect(() => {
    fetchMonitoring();
  }, []);

  const onlineCount = typeof stats.online === 'number' ? stats.online : terminals.filter(t => (t.online_status || t.status) === 'online').length;
  const offlineCount = typeof stats.offline === 'number' ? stats.offline : terminals.filter(t => (t.online_status || t.status) === 'offline').length;
  const warningCount = typeof stats.warnings === 'number' ? stats.warnings : terminals.filter(t => (t.online_status || t.status) === 'warning').length;

  return (
    <div>
      <PageHeader
        title="Monitoring"
        description="Real-time terminal status and system alerts."
        actions={
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Status Overview */}
      <div className="grid gap-3 md:grid-cols-3 mb-8">
        <StatCard
          title="Total Terminals"
          value={stats.total ?? terminals.length}
          icon={Activity}
        />
        <StatCard
          title="Online"
          value={onlineCount}
          icon={CheckCircle}
        />
        <StatCard
          title="Offline"
          value={offlineCount}
          icon={XCircle}
        />
        {/* <StatCard
          title="Warnings"
          value={warningCount}
          icon={AlertTriangle}
        /> */}
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Terminal Status</TabsTrigger>
          {/* <TabsTrigger value="alerts">
            Alerts
            {mockAlerts.length > 0 && (
              <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                {mockAlerts.length}
              </span>
            )}
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Live Terminal Status</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={terminalColumns}
                data={terminals}
                emptyMessage={loading ? 'Loading...' : 'No terminals to monitor'}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-4 rounded-lg border border-border p-4"
                  >
                    <div className={`rounded-full p-1 ${
                      alert.type === 'error' ? 'bg-destructive/10' :
                      alert.type === 'warning' ? 'bg-warning/10' :
                      'bg-success/10'
                    }`}>
                      {alert.type === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                      {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
                      {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-success" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Terminal: {alert.terminal} • {alert.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
