export interface MarketingData {
  data: string;
  campanha: string | null;
  grupo_anuncio: string | null;
  canal: string | null;
  investimento: number;
  impressoes: number;
  cliques: number;
  leads: number;
  conversoes: number;
  receita: number;
}

export interface AggregatedMetrics {
  investimento: number;
  impressoes: number;
  cliques: number;
  leads: number;
  conversoes: number;
  receita: number;
  ctr: number;
  cpc: number;
  cpl: number;
  cpa: number;
  roas: number;
  ticketMedio: number;
  taxaConversao: number;
}

export interface CampaignMetrics extends AggregatedMetrics {
  campanha: string;
}

export interface GroupMetrics extends AggregatedMetrics {
  grupo_anuncio: string;
}

export interface TimeSeriesData {
  data: string;
  investimento: number;
  receita: number;
  conversoes: number;
  roas: number;
}

export interface FunnelData {
  etapa: string;
  valor: number;
  taxa: number;
}

export type Granularity = 'day' | 'week' | 'month';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface FilterState {
  dateRange: DateRange;
  granularity: Granularity;
  campanhas: string[];
  grupos: string[];
  canais: string[];
}
