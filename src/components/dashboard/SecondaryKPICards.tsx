import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { Banknote, Users, Eye, MousePointer, Percent, ArrowUp, ArrowDown } from 'lucide-react';
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

interface SecondaryKPICardsProps {
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
}

interface SecondaryCardProps {
  title: string;
  value: string;
  variation: number | null;
  icon: React.ReactNode;
}

function SecondaryCard({ title, value, variation, icon }: SecondaryCardProps) {
  const getVariationColor = () => {
    if (variation === null) return 'text-muted-foreground';
    return variation >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const VariationIcon = variation !== null && variation >= 0 ? ArrowUp : ArrowDown;

  return (
    <Card className="glow-card p-4 flex items-center gap-4">
      <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{title}</p>
        <p className="text-lg font-semibold text-foreground truncate">{value}</p>
      </div>
      {variation !== null && (
        <div className={cn('flex items-center gap-1 text-xs whitespace-nowrap', getVariationColor())}>
          <VariationIcon className="h-3 w-3" />
          <span>{variation >= 0 ? '+' : ''}{variation.toFixed(1)}%</span>
        </div>
      )}
    </Card>
  );
}

export function SecondaryKPICards({ current, variations }: SecondaryKPICardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <SecondaryCard
        title="Receita Total"
        value={formatCurrency(current.receita)}
        variation={variations?.receita ?? null}
        icon={<Banknote className="h-4 w-4" />}
      />
      <SecondaryCard
        title="Leads Totais"
        value={formatNumber(current.leads)}
        variation={variations?.leads ?? null}
        icon={<Users className="h-4 w-4" />}
      />
      <SecondaryCard
        title="Impressões"
        value={formatNumber(current.impressoes)}
        variation={variations?.impressoes ?? null}
        icon={<Eye className="h-4 w-4" />}
      />
      <SecondaryCard
        title="Cliques"
        value={formatNumber(current.cliques)}
        variation={variations?.cliques ?? null}
        icon={<MousePointer className="h-4 w-4" />}
      />
      <SecondaryCard
        title="CTR"
        value={formatPercent(current.ctr)}
        variation={variations?.ctr ?? null}
        icon={<Percent className="h-4 w-4" />}
      />
    </div>
  );
}
