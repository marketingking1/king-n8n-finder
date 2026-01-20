import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-sm font-semibold text-primary">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-xs text-muted-foreground mt-1">
              Média 7d: {formatCurrency(payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard title="Investimento Total" subtitle="com média móvel de 7 dias">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="investmentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(186, 100%, 50%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(186, 100%, 50%)" stopOpacity={0} />
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
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            axisLine={false}
            tickLine={false}
            dx={-5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="investimento" 
            stroke="hsl(186, 100%, 50%)" 
            strokeWidth={2}
            fill="url(#investmentGradient)"
          />
          <Area 
            type="monotone" 
            dataKey="movingAverage" 
            stroke="hsl(210, 100%, 55%)" 
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="none"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
