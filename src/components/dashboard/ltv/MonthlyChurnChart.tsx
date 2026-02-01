import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyChurnPoint } from '@/types/ltv';
import { formatNumber } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlyChurnChartProps {
  data: MonthlyChurnPoint[];
  isLoading?: boolean;
}

export function MonthlyChurnChart({ data, isLoading }: MonthlyChurnChartProps) {
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
      transition={{ duration: 0.3, delay: 0.2 }}
      className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg"
    >
      <div className="mb-4">
        <h3 className="text-base font-display font-semibold text-foreground">
          Evolução do Churn Mensal
        </h3>
        <p className="text-xs text-muted-foreground">
          Cancelamentos nos últimos 12 meses
        </p>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
            <XAxis
              dataKey="mes"
              tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(215, 20%, 25%)' }}
              tickLine={{ stroke: 'hsl(215, 20%, 25%)' }}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis
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
              labelStyle={{ color: 'hsl(215, 20%, 90%)' }}
              formatter={(value: number) => [formatNumber(value), 'Cancelamentos']}
            />
            <Bar
              dataKey="cancelamentos"
              fill="hsl(0, 84%, 60%)"
              fillOpacity={0.8}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
