// Source of truth dos KPIs de funil: Supabase (Dados_Agendamento_Plataforma + kommo_leads).
// Espelha exatamente os mesmos numeros do dashboard vis-o-comercial.
// Valores canonicos abr/2026 (API King): 10.192 leads · 2.298 agendamentos
// (= MQL) · 1.424 calls realizadas · 627 vendas · 678 no-show.
//
// Substitui o que vinha da planilha LOVABLE_HISTORICO_2026 (input manual,
// com drift). A planilha continua usada para Investimento, Ticket Medio
// e Custo Vendedor — campos que nao existem na plataforma.

import { startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

// Pipelines do funil de vendas no Kommo:
//   6919767  = Funil principal
//   13461219 = Social Selling (Isabelle)
const FUNNEL_PIPELINE_IDS = [6919767, 13461219];

export interface PlatformCounts {
  leads: number;          // Kommo leads criados no range (pipelines do funil)
  mql: number;            // Total de agendamentos da plataforma (== MQL ate prova em contrario)
  callRealizada: number;  // PRESENCA + FECHADO
  vendas: number;         // FECHADO
  noshow: number;         // NOSHOW
  cancelado: number;      // CANCELADO
}

function toDateStr(d: Date): string {
  // Local date — evita UTC-3 vazar para o dia seguinte
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function fetchPlatformCounts(dateRange: {
  from?: Date;
  to?: Date;
}): Promise<PlatformCounts> {
  // 1) Leads (Kommo) — count por created_at no range
  let leadsQuery = supabase
    .from('kommo_leads')
    .select('lead_id', { count: 'exact', head: true })
    .in('pipeline_id', FUNNEL_PIPELINE_IDS);

  if (dateRange.from) {
    leadsQuery = leadsQuery.gte('created_at', startOfDay(dateRange.from).toISOString());
  }
  if (dateRange.to) {
    leadsQuery = leadsQuery.lte('created_at', endOfDay(dateRange.to).toISOString());
  }

  const leadsResult = await leadsQuery;
  if (leadsResult.error) throw new Error(`platformCounts/leads: ${leadsResult.error.message}`);
  const leads = leadsResult.count ?? 0;

  // 2) Agendamentos (Plataforma) — pagina ate carregar tudo
  const PAGE_SIZE = 1000;
  const MAX_PAGES = 50;
  const platRows: { atualizacao: string | null }[] = [];
  let page = 0;
  let from = 0;

  while (page < MAX_PAGES) {
    let q = supabase
      .from('Dados_Agendamento_Plataforma')
      .select('atualizacao')
      .not('vendedor', 'is', null)
      .not('dataAulaExperimental', 'is', null)
      .range(from, from + PAGE_SIZE - 1);

    if (dateRange.from) q = q.gte('dataAulaExperimental', toDateStr(dateRange.from));
    if (dateRange.to) q = q.lte('dataAulaExperimental', toDateStr(dateRange.to));

    const { data, error } = await q;
    if (error) throw new Error(`platformCounts/agend offset ${from}: ${error.message}`);
    if (!data || data.length === 0) break;
    platRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
    page++;
  }

  // Mapping canonico do `atualizacao`:
  //   MARCADO   = agendado, ainda nao aconteceu
  //   PRESENCA  = compareceu sem fechar
  //   NOSHOW    = nao compareceu
  //   FECHADO   = compareceu E fechou venda
  //   CANCELADO = aula cancelada
  const upper = (s: string | null) => (s ?? '').trim().toUpperCase();
  const mql = platRows.length;
  const callRealizada = platRows.filter((r) =>
    ['PRESENCA', 'FECHADO'].includes(upper(r.atualizacao)),
  ).length;
  const vendas = platRows.filter((r) => upper(r.atualizacao) === 'FECHADO').length;
  const noshow = platRows.filter((r) => upper(r.atualizacao) === 'NOSHOW').length;
  const cancelado = platRows.filter((r) => upper(r.atualizacao) === 'CANCELADO').length;

  return { leads, mql, callRealizada, vendas, noshow, cancelado };
}
