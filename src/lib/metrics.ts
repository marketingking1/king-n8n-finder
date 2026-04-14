import { MarketingData, AggregatedMetrics, CampaignMetrics, GroupMetrics, TimeSeriesData, FunnelData, Granularity, ChannelMetrics } from '@/types/dashboard';
import { SheetsMarketingRow } from '@/lib/googleSheets';
import { ChannelSalesFromPlatform, canonicalChannelKey } from '@/lib/channelPerformance';
import { format, isValid, parse, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Ticket médio do produto para cálculo correto de receita e ROAS
export const TICKET_MEDIO = 284;

export function calculateMetrics(data: MarketingData[]): AggregatedMetrics {
  const totals = data.reduce(
    (acc, row) => ({
      investimento: acc.investimento + row.investimento,
      impressoes: acc.impressoes + row.impressoes,
      cliques: acc.cliques + row.cliques,
      leads: acc.leads + row.leads,
      conversoes: acc.conversoes + row.conversoes,
      receita: acc.receita + row.receita,
    }),
    { investimento: 0, impressoes: 0, cliques: 0, leads: 0, conversoes: 0, receita: 0 }
  );

  // Receita calculada: Conversões (trackeadas) × Ticket Médio
  const receitaCalculada = totals.conversoes * TICKET_MEDIO;

  return {
    ...totals,
    receita: receitaCalculada, // Usa receita calculada
    ctr: totals.impressoes > 0 ? (totals.cliques / totals.impressoes) * 100 : 0,
    cpc: totals.cliques > 0 ? totals.investimento / totals.cliques : 0,
    cpl: totals.leads > 0 ? totals.investimento / totals.leads : 0,
    cpa: totals.conversoes > 0 ? totals.investimento / totals.conversoes : 0,
    roas: totals.investimento > 0 ? receitaCalculada / totals.investimento : 0,
    ticketMedio: TICKET_MEDIO,
    taxaConversao: totals.leads > 0 ? (totals.conversoes / totals.leads) * 100 : 0,
  };
}

export function groupByCampaign(data: MarketingData[]): CampaignMetrics[] {
  const groups = data.reduce((acc, row) => {
    const key = row.campanha || 'Sem Campanha';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(row);
    return acc;
  }, {} as Record<string, MarketingData[]>);

  return Object.entries(groups).map(([campanha, rows]) => ({
    campanha,
    ...calculateMetrics(rows),
  }));
}

export function groupByGrupo(data: MarketingData[]): GroupMetrics[] {
  const groups = data.reduce((acc, row) => {
    const key = row.grupo_anuncio || 'Sem Grupo';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(row);
    return acc;
  }, {} as Record<string, MarketingData[]>);

  return Object.entries(groups).map(([grupo_anuncio, rows]) => ({
    grupo_anuncio,
    ...calculateMetrics(rows),
  }));
}

function parseMarketingDate(dateStr: string): Date | null {
  const raw = (dateStr || '').trim();
  if (!raw) return null;

  // Most common: 2026-01-20 or 2026-01-20T...
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = parseISO(raw.slice(0, 10));
    return isValid(d) ? d : null;
  }

  // Sometimes sheets can format as dd/MM/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const d = parse(raw, 'dd/MM/yyyy', new Date());
    return isValid(d) ? d : null;
  }

  return null;
}

function getGroupMeta(dateStr: string, granularity: Granularity): { key: string; label: string } | null {
  const date = parseMarketingDate(dateStr);
  if (!date) return null;

  switch (granularity) {
    case 'day': {
      const key = format(date, 'yyyy-MM-dd');
      const label = format(date, 'dd/MM', { locale: ptBR });
      return { key, label };
    }
    case 'week': {
      // Start week on Monday to match BR convention
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const key = format(weekStart, 'yyyy-MM-dd');
      const label = format(weekStart, "'Sem' w", { locale: ptBR });
      return { key, label };
    }
    case 'month': {
      const monthStart = startOfMonth(date);
      const key = format(monthStart, 'yyyy-MM-dd');
      const label = format(monthStart, 'MMM/yy', { locale: ptBR });
      return { key, label };
    }
  }
}

