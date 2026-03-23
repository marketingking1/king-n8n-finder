import { useMemo } from 'react';
import { useGoogleSheetsData } from './useGoogleSheetsData';
import { useMacroData } from './useMacroData';
import { useFunnelByChannel } from './useFunnelByChannel';
import { useGoogleAnalyticsData, aggregateGAByWeeks } from './useGoogleAnalyticsData';
import type { GADailyRow } from './useGoogleAnalyticsData';
import { filterByDateRange } from '@/lib/googleSheets';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, isWithinInterval, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { JornadaChannel, JornadaChannelWeek, JornadaNode, NodeStatus, JornadaIndicator, ChannelType } from '@/types/jornada';
import type { DateRange, ChannelMetrics } from '@/types/dashboard';
import type { ChannelFunnelData } from './useFunnelByChannel';

// Canal colors for headers
export const JORNADA_CHANNEL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Meta Ads': { bg: 'bg-[#1877F2]/15', border: 'border-[#1877F2]/30', text: 'text-[#1877F2]' },
  'Google Ads': { bg: 'bg-[#34A853]/15', border: 'border-[#34A853]/30', text: 'text-[#34A853]' },
  'LinkedIn': { bg: 'bg-[#B7903F]/15', border: 'border-[#B7903F]/30', text: 'text-[#B7903F]' },
};

// Channel type mapping
export const CHANNEL_TYPES: Record<string, ChannelType> = {
  'Meta Ads': 'native-form',
  'LinkedIn': 'native-form',
  'Google Ads': 'landing-page',
};

// KPI indicators for NATIVE FORM channels (Meta Ads, LinkedIn)
// No landing page metrics — leads come from native forms inside the platform
export const NATIVE_FORM_INDICATORS: JornadaIndicator[] = [
  { key: 'investimento', label: 'Investimento', format: 'currency', tooltip: 'Verba aplicada no período' },
  { key: 'impressoes', label: 'Impressões', format: 'number', tooltip: 'Total de impressões dos anúncios' },
  { key: 'cpm', label: 'CPM', format: 'currency', tooltip: 'Custo por mil impressões = (Investimento / Impressões) × 1000' },
  { key: 'cliquesLink', label: 'Cliques no Link', format: 'number', tooltip: 'Total de cliques em links dos anúncios' },
  { key: 'custoClick', label: 'CPC', format: 'currency', tooltip: 'CPC = Investimento / Cliques' },
  { key: 'ctrLink', label: 'CTR', format: 'percent', tooltip: 'CTR = (Cliques / Impressões) × 100' },
  { key: 'lead', label: 'Leads (Form Nativo)', format: 'number', tooltip: 'Leads gerados via formulário nativo da plataforma' },
  { key: 'custoPorLead', label: 'CPL', format: 'currency', tooltip: 'Custo por Lead = Investimento / Leads' },
  { key: 'leadToMql', label: 'Lead → MQL', format: 'percent', tooltip: 'Taxa de qualificação = Call Agendada / Leads × 100' },
  { key: 'mql', label: 'MQL (Call Agendada)', format: 'number', tooltip: 'Marketing Qualified Lead = calls agendadas' },
  { key: 'cpmql', label: 'CPMQL', format: 'currency', tooltip: 'Custo por MQL = Investimento / MQL' },
  { key: 'callRealizada', label: 'Call Realizada', format: 'number', tooltip: 'Reuniões efetivamente realizadas' },
  { key: 'custoPorReuniao', label: 'CP Reunião', format: 'currency', tooltip: 'Custo por reunião realizada = Investimento / Calls Realizadas' },
  { key: 'vendas', label: 'Vendas', format: 'number', tooltip: 'Total de vendas fechadas' },
  { key: 'cpa', label: 'CPA', format: 'currency', tooltip: 'Custo por Aquisição = Investimento / Vendas' },
  { key: 'roas', label: 'ROAS', format: 'decimal', tooltip: 'Return on Ad Spend = Receita / Investimento' },
];

