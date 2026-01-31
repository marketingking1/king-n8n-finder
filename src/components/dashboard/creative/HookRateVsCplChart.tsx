import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AggregatedCreative } from '@/types/creative';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
  Cell,
} from 'recharts';

interface HookRateVsCplChartProps {
  data: AggregatedCreative[];
  isLoading: boolean;
}

export function HookRateVsCplChart({ data, isLoading }: HookRateVsCplChartProps) {
  const chartData = useMemo(() => {
    // Filter creatives with leads (CPL would be undefined otherwise)
    const withLeads = data.filter((c) => c.totalLeads > 0 && c.totalImpressions > 100);
    
    return withLeads.map((c) => ({
      name: c.displayName,
      hookRate: c.avgHookRate,
      cpl: c.avgCpl,
      spend: c.totalSpend,
      leads: c.totalLeads,
      campanha: c.campanhas[0] || 'N/A',
    }));
  }, [data]);

  const omittedCount = data.filter((c) => c.totalLeads === 0).length;

  // Determine quadrant colors
  const getPointColor = (hookRate: number, cpl: number) => {
    if (hookRate >= 20 && cpl <= 10) return 'hsl(142, 76%, 36%)'; // Winner - green
    if (hookRate < 20 && cpl > 10) return 'hsl(0, 84%, 60%)'; // Review - red
    if (hookRate >= 20 && cpl > 10) return 'hsl(38, 92%, 50%)'; // Potential - yellow
    return 'hsl(217, 91%, 60%)'; // Scale? - blue
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base lg:text-lg font-display">Hook Rate vs CPL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            Nenhum criativo com leads suficientes para análise
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base lg:text-lg font-display">Hook Rate vs CPL</CardTitle>
          {omittedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {omittedCount} criativos sem leads omitidos
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] lg:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                type="number"
                dataKey="hookRate"
                name="Hook Rate"
                unit="%"
                domain={[0, 'dataMax']}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                label={{
                  value: 'Hook Rate (%)',
                  position: 'bottom',
                  offset: 0,
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                }}
              />
              <YAxis
                type="number"
                dataKey="cpl"
                name="CPL"
                unit=" R$"
                reversed
                domain={[0, 'dataMax']}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                label={{
                  value: 'CPL (R$) ↓ melhor',
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                }}
              />
              <ZAxis
                type="number"
                dataKey="spend"
                range={[50, 400]}
                name="Investimento"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-sm text-foreground mb-2">{data.name}</p>
                        <div className="space-y-1 text-xs">
                          <p className="text-muted-foreground">
                            Hook Rate: <span className="text-foreground font-medium">{data.hookRate.toFixed(2)}%</span>
                          </p>
                          <p className="text-muted-foreground">
                            CPL: <span className="text-foreground font-medium">R$ {data.cpl.toFixed(2)}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Investimento: <span className="text-foreground font-medium">R$ {data.spend.toFixed(2)}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Leads: <span className="text-foreground font-medium">{data.leads}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Reference lines for quadrants */}
              <ReferenceLine
                x={20}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                opacity={0.5}
              />
              <ReferenceLine
                y={10}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                opacity={0.5}
              />
              <Scatter name="Criativos" data={chartData}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getPointColor(entry.hookRate, entry.cpl)}
                    fillOpacity={0.8}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 justify-center text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[hsl(142,76%,36%)]" />
            <span className="text-muted-foreground">⭐ Winners</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[hsl(38,92%,50%)]" />
            <span className="text-muted-foreground">Potencial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[hsl(217,91%,60%)]" />
            <span className="text-muted-foreground">Escalar?</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[hsl(0,84%,60%)]" />
            <span className="text-muted-foreground">⚠️ Revisar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
