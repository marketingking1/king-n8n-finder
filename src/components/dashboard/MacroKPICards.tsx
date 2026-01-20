import { useMemo } from 'react';
import { MacroMetrics } from '@/hooks/useMacroData';
import { TICKET_MEDIO } from '@/lib/metrics';
import { formatCurrency, formatNumber, formatPercent, formatROAS, formatVariation } from '@/lib/formatters';
import { DollarSign, ShoppingCart, Target, BarChart3, TrendingUp, Wallet, Users, Eye, MousePointer, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetsDataSummary {
  vendas: number;
  leads: number;
  taxaConversao: number;
}

interface MacroKPICardsProps {
  currentMetrics: MacroMetrics | undefined;
  previousMetrics: MacroMetrics | null | undefined;
  sheetsData: SheetsDataSummary | undefined | null;
  isLoading: boolean;
}

interface MainKPICardProps {
  title: string;
  value: string;
  variation?: number;
  colorType: 'neutral' | 'growth' | 'cpa' | 'roas' | 'conversion';
  rawValue?: number;
  icon: React.ReactNode;
  invertVariation?: boolean;
}

interface SecondaryKPICardProps {
  title: string;
  value: string;
  variation?: number;
  icon: React.ReactNode;
}

function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function MainKPICard({ title, value, variation, colorType, rawValue, icon, invertVariation }: MainKPICardProps) {
  const getValueColor = () => {
    switch (colorType) {
      case 'cpa':
        if (rawValue === undefined) return 'text-foreground';
        // CPA bom (<= 300) = dourado (accent), CPA ruim = vermelho
        return rawValue <= 300 ? 'text-accent' : 'text-destructive-light';
      case 'roas':
        if (rawValue === undefined) return 'text-foreground';
        // ROAS bom (>= 1) = dourado (accent), ROAS ruim = vermelho
        return rawValue >= 1 ? 'text-accent' : 'text-destructive-light';
      case 'growth':
      case 'conversion':
        return 'text-foreground';
      default:
        return 'text-foreground';
    }
  };

  const getCardClass = () => {
    switch (colorType) {
      case 'cpa':
        if (rawValue === undefined) return 'glow-card-strong';
        return rawValue <= 300 ? 'glow-card-gold' : 'glow-card-red';
      case 'roas':
        if (rawValue === undefined) return 'glow-card-strong';
        return rawValue >= 1 ? 'glow-card-gold' : 'glow-card-red';
      case 'growth':
        return 'glow-card-gold';
      default:
        return 'glow-card-strong';
    }
  };

  const getIconClass = () => {
    switch (colorType) {
      case 'cpa':
        if (rawValue === undefined) return 'icon-glow-blue';
        return rawValue <= 300 ? 'icon-glow-gold' : 'icon-glow-red';
      case 'roas':
        if (rawValue === undefined) return 'icon-glow-blue';
        return rawValue >= 1 ? 'icon-glow-gold' : 'icon-glow-red';
      case 'growth':
        return 'icon-glow-gold';
      default:
        return 'icon-glow-blue';
    }
  };

  const getVariationBadge = () => {
    if (variation === undefined) return null;
    const isPositive = invertVariation ? variation < 0 : variation >= 0;
    const badgeClass = isPositive ? 'badge-positive' : 'badge-negative';
    const arrow = variation >= 0 ? '▲' : '▼';
    
    return (
      <span className={badgeClass}>
        {arrow} {formatVariation(Math.abs(variation))}
      </span>
    );
  };

  return (
    <div className={cn(getCardClass(), "p-6 flex flex-col")}>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("flex-shrink-0 p-2 rounded-lg bg-primary/10", getIconClass())}>
          {icon}
        </div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
      </div>
      <p className={cn("kpi-value mb-2", getValueColor())}>
        {value}
      </p>
      {variation !== undefined && (
        <div className="flex items-center gap-2">
          {getVariationBadge()}
          <span className="text-xs text-muted-foreground">vs mês anterior</span>
        </div>
      )}
    </div>
  );
}

function SecondaryKPICard({ title, value, variation, icon }: SecondaryKPICardProps) {
  const getVariationBadge = () => {
    if (variation === undefined) return null;
    const isPositive = variation >= 0;
    const badgeClass = isPositive ? 'badge-positive' : 'badge-negative';
    const arrow = variation >= 0 ? '▲' : '▼';
    
    return (
      <span className={cn(badgeClass, "text-[10px]")}>
        {arrow} {formatVariation(Math.abs(variation))}
      </span>
    );
  };

  return (
    <div className="glow-card p-4 flex items-center gap-4">
      <div className="flex-shrink-0 icon-glow-blue opacity-70">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{title}</p>
        <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {variation !== undefined && getVariationBadge()}
      </div>
    </div>
  );
}

