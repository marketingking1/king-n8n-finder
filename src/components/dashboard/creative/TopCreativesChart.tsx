import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AggregatedCreative } from '@/types/creative';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

interface TopCreativesChartProps {
  data: AggregatedCreative[];
  isLoading: boolean;
}

export function TopCreativesChart({ data, isLoading }: TopCreativesChartProps) {
  const chartData = useMemo(() => {
    // Filter creatives with enough impressions and sort by hook rate
    return data
      .filter((c) => c.totalImpressions > 100)
      .sort((a, b) => b.avgHookRate - a.avgHookRate)
      .slice(0, 10)
      .map((c) => ({
        name: c.displayName.length > 20 ? c.displayName.slice(0, 20) + '...' : c.displayName,
        fullName: c.displayName,
        hookRate: c.avgHookRate,
        impressions: c.totalImpressions,
        leads: c.totalLeads,
        cpl: c.avgCpl,
      }));
  }, [data]);

  const getBarColor = (hookRate: number) => {
    if (hookRate >= 25) return 'hsl(142, 76%, 36%)';
    if (hookRate >= 15) return 'hsl(38, 92%, 50%)';
    return 'hsl(0, 84%, 60%)';
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
          <CardTitle className="text-base lg:text-lg font-display">Top 10 Criativos por Hook Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            Nenhum criativo com impressões suficientes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base lg:text-lg font-display">Top 10 Criativos por Hook Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] lg:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                type="number"
                domain={[0, 'dataMax']}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={120}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-sm text-foreground mb-2">{data.fullName}</p>
                        <div className="space-y-1 text-xs">
                          <p className="text-muted-foreground">
                            Hook Rate: <span className="text-foreground font-medium">{data.hookRate.toFixed(2)}%</span>
                          </p>
                          <p className="text-muted-foreground">
                            Impressões: <span className="text-foreground font-medium">{data.impressions.toLocaleString('pt-BR')}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Leads: <span className="text-foreground font-medium">{data.leads}</span>
                          </p>
                          <p className="text-muted-foreground">
                            CPL: <span className="text-foreground font-medium">
                              {data.leads > 0 ? `R$ ${data.cpl.toFixed(2)}` : '-'}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                x={25}
                stroke="hsl(142, 76%, 36%)"
                strokeDasharray="5 5"
                label={{
                  value: 'Meta 25%',
                  fill: 'hsl(142, 76%, 36%)',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <Bar
                dataKey="hookRate"
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.hookRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
