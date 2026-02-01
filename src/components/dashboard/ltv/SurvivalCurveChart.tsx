import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { SurvivalPoint } from '@/types/ltv';
import { formatPercent } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

interface SurvivalCurveChartProps {
  data: SurvivalPoint[];
  isLoading?: boolean;
}

export function SurvivalCurveChart({ data, isLoading }: SurvivalCurveChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg"
    >
      <div className="mb-4">
        <h3 className="text-base font-display font-semibold text-foreground">
          Curva de Sobrevivência
        </h3>
        <p className="text-xs text-muted-foreground">
          % de alunos retidos ao longo do tempo
        </p>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="survivalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
            <XAxis
              dataKey="mes"
              tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(215, 20%, 25%)' }}
              tickLine={{ stroke: 'hsl(215, 20%, 25%)' }}
              label={{ 
                value: 'Meses após matrícula', 
                position: 'bottom', 
                offset: -5,
                fill: 'hsl(215, 20%, 55%)',
                fontSize: 11
              }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(215, 20%, 25%)' }}
              tickLine={{ stroke: 'hsl(215, 20%, 25%)' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(215, 30%, 14%)',
                border: '1px solid hsl(215, 20%, 25%)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
              labelStyle={{ color: 'hsl(215, 20%, 90%)' }}
              formatter={(value: number) => [formatPercent(value), 'Retenção']}
              labelFormatter={(mes) => `Mês ${mes}`}
            />
            <ReferenceLine
              y={50}
              stroke="hsl(38, 92%, 50%)"
              strokeDasharray="5 5"
              label={{
                value: 'Break-even 50%',
                position: 'right',
                fill: 'hsl(38, 92%, 50%)',
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="taxa"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              fill="url(#survivalGradient)"
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(217, 91%, 60%)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
