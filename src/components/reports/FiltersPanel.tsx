import React, { useEffect, useState } from 'react';
import DateRangePicker from './DateRangePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
  startDate?: string;
  endDate?: string;
  onRangeChange: (start?: string, end?: string) => void;
  onRun?: () => void;
  children?: React.ReactNode;
  showRun?: boolean;
};

export default function FiltersPanel({ startDate, endDate, onRangeChange, onRun, children, showRun = true }: Props) {
  const getIsoToday = () => new Date().toISOString().slice(0, 10);

  const [localStartDate, setLocalStartDate] = useState<string | undefined>(() => startDate ?? getIsoToday());
  const [localEndDate, setLocalEndDate] = useState<string | undefined>(() => endDate ?? getIsoToday());

  useEffect(() => {
    if (startDate !== undefined) {
      setLocalStartDate(startDate);
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate !== undefined) {
      setLocalEndDate(endDate);
    }
  }, [endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRangeChange) {
      onRangeChange(localStartDate, localEndDate);
    }
  };

  return (
    <Card className="mb-6 border-muted-foreground/10 shadow-none">
      <CardContent className="p-4">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Row 1: date range */}
          <div>
            <DateRangePicker
              startDate={localStartDate}
              endDate={localEndDate}
              onChange={(s?: string, e?: string) => {
                setLocalStartDate(s);
                setLocalEndDate(e);
              }}
            />
          </div>

          {/* Row 2: children (filters) and Run button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {children}
              </div>
            </div>

            {showRun && (
              <div className="flex-shrink-0">
                <Button type="submit" className="w-full md:w-auto">
                  Run Report
                </Button>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
