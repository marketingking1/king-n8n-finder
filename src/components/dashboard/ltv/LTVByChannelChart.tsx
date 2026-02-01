import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChannelLTVData } from '@/types/ltv';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

interface LTVByChannelChartProps {
  data: ChannelLTVData[];
  onChannelClick?: (canal: string) => void;
  isLoading?: boolean;
}

// Gerar cor baseada no valor LTV (mais alto = mais escuro/intenso)
function getChannelColor(ltv: number, maxLtv: number): string {
  const intensity = Math.min(ltv / maxLtv, 1);
  const lightness = 65 - intensity * 25; // De 65% a 40%
  return `hsl(217, 91%, ${lightness}%)`;
}

export function LTVByChannelChart({ data, onChannelClick, isLoading }: LTVByChannelChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }
  
  const maxLtv = Math.max(...data.map(d => d.ltv), 1);
  
  // Inverter para barras horizontais (maior no topo)
  const chartData = [...data].reverse();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg"
    >
      <div className="mb-4">
        <h3 className="text-base font-display font-semibold text-foreground">
          LTV por Canal
        </h3>
        <p className="text-xs text-muted-foreground">
          Clique em uma barra para filtrar
        </p>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(215, 20%, 25%)' }}
              tickLine={{ stroke: 'hsl(215, 20%, 25%)' }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <YAxis
              type="category"
              dataKey="canal"
              width={100}
              tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(215, 20%, 25%)' }}
              tickLine={{ stroke: 'hsl(215, 20%, 25%)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(215, 30%, 14%)',
                border: '1px solid hsl(215, 20%, 25%)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
              labelStyle={{ color: 'hsl(215, 20%, 90%)', fontWeight: 600 }}
              formatter={(value: number, name: string, props: any) => {
                const item = props.payload as ChannelLTVData;
                return [
                  <div key="tooltip" className="space-y-1 text-sm">
                    <div>LTV: <span className="font-semibold text-primary">{formatCurrency(item.ltv)}</span></div>
                    <div>Ticket Médio: {formatCurrency(item.ticketMedio)}</div>
                    <div>Permanência: {item.permanenciaMedia.toFixed(1)} meses</div>
                    <div>Alunos: {item.alunos}</div>
                  </div>,
                  null
                ];
              }}
              labelFormatter={(label) => label}
            />
            <Bar
              dataKey="ltv"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(data) => onChannelClick?.(data.canal)}
              label={{
                position: 'right',
                fill: 'hsl(215, 20%, 65%)',
                fontSize: 11,
                formatter: (value: number) => formatCurrency(value),
              }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getChannelColor(entry.ltv, maxLtv)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
