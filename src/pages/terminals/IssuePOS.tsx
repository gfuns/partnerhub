import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FormSection } from '@/components/FormSection';
import { FormField } from '@/components/FormField';
import { SuccessModal } from '@/components/SuccessModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const mockAgents = [
  { id: '1', name: 'ABC Enterprises' },
  { id: '2', name: 'XYZ Holdings' },
  { id: '3', name: 'Quick Mart' },
  { id: '4', name: 'Delta Services' },
];

export default function IssuePOS() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedTerminalId, setGeneratedTerminalId] = useState('');
  const [formData, setFormData] = useState({
    agentId: '',
    terminalLabel: '',
    enableTransactions: true,
    enableMonitoring: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agentId) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const newTerminalId = `TRM-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    setGeneratedTerminalId(newTerminalId);
    setShowSuccess(true);
    setIsSubmitting(false);
  };

  return (
    <div>
      <PageHeader
        title="Issue POS"
        description="Create a new terminal and assign it to an agent."
        actions={
          <Button variant="ghost" onClick={() => navigate('/terminals')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Terminals
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardContent className="pt-6">
              <FormSection title="Terminal Information">
                <FormField label="Terminal ID">
                  <Input value="Auto-generated" disabled className="bg-muted" />
                </FormField>

                <FormField label="Agent" required>
                  <Select value={formData.agentId} onValueChange={(v) => setFormData(prev => ({ ...prev, agentId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Terminal Label / Alias">
                  <Input
                    value={formData.terminalLabel}
                    onChange={(e) => setFormData(prev => ({ ...prev, terminalLabel: e.target.value }))}
                    placeholder="Optional label for this terminal"
                  />
                </FormField>
              </FormSection>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FormSection title="Configuration">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Transactions</Label>
                    <p className="text-sm text-muted-foreground">Allow this terminal to process transactions</p>
                  </div>
                  <Switch checked={formData.enableTransactions} onCheckedChange={(c) => setFormData(prev => ({ ...prev, enableTransactions: c }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Live Monitoring</Label>
                    <p className="text-sm text-muted-foreground">Track terminal status in real-time</p>
                  </div>
                  <Switch checked={formData.enableMonitoring} onCheckedChange={(c) => setFormData(prev => ({ ...prev, enableMonitoring: c }))} />
                </div>
              </FormSection>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting || !formData.agentId}>
              {isSubmitting ? 'Creating...' : 'Issue Terminal'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/terminals')}>Cancel</Button>
          </div>
        </div>
      </form>

      <SuccessModal
        open={showSuccess}
        onOpenChange={setShowSuccess}
        title="Terminal Created Successfully"
        details={[
          { label: 'Terminal ID', value: generatedTerminalId },
          { label: 'Status', value: 'Active' },
        ]}
        onClose={() => navigate('/terminals')}
        closeLabel="View Terminals"
      />
    </div>
  );
}
