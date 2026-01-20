import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { TimeSeriesData } from '@/types/dashboard';
import { ChartCard } from './ChartCard';
import { useMemo } from 'react';

interface ConversionRateChartProps {
  data: TimeSeriesData[];
}

export function ConversionRateChart({ data }: ConversionRateChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      conversionRate: item.leads > 0 ? (item.conversoes / item.leads) * 100 : 0,
    }));
  }, [data]);

  // Calculate average for reference
  const avgRate = useMemo(() => {
    const rates = chartData.filter(d => d.conversionRate > 0).map(d => d.conversionRate);
    return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const rate = payload[0].value;
      const isAboveAvg = rate >= avgRate;
      
      return (
        <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className={`text-sm font-semibold ${isAboveAvg ? 'text-success' : 'text-warning'}`}>
            {rate.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Média: {avgRate.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard title="Taxa de Conversão" subtitle="Leads convertidos em vendas">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="conversionGradientHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="conversionGradientLow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(217, 20%, 20%)" 
            vertical={false}
          />
          <XAxis 
            dataKey="data" 
            stroke="hsl(218, 11%, 65%)"
            tick={{ fill: 'hsl(218, 11%, 65%)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            stroke="hsl(218, 11%, 65%)"
            tick={{ fill: 'hsl(218, 11%, 65%)', fontSize: 10 }}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            axisLine={false}
            tickLine={false}
            dx={-5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="conversionRate" 
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.conversionRate >= avgRate 
                  ? 'url(#conversionGradientHigh)' 
                  : 'url(#conversionGradientLow)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
