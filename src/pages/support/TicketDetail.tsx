import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportService } from '@/services/api/support.service';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DetailCard, DetailRow } from '@/components/DetailCard';
import { AlertTriangle, CheckCircle2, XCircle, Clock, ArrowUpCircle, File, Image, FileText, Paperclip } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TicketDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [internalNote, setInternalNote] = useState('');
  const [internalNoteAttachments, setInternalNoteAttachments] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const internalFileRef = useRef<HTMLInputElement | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const login_type = localStorage.getItem('login_type') || 'partner';

  const { data, isLoading } = useQuery({
    queryKey: ['support_ticket', id],
    queryFn: () => supportService.getTicket(id!),
    enabled: !!id,
  });

  const ticket = data?.data;

  const parsedMeta: any = (() => {
    const raw = (ticket as any)?.meta;
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  })();

  const addMessageMutation = useMutation({
    mutationFn: (payload: any) => supportService.addMessage(id!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support_ticket', id] });
      setMessage('');
      setAttachments([]);
      if (fileRef.current) fileRef.current.value = '';
      toast({ title: 'Message sent' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Send failed', description: err?.message || 'Unable to send message' });
    }
  });

  const addInternalNoteMutation = useMutation({
    mutationFn: (payload: any) => supportService.addMessage(id!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support_ticket', id] });
      setInternalNote('');
      setInternalNoteAttachments([]);
      if (internalFileRef.current) internalFileRef.current.value = '';
      toast({ title: 'Internal note added' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Failed', description: err?.message || 'Unable to add internal note' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: (payload: any) => supportService.updateTicketStatus(id!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support_ticket', id] });
      qc.invalidateQueries({ queryKey: ['support_tickets'] });
      setStatusDialogOpen(false);
      setStatusComment('');
      toast({ title: 'Status updated' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Failed', description: err?.message || 'Unable to update status' });
    }
  });

  const escalateMutation = useMutation({
    mutationFn: (payload: any) => supportService.escalateTicket(id!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support_ticket', id] });
      setEscalateDialogOpen(false);
      setEscalateReason('');
      toast({ title: 'Ticket escalated to Xtrapay' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Escalation failed', description: err?.message || 'Unable to escalate' });
    }
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setAttachments(Array.from(files));
  };

  const handleInternalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setInternalNoteAttachments(Array.from(files));
  };

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return toast({ variant: 'destructive', title: 'Validation', description: 'Message or attachment required' });
    let sender_type = 'partner_user';
    if (login_type === 'agent') sender_type = 'agent';

    const payload: any = { message, is_internal: false, sender_type };
    if (attachments.length) payload.attachments = attachments;
    addMessageMutation.mutate(payload);
  };

  const handleAddInternalNote = () => {
    if (!internalNote.trim() && internalNoteAttachments.length === 0) return toast({ variant: 'destructive', title: 'Validation', description: 'Note or attachment required' });

    const payload: any = { message: internalNote, is_internal: true };
    if (internalNoteAttachments.length) payload.attachments = internalNoteAttachments;
    addInternalNoteMutation.mutate(payload);
  };

  const handleStatusChange = () => {
    if (!selectedStatus) return toast({ variant: 'destructive', title: 'Validation', description: 'Please select a status' });
    updateStatusMutation.mutate({ status: selectedStatus, comment: statusComment });
  };

  const handleEscalate = () => {
    escalateMutation.mutate({ reason: escalateReason });
  };

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (!amount) return '₦0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(num);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'open':
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'canceled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div className="p-6">Loading ticket details...</div>;
  if (!ticket) return <div className="p-6">Ticket not found</div>;

  const internalNotes = ticket.internal_notes || [];
  const publicMessages = ticket.messages || [];
  const canEscalate = ticket.status !== 'closed' && ticket.status !== 'canceled' && !ticket.escalated_to_xtrapay_at;
  const canChangeStatus = ticket.status !== 'closed' && ticket.status !== 'canceled';
  let open_by_type = ticket.opened_by_type || '';
  if (open_by_type === 'agent') {
    open_by_type = 'Merchant';
  } else {
    open_by_type = open_by_type.replace(/_/g, ' ').charAt(0).toUpperCase() + open_by_type.replace(/_/g, ' ').slice(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{ticket.ticket_ref}</h1>
            <Badge className={getStatusColor(ticket.status)}>{getStatusIcon(ticket.status)} <span className="ml-1">{ticket.status?.replace(/_/g, ' ').charAt(0).toUpperCase() + ticket.status?.replace(/_/g, ' ').slice(1)}</span></Badge>
            <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
          </div>
          <p className="text-lg text-muted-foreground">{ticket.subject || 'No subject'}</p>
          <p className="text-sm text-muted-foreground mt-1">{ticket.category?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {canEscalate && user?.loginType === 'partner' && (
            <Button variant="outline" size="sm" onClick={() => setEscalateDialogOpen(true)}>
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Escalate to Xtrapay
            </Button>
          )}
          {canChangeStatus && (
            <Button variant="outline" size="sm" onClick={() => { setSelectedStatus(ticket.status); setStatusDialogOpen(true); }}>
              Change Status
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate('/support')}>Back</Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="conversation" className="space-y-4">
            <TabsList>
              <TabsTrigger value="conversation">Conversation ({publicMessages.length})</TabsTrigger>
              <TabsTrigger value="internal">Internal Notes ({internalNotes.length})</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="space-y-4">
              {ticket.transactions && ticket.transactions.length > 0 && (
                <div className="p-4 border rounded-md bg-muted/20">
                  <h3 className="font-semibold mb-3">Related Transactions</h3>
                  <div className="space-y-2">
                    {ticket.transactions.map((tx: any) => (
                      <div key={tx.id} className="p-3 bg-background border rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">Txn #{tx.transaction_id} • {formatCurrency(tx.amount)}</div>
                          <div className="text-xs text-muted-foreground">RRN: {tx.rrn} • STAN: {tx.stan} • {formatDate(tx.created_at)}</div>
                        </div>
                        <Badge variant="outline">{tx.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {publicMessages.length > 0 ? (
                  publicMessages.map((m: any) => (
                    <div key={m.id} className="p-4 border rounded-md">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{m.sender_name}</div>
                          <div className="text-xs text-muted-foreground">{m.sender_type === 'agent' ? 'Merchant' : (m.sender_type === 'partner_user' ? 'Partner' : m.sender_type?.replace(/_/g, ' '))} • {formatDate(m.created_at)}</div>
                        </div>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{m.message}</div>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            Attachments ({m.attachments.length}):
                          </div>
                          <div className="space-y-1.5">
                            {m.attachments.map((a: any) => {
                              const fileName = a.file_path?.split('/').pop() || 'attachment';
                              const isImage = a.file_type?.startsWith('image/');
                              const isPdf = a.file_type === 'application/pdf';
                              return (
                                <a
                                  key={a.id}
                                  href={a.full_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded border hover:bg-muted/50 transition-colors"
                                >
                                  {isImage ? (
                                    <Image className="h-4 w-4 flex-shrink-0" />
                                  ) : isPdf ? (
                                    <FileText className="h-4 w-4 flex-shrink-0" />
                                  ) : (
                                    <File className="h-4 w-4 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{fileName}</span>
                                  <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                                    {(a.file_size / 1024).toFixed(1)} KB
                                  </span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center border rounded-md border-dashed">
                    <p className="text-muted-foreground">No messages yet</p>
                  </div>
                )}
              </div>

              <div className="p-4 border rounded-md bg-muted/10">
                <h4 className="font-medium mb-3">Add Message</h4>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Type your message..." />
                <div className="mt-2">
                  <input ref={fileRef} type="file" multiple onChange={handleFiles} className="text-sm" />
                  {attachments.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">{attachments.length} file(s) selected</div>
                  )}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button onClick={handleSend} disabled={addMessageMutation.isPending}>
                    {addMessageMutation.isPending ? 'Sending…' : 'Send Message'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="internal" className="space-y-4">
              <div className="space-y-3">
                {internalNotes.length > 0 ? (
                  internalNotes.map((note: any) => (
                    <div key={note.id} className="p-4 border rounded-md bg-orange-50/50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{note.sender_name}</div>
                          <div className="text-xs text-muted-foreground">{note.sender_type} • {formatDate(note.created_at)}</div>
                        </div>
                        <Badge variant="secondary">Internal</Badge>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{note?.note}</div>
                      {note.attachments && note.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            Attachments ({note.attachments.length}):
                          </div>
                          <div className="space-y-1.5">
                            {note.attachments.map((a: any) => {
                              const fileName = a.file_path?.split('/').pop() || 'attachment';
                              const isImage = a.file_type?.startsWith('image/');
                              const isPdf = a.file_type === 'application/pdf';
                              return (
                                <a
                                  key={a.id}
                                  href={a.full_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded border hover:bg-muted/50 transition-colors"
                                >
                                  {isImage ? (
                                    <Image className="h-4 w-4 flex-shrink-0" />
                                  ) : isPdf ? (
                                    <FileText className="h-4 w-4 flex-shrink-0" />
                                  ) : (
                                    <File className="h-4 w-4 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{fileName}</span>
                                  <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                                    {(a.file_size / 1024).toFixed(1)} KB
                                  </span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center border rounded-md border-dashed">
                    <p className="text-muted-foreground">No internal notes yet</p>
                  </div>
                )}
              </div>

              <div className="p-4 border rounded-md bg-muted/10">
                <h4 className="font-medium mb-3">Add Internal Note</h4>
                <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={4} placeholder="Type internal note (not visible to agents)..." />
                <div className="mt-2">
                  <input ref={internalFileRef} type="file" multiple onChange={handleInternalFiles} className="text-sm" />
                  {internalNoteAttachments.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">{internalNoteAttachments.length} file(s) selected</div>
                  )}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button onClick={handleAddInternalNote} disabled={addInternalNoteMutation.isPending}>
                    {addInternalNoteMutation.isPending ? 'Adding…' : 'Add Internal Note'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <DetailCard title="Ticket Information">
                <DetailRow label="Ticket Reference" value={<span className="font-mono">{ticket.ticket_ref}</span>} />
                <DetailRow label="Category" value={ticket.category?.name} />
                <DetailRow label="Status" value={<Badge className={getStatusColor(ticket.status)}>{ticket.status?.replace(/_/g, ' ').charAt(0).toUpperCase() + ticket.status?.replace(/_/g, ' ').slice(1)}</Badge>} />
                <DetailRow label="Priority" value={<Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>} />
                <DetailRow label="Origin" value={ticket.origin === 'agent_dashboard' ? 'Merchant Hub' : ticket.origin.replace(/_/g, ' ').charAt(0).toUpperCase() + ticket.origin.replace(/_/g, ' ').slice(1)} />
                <DetailRow label="Opened By" value={`${open_by_type} - ${(ticket as any)?.opened_by ? ((ticket as any)?.opened_by?.first_name + ' ' + (ticket as any)?.opened_by?.last_name) || (ticket as any)?.opened_by?.name : ''}`} />
                <DetailRow label="Created At" value={formatDate(ticket.created_at)} />
                <DetailRow label="Last Updated" value={formatDate(ticket.updated_at)} />
                <DetailRow label="Description" value={<div className="whitespace-pre-wrap">{ticket.description || '—'}</div>} />
                {parsedMeta && (
                  <DetailRow
                    label="Meta"
                    value={(
                      <div className="text-sm">
                        {parsedMeta.date_from && <div><strong>Date From:</strong> {parsedMeta.date_from}</div>}
                        {parsedMeta.date_to && <div><strong>Date To:</strong> {parsedMeta.date_to}</div>}
                        {parsedMeta.disputed_amount != null && <div><strong>Disputed Amount:</strong> {formatCurrency(parsedMeta.disputed_amount)}</div>}
                        {/* {parsedMeta.transactions && Array.isArray(parsedMeta.transactions) && (
                          <div><strong>Transactions:</strong> {parsedMeta.transactions.join(', ')}</div>
                        )} */}
                        {/* show any other meta keys */}
                        {Object.keys(parsedMeta).filter(k => !['date_from', 'date_to', 'disputed_amount', 'transactions'].includes(k)).map((k) => (
                          <div key={k}><strong>{k}:</strong> {String(parsedMeta[k])}</div>
                        ))}
                      </div>
                    )}
                  />
                )}
                {ticket.last_response_at && <DetailRow label="Last Response" value={formatDate(ticket.last_response_at)} />}
              </DetailCard>

              {(ticket.disputed_amount || ticket.expected_amount || ticket.customer_charged_amount || ticket.settlement_impact_amount) && (
                <DetailCard title="Financial Information">
                  {ticket.disputed_amount && <DetailRow label="Disputed Amount" value={formatCurrency(ticket.disputed_amount)} />}
                  {ticket.expected_amount && <DetailRow label="Expected Amount" value={formatCurrency(ticket.expected_amount)} />}
                  {ticket.customer_charged_amount && <DetailRow label="Customer Charged" value={formatCurrency(ticket.customer_charged_amount)} />}
                  {ticket.settlement_impact_amount && <DetailRow label="Settlement Impact" value={formatCurrency(ticket.settlement_impact_amount)} />}
                </DetailCard>
              )}

              <DetailCard title="Assignment">
                <DetailRow label="Assigned To" value={ticket.assigned_to_type} />
                {ticket.assigned_to_partner_id && <DetailRow label="Partner ID" value={ticket.assigned_to_partner_id} />}
                {ticket.assigned_to_xtrapay_user_id && <DetailRow label="Xtrapay User ID" value={ticket.assigned_to_xtrapay_user_id} />}
              </DetailCard>

              {ticket.escalated_to_xtrapay_at && (
                <DetailCard title="Escalation">
                  <DetailRow label="Escalated At" value={formatDate(ticket.escalated_to_xtrapay_at)} />
                  <DetailRow label="Escalated By" value={`Partner User #${ticket.escalated_by_partner_user_id}`} />
                </DetailCard>
              )}

              {ticket.closed_at && (
                <DetailCard title="Closure Information">
                  <DetailRow label="Closed At" value={formatDate(ticket.closed_at)} />
                  <DetailRow label="Closed By" value={`${ticket.closed_by_type} #${ticket.closed_by_id}`} />
                  {ticket.closed_reason && <DetailRow label="Reason" value={ticket.closed_reason} />}
                </DetailCard>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-4">
          <DetailCard title="Quick Info">
            <DetailRow label="Ticket Ref" value={<span className="font-mono text-xs">{ticket.ticket_ref}</span>} />
            <DetailRow label="Status" value={<Badge className={getStatusColor(ticket.status)}>{ticket.status?.replace(/_/g, ' ').charAt(0).toUpperCase() + ticket.status?.replace(/_/g, ' ').slice(1)}</Badge>} />
            <DetailRow label="Priority" value={<Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>} />
            <DetailRow label="Created" value={formatDate(ticket.created_at)} />
            {ticket.last_response_at && <DetailRow label="Last Response" value={formatDate(ticket.last_response_at)} />}
          </DetailCard>

          {ticket.category && (
            <DetailCard title="Category">
              <DetailRow label="Name" value={ticket.category.name} />
              {ticket.category.description && (
                <div className="text-sm text-muted-foreground mt-2">{ticket.category.description}</div>
              )}
            </DetailCard>
          )}

          {ticket.agent && (
            <DetailCard title="Agent">
              <DetailRow label="Name" value={ticket.agent.name || ticket.agent.business_name} />
              <DetailRow label="Code" value={ticket.agent.code} />
              {ticket.agent.phone && <DetailRow label="Phone" value={ticket.agent.phone} />}
            </DetailCard>
          )}

          {ticket.terminal && (
            <DetailCard title="Terminal">
              <DetailRow label="Terminal ID" value={ticket.terminal.terminal_id} />
              <DetailRow label="Serial" value={ticket.terminal.serial_number} />
              {ticket.terminal.status && <DetailRow label="Status" value={ticket.terminal.status} />}
            </DetailCard>
          )}

          {ticket.attachments && ticket.attachments.length > 0 && (
            <DetailCard title="Attachments">
              {ticket.attachments.map((a: any) => {
                const fileName = a.file_path?.split('/').pop() || a.file_name || 'attachment';
                const isImage = a.file_type?.startsWith('image/');
                const isPdf = a.file_type === 'application/pdf';
                return (
                  <a
                    key={a.id}
                    href={a.full_url || a.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded border hover:bg-muted/50 transition-colors mb-1"
                  >
                    {isImage ? (
                      <Image className="h-4 w-4 flex-shrink-0" />
                    ) : isPdf ? (
                      <FileText className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <File className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate">{fileName}</span>
                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                      {a.file_size ? (a.file_size / 1024).toFixed(1) : '—'} KB
                    </span>
                  </a>
                );
              })}
            </DetailCard>
          )}
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Ticket Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  {user?.loginType === 'partner' && (
                    <>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </>
                  )}
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Comment (Optional)</Label>
              <Textarea value={statusComment} onChange={(e) => setStatusComment(e.target.value)} rows={3} placeholder="Add a comment about this status change..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusChange} disabled={!selectedStatus || updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? 'Updating…' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate to Xtrapay</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for Escalation</Label>
              <Textarea value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} rows={4} placeholder="Explain why this ticket needs to be escalated..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEscalate} disabled={!escalateReason.trim() || escalateMutation.isPending}>
              {escalateMutation.isPending ? 'Escalating…' : 'Escalate Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
