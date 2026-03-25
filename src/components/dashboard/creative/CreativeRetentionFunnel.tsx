import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoCreativeRow } from '@/types/creative';
import { deriveMetrics, excelSerialToDate } from '@/lib/creativeSheets';
import { formatNumber } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CreativeRetentionFunnelProps {
  data: VideoCreativeRow[] | null;
  isLoading: boolean;
}

interface FunnelStage {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export function CreativeRetentionFunnel({ data, isLoading }: CreativeRetentionFunnelProps) {
  const funnelData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Aggregate all data
    const totals = data.reduce(
      (acc, row) => {
        const derived = deriveMetrics(row);
        return {
          impressions: acc.impressions + row.impressions,
          views3s: acc.views3s + derived.views3s,
          views25pct: acc.views25pct + derived.views25pct,
          views50pct: acc.views50pct + derived.views50pct,
          views75pct: acc.views75pct + derived.views75pct,
          views100pct: acc.views100pct + derived.views100pct,
        };
      },
      { impressions: 0, views3s: 0, views25pct: 0, views50pct: 0, views75pct: 0, views100pct: 0 }
    );

    const stages: FunnelStage[] = [
      {
        name: 'Impressões',
        value: totals.impressions,
        color: 'hsl(var(--primary))',
        percentage: 100,
      },
      {
        name: 'Views 3s',
        value: totals.views3s,
        color: 'hsl(0, 84%, 60%)',
        percentage: (totals.views3s / totals.impressions) * 100 || 0,
      },
      {
        name: 'Views 25%',
        value: totals.views25pct,
        color: 'hsl(38, 92%, 50%)',
        percentage: (totals.views25pct / totals.impressions) * 100 || 0,
      },
      {
        name: 'Views 50%',
        value: totals.views50pct,
        color: 'hsl(45, 93%, 47%)',
        percentage: (totals.views50pct / totals.impressions) * 100 || 0,
      },
      {
        name: 'Views 75%',
        value: totals.views75pct,
        color: 'hsl(142, 71%, 45%)',
        percentage: (totals.views75pct / totals.impressions) * 100 || 0,
      },
      {
        name: 'Completos',
        value: totals.views100pct,
        color: 'hsl(142, 76%, 36%)',
        percentage: (totals.views100pct / totals.impressions) * 100 || 0,
      },
    ];

    return stages;
  }, [data]);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!funnelData) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base lg:text-lg font-display">Funil de Retenção de Vídeo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = funnelData[0].value;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base lg:text-lg font-display">Funil de Retenção de Vídeo</CardTitle>
        <p className="text-[10px] text-muted-foreground/50">
          Impressões &rarr; Views 3s &rarr; 25% &rarr; 50% &rarr; 75% &rarr; Completos
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
        {funnelData.map((stage, index) => (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs lg:text-sm font-medium text-foreground">{stage.name}</span>

                <div className="flex items-center gap-4">
                  {index > 0 && funnelData[index - 1].value > 0 && (
                    <span className="text-[10px] text-muted-foreground/70">
                      {((stage.value / funnelData[index - 1].value) * 100).toFixed(1)}% do anterior
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatNumber(stage.value)} ({stage.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="h-8 lg:h-10 bg-muted/30 rounded-md overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stage.value / maxValue) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-md"
                  style={{ backgroundColor: stage.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
