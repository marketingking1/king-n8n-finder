import { useMemo } from 'react';
import { ChannelMetrics } from '@/types/dashboard';
import { formatNumber, formatCurrency, formatPercent } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChannelMixChartProps {
  data: ChannelMetrics[];
  isLoading?: boolean;
}

const CHANNEL_COLORS: Record<string, string> = {
  'Meta (facebook e instagram)': 'hsl(210, 100%, 55%)',
  'Google': 'hsl(142, 76%, 36%)',
  'LinkedIn': 'hsl(210, 80%, 45%)',
  'SEO': 'hsl(160, 100%, 45%)',
  'Indicacao': 'hsl(38, 92%, 50%)',
  'Lead Organico': 'hsl(175, 80%, 45%)',
  'Leads Frios': 'hsl(230, 80%, 55%)',
  'Ex-Aluno': 'hsl(280, 70%, 55%)',
  'Influenciadores': 'hsl(340, 80%, 55%)',
  'Facebook': 'hsl(210, 100%, 55%)',
};

const FALLBACK_COLORS = [
  'hsl(186, 100%, 50%)',
  'hsl(45, 100%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(120, 60%, 45%)',
  'hsl(300, 60%, 55%)',
  'hsl(60, 90%, 50%)',
  'hsl(200, 80%, 60%)',
];

function getChannelColor(canal: string, index: number): string {
  return CHANNEL_COLORS[canal] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export function ChannelMixChart({ data, isLoading }: ChannelMixChartProps) {
  const chartData = useMemo(() => {
    // Filter channels with sales > 0
    return data
      .filter(c => c.vendas > 0)
      .map((c, index) => ({
        name: c.canal,
        value: c.vendas,
        receita: c.receita,
        ticketMedio: c.ticketMedio,
        color: getChannelColor(c.canal, index),
      }));
  }, [data]);

  const totalVendas = useMemo(() => {
    return chartData.reduce((sum, c) => sum + c.value, 0);
  }, [chartData]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
      >
        <Skeleton className="h-5 w-36 mb-2" />
        <Skeleton className="h-4 w-48 mb-6" />
        <Skeleton className="h-[200px] w-full" />
      </motion.div>
    );
  }

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
      >
        <h3 className="text-base font-display font-semibold text-foreground">Vendas por Canal</h3>
        <p className="text-xs text-muted-foreground mb-6">Distribuição de vendas reais</p>
        <p className="text-center text-muted-foreground text-sm py-8">Sem dados disponíveis</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
    >
      <div className="mb-4">
        <h3 className="text-base font-display font-semibold text-foreground">Vendas por Canal</h3>
        <p className="text-xs text-muted-foreground">Distribuição de vendas reais</p>
      </div>
      
      <div className="h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const percent = totalVendas > 0 ? (data.value / totalVendas) * 100 : 0;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-sm text-foreground mb-2">{data.name}</p>
                      <div className="space-y-1 text-xs">
                        <p className="text-muted-foreground">
                          Vendas: <span className="text-foreground font-medium">{formatNumber(data.value)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Receita: <span className="text-foreground font-medium">{formatCurrency(data.receita)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          % do Total: <span className="text-foreground font-medium">{formatPercent(percent)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Ticket Médio: <span className="text-foreground font-medium">{formatCurrency(data.ticketMedio)}</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-display font-bold text-foreground">{formatNumber(totalVendas)}</span>
          <span className="text-xs text-muted-foreground">vendas</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((entry) => {
          const percent = totalVendas > 0 ? (entry.value / totalVendas) * 100 : 0;
          return (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div 
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground truncate">{entry.name}</span>
              <span className="text-foreground font-medium ml-auto">{formatPercent(percent)}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