// KPI indicators for LANDING PAGE channels (Google Ads)
// Includes page metrics: sessions, connect rate, page conversion rate
export const LANDING_PAGE_INDICATORS: JornadaIndicator[] = [
  { key: 'investimento', label: 'Investimento', format: 'currency', tooltip: 'Verba aplicada no período' },
  { key: 'impressoes', label: 'Impressões', format: 'number', tooltip: 'Total de impressões dos anúncios' },
  { key: 'cpm', label: 'CPM', format: 'currency', tooltip: 'Custo por mil impressões = (Investimento / Impressões) × 1000' },
  { key: 'cliquesLink', label: 'Cliques no Link', format: 'number', tooltip: 'Total de cliques em links dos anúncios' },
  { key: 'custoClick', label: 'CPC', format: 'currency', tooltip: 'CPC = Investimento / Cliques' },
  { key: 'ctrLink', label: 'CTR', format: 'percent', tooltip: 'CTR = (Cliques / Impressões) × 100' },
  { key: 'connectRate', label: 'Connect Rate', format: 'percent', tooltip: 'Sessões engajadas / Cliques × 100 (requer GA4)' },
  { key: 'sessoes', label: 'Sessões', format: 'number', tooltip: 'Total de sessões na landing page (requer GA4)' },
  { key: 'sessoesEngajadas', label: 'Sessões Engajadas', format: 'number', tooltip: 'Sessões com engajamento significativo (requer GA4)' },
  { key: 'taxaConversaoPagina', label: 'Conv. Página', format: 'percent', tooltip: 'Taxa de conversão = Leads / Sessões × 100 (requer GA4)' },
  { key: 'lead', label: 'Leads', format: 'number', tooltip: 'Total de leads gerados via landing page' },
  { key: 'custoPorLead', label: 'CPL', format: 'currency', tooltip: 'Custo por Lead = Investimento / Leads' },
  { key: 'leadToMql', label: 'Lead → MQL', format: 'percent', tooltip: 'Taxa de qualificação = Call Agendada / Leads × 100' },
  { key: 'mql', label: 'MQL (Call Agendada)', format: 'number', tooltip: 'Marketing Qualified Lead = calls agendadas' },
  { key: 'cpmql', label: 'CPMQL', format: 'currency', tooltip: 'Custo por MQL = Investimento / MQL' },
  { key: 'callRealizada', label: 'Call Realizada', format: 'number', tooltip: 'Reuniões efetivamente realizadas' },
  { key: 'custoPorReuniao', label: 'CP Reunião', format: 'currency', tooltip: 'Custo por reunião realizada = Investimento / Calls Realizadas' },
  { key: 'vendas', label: 'Vendas', format: 'number', tooltip: 'Total de vendas fechadas' },
  { key: 'cpa', label: 'CPA', format: 'currency', tooltip: 'Custo por Aquisição = Investimento / Vendas' },
  { key: 'roas', label: 'ROAS', format: 'decimal', tooltip: 'Return on Ad Spend = Receita / Investimento' },
];

// Returns the correct indicator list for a channel type
export function getIndicatorsForChannel(channelType: ChannelType): JornadaIndicator[] {
  return channelType === 'native-form' ? NATIVE_FORM_INDICATORS : LANDING_PAGE_INDICATORS;
}

// Thresholds for node status classification
const NODE_THRESHOLDS: Record<string, { okMin: number; warningMin: number }> = {
  ctrLink: { okMin: 1.5, warningMin: 0.8 },
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
    impressoes: 0,
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
    callRealizada: 0,
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
    mes.impressoes += s.impressoes;
    mes.cliquesLink += s.cliquesLink;
    mes.sessoes += s.sessoes;
    mes.sessoesEngajadas += s.sessoesEngajadas;
    mes.lead += s.lead;
    mes.mql += s.mql;
    mes.callRealizada += s.callRealizada;
    mes.vendas += s.vendas;
  }
  // Recalculate derived metrics from totals
  mes.cpm = mes.impressoes > 0 ? (mes.investimento / mes.impressoes) * 1000 : 0;
  mes.custoClick = mes.cliquesLink > 0 ? mes.investimento / mes.cliquesLink : 0;
  mes.ctrLink = mes.impressoes > 0 ? (mes.cliquesLink / mes.impressoes) * 100 : 0;
  mes.connectRate = Math.min(mes.cliquesLink > 0 ? (mes.sessoesEngajadas / mes.cliquesLink) * 100 : 0, 100);
  mes.taxaConversaoPagina = Math.min(mes.sessoes > 0 ? (mes.lead / mes.sessoes) * 100 : 0, 100);
  mes.custoPorLead = mes.lead > 0 ? mes.investimento / mes.lead : 0;
  mes.leadToMql = mes.lead > 0 ? (mes.mql / mes.lead) * 100 : 0;
  mes.cpmql = mes.mql > 0 ? mes.investimento / mes.mql : 0;
  mes.custoPorReuniao = mes.callRealizada > 0 ? mes.investimento / mes.callRealizada : 0;
  mes.cpa = mes.vendas > 0 ? mes.investimento / mes.vendas : 0;
  // ROAS uses the same value stored per week (receita / investimento)
  // We sum receita from vendas * avg ticket — but we don't have receita here,
  // so we take weighted average of weekly ROAS
  const weeksWithRoas = semanas.filter(s => s.roas > 0);
  if (weeksWithRoas.length > 0) {
    const totalInvestWeeks = weeksWithRoas.reduce((s, w) => s + w.investimento, 0);
    mes.roas = totalInvestWeeks > 0
      ? weeksWithRoas.reduce((s, w) => s + w.roas * w.investimento, 0) / totalInvestWeeks
      : 0;
  }
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

