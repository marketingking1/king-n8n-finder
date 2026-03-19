import type { KPI, FunnelStage, LeadSource, Seller, Deal, MonthlyRevenue } from '../types';

export const kpis: KPI[] = [
  {
    label: 'Revenue Total',
    value: 'R$ 847K',
    change: 12.3,
    changeLabel: '+12.3%',
    trend: [320, 380, 410, 450, 520, 580, 620, 690, 720, 780, 810, 847],
  },
  {
    label: 'Taxa Conversão',
    value: '23.4%',
    change: 2.1,
    changeLabel: '+2.1pp',
    trend: [18, 19, 20, 19, 21, 22, 20, 21, 22, 23, 23, 23.4],
  },
  {
    label: 'Ticket Médio',
    value: 'R$ 5.640',
    change: -3.2,
    changeLabel: '-3.2%',
    trend: [6100, 5900, 5800, 5950, 5700, 5600, 5800, 5750, 5680, 5700, 5660, 5640],
  },
  {
    label: 'Ciclo de Venda',
    value: '18 dias',
    change: -2,
    changeLabel: '-2 dias',
    trend: [24, 23, 22, 21, 20, 20, 19, 19, 18, 18, 18, 18],
  },
];

export const funnel: FunnelStage[] = [
  { name: 'Prospecção', count: 120, color: '#3B82F6' },
  { name: 'Qualificação', count: 89, color: '#6366F1' },
  { name: 'Proposta', count: 54, color: '#8B5CF6' },
  { name: 'Negociação', count: 35, color: '#A855F7' },
  { name: 'Fechamento', count: 21, color: '#059669' },
];

export const leadSources: LeadSource[] = [
  { name: 'Orgânico', percentage: 35, color: '#3B82F6' },
  { name: 'Indicação', percentage: 28, color: '#059669' },
  { name: 'Ads Google', percentage: 22, color: '#F59E0B' },
  { name: 'Ads Meta', percentage: 15, color: '#8B5CF6' },
];

export const topSellers: Seller[] = [
  { name: 'Ana Silva', revenue: 210000 },
  { name: 'Carlos M.', revenue: 185000 },
  { name: 'Julia R.', revenue: 142000 },
  { name: 'Pedro L.', revenue: 118000 },
  { name: 'Maria F.', revenue: 97000 },
];

export const monthlyRevenue: MonthlyRevenue[] = [
  { month: 'Dez', value: 180000 },
  { month: 'Jan', value: 210000 },
  { month: 'Fev', value: 245000 },
  { month: 'Mar', value: 212000 },
];

export const recentDeals: Deal[] = [
  { lead: 'Empresa ABC', value: 45000, stage: 'Negociação', seller: 'Ana S.', days: 12 },
  { lead: 'Tech Corp', value: 32000, stage: 'Proposta', seller: 'Carlos M.', days: 8 },
  { lead: 'StartUp XYZ', value: 28500, stage: 'Qualificação', seller: 'Julia R.', days: 5 },
  { lead: 'Global Inc', value: 67000, stage: 'Negociação', seller: 'Pedro L.', days: 15 },
  { lead: 'Alpha LTDA', value: 19500, stage: 'Prospecção', seller: 'Maria F.', days: 3 },
];
