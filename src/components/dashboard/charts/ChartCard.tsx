import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="glow-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <div className="h-52">
        {children}
      </div>
    </div>
  );
}