import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TimeSeriesData } from '@/types/dashboard';
import { formatCurrency } from '@/lib/formatters';
import { ChartCard } from './ChartCard';
import { useMemo } from 'react';

interface CPAChartProps {
  data: TimeSeriesData[];
}

export function CPAChart({ data }: CPAChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      cpa: item.conversoes > 0 ? item.investimento / item.conversoes : 0,
    }));
  }, [data]);

  // Calculate moving average
  const chartDataWithMA = useMemo(() => {
    return chartData.map((item, index) => {
      const windowStart = Math.max(0, index - 6);
      const window = chartData.slice(windowStart, index + 1);
      const movingAvg = window.reduce((sum, d) => sum + d.cpa, 0) / window.length;
      return {
        ...item,
        cpaMA: movingAvg,
      };
    });
  }, [chartData]);

  return (
    <ChartCard title="Quanto foi o meu custo por cliente?">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartDataWithMA} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
            tickFormatter={(value) => `R$${value.toFixed(0)}`}
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
            formatter={(value: number, name: string) => [
              formatCurrency(value), 
              name === 'cpaMA' ? 'CPA Médio' : 'Gasto'
            ]}
          />
          <Legend 
            formatter={(value) => value === 'cpaMA' ? 'CPA médio' : 'spend'}
          />
          <Bar 
            dataKey="investimento" 
            name="spend"
            fill="hsl(var(--chart-pink))"
            radius={[4, 4, 0, 0]}
            opacity={0.6}
          />
          <Line 
            type="monotone" 
            dataKey="cpaMA" 
            name="cpaMA"
            stroke="hsl(var(--chart-purple))" 
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}