import { CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  details: { label: string; value: string }[];
  onClose: () => void;
  closeLabel?: string;
}

export function SuccessModal({
  open,
  onOpenChange,
  title,
  details,
  onClose,
  closeLabel = 'Continue',
}: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {details.map((detail, index) => (
            <div key={index} className="flex justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{detail.label}</span>
              <span className="text-sm font-medium font-mono">{detail.value}</span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            {closeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
