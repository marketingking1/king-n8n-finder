import { useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFilters, MIN_DATE } from '@/hooks/useFilters';
import { useFilteredSheetsData, useSheetsFilterOptions, sheetsToMarketingData } from '@/hooks/useGoogleSheetsData';
import { useMacroData } from '@/hooks/useMacroData';
import { calculateMetrics, groupByCampaign, groupByTime, calculateFunnel, calculateVariation } from '@/lib/metrics';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { MacroKPICards } from '@/components/dashboard/MacroKPICards';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { YoYComparison } from '@/components/dashboard/YoYComparison';
import { ChannelPerformanceTable } from '@/components/dashboard/ChannelPerformanceTable';
import { ChannelMixChart } from '@/components/dashboard/charts/ChannelMixChart';
import { ChannelEfficiencyScatter } from '@/components/dashboard/charts/ChannelEfficiencyScatter';
import { KPICards } from '@/components/dashboard/KPICards';
import { TrendCharts } from '@/components/dashboard/TrendCharts';
import { CampaignTable } from '@/components/dashboard/CampaignTable';
import { CreativeAnalysis } from '@/components/dashboard/CreativeAnalysis';
import { LTVAnalysis } from '@/components/dashboard/ltv/LTVAnalysis';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigate } from 'react-router-dom';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { user, session, loading: authLoading } = useAuth();
  const { filters, setDateRange, setGranularity, setCampanhas, setGrupos, setCanais, resetFilters } = useFilters();
  const [activeTab, setActiveTab] = useState('macro');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State para popup de aviso
  const [showFilterWarning, setShowFilterWarning] = useState(false);

  // Handlers que mostram aviso na aba Macro
  const showMacroFilterWarning = useCallback(() => {
    setShowFilterWarning(true);
    setTimeout(() => setShowFilterWarning(false), 2500);
  }, []);

  const handleCampanhasChange = useCallback((campanhas: string[]) => {
    if (activeTab === 'macro' && campanhas.length > 0) {
      showMacroFilterWarning();
      return;
    }
    setCampanhas(campanhas);
  }, [activeTab, setCampanhas, showMacroFilterWarning]);

  const handleGruposChange = useCallback((grupos: string[]) => {
    if (activeTab === 'macro' && grupos.length > 0) {
      showMacroFilterWarning();
      return;
    }
    setGrupos(grupos);
  }, [activeTab, setGrupos, showMacroFilterWarning]);

  const handleCanaisChange = useCallback((canais: string[]) => {
    if (activeTab === 'macro' && canais.length > 0) {
      showMacroFilterWarning();
      return;
    }
    setCanais(canais);
  }, [activeTab, setCanais, showMacroFilterWarning]);
  
  // Handler to refresh all data
  const handleRefreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['google-sheets-data'] });
    // Legacy key (kept to avoid breaking any older cache usage)
    queryClient.invalidateQueries({ queryKey: ['macro-sheets-data'] });
    // Current Macro (2026) key
    queryClient.invalidateQueries({ queryKey: ['macro-2026-data'] });
    queryClient.invalidateQueries({ queryKey: ['creative-sheets-data'] });
    queryClient.invalidateQueries({ queryKey: ['leads-compradores-data'] });
    toast({
      title: 'Atualizando dados...',
      description: 'Os dados estão sendo recarregados.',
    });
  }, [queryClient, toast]);
  
  // Fetch all data from Google Sheets
  const { data: filteredSheetsData, isLoading: dataLoading } = useFilteredSheetsData(filters);
  const { data: filterOptions } = useSheetsFilterOptions();
  
  // Macro data (current month vs previous month)
  const { current: macroMetrics, previous: previousMacroMetrics, channelMetrics, isLoading: macroLoading } = useMacroData(filters.dateRange);
  
  // Convert sheets data to MarketingData format
  const marketingData = useMemo(() => {
    if (!filteredSheetsData) return null;
    return sheetsToMarketingData(filteredSheetsData.rows);
  }, [filteredSheetsData]);

  // Calculate previous period for comparison (only if within valid date range)
  const previousPeriodFilters = useMemo(() => {
    if (!filters.dateRange.from || !filters.dateRange.to) return null;
    const daysDiff = Math.ceil(
      (filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
    );
    const prevFrom = subDays(filters.dateRange.from, daysDiff);
    
    // Não comparar se período anterior for antes de 2026
    if (prevFrom < MIN_DATE) return null;
    
    return {
      ...filters,
      dateRange: {
        from: prevFrom,
        to: subDays(filters.dateRange.to, daysDiff),
      },
    };
  }, [filters]);

  const { data: previousSheetsData } = useFilteredSheetsData(previousPeriodFilters || filters);
  const hasPreviousData = previousPeriodFilters !== null;

  const previousMarketingData = useMemo(() => {
    if (!hasPreviousData || !previousSheetsData) return null;
    return sheetsToMarketingData(previousSheetsData.rows);
  }, [previousSheetsData, hasPreviousData]);

  const metrics = useMemo(() => {
    if (!marketingData) return null;
    return calculateMetrics(marketingData);
  }, [marketingData]);

  const previousMetrics = useMemo(() => {
    if (!previousMarketingData) return null;
    return calculateMetrics(previousMarketingData);
  }, [previousMarketingData]);

  const campaignMetrics = useMemo(() => {
    if (!marketingData) return [];
    return groupByCampaign(marketingData);
  }, [marketingData]);

  const timeSeriesData = useMemo(() => {
    if (!marketingData) return [];
    return groupByTime(marketingData, filters.granularity);
  }, [marketingData, filters.granularity]);

  // Dados agregados por semana para o gráfico de CTR (sempre semanal)
  const weeklyTimeSeriesData = useMemo(() => {
    if (!marketingData) return [];
    return groupByTime(marketingData, 'week');
  }, [marketingData]);

  const funnelData = useMemo(() => {
    if (!marketingData) return [];
    return calculateFunnel(marketingData);
  }, [marketingData]);

  const variations = useMemo(() => {
    if (!metrics || !previousMetrics) return null;
    return {
      investimento: calculateVariation(metrics.investimento, previousMetrics.investimento),
      conversoes: calculateVariation(metrics.conversoes, previousMetrics.conversoes),
      cpa: calculateVariation(metrics.cpa, previousMetrics.cpa),
      roas: calculateVariation(metrics.roas, previousMetrics.roas),
      receita: calculateVariation(metrics.receita, previousMetrics.receita),
    };
  }, [metrics, previousMetrics]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-16 w-full mb-6" />
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const macroContent = (
    <div className="space-y-6">
      <MacroKPICards
        currentMetrics={macroMetrics}
        previousMetrics={previousMacroMetrics}
        sheetsData={filteredSheetsData}
        isLoading={macroLoading || dataLoading}
      />
      
      {/* Channel Performance Table */}
      <ChannelPerformanceTable 
        data={channelMetrics} 
        isLoading={macroLoading || dataLoading} 
      />
      
      {/* Funnel, Channel Mix and YoY Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ConversionFunnel 
          metrics={macroMetrics} 
          isLoading={macroLoading || dataLoading} 
        />
        <ChannelMixChart 
          data={channelMetrics} 
          isLoading={macroLoading || dataLoading} 
        />
        <YoYComparison 
          currentData={macroMetrics ? {
            vendas: macroMetrics.conversoes,
            leads: macroMetrics.leads,
            investimento: macroMetrics.investimento,
          } : undefined}
          isLoading={macroLoading || dataLoading}
        />
      </div>

      {/* Channel Efficiency Scatter */}
      <ChannelEfficiencyScatter 
        data={channelMetrics} 
        isLoading={macroLoading || dataLoading} 
      />
    </div>
  );

  const detailedContent = (
    <>
      {dataLoading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </>
      ) : metrics ? (
        <div className="space-y-6">
          <KPICards metrics={metrics} variations={variations} />
          <TrendCharts 
            timeSeriesData={timeSeriesData} 
            weeklyTimeSeriesData={weeklyTimeSeriesData}
            funnelData={funnelData}
            campaignMetrics={campaignMetrics}
          />
          <CampaignTable 
            data={campaignMetrics} 
            allData={marketingData || []}
          />
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          Nenhum dado encontrado para o período selecionado
        </div>
      )}
    </>
  );


  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />

      {/* Main Content Area - ajusta margem baseado na sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        "ml-56" // Sidebar width when expanded
      )}>
        {/* Popup flutuante de aviso */}
        {showFilterWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-card text-card-foreground px-6 py-4 rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-300 pointer-events-auto">
              <p className="text-sm font-medium text-center">
                Este filtro só pode ser aplicado na aba <span className="font-bold text-primary">Análise Micro</span>
              </p>
            </div>
          </div>
        )}

        <DashboardHeader
          filters={filters}
          filterOptions={filterOptions || { campanhas: [], grupos: [], canais: [] }}
          onDateRangeChange={setDateRange}
          onGranularityChange={setGranularity}
          onCampanhasChange={handleCampanhasChange}
          onGruposChange={handleGruposChange}
          onCanaisChange={handleCanaisChange}
          onReset={resetFilters}
          onRefreshData={handleRefreshData}
        />
        
        <main className="p-6">
          {/* Tab Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {activeTab === 'macro' 
                ? 'Visão Macro' 
                : activeTab === 'detailed' 
                  ? 'Análise Micro' 
                  : activeTab === 'criativos'
                    ? 'Análise Nano'
                    : 'Análise LTV'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'macro' 
                ? 'Consolidação geral do negócio e métricas de alto nível'
                : activeTab === 'detailed'
                  ? 'Performance detalhada de campanhas e métricas de mídia'
                  : activeTab === 'criativos'
                    ? 'Performance de criativos de vídeo e métricas de retenção'
                    : 'Lifetime Value e análise de retenção de alunos'
              }
            </p>
          </div>

          {/* Content based on active tab */}
          <div className="animate-fade-in">
            {activeTab === 'macro' && macroContent}
            {activeTab === 'detailed' && detailedContent}
            {activeTab === 'criativos' && (
              <CreativeAnalysis 
                dateRange={filters.dateRange} 
                campanhas={filters.campanhas}
              />
            )}
            {activeTab === 'ltv' && <LTVAnalysis />}
          </div>
        </main>
      </div>
    </div>
  );
}
