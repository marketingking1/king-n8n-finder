import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AggregatedCreative } from '@/types/creative';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download } from 'lucide-react';

interface CreativeTableProps {
  data: AggregatedCreative[];
  isLoading: boolean;
}

type SortKey = keyof AggregatedCreative;
type SortDirection = 'asc' | 'desc';

const getHookRateColor = (value: number) => {
  if (value >= 25) return 'text-success';
  if (value >= 15) return 'text-warning';
  return 'text-destructive';
};

const getHoldRateColor = (value: number) => {
  if (value >= 30) return 'text-success';
  if (value >= 20) return 'text-warning';
  return 'text-destructive';
};

const getCplColor = (value: number) => {
  if (value === 0) return 'text-muted-foreground';
  if (value <= 10) return 'text-success';
  if (value <= 20) return 'text-warning';
  return 'text-destructive';
};

const ProgressBar = ({ value, max = 100, color }: { value: number; max?: number; color: string }) => (
  <div className="flex items-center gap-2 min-w-0">
    <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden min-w-[60px]">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.min((value / max) * 100, 100)}%`,
          backgroundColor: color,
        }}
      />
    </div>
    <span className={cn("text-xs font-medium w-12 text-right", `text-[${color}]`)}>
      {value.toFixed(1)}%
    </span>
  </div>
);

export function CreativeTable({ data, isLoading }: CreativeTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalSpend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = data.filter(
        (item) =>
          item.displayName.toLowerCase().includes(query) ||
          item.ads.toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [data, sortKey, sortDirection, searchQuery]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  const exportToCSV = () => {
    const headers = [
      'Criativo',
      'Campanha',
      'Dias Ativos',
      'Investimento',
      'Impressões',
      'Hook Rate',
      'Hold Rate',
      'Completion Rate',
      'Watch Time',
      'CTR',
      'Leads',
      'CPL',
      'CPM',
      'MQL',
      'Call Realizada',
      'Vendas',
      'CPA',
    ];

    const rows = filteredAndSortedData.map((item) => [
      item.displayName,
      item.campanhas.join('; '),
      item.totalDays,
      item.totalSpend.toFixed(2),
      item.totalImpressions,
      item.avgHookRate.toFixed(2),
      item.avgHoldRate.toFixed(2),
      item.avgCompletionRate.toFixed(2),
      item.avgWatchTime.toFixed(0),
      item.avgCtr.toFixed(2),
      item.totalLeads,
      item.avgCpl.toFixed(2),
      item.avgCpm.toFixed(2),
      item.mql,
      item.callRealizada,
      item.vendas,
      item.vendas > 0 ? item.cpa.toFixed(2) : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `criativos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-base lg:text-lg font-display">
            Tabela de Criativos
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar criativo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 bg-card z-10 min-w-[180px]">
                  <button
                    onClick={() => handleSort('displayName')}
                    className="flex items-center text-xs font-medium"
                  >
                    Criativo
                    <SortIcon columnKey="displayName" />
                  </button>
                </TableHead>
                <TableHead className="min-w-[120px]">Campanha</TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('totalDays')}
                    className="flex items-center justify-end text-xs font-medium ml-auto"
                  >
                    Dias
                    <SortIcon columnKey="totalDays" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('totalSpend')}
                    className="flex items-center justify-end text-xs font-medium ml-auto"
                  >
                    Investimento
                    <SortIcon columnKey="totalSpend" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('totalImpressions')}
                    className="flex items-center justify-end text-xs font-medium ml-auto"
                  >
                    Impressões
                    <SortIcon columnKey="totalImpressions" />
                  </button>
                </TableHead>
                <TableHead className="min-w-[140px]">
                  <button
                    onClick={() => handleSort('avgHookRate')}
                    className="flex items-center text-xs font-medium"
                  >
                    Hook Rate
                    <SortIcon columnKey="avgHookRate" />
                  </button>
                </TableHead>
                <TableHead className="min-w-[140px]">
                  <button
                    onClick={() => handleSort('avgHoldRate')}
                    className="flex items-center text-xs font-medium"
                  >
                    Hold Rate
                    <SortIcon columnKey="avgHoldRate" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('avgCompletionRate')}
                    className="flex items-center justify-end text-xs font-medium ml-auto"
                  >
                    Completion
                    <SortIcon columnKey="avgCompletionRate" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('avgWatchTime')}
                    className="flex items-center justify-end text-xs font-medium ml-auto"
                  >
                    Watch Time
                    <SortIcon columnKey="avgWatchTime" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('totalLeads')}
                    className="flex items-center justify-end text-xs font-medium ml-auto"
                  >
                    Leads
                    <SortIcon columnKey="totalLeads" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('avgCpl')}
                    className="flex items-center justify-end text-xs font-medium ml-auto"
                  >
                    CPL
                    <SortIcon columnKey="avgCpl" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('mql')}
                    className="flex items-center justify-end text-xs font-medium ml-auto"
                  >
                    MQL
                    <SortIcon columnKey="mql" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('callRealizada')}
                    className="flex items-center justify-end text-xs font-medium ml-auto"
                  >
                    Call Real.
                    <SortIcon columnKey="callRealizada" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('vendas')}
                    className="flex items-center justify-end text-xs font-medium ml-auto"
                  >
                    Vendas
                    <SortIcon columnKey="vendas" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('cpa')}
                    className="flex items-center justify-end text-xs font-medium ml-auto"
                  >
                    CPA
                    <SortIcon columnKey="cpa" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                    Nenhum criativo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedData.map((item) => (
                  <TableRow key={item.ads} className="hover:bg-muted/30">
                    <TableCell className="sticky left-0 bg-card z-10 font-medium text-sm">
                      <span className="line-clamp-2">{item.displayName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.campanhas.map((camp) => (
                          <Badge
                            key={camp}
                            variant="outline"
                            className="text-[10px] truncate max-w-[100px]"
                          >
                            {camp.split('_').slice(0, 2).join(' ')}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">{item.totalDays}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(item.totalSpend)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatNumber(item.totalImpressions)}
                    </TableCell>
                    <TableCell>
                      <ProgressBar
                        value={item.avgHookRate}
                        max={50}
                        color={item.avgHookRate >= 25 ? '#10B981' : item.avgHookRate >= 15 ? '#F59E0B' : '#EF4444'}
                      />
                    </TableCell>
                    <TableCell>
                      <ProgressBar
                        value={item.avgHoldRate}
                        max={50}
                        color={item.avgHoldRate >= 30 ? '#10B981' : item.avgHoldRate >= 20 ? '#F59E0B' : '#EF4444'}
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatPercent(item.avgCompletionRate)}
                    </TableCell>
                    <TableCell className="text-right text-sm">{item.avgWatchTime.toFixed(0)}s</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatNumber(item.totalLeads)}
                    </TableCell>
                    <TableCell className={cn('text-right text-sm font-medium', getCplColor(item.avgCpl))}>
                      {item.totalLeads > 0 ? formatCurrency(item.avgCpl) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {item.mql > 0 ? formatNumber(item.mql) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {item.callRealizada > 0 ? formatNumber(item.callRealizada) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-emerald-400">
                      {item.vendas > 0 ? formatNumber(item.vendas) : '-'}
                    </TableCell>
                    <TableCell className={cn('text-right text-sm font-medium', item.cpa === 0 ? 'text-muted-foreground' : item.cpa <= 500 ? 'text-success' : item.cpa <= 800 ? 'text-warning' : 'text-destructive')}>
                      {item.vendas > 0 ? formatCurrency(item.cpa) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
