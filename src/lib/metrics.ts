import { MarketingData, AggregatedMetrics, CampaignMetrics, GroupMetrics, TimeSeriesData, FunnelData, Granularity } from '@/types/dashboard';
import { format, startOfWeek, startOfMonth, parseISO } from 'date-fns';
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

function getGroupKey(dateStr: string, granularity: Granularity): string {
  const date = parseISO(dateStr);
  switch (granularity) {
    case 'day':
      return format(date, 'dd/MM', { locale: ptBR });
    case 'week':
      return format(startOfWeek(date, { locale: ptBR }), "'Sem' w", { locale: ptBR });
    case 'month':
      return format(startOfMonth(date), 'MMM/yy', { locale: ptBR });
  }
}

export function groupByTime(data: MarketingData[], granularity: Granularity): TimeSeriesData[] {
  const groups = data.reduce((acc, row) => {
    const key = getGroupKey(row.data, granularity);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(row);
    return acc;
  }, {} as Record<string, MarketingData[]>);

  return Object.entries(groups)
    .map(([data, rows]) => {
      const metrics = calculateMetrics(rows);
      const receitaCalculada = metrics.conversoes * TICKET_MEDIO;
      return {
        data,
        investimento: metrics.investimento,
        impressoes: metrics.impressoes,
        cliques: metrics.cliques,
        leads: metrics.leads,
        conversoes: metrics.conversoes,
        receita: receitaCalculada,
        roas: metrics.investimento > 0 ? receitaCalculada / metrics.investimento : 0,
      };
    })
    .sort((a, b) => a.data.localeCompare(b.data));
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
