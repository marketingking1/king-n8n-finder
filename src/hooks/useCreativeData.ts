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
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export function useFilteredCreativeData(dateRange?: { from?: Date; to?: Date }) {
  const { data, isLoading, error } = useCreativeData();

  const filteredData = useMemo(() => {
    if (!data) return null;
    return filterCreativesByDateRange(data, dateRange?.from, dateRange?.to);
  }, [data, dateRange?.from, dateRange?.to]);

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
