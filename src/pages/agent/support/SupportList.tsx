import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { TablePagination } from '@/components/TablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActionButton } from '@/components/ActionButton';
import { TicketStatusBadge, TicketPriorityBadge, EscalatedBadge } from '@/components/support/TicketBadges';
import { useToast } from '@/hooks/use-toast';
import { supportService } from '@/services/api/support.service';
import { TicketListItem, TicketStatus, TICKET_STATUS_OPTIONS } from '@/types/support';

export default function AgentSupportList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTickets();
  }, [currentPage, statusFilter]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: currentPage, per_page: 10 };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const response = await supportService.getAgentTickets(params);
      setTickets(response.data || []);
      setTotalPages(response.meta?.last_page || 1);
      setTotal(response.meta?.total || 0);
    } catch (error) {
      // Mock data for demo
      setTickets([
        {
          id: 1,
          ticket_number: 'TKT-001',
          origin: 'agent_dashboard',
          category_name: 'Terminal Issue',
          subject: 'POS not printing receipts',
          status: 'open',
          priority: 'high',
          assigned_to_type: 'partner',
          terminal_id: 'TID001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_escalated: false,
        },
        {
          id: 2,
          ticket_number: 'TKT-002',
          origin: 'agent_dashboard',
          category_name: 'Transaction Dispute',
          subject: 'Failed transaction but customer was debited',
          status: 'in_progress',
          priority: 'urgent',
          assigned_to_type: 'xtrapay',
          terminal_id: 'TID002',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString(),
          is_escalated: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTickets();
  };

  const columns = [
    {
      key: 'ticket_number',
      header: 'Ticket #',
      render: (item: TicketListItem) => (
        <span className="font-mono font-medium">{item.ticket_number}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (item: TicketListItem) => (
        <span className="text-sm">{item.category_name}</span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (item: TicketListItem) => (
        <div className="max-w-[200px]">
          <p className="truncate font-medium">{item.subject}</p>
          {item.terminal_id && (
            <p className="text-xs text-muted-foreground">Terminal: {item.terminal_id}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: TicketListItem) => (
        <div className="flex items-center gap-2">
          <TicketStatusBadge status={item.status} size="sm" />
          {item.is_escalated && <EscalatedBadge />}
        </div>
      ),
    },
    {
      key: 'assigned',
      header: 'Assigned To',
      render: (item: TicketListItem) => (
        <span className="text-sm capitalize">{item.assigned_to_type}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (item: TicketListItem) => (
        <span className="text-sm text-muted-foreground">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16',
      render: (item: TicketListItem) => (
        <ActionButton
          icon={Eye}
          label="View Ticket"
          onClick={() => navigate(`/support/${item.id}`)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Support Tickets"
        description="View and manage your support requests"
        actions={
          <Button onClick={() => navigate('/support/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {TICKET_STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        emptyMessage="No support tickets found"
        onRowClick={(item) => navigate(`/support/${item.id}`)}
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={total}
        pageSize={10}
      />
    </div>
  );
}
