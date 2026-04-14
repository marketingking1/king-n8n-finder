import { supabase } from '@/integrations/supabase/client';
import { DateRange } from '@/types/dashboard';

export interface ChannelSalesFromPlatform {
  canal: string;
  leadsKommo: number;
  callAgendada: number;
  callRealizada: number;
  noshow: number;
  vendas: number;
}

interface RpcRow {
  canal: string;
  leads: number;
  call_agendada: number;
  call_realizada: number;
  noshow: number;
  venda: number;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function fetchChannelSalesFromPlatform(
  dateRange: DateRange
): Promise<ChannelSalesFromPlatform[]> {
  const params: { p_from?: string; p_to?: string } = {};
  if (dateRange.from) params.p_from = toDateStr(dateRange.from);
  if (dateRange.to) params.p_to = toDateStr(dateRange.to);

  const { data, error } = await (supabase.rpc as any)('get_funnel_by_channel', params);
  if (error) throw new Error(error.message);

  return ((data as RpcRow[]) ?? []).map(r => ({
    canal: r.canal,
    leadsKommo: Number(r.leads) || 0,
    callAgendada: Number(r.call_agendada) || 0,
    callRealizada: Number(r.call_realizada) || 0,
    noshow: Number(r.noshow) || 0,
    vendas: Number(r.venda) || 0,
  }));
}

// Canal canônico para casar nomes da tabela_objetivo (mídia paga) com os retornos da RPC.
// Mantém os mesmos rótulos usados pela RPC get_funnel_by_channel e pela edge enrich-agendamento-canal.
export function canonicalChannelKey(canal: string): string {
  const c = (canal || '').toLowerCase().trim();
  if (!c) return 'Sem Canal';
  if (c.includes('influencer') || c.includes('influenciador')) return 'Influenciador';
  if (c.includes('meta') || c.includes('facebook') || c.includes('instagram')) return 'Meta Ads';
  if (c.includes('google')) return 'Google Ads';
  if (c.includes('linkedin')) return 'LinkedIn';
  if (c.includes('tiktok')) return 'TikTok';
  if (c.includes('youtube')) return 'YouTube';
  if (c.includes('email')) return 'Email Marketing';
  if (c === 'sms' || c.startsWith('sms ')) return 'SMS';
  if (c.includes('orgânic') || c.includes('organic') || c.includes('seo')) return 'Orgânico';
  if (c.includes('indica') || c.includes('ex-aluno')) return 'Indicação';
  if (c.includes('não ident') || c.includes('nao ident') || c.includes('unknown')) return 'Não identificado';
  return canal;
}
