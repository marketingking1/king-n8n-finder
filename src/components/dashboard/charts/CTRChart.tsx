import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from '@/types/dashboard';
import { ChartCard } from './ChartCard';

interface CTRChartProps {
  data: TimeSeriesData[];
}

/**
 * CTR Semanal - O CTR já vem calculado corretamente em TimeSeriesData:
 * CTR = SUM(cliques) / SUM(impressões) × 100 (após agregação por período)
 * 
 * NÃO usar média de CTR diário - usar dados já agregados.
 */
export function CTRChart({ data }: CTRChartProps) {
  return (
    <ChartCard title="CTR por semana">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <XAxis 
            dataKey="data" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, 'CTR']}
          />
          <Line 
            type="monotone" 
            dataKey="ctr" 
            stroke="hsl(var(--chart-purple))" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}