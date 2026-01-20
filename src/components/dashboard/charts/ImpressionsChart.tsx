import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TimeSeriesData } from '@/types/dashboard';
import { formatNumber } from '@/lib/formatters';
import { ChartCard } from './ChartCard';

interface ImpressionsChartProps {
  data: TimeSeriesData[];
}

export function ImpressionsChart({ data }: ImpressionsChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-sm font-semibold text-primary">
            {formatNumber(payload[0].value)} impressões
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard title="Impressões Diárias" subtitle="Alcance total por dia">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(175, 80%, 45%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(175, 80%, 45%)" stopOpacity={0} />
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
            dataKey="impressoes" 
            stroke="hsl(175, 80%, 45%)" 
            strokeWidth={2}
            fill="url(#impressionsGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
