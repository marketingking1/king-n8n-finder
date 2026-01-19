import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TimeSeriesData } from '@/types/dashboard';
import { formatPercent } from '@/lib/formatters';
import { ChartCard } from './ChartCard';
import { useMemo } from 'react';

interface ConversionRateChartProps {
  data: TimeSeriesData[];
}

export function ConversionRateChart({ data }: ConversionRateChartProps) {
  const chartData = useMemo(() => {
    // Group by week/month to show conversion rate over time
    return data.map(item => ({
      ...item,
      conversionRate: item.leads > 0 ? (item.conversoes / item.leads) * 100 : 0,
    }));
  }, [data]);

  // Get max value for the chart
  const maxRate = Math.max(...chartData.map(d => d.conversionRate), 15);

  return (
    <ChartCard title="Qual foi a minha taxa de conversão?">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            axisLine={false}
            tickLine={false}
            domain={[0, Math.ceil(maxRate)]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, 'Taxa de Conversão']}
          />
          <Bar 
            dataKey="conversionRate" 
            fill="hsl(var(--chart-magenta))"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill="hsl(var(--chart-magenta))"
                opacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}