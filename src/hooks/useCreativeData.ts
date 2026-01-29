import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';
import {
  fetchCreativeData,
  filterCreativeData,
  calculateAggregatedMetrics,
  extractCreativeFilterOptions,
} from '@/lib/creativeSheets';
import { CreativeMetrics, CreativeFilters, CreativeAggregatedMetrics } from '@/types/creative';

const defaultFilters: CreativeFilters = {
  dateRange: { from: undefined, to: undefined },
  campanhas: [],
  tiposCriativo: [],
  variantes: [],
  apenasVideo: false,
  minImpressoes: 0,
};

export function useCreativeData() {
  return useQuery<CreativeMetrics[]>({
    queryKey: ['creative-sheets-data'],
    queryFn: fetchCreativeData,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    retry: 2,
  });
}

export function useCreativeFilters() {
  const [filters, setFilters] = useState<CreativeFilters>(defaultFilters);

  const setDateRange = useCallback((dateRange: CreativeFilters['dateRange']) => {
    setFilters(prev => ({ ...prev, dateRange }));
  }, []);

  const setCampanhas = useCallback((campanhas: string[]) => {
    setFilters(prev => ({ ...prev, campanhas }));
  }, []);

  const setTiposCriativo = useCallback((tiposCriativo: string[]) => {
    setFilters(prev => ({ ...prev, tiposCriativo }));
  }, []);

  const setVariantes = useCallback((variantes: string[]) => {
    setFilters(prev => ({ ...prev, variantes }));
  }, []);

  const setApenasVideo = useCallback((apenasVideo: boolean) => {
    setFilters(prev => ({ ...prev, apenasVideo }));
  }, []);

  const setMinImpressoes = useCallback((minImpressoes: number) => {
    setFilters(prev => ({ ...prev, minImpressoes }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    filters,
    setDateRange,
    setCampanhas,
    setTiposCriativo,
    setVariantes,
    setApenasVideo,
    setMinImpressoes,
    resetFilters,
  };
}

export function useFilteredCreativeData(filters: CreativeFilters) {
  const { data, isLoading, error, refetch } = useCreativeData();

  const filteredData = useMemo(() => {
    if (!data) return [];
    return filterCreativeData(data, filters);
  }, [data, filters]);

  const aggregatedMetrics = useMemo(() => {
    return calculateAggregatedMetrics(filteredData);
  }, [filteredData]);

  const filterOptions = useMemo(() => {
    if (!data) return { campanhas: [], tiposCriativo: [], variantes: [], maxImpressoes: 0 };
    return extractCreativeFilterOptions(data);
  }, [data]);

  return {
    data: filteredData,
    aggregatedMetrics,
    filterOptions,
    isLoading,
    error,
    refetch,
  };
}
