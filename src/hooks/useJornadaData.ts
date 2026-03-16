import { useMemo, useState } from 'react';
import { useGoogleSheetsData } from './useGoogleSheetsData';
import { useMacroData } from './useMacroData';
import { useFunnelByChannel } from './useFunnelByChannel';
import { filterByDateRange } from '@/lib/googleSheets';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, isWithinInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { JornadaChannel, JornadaChannelWeek, JornadaNode, NodeStatus, JornadaIndicator } from '@/types/jornada';
import type { DateRange } from '@/types/dashboard';

// Canal colors for headers
export const JORNADA_CHANNEL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Meta Ads': { bg: 'bg-[#1877F2]/15', border: 'border-[#1877F2]/30', text: 'text-[#1877F2]' },
  'Google Ads': { bg: 'bg-[#34A853]/15', border: 'border-[#34A853]/30', text: 'text-[#34A853]' },
  'LinkedIn': { bg: 'bg-[#B7903F]/15', border: 'border-[#B7903F]/30', text: 'text-[#B7903F]' },
};

// KPI indicators definition for the channel table
export const JORNADA_INDICATORS: JornadaIndicator[] = [
  { key: 'investimento', label: 'Investimento', format: 'currency', tooltip: 'Verba aplicada no período' },
  { key: 'cpm', label: 'CPM', format: 'currency', tooltip: 'Custo por mil impressões = (Investimento / Impressões) × 1000' },
  { key: 'frequencia', label: 'Frequência', format: 'decimal', tooltip: 'Impressões / Alcance (estimado)' },
  { key: 'cliquesLink', label: 'Cliques no Link', format: 'number', tooltip: 'Total de cliques em links dos anúncios' },
  { key: 'custoClick', label: 'Custo por Click', format: 'currency', tooltip: 'CPC = Investimento / Cliques' },
  { key: 'ctrLink', label: 'CTR Link', format: 'percent', tooltip: 'CTR = (Cliques / Impressões) × 100' },
  { key: 'connectRate', label: 'Connect Rate', format: 'percent', tooltip: 'Sessões engajadas / Cliques × 100' },
  { key: 'sessoes', label: 'Sessões', format: 'number', tooltip: 'Total de sessões na landing page' },
  { key: 'sessoesEngajadas', label: 'Sessões Engajadas', format: 'number', tooltip: 'Sessões com engajamento significativo' },
  { key: 'taxaConversaoPagina', label: 'Conv. Página', format: 'percent', tooltip: 'Taxa de conversão da página = Leads / Sessões × 100' },
  { key: 'lead', label: 'Leads', format: 'number', tooltip: 'Total de leads gerados' },
  { key: 'custoPorLead', label: 'CPL', format: 'currency', tooltip: 'Custo por Lead = Investimento / Leads' },
  { key: 'leadToMql', label: 'Lead → MQL', format: 'percent', tooltip: 'Taxa de qualificação = MQL / Leads × 100' },
  { key: 'mql', label: 'MQL (Call Agendada)', format: 'number', tooltip: 'Marketing Qualified Lead = calls agendadas' },
  { key: 'cpmql', label: 'CPMQL', format: 'currency', tooltip: 'Custo por MQL = Investimento / MQL' },
  { key: 'custoPorReuniao', label: 'CP Reunião', format: 'currency', tooltip: 'Custo por reunião realizada = Investimento / Calls Realizadas' },
  { key: 'vendas', label: 'Vendas', format: 'number', tooltip: 'Total de vendas fechadas' },
  { key: 'cpa', label: 'CPA', format: 'currency', tooltip: 'Custo por Aquisição = Investimento / Vendas' },
  { key: 'roas', label: 'ROAS', format: 'decimal', tooltip: 'Return on Ad Spend = Receita / Investimento' },
];

// Thresholds for node status classification
const NODE_THRESHOLDS: Record<string, { okMin: number; warningMin: number }> = {
  ctrLink: { okMin: 1.5, warningMin: 0.8 },
  connectRate: { okMin: 40, warningMin: 25 },
  taxaConversaoPagina: { okMin: 15, warningMin: 8 },
  leadToMql: { okMin: 30, warningMin: 15 },
  taxaVenda: { okMin: 20, warningMin: 10 },
};