// Match a normalized channel name to channelMetrics entry
function findChannelMetric(canalName: string, channelMetrics: ChannelMetrics[]): ChannelMetrics | null {
  return channelMetrics.find(cm => normalizeChannelName(cm.canal) === canalName) ?? null;
}

// Match a normalized channel name to channelFunnelData entry
function findFunnelData(canalName: string, funnelData: ChannelFunnelData[]): ChannelFunnelData | null {
  return funnelData.find(f => normalizeChannelName(f.canal) === canalName) ?? null;
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

  // Fetch Google Analytics data for Google Ads landing page metrics
  const { data: gaData, isLoading: gaLoading } = useGoogleAnalyticsData(dateRange);

  const isLoading = sheetsLoading || macroLoading || funnelLoading || gaLoading;

  // Build channel data with weekly breakdown
  const channels = useMemo<JornadaChannel[]>(() => {
    if (!sheetsData || channelMetrics.length === 0) return [];

    const channelNames: Array<'Meta Ads' | 'Google Ads' | 'LinkedIn'> = ['Meta Ads', 'Google Ads', 'LinkedIn'];
    const filteredRows = filterByDateRange(sheetsData.rows, dateRange.from, dateRange.to);

    // Group raw rows by normalized channel — ONLY for weekly distribution proportions
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
    const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    for (let i = 0; i < 5; i++) {
      const wStart = i === 0 ? monthStart : addWeeks(weekStart, i);
      const wEnd = endOfWeek(addWeeks(weekStart, i), { weekStartsOn: 1 });
      const effectiveEnd = wEnd > monthEnd ? monthEnd : wEnd;
      const effectiveStart = wStart < monthStart ? monthStart : wStart;
      if (effectiveStart <= monthEnd) {
        weeks.push({ start: effectiveStart, end: effectiveEnd });
      }
      if (weeks.length >= 5) break;
    }
    // Ensure the last week extends to monthEnd to avoid losing end-of-month days
    if (weeks.length > 0 && weeks[weeks.length - 1].end < monthEnd) {
      weeks[weeks.length - 1].end = monthEnd;
    }
    while (weeks.length < 4) {
      weeks.push({ start: monthEnd, end: monthEnd });
    }

    // Aggregate GA data by week for Google Ads landing page metrics
    const gaWeeklyData = gaData
      ? aggregateGAByWeeks(gaData.rows, weeks)
      : null;

    return channelNames.map(canalName => {
      // SOURCE OF TRUTH: channelMetrics from useMacroData (same as Macro/Micro tabs)
      const cm = findChannelMetric(canalName, channelMetrics);
      const funnel = findFunnelData(canalName, channelFunnelData);
      const rows = rowsByChannel[canalName] || [];
      const channelType = CHANNEL_TYPES[canalName];

      // Total investment from channelMetrics (authoritative source)
      const totalInvest = cm?.investimento ?? 0;
      const totalImpress = cm?.impressoes ?? 0;
      const totalClicks = cm?.cliques ?? 0;
      const totalLeadsMedia = cm?.leadsMidia ?? 0;
      const totalReceita = cm?.receita ?? 0;

      // Total funnel from useFunnelByChannel (authoritative source for CRM data)
      const totalLeads = funnel?.leads ?? totalLeadsMedia;
      const totalMql = funnel?.callAgendada ?? 0;
      const totalCallRealizada = funnel?.callRealizada ?? 0;
      const totalVendas = funnel?.venda ?? 0;

      // Calculate weekly proportions from raw row investment
      const rowTotalInvest = rows.reduce((s, r) => s + r.investimento, 0);

      const semanas: JornadaChannelWeek[] = weeks.map((week, idx) => {
        const weekRows = rows.filter(r => {
          // Use parseISO (local time) instead of new Date() (UTC) to avoid off-by-one in UTC-3
          const d = parseISO(r.data);
          return isWithinInterval(d, { start: week.start, end: week.end });
        });

        // Weekly proportion based on raw row distribution
        const weekRowInvest = weekRows.reduce((s, r) => s + r.investimento, 0);
        const proportion = rowTotalInvest > 0 ? weekRowInvest / rowTotalInvest : 1 / weeks.length;

        // Distribute authoritative totals proportionally
        const investimento = totalInvest * proportion;
        const impressoes = totalImpress * proportion;
        const cliques = totalClicks * proportion;
        const leads = Math.round(totalLeads * proportion);
        const mql = Math.round(totalMql * proportion);
        const callRealizada = Math.round(totalCallRealizada * proportion);
        const vendas = Math.round(totalVendas * proportion);
        const receita = totalReceita * proportion;

        // GA4 landing page metrics — only for Google Ads
        const isGoogleAds = canalName === 'Google Ads';
        const gaWeek = isGoogleAds && gaWeeklyData ? gaWeeklyData[idx] : null;
        const sessoes = gaWeek?.data.sessions ?? 0;
        const sessoesEngajadas = gaWeek?.data.engagedSessions ?? 0;
        const connectRate = Math.min(cliques > 0 ? (sessoesEngajadas / cliques) * 100 : 0, 100);
        const taxaConversaoPagina = Math.min(sessoes > 0 ? (leads / sessoes) * 100 : 0, 100);

        return {
          semana: idx + 1,
          investimento,
          impressoes,
          cpm: impressoes > 0 ? (investimento / impressoes) * 1000 : 0,
          frequencia: 0,
          cliquesLink: cliques,
          custoClick: cliques > 0 ? investimento / cliques : 0,
          ctrLink: impressoes > 0 ? (cliques / impressoes) * 100 : 0,
          connectRate: isGoogleAds ? connectRate : 0,
          sessoes: isGoogleAds ? sessoes : 0,
          sessoesEngajadas: isGoogleAds ? sessoesEngajadas : 0,
          taxaConversaoPagina: isGoogleAds ? taxaConversaoPagina : 0,
          // Funnel metrics
          lead: leads,
          custoPorLead: leads > 0 ? investimento / leads : 0,
          leadToMql: leads > 0 ? (mql / leads) * 100 : 0,
          mql,
          cpmql: mql > 0 ? investimento / mql : 0,
          callRealizada,
          custoPorReuniao: callRealizada > 0 ? investimento / callRealizada : 0,
          vendas,
          cpa: vendas > 0 ? investimento / vendas : 0,
          roas: investimento > 0 ? receita / investimento : 0,
        };
      });

      return {
        canal: canalName,
        channelType,
        semanas,
        mes: consolidateWeeks(semanas),
      };
    });
  }, [sheetsData, channelMetrics, channelFunnelData, gaData, dateRange, month]);

  // Build journey nodes — native form funnel (no page metrics)
  const nodes = useMemo<JornadaNode[]>(() => {
    if (channels.length === 0) return [];

    const totalInvest = channels.reduce((s, c) => s + c.mes.investimento, 0);
    const totalImpress = channels.reduce((s, c) => s + c.mes.impressoes, 0);
    const totalCliques = channels.reduce((s, c) => s + c.mes.cliquesLink, 0);
    const totalLeads = channels.reduce((s, c) => s + c.mes.lead, 0);
    const totalMql = channels.reduce((s, c) => s + c.mes.mql, 0);
    const totalCallRealizada = channels.reduce((s, c) => s + c.mes.callRealizada, 0);
    const totalVendas = channels.reduce((s, c) => s + c.mes.vendas, 0);

    const cpm = totalImpress > 0 ? (totalInvest / totalImpress) * 1000 : 0;
    const ctr = totalImpress > 0 ? (totalCliques / totalImpress) * 100 : 0;
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
        value: cpm,
        formattedValue: `R$ ${cpm.toFixed(2)}`,
        status: 'ok' as NodeStatus,
        tooltip: 'Custo por mil impressões = Investimento / Impressões × 1000',
        acoes: ['Revisar segmentação', 'Testar novos públicos'],
      },
      {
        key: 'ctrLink',
        label: 'CTR',
        value: ctr,
        formattedValue: `${ctr.toFixed(2)}%`,
        status: getNodeStatus('ctrLink', ctr),
        tooltip: 'CTR = Cliques / Impressões × 100',
        acoes: ['Melhorar criativos', 'Testar headlines', 'A/B test de imagens'],
      },
      {
        key: 'lead',
        label: 'Lead',
        value: totalLeads,
        formattedValue: totalLeads.toLocaleString('pt-BR'),
        status: 'ok' as NodeStatus,
        tooltip: 'Total de leads gerados (form nativo + landing page)',
        acoes: ['Otimizar formulário nativo', 'Testar perguntas do form'],
      },
      {
        key: 'leadToMql',
        label: 'Lead → MQL',
        value: leadToMql,
        formattedValue: `${leadToMql.toFixed(1)}%`,
        status: getNodeStatus('leadToMql', leadToMql),
        tooltip: 'Taxa de qualificação = Call Agendada / Leads × 100',
        acoes: ['Melhorar script de qualificação', 'Speed to lead', 'Nurturing'],
      },
      {
        key: 'taxaVenda',
        label: 'MQL → Venda',
        value: mqlToVenda,
        formattedValue: `${mqlToVenda.toFixed(1)}%`,
        status: getNodeStatus('taxaVenda', mqlToVenda),
        tooltip: 'Vendas / MQL × 100',
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
