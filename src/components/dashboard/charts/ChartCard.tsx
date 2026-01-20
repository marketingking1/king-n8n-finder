import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4">{title}</h3>
      <div className="h-52">
        {children}
      </div>
    </div>
  );
}
