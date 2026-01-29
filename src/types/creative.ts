// Tipos para dados de criativos de vídeo do Facebook Ads

export interface CreativeRawData {
  data_edit: string;
  chave_dados_edit: string;
  campanha: string;
  ads: string;
  hook_rate: number;
  hold_rate_25: number;
  completion_rate: number;
  retencao_25_50: number;
  retencao_50_75: number;
  retencao_75_100: number;
  video_avg_time: number;
  actions: number;
  spend: number;
  impressions: number;
  cpm: number;
  ctr: number;
  cpc: number;
  leads: number;
  cpl: number;
}

// Métricas derivadas calculadas no frontend
export interface CreativeMetrics extends CreativeRawData {
  // Calculadas
  clicks: number;
  taxa_conversao: number;
  eficiencia: number;
  video_score: number;
  roi_video: number;
}

// Métricas agregadas para KPIs
export interface CreativeAggregatedMetrics {
  // Métricas de Vídeo (médias)
  hook_rate_avg: number;
  hold_rate_25_avg: number;
  completion_rate_avg: number;
  retencao_25_50_avg: number;
  retencao_50_75_avg: number;
  retencao_75_100_avg: number;
  video_avg_time_avg: number;
  
  // Métricas de Conversão (totais)
  actions_total: number;
  leads_total: number;
  
  // Métricas de Volume (totais)
  spend_total: number;
  impressions_total: number;
  
  // Métricas de Custo/Taxa (médias)
  cpm_avg: number;
  ctr_avg: number;
  cpc_avg: number;
  cpl_avg: number;
  
  // Métricas Derivadas (médias)
  taxa_conversao_avg: number;
  eficiencia_avg: number;
  video_score_avg: number;
  roi_video_avg: number;
}

// Dados para o funil de retenção
export interface RetentionFunnelData {
  etapa: string;
  valor: number;
  taxa: number;
}

// Filtros específicos para criativos
export interface CreativeFilters {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  campanhas: string[];
  tiposCriativo: string[];
  variantes: string[];
  apenasVideo: boolean;
  minImpressoes: number;
}

// Scorecard de eficiência
export interface CreativeScorecard {
  ad_name: string;
  ranking: number;
  video_score: number;
  conversion_score: number;
  efficiency_score: number;
  engagement_score: number;
  overall_score: number;
  recomendacao: 'aumentar' | 'manter' | 'reduzir' | 'pausar';
}
