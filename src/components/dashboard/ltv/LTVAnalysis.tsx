import { motion } from 'framer-motion';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { useLTVData } from '@/hooks/useLTVData';
import { LTVFilters } from './LTVFilters';
import { LTVKPICards } from './LTVKPICards';
import { SurvivalCurveChart } from './SurvivalCurveChart';
import { LTVByChannelChart } from './LTVByChannelChart';
import { MonthlyChurnChart } from './MonthlyChurnChart';
import { TicketDistributionChart } from './TicketDistributionChart';
import { CohortTable } from './CohortTable';
import { ChannelLTVTable } from './ChannelLTVTable';
import { Button } from '@/components/ui/button';

export function LTVAnalysis() {
  const {
    hasData,
    isLoading,
    error,
    loadCSV,
    metrics,
    survivalCurve,
    channelLTV,
    monthlyChurn,
    ticketDistribution,
    cohortData,
    filters,
    availableChannels,
    setDateRange,
    setCanais,
    setStatus,
    resetFilters,
    filterByChannel,
  } = useLTVData();
  
  // Estado vazio: exibir botão de upload
  if (!hasData && !isLoading) {
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
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Faça upload do arquivo CSV para visualizar as métricas de Lifetime Value dos alunos.
        </p>
        <label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadCSV(file);
            }}
            className="hidden"
          />
          <Button asChild size="lg" className="gap-2 cursor-pointer">
            <span>
              <Upload className="h-5 w-5" />
              Upload CSV
            </span>
          </Button>
        </label>
        
        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}
        
        <div className="mt-8 p-4 rounded-lg bg-muted/20 border border-border max-w-lg">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Estrutura esperada do CSV:</strong><br />
            <code className="text-primary">data_da_matricula_edit, data_cancelamento, data_aluno_ativo, campanha, tag_tratada, valor_mensalidade</code>
          </p>
        </div>
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
        onUpload={loadCSV}
        isLoading={isLoading}
      />
      
      {/* KPI Cards */}
      <LTVKPICards metrics={metrics} isLoading={isLoading} />
      
      {/* Gráficos - Grid 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SurvivalCurveChart data={survivalCurve} isLoading={isLoading} />
        <LTVByChannelChart 
          data={channelLTV} 
          onChannelClick={filterByChannel}
          isLoading={isLoading} 
        />
        <MonthlyChurnChart data={monthlyChurn} isLoading={isLoading} />
        <TicketDistributionChart 
          data={ticketDistribution} 
          ticketMedio={metrics.ticketMedio}
          isLoading={isLoading} 
        />
      </div>
      
      {/* Tabela de Cohort */}
      <CohortTable data={cohortData} isLoading={isLoading} />
      
      {/* Tabela de LTV por Canal */}
      <ChannelLTVTable data={channelLTV} isLoading={isLoading} />
    </div>
  );
}
