import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, getDate, subMonths } from 'date-fns';
import { MIN_DATE } from './useFilters';
import { useGoogleSheetsData } from './useGoogleSheetsData';
import { 
  fetchMacroSheetsData, 
  filterByDateRange, 
  filterMacroByDateRange,
  MacroSheetsRow,
  SheetsMarketingRow 
} from '@/lib/googleSheets';

export interface MacroMetrics {
  investimento: number;
  impressoes: number;
  cliques: number;
  receita: number;
  leads: number;
  conversoes: number;
  ctr: number;
}

// Calculate investment/impressions/clicks from tabela_objetivo (paid media only)
function calculateInvestmentMetrics(rows: SheetsMarketingRow[]) {
  const metrics = rows.reduce(
    (acc, row) => ({
      investimento: acc.investimento + row.investimento,
      impressoes: acc.impressoes + row.impressoes,
      cliques: acc.cliques + row.cliques,
    }),
    { investimento: 0, impressoes: 0, cliques: 0 }
  );

  return {
    ...metrics,
    ctr: metrics.impressoes > 0 ? (metrics.cliques / metrics.impressoes) * 100 : 0,
  };
}

// Calculate sales/leads from Dados_macro_vendas (all business data)
function calculateVolumeMetrics(rows: MacroSheetsRow[]) {
  return rows.reduce(
    (acc, row) => ({
      vendas: acc.vendas + row.vendas,
      leads: acc.leads + row.leads,
    }),
    { vendas: 0, leads: 0 }
  );
}

export function useMacroData() {
  // Data from tabela_objetivo (paid media - investment, impressions, clicks)
  const { data: sheetsData, isLoading: isLoadingSheets, error: sheetsError } = useGoogleSheetsData();
  
  // Data from Dados_macro_vendas (all business - sales, leads)
  const { data: macroData, isLoading: isLoadingMacro, error: macroError } = useQuery({
    queryKey: ['macro-sheets-data'],
    queryFn: fetchMacroSheetsData,
    staleTime: 5 * 60 * 1000,
  });

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

  // Current period metrics
  const current = useMemo(() => {
    if (!sheetsData || !macroData) return undefined;
    
    // Investment metrics from tabela_objetivo (paid media)
    const filteredSheets = filterByDateRange(sheetsData.rows, currentMonthStart, currentMonthEnd);
    const investmentMetrics = calculateInvestmentMetrics(filteredSheets);
    
    // Volume metrics from Dados_macro_vendas (all business)
    const filteredMacro = filterMacroByDateRange(macroData.rows, currentMonthStart, currentMonthEnd);
    const volumeMetrics = calculateVolumeMetrics(filteredMacro);

    return {
      investimento: investmentMetrics.investimento,
      impressoes: investmentMetrics.impressoes,
      cliques: investmentMetrics.cliques,
      ctr: investmentMetrics.ctr,
      // Volume from Dados_macro_vendas (100% of business)
      leads: volumeMetrics.leads,
      conversoes: volumeMetrics.vendas,
      receita: 0, // Will be calculated in component with TICKET_MEDIO
    };
  }, [sheetsData, macroData, currentMonthStart, currentMonthEnd]);

  // Previous period metrics
  const previous = useMemo(() => {
    if (!sheetsData || !macroData || !hasPreviousData || !previousMonthEnd) return null;
    
    // Investment metrics from tabela_objetivo (paid media)
    const filteredSheets = filterByDateRange(sheetsData.rows, previousMonthStart, previousMonthEnd);
    const investmentMetrics = calculateInvestmentMetrics(filteredSheets);
    
    // Volume metrics from Dados_macro_vendas (all business)
    const filteredMacro = filterMacroByDateRange(macroData.rows, previousMonthStart, previousMonthEnd);
    const volumeMetrics = calculateVolumeMetrics(filteredMacro);

    return {
      investimento: investmentMetrics.investimento,
      impressoes: investmentMetrics.impressoes,
      cliques: investmentMetrics.cliques,
      ctr: investmentMetrics.ctr,
      // Volume from Dados_macro_vendas (100% of business)
      leads: volumeMetrics.leads,
      conversoes: volumeMetrics.vendas,
      receita: 0,
    };
  }, [sheetsData, macroData, hasPreviousData, previousMonthStart, previousMonthEnd]);

  return {
    current,
    previous: hasPreviousData ? previous : null,
    isLoading: isLoadingSheets || isLoadingMacro,
    error: sheetsError || macroError,
  };
}
