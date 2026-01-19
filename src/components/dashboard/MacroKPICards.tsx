import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { DollarSign, ShoppingCart, Target, BarChart3, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MacroMetrics {
  investimento: number;
  impressoes: number;
  cliques: number;
  leads: number;
  conversoes: number;
  receita: number;
  ctr: number;
  cpa: number;
  roas: number;
}

interface MacroKPICardsProps {
  current: MacroMetrics;
  variations: {
    investimento: number;
    conversoes: number;
    cpa: number;
    roas: number;
    receita: number;
    impressoes: number;
    cliques: number;
    leads: number;
    ctr: number;
  } | null;
  periodLabel: string;
}

interface MacroCardProps {
  title: string;
  value: string;
  variation: number | null;
  icon: React.ReactNode;
  colorType: 'neutral' | 'growth' | 'inverse' | 'roas';
  rawValue?: number;
}

function MacroCard({ title, value, variation, icon, colorType, rawValue }: MacroCardProps) {
  const getVariationColor = () => {
    if (variation === null) return 'text-muted-foreground';
    
    if (colorType === 'neutral') return 'text-blue-400';
    
    if (colorType === 'roas') {
      // ROAS: green if >= 1, red if < 1
      return (rawValue ?? 0) >= 1 ? 'text-green-400' : 'text-red-400';
    }
    
    if (colorType === 'inverse') {
      // CPA: green if decreased (negative variation), red if increased
      return variation <= 0 ? 'text-green-400' : 'text-red-400';
    }
    
    // Growth: green if increased, red if decreased
    return variation >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getIconBgColor = () => {
    if (colorType === 'neutral') return 'bg-blue-500/20 text-blue-400';
    if (colorType === 'roas') {
      return (rawValue ?? 0) >= 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
    }
    if (colorType === 'inverse') {
      return (rawValue ?? 0) <= 300 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
    }
    return 'bg-primary/20 text-primary';
  };

  const VariationIcon = variation !== null && variation >= 0 ? ArrowUp : ArrowDown;

  return (
    <Card className="glow-card-strong p-6 flex flex-col justify-between min-h-[140px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <div className={cn('p-2 rounded-lg', getIconBgColor())}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
        {variation !== null && (
          <div className={cn('flex items-center gap-1 text-sm', getVariationColor())}>
            <VariationIcon className="h-4 w-4" />
            <span>{variation >= 0 ? '+' : ''}{variation.toFixed(1)}% vs mês anterior</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export function MacroKPICards({ current, variations, periodLabel }: MacroKPICardsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Visão Macro do Mês</h2>
        <span className="text-sm text-muted-foreground">Comparando: {periodLabel}</span>
      </div>
      
      {/* Main KPI Cards - 5 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MacroCard
          title="Investimento Total"
          value={formatCurrency(current.investimento)}
          variation={variations?.investimento ?? null}
          icon={<DollarSign className="h-5 w-5" />}
          colorType="neutral"
        />
        <MacroCard
          title="Vendas (Conversões)"
          value={formatNumber(current.conversoes)}
          variation={variations?.conversoes ?? null}
          icon={<ShoppingCart className="h-5 w-5" />}
          colorType="growth"
        />
        <MacroCard
          title="CPA"
          value={formatCurrency(current.cpa)}
          variation={variations?.cpa ?? null}
          icon={<Target className="h-5 w-5" />}
          colorType="inverse"
          rawValue={current.cpa}
        />
        <MacroCard
          title="ROAS"
          value={`${current.roas.toFixed(2)}x`}
          variation={variations?.roas ?? null}
          icon={<BarChart3 className="h-5 w-5" />}
          colorType="roas"
          rawValue={current.roas}
        />
        <MacroCard
          title="Taxa Conversão Lead→Venda"
          value={current.leads > 0 ? `${((current.conversoes / current.leads) * 100).toFixed(2)}%` : '0%'}
          variation={null}
          icon={<TrendingUp className="h-5 w-5" />}
          colorType="growth"
        />
      </div>
    </div>
  );
}
