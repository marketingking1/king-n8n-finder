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
  impressoes: number;
  cliques: number;
  leads: number;
  conversoes: number;
  receita: number;
  roas: number;
  ctr: number; // CTR calculado após agregação: (cliques / impressoes) * 100
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

export interface ChannelMetrics {
  canal: string;
  // De tabela_objetivo (mídia paga) — 0 se canal não tem mídia paga
  investimento: number;
  impressoes: number;
  cliques: number;
  leadsMidia: number;  // leads trackeados pela plataforma de ads
  ctr: number;
  cpc: number;
  cpl: number;
  // De LEADS_COMPRADORES (vendas reais)
  vendas: number;       // total de vendas reais (count de BuyerRow)
  receita: number;      // sum do Valor da compra real
  ticketMedio: number;  // receita / vendas
  // Calculados na combinação
  cpa: number;          // investimento / vendas (0 se não tem investimento)
  roas: number;         // receita / investimento (0 se não tem investimento)
  taxaConversao: number; // (vendas / leadsMidia) * 100 (0 se não tem leads de mídia)
}
