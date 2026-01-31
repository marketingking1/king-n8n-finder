import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  fetchCreativeData,
  filterCreativesByDateRange,
  extractCreativeFilterOptions,
  aggregateByCreative,
  calculateCreativeKPIs,
} from '@/lib/creativeSheets';
import { VideoCreativeRow } from '@/types/creative';

export function useCreativeData() {
  return useQuery<VideoCreativeRow[]>({
    queryKey: ['creative-sheets-data'],
    queryFn: fetchCreativeData,
    staleTime: 5 * 60 * 1000,      // 5 minutos
    gcTime: 10 * 60 * 1000,
    // Bug 10: Avoid unnecessary refetches
    refetchOnMount: false,           // usa cache se não está stale
    refetchOnWindowFocus: false,     // evita calls ao trocar de aba do browser
    retry: 2,
  });
}

// Bug 5: Interface expandida para suportar filtros de campanha e criativo
interface CreativeFilters {
  dateRange?: { from?: Date; to?: Date };
  campanhas?: string[];
  criativos?: string[];
}

export function useFilteredCreativeData(filters?: CreativeFilters) {
  const { data, isLoading, error } = useCreativeData();

  const filteredData = useMemo(() => {
    if (!data) return null;

    let filtered = filterCreativesByDateRange(
      data,
      filters?.dateRange?.from,
      filters?.dateRange?.to
    );

    // Filtro por campanha
    if (filters?.campanhas && filters.campanhas.length > 0) {
      filtered = filtered.filter(row => filters.campanhas!.includes(row.campanha));
    }

    // Filtro por criativo
    if (filters?.criativos && filters.criativos.length > 0) {
      filtered = filtered.filter(row => filters.criativos!.includes(row.ads));
    }

    return filtered;
  }, [data, filters?.dateRange?.from, filters?.dateRange?.to, filters?.campanhas, filters?.criativos]);

  const aggregated = useMemo(() => {
    if (!filteredData) return [];
    return aggregateByCreative(filteredData);
  }, [filteredData]);

  const kpis = useMemo(() => {
    if (!filteredData) return null;
    return calculateCreativeKPIs(filteredData);
  }, [filteredData]);

  return { 
    rawData: filteredData, 
    aggregated, 
    kpis,
    isLoading, 
    error 
  };
}

export function useCreativeFilterOptions() {
  const { data, isLoading } = useCreativeData();

  const filterOptions = useMemo(() => {
    if (!data) return { campanhas: [], criativos: [] };
    return extractCreativeFilterOptions(data);
  }, [data]);

  return { data: filterOptions, isLoading };
}
