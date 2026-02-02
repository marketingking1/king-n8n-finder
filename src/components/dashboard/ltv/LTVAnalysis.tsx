import { motion } from 'framer-motion';
import { FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useLTVData } from '@/hooks/useLTVData';
import { LTVFilters } from './LTVFilters';
import { LTVKPICards } from './LTVKPICards';
import { SurvivalCurveChart } from './SurvivalCurveChart';
import { LTVByChannelChart } from './LTVByChannelChart';
import { MonthlyChurnChart } from './MonthlyChurnChart';
import { TicketDistributionChart } from './TicketDistributionChart';
import { StatusBreakdownChart } from './StatusBreakdownChart';
import { CohortTable } from './CohortTable';
import { ChannelLTVTable } from './ChannelLTVTable';
import { Skeleton } from '@/components/ui/skeleton';

export function LTVAnalysis() {
  const {
    hasData,
    isLoading,
    error,
    metrics,
    survivalCurve,
    channelLTV,
    monthlyChurn,
    ticketDistribution,
    cohortData,
    statusBreakdown,
    filters,
    availableChannels,
    setDateRange,
    setCanais,
    setStatus,
    resetFilters,
    filterByChannel,
  } = useLTVData();
  
  // Estado de loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[350px] rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
      </div>
    );
  }
  
  // Estado de erro
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 px-4"
      >
        <div className="rounded-full bg-destructive/10 p-6 mb-6">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>
        <h3 className="text-xl font-display font-semibold text-foreground mb-2">
          Erro ao carregar dados
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          {error}
        </p>
      </motion.div>
    );
  }
  
  // Estado vazio
  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 px-4"
      >
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <FileSpreadsheet className="h-16 w-16 text-primary" />
        </div>
        <h3 className="text-xl font-display font-semibold text-foreground mb-2">
          Análise de LTV
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Nenhum dado encontrado na aba LTV_TRATADOS.
        </p>
      </motion.div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <LTVFilters
        filters={filters}
        availableChannels={availableChannels}
        onDateRangeChange={setDateRange}
        onCanaisChange={setCanais}
        onStatusChange={setStatus}
        onReset={resetFilters}
      />
      
      {/* KPI Cards */}
      <LTVKPICards metrics={metrics} isLoading={isLoading} />
      
      {/* Gráficos - Grid 2x2 (parte 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SurvivalCurveChart data={survivalCurve} isLoading={isLoading} />
        <LTVByChannelChart 
          data={channelLTV} 
          onChannelClick={filterByChannel}
          isLoading={isLoading} 
        />
      </div>
      
      {/* Gráficos - Grid 2x2 (parte 2) + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MonthlyChurnChart data={monthlyChurn} isLoading={isLoading} />
        <TicketDistributionChart 
          data={ticketDistribution} 
          ticketMedio={metrics.ticketMedio}
          isLoading={isLoading} 
        />
        <StatusBreakdownChart data={statusBreakdown} isLoading={isLoading} />
      </div>
      
      {/* Tabela de Cohort */}
      <CohortTable data={cohortData} isLoading={isLoading} />
      
      {/* Tabela de LTV por Canal */}
      <ChannelLTVTable data={channelLTV} isLoading={isLoading} />
    </div>
  );
}
