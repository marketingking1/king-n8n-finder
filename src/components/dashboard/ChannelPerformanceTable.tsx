import { useState, useMemo } from 'react';
import { ChannelMetrics } from '@/types/dashboard';
import { getROASColor, getCPAColor } from '@/lib/metrics';
import { formatCurrency, formatNumber, formatPercent, formatROAS } from '@/lib/formatters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface ChannelPerformanceTableProps {
  data: ChannelMetrics[];
  isLoading?: boolean;
}

type SortField = 'canal' | 'vendas' | 'receita' | 'ticketMedio' | 'investimento' | 'cpa' | 'roas' | 'leadsMidia' | 'impressoes' | 'ctr';
type SortDirection = 'asc' | 'desc';

export function ChannelPerformanceTable({ data, isLoading }: ChannelPerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('receita');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [data, sortField, sortDirection]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, row) => ({
        investimento: acc.investimento + row.investimento,
        impressoes: acc.impressoes + row.impressoes,
        cliques: acc.cliques + row.cliques,
        leadsMidia: acc.leadsMidia + row.leadsMidia,
        vendas: acc.vendas + row.vendas,
        receita: acc.receita + row.receita,
      }),
      { investimento: 0, impressoes: 0, cliques: 0, leadsMidia: 0, vendas: 0, receita: 0 }
    );
  }, [data]);

  const totalMetrics = {
    ctr: totals.impressoes > 0 ? (totals.cliques / totals.impressoes) * 100 : 0,
    ticketMedio: totals.vendas > 0 ? totals.receita / totals.vendas : 0,
    cpa: totals.vendas > 0 && totals.investimento > 0 ? totals.investimento / totals.vendas : 0,
    roas: totals.investimento > 0 ? totals.receita / totals.investimento : 0,
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportCSV = () => {
    const headers = ['Canal', 'Vendas', 'Receita', 'Ticket Médio', 'Investimento', '% Budget', 'CPA', 'ROAS', 'Leads Mídia', 'Impressões', 'CTR'];
    const rows = sortedData.map(row => {
      const budgetPercent = totals.investimento > 0 ? (row.investimento / totals.investimento) * 100 : 0;
      return [
        row.canal,
        row.vendas,
        row.receita.toFixed(2),
        row.ticketMedio.toFixed(2),
        row.investimento.toFixed(2),
        budgetPercent.toFixed(2),
        row.investimento > 0 ? row.cpa.toFixed(2) : '',
        row.investimento > 0 ? row.roas.toFixed(2) : '',
        row.investimento > 0 ? row.leadsMidia : '',
        row.investimento > 0 ? row.impressoes : '',
        row.investimento > 0 ? row.ctr.toFixed(2) : '',
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'performance_canais.csv';
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

  // Render dash for N/A values
  const renderOrDash = (value: number | string, formatter: (v: number) => string, condition: boolean) => {
    if (!condition) return <span className="text-muted-foreground">—</span>;
    return formatter(value as number);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-lg border border-border bg-[hsl(215,35%,11%)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="p-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </motion.div>
    );
  }

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
      >
        <h3 className="text-base font-display font-semibold mb-4 text-foreground">Performance por Canal</h3>
        <p className="text-center text-muted-foreground text-sm py-8">Sem dados disponíveis</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-lg border border-border bg-[hsl(215,35%,11%)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-base font-display font-semibold text-foreground">Performance por Canal</h3>
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
              <SortHeader field="vendas">Vendas</SortHeader>
              <SortHeader field="receita">Receita</SortHeader>
              <SortHeader field="ticketMedio">Ticket Médio</SortHeader>
              <SortHeader field="investimento">Investimento</SortHeader>
              <TableHead className="text-xs font-medium uppercase tracking-wide">% Budget</TableHead>
              <SortHeader field="cpa">CPA</SortHeader>
              <SortHeader field="roas">ROAS</SortHeader>
              <SortHeader field="leadsMidia">Leads Mídia</SortHeader>
              <SortHeader field="impressoes">Impressões</SortHeader>
              <SortHeader field="ctr">CTR</SortHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row) => {
              const hasPaidMedia = row.investimento > 0;
              const budgetPercent = totals.investimento > 0 ? (row.investimento / totals.investimento) * 100 : 0;
              const roasColor = hasPaidMedia ? getROASColor(row.roas) : null;
              const cpaColor = hasPaidMedia ? getCPAColor(row.cpa) : null;

              return (
                <TableRow key={row.canal} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium max-w-[180px] truncate text-sm">{row.canal}</TableCell>
                  <TableCell className="text-sm font-medium">{formatNumber(row.vendas)}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(row.receita)}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(row.ticketMedio)}</TableCell>
                  <TableCell className="text-sm">
                    {renderOrDash(row.investimento, formatCurrency, hasPaidMedia)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {hasPaidMedia ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{formatPercent(budgetPercent)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className={cn(
                    "text-sm font-medium",
                    cpaColor === 'destructive' && 'text-destructive',
                    cpaColor === 'warning' && 'text-warning',
                    cpaColor === 'success' && 'text-success'
                  )}>
                    {renderOrDash(row.cpa, formatCurrency, hasPaidMedia)}
                  </TableCell>
                  <TableCell className={cn(
                    'text-sm font-medium',
                    roasColor === 'success' && 'text-success',
                    roasColor === 'destructive' && 'text-destructive'
                  )}>
                    {hasPaidMedia ? formatROAS(row.roas) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {renderOrDash(row.leadsMidia, formatNumber, hasPaidMedia)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {renderOrDash(row.impressoes, formatNumber, hasPaidMedia)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {renderOrDash(row.ctr, formatPercent, hasPaidMedia)}
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Totals Row */}
            <TableRow className="bg-[hsl(216,30%,14%)] font-semibold border-t-2 border-border">
              <TableCell className="text-sm">TOTAL</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.vendas)}</TableCell>
              <TableCell className="text-sm">{formatCurrency(totals.receita)}</TableCell>
              <TableCell className="text-sm">{formatCurrency(totalMetrics.ticketMedio)}</TableCell>
              <TableCell className="text-sm">{formatCurrency(totals.investimento)}</TableCell>
              <TableCell className="text-sm">100%</TableCell>
              <TableCell className="text-sm">{formatCurrency(totalMetrics.cpa)}</TableCell>
              <TableCell className="text-sm">{formatROAS(totalMetrics.roas)}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.leadsMidia)}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.impressoes)}</TableCell>
              <TableCell className="text-sm">{formatPercent(totalMetrics.ctr)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
