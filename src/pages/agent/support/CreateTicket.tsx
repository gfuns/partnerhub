import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supportService } from '@/services/api/support.service';
import { TicketCategory } from '@/types/support';

export default function CreateTicket() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [terminals, setTerminals] = useState<Array<{ id: number; terminal_id: string }>>([]);
  
  const [formData, setFormData] = useState({
    category_id: '',
    subject: '',
    description: '',
    terminal_id: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await supportService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      // Mock categories
      setCategories([
        { id: 1, name: 'Terminal Issue', slug: 'terminal-issue', requires_terminal: true, requires_agent: false, default_priority: 'medium', is_active: true },
        { id: 2, name: 'Transaction Dispute', slug: 'transaction-dispute', requires_terminal: true, requires_agent: false, default_priority: 'high', is_active: true },
        { id: 3, name: 'Account Query', slug: 'account-query', requires_terminal: false, requires_agent: false, default_priority: 'low', is_active: true },
        { id: 4, name: 'Settlement Issue', slug: 'settlement-issue', requires_terminal: false, requires_agent: false, default_priority: 'high', is_active: true },
      ]);
      // Mock terminals
      setTerminals([
        { id: 1, terminal_id: 'TID001' },
        { id: 2, terminal_id: 'TID002' },
      ]);
    }
  };

  const selectedCategory = categories.find(c => c.id.toString() === formData.category_id);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.category_id) newErrors.category_id = 'Please select a category';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (selectedCategory?.requires_terminal && !formData.terminal_id) {
      newErrors.terminal_id = 'This category requires a terminal';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsLoading(true);
      await supportService.createAgentTicket({
        category_id: parseInt(formData.category_id),
        subject: formData.subject,
        description: formData.description,
        terminal_id: formData.terminal_id ? parseInt(formData.terminal_id) : undefined,
      });
      toast({ title: 'Success', description: 'Support ticket created successfully' });
      navigate('/support');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create ticket' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Support Ticket"
        description="Submit a new support request"
        actions={
          <Button variant="ghost" onClick={() => navigate('/support')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="text-sm text-destructive">{errors.category_id}</p>}
            </div>

            {selectedCategory?.requires_terminal && (
              <div className="space-y-2">
                <Label>Terminal *</Label>
                <Select value={formData.terminal_id} onValueChange={(v) => setFormData({ ...formData, terminal_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a terminal" />
                  </SelectTrigger>
                  <SelectContent>
                    {terminals.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.terminal_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.terminal_id && <p className="text-sm text-destructive">{errors.terminal_id}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief summary of your issue"
              />
              {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide details about your issue..."
                rows={5}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Ticket
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/support')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
