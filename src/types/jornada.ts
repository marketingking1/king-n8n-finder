export interface JornadaChannelWeek {
  semana: number; // 1-4
  investimento: number;
  cpm: number;
  frequencia: number;
  cliquesLink: number;
  custoClick: number;
  ctrLink: number;
  connectRate: number;
  sessoes: number;
  sessoesEngajadas: number;
  taxaConversaoPagina: number;
  lead: number;
  custoPorLead: number;
  leadToMql: number;
  mql: number;
  cpmql: number;
  custoPorReuniao: number;
  vendas: number;
  cpa: number;
  roas: number;
}

export interface JornadaChannel {
  canal: 'Meta Ads' | 'Google Ads' | 'LinkedIn';
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

// Thresholds para cada KPI (valores de referência para classificação)
export interface KPIThresholds {
  ok: number;
  warning: number;
  // abaixo de warning = critical
}

// Mapa de indicadores para exibição na tabela
export interface JornadaIndicator {
  key: keyof JornadaChannelWeek;
  label: string;
  format: 'currency' | 'percent' | 'number' | 'decimal';
  tooltip: string;
}
