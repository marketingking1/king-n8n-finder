import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TimeSeriesData } from '@/types/dashboard';
import { formatROAS } from '@/lib/formatters';

interface ROASChartProps {
  data: TimeSeriesData[];
}

export function ROASChart({ data }: ROASChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ROAS ao Longo do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="roasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-green))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-green))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="data" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, 'auto']}
                tickFormatter={(value) => `${value.toFixed(1)}x`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [formatROAS(value), 'ROAS']}
              />
              <ReferenceLine 
                y={1.5} 
                stroke="hsl(var(--chart-green))" 
                strokeDasharray="5 5"
                label={{ 
                  value: 'Meta 1.5x', 
                  fill: 'hsl(var(--chart-green))',
                  position: 'right',
                }}
              />
              <ReferenceLine 
                y={1.3} 
                stroke="hsl(var(--warning))" 
                strokeDasharray="5 5"
                label={{ 
                  value: 'Alerta 1.3x', 
                  fill: 'hsl(var(--warning))',
                  position: 'right',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="roas" 
                stroke="hsl(var(--chart-green))" 
                strokeWidth={2}
                fill="url(#roasGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
