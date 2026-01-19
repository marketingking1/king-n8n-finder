import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from '@/types/dashboard';
import { formatNumber } from '@/lib/formatters';
import { ChartCard } from './ChartCard';

interface ImpressionsChartProps {
  data: TimeSeriesData[];
}

export function ImpressionsChart({ data }: ImpressionsChartProps) {
  return (
    <ChartCard title="Quanto tivemos de impressão por dia">
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
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [formatNumber(value), 'Impressões']}
          />
          <Line 
            type="monotone" 
            dataKey="impressoes" 
            stroke="hsl(var(--chart-pink))" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}