export function MacroKPICards({ currentMetrics, previousMetrics, sheetsData, isLoading }: MacroKPICardsProps) {
  const variations = useMemo(() => {
    if (!currentMetrics || !previousMetrics) return null;
    return {
      investimento: calculateVariation(currentMetrics.investimento, previousMetrics.investimento),
      impressoes: calculateVariation(currentMetrics.impressoes, previousMetrics.impressoes),
      cliques: calculateVariation(currentMetrics.cliques, previousMetrics.cliques),
      ctr: calculateVariation(currentMetrics.ctr, previousMetrics.ctr),
      leads: calculateVariation(currentMetrics.leads, previousMetrics.leads),
      conversoes: calculateVariation(currentMetrics.conversoes, previousMetrics.conversoes),
    };
  }, [currentMetrics, previousMetrics]);

  // Use currentMetrics from Sheets data
  const vendas = currentMetrics?.conversoes || 0;
  const leads = currentMetrics?.leads || 0;
  const investimento = currentMetrics?.investimento || 0;
  const custoVendedor = currentMetrics?.custoVendedor || 0;
  
  // Receita calculada: Vendas × Ticket Médio
  const receita = vendas * TICKET_MEDIO;

  const cpa = vendas > 0 ? investimento / vendas : 0;
  const roas = investimento > 0 ? receita / investimento : 0;
  const taxaConversao = leads > 0 ? (vendas / leads) * 100 : 0;
  
  // CAC Projetado = Custo do Vendedor + CPA
  const cacProjetado = custoVendedor + cpa;

  // Calculate CPA and ROAS variation
  const prevVendas = previousMetrics?.conversoes || 0;
  const prevInvestimento = previousMetrics?.investimento || 0;
  const prevReceita = prevVendas * TICKET_MEDIO;
  const prevCpa = prevVendas > 0 ? prevInvestimento / prevVendas : 0;
  const prevRoas = prevInvestimento > 0 ? prevReceita / prevInvestimento : 0;
  const prevTaxaConversao = (previousMetrics?.leads || 0) > 0 
    ? (prevVendas / (previousMetrics?.leads || 1)) * 100 
    : 0;

  const cpaVariation = previousMetrics ? calculateVariation(cpa, prevCpa) : undefined;
  const roasVariation = previousMetrics ? calculateVariation(roas, prevRoas) : undefined;
  const taxaVariation = previousMetrics ? calculateVariation(taxaConversao, prevTaxaConversao) : undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glow-card p-6 h-32 skeleton-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glow-card p-4 h-24 skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MainKPICard
          title="Investimento Total"
          value={formatCurrency(investimento)}
          variation={variations?.investimento}
          colorType="neutral"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <MainKPICard
          title="Vendas (Conversões)"
          value={formatNumber(vendas)}
          variation={variations?.conversoes}
          colorType="growth"
          icon={<ShoppingCart className="h-6 w-6" />}
        />
        <MainKPICard
          title="CPA"
          value={formatCurrency(cpa)}
          variation={cpaVariation}
          colorType="cpa"
          rawValue={cpa}
          invertVariation={true}
          icon={<Target className="h-6 w-6" />}
        />
        <MainKPICard
          title="CAC Projetado"
          value={formatCurrency(cacProjetado)}
          colorType="cpa"
          rawValue={cacProjetado}
          icon={<Wallet className="h-6 w-6" />}
        />
        <MainKPICard
          title="ROAS"
          value={formatROAS(roas)}
          variation={roasVariation}
          colorType="roas"
          rawValue={roas}
          icon={<BarChart3 className="h-6 w-6" />}
        />
        <MainKPICard
          title="Taxa Conversão Lead→Venda"
          value={formatPercent(taxaConversao)}
          variation={taxaVariation}
          colorType="conversion"
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SecondaryKPICard
          title="Receita Total"
          value={formatCurrency(receita)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <SecondaryKPICard
          title="Leads Totais"
          value={formatNumber(leads)}
          variation={variations?.leads}
          icon={<Users className="h-5 w-5" />}
        />
        <SecondaryKPICard
          title="Impressões"
          value={formatNumber(currentMetrics?.impressoes || 0)}
          variation={variations?.impressoes}
          icon={<Eye className="h-5 w-5" />}
        />
        <SecondaryKPICard
          title="Cliques"
          value={formatNumber(currentMetrics?.cliques || 0)}
          variation={variations?.cliques}
          icon={<MousePointer className="h-5 w-5" />}
        />
        <SecondaryKPICard
          title="CTR"
          value={formatPercent(currentMetrics?.ctr || 0)}
          variation={variations?.ctr}
          icon={<Percent className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
