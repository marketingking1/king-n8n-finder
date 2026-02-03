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
    
    // Raw values from spreadsheet
    const investimento = investmentMetrics.investimento;
    const leads = macro2026Data.totalLeads;
    const mql = macro2026Data.totalMql;
    const vendas = macro2026Data.totalVendas;
    const faturamento = macro2026Data.faturamento;
    
    // ALWAYS calculate derived metrics internally from raw values
    const cpa = vendas > 0 ? investimento / vendas : 0;
    const cpl = leads > 0 ? investimento / leads : 0;
    const cpmql = mql > 0 ? investimento / mql : 0;
    const roas = investimento > 0 ? faturamento / investimento : 0;
    const roi = investimento > 0 ? ((faturamento - investimento) / investimento) * 100 : 0;
    const ticketMedio = vendas > 0 ? faturamento / vendas : 0;
    const taxaConversao = leads > 0 ? (mql / leads) * 100 : 0; // Lead→MQL
    const taxaConversaoMqlVenda = mql > 0 ? (vendas / mql) * 100 : 0; // MQL→Venda
    
    // CAC = CPA + Custo Vendedor (usando valor fixo de R$ 50 por venda como estimativa)
    const custoVendedor = vendas * 50;
    const cac = vendas > 0 ? (investimento + custoVendedor) / vendas : 0;
    
    // Debug logging (will only show in dev)
    if ((import.meta as any)?.env?.DEV) {
      console.debug('[MacroData] Raw values - Investimento:', investimento, 'Vendas:', vendas, 'Leads:', leads, 'MQL:', mql, 'Faturamento:', faturamento);
      console.debug('[MacroData] Calculated - CPA:', cpa, 'CAC:', cac, 'ROAS:', roas, 'Taxa Lead→MQL:', taxaConversao);
    }
    
    return {
      investimento,
      impressoes: investmentMetrics.impressoes,
      cliques: investmentMetrics.cliques,
      ctr: investmentMetrics.ctr,
      leads,
      mql,
      conversoes: vendas,
      receita: faturamento,
      faturamento,
      ticketMedio,
      cpa,
      cac,
      cpl,
      cpmql,
      roas,
      roi,
      taxaConversao,
      taxaConversaoMqlVenda,
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
