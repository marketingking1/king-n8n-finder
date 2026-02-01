import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import { MIN_DATE } from './useFilters';
import { useGoogleSheetsData } from './useGoogleSheetsData';
import { 
  fetchMacroSheetsData, 
  fetchLeadsCompradoresData,
  filterByDateRange, 
  filterBuyersByDateRange,
  SheetsMarketingRow 
} from '@/lib/googleSheets';
import { groupByChannel } from '@/lib/metrics';
import { DateRange, ChannelMetrics } from '@/types/dashboard';

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

export function useMacroData(dateRange: DateRange) {
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

  // Data from LEADS_COMPRADORES (real sales by channel)
  const { data: buyersData, isLoading: isLoadingBuyers, error: buyersError } = useQuery({
    queryKey: ['leads-compradores-data'],
    queryFn: fetchLeadsCompradoresData,
    staleTime: 0,
    gcTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
  });

  // Calculate previous period based on filter range
  const previousPeriod = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return null;
    
    const daysDiff = Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
    );
    const prevFrom = subDays(dateRange.from, daysDiff);
    
    // Don't compare if previous period is before MIN_DATE
    if (prevFrom < MIN_DATE) return null;
    
    return {
      from: prevFrom,
      to: subDays(dateRange.to, daysDiff),
    };
  }, [dateRange]);

  // Current period metrics - filtered by the selected date range
  const current = useMemo(() => {
    if (!sheetsData || !macroData) return undefined;
    
    // Investment metrics from tabela_objetivo (paid media) - filtered by selected date range
    const filteredSheets = filterByDateRange(sheetsData.rows, dateRange.from, dateRange.to);
    const investmentMetrics = calculateInvestmentMetrics(filteredSheets);
    
    // Debug logging (will only show in dev)
    if ((import.meta as any)?.env?.DEV) {
      console.debug('[MacroData] dateRange.from:', dateRange.from?.toISOString());
      console.debug('[MacroData] dateRange.to:', dateRange.to?.toISOString());
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
  }, [sheetsData, macroData, dateRange]);

  // Previous period metrics (for investment comparison)
  const previous = useMemo(() => {
    if (!sheetsData || !previousPeriod) return null;
    
    // Investment metrics from tabela_objetivo (paid media)
    const filteredSheets = filterByDateRange(sheetsData.rows, previousPeriod.from, previousPeriod.to);
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
  }, [sheetsData, previousPeriod]);

  // Calculate channel metrics combining paid media and buyer data
  const channelMetrics: ChannelMetrics[] = useMemo(() => {
    if (!sheetsData) return [];
    const filteredPaid = filterByDateRange(sheetsData.rows, dateRange.from, dateRange.to);
    const filteredBuyers = buyersData
      ? filterBuyersByDateRange(buyersData, dateRange.from, dateRange.to)
      : [];
    return groupByChannel(filteredPaid, filteredBuyers);
  }, [sheetsData, buyersData, dateRange]);

  return {
    current,
    previous,
    channelMetrics,
    isLoading: isLoadingSheets || isLoadingMacro || isLoadingBuyers,
    error: sheetsError || macroError || buyersError,
  };
}
