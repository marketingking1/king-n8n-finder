import { useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFilters, MIN_DATE } from '@/hooks/useFilters';
import { useFilteredSheetsData, useSheetsFilterOptions, sheetsToMarketingData } from '@/hooks/useGoogleSheetsData';
import { useMacroData } from '@/hooks/useMacroData';
import { calculateMetrics, groupByCampaign, groupByTime, calculateFunnel, calculateVariation } from '@/lib/metrics';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { MacroKPICards } from '@/components/dashboard/MacroKPICards';
import { KPICards } from '@/components/dashboard/KPICards';
import { TrendCharts } from '@/components/dashboard/TrendCharts';
import { CampaignTable } from '@/components/dashboard/CampaignTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigate } from 'react-router-dom';
import { subDays } from 'date-fns';

export default function Dashboard() {
  const { user, session, loading: authLoading } = useAuth();
  const { filters, setDateRange, setGranularity, setCampanhas, setGrupos, setCanais, resetFilters } = useFilters();
  const [activeTab, setActiveTab] = useState('macro');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Handler to refresh all data
  const handleRefreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['google-sheets-data'] });
    queryClient.invalidateQueries({ queryKey: ['macro-sheets-data'] });
    toast({
      title: 'Atualizando dados...',
      description: 'Os dados estão sendo recarregados.',
    });
  }, [queryClient, toast]);
  
  // Fetch all data from Google Sheets
  const { data: filteredSheetsData, isLoading: dataLoading } = useFilteredSheetsData(filters);
  const { data: filterOptions } = useSheetsFilterOptions();
  
  // Macro data (current month vs previous month)
  const { current: macroMetrics, previous: previousMacroMetrics, isLoading: macroLoading } = useMacroData();
  
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
      <DashboardHeader
        filters={filters}
        filterOptions={filterOptions || { campanhas: [], grupos: [], canais: [] }}
        onDateRangeChange={setDateRange}
        onGranularityChange={setGranularity}
        onCampanhasChange={setCampanhas}
        onGruposChange={setGrupos}
        onCanaisChange={setCanais}
        onReset={resetFilters}
        onRefreshData={handleRefreshData}
      />
      
      <main className="p-6">
        <DashboardTabs
          macroContent={macroContent}
          detailedContent={detailedContent}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </main>
    </div>
  );
}
