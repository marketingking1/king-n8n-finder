import { useState } from 'react';
import { FilterState, Granularity, DateRange } from '@/types/dashboard';

// Data mínima: 1 de Janeiro de 2026
export const MIN_DATE = new Date(2026, 0, 1);

// Sempre abre com o mês atual
const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const defaultFrom = firstDayOfMonth < MIN_DATE ? MIN_DATE : firstDayOfMonth;

const defaultDateRange: DateRange = {
  from: defaultFrom,
  to: now,
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
    // Garantir que a data mínima seja respeitada
    const from = dateRange.from && dateRange.from < MIN_DATE ? MIN_DATE : dateRange.from;
    setFilters(prev => ({ ...prev, dateRange: { from, to: dateRange.to } }));
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
