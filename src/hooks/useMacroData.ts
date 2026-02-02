import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import { MIN_DATE } from './useFilters';
import { useGoogleSheetsData } from './useGoogleSheetsData';
import { 
  fetchMacro2026Data,
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
  mql: number;
  conversoes: number;
  ctr: number;
  // Métricas da planilha LOVABLE_HISTORICO_2026
  faturamento?: number;
  ticketMedio?: number;
  cpa?: number;
  cac?: number;        // CAC = CPA + Custo Vendedor
  cpl?: number;
  cpmql?: number;
  roas?: number;
  roi?: number;
  taxaConversao?: number;         // Lead > MQL
  taxaConversaoMqlVenda?: number; // MQL > Venda
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
  
  // Data from 2.DADOS_MENSAL_2026 (nova planilha de referência)
  const { data: macro2026Data, isLoading: isLoadingMacro, error: macroError } = useQuery({
    queryKey: [
      'macro-2026-data',
      dateRange.from?.getTime() ?? null,
      dateRange.to?.getTime() ?? null,
    ],
    queryFn: () => fetchMacro2026Data({ from: dateRange.from, to: dateRange.to }),
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
    if (!sheetsData || !macro2026Data) return undefined;
    
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
      console.debug('[MacroData] Macro2026Data:', macro2026Data);
    }
    
    // Volume from LOVABLE_HISTORICO_2026 (dados mensais de 2026)
    return {
      investimento: investmentMetrics.investimento,
      impressoes: investmentMetrics.impressoes,
      cliques: investmentMetrics.cliques,
      ctr: investmentMetrics.ctr,
      // Volume from planilha LOVABLE_HISTORICO_2026 (monthly totals)
      leads: macro2026Data.totalLeads,
      mql: macro2026Data.totalMql,
      conversoes: macro2026Data.totalVendas,
      receita: macro2026Data.faturamento,
      // Métricas da planilha LOVABLE_HISTORICO_2026
      faturamento: macro2026Data.faturamento,
      ticketMedio: macro2026Data.ticketMedio,
      cpa: macro2026Data.cpa,
      cac: macro2026Data.cac,
      cpl: macro2026Data.cpl,
      cpmql: macro2026Data.cpmql,
      roas: macro2026Data.roas,
      roi: macro2026Data.roi,
      taxaConversao: macro2026Data.taxaConversao,
      taxaConversaoMqlVenda: macro2026Data.taxaConversaoMqlVenda,
    };
  }, [sheetsData, macro2026Data, dateRange]);

  // Previous period metrics (for investment comparison)
  const previous = useMemo(() => {
    if (!sheetsData || !previousPeriod) return null;
    
    // Investment metrics from tabela_objetivo (paid media)
    const filteredSheets = filterByDateRange(sheetsData.rows, previousPeriod.from, previousPeriod.to);
    const investmentMetrics = calculateInvestmentMetrics(filteredSheets);

    // Note: planilha LOVABLE_HISTORICO_2026 não tem dados históricos por período, então não há comparativo de vendas/leads
    return {
      investimento: investmentMetrics.investimento,
      impressoes: investmentMetrics.impressoes,
      cliques: investmentMetrics.cliques,
      ctr: investmentMetrics.ctr,
      // No historical macro data available for previous period
      leads: 0,
      mql: 0,
      conversoes: 0,
      receita: 0,
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
