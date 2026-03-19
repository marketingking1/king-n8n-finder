import { useMemo } from 'react';
import { VideoOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useFilteredCreativeData } from '@/hooks/useCreativeData';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import type { ChannelFunnelData } from '@/hooks/useFunnelByChannel';
import type { AggregatedCreative, CreativeKPIs } from '@/types/creative';
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

    const mql = Math.round(funnel.callAgendada * leadShare);
    const callRealizada = Math.round(funnel.callRealizada * leadShare);
    const vendas = Math.round(funnel.venda * leadShare);
    const cpa = vendas > 0 ? creative.totalSpend / vendas : 0;

    return { ...creative, mql, callRealizada, vendas, cpa };
  });
}

function enrichKPIs(kpis: CreativeKPIs | null, enrichedCreatives: AggregatedCreative[]): CreativeKPIs | null {
  if (!kpis) return null;
  const totalMql = enrichedCreatives.reduce((s, c) => s + c.mql, 0);
  const totalCallRealizada = enrichedCreatives.reduce((s, c) => s + c.callRealizada, 0);
  const totalVendas = enrichedCreatives.reduce((s, c) => s + c.vendas, 0);
  const avgCpa = totalVendas > 0 ? kpis.totalInvestimento / totalVendas : 0;
  return { ...kpis, totalMql, totalCallRealizada, totalVendas, avgCpa };
}

export function CreativeAnalysis({ dateRange, campanhas = [], funnelData = [] }: CreativeAnalysisProps) {
  const queryClient = useQueryClient();

  const { rawData, aggregated, kpis, isLoading, error } = useFilteredCreativeData({
    dateRange,
    campanhas: campanhas.length > 0 ? campanhas : undefined,
  });

  // Enrich with funnel data
  const enrichedAggregated = useMemo(
    () => enrichWithFunnelData(aggregated, funnelData),
    [aggregated, funnelData]
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
