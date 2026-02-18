import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supportService } from '@/services/api/support.service';
import { useQueryClient } from '@tanstack/react-query';
import { TicketCategory, CreateTicketRequest } from '@/types/support';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { terminalsService } from '@/services/api/terminals.service';
import { transactionsService } from '@/services/api/transactions.service';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateTicketModal({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [terminals, setTerminals] = useState<Array<any>>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<number | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [transactionQuery, setTransactionQuery] = useState('');
  const [transactionResults, setTransactionResults] = useState<any[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [amount, setAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const login_type = localStorage.getItem('login_type') || 'partner';

  useEffect(() => {
    if (open) {
      loadCategories();
      loadTerminals();
      loadAgents();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedTerminal(null);
    setTransactionQuery('');
    setTransactionResults([]);
    setSelectedTransactions([]);
    setSubject('');
    setDescription('');
    setAttachments([]);
  };

  const loadCategories = async () => {
    try {
      const resp = await supportService.getCategories();
      setCategories(resp.data || []);
    } catch (err) {
      setCategories([]);
    }
  };

  const loadTerminals = async () => {
    try {
      const resp = await terminalsService.getTerminals({ per_page: 100 });
      setTerminals(resp.data || []);
    } catch (err) {
      setTerminals([]);
    }
  };

  const loadAgents = async () => {
    try {
      const resp = await (await import('@/services/api/agents.service')).agentsService.getAgents({ per_page: 100 });
      setAgents((resp as any).data || []);
    } catch (err) {
      setAgents([]);
    }
  };

  const searchTransactions = async (q: string) => {
    try {
      const resp = await transactionsService.getTransactions({ search: q, per_page: 10 });
      setTransactionResults(resp.data || []);
    } catch (err) {
      setTransactionResults([]);
    }
  };

  const handleAddTransaction = (tx: any) => {
    if (selectedTransactions.find((t) => t.id === tx.id)) return;
    setSelectedTransactions((s) => [...s, tx]);
  };

  const handleRemoveTransaction = (id: number) => {
    setSelectedTransactions((s) => s.filter((t) => t.id !== id));
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const arr = Array.from(files);
    const maxBytes = 8 * 1024 * 1024; // 8MB
    const validated: File[] = [];

    const mapEvidenceTypesToMime = (types?: string[]) => {
      if (!types || types.length === 0) {
        return { prefixes: ['image', 'application'], exact: ['application/pdf'] };
      }
      const prefixes = new Set<string>();
      const exact = new Set<string>();
      for (const t of types) {
        switch (t) {
          case 'screenshot':
          case 'receipt':
            prefixes.add('image');
            exact.add('application/pdf');
            break;
          case 'bank_statement':
            exact.add('application/pdf');
            prefixes.add('image');
            break;
          default:
            prefixes.add('image');
            exact.add('application/pdf');
        }
      }
      return { prefixes: Array.from(prefixes), exact: Array.from(exact) };
    };

    const { prefixes, exact } = mapEvidenceTypesToMime(selectedCategory?.evidence_types);

    for (const f of arr) {
      if (f.size > maxBytes) {
        toast({ variant: 'destructive', title: 'File too large', description: `${f.name} exceeds 8MB limit` });
        continue;
      }

      const matchesExact = exact.includes(f.type);
      const matchesPrefix = prefixes.some((p) => f.type.startsWith(p + '/'));
      if (!matchesExact && !matchesPrefix) {
        toast({ variant: 'destructive', title: 'Invalid file type', description: `${f.name} is not an allowed evidence type` });
        continue;
      }

      validated.push(f);
    }

    setAttachments((s) => [...s, ...validated]);
  };

  const renderPreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <img src={URL.createObjectURL(file)} alt={file.name} className="h-20 object-contain" />;
    }
    return <div className="text-sm">{file.name}</div>;
  };

  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const validateStep = (): { valid: boolean; message?: string } => {
    if (step === 1 && !selectedCategory) return { valid: false, message: 'Please select a category' };
    if (step === 2 && selectedCategory?.requires_terminal && !selectedTerminal) return { valid: false, message: 'Please select a terminal' };
    if (step === 2 && selectedCategory?.requires_agent && !selectedAgent) return { valid: false, message: 'Please select an agent' };
    if (step === 2 && selectedCategory?.requires_transaction && selectedTransactions.length === 0) return { valid: false, message: 'Please select at least one transaction' };
    if (step === 2 && selectedCategory && !selectedCategory.allows_multiple_transactions && selectedTransactions.length > 1) return { valid: false, message: 'This category only allows a single transaction' };
    if (step === 2 && selectedCategory?.requires_amount && !amount) return { valid: false, message: 'Please provide the required amount' };
    if (step === 2 && selectedCategory?.requires_date_range && (!startDate || !endDate)) return { valid: false, message: 'Please provide the required date range' };
    if (step === 3 && !subject.trim()) return { valid: false, message: 'Subject is required' };
    if (step === 3 && selectedCategory?.requires_evidence && attachments.length === 0) return { valid: false, message: 'This category requires evidence' };
    return { valid: true };
  };

  const handleSubmit = async () => {
    const v = validateStep();
    if (!v.valid) return toast({ variant: 'destructive', title: 'Validation', description: v.message });

    const meta: any = {};
    if (startDate) meta.date_from = startDate;
    if (endDate) meta.date_to = endDate;
    if (amount) meta.disputed_amount = Number(amount);

    const payload: any = {
      support_category_id: selectedCategory!.id,
      subject,
      description,
      terminal_id: selectedTerminal ?? null,
      agent_id: selectedAgent ?? null,
      disputed_amount: amount ? Number(amount) : null,
      // include both names: backend expects date_from/date_to, service multipart branch expects start_date/end_date
      date_from: startDate || null,
      date_to: endDate || null,
      start_date: startDate || null,
      end_date: endDate || null,
      transactions: selectedTransactions.length ? selectedTransactions.map((t) => t.id) : null,
      origin: login_type === 'agent' ? 'agent_dashboard' : 'partner_hub',
      attachments: attachments.length ? attachments : null,
      meta: Object.keys(meta).length ? meta : null,
    };
    console.log(payload);


    // try {
    const resp = await supportService.createTicket(payload);
    toast({ title: 'Ticket Created', description: 'Ticket created successfully' });
    // Refresh ticket list
    try { qc.invalidateQueries({ queryKey: ['support_tickets'] }); } catch (e) { qc.invalidateQueries(['support_tickets']); }
    onOpenChange(false);
    const newId = resp?.data?.ticket?.id;
    if (newId) navigate(`/support/${newId}`);
    // } catch (err: any) {
    //   toast({ variant: 'destructive', title: 'Create Failed', description: err?.message || 'Unable to create ticket' });
    // }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step indicator */}
          <div className="text-sm text-muted-foreground">Step {step} of 4</div>

          {step === 1 && (
            <div>
              <label className="block text-sm mb-2">Select Category</label>
              <div className="grid gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c)}
                    className={`text-left p-3 border rounded-md ${selectedCategory?.id === c.id ? 'border-primary' : 'border-muted'}`}>
                    <div className="font-medium">{c.name}</div>
                    {c.description && <div className="text-xs text-muted-foreground mt-1">{c.description}</div>}
                    <div className="text-xs text-muted-foreground mt-1">Requires terminal: {c.requires_terminal ? 'Yes' : 'No'}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedCategory && (
            <div>
              <label className="block text-sm mb-2">Context</label>
              {selectedCategory.requires_terminal && (
                <div className="mb-3">
                  <label className="text-sm block mb-1">Terminal</label>
                  <Select value={selectedTerminal ? String(selectedTerminal) : ''} onValueChange={(v) => setSelectedTerminal(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terminal" />
                    </SelectTrigger>
                    <SelectContent>
                      {terminals.map((t: any) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name ?? t.terminal_id ?? t.serial_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedCategory.requires_agent && (
                <div className="mb-3">
                  <label className="text-sm block mb-1">Agent</label>
                  <Select value={selectedAgent ? String(selectedAgent) : ''} onValueChange={(v) => setSelectedAgent(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((a: any) => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.business_name || a.contact_name || a.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedCategory.requires_amount && (
                <div className="mb-3">
                  <label className="text-sm block mb-1">Amount</label>
                  <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
                </div>
              )}

              {selectedCategory.requires_date_range && (
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm block mb-1">Start Date</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm block mb-1">End Date</label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
              )}

              {selectedCategory.requires_transaction && (
                <div>
                  <label className="text-sm block mb-1">Search Transactions</label>
                  <div className="flex gap-2">
                    <Input value={transactionQuery} onChange={(e) => setTransactionQuery(e.target.value)} placeholder="Search by trx, rrn, ref, amount" />
                    <Button onClick={() => searchTransactions(transactionQuery)}>Search</Button>
                  </div>
                  <div className="mt-2 space-y-2 max-h-40 overflow-auto">
                    {transactionResults.map((tx) => (
                      <div key={tx.id} className="p-2 border rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-medium">{tx.trx} • {tx.amount_formatted}</div>
                          <div className="text-xs text-muted-foreground">{tx.rrn} • {tx.created_at}</div>
                        </div>
                        <div>
                          <Button size="sm" onClick={() => handleAddTransaction(tx)}>Add</Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedTransactions.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium">Selected Transactions</div>
                      <div className="space-y-2 mt-2">
                        {selectedTransactions.map((t) => (
                          <div key={t.id} className="p-2 border rounded-md flex justify-between items-center">
                            <div className="text-sm">{t.trx} • {t.amount_formatted}</div>
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveTransaction(t.id)}>Remove</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="text-sm block mb-1">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />

              <label className="text-sm block mb-1 mt-3">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />

              <div className="mt-3">
                <label className="text-sm block mb-1">Attachments</label>
                <input ref={fileRef} type="file" multiple onChange={handleFiles} />
                {selectedCategory?.requires_evidence && selectedCategory.evidence_types && (
                  <div className="text-sm text-muted-foreground mt-2">Required evidence: {selectedCategory.evidence_types.join(', ')}</div>
                )}
                {attachments.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {attachments.map((f, idx) => (
                      <div key={idx} className="p-2 border rounded-md">
                        {renderPreview(f)}
                        <div className="text-xs mt-1">{f.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="space-y-2">
                <div><span className="text-sm text-muted-foreground">Category</span><div className="font-medium">{selectedCategory?.name}</div></div>
                <div><span className="text-sm text-muted-foreground">Terminal</span><div className="font-medium">{terminals.find(t => t.id === selectedTerminal)?.name ?? '—'}</div></div>
                <div><span className="text-sm text-muted-foreground">Transactions</span>
                  <div className="mt-2 space-y-1">{selectedTransactions.length ? selectedTransactions.map(t => <div key={t.id} className="text-sm">{t.trx} • {t.amount_formatted}</div>) : <div className="text-sm">—</div>}</div>
                </div>
                <div><span className="text-sm text-muted-foreground">Subject</span><div className="font-medium">{subject || '—'}</div></div>
                <div><span className="text-sm text-muted-foreground">Description</span><div className="font-medium whitespace-pre-wrap">{description || '—'}</div></div>
                <div><span className="text-sm text-muted-foreground">Attachments</span><div className="font-medium">{attachments.length} file(s)</div></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full justify-between">
            <div>
              {step > 1 && <Button variant="ghost" onClick={prev}>Back</Button>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              {step < 4 && <Button onClick={() => { const v = validateStep(); if (!v.valid) return toast({ variant: 'destructive', title: 'Validation', description: v.message }); next(); }}>Next</Button>}
              {step === 4 && <Button onClick={handleSubmit}>Submit Ticket</Button>}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
