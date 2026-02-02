import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { StatusBreakdown } from '@/types/ltv';
import { formatNumber, formatPercent } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

interface StatusBreakdownChartProps {
  data: StatusBreakdown[];
  isLoading?: boolean;
}

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (percent < 0.03) return null; // Não mostrar label para fatias muito pequenas
  
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function StatusBreakdownChart({ data, isLoading }: StatusBreakdownChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.quantidade, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg"
    >
      <div className="mb-4">
        <h3 className="text-base font-display font-semibold text-foreground">
          Breakdown por Status
        </h3>
        <p className="text-xs text-muted-foreground">
          Distribuição detalhada por status do aluno
        </p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              innerRadius={50}
              fill="#8884d8"
              dataKey="quantidade"
              nameKey="status"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(215, 30%, 14%)',
                border: '1px solid hsl(215, 20%, 25%)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
              formatter={(value: number, name: string) => [
                <div key="tooltip" className="space-y-1">
                  <div className="font-semibold">{formatNumber(value)} alunos</div>
                  <div className="text-muted-foreground">{formatPercent((value / total) * 100)}</div>
                </div>,
                name
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-muted-foreground text-xs">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Status summary cards */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {data.slice(0, 3).map((item) => (
          <div
            key={item.status}
            className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(216,30%,12%)]"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{item.status}</p>
              <p className="text-sm font-semibold text-foreground">
                {formatNumber(item.quantidade)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
