import { useMemo } from 'react';
import { MacroMetrics } from '@/hooks/useMacroData';
import { formatNumber, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Eye, MousePointer, Users, ShoppingCart, ChevronDown } from 'lucide-react';

interface ConversionFunnelProps {
  metrics: MacroMetrics | undefined;
  isLoading?: boolean;
}

interface FunnelStageProps {
  name: string;
  value: number;
  conversionRate?: number;
  icon: React.ReactNode;
  widthPercent: number;
  bgColor: string;
  isLast?: boolean;
}

function FunnelStage({ name, value, conversionRate, icon, widthPercent, bgColor, isLast }: FunnelStageProps) {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Stage bar */}
      <div 
        className={cn(
          "relative py-4 px-5 flex items-center justify-between rounded-lg border border-border transition-all duration-200 hover:border-primary/30",
          bgColor
        )}
        style={{ width: `${widthPercent}%`, minWidth: '200px' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/15 text-primary">
            {icon}
          </div>
          <span className="text-sm font-medium text-foreground">{name}</span>
        </div>
        <span className="text-lg font-display font-bold text-foreground">{formatNumber(value)}</span>
      </div>
      
      {/* Arrow and conversion rate */}
      {!isLast && (
        <div className="flex flex-col items-center py-2">
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
          {conversionRate !== undefined && (
            <div className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md bg-[hsl(216,30%,16%)] border border-border">
              <span className={cn(
                "text-xs font-semibold",
                conversionRate >= 5 ? "text-success" : conversionRate >= 1 ? "text-warning" : "text-destructive"
              )}>
                {formatPercent(conversionRate)}
              </span>
              <span className="text-xs text-muted-foreground">eficiência</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ConversionFunnel({ metrics, isLoading }: ConversionFunnelProps) {
  const funnelData = useMemo(() => {
    if (!metrics) return null;
    
    const impressoes = metrics.impressoes || 0;
    const cliques = metrics.cliques || 0;
    const leads = metrics.leads || 0;
    const vendas = metrics.conversoes || 0;
    
    // Calculate conversion rates between stages
    const impressoesToCliques = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
    const cliquesToLeads = cliques > 0 ? (leads / cliques) * 100 : 0;
    const leadsToVendas = leads > 0 ? (vendas / leads) * 100 : 0;
    
    return [
      { 
        name: 'Impressões', 
        value: impressoes, 
        conversionRate: impressoesToCliques, 
        icon: <Eye className="h-5 w-5" />, 
        widthPercent: 100,
        bgColor: 'bg-[hsl(216,30%,14%)]'
      },
      { 
        name: 'Cliques', 
        value: cliques, 
        conversionRate: cliquesToLeads, 
        icon: <MousePointer className="h-5 w-5" />, 
        widthPercent: 82,
        bgColor: 'bg-[hsl(216,30%,14%)]'
      },
      { 
        name: 'Leads', 
        value: leads, 
        conversionRate: leadsToVendas, 
        icon: <Users className="h-5 w-5" />, 
        widthPercent: 64,
        bgColor: 'bg-[hsl(216,30%,14%)]'
      },
      { 
        name: 'Vendas', 
        value: vendas, 
        icon: <ShoppingCart className="h-5 w-5" />, 
        widthPercent: 46,
        bgColor: 'bg-success/10 border-success/20',
        isLast: true
      },
    ];
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6">
        <h3 className="text-base font-display font-semibold mb-6 text-foreground">Funil de Conversão</h3>
        <div className="flex flex-col items-center space-y-4">
          {[100, 82, 64, 46].map((width, i) => (
            <div 
              key={i} 
              className="h-14 bg-muted/20 rounded-lg animate-pulse"
              style={{ width: `${width}%`, minWidth: '200px' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!funnelData) {
    return (
      <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6">
        <h3 className="text-base font-display font-semibold mb-6 text-foreground">Funil de Conversão</h3>
        <p className="text-center text-muted-foreground text-sm">Sem dados disponíveis</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="mb-6">
        <h3 className="text-base font-display font-semibold text-foreground">Funil de Conversão</h3>
      </div>
      
      <div className="flex flex-col items-center">
        {funnelData.map((stage) => (
          <FunnelStage
            key={stage.name}
            name={stage.name}
            value={stage.value}
            conversionRate={stage.conversionRate}
            icon={stage.icon}
            widthPercent={stage.widthPercent}
            bgColor={stage.bgColor}
            isLast={stage.isLast}
          />
        ))}
      </div>
    </div>
  );
}
