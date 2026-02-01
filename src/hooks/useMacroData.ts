import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, getDate, subMonths, parseISO, isValid, max, min } from 'date-fns';
import { MIN_DATE } from './useFilters';
import { useGoogleSheetsData } from './useGoogleSheetsData';
import { 
  fetchMacroSheetsData, 
  filterByDateRange, 
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
  custoVendedor: number;
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

// Get the date range from the data (most recent month with data)
function getDataDateRange(rows: SheetsMarketingRow[]): { start: Date; end: Date } | null {
  const dates = rows
    .map(r => {
      const d = parseISO(r.data);
      return isValid(d) ? d : null;
    })
    .filter((d): d is Date => d !== null);
  
  if (dates.length === 0) return null;
  
  const minDate = min(dates);
  const maxDate = max(dates);
  
  return { start: minDate, end: maxDate };
}

export function useMacroData() {
  // Data from tabela_objetivo (paid media - investment, impressions, clicks)
  const { data: sheetsData, isLoading: isLoadingSheets, error: sheetsError } = useGoogleSheetsData();
  
  // Data from Dados_macro_vendas (all business - total sales, leads for the month)
  const { data: macroData, isLoading: isLoadingMacro, error: macroError } = useQuery({
    queryKey: ['macro-sheets-data'],
    queryFn: fetchMacroSheetsData,
    staleTime: 0,
    gcTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
  });

  // Determine the actual date range from available data
  const dataRange = useMemo(() => {
    if (!sheetsData?.rows) return null;
    return getDataDateRange(sheetsData.rows);
  }, [sheetsData]);

  // Calculate periods based on the most recent data available
  const periods = useMemo(() => {
    if (!dataRange) return null;
    
    const today = new Date();
    const { end: latestDataDate } = dataRange;
    
    // Use the month of the latest data, not the current calendar month
    const currentMonthStart = startOfMonth(latestDataDate);
    const currentMonthEnd = latestDataDate; // Up to the latest data point
    
    // For current day comparison, use the day of the latest data
    const latestDay = getDate(latestDataDate);
    
    // Previous month comparison - same period in previous month
    const previousMonthStart = subMonths(currentMonthStart, 1);
    const hasPreviousData = previousMonthStart >= MIN_DATE;
    
    // Previous month end: same day as latest data day but in previous month
    const previousMonthEnd = hasPreviousData 
      ? new Date(previousMonthStart.getFullYear(), previousMonthStart.getMonth(), latestDay)
      : null;
    
    return {
      currentMonthStart,
      currentMonthEnd,
      previousMonthStart: hasPreviousData ? previousMonthStart : null,
      previousMonthEnd,
      hasPreviousData,
    };
  }, [dataRange]);

  // Current period metrics
  const current = useMemo(() => {
    if (!sheetsData || !macroData || !periods) return undefined;
    
    const { currentMonthStart, currentMonthEnd } = periods;
    
    // Investment metrics from tabela_objetivo (paid media)
    const filteredSheets = filterByDateRange(sheetsData.rows, currentMonthStart, currentMonthEnd);
    const investmentMetrics = calculateInvestmentMetrics(filteredSheets);
    
    // Debug logging (will only show in dev)
    if ((import.meta as any)?.env?.DEV) {
      console.debug('[MacroData] currentMonthStart:', currentMonthStart.toISOString());
      console.debug('[MacroData] currentMonthEnd:', currentMonthEnd.toISOString());
      console.debug('[MacroData] Total rows in sheetsData:', sheetsData.rows.length);
      console.debug('[MacroData] Filtered rows count:', filteredSheets.length);
      console.debug('[MacroData] Investment calculated:', investmentMetrics.investimento);
    }
    
    // Volume from Dados_macro_vendas is TOTAL for the month (no date filtering needed)
    return {
      investimento: investmentMetrics.investimento,
      impressoes: investmentMetrics.impressoes,
      cliques: investmentMetrics.cliques,
      ctr: investmentMetrics.ctr,
      // Volume from Dados_macro_vendas (100% of business - monthly totals)
      leads: macroData.totalLeads,
      conversoes: macroData.totalVendas,
      receita: 0, // Will be calculated in component with TICKET_MEDIO
      custoVendedor: macroData.custoVendedor,
    };
  }, [sheetsData, macroData, periods]);

  // Previous period metrics (for investment only - macro data doesn't have historical)
  const previous = useMemo(() => {
    if (!sheetsData || !periods?.hasPreviousData || !periods?.previousMonthEnd || !periods?.previousMonthStart) return null;
    
    // Investment metrics from tabela_objetivo (paid media)
    const filteredSheets = filterByDateRange(sheetsData.rows, periods.previousMonthStart, periods.previousMonthEnd);
    const investmentMetrics = calculateInvestmentMetrics(filteredSheets);

    // Note: Dados_macro_vendas doesn't have historical data, so no previous period for sales/leads
    return {
      investimento: investmentMetrics.investimento,
      impressoes: investmentMetrics.impressoes,
      cliques: investmentMetrics.cliques,
      ctr: investmentMetrics.ctr,
      // No historical macro data available
      leads: 0,
      conversoes: 0,
      receita: 0,
      custoVendedor: 0,
    };
  }, [sheetsData, periods]);

  return {
    current,
    previous: periods?.hasPreviousData ? previous : null,
    isLoading: isLoadingSheets || isLoadingMacro,
    error: sheetsError || macroError,
  };
}
