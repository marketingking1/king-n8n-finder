import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChannelLTVData } from '@/types/ltv';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ChannelLTVTableProps {
  data: ChannelLTVData[];
  isLoading?: boolean;
}

type SortField = 'canal' | 'alunos' | 'ticketMedio' | 'permanenciaMedia' | 'ltv' | 'churnPercent' | 'ativos';
type SortDirection = 'asc' | 'desc';

// Função para cor de heatmap
function getHeatmapColor(value: number, min: number, max: number, type: 'positive' | 'negative'): string {
  if (max === min) return 'transparent';
  const normalized = (value - min) / (max - min);
  
  if (type === 'positive') {
    return `hsla(142, 76%, 36%, ${0.1 + normalized * 0.4})`;
  } else {
    return `hsla(0, 84%, 60%, ${0.1 + normalized * 0.4})`;
  }
}

export function ChannelLTVTable({ data, isLoading }: ChannelLTVTableProps) {
  const [sortField, setSortField] = useState<SortField>('ltv');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      
      switch (sortField) {
        case 'canal':
          aVal = a.canal.toLowerCase();
          bVal = b.canal.toLowerCase();
          return sortDirection === 'asc' 
            ? (aVal as string).localeCompare(bVal as string)
            : (bVal as string).localeCompare(aVal as string);
        case 'alunos':
          aVal = a.alunos;
          bVal = b.alunos;
          break;
        case 'ticketMedio':
          aVal = a.ticketMedio;
          bVal = b.ticketMedio;
          break;
        case 'permanenciaMedia':
          aVal = a.permanenciaMedia;
          bVal = b.permanenciaMedia;
          break;
        case 'ltv':
          aVal = a.ltv;
          bVal = b.ltv;
          break;
        case 'churnPercent':
          aVal = a.churnPercent;
          bVal = b.churnPercent;
          break;
        case 'ativos':
          aVal = a.ativos;
          bVal = b.ativos;
          break;
      }
      
      const diff = (aVal as number) - (bVal as number);
      return sortDirection === 'asc' ? diff : -diff;
    });
  }, [data, sortField, sortDirection]);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Calcular totais
  const totals = useMemo(() => {
    const totalAlunos = data.reduce((sum, d) => sum + d.alunos, 0);
    const totalAtivos = data.reduce((sum, d) => sum + d.ativos, 0);
    const totalCancelados = totalAlunos - totalAtivos;
    const ticketMedio = data.reduce((sum, d) => sum + d.ticketMedio * d.alunos, 0) / totalAlunos || 0;
    const permanenciaMedia = data.reduce((sum, d) => sum + d.permanenciaMedia * d.alunos, 0) / totalAlunos || 0;
    const ltvMedio = ticketMedio * permanenciaMedia;
    const churnPercent = totalAlunos > 0 ? (totalCancelados / totalAlunos) * 100 : 0;
    
    return {
      alunos: totalAlunos,
      ticketMedio,
      permanenciaMedia,
      ltv: ltvMedio,
      churnPercent,
      ativos: totalAtivos,
    };
  }, [data]);
  
  // Calcular min/max para heatmap
  const ltvRange = useMemo(() => {
    const values = data.map(d => d.ltv);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [data]);
  
  const churnRange = useMemo(() => {
    const values = data.map(d => d.churnPercent);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [data]);
  
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }
  
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:text-foreground transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn(
          "h-3 w-3",
          sortField === field ? "text-primary" : "text-muted-foreground"
        )} />
      </div>
    </TableHead>
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.35 }}
      className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg"
    >
      <div className="mb-4">
        <h3 className="text-base font-display font-semibold text-foreground">
          LTV por Canal de Aquisição
        </h3>
        <p className="text-xs text-muted-foreground">
          Comparativo de performance entre canais
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <SortableHeader field="canal">Canal</SortableHeader>
              <SortableHeader field="alunos">Alunos</SortableHeader>
              <SortableHeader field="ticketMedio">Ticket Médio</SortableHeader>
              <SortableHeader field="permanenciaMedia">Permanência</SortableHeader>
              <SortableHeader field="ltv">LTV</SortableHeader>
              <SortableHeader field="churnPercent">Churn %</SortableHeader>
              <SortableHeader field="ativos">Ativos</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, index) => (
              <TableRow
                key={row.canal}
                className={cn(
                  "border-border",
                  index % 2 === 0 ? "bg-transparent" : "bg-[hsl(216,30%,12%)]"
                )}
              >
                <TableCell className="font-medium text-foreground">{row.canal}</TableCell>
                <TableCell>{formatNumber(row.alunos)}</TableCell>
                <TableCell>{formatCurrency(row.ticketMedio)}</TableCell>
                <TableCell>{row.permanenciaMedia.toFixed(1)} meses</TableCell>
                <TableCell
                  style={{ backgroundColor: getHeatmapColor(row.ltv, ltvRange.min, ltvRange.max, 'positive') }}
                >
                  <span className="font-semibold text-success">{formatCurrency(row.ltv)}</span>
                </TableCell>
                <TableCell
                  style={{ backgroundColor: getHeatmapColor(row.churnPercent, churnRange.min, churnRange.max, 'negative') }}
                >
                  <span className="text-destructive">{formatPercent(row.churnPercent)}</span>
                </TableCell>
                <TableCell>{formatNumber(row.ativos)}</TableCell>
              </TableRow>
            ))}
            
            {/* Linha de Total */}
            <TableRow className="border-t-2 border-border bg-[hsl(216,30%,14%)] font-semibold">
              <TableCell className="text-foreground">Total Geral</TableCell>
              <TableCell>{formatNumber(totals.alunos)}</TableCell>
              <TableCell>{formatCurrency(totals.ticketMedio)}</TableCell>
              <TableCell>{totals.permanenciaMedia.toFixed(1)} meses</TableCell>
              <TableCell>
                <span className="text-success">{formatCurrency(totals.ltv)}</span>
              </TableCell>
              <TableCell>
                <span className="text-destructive">{formatPercent(totals.churnPercent)}</span>
              </TableCell>
              <TableCell>{formatNumber(totals.ativos)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
