import { useMemo } from 'react';
import { MacroMetrics } from '@/hooks/useMacroData';
import { FunnelMacroData } from '@/hooks/useFunnelMacroData';
import { ChannelFunnelData } from '@/hooks/useFunnelByChannel';
import { formatNumber, formatCurrency, formatPercent, formatDecimal } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Eye, MousePointer, Users, CalendarCheck, PhoneCall, ShoppingCart,
  ChevronDown, Download, ArrowUpDown, TrendingDown, DollarSign,
  Target, AlertTriangle, ArrowRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FunnelAnalysisProps {
  macroMetrics: MacroMetrics | undefined;
  funnelMacroData: FunnelMacroData | undefined;
  channelFunnelData: ChannelFunnelData[];
  sheetsLeadsTotal: number;
  isLoading: boolean;
}

interface FunnelStage {
  key: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  costPerUnit: number;
  convToNext?: number;
  dropoff?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHANNEL_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'Meta Ads':  { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'hsl(221, 83%, 53%)' },
  'Google Ads': { bg: 'bg-green-500/10', text: 'text-green-400', bar: 'hsl(142, 71%, 45%)' },
  'LinkedIn':  { bg: 'bg-sky-500/10', text: 'text-sky-400', bar: 'hsl(210, 80%, 42%)' },
  'Orgânico':  { bg: 'bg-purple-500/10', text: 'text-purple-400', bar: 'hsl(270, 50%, 50%)' },
  'Indicação': { bg: 'bg-orange-500/10', text: 'text-orange-400', bar: 'hsl(35, 90%, 50%)' },
  'Não identificado': { bg: 'bg-zinc-500/10', text: 'text-zinc-400', bar: 'hsl(0, 0%, 55%)' },
};

