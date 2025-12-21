import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from './FormField';

interface Agent {
  id: string;
  name: string;
}

interface ReassignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terminalId?: string;
  title?: string;
  description?: string;
  currentAgent?: string;
  currentAgentId?: string;
  agents: Agent[];
  onConfirm: (agentId: string) => void;
}

export function ReassignModal({
  open,
  onOpenChange,
  terminalId,
  title,
  description,
  currentAgent,
  currentAgentId,
  agents,
  onConfirm,
}: ReassignModalProps) {
  const [selectedAgent, setSelectedAgent] = useState('');

  const handleConfirm = () => {
    if (selectedAgent) {
      onConfirm(selectedAgent);
      setSelectedAgent('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || 'Reassign Terminal'}</DialogTitle>
          <DialogDescription>
            {description || `Reassign terminal ${terminalId} from ${currentAgent} to another agent.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <FormField label="New Agent" required>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedAgent}>
            Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