export function groupByTime(data: MarketingData[], granularity: Granularity): TimeSeriesData[] {
  const groups = data.reduce((acc, row) => {
    const meta = getGroupMeta(row.data, granularity);
    if (!meta) return acc;
    if (!acc[meta.key]) acc[meta.key] = { label: meta.label, rows: [] };
    acc[meta.key].rows.push(row);
    return acc;
  }, {} as Record<string, { label: string; rows: MarketingData[] }>);

  return Object.entries(groups)
    .sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
    .map(([key, group]) => {
      const metrics = calculateMetrics(group.rows);
      const receitaCalculada = metrics.conversoes * TICKET_MEDIO;
      return {
        // Keep label in `data` (used by XAxis), but sort/group by ISO key to ensure correct daily totals & order
        data: group.label,
        investimento: metrics.investimento,
        impressoes: metrics.impressoes,
        cliques: metrics.cliques,
        leads: metrics.leads,
        conversoes: metrics.conversoes,
        receita: receitaCalculada,
        roas: metrics.investimento > 0 ? receitaCalculada / metrics.investimento : 0,
        // CTR calculado APÓS agregação: SUM(cliques) / SUM(impressões) × 100
        ctr: metrics.impressoes > 0 ? (metrics.cliques / metrics.impressoes) * 100 : 0,
      };
    });
}

export function calculateFunnel(data: MarketingData[]): FunnelData[] {
  const metrics = calculateMetrics(data);
  
  return [
    { etapa: 'Impressões', valor: metrics.impressoes, taxa: 100 },
    { etapa: 'Cliques', valor: metrics.cliques, taxa: metrics.ctr },
    { etapa: 'Leads', valor: metrics.leads, taxa: metrics.cliques > 0 ? (metrics.leads / metrics.cliques) * 100 : 0 },
    { etapa: 'Conversões', valor: metrics.conversoes, taxa: metrics.taxaConversao },
  ];
}

export function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function getROASColor(roas: number): 'success' | 'destructive' {
  if (roas >= 1) return 'success';
  return 'destructive';
}

export function getCPAColor(cpa: number): 'success' | 'warning' | 'destructive' {
  if (cpa < 300) return 'success';
  if (cpa <= 350) return 'warning';
  return 'destructive';
}

// Performance por Canal: combina mídia paga (tabela_objetivo) com vendas da
// plataforma (Supabase RPC get_funnel_by_channel).
export function groupByChannel(
  paidMediaRows: SheetsMarketingRow[],
  platformRows: ChannelSalesFromPlatform[]
): ChannelMetrics[] {
  // 1. Agregar mídia paga por canal canônico
  const paidByChannel: Record<string, {
    investimento: number;
    impressoes: number;
    cliques: number;
    leads: number;
  }> = {};

  for (const row of paidMediaRows) {
    const canal = canonicalChannelKey(row.canal || 'Sem Canal');
    if (!paidByChannel[canal]) {
      paidByChannel[canal] = { investimento: 0, impressoes: 0, cliques: 0, leads: 0 };
    }
    paidByChannel[canal].investimento += row.investimento;
    paidByChannel[canal].impressoes += row.impressoes;
    paidByChannel[canal].cliques += row.cliques;
    paidByChannel[canal].leads += row.leads;
  }

  // 2. Agregar vendas por canal canônico (Supabase RPC)
  const salesByChannel: Record<string, {
    vendas: number;
    receita: number;
  }> = {};

  for (const row of platformRows) {
    const canal = canonicalChannelKey(row.canal);
    if (!salesByChannel[canal]) {
      salesByChannel[canal] = { vendas: 0, receita: 0 };
    }
    salesByChannel[canal].vendas += row.vendas;
    // Receita estimada via ticket médio — a RPC não retorna receita
    salesByChannel[canal].receita += row.vendas * TICKET_MEDIO;
  }

  // 3. União de canais
  const allChannels = new Set([
    ...Object.keys(paidByChannel),
    ...Object.keys(salesByChannel),
  ]);

  const result: ChannelMetrics[] = [];

  for (const canal of allChannels) {
    const paid = paidByChannel[canal] || { investimento: 0, impressoes: 0, cliques: 0, leads: 0 };
    const sales = salesByChannel[canal] || { vendas: 0, receita: 0 };

    const ctr = paid.impressoes > 0 ? (paid.cliques / paid.impressoes) * 100 : 0;
    const cpc = paid.cliques > 0 ? paid.investimento / paid.cliques : 0;
    const cpl = paid.leads > 0 ? paid.investimento / paid.leads : 0;
    const cpa = sales.vendas > 0 && paid.investimento > 0 ? paid.investimento / sales.vendas : 0;
    const roas = paid.investimento > 0 ? sales.receita / paid.investimento : 0;
    const ticketMedio = sales.vendas > 0 ? sales.receita / sales.vendas : 0;
    const taxaConversao = paid.leads > 0 ? (sales.vendas / paid.leads) * 100 : 0;

    result.push({
      canal,
      investimento: paid.investimento,
      impressoes: paid.impressoes,
      cliques: paid.cliques,
      leadsMidia: paid.leads,
      ctr,
      cpc,
      cpl,
      vendas: sales.vendas,
      receita: sales.receita,
      ticketMedio,
      cpa,
      roas,
      taxaConversao,
    });
  }

  return result.sort((a, b) => b.receita - a.receita);
}
