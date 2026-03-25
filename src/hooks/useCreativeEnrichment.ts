import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseEnrichmentData, FunnelStage } from '@/types/creative';

function classifyFunnel(frequency: number): FunnelStage {
  if (frequency < 1.15) return 'tofu';
  if (frequency <= 1.35) return 'mofu';
  return 'bofu';
}

interface EnrichmentAccumulator {
  thumbnailUrl: string | null;
  videoUrl: string | null;
  transcription: string | null;
  dailyFreqs: number[];
  totalLeadsCrm: number;
  mqls: number;
  closedWon: number;
  callAgendada: number;
  callRealizada: number;
  contrato: number;
  spend: number;
}

export function useCreativeEnrichment(dateRange?: { from?: Date; to?: Date }) {
  const dateFrom = dateRange?.from?.toISOString().slice(0, 10) || '2020-01-01';
  const dateTo = dateRange?.to?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10);

  return useQuery({
    queryKey: ['creative-enrichment', dateFrom, dateTo],
    queryFn: async (): Promise<Map<string, SupabaseEnrichmentData>> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('ad_performance')
        .select('ad_name,thumbnail_url,video_url,transcription,frequency,total_leads_crm,mqls,closed_won,call_agendada,call_realizada,contrato,spend')
        .gte('date_start', dateFrom)
        .lte('date_start', dateTo)
        .gt('spend', 0)
        .limit(5000);

      if (error || !data) return new Map();

      const grouped = new Map<string, EnrichmentAccumulator>();

      for (const row of data as Record<string, unknown>[]) {
        const name = String(row.ad_name || '');
        if (!name) continue;
        const key = name.toLowerCase().trim();
        const freq = Number(row.frequency || 0);

        const existing = grouped.get(key);
        if (existing) {
          if (freq > 0) existing.dailyFreqs.push(freq);
          existing.spend += Number(row.spend || 0);
          existing.totalLeadsCrm = Math.max(existing.totalLeadsCrm, Number(row.total_leads_crm || 0));
          existing.mqls = Math.max(existing.mqls, Number(row.mqls || 0));
          existing.closedWon = Math.max(existing.closedWon, Number(row.closed_won || 0));
          existing.callAgendada = Math.max(existing.callAgendada, Number(row.call_agendada || 0));
          existing.callRealizada = Math.max(existing.callRealizada, Number(row.call_realizada || 0));
          existing.contrato = Math.max(existing.contrato, Number(row.contrato || 0));
          if (!existing.thumbnailUrl && row.thumbnail_url) existing.thumbnailUrl = String(row.thumbnail_url);
          if (!existing.videoUrl && row.video_url) existing.videoUrl = String(row.video_url);
          if (!existing.transcription && row.transcription) existing.transcription = String(row.transcription);
        } else {
          const freqs: number[] = [];
          if (freq > 0) freqs.push(freq);
          grouped.set(key, {
            thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : null,
            videoUrl: row.video_url ? String(row.video_url) : null,
            transcription: row.transcription ? String(row.transcription) : null,
            dailyFreqs: freqs,
            totalLeadsCrm: Number(row.total_leads_crm || 0),
            mqls: Number(row.mqls || 0),
            closedWon: Number(row.closed_won || 0),
            callAgendada: Number(row.call_agendada || 0),
            callRealizada: Number(row.call_realizada || 0),
            contrato: Number(row.contrato || 0),
            spend: Number(row.spend || 0),
          });
        }
      }

      const result = new Map<string, SupabaseEnrichmentData>();
      grouped.forEach((acc, key) => {
        const avgFreq = acc.dailyFreqs.length > 0
          ? acc.dailyFreqs.reduce((s, v) => s + v, 0) / acc.dailyFreqs.length
          : 0;

        result.set(key, {
          adName: key,
          thumbnailUrl: acc.thumbnailUrl,
          videoUrl: acc.videoUrl,
          transcription: acc.transcription,
          avgFrequency: avgFreq,
          funnelStage: classifyFunnel(avgFreq),
          totalLeadsCrm: acc.totalLeadsCrm,
          mqls: acc.mqls,
          closedWon: acc.closedWon,
          callAgendada: acc.callAgendada,
          callRealizada: acc.callRealizada,
          contrato: acc.contrato,
          spend: acc.spend,
        });
      });

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });
}
