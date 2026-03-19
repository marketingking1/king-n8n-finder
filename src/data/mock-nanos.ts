import type { NanoCreative, DailyJourneyData } from '../types';

export const nanoCreatives: NanoCreative[] = [
  { id: 'cr-01', name: 'Hook Confronto - Inglês Errado', mql: 48, calls: 32, vendas: 12, spend: 2400, cpa: 200 },
  { id: 'cr-02', name: 'Depoimento Aluna Maria', mql: 35, calls: 22, vendas: 9, spend: 1800, cpa: 200 },
  { id: 'cr-03', name: 'Carrossel 5 Erros', mql: 62, calls: 41, vendas: 15, spend: 3100, cpa: 206.67 },
  { id: 'cr-04', name: 'Reels - Aula Ao Vivo', mql: 28, calls: 18, vendas: 7, spend: 1500, cpa: 214.29 },
  { id: 'cr-05', name: 'Story - Urgência Matrícula', mql: 41, calls: 28, vendas: 11, spend: 2200, cpa: 200 },
  { id: 'cr-06', name: 'VSL - Método King', mql: 55, calls: 38, vendas: 14, spend: 3500, cpa: 250 },
  { id: 'cr-07', name: 'UGC - Professor Nativo', mql: 33, calls: 20, vendas: 8, spend: 1700, cpa: 212.5 },
  { id: 'cr-08', name: 'Static - Comparação Preços', mql: 22, calls: 14, vendas: 5, spend: 1100, cpa: 220 },
];

function generateDailyNodes(dateStr: string, multiplier: number): DailyJourneyData {
  const base = [
    { node: 'Lead Entrada', total: Math.round(45 * multiplier), converted: Math.round(38 * multiplier), dropped: Math.round(7 * multiplier), conversionRate: 84.4 },
    { node: 'MQL (Qualificado)', total: Math.round(38 * multiplier), converted: Math.round(26 * multiplier), dropped: Math.round(12 * multiplier), conversionRate: 68.4 },
    { node: 'Call Agendada', total: Math.round(26 * multiplier), converted: Math.round(21 * multiplier), dropped: Math.round(5 * multiplier), conversionRate: 80.8 },
    { node: 'Call Realizada', total: Math.round(21 * multiplier), converted: Math.round(14 * multiplier), dropped: Math.round(7 * multiplier), conversionRate: 66.7 },
    { node: 'Proposta Enviada', total: Math.round(14 * multiplier), converted: Math.round(10 * multiplier), dropped: Math.round(4 * multiplier), conversionRate: 71.4 },
    { node: 'Venda Fechada', total: Math.round(10 * multiplier), converted: Math.round(10 * multiplier), dropped: 0, conversionRate: 100 },
  ];
  return { date: dateStr, nodes: base };
}

// Generate 90 days of daily journey data (for comparison support)
export const dailyJourneyData: DailyJourneyData[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date(2026, 2, 19); // March 19, 2026
  date.setDate(date.getDate() - (89 - i));
  const dateStr = date.toISOString().split('T')[0];
  // Slight daily variation
  const dayOfWeek = date.getDay();
  const multiplier = dayOfWeek === 0 ? 0.6 : dayOfWeek === 6 ? 0.75 : 0.85 + Math.random() * 0.35;
  return generateDailyNodes(dateStr, multiplier);
});
