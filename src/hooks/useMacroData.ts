import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, min } from 'date-fns';

interface MacroMetrics {
  investimento: number;
  impressoes: number;
  cliques: number;
  leads: number;
  conversoes: number;
  receita: number;
  ctr: number;
  cpa: number;
  roas: number;
}

async function fetchMacroData(fromDate: string, toDate: string): Promise<MacroMetrics> {
  const { data, error } = await supabase
    .from('vw_marketing_data')
    .select('*')
    .gte('data', fromDate)
    .lte('data', toDate);

  if (error) throw error;

  const records = data || [];
  
  const totals = records.reduce(
    (acc, row) => ({
      investimento: acc.investimento + (row.investimento || 0),
      impressoes: acc.impressoes + (row.impressoes || 0),
      cliques: acc.cliques + (row.cliques || 0),
      leads: acc.leads + (row.leads || 0),
      conversoes: acc.conversoes + (row.conversoes || 0),
      receita: acc.receita + (row.receita || 0),
    }),
    { investimento: 0, impressoes: 0, cliques: 0, leads: 0, conversoes: 0, receita: 0 }
  );

  return {
    ...totals,
    ctr: totals.impressoes > 0 ? (totals.cliques / totals.impressoes) * 100 : 0,
    cpa: totals.conversoes > 0 ? totals.investimento / totals.conversoes : 0,
    roas: totals.investimento > 0 ? totals.receita / totals.investimento : 0,
  };
}

export function useMacroData() {
  const today = new Date();
  const currentDay = today.getDate();
  
  // Current month: from 1st to today
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = min([today, endOfMonth(today)]);
  
  // Previous month: same period (1st to same day of previous month)
  const previousMonthStart = startOfMonth(subMonths(today, 1));
  const previousMonthEnd = new Date(
    previousMonthStart.getFullYear(),
    previousMonthStart.getMonth(),
    currentDay
  );

  const currentFromStr = format(currentMonthStart, 'yyyy-MM-dd');
  const currentToStr = format(currentMonthEnd, 'yyyy-MM-dd');
  const previousFromStr = format(previousMonthStart, 'yyyy-MM-dd');
  const previousToStr = format(previousMonthEnd, 'yyyy-MM-dd');

  const { data: currentData, isLoading: currentLoading } = useQuery({
    queryKey: ['macro-data-current', currentFromStr, currentToStr],
    queryFn: () => fetchMacroData(currentFromStr, currentToStr),
    staleTime: 5 * 60 * 1000,
  });

  const { data: previousData, isLoading: previousLoading } = useQuery({
    queryKey: ['macro-data-previous', previousFromStr, previousToStr],
    queryFn: () => fetchMacroData(previousFromStr, previousToStr),
    staleTime: 5 * 60 * 1000,
  });

  const variations = useMemo(() => {
    if (!currentData || !previousData) return null;

    const calcVariation = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      investimento: calcVariation(currentData.investimento, previousData.investimento),
      impressoes: calcVariation(currentData.impressoes, previousData.impressoes),
      cliques: calcVariation(currentData.cliques, previousData.cliques),
      leads: calcVariation(currentData.leads, previousData.leads),
      conversoes: calcVariation(currentData.conversoes, previousData.conversoes),
      receita: calcVariation(currentData.receita, previousData.receita),
      ctr: calcVariation(currentData.ctr, previousData.ctr),
      cpa: calcVariation(currentData.cpa, previousData.cpa),
      roas: calcVariation(currentData.roas, previousData.roas),
    };
  }, [currentData, previousData]);

  return {
    current: currentData,
    previous: previousData,
    variations,
    isLoading: currentLoading || previousLoading,
    periodLabel: `1 a ${currentDay} do mês`,
  };
}
