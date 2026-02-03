import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LTVRecord,
  LTVFiltersState,
  LTVMetrics,
  CohortData,
  ChannelLTVData,
  SurvivalPoint,
  MonthlyChurnPoint,
  TicketDistribution,
  StatusBreakdown,
} from '@/types/ltv';
import {
  fetchLTVData,
  filterLTVRecords,
  calculateLTVMetrics,
  calculateSurvivalCurve,
  calculateLTVByChannel,
  calculateMonthlyChurn,
  calculateTicketDistribution,
  calculateCohortData,
  calculateStatusBreakdown,
  getUniqueChannels,
} from '@/lib/ltvUtils';

export function useLTVData() {
  // Fetch data from Google Sheets
  const { data: rawRecords = [], isLoading, error } = useQuery({
    queryKey: ['ltv-sheets-data'],
    queryFn: fetchLTVData,
    staleTime: 0,
    gcTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });
  
  const [filters, setFilters] = useState<LTVFiltersState>({
    dateRange: { from: undefined, to: undefined },
    canais: [],
    status: 'todos',
  });
  
  // Filtered records
  const filteredRecords = useMemo(() => {
    return filterLTVRecords(rawRecords, filters);
  }, [rawRecords, filters]);
  
  // All calculated metrics
  const metrics: LTVMetrics = useMemo(() => {
    return calculateLTVMetrics(filteredRecords);
  }, [filteredRecords]);
  
  const survivalCurve: SurvivalPoint[] = useMemo(() => {
    return calculateSurvivalCurve(filteredRecords);
  }, [filteredRecords]);
  
  const channelLTV: ChannelLTVData[] = useMemo(() => {
    return calculateLTVByChannel(filteredRecords);
  }, [filteredRecords]);
  
  const monthlyChurn: MonthlyChurnPoint[] = useMemo(() => {
    return calculateMonthlyChurn(filteredRecords);
  }, [filteredRecords]);
  
  const ticketDistribution: TicketDistribution[] = useMemo(() => {
    return calculateTicketDistribution(filteredRecords);
  }, [filteredRecords]);
  
  const cohortData: CohortData[] = useMemo(() => {
    return calculateCohortData(filteredRecords);
  }, [filteredRecords]);
  
  const statusBreakdown: StatusBreakdown[] = useMemo(() => {
    return calculateStatusBreakdown(filteredRecords);
  }, [filteredRecords]);
  
  // Available channels for filter
  const availableChannels = useMemo(() => {
    return getUniqueChannels(rawRecords);
  }, [rawRecords]);
  
  // Filter setters
  const setDateRange = useCallback((from: Date | undefined, to: Date | undefined) => {
    setFilters(prev => ({ ...prev, dateRange: { from, to } }));
  }, []);
  
  const setCanais = useCallback((canais: string[]) => {
    setFilters(prev => ({ ...prev, canais }));
  }, []);
  
  const setStatus = useCallback((status: 'todos' | 'ativo' | 'cancelado' | 'pausado') => {
    setFilters(prev => ({ ...prev, status }));
  }, []);
  
  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: { from: undefined, to: undefined },
      canais: [],
      status: 'todos',
    });
  }, []);
  
  // Filter by channel (click on chart)
  const filterByChannel = useCallback((canal: string) => {
    setFilters(prev => ({
      ...prev,
      canais: prev.canais.includes(canal) ? [] : [canal],
    }));
  }, []);
  
  return {
    // Data
    rawRecords,
    filteredRecords,
    hasData: rawRecords.length > 0,
    
    // Metrics
    metrics,
    survivalCurve,
    channelLTV,
    monthlyChurn,
    ticketDistribution,
    cohortData,
    statusBreakdown,
    
    // Loading/error state
    isLoading,
    error: error ? String(error) : null,
    
    // Filters
    filters,
    availableChannels,
    setDateRange,
    setCanais,
    setStatus,
    resetFilters,
    filterByChannel,
  };
}
