import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MIN_DATE } from './useFilters';
import { useGoogleSheetsData } from './useGoogleSheetsData';
import {
  fetchMacro2026Data,
  filterByDateRange,
  SheetsMarketingRow
} from '@/lib/googleSheets';
import { fetchChannelSalesFromPlatform } from '@/lib/channelPerformance';
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
  taxaConversao?: number;         // Lead > Venda (vendas / leads da planilha)
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

  // Sales-by-channel vindos da plataforma (Supabase RPC get_funnel_by_channel)
  const { data: platformChannelData, isLoading: isLoadingBuyers, error: buyersError } = useQuery({
    queryKey: [
      'channel-sales-from-platform',
      dateRange.from?.getTime() ?? null,
      dateRange.to?.getTime() ?? null,
    ],
    queryFn: () => fetchChannelSalesFromPlatform(dateRange),
    staleTime: 0,
    gcTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
  });

  // Calculate previous period: use the previous calendar month(s)
  // e.g., if current range spans March, previous = February
  const previousPeriod = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return null;

    const fromMonth = dateRange.from.getMonth(); // 0-based
    const fromYear = dateRange.from.getFullYear();
    const toMonth = dateRange.to.getMonth();
    const toYear = dateRange.to.getFullYear();

    // How many months does the current range span?
    const monthSpan = (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;

    // Previous period = same number of months, shifted back
    const prevFromDate = new Date(fromYear, fromMonth - monthSpan, 1);
    const prevToDate = new Date(fromYear, fromMonth, 0); // Last day of month before current from

    // Don't compare if previous period is before MIN_DATE
    if (prevFromDate < MIN_DATE) return null;

    return {
      from: prevFromDate,
      to: prevToDate,
    };
  }, [dateRange]);

  // Data from LOVABLE_HISTORICO_2026 for the PREVIOUS period
  const { data: prevMacro2026Data } = useQuery({
    queryKey: [
      'macro-2026-data-prev',
      previousPeriod?.from?.getTime() ?? null,
      previousPeriod?.to?.getTime() ?? null,
    ],
    queryFn: () => fetchMacro2026Data({ from: previousPeriod!.from, to: previousPeriod!.to }),
    enabled: !!previousPeriod,
    staleTime: 0,
    gcTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });

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
    const custoVendedor = macro2026Data.custoVendedor; // Da planilha LOVABLE_HISTORICO_2026

    // ALWAYS calculate derived metrics internally from raw values
    const cpa = vendas > 0 ? investimento / vendas : 0;
    const cpl = leads > 0 ? investimento / leads : 0;
    const cpmql = mql > 0 ? investimento / mql : 0;
    const roas = investimento > 0 ? faturamento / investimento : 0;
    const roi = investimento > 0 ? ((faturamento - investimento) / investimento) * 100 : 0;
    const ticketMedio = vendas > 0 ? faturamento / vendas : 0;
    const taxaConversao = leads > 0 ? (vendas / leads) * 100 : 0; // Lead→Venda
    const taxaConversaoMqlVenda = mql > 0 ? (vendas / mql) * 100 : 0; // MQL→Venda

    // CAC = CPA + (Custo Vendedor / Vendas)
    // O custoVendedor da planilha é o total, então dividimos por vendas para obter o unitário
    const custoVendedorUnitario = vendas > 0 ? custoVendedor / vendas : 0;
    const cac = cpa + custoVendedorUnitario;

    // Debug logging (will only show in dev)
    if ((import.meta as any)?.env?.DEV) {
      console.debug('[MacroData] Raw values - Investimento:', investimento, 'Vendas:', vendas, 'Leads:', leads, 'MQL:', mql, 'Faturamento:', faturamento);
      console.debug('[MacroData] Custo Vendedor from sheet:', custoVendedor, 'Unitário:', custoVendedorUnitario);
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

  // Previous period metrics - now with REAL data from LOVABLE_HISTORICO_2026
  const previous = useMemo(() => {
    if (!sheetsData || !previousPeriod) return null;

    // Investment metrics from tabela_objetivo (paid media)
    const filteredSheets = filterByDateRange(sheetsData.rows, previousPeriod.from, previousPeriod.to);
    const investmentMetrics = calculateInvestmentMetrics(filteredSheets);

    const investimento = investmentMetrics.investimento;

    // Use real data from LOVABLE_HISTORICO_2026 for the previous period
    if (prevMacro2026Data) {
      const leads = prevMacro2026Data.totalLeads;
      const mql = prevMacro2026Data.totalMql;
      const vendas = prevMacro2026Data.totalVendas;
      const faturamento = prevMacro2026Data.faturamento;
      const custoVendedor = prevMacro2026Data.custoVendedor;

      const cpa = vendas > 0 ? investimento / vendas : 0;
      const cpl = leads > 0 ? investimento / leads : 0;
      const cpmql = mql > 0 ? investimento / mql : 0;
      const roas = investimento > 0 ? faturamento / investimento : 0;
      const roi = investimento > 0 ? ((faturamento - investimento) / investimento) * 100 : 0;
      const ticketMedio = vendas > 0 ? faturamento / vendas : 0;
      const taxaConversao = leads > 0 ? (vendas / leads) * 100 : 0;
      const taxaConversaoMqlVenda = mql > 0 ? (vendas / mql) * 100 : 0;
      const custoVendedorUnitario = vendas > 0 ? custoVendedor / vendas : 0;
      const cac = cpa + custoVendedorUnitario;

      if ((import.meta as any)?.env?.DEV) {
        console.debug('[MacroData:Prev] Investimento:', investimento, 'Vendas:', vendas, 'Leads:', leads, 'Faturamento:', faturamento);
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
    }

    // Fallback: only investment data available
    return {
      investimento,
      impressoes: investmentMetrics.impressoes,
      cliques: investmentMetrics.cliques,
      ctr: investmentMetrics.ctr,
      leads: 0,
      mql: 0,
      conversoes: 0,
      receita: 0,
    };
  }, [sheetsData, previousPeriod, prevMacro2026Data]);

  // Channel metrics: investimento (sheet tabela_objetivo) + vendas (Supabase RPC).
  // platformChannelData já vem agregado no intervalo selecionado.
  const channelMetrics: ChannelMetrics[] = useMemo(() => {
    if (!sheetsData) return [];
    const filteredPaid = filterByDateRange(sheetsData.rows, dateRange.from, dateRange.to);
    return groupByChannel(filteredPaid, platformChannelData ?? []);
  }, [sheetsData, platformChannelData, dateRange]);

  return {
    current,
    previous,
    channelMetrics,
    isLoading: isLoadingSheets || isLoadingMacro || isLoadingBuyers,
    error: sheetsError || macroError || buyersError,
  };
}
