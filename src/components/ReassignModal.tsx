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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { FormField } from './FormField';
import { Label } from '@/components/ui/label';

interface Agent {
  id: string;
  name: string;
}

interface Bank {
  id: number;
  name: string;
  code: string;
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
  banks?: Bank[];
  onConfirm: (agentId: string, virtualAccountData?: {
    bank_id: number;
    account_number: string;
    account_name: string;
  }) => void;
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
  banks = [],
  onConfirm,
}: ReassignModalProps) {
  const [selectedAgent, setSelectedAgent] = useState('');
  const [hasVirtualAccount, setHasVirtualAccount] = useState(false);
  const [bankId, setBankId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const handleConfirm = () => {
    if (!selectedAgent) return;

    let virtualAccountData;
    if (hasVirtualAccount && bankId && accountNumber && accountName) {
      virtualAccountData = {
        bank_id: Number(bankId),
        account_number: accountNumber,
        account_name: accountName,
      };
    }

    onConfirm(selectedAgent, virtualAccountData);
    
    // Reset form
    setSelectedAgent('');
    setHasVirtualAccount(false);
    setBankId('');
    setAccountNumber('');
    setAccountName('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset form
    setSelectedAgent('');
    setHasVirtualAccount(false);
    setBankId('');
    setAccountNumber('');
    setAccountName('');
  };

  const isFormValid = () => {
    if (!selectedAgent) return false;
    if (hasVirtualAccount) {
      return bankId && accountNumber.length === 10 && accountName.trim().length > 0;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title || 'Reassign Terminal'}</DialogTitle>
          <DialogDescription>
            {description || `Reassign terminal ${terminalId} from ${currentAgent} to another agent.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <FormField label="New Agent" required>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents
                  .filter(agent => agent.id !== currentAgentId)
                  .map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasVirtualAccount"
              checked={hasVirtualAccount}
              onCheckedChange={(checked) => setHasVirtualAccount(checked as boolean)}
            />
            <Label
              htmlFor="hasVirtualAccount"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Setup virtual account for this terminal
            </Label>
          </div>

          {hasVirtualAccount && (
            <div className="space-y-4 pl-6 border-l-2 border-muted">
              <FormField label="Bank" required>
                <Select value={bankId} onValueChange={setBankId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id.toString()}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Account Number" required>
                <Input
                  type="text"
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setAccountNumber(value);
                  }}
                  maxLength={10}
                />
                {accountNumber && accountNumber.length !== 10 && (
                  <p className="text-xs text-destructive mt-1">Account number must be 10 digits</p>
                )}
              </FormField>

              <FormField label="Account Name" required>
                <Input
                  type="text"
                  placeholder="Enter account name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  maxLength={255}
                />
              </FormField>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isFormValid()}>
            Reassign Terminal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
