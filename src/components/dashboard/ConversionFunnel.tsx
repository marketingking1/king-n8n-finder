import { useMemo } from 'react';
import { MacroMetrics } from '@/hooks/useMacroData';
import { formatNumber, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Eye, MousePointer, Users, ShoppingCart, ArrowDown } from 'lucide-react';

interface ConversionFunnelProps {
  metrics: MacroMetrics | undefined;
  isLoading?: boolean;
}

interface FunnelStageProps {
  name: string;
  value: number;
  conversionRate?: number;
  icon: React.ReactNode;
  width: number;
  isLast?: boolean;
}

function FunnelStage({ name, value, conversionRate, icon, width, isLast }: FunnelStageProps) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative glow-card-strong py-4 px-6 flex items-center justify-between gap-4 transition-all duration-300"
        style={{ width: `${width}%` }}
      >
        <div className="flex items-center gap-3">
          <div className="text-primary p-2 rounded-lg bg-primary/10">
            {icon}
          </div>
          <span className="text-sm font-medium text-muted-foreground">{name}</span>
        </div>
        <span className="text-xl font-bold text-foreground">{formatNumber(value)}</span>
      </div>
      
      {!isLast && (
        <div className="flex flex-col items-center py-2">
          <ArrowDown className="h-5 w-5 text-primary animate-pulse" />
          {conversionRate !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                "text-sm font-bold",
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
      { name: 'Impressões', value: impressoes, conversionRate: impressoesToCliques, icon: <Eye className="h-5 w-5" />, width: 100 },
      { name: 'Cliques', value: cliques, conversionRate: cliquesToLeads, icon: <MousePointer className="h-5 w-5" />, width: 80 },
      { name: 'Leads', value: leads, conversionRate: leadsToVendas, icon: <Users className="h-5 w-5" />, width: 60 },
      { name: 'Vendas', value: vendas, icon: <ShoppingCart className="h-5 w-5" />, width: 40, isLast: true },
    ];
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="glow-card p-6">
        <h3 className="text-lg font-display font-semibold mb-6 text-foreground">Funil de Conversão</h3>
        <div className="space-y-4">
          {[100, 80, 60, 40].map((width, i) => (
            <div 
              key={i} 
              className="h-16 bg-muted/20 rounded-lg animate-pulse mx-auto"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!funnelData) {
    return (
      <div className="glow-card p-6">
        <h3 className="text-lg font-display font-semibold mb-6 text-foreground">Funil de Conversão</h3>
        <p className="text-center text-muted-foreground">Sem dados disponíveis</p>
      </div>
    );
  }

  // Calculate overall efficiency (Vendas / Impressões)
  const overallEfficiency = funnelData[0].value > 0 
    ? (funnelData[3].value / funnelData[0].value) * 100 
    : 0;

  return (
    <div className="glow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">Análise de Funil de Conversão</h3>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-xs text-muted-foreground">Eficiência Geral:</span>
          <span className="text-sm font-bold text-primary">{formatPercent(overallEfficiency)}</span>
        </div>
      </div>
      
      <div className="flex flex-col items-center space-y-1">
        {funnelData.map((stage, index) => (
          <FunnelStage
            key={stage.name}
            name={stage.name}
            value={stage.value}
            conversionRate={stage.conversionRate}
            icon={stage.icon}
            width={stage.width}
            isLast={stage.isLast}
          />
        ))}
      </div>
    </div>
  );
}
