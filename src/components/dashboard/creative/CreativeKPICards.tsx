import { motion } from 'framer-motion';
import { DollarSign, Eye, Zap, Timer, Users, Target, BarChart3, Percent } from 'lucide-react';
import { CreativeKPIs } from '@/types/creative';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CreativeKPICardsProps {
  kpis: CreativeKPIs | null;
  isLoading: boolean;
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  colorClass?: string;
  index: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

function KPICard({ title, value, icon, colorClass, index }: KPICardProps) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg border border-border bg-card p-3 lg:p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 min-w-0 overflow-hidden"
    >
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="flex-shrink-0 p-2 lg:p-2.5 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-[10px] lg:text-xs text-muted-foreground truncate mb-1">{title}</p>
          <p className={cn(
            "text-base lg:text-lg xl:text-xl font-display font-bold tracking-tight truncate",
            colorClass || "text-foreground"
          )}>
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function KPICardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted/30" />
        <div className="flex-1">
          <div className="h-3 w-16 bg-muted/30 rounded mb-2" />
          <div className="h-5 w-20 bg-muted/30 rounded" />
        </div>
      </div>
    </div>
  );
}

export function CreativeKPICards({ kpis, isLoading }: CreativeKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
        {[...Array(10)].map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!kpis) {
    return null;
  }

  const getHookRateColor = (value: number) => {
    if (value >= 25) return 'text-success';
    if (value >= 15) return 'text-warning';
    return 'text-destructive';
  };

  const getHoldRateColor = (value: number) => {
    if (value >= 30) return 'text-success';
    if (value >= 20) return 'text-warning';
    return 'text-destructive';
  };

  const getCplColor = (value: number) => {
    if (value === 0) return 'text-muted-foreground';
    if (value <= 10) return 'text-success';
    if (value <= 20) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
      <KPICard
        title="Investimento Total"
        value={formatCurrency(kpis.totalInvestimento)}
        icon={<DollarSign className="h-4 w-4" />}
        index={0}
      />
      <KPICard
        title="Impressões"
        value={formatNumber(kpis.totalImpressions)}
        icon={<Eye className="h-4 w-4" />}
        index={1}
      />
      <KPICard
        title="Hook Rate"
        value={formatPercent(kpis.avgHookRate)}
        icon={<Zap className="h-4 w-4" />}
        colorClass={getHookRateColor(kpis.avgHookRate)}
        index={2}
      />
      <KPICard
        title="Hold Rate (3s→25%)"
        value={formatPercent(kpis.avgHoldRate)}
        icon={<BarChart3 className="h-4 w-4" />}
        colorClass={getHoldRateColor(kpis.avgHoldRate)}
        index={3}
      />
      <KPICard
        title="Completion Rate"
        value={formatPercent(kpis.avgCompletionRate)}
        icon={<Percent className="h-4 w-4" />}
        index={4}
      />
      <KPICard
        title="Watch Time Médio"
        value={`${kpis.avgWatchTime.toFixed(0)}s`}
        icon={<Timer className="h-4 w-4" />}
        index={5}
      />
      <KPICard
        title="Leads"
        value={formatNumber(kpis.totalLeads)}
        icon={<Users className="h-4 w-4" />}
        index={6}
      />
      <KPICard
        title="CPL"
        value={formatCurrency(kpis.avgCpl)}
        icon={<Target className="h-4 w-4" />}
        colorClass={getCplColor(kpis.avgCpl)}
        index={7}
      />
      <KPICard
        title="CPM"
        value={formatCurrency(kpis.avgCpm)}
        icon={<DollarSign className="h-4 w-4" />}
        index={8}
      />
      <KPICard
        title="CTR"
        value={formatPercent(kpis.avgCtr)}
        icon={<Percent className="h-4 w-4" />}
        index={9}
      />
    </div>
  );
}
