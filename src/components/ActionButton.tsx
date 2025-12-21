import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActionButtonProps {
  icon: LucideIcon;
  label?: string;
  tooltip?: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'ghost';
  disabled?: boolean;
}

export function ActionButton({
  icon: Icon,
  label,
  tooltip,
  onClick,
  variant = 'ghost',
  disabled = false,
}: ActionButtonProps) {
  const tooltipText = tooltip || label || '';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className="h-8 w-8"
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