function getNodeStatus(key: string, value: number): NodeStatus {
  const threshold = NODE_THRESHOLDS[key];
  if (!threshold) return 'ok';
  if (value >= threshold.okMin) return 'ok';
  if (value >= threshold.warningMin) return 'warning';
  return 'critical';
}

function emptyWeek(semana: number): JornadaChannelWeek {
  return {
    semana,
    investimento: 0,
    cpm: 0,
    frequencia: 0,
    cliquesLink: 0,
    custoClick: 0,
    ctrLink: 0,
    connectRate: 0,
    sessoes: 0,
    sessoesEngajadas: 0,
    taxaConversaoPagina: 0,
    lead: 0,
    custoPorLead: 0,
    leadToMql: 0,
    mql: 0,
    cpmql: 0,
    custoPorReuniao: 0,
    vendas: 0,
    cpa: 0,
    roas: 0,
  };
}

function consolidateWeeks(semanas: JornadaChannelWeek[]): JornadaChannelWeek {
  const mes = emptyWeek(0);
  for (const s of semanas) {
    mes.investimento += s.investimento;
    mes.cliquesLink += s.cliquesLink;
    mes.sessoes += s.sessoes;
    mes.sessoesEngajadas += s.sessoesEngajadas;
    mes.lead += s.lead;
    mes.mql += s.mql;
    mes.vendas += s.vendas;
  }
  // Recalculate derived metrics from totals
  mes.cpm = mes.cliquesLink > 0 ? (mes.investimento / mes.cliquesLink) * 1000 : 0;
  mes.custoClick = mes.cliquesLink > 0 ? mes.investimento / mes.cliquesLink : 0;
  mes.ctrLink = semanas.length > 0
    ? semanas.reduce((sum, s) => sum + s.ctrLink, 0) / semanas.filter(s => s.ctrLink > 0).length || 0
    : 0;
  mes.connectRate = mes.cliquesLink > 0 ? (mes.sessoesEngajadas / mes.cliquesLink) * 100 : 0;
  mes.taxaConversaoPagina = mes.sessoes > 0 ? (mes.lead / mes.sessoes) * 100 : 0;
  mes.custoPorLead = mes.lead > 0 ? mes.investimento / mes.lead : 0;
  mes.leadToMql = mes.lead > 0 ? (mes.mql / mes.lead) * 100 : 0;
  mes.cpmql = mes.mql > 0 ? mes.investimento / mes.mql : 0;
  mes.custoPorReuniao = mes.mql > 0 ? mes.investimento / mes.mql : 0; // approximation
  mes.cpa = mes.vendas > 0 ? mes.investimento / mes.vendas : 0;
  mes.roas = mes.investimento > 0 ? (mes.vendas * 5000) / mes.investimento : 0; // estimated ticket
  mes.frequencia = semanas.length > 0
    ? semanas.reduce((sum, s) => sum + s.frequencia, 0) / semanas.filter(s => s.frequencia > 0).length || 0
    : 0;
  return mes;
}

// Map channel name from various sources to normalized names
function normalizeChannelName(canal: string): 'Meta Ads' | 'Google Ads' | 'LinkedIn' | null {
  const lower = canal.toLowerCase();
  if (lower.includes('meta') || lower.includes('facebook') || lower.includes('instagram')) return 'Meta Ads';
  if (lower.includes('google')) return 'Google Ads';
  if (lower.includes('linkedin')) return 'LinkedIn';
  return null;
}

// Get available months for selector
export function getAvailableMonths(baseDate?: Date): { label: string; value: Date }[] {
  const now = baseDate || new Date();
  const months: { label: string; value: Date }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    if (d.getFullYear() >= 2026) {
      months.push({
        label: format(d, 'MMMM yyyy', { locale: ptBR }),
        value: d,
      });
    }
  }
  return months;
}

