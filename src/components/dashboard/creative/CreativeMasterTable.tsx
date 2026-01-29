import { useState, useMemo } from 'react';
import { CreativeMetrics } from '@/types/creative';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';

interface CreativeMasterTableProps {
  data: CreativeMetrics[];
  isLoading?: boolean;
}

type SortField = keyof CreativeMetrics;
type SortDirection = 'asc' | 'desc';

const columns: { key: SortField; label: string; format: (v: number | string) => string; width: string }[] = [
  { key: 'ads', label: 'Criativo', format: (v) => String(v), width: 'min-w-[200px]' },
  { key: 'hook_rate', label: 'Hook Rate', format: (v) => formatPercent(Number(v)), width: 'min-w-[100px]' },
  { key: 'hold_rate_25', label: 'Hold 25%', format: (v) => formatPercent(Number(v)), width: 'min-w-[100px]' },
  { key: 'completion_rate', label: 'Completion', format: (v) => formatPercent(Number(v)), width: 'min-w-[100px]' },
  { key: 'retencao_25_50', label: 'Ret 25→50', format: (v) => formatPercent(Number(v)), width: 'min-w-[100px]' },
  { key: 'retencao_50_75', label: 'Ret 50→75', format: (v) => formatPercent(Number(v)), width: 'min-w-[100px]' },
  { key: 'retencao_75_100', label: 'Ret 75→100', format: (v) => formatPercent(Number(v)), width: 'min-w-[100px]' },
  { key: 'video_avg_time', label: 'Tempo Médio', format: (v) => `${Number(v).toFixed(1)}s`, width: 'min-w-[100px]' },
  { key: 'actions', label: 'Actions', format: (v) => formatNumber(Number(v)), width: 'min-w-[90px]' },
  { key: 'leads', label: 'Leads', format: (v) => formatNumber(Number(v)), width: 'min-w-[80px]' },
  { key: 'spend', label: 'Spend', format: (v) => formatCurrency(Number(v)), width: 'min-w-[100px]' },
  { key: 'impressions', label: 'Impressões', format: (v) => formatNumber(Number(v)), width: 'min-w-[100px]' },
  { key: 'cpm', label: 'CPM', format: (v) => formatCurrency(Number(v)), width: 'min-w-[90px]' },
  { key: 'ctr', label: 'CTR', format: (v) => formatPercent(Number(v)), width: 'min-w-[80px]' },
  { key: 'cpc', label: 'CPC', format: (v) => formatCurrency(Number(v)), width: 'min-w-[90px]' },
  { key: 'cpl', label: 'CPL', format: (v) => formatCurrency(Number(v)), width: 'min-w-[90px]' },
  { key: 'taxa_conversao', label: 'Taxa Conv.', format: (v) => formatPercent(Number(v)), width: 'min-w-[100px]' },
  { key: 'eficiencia', label: 'Eficiência', format: (v) => formatPercent(Number(v)), width: 'min-w-[100px]' },
  { key: 'video_score', label: 'Video Score', format: (v) => Number(v).toFixed(1), width: 'min-w-[100px]' },
];

// Calcular quartis para coloração
function getQuartile(value: number, allValues: number[], inverse: boolean = false): 'top' | 'mid' | 'bottom' {
  const sorted = [...allValues].sort((a, b) => a - b);
  const q25 = sorted[Math.floor(sorted.length * 0.25)];
  const q75 = sorted[Math.floor(sorted.length * 0.75)];

  if (inverse) {
    if (value <= q25) return 'top';
    if (value >= q75) return 'bottom';
    return 'mid';
  }
  
  if (value >= q75) return 'top';
  if (value <= q25) return 'bottom';
  return 'mid';
}

function getQuartileColor(quartile: 'top' | 'mid' | 'bottom'): string {
  switch (quartile) {
    case 'top': return 'bg-success/10 text-success';
    case 'bottom': return 'bg-destructive/10 text-destructive';
    default: return '';
  }
}

// Campos onde menor é melhor
const inverseFields: SortField[] = ['spend', 'cpm', 'cpc', 'cpl'];

export function CreativeMasterTable({ data, isLoading }: CreativeMasterTableProps) {
  const [sortField, setSortField] = useState<SortField>('video_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [data, sortField, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page]);

  // Calcular valores para quartis
  const quartileValues = useMemo(() => {
    const values: Record<string, number[]> = {};
    columns.forEach(col => {
      if (col.key !== 'ads') {
        values[col.key] = data.map(row => Number(row[col.key]) || 0);
      }
    });
    return values;
  }, [data]);

  const exportToCSV = () => {
    const headers = columns.map(c => c.label).join(',');
    const rows = sortedData.map(row => 
      columns.map(col => {
        const val = row[col.key];
        return typeof val === 'string' ? `"${val}"` : val;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `criativos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(sortedData.length / pageSize);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="h-[400px] animate-pulse bg-muted/20 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-lg border border-border bg-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Tabela de Criativos</h3>
          <p className="text-sm text-muted-foreground">{data.length} criativos • 19 métricas</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Table */}
      <ScrollArea className="h-[500px]">
        <div className="min-w-max">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                {columns.map(col => (
                  <TableHead 
                    key={col.key}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      col.width,
                      col.key === 'ads' && "sticky left-0 bg-card z-20"
                    )}
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="truncate">{col.label}</span>
                      {sortField === col.key ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3 flex-shrink-0" />
                        ) : (
                          <ArrowDown className="h-3 w-3 flex-shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 flex-shrink-0 opacity-40" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, i) => (
                <TableRow key={row.ads + i} className="hover:bg-muted/30">
                  {columns.map(col => {
                    const value = row[col.key];
                    const isNumeric = col.key !== 'ads';
                    const quartile = isNumeric 
                      ? getQuartile(Number(value), quartileValues[col.key] || [], inverseFields.includes(col.key))
                      : 'mid';
                    
                    return (
                      <TableCell 
                        key={col.key}
                        className={cn(
                          col.width,
                          col.key === 'ads' && "sticky left-0 bg-card font-medium",
                          isNumeric && getQuartileColor(quartile)
                        )}
                      >
                        <span className="truncate block">
                          {col.format(value)}
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sortedData.length)} de {sortedData.length}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Anterior
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
