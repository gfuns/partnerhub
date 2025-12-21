import { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const mockTerminalStatus = [
  { id: '1', terminalId: 'TRM-001', agent: 'John Doe', status: 'online', lastPing: '2 sec ago', uptime: '99.9%' },
  { id: '2', terminalId: 'TRM-002', agent: 'John Doe', status: 'online', lastPing: '5 sec ago', uptime: '98.5%' },
  { id: '3', terminalId: 'TRM-003', agent: 'Jane Smith', status: 'offline', lastPing: '2 hours ago', uptime: '95.2%' },
  { id: '4', terminalId: 'TRM-004', agent: 'Mike Johnson', status: 'online', lastPing: '1 sec ago', uptime: '99.8%' },
  { id: '5', terminalId: 'TRM-005', agent: 'Sarah Brown', status: 'warning', lastPing: '45 sec ago', uptime: '97.1%' },
];

const mockAlerts = [
  { id: '1', type: 'error', message: 'Terminal TRM-003 is offline', terminal: 'TRM-003', time: '2 hours ago' },
  { id: '2', type: 'warning', message: 'High failure rate detected on TRM-015', terminal: 'TRM-015', time: '30 min ago' },
  { id: '3', type: 'warning', message: 'Terminal TRM-005 slow response time', terminal: 'TRM-005', time: '15 min ago' },
  { id: '4', type: 'success', message: 'Terminal TRM-042 back online', terminal: 'TRM-042', time: '5 min ago' },
];

const terminalColumns = [
  { 
    key: 'terminalId', 
    header: 'Terminal ID',
    render: (item: typeof mockTerminalStatus[0]) => (
      <span className="font-mono font-medium">{item.terminalId}</span>
    ),
  },
  { key: 'agent', header: 'Agent' },
  {
    key: 'status',
    header: 'Status',
    render: (item: typeof mockTerminalStatus[0]) => (
      <StatusBadge status={item.status as 'online' | 'offline' | 'warning'} size="sm" />
    ),
  },
  { key: 'lastPing', header: 'Last Ping' },
  { key: 'uptime', header: 'Uptime' },
];

export default function MonitoringDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const onlineCount = mockTerminalStatus.filter(t => t.status === 'online').length;
  const offlineCount = mockTerminalStatus.filter(t => t.status === 'offline').length;
  const warningCount = mockTerminalStatus.filter(t => t.status === 'warning').length;

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
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <StatCard
          title="Total Terminals"
          value={mockTerminalStatus.length}
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
        <StatCard
          title="Warnings"
          value={warningCount}
          icon={AlertTriangle}
        />
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Terminal Status</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {mockAlerts.length > 0 && (
              <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                {mockAlerts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Live Terminal Status</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={terminalColumns}
                data={mockTerminalStatus}
                emptyMessage="No terminals to monitor"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
