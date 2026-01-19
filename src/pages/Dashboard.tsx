import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFilters } from '@/hooks/useFilters';
import { useDashboardData, useFilterOptions } from '@/hooks/useDashboardData';
import { useMacroData } from '@/hooks/useMacroData';
import { useGoogleSheetsData } from '@/hooks/useGoogleSheetsData';
import { calculateMetrics, groupByCampaign, groupByTime, calculateFunnel, calculateVariation } from '@/lib/metrics';
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
  
  // Only fetch data when we have a valid session
  const { data: marketingData, isLoading: dataLoading } = useDashboardData(filters);
  const { data: filterOptions } = useFilterOptions();
  
  // Macro data
  const { current: macroMetrics, previous: previousMacroMetrics, isLoading: macroLoading } = useMacroData();
  const { data: sheetsData, isLoading: sheetsLoading } = useGoogleSheetsData();
  
  // Refetch when session changes
  const isReady = !!session && !authLoading;

  // Calculate previous period for comparison
  const previousPeriodFilters = useMemo(() => {
    if (!filters.dateRange.from || !filters.dateRange.to) return filters;
    const daysDiff = Math.ceil(
      (filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      ...filters,
      dateRange: {
        from: subDays(filters.dateRange.from, daysDiff),
        to: subDays(filters.dateRange.to, daysDiff),
      },
    };
  }, [filters]);

  const { data: previousData } = useDashboardData(previousPeriodFilters);

  const metrics = useMemo(() => {
    if (!marketingData) return null;
    return calculateMetrics(marketingData);
  }, [marketingData]);

  const previousMetrics = useMemo(() => {
    if (!previousData) return null;
    return calculateMetrics(previousData);
  }, [previousData]);

  const campaignMetrics = useMemo(() => {
    if (!marketingData) return [];
    return groupByCampaign(marketingData);
  }, [marketingData]);

  const timeSeriesData = useMemo(() => {
    if (!marketingData) return [];
    return groupByTime(marketingData, filters.granularity);
  }, [marketingData, filters.granularity]);

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
        sheetsData={sheetsData}
        isLoading={macroLoading || sheetsLoading}
      />
      {/* Additional macro charts can be added here */}
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
