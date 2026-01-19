import { useMemo } from 'react';
import { startOfMonth, getDate, subMonths } from 'date-fns';
import { MIN_DATE } from './useFilters';
import { useGoogleSheetsData } from './useGoogleSheetsData';
import { SheetsMarketingRow, filterByDateRange } from '@/lib/googleSheets';

export interface MacroMetrics {
  investimento: number;
  impressoes: number;
  cliques: number;
  receita: number;
  leads: number;
  conversoes: number;
  ctr: number;
}

function calculateMetricsFromRows(rows: SheetsMarketingRow[]): MacroMetrics {
  const metrics = rows.reduce(
    (acc, row) => ({
      investimento: acc.investimento + row.investimento,
      impressoes: acc.impressoes + row.impressoes,
      cliques: acc.cliques + row.cliques,
      receita: acc.receita + row.receita,
      leads: acc.leads + row.leads,
      conversoes: acc.conversoes + row.conversoes,
    }),
    { investimento: 0, impressoes: 0, cliques: 0, receita: 0, leads: 0, conversoes: 0 }
  );

  return {
    ...metrics,
    ctr: metrics.impressoes > 0 ? (metrics.cliques / metrics.impressoes) * 100 : 0,
  };
}

export function useMacroData() {
  const { data: sheetsData, isLoading, error } = useGoogleSheetsData();

  const today = new Date();
  const currentDay = getDate(today);
  
  // Current month: from 1st to today (mínimo 2026-01-01)
  const currentMonthStart = startOfMonth(today) < MIN_DATE ? MIN_DATE : startOfMonth(today);
  const currentMonthEnd = today;
  
  // Previous month comparison
  const previousMonthStart = subMonths(startOfMonth(today), 1);
  const hasPreviousData = previousMonthStart >= MIN_DATE;
  
  const previousMonthEnd = hasPreviousData 
    ? new Date(today.getFullYear(), today.getMonth() - 1, currentDay)
    : null;

  const current = useMemo(() => {
    if (!sheetsData) return undefined;
    const filtered = filterByDateRange(sheetsData.rows, currentMonthStart, currentMonthEnd);
    return calculateMetricsFromRows(filtered);
  }, [sheetsData, currentMonthStart, currentMonthEnd]);

  const previous = useMemo(() => {
    if (!sheetsData || !hasPreviousData || !previousMonthEnd) return null;
    const filtered = filterByDateRange(sheetsData.rows, previousMonthStart, previousMonthEnd);
    return calculateMetricsFromRows(filtered);
  }, [sheetsData, hasPreviousData, previousMonthStart, previousMonthEnd]);

  return {
    current,
    previous: hasPreviousData ? previous : null,
    isLoading,
    error,
  };
}
