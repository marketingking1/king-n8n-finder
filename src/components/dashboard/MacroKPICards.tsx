import { useMemo } from 'react';
import { MacroMetrics } from '@/hooks/useMacroData';
import { TICKET_MEDIO } from '@/lib/metrics';
import { formatCurrency, formatNumber, formatPercent, formatROAS, formatVariation } from '@/lib/formatters';
import { DollarSign, ShoppingCart, Target, BarChart3, TrendingUp, Wallet, Users, Eye, MousePointer, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  index: number;
}

interface SecondaryKPICardProps {
  title: string;
  value: string;
  variation?: number;
  icon: React.ReactNode;
  index: number;
}

function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

const mainCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const secondaryCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.5 + i * 0.06,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

function MainKPICard({ title, value, variation, colorType, rawValue, icon, invertVariation, index }: MainKPICardProps) {
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
    <motion.div
      custom={index}
      variants={mainCardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:border-primary/30 transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0 p-2.5 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
      </div>
      <p className={cn("text-3xl font-display font-bold tracking-tight mb-2", getValueColor())}>
        {value}
      </p>
      {variation !== undefined && (
        <p className={cn("text-xs font-medium flex items-center gap-1", getVariationColor())}>
          <span>{getVariationIcon()}</span>
          <span>{formatVariation(Math.abs(variation))} vs mês anterior</span>
        </p>
      )}
    </motion.div>
  );
}

function SecondaryKPICard({ title, value, variation, icon, index }: SecondaryKPICardProps) {
  const getVariationColor = () => {
    if (variation === undefined) return 'text-muted-foreground';
    return variation >= 0 ? 'text-success' : 'text-destructive';
  };

  const getVariationIcon = () => {
    if (variation === undefined) return null;
    return variation >= 0 ? '↑' : '↓';
  };

  return (
    <motion.div
      custom={index}
      variants={secondaryCardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 text-primary/70">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate mb-1">{title}</p>
          <p className="text-xl font-display font-bold tracking-tight text-foreground">
            {value}
          </p>
          {variation !== undefined && (
            <p className={cn("text-xs font-medium mt-1", getVariationColor())}>
              {getVariationIcon()} {formatVariation(Math.abs(variation))}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Loading skeleton component
function KPICardSkeleton({ isMain = false }: { isMain?: boolean }) {
  return (
    <div className={cn(
      "rounded-lg border border-border bg-[hsl(215,35%,11%)] animate-pulse",
      isMain ? "p-6 h-36" : "p-4 h-24"
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-muted/30" />
        <div className="h-3 w-20 bg-muted/30 rounded" />
      </div>
      <div className="h-8 w-24 bg-muted/30 rounded mb-2" />
      <div className="h-3 w-32 bg-muted/30 rounded" />
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <KPICardSkeleton key={i} isMain />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MainKPICard
          title="Investimento Total"
          value={formatCurrency(investimento)}
          variation={variations?.investimento}
          colorType="neutral"
          icon={<DollarSign className="h-5 w-5" />}
          index={0}
        />
        <MainKPICard
          title="Vendas (Conversões)"
          value={formatNumber(vendas)}
          variation={variations?.conversoes}
          colorType="growth"
          icon={<ShoppingCart className="h-5 w-5" />}
          index={1}
        />
        <MainKPICard
          title="CPA"
          value={formatCurrency(cpa)}
          variation={cpaVariation}
          colorType="cpa"
          rawValue={cpa}
          invertVariation={true}
          icon={<Target className="h-5 w-5" />}
          index={2}
        />
        <MainKPICard
          title="CAC Projetado"
          value={formatCurrency(cacProjetado)}
          colorType="cpa"
          rawValue={cacProjetado}
          icon={<Wallet className="h-5 w-5" />}
          index={3}
        />
        <MainKPICard
          title="ROAS"
          value={formatROAS(roas)}
          variation={roasVariation}
          colorType="roas"
          rawValue={roas}
          icon={<BarChart3 className="h-5 w-5" />}
          index={4}
        />
        <MainKPICard
          title="Taxa Conversão Lead→Venda"
          value={formatPercent(taxaConversao)}
          variation={taxaVariation}
          colorType="conversion"
          icon={<TrendingUp className="h-5 w-5" />}
          index={5}
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SecondaryKPICard
          title="Receita Total"
          value={formatCurrency(receita)}
          icon={<Wallet className="h-5 w-5" />}
          index={0}
        />
        <SecondaryKPICard
          title="Leads Totais"
          value={formatNumber(leads)}
          variation={variations?.leads}
          icon={<Users className="h-5 w-5" />}
          index={1}
        />
        <SecondaryKPICard
          title="Impressões"
          value={formatNumber(currentMetrics?.impressoes || 0)}
          variation={variations?.impressoes}
          icon={<Eye className="h-5 w-5" />}
          index={2}
        />
        <SecondaryKPICard
          title="Cliques"
          value={formatNumber(currentMetrics?.cliques || 0)}
          variation={variations?.cliques}
          icon={<MousePointer className="h-5 w-5" />}
          index={3}
        />
        <SecondaryKPICard
          title="CTR"
          value={formatPercent(currentMetrics?.ctr || 0)}
          variation={variations?.ctr}
          icon={<Percent className="h-5 w-5" />}
          index={4}
        />
      </div>
    </div>
  );
}
