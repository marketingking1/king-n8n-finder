import { AggregatedMetrics } from '@/types/dashboard';
import { getROASColor, getCPAColor } from '@/lib/metrics';
import { formatCurrency, formatNumber, formatROAS, formatVariation } from '@/lib/formatters';
import { DollarSign, ShoppingCart, Target, BarChart3, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

function KPICard({ title, value, variation, colorType, rawValue, icon }: KPICardProps) {
  const getValueColor = () => {
    switch (colorType) {
      case 'cpa':
        if (rawValue === undefined) return 'text-foreground';
        const cpaColor = getCPAColor(rawValue);
        return cpaColor === 'success' ? 'text-success' : cpaColor === 'warning' ? 'text-warning' : 'text-destructive';
      case 'roas':
        if (rawValue === undefined) return 'text-foreground';
        const roasColor = getROASColor(rawValue);
        return roasColor === 'success' ? 'text-success' : roasColor === 'warning' ? 'text-warning' : 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="glow-card-strong p-4 flex items-center gap-4">
      <div className="flex-shrink-0 text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">{title}</p>
        <p className={cn("text-2xl font-bold tracking-tight", getValueColor())}>
          {value}
        </p>
      </div>
    </div>
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
        icon={<DollarSign className="h-6 w-6" />}
      />
      <KPICard
        title="Impressões"
        value={formatNumber(metrics.impressoes)}
        colorType="neutral"
        icon={<Eye className="h-6 w-6" />}
      />
      <KPICard
        title="Conversões"
        value={formatNumber(metrics.conversoes)}
        variation={variations?.conversoes}
        colorType="growth"
        icon={<ShoppingCart className="h-6 w-6" />}
      />
      <KPICard
        title="CPA médio"
        value={formatCurrency(metrics.cpa)}
        variation={variations?.cpa}
        colorType="cpa"
        rawValue={metrics.cpa}
        icon={<Target className="h-6 w-6" />}
      />
      <KPICard
        title="ROAS"
        value={formatROAS(metrics.roas)}
        variation={variations?.roas}
        colorType="roas"
        rawValue={metrics.roas}
        icon={<BarChart3 className="h-6 w-6" />}
      />
    </div>
  );
}