import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { supportService, Ticket } from '@/services/api/support.service';
import CreateTicketModal from '@/components/support/CreateTicketModal';

export default function SupportList() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery(['support_tickets'], () => supportService.getTickets());

  const tickets: Ticket[] = data?.data ?? [];

  const columns = [
    { key: 'id', header: 'Ticket ID' },
    { key: 'category', header: 'Category', render: (t: Ticket) => t.category?.name ?? '-' },
    { key: 'subject', header: 'Subject' },
    { key: 'terminal', header: 'Terminal', render: (t: Ticket) => t.terminal_id ?? '-' },
    { key: 'status', header: 'Status', render: (t: Ticket) => t.status ?? '-' },
    { key: 'assigned_to', header: 'Assigned To', render: (t: Ticket) => t.assigned_to ?? '-' },
    { key: 'created_at', header: 'Created At' },
    { key: 'updated_at', header: 'Last Updated' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Support Tickets</h2>
        <div>
          <Button onClick={() => setShowCreate(true)}>Create New Ticket</Button>
        </div>
      </div>

      <DataTable
        columns={columns.map((c) => ({ ...c }))}
        data={tickets}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/support/${row.id}`)}
      />

      <CreateTicketModal open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
