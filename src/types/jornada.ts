export type ChannelType = 'native-form' | 'landing-page';

export interface JornadaChannelWeek {
  semana: number; // 1-4
  investimento: number;
  impressoes: number;
  cpm: number;
  frequencia: number;
  cliquesLink: number;
  custoClick: number;
  ctrLink: number;
  // Landing page metrics (Google Ads only)
  sessoes: number;
  sessoesEngajadas: number;
  connectRate: number;
  taxaConversaoPagina: number;
  // Funnel metrics (all channels)
  lead: number;
  custoPorLead: number;
  leadToMql: number;
  mql: number;
  cpmql: number;
  callRealizada: number;
  custoPorReuniao: number;
  vendas: number;
  cpa: number;
  roas: number;
}

export interface JornadaChannel {
  canal: 'Meta Ads' | 'Google Ads' | 'LinkedIn';
  channelType: ChannelType;
  semanas: JornadaChannelWeek[];
  mes: JornadaChannelWeek; // consolidado mensal
}

export type NodeStatus = 'ok' | 'warning' | 'critical';

export interface JornadaNode {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  status: NodeStatus;
  tooltip: string;
  acoes: string[];
}

export interface PorqueAnalysis {
  problema: string;
  porques: string[]; // até 5
}

// Mapa de indicadores para exibição na tabela
export interface JornadaIndicator {
  key: keyof JornadaChannelWeek;
  label: string;
  format: 'currency' | 'percent' | 'number' | 'decimal';
  tooltip: string;
}
