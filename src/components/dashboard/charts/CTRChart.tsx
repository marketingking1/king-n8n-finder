import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TimeSeriesData } from '@/types/dashboard';
import { ChartCard } from './ChartCard';

interface CTRChartProps {
  data: TimeSeriesData[];
  delay?: number;
}

/**
 * CTR Semanal - O CTR já vem calculado corretamente em TimeSeriesData:
 * CTR = SUM(cliques) / SUM(impressões) × 100 (após agregação por período)
 * 
 * NÃO usar média de CTR diário - usar dados já agregados.
 */
export function CTRChart({ data, delay = 0 }: CTRChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-sm font-semibold text-primary">
            {payload[0].value.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard title="CTR Semanal" subtitle="Click-through rate por semana" delay={delay}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="ctrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(210, 100%, 55%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(210, 100%, 55%)" stopOpacity={0} />
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
            tickFormatter={(value) => `${value.toFixed(1)}%`}
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
            dx={-5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="ctr" 
            stroke="hsl(210, 100%, 55%)" 
            strokeWidth={2}
            fill="url(#ctrGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
