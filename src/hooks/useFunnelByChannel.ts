import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange, ChannelMetrics } from '@/types/dashboard';

export interface ChannelFunnelData {
  canal: string;
  leads: number;
  callAgendada: number;
  callRealizada: number;
  noshow: number;
  venda: number;
  investimento: number;
  cpl: number;
  cpCallAgendada: number;
  cpCallRealizada: number;
  cpa: number;
  taxaAgendamento: number;
  taxaRealizacao: number;
  taxaNoshow: number;
  taxaVenda: number;
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

async function fetchFunnelByChannel(dateRange: DateRange): Promise<RpcRow[]> {
  const params: { p_from?: string; p_to?: string } = {};
  if (dateRange.from) params.p_from = toDateStr(dateRange.from);
  if (dateRange.to) params.p_to = toDateStr(dateRange.to);

  const { data, error } = await supabase.rpc('get_funnel_by_channel', params);
  if (error) throw new Error(error.message);
  return (data as RpcRow[]) ?? [];
}

// Map channel metrics canal names to the normalized canal names from the RPC
function matchChannelInvestment(canal: string, channelMetrics: ChannelMetrics[]): number {
  const canalLower = canal.toLowerCase();
  const match = channelMetrics.find(cm => {
    const cmLower = (cm.canal || '').toLowerCase();
    if (canalLower === 'meta ads') return cmLower.includes('meta') || cmLower.includes('facebook');
    if (canalLower === 'google ads') return cmLower.includes('google');
    if (canalLower === 'linkedin') return cmLower.includes('linkedin');
    return false;
  });
  return match?.investimento ?? 0;
}

export function useFunnelByChannel(dateRange: DateRange, channelMetrics: ChannelMetrics[]) {
  const query = useQuery<RpcRow[]>({
    queryKey: [
      'funnel-by-channel',
      dateRange.from?.getTime() ?? null,
      dateRange.to?.getTime() ?? null,
    ],
    queryFn: () => fetchFunnelByChannel(dateRange),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnMount: 'always',
  });

  const data = useMemo<ChannelFunnelData[]>(() => {
    if (!query.data) return [];
    return query.data.map(row => {
      const investimento = matchChannelInvestment(row.canal, channelMetrics);
      return {
        canal: row.canal,
        leads: row.leads,
        callAgendada: row.call_agendada,
        callRealizada: row.call_realizada,
        noshow: row.noshow,
        venda: row.venda,
        investimento,
        cpl: row.leads > 0 && investimento > 0 ? investimento / row.leads : 0,
        cpCallAgendada: row.call_agendada > 0 && investimento > 0 ? investimento / row.call_agendada : 0,
        cpCallRealizada: row.call_realizada > 0 && investimento > 0 ? investimento / row.call_realizada : 0,
        cpa: row.venda > 0 && investimento > 0 ? investimento / row.venda : 0,
        taxaAgendamento: row.leads > 0 ? (row.call_agendada / row.leads) * 100 : 0,
        taxaRealizacao: row.call_agendada > 0 ? (row.call_realizada / row.call_agendada) * 100 : 0,
        taxaNoshow: row.call_agendada > 0 ? (row.noshow / row.call_agendada) * 100 : 0,
        taxaVenda: row.call_realizada > 0 ? (row.venda / row.call_realizada) * 100 : 0,
      };
    });
  }, [query.data, channelMetrics]);

  return { data, isLoading: query.isLoading };
}
