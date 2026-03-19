export interface KPI {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  trend: number[];
}

export interface FunnelStage {
  name: string;
  count: number;
  color: string;
}

export interface LeadSource {
  name: string;
  percentage: number;
  color: string;
}

export interface Seller {
  name: string;
  revenue: number;
}

export interface Deal {
  lead: string;
  value: number;
  stage: string;
  seller: string;
  days: number;
}

export interface MonthlyRevenue {
  month: string;
  value: number;
}

// Análise Nanos
export interface NanoCreative {
  id: string;
  name: string;
  mql: number;
  calls: number;
  vendas: number;
  spend: number;
  cpa: number;
}

export interface JourneyNode {
  node: string;
  total: number;
  converted: number;
  dropped: number;
  conversionRate: number;
}

export interface DailyJourneyData {
  date: string;
  nodes: JourneyNode[];
}

export type PeriodFilter = '7d' | '14d' | '30d' | 'custom';
export type CompareMode = 'none' | 'previous' | 'same-last-month' | 'same-last-year';
