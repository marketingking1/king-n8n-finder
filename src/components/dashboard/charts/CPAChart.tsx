import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TimeSeriesData } from '@/types/dashboard';
import { formatCurrency } from '@/lib/formatters';
import { ChartCard } from './ChartCard';
import { useMemo } from 'react';

interface CPAChartProps {
  data: TimeSeriesData[];
  delay?: number;
}

export function CPAChart({ data, delay = 0 }: CPAChartProps) {
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const gasto = payload.find((p: any) => p.dataKey === 'investimento');
      const cpaMA = payload.find((p: any) => p.dataKey === 'cpaMA');
      
      return (
        <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-2">{label}</p>
          {gasto && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[hsl(195,90%,55%)]" />
              <span className="text-xs text-muted-foreground">Investimento:</span>
              <span className="text-xs font-medium text-foreground">{formatCurrency(gasto.value)}</span>
            </div>
          )}
          {cpaMA && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[hsl(0,84%,60%)]" />
              <span className="text-xs text-muted-foreground">CPA Médio:</span>
              <span className="text-xs font-medium text-destructive">{formatCurrency(cpaMA.value)}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard title="Custo por Aquisição (CPA)" subtitle="Investimento e CPA médio de 7 dias" delay={delay}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartDataWithMA} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(195, 90%, 55%)" stopOpacity={0.8} />
              <stop offset="100%" stopColor="hsl(195, 90%, 55%)" stopOpacity={0.3} />
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
            yAxisId="left"
            stroke="hsl(218, 11%, 65%)"
            tick={{ fill: 'hsl(218, 11%, 65%)', fontSize: 10 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            axisLine={false}
            tickLine={false}
            dx={-5}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="hsl(218, 11%, 65%)"
            tick={{ fill: 'hsl(218, 11%, 65%)', fontSize: 10 }}
            tickFormatter={(value) => `R$${value.toFixed(0)}`}
            axisLine={false}
            tickLine={false}
            dx={5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            yAxisId="left"
            dataKey="investimento" 
            name="Investimento"
            fill="url(#barGradient)"
            radius={[4, 4, 0, 0]}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="cpaMA" 
            name="CPA Médio"
            stroke="hsl(0, 84%, 60%)" 
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
