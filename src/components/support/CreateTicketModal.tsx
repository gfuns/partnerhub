import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supportService, Category, CreateTicketRequest } from '@/services/api/support.service';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateTicketModal({ open, onOpenChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) loadCategories();
  }, [open]);

  const loadCategories = async () => {
    try {
      const resp = await supportService.getCategories();
      setCategories(resp.data || []);
    } catch (err) {
      // ignore
    }
  };

  const handleSubmit = async () => {
    if (!categoryId) return toast({ variant: 'destructive', title: 'Validation', description: 'Please select a category' });
    if (!subject) return toast({ variant: 'destructive', title: 'Validation', description: 'Please provide a subject' });

    const payload: CreateTicketRequest = {
      category_id: categoryId as number,
      subject,
      description,
    };

    try {
      const resp = await supportService.createTicket(payload, attachments.length ? attachments : undefined);
      toast({ title: 'Ticket Created', description: 'Ticket was created successfully' });
      onOpenChange(false);
      const newId = resp?.data?.id || resp?.data?.ticket_id || resp?.data?.ticket?.id;
      if (newId) navigate(`/support/${newId}`);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Create Failed', description: err?.message || 'Unable to create ticket' });
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setAttachments(Array.from(files));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-sm block mb-1">Category</label>
            <Select onValueChange={(v) => setCategoryId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm block mb-1">Subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div>
            <label className="text-sm block mb-1">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="text-sm block mb-1">Attachments</label>
            <input ref={fileRef} type="file" multiple onChange={handleFiles} />
            {attachments.length > 0 && <div className="text-sm text-muted-foreground mt-1">{attachments.length} file(s) selected</div>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit Ticket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
