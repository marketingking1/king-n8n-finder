import { AggregatedMetrics } from '@/types/dashboard';
import { getROASColor, getCPAColor } from '@/lib/metrics';
import { formatCurrency, formatNumber, formatROAS, formatVariation } from '@/lib/formatters';
import { DollarSign, ShoppingCart, Target, BarChart3, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface KPICardsProps {
  metrics: AggregatedMetrics;
  variations: {
    investimento: number;
    conversoes: number;
    cpa: number;
    roas: number;
    receita: number;
  } | null;
}

interface KPICardProps {
  title: string;
  value: string;
  variation?: number;
  colorType: 'neutral' | 'growth' | 'cpa' | 'roas';
  rawValue?: number;
  icon: React.ReactNode;
  index: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

function KPICard({ title, value, variation, colorType, rawValue, icon, index }: KPICardProps) {
  const getValueColor = () => {
    switch (colorType) {
      case 'cpa':
        if (rawValue === undefined) return 'text-foreground';
        const cpaColor = getCPAColor(rawValue);
        return cpaColor === 'success' ? 'text-success' : cpaColor === 'warning' ? 'text-warning' : 'text-destructive';
      case 'roas':
        if (rawValue === undefined) return 'text-foreground';
        const roasColor = getROASColor(rawValue);
        return roasColor === 'success' ? 'text-success' : 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:border-primary/30 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 p-2.5 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate mb-1">{title}</p>
          <p className={cn("text-2xl font-display font-bold tracking-tight", getValueColor())}>
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function KPICards({ metrics, variations }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KPICard
        title="Investimento em R$"
        value={formatCurrency(metrics.investimento)}
        variation={variations?.investimento}
        colorType="neutral"
        icon={<DollarSign className="h-5 w-5" />}
        index={0}
      />
      <KPICard
        title="Impressões"
        value={formatNumber(metrics.impressoes)}
        colorType="neutral"
        icon={<Eye className="h-5 w-5" />}
        index={1}
      />
      <KPICard
        title="Conversões"
        value={formatNumber(metrics.conversoes)}
        variation={variations?.conversoes}
        colorType="growth"
        icon={<ShoppingCart className="h-5 w-5" />}
        index={2}
      />
      <KPICard
        title="CPA médio"
        value={formatCurrency(metrics.cpa)}
        variation={variations?.cpa}
        colorType="cpa"
        rawValue={metrics.cpa}
        icon={<Target className="h-5 w-5" />}
        index={3}
      />
      <KPICard
        title="ROAS"
        value={formatROAS(metrics.roas)}
        variation={variations?.roas}
        colorType="roas"
        rawValue={metrics.roas}
        icon={<BarChart3 className="h-5 w-5" />}
        index={4}
      />
    </div>
  );
}
