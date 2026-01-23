import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type Props = {
  startDate?: string;
  endDate?: string;
  onChange: (start?: string, end?: string) => void;
};

export default function DateRangePicker({ startDate, endDate, onChange }: Props) {
  const [preset, setPreset] = React.useState('custom');

  const applyPreset = (p: string) => {
    setPreset(p);
    const today = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (p) {
      case 'today':
        start = end = today;
        break;
      case 'yesterday':
        start = end = new Date(Date.now() - 86400000);
        break;
      case 'last7':
        end = today;
        start = new Date(Date.now() - 6 * 86400000);
        break;
      case 'last30':
        end = today;
        start = new Date(Date.now() - 29 * 86400000);
        break;
      default:
        // custom
        break;
    }

    if (start && end) {
      const s = start.toISOString().slice(0, 10);
      const e = end.toISOString().slice(0, 10);
      onChange(s, e);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Select value={preset} onValueChange={(v) => applyPreset(v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="last7">Last 7 Days</SelectItem>
          <SelectItem value="last30">Last 30 Days</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input className="h-9" type="date" value={startDate || ''} onChange={(e) => onChange(e.target.value, endDate)} />
        <span className="text-muted-foreground">to</span>
        <Input className="h-9" type="date" value={endDate || ''} onChange={(e) => onChange(startDate, e.target.value)} />
      </div>
    </div>
  );
}
