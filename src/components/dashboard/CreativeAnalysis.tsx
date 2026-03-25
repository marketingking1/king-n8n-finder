import { useMemo } from 'react';
import { VideoOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useFilteredCreativeData } from '@/hooks/useCreativeData';
import { useCreativeEnrichment } from '@/hooks/useCreativeEnrichment';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import type { ChannelFunnelData } from '@/hooks/useFunnelByChannel';
import type { AggregatedCreative, CreativeKPIs, SupabaseEnrichmentData } from '@/types/creative';
import {
  CreativeKPICards,
  CreativeRetentionFunnel,
  CreativeTable,
  TopCreativesChart,
  HookRateVsCplChart,
} from '@/components/dashboard/creative';

interface CreativeAnalysisProps {
  dateRange?: { from?: Date; to?: Date };
  campanhas?: string[];
  funnelData?: ChannelFunnelData[];
}

// Normalize campaign name to channel
function campaignToChannel(campanha: string): string | null {
  const lower = campanha.toLowerCase();
  if (lower.includes('meta') || lower.includes('facebook') || lower.includes('instagram') || lower.includes('fb')) return 'Meta Ads';
  if (lower.includes('google') || lower.includes('gads') || lower.includes('search') || lower.includes('pmax')) return 'Google Ads';
  if (lower.includes('linkedin') || lower.includes('li_')) return 'LinkedIn';
  return null;
}

// Enrich aggregated creatives with funnel data (MQL, calls, vendas, CPA)
function enrichWithFunnelData(
  aggregated: AggregatedCreative[],
  funnelData: ChannelFunnelData[]
): AggregatedCreative[] {
  if (!funnelData || funnelData.length === 0) return aggregated;

  // Group creatives by channel and calculate lead share
  const channelCreatives: Record<string, AggregatedCreative[]> = {};
  for (const creative of aggregated) {
    const channels = creative.campanhas.map(campaignToChannel).filter(Boolean);
    const channel = channels[0] || null;
    if (channel) {
      if (!channelCreatives[channel]) channelCreatives[channel] = [];
      channelCreatives[channel].push(creative);
    }
  }

  // Match funnel data by channel
  const normalizeForMatch = (canal: string): string => {
    const lower = canal.toLowerCase();
    if (lower.includes('meta') || lower.includes('facebook')) return 'Meta Ads';
    if (lower.includes('google')) return 'Google Ads';
    if (lower.includes('linkedin')) return 'LinkedIn';
    return canal;
  };

  const funnelByChannel: Record<string, ChannelFunnelData> = {};
  for (const f of funnelData) {
    funnelByChannel[normalizeForMatch(f.canal)] = f;
  }

  return aggregated.map(creative => {
    const channels = creative.campanhas.map(campaignToChannel).filter(Boolean);
    const channel = channels[0];
    if (!channel) return creative;

    const funnel = funnelByChannel[channel];
    const creativesInChannel = channelCreatives[channel] || [];
    if (!funnel || creativesInChannel.length === 0) return creative;

    // Proportional distribution based on lead share
    const totalChannelLeads = creativesInChannel.reduce((s, c) => s + c.totalLeads, 0);
    const leadShare = totalChannelLeads > 0 ? creative.totalLeads / totalChannelLeads : 1 / creativesInChannel.length;

    const callAgendada = Math.round(funnel.callAgendada * leadShare);
    const callRealizada = Math.round(funnel.callRealizada * leadShare);
    const vendas = Math.round(funnel.venda * leadShare);
    const cpa = vendas > 0 ? creative.totalSpend / vendas : 0;
    const custoMql = callAgendada > 0 ? creative.totalSpend / callAgendada : 0;

    return { ...creative, mql: callAgendada, callAgendada, callRealizada, vendas, cpa, custoMql };
  });
}

function generateAnalysis(c: AggregatedCreative): string {
  const parts: string[] = [];
  if (c.avgHookRate > 35) parts.push(`Hook rate excepcional (${c.avgHookRate.toFixed(1)}%).`);
  else if (c.avgHookRate > 20) parts.push(`Bom hook rate (${c.avgHookRate.toFixed(1)}%).`);
  if (c.avgHoldRate > 30) parts.push(`Hold rate forte (${c.avgHoldRate.toFixed(1)}%).`);
  if (c.mql > 0 && c.totalLeadsCrm > 0) {
    const mqlRate = (c.mql / c.totalLeadsCrm) * 100;
    if (mqlRate > 20) parts.push(`Taxa MQL alta (${mqlRate.toFixed(1)}%).`);
    else if (mqlRate > 8) parts.push(`Boa qualificação (${mqlRate.toFixed(1)}% MQL).`);
  }
  if (c.vendas > 2) parts.push(`${c.vendas} vendas diretas.`);
  if (c.custoMql > 0 && c.custoMql < 50) parts.push(`Custo MQL acessível (R$${c.custoMql.toFixed(2)}).`);
  if (c.cpa > 0 && c.cpa < 500) parts.push(`CPA de R$${c.cpa.toFixed(2)}.`);
  if (c.avgCpl > 0 && c.avgCpl < 7) parts.push(`CPL eficiente (R$${c.avgCpl.toFixed(2)}).`);
  if (c.totalLeads > 500) parts.push(`Alto volume (${c.totalLeads} leads).`);
  return parts.length > 0 ? parts.join(' ') : '';
}

