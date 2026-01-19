import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, format, getDate } from 'date-fns';
import { MIN_DATE } from './useFilters';

export interface MacroMetrics {
  investimento: number;
  impressoes: number;
  cliques: number;
  receita: number;
  ctr: number;
}

async function fetchMacroMetrics(from: Date, to: Date): Promise<MacroMetrics> {
  const { data, error } = await supabase
    .from('vw_marketing_data')
    .select('investimento, impressoes, cliques, receita')
    .gte('data', format(from, 'yyyy-MM-dd'))
    .lte('data', format(to, 'yyyy-MM-dd'));

  if (error) throw error;

  const metrics = (data || []).reduce(
    (acc, row) => ({
      investimento: acc.investimento + (row.investimento || 0),
      impressoes: acc.impressoes + (row.impressoes || 0),
      cliques: acc.cliques + (row.cliques || 0),
      receita: acc.receita + (row.receita || 0),
    }),
    { investimento: 0, impressoes: 0, cliques: 0, receita: 0 }
  );

  return {
    ...metrics,
    ctr: metrics.impressoes > 0 ? (metrics.cliques / metrics.impressoes) * 100 : 0,
  };
}

export function useMacroData() {
  const today = new Date();
  const currentDay = getDate(today);
  
  // Current month: from 1st to today (mínimo 2026-01-01)
  const currentMonthStart = startOfMonth(today) < MIN_DATE ? MIN_DATE : startOfMonth(today);
  const currentMonthEnd = today;
  
  // Previous month comparison: não existe dados antes de 2026, então não compara
  // Só comparar se o mês anterior for >= 2026-01-01
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const hasPreviousData = previousMonthStart >= MIN_DATE;
  
  const previousMonthEnd = hasPreviousData 
    ? new Date(today.getFullYear(), today.getMonth() - 1, currentDay)
    : null;

  const currentQuery = useQuery({
    queryKey: ['macro-metrics-current', format(currentMonthStart, 'yyyy-MM-dd'), format(currentMonthEnd, 'yyyy-MM-dd')],
    queryFn: () => fetchMacroMetrics(currentMonthStart, currentMonthEnd),
    staleTime: 5 * 60 * 1000,
  });

  const previousQuery = useQuery({
    queryKey: ['macro-metrics-previous', hasPreviousData ? format(previousMonthStart, 'yyyy-MM-dd') : 'none'],
    queryFn: () => hasPreviousData && previousMonthEnd 
      ? fetchMacroMetrics(previousMonthStart, previousMonthEnd)
      : Promise.resolve(null),
    staleTime: 5 * 60 * 1000,
    enabled: hasPreviousData,
  });

  return {
    current: currentQuery.data,
    previous: hasPreviousData ? previousQuery.data : null,
    isLoading: currentQuery.isLoading || (hasPreviousData && previousQuery.isLoading),
    error: currentQuery.error || previousQuery.error,
  };
}
