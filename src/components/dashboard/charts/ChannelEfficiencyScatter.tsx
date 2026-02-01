import { useMemo } from 'react';
import { ChannelMetrics } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatROAS } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
  Cell,
} from 'recharts';

interface ChannelEfficiencyScatterProps {
  data: ChannelMetrics[];
  isLoading?: boolean;
}

const getQuadrantColor = (cpa: number, vendas: number, avgCpa: number, avgVendas: number) => {
  if (cpa <= avgCpa && vendas >= avgVendas) return 'hsl(142, 76%, 36%)'; // Champion (verde) - escalar
  if (cpa > avgCpa && vendas >= avgVendas) return 'hsl(38, 92%, 50%)';   // Caro (amarelo) - otimizar
  if (cpa <= avgCpa && vendas < avgVendas) return 'hsl(217, 91%, 60%)';  // Oportunidade (azul) - testar
  return 'hsl(0, 84%, 60%)';                                              // Problema (vermelho) - revisar
};

export function ChannelEfficiencyScatter({ data, isLoading }: ChannelEfficiencyScatterProps) {
  // Filter only paid channels with sales > 0
  const paidChannels = useMemo(() => {
    return data.filter(ch => ch.investimento > 0 && ch.vendas > 0);
  }, [data]);

  // Calculate averages
  const { avgCpa, avgVendas } = useMemo(() => {
    if (paidChannels.length === 0) return { avgCpa: 0, avgVendas: 0 };
    
    const totalInvestimento = paidChannels.reduce((sum, c) => sum + c.investimento, 0);
    const totalVendas = paidChannels.reduce((sum, c) => sum + c.vendas, 0);
    
    return {
      avgCpa: totalVendas > 0 ? totalInvestimento / totalVendas : 0,
      avgVendas: paidChannels.length > 0 ? totalVendas / paidChannels.length : 0,
    };
  }, [paidChannels]);

  const chartData = useMemo(() => {
    return paidChannels.map((c) => ({
      name: c.canal,
      cpa: c.cpa,
      vendas: c.vendas,
      investimento: c.investimento,
      receita: c.receita,
      roas: c.roas,
      color: getQuadrantColor(c.cpa, c.vendas, avgCpa, avgVendas),
    }));
  }, [paidChannels, avgCpa, avgVendas]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
      >
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-4 w-64 mb-6" />
        <Skeleton className="h-[300px] w-full" />
      </motion.div>
    );
  }

  // Don't render if less than 2 paid channels
  if (paidChannels.length < 2) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
    >
      <div className="mb-4">
        <h3 className="text-base font-display font-semibold text-foreground">Eficiência por Canal</h3>
        <p className="text-xs text-muted-foreground">CPA vs Volume de Vendas (apenas mídia paga)</p>
      </div>
      
      <div className="h-[300px] lg:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              type="number"
              dataKey="cpa"
              name="CPA"
              unit=" R$"
              domain={[0, 'dataMax']}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={{
                value: 'CPA (R$)',
                position: 'bottom',
                offset: 0,
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
              }}
            />
            <YAxis
              type="number"
              dataKey="vendas"
              name="Vendas"
              domain={[0, 'dataMax']}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={{
                value: 'Vendas',
                angle: -90,
                position: 'insideLeft',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
              }}
            />
            <ZAxis
              type="number"
              dataKey="investimento"
              range={[100, 600]}
              name="Investimento"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-sm text-foreground mb-2">{data.name}</p>
                      <div className="space-y-1 text-xs">
                        <p className="text-muted-foreground">
                          CPA: <span className="text-foreground font-medium">{formatCurrency(data.cpa)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Vendas: <span className="text-foreground font-medium">{formatNumber(data.vendas)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Investimento: <span className="text-foreground font-medium">{formatCurrency(data.investimento)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Receita: <span className="text-foreground font-medium">{formatCurrency(data.receita)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          ROAS: <span className="text-foreground font-medium">{formatROAS(data.roas)}</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Reference lines for quadrants */}
            <ReferenceLine
              x={avgCpa}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              opacity={0.5}
            />
            <ReferenceLine
              y={avgVendas}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              opacity={0.5}
            />
            <Scatter name="Canais" data={chartData}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  fillOpacity={0.8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[hsl(142,76%,36%)]" />
          <span className="text-muted-foreground">Champion — Escalar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[hsl(38,92%,50%)]" />
          <span className="text-muted-foreground">Volume caro — Otimizar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[hsl(217,91%,60%)]" />
          <span className="text-muted-foreground">Oportunidade — Testar escala</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[hsl(0,84%,60%)]" />
          <span className="text-muted-foreground">Revisar — Pausar/ajustar</span>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-3">
        Apenas canais com investimento em mídia. Canais orgânicos na tabela acima.
      </p>
    </motion.div>
  );
}