function enrichWithSupabaseData(
  aggregated: AggregatedCreative[],
  enrichmentMap: Map<string, SupabaseEnrichmentData>
): AggregatedCreative[] {
  if (enrichmentMap.size === 0) return aggregated;

  return aggregated.map(creative => {
    const key = creative.ads.toLowerCase().trim();
    const enrichment = enrichmentMap.get(key);

    if (!enrichment) return creative;

    const updated = { ...creative };
    updated.thumbnailUrl = enrichment.thumbnailUrl;
    updated.videoUrl = enrichment.videoUrl;
    updated.transcription = enrichment.transcription;
    updated.funnelStage = enrichment.funnelStage;
    updated.hasSupabaseData = true;

    // Replace proportional CRM with exact Supabase data
    if (enrichment.mqls > 0 || enrichment.closedWon > 0 || enrichment.callAgendada > 0) {
      updated.mql = enrichment.mqls;
      updated.callRealizada = enrichment.callRealizada;
      updated.vendas = enrichment.closedWon;
      updated.callAgendada = enrichment.callAgendada;
      updated.totalLeadsCrm = enrichment.totalLeadsCrm;
      updated.contrato = enrichment.contrato;
      updated.cpa = enrichment.closedWon > 0 ? creative.totalSpend / enrichment.closedWon : 0;
      updated.custoMql = enrichment.mqls > 0 ? creative.totalSpend / enrichment.mqls : 0;
    }

    updated.analysis = generateAnalysis(updated);
    return updated;
  });
}

function enrichKPIs(kpis: CreativeKPIs | null, enrichedCreatives: AggregatedCreative[]): CreativeKPIs | null {
  if (!kpis) return null;
  const totalMql = enrichedCreatives.reduce((s, c) => s + c.mql, 0);
  const totalCallRealizada = enrichedCreatives.reduce((s, c) => s + c.callRealizada, 0);
  const totalVendas = enrichedCreatives.reduce((s, c) => s + c.vendas, 0);
  const totalCallAgendada = enrichedCreatives.reduce((s, c) => s + c.callAgendada, 0);
  const avgCpa = totalVendas > 0 ? kpis.totalInvestimento / totalVendas : 0;
  const avgCustoMql = totalMql > 0 ? kpis.totalInvestimento / totalMql : 0;
  return { ...kpis, totalMql, totalCallRealizada, totalVendas, avgCpa, totalCallAgendada, avgCustoMql };
}

export function CreativeAnalysis({ dateRange, campanhas = [], funnelData = [] }: CreativeAnalysisProps) {
  const queryClient = useQueryClient();

  const { rawData, aggregated, kpis, isLoading, error } = useFilteredCreativeData({
    dateRange,
    campanhas: campanhas.length > 0 ? campanhas : undefined,
  });

  const { data: enrichmentMap = new Map(), isLoading: enrichmentLoading } = useCreativeEnrichment(dateRange);

  // Enrich with funnel data (proportional), then override with Supabase exact data
  const enrichedAggregated = useMemo(
    () => enrichWithSupabaseData(enrichWithFunnelData(aggregated, funnelData), enrichmentMap),
    [aggregated, funnelData, enrichmentMap]
  );

  const enrichedKpis = useMemo(
    () => enrichKPIs(kpis, enrichedAggregated),
    [kpis, enrichedAggregated]
  );

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['creative-sheets-data'] });
  };

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Erro ao carregar dados da planilha
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {error instanceof Error ? error.message : 'Erro desconhecido'}
        </p>
        <details className="text-xs text-muted-foreground mb-4">
          <summary className="cursor-pointer hover:text-foreground">
            Detalhes técnicos
          </summary>
          <pre className="mt-2 p-2 bg-muted/30 rounded text-left overflow-auto max-w-md">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
        <Button onClick={handleRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Empty state (after loading)
  if (!isLoading && (!rawData || rawData.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <VideoOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum criativo encontrado
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Não há dados de criativos de vídeo para os filtros selecionados
        </p>
        <p className="text-xs text-muted-foreground">
          Tente ajustar o período ou verifique se a planilha possui dados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <CreativeKPICards kpis={enrichedKpis} isLoading={isLoading} />

      {/* Funnel and Top Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreativeRetentionFunnel data={rawData} isLoading={isLoading} />
        <TopCreativesChart data={enrichedAggregated} isLoading={isLoading} />
      </div>

      {/* Scatter Plot */}
      <HookRateVsCplChart data={enrichedAggregated} isLoading={isLoading} />

      {/* Creative Table */}
      <CreativeTable data={enrichedAggregated} isLoading={isLoading} />
    </div>
  );
}
