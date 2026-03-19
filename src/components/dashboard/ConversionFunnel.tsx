import { useMemo } from 'react';
import { MacroMetrics } from '@/hooks/useMacroData';
import { FunnelMacroData } from '@/hooks/useFunnelMacroData';
import { formatNumber, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Eye, MousePointer, Users, ShoppingCart, ChevronDown, CalendarCheck, PhoneCall } from 'lucide-react';

interface ConversionFunnelProps {
  metrics: MacroMetrics | undefined;
  funnelData?: FunnelMacroData;
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
          "relative py-3 px-4 flex items-center justify-between rounded-lg border border-border transition-all duration-200 hover:border-primary/30",
          bgColor
        )}
        style={{ width: `${widthPercent}%`, minWidth: '200px' }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
            {icon}
          </div>
          <span className="text-xs font-medium text-foreground">{name}</span>
        </div>
        <span className="text-base font-display font-bold text-foreground">{formatNumber(value)}</span>
      </div>

      {/* Arrow and conversion rate */}
      {!isLast && (
        <div className="flex flex-col items-center py-1">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          {conversionRate !== undefined && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[hsl(216,30%,16%)] border border-border">
              <span className={cn(
                "text-[10px] font-semibold",
                conversionRate >= 5 ? "text-success" : conversionRate >= 1 ? "text-warning" : "text-destructive"
              )}>
                {formatPercent(conversionRate)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ConversionFunnel({ metrics, funnelData, isLoading }: ConversionFunnelProps) {
  const stages = useMemo(() => {
    if (!metrics) return null;

    const impressoes = metrics.impressoes || 0;
    const cliques = metrics.cliques || 0;
    const leadsMarketing = metrics.leads || 0;
    const vendas = metrics.conversoes || 0;

    const leads = funnelData?.leads ?? 0;
    const callAgendada = funnelData?.callAgendada ?? 0;
    const callRealizada = funnelData?.callRealizada ?? 0;

    const hasFunnelData = funnelData && (leads > 0 || callAgendada > 0 || callRealizada > 0);

    // Calculate conversion rates between stages
    const impressoesToCliques = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
    const cliquesToLeads = cliques > 0 ? (leadsMarketing / cliques) * 100 : 0;

    if (hasFunnelData) {
      // Full funnel: Impressões → Cliques → Leads (CRM) → Call Agendada → Call Realizada → Vendas
      const cliquesToLeadsCRM = cliques > 0 ? (leads / cliques) * 100 : 0;
      const leadsToCallAgendada = leads > 0 ? (callAgendada / leads) * 100 : 0;
      const callAgendadaToRealizada = callAgendada > 0 ? (callRealizada / callAgendada) * 100 : 0;
      const callRealizadaToVendas = callRealizada > 0 ? (vendas / callRealizada) * 100 : 0;

      return [
        {
          name: 'Impressões', value: impressoes, conversionRate: impressoesToCliques,
          icon: <Eye className="h-4 w-4" />, widthPercent: 100,
          bgColor: 'bg-[hsl(216,30%,14%)]'
        },
        {
          name: 'Cliques', value: cliques, conversionRate: cliquesToLeadsCRM,
          icon: <MousePointer className="h-4 w-4" />, widthPercent: 88,
          bgColor: 'bg-[hsl(216,30%,14%)]'
        },
        {
          name: 'Leads', value: leads, conversionRate: leadsToCallAgendada,
          icon: <Users className="h-4 w-4" />, widthPercent: 74,
          bgColor: 'bg-[hsl(220,30%,14%)]'
        },
        {
          name: 'Call Agendada', value: callAgendada, conversionRate: callAgendadaToRealizada,
          icon: <CalendarCheck className="h-4 w-4" />, widthPercent: 60,
          bgColor: 'bg-[hsl(220,30%,14%)]'
        },
        {
          name: 'Call Realizada', value: callRealizada, conversionRate: callRealizadaToVendas,
          icon: <PhoneCall className="h-4 w-4" />, widthPercent: 46,
          bgColor: 'bg-[hsl(220,30%,14%)]'
        },
        {
          name: 'Vendas', value: vendas,
          icon: <ShoppingCart className="h-4 w-4" />, widthPercent: 32,
          bgColor: 'bg-success/10 border-success/20', isLast: true
        },
      ];
    }

    // Fallback: simple funnel without CRM data
    const leadsToVendas = leadsMarketing > 0 ? (vendas / leadsMarketing) * 100 : 0;
    return [
      {
        name: 'Impressões', value: impressoes, conversionRate: impressoesToCliques,
        icon: <Eye className="h-4 w-4" />, widthPercent: 100,
        bgColor: 'bg-[hsl(216,30%,14%)]'
      },
      {
        name: 'Cliques', value: cliques, conversionRate: cliquesToLeads,
        icon: <MousePointer className="h-4 w-4" />, widthPercent: 82,
        bgColor: 'bg-[hsl(216,30%,14%)]'
      },
      {
        name: 'Leads', value: leadsMarketing, conversionRate: leadsToVendas,
        icon: <Users className="h-4 w-4" />, widthPercent: 64,
        bgColor: 'bg-[hsl(216,30%,14%)]'
      },
      {
        name: 'Vendas', value: vendas,
        icon: <ShoppingCart className="h-4 w-4" />, widthPercent: 46,
        bgColor: 'bg-success/10 border-success/20', isLast: true
      },
    ];
  }, [metrics, funnelData]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6">
        <h3 className="text-base font-display font-semibold mb-6 text-foreground">Funil de Conversão</h3>
        <div className="flex flex-col items-center space-y-3">
          {[100, 90, 78, 66, 54, 42, 30].map((width, i) => (
            <div
              key={i}
              className="h-12 bg-muted/20 rounded-lg animate-pulse"
              style={{ width: `${width}%`, minWidth: '200px' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!stages) {
    return (
      <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6">
        <h3 className="text-base font-display font-semibold mb-6 text-foreground">Funil de Conversão</h3>
        <p className="text-center text-muted-foreground text-sm">Sem dados disponíveis</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="mb-4">
        <h3 className="text-base font-display font-semibold text-foreground">Funil de Conversão Completo</h3>
        <p className="text-xs text-muted-foreground mt-1">Mídia → CRM → Vendas</p>
      </div>

      <div className="flex flex-col items-center">
        {stages.map((stage) => (
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
