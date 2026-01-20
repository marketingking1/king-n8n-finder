import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, children, className }: ChartCardProps) {
  return (
    <div className={cn(
      "rounded-lg border border-border bg-[hsl(215,35%,11%)] p-5",
      "shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
      "hover:border-primary/20 transition-all duration-200",
      className
    )}>
      <div className="mb-4">
        <h3 className="text-sm font-display font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="h-52">
        {children}
      </div>
    </div>
  );
}
