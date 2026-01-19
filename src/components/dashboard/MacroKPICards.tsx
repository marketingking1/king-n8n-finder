import { useMemo } from 'react';
import { MacroMetrics } from '@/hooks/useMacroData';
import { GoogleSheetsData } from '@/lib/googleSheets';
import { formatCurrency, formatNumber, formatPercent, formatROAS, formatVariation } from '@/lib/formatters';
import { DollarSign, ShoppingCart, Target, BarChart3, TrendingUp, Wallet, Users, Eye, MousePointer, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

// Ticket médio do produto
const TICKET_MEDIO = 284;

interface MacroKPICardsProps {
  currentMetrics: MacroMetrics | undefined;
  previousMetrics: MacroMetrics | undefined;
  sheetsData: GoogleSheetsData | undefined;
  previousSheetsData?: GoogleSheetsData; // For future implementation
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
        return rawValue <= 300 ? 'text-success' : 'text-destructive';
      case 'roas':
        if (rawValue === undefined) return 'text-foreground';
        return rawValue >= 1 ? 'text-success' : 'text-destructive';
      case 'growth':
      case 'conversion':
        return 'text-foreground';
      default:
        return 'text-foreground';
    }
  };

  const getVariationColor = () => {
    if (variation === undefined) return 'text-muted-foreground';
    const isPositive = invertVariation ? variation < 0 : variation >= 0;
    return isPositive ? 'text-success' : 'text-destructive';
  };

  const getVariationIcon = () => {
    if (variation === undefined) return null;
    const isUp = variation >= 0;
    return isUp ? '↑' : '↓';
  };

  return (
    <div className="glow-card-strong p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0 text-primary p-2 rounded-lg bg-primary/10">
          {icon}
        </div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
      </div>
      <p className={cn("text-3xl font-bold tracking-tight mb-2", getValueColor())}>
        {value}
      </p>
      {variation !== undefined && (
        <p className={cn("text-sm font-medium", getVariationColor())}>
          {getVariationIcon()} {formatVariation(Math.abs(variation))} vs mês anterior
        </p>
      )}
    </div>
  );
}

function SecondaryKPICard({ title, value, variation, icon }: SecondaryKPICardProps) {
  const getVariationColor = () => {
    if (variation === undefined) return 'text-muted-foreground';
    return variation >= 0 ? 'text-success' : 'text-destructive';
  };

  const getVariationIcon = () => {
    if (variation === undefined) return null;
    return variation >= 0 ? '↑' : '↓';
  };

  return (
    <div className="glow-card p-4 flex items-center gap-4">
      <div className="flex-shrink-0 text-primary/70">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{title}</p>
        <p className="text-xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        {variation !== undefined && (
          <p className={cn("text-xs font-medium", getVariationColor())}>
            {getVariationIcon()} {formatVariation(Math.abs(variation))}
          </p>
        )}
      </div>
    </div>
  );
}

export function MacroKPICards({ currentMetrics, previousMetrics, sheetsData, isLoading }: MacroKPICardsProps) {
  const variations = useMemo(() => {
    if (!currentMetrics || !previousMetrics) return null;
    return {
      investimento: calculateVariation(currentMetrics.investimento, previousMetrics.investimento),
      receita: calculateVariation(currentMetrics.receita, previousMetrics.receita),
      impressoes: calculateVariation(currentMetrics.impressoes, previousMetrics.impressoes),
      cliques: calculateVariation(currentMetrics.cliques, previousMetrics.cliques),
      ctr: calculateVariation(currentMetrics.ctr, previousMetrics.ctr),
    };
  }, [currentMetrics, previousMetrics]);

  // Calculate CPA and ROAS from Supabase + Sheets data
  const vendas = sheetsData?.vendas || 0;
  const leads = sheetsData?.leads || 0;
  const investimento = currentMetrics?.investimento || 0;
  
  // Receita calculada: Vendas (Sheets) × Ticket Médio
  const receita = vendas * TICKET_MEDIO;

  const cpa = vendas > 0 ? investimento / vendas : 0;
  const roas = investimento > 0 ? receita / investimento : 0;
  const taxaConversao = sheetsData?.taxaConversao || 0;

  // Previous period calculations (simplified - using same sheets data for now)
  const prevInvestimento = previousMetrics?.investimento || 0;
  const prevVendas = vendas; // Future: get from historical sheets data
  const prevReceita = prevVendas * TICKET_MEDIO;
  const prevCpa = prevVendas > 0 ? prevInvestimento / prevVendas : 0;
  const prevRoas = prevInvestimento > 0 ? prevReceita / prevInvestimento : 0;

  const cpaVariation = calculateVariation(cpa, prevCpa);
  const roasVariation = calculateVariation(roas, prevRoas);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glow-card-strong p-6 h-32 animate-pulse bg-muted/20" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glow-card p-4 h-24 animate-pulse bg-muted/20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          colorType="conversion"
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SecondaryKPICard
          title="Receita Total"
          value={formatCurrency(receita)}
          variation={variations?.receita}
          icon={<Wallet className="h-5 w-5" />}
        />
        <SecondaryKPICard
          title="Leads Totais"
          value={formatNumber(leads)}
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