function getChannelStyle(canal: string) {
  return CHANNEL_COLORS[canal] ?? { bg: 'bg-muted/10', text: 'text-muted-foreground', bar: 'hsl(0,0%,50%)' };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KPICard({ label, value, subtitle, icon, color }: {
  label: string; value: string; subtitle?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={cn("p-1.5 rounded-lg", color)}>
          {icon}
        </div>
      </div>
      <div className="text-xl font-display font-bold text-foreground">{value}</div>
      {subtitle && <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── Main Macro Funnel (Growth style) ────────────────────────────────────────

function GrowthFunnel({ stages, investimento }: { stages: FunnelStage[]; investimento: number }) {
  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="mb-6">
        <h3 className="text-base font-display font-semibold text-foreground">Funil Completo</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Investimento total: {formatCurrency(investimento)} &middot; Custo por etapa do funil
        </p>
      </div>

      <div className="flex flex-col items-center">
        {stages.map((stage, idx) => {
          const widthPct = stages.length > 0
            ? Math.max(30, 100 - (idx * (70 / (stages.length - 1 || 1))))
            : 100;

          return (
            <div key={stage.key} className="w-full flex flex-col items-center">
              {/* Stage bar */}
              <div
                className={cn(
                  "relative py-3 px-4 flex items-center justify-between rounded-lg border border-border",
                  "transition-all duration-200 hover:border-primary/30",
                  stage.color,
                )}
                style={{ width: `${widthPct}%`, minWidth: '280px' }}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
                    {stage.icon}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-foreground block">{stage.label}</span>
                    {stage.costPerUnit > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatCurrency(stage.costPerUnit)} / unidade
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-display font-bold text-foreground block">
                    {formatNumber(stage.value)}
                  </span>
                </div>
              </div>

              {/* Conversion arrow between stages */}
              {idx < stages.length - 1 && (
                <div className="flex items-center gap-3 py-1.5">
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    {stage.convToNext !== undefined && (
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[hsl(216,30%,16%)] border border-border",
                        stage.convToNext >= 10 ? "text-success" : stage.convToNext >= 3 ? "text-warning" : "text-destructive"
                      )}>
                        {formatPercent(stage.convToNext)}
                      </span>
                    )}
                    {stage.dropoff !== undefined && stage.dropoff > 0 && (
                      <span className="text-[10px] text-destructive/70 flex items-center gap-0.5">
                        <TrendingDown className="h-3 w-3" />
                        -{formatNumber(stage.dropoff)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Channel Funnel Bars ─────────────────────────────────────────────────────

const STAGE_DEFS = [
  { key: 'leads' as const, label: 'Leads' },
  { key: 'callAgendada' as const, label: 'Call Agendada' },
  { key: 'callRealizada' as const, label: 'Call Realizada' },
  { key: 'noshow' as const, label: 'No-show' },
  { key: 'venda' as const, label: 'Venda' },
] as const;

function ChannelFunnelBars({ data }: { data: ChannelFunnelData[] }) {
  const maxValue = useMemo(() => {
    let max = 0;
    for (const row of data) {
      for (const s of STAGE_DEFS) {
        if (row[s.key] > max) max = row[s.key];
      }
    }
    return max || 1;
  }, [data]);

  if (!data.length) return null;

  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="mb-6">
        <h3 className="text-base font-display font-semibold text-foreground">Funil por Canal</h3>
        <p className="text-xs text-muted-foreground mt-1">Comparativo de cada etapa segmentado por canal de aquisição</p>
      </div>

      <div className="space-y-6">
        {STAGE_DEFS.map((stage) => {
          const stageTotal = data.reduce((sum, row) => sum + row[stage.key], 0);
          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stage.label}</span>
                <span className="text-sm font-display font-bold text-foreground">{formatNumber(stageTotal)}</span>
              </div>
              <div className="space-y-1.5">
                {data.map(row => {
                  const value = row[stage.key];
                  const widthPct = Math.max((value / maxValue) * 100, value > 0 ? 2.5 : 0);
                  const style = getChannelStyle(row.canal);
                  const pctOfStage = stageTotal > 0 ? (value / stageTotal) * 100 : 0;

                  return (
                    <div key={row.canal} className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground w-20 text-right truncate">{row.canal}</span>
                      <div className="flex-1 h-6 bg-muted/20 rounded overflow-hidden relative">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{ width: `${widthPct}%`, backgroundColor: style.bar }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground w-14 text-right tabular-nums">
                        {formatNumber(value)}
                      </span>
                      <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">
                        {formatDecimal(pctOfStage, 0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border">
        {data.map(row => (
          <div key={row.canal} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getChannelStyle(row.canal).bar }} />
            <span className="text-xs text-muted-foreground">{row.canal}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Cost per Stage Analysis ─────────────────────────────────────────────────

function CostPerStageCards({ stages }: { stages: FunnelStage[] }) {
  const costStages = stages.filter(s => s.costPerUnit > 0);
  if (!costStages.length) return null;

  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="mb-4">
        <h3 className="text-base font-display font-semibold text-foreground">Custo por Etapa do Funil</h3>
        <p className="text-xs text-muted-foreground mt-1">Quanto custa, em média, avançar um lead para cada etapa</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {costStages.map((stage, idx) => (
          <div key={stage.key} className="relative">
            <div className={cn(
              "rounded-lg border border-border p-3 text-center",
              stage.color,
            )}>
              <div className="p-1.5 rounded-lg bg-primary/15 text-primary mx-auto w-fit mb-2">
                {stage.icon}
              </div>
              <p className="text-[11px] text-muted-foreground mb-1">{stage.label}</p>
              <p className="text-sm font-display font-bold text-foreground">{formatCurrency(stage.costPerUnit)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatNumber(stage.value)} unid.</p>
            </div>
            {idx < costStages.length - 1 && (
              <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Channel Detail Table ────────────────────────────────────────────────────

type SortField = 'canal' | 'investimento' | 'leads' | 'callAgendada' | 'callRealizada' | 'noshow' | 'taxaNoshow' | 'venda' | 'taxaVenda' | 'cpl' | 'cpCallAgendada' | 'cpCallRealizada' | 'cpa' | 'taxaAgendamento' | 'taxaRealizacao';

function ChannelDetailTable({ data }: { data: ChannelFunnelData[] }) {
  const [sortField, setSortField] = useState<SortField>('leads');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [data, sortField, sortDir]);

  const totals = useMemo(() => {
    const t = data.reduce((acc, r) => ({
      investimento: acc.investimento + r.investimento,
      leads: acc.leads + r.leads,
      callAgendada: acc.callAgendada + r.callAgendada,
      callRealizada: acc.callRealizada + r.callRealizada,
      noshow: acc.noshow + r.noshow,
      venda: acc.venda + r.venda,
    }), { investimento: 0, leads: 0, callAgendada: 0, callRealizada: 0, noshow: 0, venda: 0 });
    return {
      ...t,
      taxaAgendamento: t.leads > 0 ? (t.callAgendada / t.leads) * 100 : 0,
      taxaRealizacao: t.callAgendada > 0 ? (t.callRealizada / t.callAgendada) * 100 : 0,
      taxaNoshow: t.callAgendada > 0 ? (t.noshow / t.callAgendada) * 100 : 0,
      taxaVenda: t.callRealizada > 0 ? (t.venda / t.callRealizada) * 100 : 0,
      cpl: t.leads > 0 && t.investimento > 0 ? t.investimento / t.leads : 0,
      cpCallAgendada: t.callAgendada > 0 && t.investimento > 0 ? t.investimento / t.callAgendada : 0,
      cpCallRealizada: t.callRealizada > 0 && t.investimento > 0 ? t.investimento / t.callRealizada : 0,
      cpa: t.venda > 0 && t.investimento > 0 ? t.investimento / t.venda : 0,
    };
  }, [data]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const exportCSV = () => {
    const headers = ['Canal', 'Investimento', 'Leads', 'CPL', 'Call Agend.', '% Agend.', 'CP Call Agend.', 'Call Real.', '% Real.', 'CP Call Real.', 'No-show', '% No-show', 'Venda', '% Venda', 'CPA'];
    const rows = sorted.map(r => [
      r.canal, r.investimento.toFixed(2), r.leads, r.cpl.toFixed(2),
      r.callAgendada, r.taxaAgendamento.toFixed(2), r.cpCallAgendada.toFixed(2),
      r.callRealizada, r.taxaRealizacao.toFixed(2), r.cpCallRealizada.toFixed(2),
      r.noshow, r.taxaNoshow.toFixed(2), r.venda, r.taxaVenda.toFixed(2),
      r.cpa.toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'funil_por_canal.csv';
    link.click();
  };

  const SH = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 transition-colors text-xs font-medium uppercase tracking-wide"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn("h-3 w-3", sortField === field ? "text-primary" : "text-muted-foreground")} />
      </div>
    </TableHead>
  );

  const isOrganic = (c: string) => c === 'Orgânico' || c === 'Indicação' || c === 'Não identificado';

  if (!data.length) return null;

  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-base font-display font-semibold text-foreground">Performance por Canal - Detalhado</h3>
        <Button variant="outline" size="sm" onClick={exportCSV} className="h-8 gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SH field="canal">Canal</SH>
              <SH field="investimento">Invest.</SH>
              <SH field="leads">Leads</SH>
              <SH field="cpl">CPL</SH>
              <SH field="callAgendada">Agend.</SH>
              <SH field="taxaAgendamento">% Agend.</SH>
              <SH field="cpCallAgendada">CP Agend.</SH>
              <SH field="callRealizada">Real.</SH>
              <SH field="taxaRealizacao">% Real.</SH>
              <SH field="cpCallRealizada">CP Real.</SH>
              <SH field="noshow">No-show</SH>
              <SH field="taxaNoshow">% No-show</SH>
              <SH field="venda">Venda</SH>
              <SH field="taxaVenda">% Conv.</SH>
              <SH field="cpa">CPA</SH>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(row => {
              const style = getChannelStyle(row.canal);
              return (
                <TableRow key={row.canal} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: style.bar }} />
                      {row.canal}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{row.investimento > 0 ? formatCurrency(row.investimento) : '-'}</TableCell>
                  <TableCell className="text-sm font-medium">{formatNumber(row.leads)}</TableCell>
                  <TableCell className="text-sm">{isOrganic(row.canal) || row.cpl === 0 ? '-' : formatCurrency(row.cpl)}</TableCell>
                  <TableCell className="text-sm">{formatNumber(row.callAgendada)}</TableCell>
                  <TableCell className={cn("text-sm", row.taxaAgendamento >= 5 ? "text-success" : row.taxaAgendamento >= 1 ? "text-warning" : "text-muted-foreground")}>
                    {row.leads > 0 ? formatPercent(row.taxaAgendamento) : '-'}
                  </TableCell>
                  <TableCell className="text-sm">{isOrganic(row.canal) || row.cpCallAgendada === 0 ? '-' : formatCurrency(row.cpCallAgendada)}</TableCell>
                  <TableCell className="text-sm">{formatNumber(row.callRealizada)}</TableCell>
                  <TableCell className={cn("text-sm", row.taxaRealizacao >= 50 ? "text-success" : row.taxaRealizacao >= 30 ? "text-warning" : "text-muted-foreground")}>
                    {row.callAgendada > 0 ? formatPercent(row.taxaRealizacao) : '-'}
                  </TableCell>
                  <TableCell className="text-sm">{isOrganic(row.canal) || row.cpCallRealizada === 0 ? '-' : formatCurrency(row.cpCallRealizada)}</TableCell>
                  <TableCell className="text-sm">{formatNumber(row.noshow)}</TableCell>
                  <TableCell className={cn("text-sm font-medium", row.taxaNoshow >= 40 ? "text-destructive" : row.taxaNoshow >= 20 ? "text-warning" : "text-success")}>
                    {row.callAgendada > 0 ? formatPercent(row.taxaNoshow) : '-'}
                  </TableCell>
                  <TableCell className="text-sm font-bold">{formatNumber(row.venda)}</TableCell>
                  <TableCell className={cn("text-sm font-medium", row.taxaVenda >= 30 ? "text-success" : row.taxaVenda >= 10 ? "text-warning" : "text-muted-foreground")}>
                    {row.callRealizada > 0 ? formatPercent(row.taxaVenda) : '-'}
                  </TableCell>
                  <TableCell className="text-sm">{isOrganic(row.canal) || row.cpa === 0 ? '-' : formatCurrency(row.cpa)}</TableCell>
                </TableRow>
              );
            })}
            {/* Totals */}
            <TableRow className="bg-[hsl(216,30%,14%)] font-semibold border-t-2 border-border">
              <TableCell className="text-sm">TOTAL</TableCell>
              <TableCell className="text-sm">{totals.investimento > 0 ? formatCurrency(totals.investimento) : '-'}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.leads)}</TableCell>
              <TableCell className="text-sm">{totals.cpl > 0 ? formatCurrency(totals.cpl) : '-'}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.callAgendada)}</TableCell>
              <TableCell className="text-sm">{formatPercent(totals.taxaAgendamento)}</TableCell>
              <TableCell className="text-sm">{totals.cpCallAgendada > 0 ? formatCurrency(totals.cpCallAgendada) : '-'}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.callRealizada)}</TableCell>
              <TableCell className="text-sm">{formatPercent(totals.taxaRealizacao)}</TableCell>
              <TableCell className="text-sm">{totals.cpCallRealizada > 0 ? formatCurrency(totals.cpCallRealizada) : '-'}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.noshow)}</TableCell>
              <TableCell className="text-sm">{formatPercent(totals.taxaNoshow)}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.venda)}</TableCell>
              <TableCell className="text-sm">{formatPercent(totals.taxaVenda)}</TableCell>
              <TableCell className="text-sm">{totals.cpa > 0 ? formatCurrency(totals.cpa) : '-'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function FunnelAnalysis({ macroMetrics, funnelMacroData, channelFunnelData, sheetsLeadsTotal, isLoading }: FunnelAnalysisProps) {
  // Build macro funnel stages with cost-per-unit
  const { stages, kpis } = useMemo(() => {
    if (!macroMetrics) return { stages: [] as FunnelStage[], kpis: null };

    const investimento = macroMetrics.investimento || 0;
    const impressoes = macroMetrics.impressoes || 0;
    const cliques = macroMetrics.cliques || 0;
    const vendas = macroMetrics.conversoes || 0;

    // Leads vêm da tabela_objetivo (mesma fonte da Análise Micro / campanhas)
    const leads = sheetsLeadsTotal;
    const callAgendada = funnelMacroData?.callAgendada ?? 0;
    const callRealizada = funnelMacroData?.callRealizada ?? 0;

    // Noshow from channel data (sum)
    const totalNoshow = channelFunnelData.reduce((s, r) => s + r.noshow, 0);

    // Conversion rates
    const impToClick = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
    const clickToLead = cliques > 0 ? (leads / cliques) * 100 : 0;
    const leadToAgend = leads > 0 ? (callAgendada / leads) * 100 : 0;
    const agendToReal = callAgendada > 0 ? (callRealizada / callAgendada) * 100 : 0;
    const realToVenda = callRealizada > 0 ? (vendas / callRealizada) * 100 : 0;

    // Cost per unit at each stage
    const cpm = impressoes > 0 ? (investimento / impressoes) * 1000 : 0;
    const cpc = cliques > 0 ? investimento / cliques : 0;
    const cpl = leads > 0 ? investimento / leads : 0;
    const cpCallAgend = callAgendada > 0 ? investimento / callAgendada : 0;
    const cpCallReal = callRealizada > 0 ? investimento / callRealizada : 0;
    const cpa = vendas > 0 ? investimento / vendas : 0;

    // Lead→Venda total conversion
    const leadToVenda = leads > 0 ? (vendas / leads) * 100 : 0;
    const noshowRate = callAgendada > 0 ? (totalNoshow / callAgendada) * 100 : 0;

    const stages: FunnelStage[] = [
      {
        key: 'impressoes', label: 'Impressões', value: impressoes,
        icon: <Eye className="h-4 w-4" />, color: 'bg-[hsl(216,30%,14%)]',
        costPerUnit: cpm, convToNext: impToClick, dropoff: impressoes - cliques,
      },
      {
        key: 'cliques', label: 'Cliques', value: cliques,
        icon: <MousePointer className="h-4 w-4" />, color: 'bg-[hsl(216,30%,14%)]',
        costPerUnit: cpc, convToNext: clickToLead, dropoff: cliques - leads,
      },
      {
        key: 'leads', label: 'Leads (CRM)', value: leads,
        icon: <Users className="h-4 w-4" />, color: 'bg-[hsl(220,30%,14%)]',
        costPerUnit: cpl, convToNext: leadToAgend, dropoff: leads - callAgendada,
      },
      {
        key: 'callAgendada', label: 'Call Agendada', value: callAgendada,
        icon: <CalendarCheck className="h-4 w-4" />, color: 'bg-[hsl(220,30%,14%)]',
        costPerUnit: cpCallAgend, convToNext: agendToReal, dropoff: callAgendada - callRealizada,
      },
      {
        key: 'callRealizada', label: 'Call Realizada', value: callRealizada,
        icon: <PhoneCall className="h-4 w-4" />, color: 'bg-[hsl(220,30%,14%)]',
        costPerUnit: cpCallReal, convToNext: realToVenda, dropoff: callRealizada - vendas,
      },
      {
        key: 'vendas', label: 'Vendas', value: vendas,
        icon: <ShoppingCart className="h-4 w-4" />, color: 'bg-success/10',
        costPerUnit: cpa,
      },
    ];

    const kpis = {
      leads, vendas, investimento, cpl, cpa, leadToVenda, noshowRate, callAgendada, callRealizada, totalNoshow,
    };

    return { stages, kpis };
  }, [macroMetrics, funnelMacroData, channelFunnelData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
        <Skeleton className="h-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Nenhum dado disponível para o período selecionado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          label="Leads (CRM)"
          value={formatNumber(kpis.leads)}
          subtitle="Total de leads no período"
          icon={<Users className="h-4 w-4 text-primary" />}
          color="bg-primary/15"
        />
        <KPICard
          label="Vendas"
          value={formatNumber(kpis.vendas)}
          subtitle={`${formatPercent(kpis.leadToVenda)} Lead→Venda`}
          icon={<ShoppingCart className="h-4 w-4 text-success" />}
          color="bg-success/15"
        />
        <KPICard
          label="CPL"
          value={kpis.cpl > 0 ? formatCurrency(kpis.cpl) : '-'}
          subtitle="Custo por Lead"
          icon={<DollarSign className="h-4 w-4 text-blue-400" />}
          color="bg-blue-500/15"
        />
        <KPICard
          label="CPA"
          value={kpis.cpa > 0 ? formatCurrency(kpis.cpa) : '-'}
          subtitle="Custo por Aquisição"
          icon={<Target className="h-4 w-4 text-orange-400" />}
          color="bg-orange-500/15"
        />
        <KPICard
          label="No-show"
          value={formatNumber(kpis.totalNoshow)}
          subtitle={`${formatPercent(kpis.noshowRate)} das agendadas`}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          color="bg-destructive/15"
        />
        <KPICard
          label="Investimento"
          value={formatCurrency(kpis.investimento)}
          subtitle={`${formatNumber(kpis.callRealizada)} calls realizadas`}
          icon={<DollarSign className="h-4 w-4 text-yellow-400" />}
          color="bg-yellow-500/15"
        />
      </div>

      {/* Macro Funnel + Cost per Stage side by side on desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GrowthFunnel stages={stages} investimento={kpis.investimento} />
        <CostPerStageCards stages={stages} />
      </div>

      {/* Channel Funnel Bars */}
      <ChannelFunnelBars data={channelFunnelData} />

      {/* Channel Detail Table */}
      <ChannelDetailTable data={channelFunnelData} />
    </div>
  );
}
