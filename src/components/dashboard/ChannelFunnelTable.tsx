import { useState, useMemo } from 'react';
import { ChannelFunnelData } from '@/hooks/useFunnelByChannel';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, ArrowUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChannelFunnelTableProps {
  data: ChannelFunnelData[];
  isLoading: boolean;
}

type SortField = 'canal' | 'investimento' | 'leads' | 'callAgendada' | 'callRealizada' | 'noshow' | 'taxaNoshow' | 'venda' | 'taxaVenda' | 'cpl' | 'cpa';
type SortDirection = 'asc' | 'desc';

export function ChannelFunnelTable({ data, isLoading }: ChannelFunnelTableProps) {
  const [sortField, setSortField] = useState<SortField>('leads');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [data, sortField, sortDirection]);

  const totals = useMemo(() => {
    const t = data.reduce(
      (acc, row) => ({
        investimento: acc.investimento + row.investimento,
        leads: acc.leads + row.leads,
        callAgendada: acc.callAgendada + row.callAgendada,
        callRealizada: acc.callRealizada + row.callRealizada,
        noshow: acc.noshow + row.noshow,
        venda: acc.venda + row.venda,
      }),
      { investimento: 0, leads: 0, callAgendada: 0, callRealizada: 0, noshow: 0, venda: 0 }
    );
    return {
      ...t,
      taxaNoshow: t.callAgendada > 0 ? (t.noshow / t.callAgendada) * 100 : 0,
      taxaVenda: t.callRealizada > 0 ? (t.venda / t.callRealizada) * 100 : 0,
      cpl: t.leads > 0 && t.investimento > 0 ? t.investimento / t.leads : 0,
      cpa: t.venda > 0 && t.investimento > 0 ? t.investimento / t.venda : 0,
    };
  }, [data]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportCSV = () => {
    const headers = ['Canal', 'Investimento', 'Leads', 'Call Agend.', 'Call Real.', 'No-show', 'No-show%', 'Venda', 'Conv.%', 'CPL', 'CPA'];
    const rows = sortedData.map(row => [
      row.canal,
      row.investimento.toFixed(2),
      row.leads,
      row.callAgendada,
      row.callRealizada,
      row.noshow,
      row.taxaNoshow.toFixed(2),
      row.venda,
      row.taxaVenda.toFixed(2),
      row.cpl.toFixed(2),
      row.cpa.toFixed(2),
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'funil_por_canal.csv';
    link.click();
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 transition-colors text-xs font-medium uppercase tracking-wide"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn(
          "h-3 w-3 transition-colors",
          sortField === field ? "text-primary" : "text-muted-foreground"
        )} />
      </div>
    </TableHead>
  );

  const isOrganic = (canal: string) => canal === 'Orgânico' || canal === 'Indicação';

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <Skeleton className="h-6 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data.length) return null;

  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-base font-display font-semibold text-foreground">Funil por Canal - Detalhado</h3>
        <Button variant="outline" size="sm" onClick={exportCSV} className="h-8 gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortHeader field="canal">Canal</SortHeader>
              <SortHeader field="investimento">Invest.</SortHeader>
              <SortHeader field="leads">Leads</SortHeader>
              <SortHeader field="callAgendada">Call Agend.</SortHeader>
              <SortHeader field="callRealizada">Call Real.</SortHeader>
              <SortHeader field="noshow">No-show</SortHeader>
              <SortHeader field="taxaNoshow">No-show%</SortHeader>
              <SortHeader field="venda">Venda</SortHeader>
              <SortHeader field="taxaVenda">Conv.%</SortHeader>
              <SortHeader field="cpl">CPL</SortHeader>
              <SortHeader field="cpa">CPA</SortHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map(row => (
              <TableRow key={row.canal} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium text-sm">{row.canal}</TableCell>
                <TableCell className="text-sm">
                  {row.investimento > 0 ? formatCurrency(row.investimento) : '-'}
                </TableCell>
                <TableCell className="text-sm">{formatNumber(row.leads)}</TableCell>
                <TableCell className="text-sm">{formatNumber(row.callAgendada)}</TableCell>
                <TableCell className="text-sm">{formatNumber(row.callRealizada)}</TableCell>
                <TableCell className="text-sm">{formatNumber(row.noshow)}</TableCell>
                <TableCell className={cn(
                  "text-sm font-medium",
                  row.taxaNoshow >= 40 ? "text-destructive" : row.taxaNoshow >= 20 ? "text-warning" : "text-success"
                )}>
                  {row.callAgendada > 0 ? formatPercent(row.taxaNoshow) : '-'}
                </TableCell>
                <TableCell className="text-sm font-medium">{formatNumber(row.venda)}</TableCell>
                <TableCell className={cn(
                  "text-sm font-medium",
                  row.taxaVenda >= 30 ? "text-success" : row.taxaVenda >= 10 ? "text-warning" : "text-muted-foreground"
                )}>
                  {row.callRealizada > 0 ? formatPercent(row.taxaVenda) : '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {isOrganic(row.canal) || row.cpl === 0 ? '-' : formatCurrency(row.cpl)}
                </TableCell>
                <TableCell className="text-sm">
                  {isOrganic(row.canal) || row.cpa === 0 ? '-' : formatCurrency(row.cpa)}
                </TableCell>
              </TableRow>
            ))}

            {/* Totals row */}
            <TableRow className="bg-[hsl(216,30%,14%)] font-semibold border-t-2 border-border">
              <TableCell className="text-sm">TOTAL</TableCell>
              <TableCell className="text-sm">
                {totals.investimento > 0 ? formatCurrency(totals.investimento) : '-'}
              </TableCell>
              <TableCell className="text-sm">{formatNumber(totals.leads)}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.callAgendada)}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.callRealizada)}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.noshow)}</TableCell>
              <TableCell className="text-sm">{formatPercent(totals.taxaNoshow)}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.venda)}</TableCell>
              <TableCell className="text-sm">{formatPercent(totals.taxaVenda)}</TableCell>
              <TableCell className="text-sm">{totals.cpl > 0 ? formatCurrency(totals.cpl) : '-'}</TableCell>
              <TableCell className="text-sm">{totals.cpa > 0 ? formatCurrency(totals.cpa) : '-'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
