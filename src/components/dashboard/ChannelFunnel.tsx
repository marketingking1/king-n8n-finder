import { useMemo } from 'react';
import { ChannelFunnelData } from '@/hooks/useFunnelByChannel';
import { formatNumber, formatPercent } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

interface ChannelFunnelProps {
  data: ChannelFunnelData[];
  isLoading: boolean;
}

const CHANNEL_COLORS: Record<string, string> = {
  'Meta Ads': 'hsl(221, 83%, 53%)',
  'Google Ads': 'hsl(142, 71%, 45%)',
  'LinkedIn': 'hsl(210, 80%, 42%)',
  'Orgânico': 'hsl(270, 50%, 50%)',
  'Indicação': 'hsl(35, 90%, 50%)',
};

const STAGES: { key: keyof Pick<ChannelFunnelData, 'leads' | 'callAgendada' | 'callRealizada' | 'noshow' | 'venda'>; label: string }[] = [
  { key: 'leads', label: 'Leads' },
  { key: 'callAgendada', label: 'Call Agendada' },
  { key: 'callRealizada', label: 'Call Realizada' },
  { key: 'noshow', label: 'No-show' },
  { key: 'venda', label: 'Venda' },
];

// Rate key between consecutive stages
const RATE_BETWEEN: { from: string; to: string; rateKey: keyof Pick<ChannelFunnelData, 'taxaAgendamento' | 'taxaRealizacao' | 'taxaNoshow' | 'taxaVenda'> }[] = [
  { from: 'leads', to: 'callAgendada', rateKey: 'taxaAgendamento' },
  { from: 'callAgendada', to: 'callRealizada', rateKey: 'taxaRealizacao' },
  { from: 'callRealizada', to: 'noshow', rateKey: 'taxaNoshow' },
  { from: 'noshow', to: 'venda', rateKey: 'taxaVenda' },
];

export function ChannelFunnel({ data, isLoading }: ChannelFunnelProps) {
  // Find max value across all stages for scaling
  const maxValue = useMemo(() => {
    if (!data.length) return 1;
    let max = 0;
    for (const row of data) {
      for (const stage of STAGES) {
        if (row[stage.key] > max) max = row[stage.key];
      }
    }
    return max || 1;
  }, [data]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <h3 className="text-base font-display font-semibold text-foreground">Funil por Canal</h3>
        <p className="text-center text-muted-foreground text-sm mt-4">Sem dados disponíveis</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="mb-6">
        <h3 className="text-base font-display font-semibold text-foreground">Funil por Canal</h3>
        <p className="text-xs text-muted-foreground mt-1">Lead → Call Agendada → Call Realizada → No-show → Venda</p>
      </div>

      {/* Funnel stages */}
      <div className="space-y-5">
        {STAGES.map((stage, stageIdx) => {
          // Calculate total for this stage
          const stageTotal = data.reduce((sum, row) => sum + row[stage.key], 0);

          return (
            <div key={stage.key}>
              {/* Stage label and total */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stage.label}</span>
                <span className="text-sm font-display font-bold text-foreground">{formatNumber(stageTotal)}</span>
              </div>

              {/* Bars per channel */}
              <div className="space-y-1.5">
                {data.map(row => {
                  const value = row[stage.key];
                  const widthPct = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 2 : 0) : 0;
                  const color = CHANNEL_COLORS[row.canal] ?? 'hsl(0, 0%, 50%)';

                  return (
                    <div key={row.canal} className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground w-20 text-right truncate">{row.canal}</span>
                      <div className="flex-1 h-5 bg-muted/20 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{ width: `${widthPct}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground w-14 text-right tabular-nums">
                        {formatNumber(value)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Conversion rate between this stage and next */}
              {stageIdx < RATE_BETWEEN.length && (
                <div className="flex justify-center mt-2">
                  <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-[hsl(216,30%,16%)] border border-border">
                    {(() => {
                      const rate = RATE_BETWEEN[stageIdx];
                      const totalFrom = data.reduce((s, r) => s + (r[rate.from as keyof ChannelFunnelData] as number), 0);
                      const totalTo = data.reduce((s, r) => s + (r[rate.to as keyof ChannelFunnelData] as number), 0);
                      const pct = totalFrom > 0 ? (totalTo / totalFrom) * 100 : 0;
                      return `→ ${formatPercent(pct)}`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border">
        {data.map(row => (
          <div key={row.canal} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: CHANNEL_COLORS[row.canal] ?? 'hsl(0, 0%, 50%)' }}
            />
            <span className="text-xs text-muted-foreground">{row.canal}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
