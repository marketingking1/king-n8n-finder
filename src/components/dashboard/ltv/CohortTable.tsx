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
import { CohortData } from '@/types/ltv';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CohortTableProps {
  data: CohortData[];
  isLoading?: boolean;
}

type SortField = 'cohort' | 'alunos' | 'ticketMedio' | 'permanenciaMedia' | 'taxaChurn' | 'taxaRetencao' | 'ltv';
type SortDirection = 'asc' | 'desc';

// Função para cor de heatmap
function getHeatmapColor(value: number, min: number, max: number, type: 'positive' | 'negative'): string {
  if (max === min) return 'transparent';
  const normalized = (value - min) / (max - min);
  
  if (type === 'positive') {
    // Verde: mais alto = mais intenso
    return `hsla(142, 76%, 36%, ${0.1 + normalized * 0.4})`;
  } else {
    // Vermelho: mais alto = mais intenso
    return `hsla(0, 84%, 60%, ${0.1 + normalized * 0.4})`;
  }
}

export function CohortTable({ data, isLoading }: CohortTableProps) {
  const [sortField, setSortField] = useState<SortField>('cohort');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aVal: number | Date = 0;
      let bVal: number | Date = 0;
      
      switch (sortField) {
        case 'cohort':
          aVal = a.cohortDate.getTime();
          bVal = b.cohortDate.getTime();
          break;
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
        case 'taxaChurn':
          aVal = a.taxaChurn;
          bVal = b.taxaChurn;
          break;
        case 'taxaRetencao':
          aVal = a.taxaRetencao;
          bVal = b.taxaRetencao;
          break;
        case 'ltv':
          aVal = a.ltv;
          bVal = b.ltv;
          break;
      }
      
      const diff = typeof aVal === 'number' ? aVal - (bVal as number) : 0;
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
  
  // Calcular min/max para heatmap
  const ltvRange = useMemo(() => {
    const values = data.map(d => d.ltv);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [data]);
  
  const churnRange = useMemo(() => {
    const values = data.map(d => d.taxaChurn);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [data]);
  
  const retencaoRange = useMemo(() => {
    const values = data.map(d => d.taxaRetencao);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [data]);
  
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[400px]" />
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
      transition={{ duration: 0.3, delay: 0.3 }}
      className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-6 shadow-lg"
    >
      <div className="mb-4">
        <h3 className="text-base font-display font-semibold text-foreground">
          Análise de Cohort
        </h3>
        <p className="text-xs text-muted-foreground">
          Performance por mês de matrícula
        </p>
      </div>
      
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-[hsl(215,35%,11%)] z-10">
            <TableRow className="border-border hover:bg-transparent">
              <SortableHeader field="cohort">Cohort</SortableHeader>
              <SortableHeader field="alunos">Alunos</SortableHeader>
              <SortableHeader field="ticketMedio">Ticket Médio</SortableHeader>
              <SortableHeader field="permanenciaMedia">Permanência</SortableHeader>
              <SortableHeader field="taxaChurn">Churn %</SortableHeader>
              <SortableHeader field="taxaRetencao">Retenção %</SortableHeader>
              <SortableHeader field="ltv">LTV</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, index) => (
              <TableRow
                key={row.cohort}
                className={cn(
                  "border-border",
                  index % 2 === 0 ? "bg-transparent" : "bg-[hsl(216,30%,12%)]"
                )}
              >
                <TableCell className="font-medium text-foreground">{row.cohort}</TableCell>
                <TableCell>{formatNumber(row.alunos)}</TableCell>
                <TableCell>{formatCurrency(row.ticketMedio)}</TableCell>
                <TableCell>{row.permanenciaMedia.toFixed(1)} meses</TableCell>
                <TableCell
                  style={{ backgroundColor: getHeatmapColor(row.taxaChurn, churnRange.min, churnRange.max, 'negative') }}
                >
                  <span className="text-destructive">{formatPercent(row.taxaChurn)}</span>
                </TableCell>
                <TableCell
                  style={{ backgroundColor: getHeatmapColor(row.taxaRetencao, retencaoRange.min, retencaoRange.max, 'positive') }}
                >
                  <span className="text-success">{formatPercent(row.taxaRetencao)}</span>
                </TableCell>
                <TableCell
                  style={{ backgroundColor: getHeatmapColor(row.ltv, ltvRange.min, ltvRange.max, 'positive') }}
                >
                  <span className="font-semibold text-success">{formatCurrency(row.ltv)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
