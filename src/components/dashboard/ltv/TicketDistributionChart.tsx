import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TicketDistribution } from '@/types/ltv';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

interface TicketDistributionChartProps {
  data: TicketDistribution[];
  ticketMedio: number;
  isLoading?: boolean;
}

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(186, 100%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 70%, 55%)',
  'hsl(340, 80%, 55%)',
];

export function TicketDistributionChart({ data, ticketMedio, isLoading }: TicketDistributionChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }
  
  // Filtrar faixas com dados
  const filteredData = data.filter(d => d.quantidade > 0);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg"
    >
      <div className="mb-4">
        <h3 className="text-base font-display font-semibold text-foreground">
          Distribuição do Ticket
        </h3>
        <p className="text-xs text-muted-foreground">
          Faixas de mensalidade
        </p>
      </div>
      
      <div className="h-[300px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              dataKey="quantidade"
              nameKey="faixa"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="hsl(215, 35%, 11%)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(215, 30%, 14%)',
                border: '1px solid hsl(215, 20%, 25%)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
              formatter={(value: number, name: string, props: any) => {
                const item = props.payload as TicketDistribution;
                return [
                  <div key="tooltip" className="space-y-1 text-sm">
                    <div>Quantidade: <span className="font-semibold">{formatNumber(item.quantidade)}</span></div>
                    <div>Percentual: <span className="font-semibold text-primary">{formatPercent(item.percentual)}</span></div>
                  </div>,
                  null
                ];
              }}
              labelFormatter={(label) => label}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Centro do donut */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
            <p className="text-lg font-display font-bold text-primary">
              {formatCurrency(ticketMedio)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Legenda */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {filteredData.map((item, index) => (
          <div key={item.faixa} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-muted-foreground">{item.faixa}</span>
            <span className="text-foreground font-medium">{formatPercent(item.percentual)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