export function useJornadaData(selectedMonth?: Date) {
  const now = new Date();
  const month = selectedMonth || new Date(now.getFullYear(), now.getMonth(), 1);

  const dateRange: DateRange = useMemo(() => ({
    from: startOfMonth(month),
    to: endOfMonth(month),
  }), [month]);

  // Fetch data from existing hooks
  const { data: sheetsData, isLoading: sheetsLoading } = useGoogleSheetsData();
  const { current: macroMetrics, channelMetrics, isLoading: macroLoading } = useMacroData(dateRange);
  const { data: channelFunnelData, isLoading: funnelLoading } = useFunnelByChannel(dateRange, channelMetrics);

  const isLoading = sheetsLoading || macroLoading || funnelLoading;

  // Build channel data with weekly breakdown
  const channels = useMemo<JornadaChannel[]>(() => {
    if (!sheetsData || !channelFunnelData) return [];

    const channelNames: Array<'Meta Ads' | 'Google Ads' | 'LinkedIn'> = ['Meta Ads', 'Google Ads', 'LinkedIn'];
    const filteredRows = filterByDateRange(sheetsData.rows, dateRange.from, dateRange.to);

    // Group rows by channel
    const rowsByChannel: Record<string, typeof filteredRows> = {};
    for (const row of filteredRows) {
      const normalized = normalizeChannelName(row.canal);
      if (normalized) {
        if (!rowsByChannel[normalized]) rowsByChannel[normalized] = [];
        rowsByChannel[normalized].push(row);
      }
    }

    // Calculate week boundaries for the month
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const weeks: { start: Date; end: Date }[] = [];
    let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    for (let i = 0; i < 5; i++) {
      const wStart = i === 0 ? monthStart : addWeeks(weekStart, i);
      const wEnd = endOfWeek(addWeeks(weekStart, i), { weekStartsOn: 1 });
      const effectiveEnd = wEnd > monthEnd ? monthEnd : wEnd;
      const effectiveStart = wStart < monthStart ? monthStart : wStart;
      if (effectiveStart <= monthEnd) {
        weeks.push({ start: effectiveStart, end: effectiveEnd });
      }
      if (weeks.length >= 4) break;
    }

    // Ensure we always have 4 weeks
    while (weeks.length < 4) {
      weeks.push({ start: monthEnd, end: monthEnd });
    }

    return channelNames.map(canalName => {
      const rows = rowsByChannel[canalName] || [];
      const funnelData = channelFunnelData.find(f => normalizeChannelName(f.canal) === canalName);

      const semanas: JornadaChannelWeek[] = weeks.map((week, idx) => {
        // Filter rows for this week
        const weekRows = rows.filter(r => {
          const d = new Date(r.data);
          return isWithinInterval(d, { start: week.start, end: week.end });
        });

        const investimento = weekRows.reduce((s, r) => s + r.investimento, 0);
        const impressoes = weekRows.reduce((s, r) => s + r.impressoes, 0);
        const cliques = weekRows.reduce((s, r) => s + r.cliques, 0);
        const leadsMedia = weekRows.reduce((s, r) => s + r.leads, 0);

        // Distribute funnel data proportionally across weeks
        const totalInvest = rows.reduce((s, r) => s + r.investimento, 0);
        const proportion = totalInvest > 0 ? investimento / totalInvest : 0.25;

        const leads = funnelData ? Math.round(funnelData.leads * proportion) : leadsMedia;
        const mql = funnelData ? Math.round(funnelData.callAgendada * proportion) : 0;
        const vendas = funnelData ? Math.round(funnelData.venda * proportion) : 0;

        return {
          semana: idx + 1,
          investimento,
          cpm: impressoes > 0 ? (investimento / impressoes) * 1000 : 0,
          frequencia: 0, // not available from current data
          cliquesLink: cliques,
          custoClick: cliques > 0 ? investimento / cliques : 0,
          ctrLink: impressoes > 0 ? (cliques / impressoes) * 100 : 0,
          connectRate: 0, // requires GA4 sessions data
          sessoes: 0,
          sessoesEngajadas: 0,
          taxaConversaoPagina: 0, // requires session data
          lead: leads,
          custoPorLead: leads > 0 ? investimento / leads : 0,
          leadToMql: leads > 0 ? (mql / leads) * 100 : 0,
          mql,
          cpmql: mql > 0 ? investimento / mql : 0,
          custoPorReuniao: mql > 0 ? investimento / mql : 0,
          vendas,
          cpa: vendas > 0 ? investimento / vendas : 0,
          roas: investimento > 0 ? (vendas * 5000) / investimento : 0, // ticket médio estimado
        };
      });

      return {
        canal: canalName,
        semanas,
        mes: consolidateWeeks(semanas),
      };
    });
  }, [sheetsData, channelFunnelData, dateRange, month]);

  // Build journey nodes (aggregated across all channels)
  const nodes = useMemo<JornadaNode[]>(() => {
    if (channels.length === 0) return [];

    const totalInvest = channels.reduce((s, c) => s + c.mes.investimento, 0);
    const totalCliques = channels.reduce((s, c) => s + c.mes.cliquesLink, 0);
    const totalLeads = channels.reduce((s, c) => s + c.mes.lead, 0);
    const totalMql = channels.reduce((s, c) => s + c.mes.mql, 0);
    const totalVendas = channels.reduce((s, c) => s + c.mes.vendas, 0);

    const avgCtr = channels.reduce((s, c) => s + c.mes.ctrLink, 0) / channels.length;
    const avgConnectRate = channels.reduce((s, c) => s + c.mes.connectRate, 0) / channels.length;
    const avgConvPagina = channels.reduce((s, c) => s + c.mes.taxaConversaoPagina, 0) / channels.length;
    const leadToMql = totalLeads > 0 ? (totalMql / totalLeads) * 100 : 0;
    const mqlToVenda = totalMql > 0 ? (totalVendas / totalMql) * 100 : 0;

    return [
      {
        key: 'investimento',
        label: 'Investimento',
        value: totalInvest,
        formattedValue: `R$ ${(totalInvest / 1000).toFixed(1)}k`,
        status: 'ok' as NodeStatus,
        tooltip: 'Verba total aplicada no período',
        acoes: [],
      },
      {
        key: 'cpm',
        label: 'CPM',
        value: totalCliques > 0 ? (totalInvest / totalCliques) * 1000 : 0,
        formattedValue: `R$ ${totalCliques > 0 ? ((totalInvest / totalCliques) * 1000).toFixed(2) : '0'}`,
        status: 'ok' as NodeStatus,
        tooltip: 'Custo por mil impressões agregado',
        acoes: ['Revisar segmentação', 'Testar novos públicos'],
      },
      {
        key: 'ctrLink',
        label: 'CTR',
        value: avgCtr,
        formattedValue: `${avgCtr.toFixed(2)}%`,
        status: getNodeStatus('ctrLink', avgCtr),
        tooltip: 'Taxa de clique média entre canais',
        acoes: ['Melhorar criativos', 'Testar headlines', 'A/B test de imagens'],
      },
      {
        key: 'connectRate',
        label: 'Connect Rate',
        value: avgConnectRate,
        formattedValue: `${avgConnectRate.toFixed(1)}%`,
        status: getNodeStatus('connectRate', avgConnectRate),
        tooltip: 'Sessões engajadas / Cliques',
        acoes: ['Otimizar velocidade da LP', 'Melhorar congruência anúncio→LP'],
      },
      {
        key: 'taxaConversaoPagina',
        label: 'Conv. Página',
        value: avgConvPagina,
        formattedValue: `${avgConvPagina.toFixed(1)}%`,
        status: getNodeStatus('taxaConversaoPagina', avgConvPagina),
        tooltip: 'Leads / Sessões na landing page',
        acoes: ['Otimizar formulário', 'Testar CTA', 'Social proof'],
      },
      {
        key: 'leadToMql',
        label: 'Lead → MQL',
        value: leadToMql,
        formattedValue: `${leadToMql.toFixed(1)}%`,
        status: getNodeStatus('leadToMql', leadToMql),
        tooltip: 'Taxa de qualificação (call agendada / leads)',
        acoes: ['Melhorar script de qualificação', 'Speed to lead', 'Nurturing'],
      },
      {
        key: 'taxaVenda',
        label: 'MQL → Venda',
        value: mqlToVenda,
        formattedValue: `${mqlToVenda.toFixed(1)}%`,
        status: getNodeStatus('taxaVenda', mqlToVenda),
        tooltip: 'Vendas / MQL',
        acoes: ['Treinar closers', 'Revisar objeções', 'Follow-up estruturado'],
      },
    ];
  }, [channels]);

  return {
    channels,
    nodes,
    isLoading,
    hasData: channels.length > 0 && channels.some(c => c.mes.investimento > 0 || c.mes.lead > 0),
  };
}
