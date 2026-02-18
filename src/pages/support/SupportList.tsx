import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DataTable } from '@/components/DataTable';
import { supportService } from '@/services/api/support.service';
import type { Ticket } from '@/types/support';
import { TablePagination } from '@/components/TablePagination';
import { TICKET_STATUS_OPTIONS } from '@/types/support';
import CreateTicketModal from '@/components/support/CreateTicketModal';

import { TicketCategory } from '@/types/support';

export default function SupportList() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<TicketCategory[]>([]);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const resp = await supportService.getCategories();
      setCategories(resp.data || []);
    } catch (err) {
      setCategories([]);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['support_tickets', page, perPage, status, categoryId, search],
    queryFn: () => supportService.getTickets({ page, per_page: perPage, status, category_id: categoryId, search }),
  });

  const tickets: any[] = data?.data ?? [];
  const meta = data?.meta;

  const columns = [
    { key: 'id', header: 'Ticket ID' },
    { key: 'category', header: 'Category', render: (t: Ticket) => t.category?.name ?? '-' },
    { key: 'subject', header: 'Subject' },
    { key: 'terminal', header: 'Terminal', render: (t: Ticket) => t.terminal?.terminal_id ?? t.terminal_id ?? '-' },
    { key: 'transactions', header: 'Txn Count', render: (t: Ticket) => (t as any).transaction_count ?? '-' },
    {
      key: 'amount', header: 'Amount', render: (t: Ticket) => {
        const amount = (t as any).disputed_amount;
        return amount != null ? parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
      }
    },
    { key: 'priority', header: 'Priority', render: (t: Ticket) => t.priority ?? '-' },
    { key: 'status', header: 'Status', render: (t: Ticket) => t.status ?? '-' },
    { key: 'assigned_to', header: 'Assigned To', render: (t: any) => t.assigned_to ?? t.assigned_to_type ?? '-' },
    { key: 'created_at', header: 'Created At', render: (t: Ticket) => formatDate(t.created_at) },
    { key: 'updated_at', header: 'Last Updated', render: (t: Ticket) => formatDate(t.updated_at) },
  ];

  function formatDate(dateStr?: string) {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Support Tickets</h2>
          <div>
            <Button onClick={() => setShowCreate(true)}>Create New Ticket</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Input placeholder="Search by ticket id, subject, terminal, trx" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div>
            <Select onValueChange={(v) => setStatus(v === '__all' ? undefined : v)} value={status ?? ''}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All Statuses</SelectItem>
                {TICKET_STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select onValueChange={(v) => { if (v === '__all') { setCategoryId(undefined); } else { setCategoryId(Number(v)); } }} value={categoryId ? String(categoryId) : ''}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" onClick={() => { setPage(1); }}>Apply filters</Button>
          <Button variant="ghost" onClick={() => { setSearch(''); setStatus(undefined); setCategoryId(undefined); setPage(1); }}>Clear</Button>
        </div>
      </div>

      <DataTable
        columns={columns.map((c) => ({ ...c }))}
        data={tickets}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/support/${row.id}`)}
      />

      {meta && (
        <div className="mt-4">
          <TablePagination currentPage={meta.current_page || page} totalPages={meta.last_page || 1} onPageChange={(p) => setPage(p)} totalItems={meta.total || 0} pageSize={meta.per_page || perPage} />
        </div>
      )}

      <CreateTicketModal open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
