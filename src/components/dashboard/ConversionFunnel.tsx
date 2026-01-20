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
          "relative py-4 px-5 flex items-center justify-between rounded-xl border border-border/50 transition-all duration-300 hover:scale-[1.02]",
          bgColor
        )}
        style={{ width: `${widthPercent}%`, minWidth: '200px' }}
      >
        <div className="flex items-center gap-3">
          <div className="text-primary p-2 rounded-lg bg-primary/20">
            {icon}
          </div>
          <span className="text-sm font-medium text-foreground">{name}</span>
        </div>
        <span className="text-lg font-bold text-foreground">{formatNumber(value)}</span>
      </div>
      
      {/* Arrow and conversion rate */}
      {!isLast && (
        <div className="flex flex-col items-center py-3">
          <ChevronDown className="h-6 w-6 text-primary/60" />
          {conversionRate !== undefined && (
            <div className="flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-card/80 border border-border/30">
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
      { 
        name: 'Impressões', 
        value: impressoes, 
        conversionRate: impressoesToCliques, 
        icon: <Eye className="h-5 w-5" />, 
        widthPercent: 100,
        bgColor: 'bg-gradient-to-r from-primary/20 to-primary/10'
      },
      { 
        name: 'Cliques', 
        value: cliques, 
        conversionRate: cliquesToLeads, 
        icon: <MousePointer className="h-5 w-5" />, 
        widthPercent: 82,
        bgColor: 'bg-gradient-to-r from-chart-blue/20 to-chart-blue/10'
      },
      { 
        name: 'Leads', 
        value: leads, 
        conversionRate: leadsToVendas, 
        icon: <Users className="h-5 w-5" />, 
        widthPercent: 64,
        bgColor: 'bg-gradient-to-r from-chart-royal/20 to-chart-royal/10'
      },
      { 
        name: 'Vendas', 
        value: vendas, 
        icon: <ShoppingCart className="h-5 w-5" />, 
        widthPercent: 46,
        bgColor: 'bg-gradient-to-r from-success/20 to-success/10',
        isLast: true
      },
    ];
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="glow-card p-6">
        <h3 className="text-lg font-display font-semibold mb-6 text-foreground">Funil de Conversão</h3>
        <div className="flex flex-col items-center space-y-4">
          {[100, 82, 64, 46].map((width, i) => (
            <div 
              key={i} 
              className="h-14 bg-muted/20 rounded-xl animate-pulse"
              style={{ width: `${width}%`, minWidth: '200px' }}
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
