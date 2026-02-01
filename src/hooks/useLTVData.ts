import { useState, useMemo, useCallback } from 'react';
import {
  LTVRecord,
  LTVFiltersState,
  LTVMetrics,
  CohortData,
  ChannelLTVData,
  SurvivalPoint,
  MonthlyChurnPoint,
  TicketDistribution,
} from '@/types/ltv';
import {
  parseLTVCSV,
  filterLTVRecords,
  calculateLTVMetrics,
  calculateSurvivalCurve,
  calculateLTVByChannel,
  calculateMonthlyChurn,
  calculateTicketDistribution,
  calculateCohortData,
  getUniqueChannels,
} from '@/lib/ltvUtils';

export function useLTVData() {
  const [rawRecords, setRawRecords] = useState<LTVRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<LTVFiltersState>({
    dateRange: { from: undefined, to: undefined },
    canais: [],
    status: 'todos',
  });
  
  // Parse CSV file
  const loadCSV = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const records = parseLTVCSV(text);
      
      if (records.length === 0) {
        setError('Nenhum registro válido encontrado no CSV');
        return;
      }
      
      setRawRecords(records);
    } catch (err) {
      setError('Erro ao processar o arquivo CSV');
      console.error('CSV parsing error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
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
  
  const setStatus = useCallback((status: 'todos' | 'ativos' | 'cancelados') => {
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
    
    // Loading/error state
    isLoading,
    error,
    
    // Actions
    loadCSV,
    
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
