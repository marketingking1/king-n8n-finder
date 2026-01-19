import { AggregatedMetrics } from '@/types/dashboard';
import { getROASColor, getCPAColor } from '@/lib/metrics';
import { formatCurrency, formatNumber, formatROAS, formatVariation } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, DollarSign, ShoppingCart, Target, BarChart3, Wallet } from 'lucide-react';
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
  const getColor = () => {
    switch (colorType) {
      case 'neutral':
        return 'text-primary';
      case 'growth':
        if (variation === undefined || variation === 0) return 'text-muted-foreground';
        return variation > 0 ? 'text-success' : 'text-destructive';
      case 'cpa':
        if (rawValue === undefined) return 'text-muted-foreground';
        const cpaColor = getCPAColor(rawValue);
        return cpaColor === 'success' ? 'text-success' : cpaColor === 'warning' ? 'text-warning' : 'text-destructive';
      case 'roas':
        if (rawValue === undefined) return 'text-muted-foreground';
        const roasColor = getROASColor(rawValue);
        return roasColor === 'success' ? 'text-success' : roasColor === 'warning' ? 'text-warning' : 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  const getBgColor = () => {
    switch (colorType) {
      case 'neutral':
        return 'bg-primary/10';
      case 'growth':
        if (variation === undefined || variation === 0) return 'bg-muted';
        return variation > 0 ? 'bg-success/10' : 'bg-destructive/10';
      case 'cpa':
        if (rawValue === undefined) return 'bg-muted';
        const cpaColor = getCPAColor(rawValue);
        return cpaColor === 'success' ? 'bg-success/10' : cpaColor === 'warning' ? 'bg-warning/10' : 'bg-destructive/10';
      case 'roas':
        if (rawValue === undefined) return 'bg-muted';
        const roasColor = getROASColor(rawValue);
        return roasColor === 'success' ? 'bg-success/10' : roasColor === 'warning' ? 'bg-warning/10' : 'bg-destructive/10';
      default:
        return 'bg-muted';
    }
  };

  const TrendIcon = variation === undefined || variation === 0 
    ? Minus 
    : variation > 0 
      ? TrendingUp 
      : TrendingDown;

  return (
    <Card className={cn("relative overflow-hidden", getBgColor())}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className={cn("p-2 rounded-lg", getColor(), "bg-background/50")}>
            {icon}
          </div>
        </div>
        <div className={cn("text-2xl font-bold", getColor())}>
          {value}
        </div>
        {variation !== undefined && (
          <div className={cn("flex items-center gap-1 mt-2 text-sm", 
            variation > 0 ? 'text-success' : variation < 0 ? 'text-destructive' : 'text-muted-foreground'
          )}>
            <TrendIcon className="h-4 w-4" />
            <span>{formatVariation(variation)}</span>
            <span className="text-muted-foreground">vs período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KPICards({ metrics, variations }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KPICard
        title="Investimento Total"
        value={formatCurrency(metrics.investimento)}
        variation={variations?.investimento}
        colorType="neutral"
        icon={<Wallet className="h-5 w-5" />}
      />
      <KPICard
        title="Conversões"
        value={formatNumber(metrics.conversoes)}
        variation={variations?.conversoes}
        colorType="growth"
        icon={<ShoppingCart className="h-5 w-5" />}
      />
      <KPICard
        title="CPA"
        value={formatCurrency(metrics.cpa)}
        variation={variations?.cpa}
        colorType="cpa"
        rawValue={metrics.cpa}
        icon={<Target className="h-5 w-5" />}
      />
      <KPICard
        title="ROAS"
        value={formatROAS(metrics.roas)}
        variation={variations?.roas}
        colorType="roas"
        rawValue={metrics.roas}
        icon={<BarChart3 className="h-5 w-5" />}
      />
      <KPICard
        title="Receita Total"
        value={formatCurrency(metrics.receita)}
        variation={variations?.receita}
        colorType="growth"
        icon={<DollarSign className="h-5 w-5" />}
      />
    </div>
  );
}
