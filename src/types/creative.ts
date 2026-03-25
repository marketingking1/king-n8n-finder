// Interface principal - mapeia EXATAMENTE as colunas da planilha dados_video_consolidados
export interface VideoCreativeRow {
  // Dimensões
  dataEdit: number;           // Coluna "data_edit" — serial Excel (46040 = 18/01/2026)
  chaveDadosEdit: string;     // Coluna "chave_dados_edit" — chave composta
  campanha: string;           // Coluna "campanha"
  ads: string;                // Coluna "ads" — nome do criativo

  // Métricas de Retenção de Vídeo (pré-calculadas, formato "23,18%")
  hookRate: number | null;          // Coluna "hook rate" — views_3s / impressions × 100
  holdRate3s25: number | null;      // Coluna "Hold_rate_3s_25%" — views_25% / views_3s × 100
  completionRate: number | null;    // Coluna "Completion Rate" — % viewers 3s que completaram
  retention25_50: number | null;    // Coluna "Retenção 25→50%"
  retention50_75: number | null;    // Coluna "Retenção 50→75%"
  retention75_100: number | null;   // Coluna "Retenção 75→100%"

  // Métricas Brutas
  videoAvgTimeWatched: number;      // Coluna "Video Avg Time Watched Actions" — segundos
  spend: number;                    // Coluna "spend" — investimento em R$
  impressions: number;              // Coluna "Impressions"
  leads: number;                    // Coluna "leads"

  // Métricas Calculadas (pré-calculadas na planilha)
  cpm: number;                      // Coluna "cpm"
  ctr: number;                      // Coluna "ctr"
  cpc: number;                      // Coluna "cpc"
  cpl: number;                      // Coluna "cpl" — formato "R$ 22,54" (remover "R$ ")
}

// Dados derivados - calculados no frontend
export interface DerivedMetrics {
  views3s: number;           // hookRate × impressions / 100
  views25pct: number;        // holdRate3s25 × views3s / 100
  views50pct: number;        // retention25_50 × views25pct / 100
  views75pct: number;        // retention50_75 × views50pct / 100
  views100pct: number;       // retention75_100 × views75pct / 100
  clicks: number;            // ctr × impressions / 100
}

// Classificação de funil por frequência diária
export type FunnelStage = 'tofu' | 'mofu' | 'bofu';

export const FUNNEL_STAGE_CONFIG: Record<FunnelStage, { label: string; color: string }> = {
  tofu: { label: 'ToFu', color: '#3b82f6' },
  mofu: { label: 'MoFu', color: '#f59e0b' },
  bofu: { label: 'BoFu', color: '#22c55e' },
};

// Dados de enrichment vindos do Supabase ad_performance
export interface SupabaseEnrichmentData {
  adName: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  transcription: string | null;
  avgFrequency: number;
  funnelStage: FunnelStage;
  totalLeadsCrm: number;
  mqls: number;
  closedWon: number;
  callAgendada: number;
  callRealizada: number;
  contrato: number;
  spend: number;
}

// Criativo agregado - dados consolidados por criativo (across dates)
export interface AggregatedCreative {
  ads: string;
  displayName: string;         // Nome formatado para exibição
  campanhas: string[];         // Campanhas onde o criativo roda
  totalSpend: number;          // SUM(spend) across all dates
  totalImpressions: number;    // SUM(impressions)
  totalLeads: number;          // SUM(leads)
  avgHookRate: number;         // Média ponderada por impressions
  avgHoldRate: number;         // Média ponderada por impressions
  avgCompletionRate: number;   // Média ponderada por impressions
  avgRetention25_50: number;   // Média ponderada
  avgRetention50_75: number;   // Média ponderada
  avgRetention75_100: number;  // Média ponderada
  avgWatchTime: number;        // Média ponderada por impressions
  avgCpm: number;              // totalSpend / totalImpressions × 1000
  avgCtr: number;              // Média ponderada
  avgCpc: number;              // totalSpend / totalClicks
  avgCpl: number;              // totalSpend / totalLeads
  totalDays: number;           // Dias com dados
  dateRange: { start: Date; end: Date };
  // Funnel metrics (distributed proportionally from channel data)
  mql: number;
  callRealizada: number;
  vendas: number;
  cpa: number;
  // Supabase enrichment fields
  thumbnailUrl: string | null;
  videoUrl: string | null;
  transcription: string | null;
  funnelStage: FunnelStage | null;
  custoMql: number;
  callAgendada: number;
  totalLeadsCrm: number;
  contrato: number;
  analysis: string;
  hasSupabaseData: boolean;
}

// KPIs consolidados do período
export interface CreativeKPIs {
  totalInvestimento: number;
  totalImpressions: number;
  avgHookRate: number;
  avgHoldRate: number;
  avgCompletionRate: number;
  avgWatchTime: number;
  totalLeads: number;
  avgRetention50pct: number;  // % médio de quem chegou a 50% do vídeo
  avgCpl: number;
  avgCpm: number;
  avgCtr: number;
  // Funnel KPIs
  totalMql: number;
  totalCallRealizada: number;
  totalVendas: number;
  avgCpa: number;
  // Supabase enrichment KPIs
  totalCallAgendada: number;
  avgCustoMql: number;
}
