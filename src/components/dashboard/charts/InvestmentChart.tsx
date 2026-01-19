import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TimeSeriesData } from '@/types/dashboard';
import { formatCurrency } from '@/lib/formatters';
import { ChartCard } from './ChartCard';
import { useMemo } from 'react';

interface InvestmentChartProps {
  data: TimeSeriesData[];
}

export function InvestmentChart({ data }: InvestmentChartProps) {
  // Calculate 7-day moving average
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const windowStart = Math.max(0, index - 6);
      const window = data.slice(windowStart, index + 1);
      const movingAvg = window.reduce((sum, d) => sum + d.investimento, 0) / window.length;
      return {
        ...item,
        movingAverage: movingAvg,
      };
    });
  }, [data]);

  return (
    <ChartCard title="Quanto investimos no total (em R$)">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
            formatter={(value: number) => [formatCurrency(value), 'Investimento']}
          />
          <Line 
            type="monotone" 
            dataKey="investimento" 
            stroke="hsl(var(--chart-magenta))" 
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="movingAverage" 
            stroke="hsl(var(--chart-magenta))" 
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            opacity={0.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}