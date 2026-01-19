import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, getDate } from 'date-fns';

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
  
  // Current month: from 1st to today
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = today;
  
  // Previous month: same period (1st to same day of previous month)
  const previousMonthStart = startOfMonth(subMonths(today, 1));
  const previousMonthEnd = new Date(subMonths(today, 1));
  previousMonthEnd.setDate(currentDay);

  const currentQuery = useQuery({
    queryKey: ['macro-metrics-current', format(currentMonthStart, 'yyyy-MM-dd'), format(currentMonthEnd, 'yyyy-MM-dd')],
    queryFn: () => fetchMacroMetrics(currentMonthStart, currentMonthEnd),
    staleTime: 5 * 60 * 1000,
  });

  const previousQuery = useQuery({
    queryKey: ['macro-metrics-previous', format(previousMonthStart, 'yyyy-MM-dd'), format(previousMonthEnd, 'yyyy-MM-dd')],
    queryFn: () => fetchMacroMetrics(previousMonthStart, previousMonthEnd),
    staleTime: 5 * 60 * 1000,
  });

  return {
    current: currentQuery.data,
    previous: previousQuery.data,
    isLoading: currentQuery.isLoading || previousQuery.isLoading,
    error: currentQuery.error || previousQuery.error,
  };
}
