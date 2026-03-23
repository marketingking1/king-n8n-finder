import { useQuery } from '@tanstack/react-query';
import { startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface FunnelMacroData {
  leads: number;
  callAgendada: number;
  callRealizada: number;
}

function toDateStr(d: Date): string {
  // Usar date local (não UTC) para evitar que UTC-3 vaze para o dia seguinte
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function fetchFunnelMacroData(dateRange: { from?: Date; to?: Date }): Promise<FunnelMacroData> {
  // Fetch leads from kommo_leads (pipeline principal)
  let leadsQuery = supabase
    .from('kommo_leads')
    .select('lead_id', { count: 'exact', head: true })
    .eq('pipeline_id', 6919767);

  // Usar startOfDay/endOfDay para garantir que o filtro de timestamp
  // capture o dia inteiro (date picker retorna meia-noite, que em UTC-3 corta o dia)
  if (dateRange.from) {
    leadsQuery = leadsQuery.gte('created_at', startOfDay(dateRange.from).toISOString());
  }
  if (dateRange.to) {
    leadsQuery = leadsQuery.lte('created_at', endOfDay(dateRange.to).toISOString());
  }

  // Fetch leads count
  const leadsResult = await leadsQuery;
  if (leadsResult.error) throw new Error(leadsResult.error.message);
  const leads = leadsResult.count ?? 0;

  // Fetch ALL platform rows with pagination (Supabase default limit = 1000)
  const PAGE_SIZE = 1000;
  const allPlatRows: { atualizacao: string | null }[] = [];
  let from = 0;

  while (true) {
    let platQuery = supabase
      .from('Dados_Agendamento_Plataforma')
      .select('atualizacao')
      .not('vendedor', 'is', null)
      .not('dataAulaExperimental', 'is', null)
      .range(from, from + PAGE_SIZE - 1);

    if (dateRange.from) {
      platQuery = platQuery.gte('dataAulaExperimental', toDateStr(dateRange.from));
    }
    if (dateRange.to) {
      platQuery = platQuery.lte('dataAulaExperimental', toDateStr(dateRange.to));
    }

    const { data, error } = await platQuery;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    allPlatRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  // Call agendada = every row in platform table
  // Call realizada = PRESENCA or FECHADO
  const callAgendada = allPlatRows.length;
  const callRealizada = allPlatRows.filter(r => {
    const status = (r.atualizacao ?? '').toUpperCase();
    return status === 'PRESENCA' || status === 'FECHADO';
  }).length;

  return { leads, callAgendada, callRealizada };
}

export function useFunnelMacroData(dateRange: { from?: Date; to?: Date }) {
  return useQuery<FunnelMacroData>({
    queryKey: [
      'funnel-macro-data',
      dateRange.from?.getTime() ?? null,
      dateRange.to?.getTime() ?? null,
    ],
    queryFn: () => fetchFunnelMacroData(dateRange),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
