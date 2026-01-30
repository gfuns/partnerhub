import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supportService } from '@/services/api/support.service';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function TicketDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(['support_ticket', id], () => supportService.getTicket(id!));

  const ticket = data?.data;

  if (isLoading) return <div>Loading...</div>;
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium">Ticket {ticket.id}</h2>
          <p className="text-sm text-muted-foreground">{ticket.subject}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm px-2 py-1 rounded-full bg-muted text-muted-foreground">{ticket.status}</span>
          <Button variant="ghost" onClick={() => navigate('/support')}>Back</Button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold">Conversation</h3>
        <div className="mt-3 space-y-3">
          {ticket.messages && ticket.messages.length ? (
            ticket.messages.map((m) => (
              <div key={m.id} className="p-3 border rounded-md">
                <div className="text-sm font-medium">{m.sender} <span className="text-xs text-muted-foreground">{m.sender_role}</span></div>
                <div className="text-sm mt-1">{m.body}</div>
                <div className="text-xs text-muted-foreground mt-2">{m.created_at}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No messages yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
