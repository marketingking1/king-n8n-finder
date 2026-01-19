import { useState } from 'react';
import { FilterState, Granularity, DateRange } from '@/types/dashboard';
import { subDays } from 'date-fns';

const defaultDateRange: DateRange = {
  from: subDays(new Date(), 30),
  to: new Date(),
};

const defaultFilters: FilterState = {
  dateRange: defaultDateRange,
  granularity: 'day',
  campanhas: [],
  grupos: [],
  canais: [],
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const setDateRange = (dateRange: DateRange) => {
    setFilters(prev => ({ ...prev, dateRange }));
  };

  const setGranularity = (granularity: Granularity) => {
    setFilters(prev => ({ ...prev, granularity }));
  };

  const setCampanhas = (campanhas: string[]) => {
    setFilters(prev => ({ ...prev, campanhas }));
  };

  const setGrupos = (grupos: string[]) => {
    setFilters(prev => ({ ...prev, grupos }));
  };

  const setCanais = (canais: string[]) => {
    setFilters(prev => ({ ...prev, canais }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return {
    filters,
    setDateRange,
    setGranularity,
    setCampanhas,
    setGrupos,
    setCanais,
    resetFilters,
  };
}
