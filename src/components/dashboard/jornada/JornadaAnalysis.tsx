import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useJornadaData, getAvailableMonths } from '@/hooks/useJornadaData';
import { JornadaNodeMatrix } from './JornadaNodeMatrix';
import { JornadaChannelTable } from './JornadaChannelTable';
import { CincoporquesPanel } from './CincoporquesPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DateRange } from '@/types/dashboard';

interface JornadaAnalysisProps {
  dateRange: DateRange;
}

export function JornadaAnalysis({ dateRange }: JornadaAnalysisProps) {
  const availableMonths = useMemo(() => getAvailableMonths(), []);
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    dateRange.from || availableMonths[0]?.value || new Date()
  );

  const { channels, nodes, isLoading, hasData } = useJornadaData(selectedMonth);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[140px] w-full rounded-xl" />
      </div>
    );
  }

  // Error / empty state
  if (!hasData) {
    return (
      <div className="space-y-6">
        {/* Month selector even on empty */}
        <MonthSelector
          months={availableMonths}
          selected={selectedMonth}
          onSelect={setSelectedMonth}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 px-4"
        >
          <div className="rounded-full bg-primary/10 p-6 mb-6">
            <FileSpreadsheet className="h-16 w-16 text-primary" />
          </div>
          <h3 className="text-xl font-display font-semibold text-foreground mb-2">
            Nós da Jornada
          </h3>
          <p className="text-muted-foreground text-center max-w-md">
            Nenhum dado encontrado para {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <MonthSelector
        months={availableMonths}
        selected={selectedMonth}
        onSelect={setSelectedMonth}
      />

      {/* Node Matrix */}
      <JornadaNodeMatrix nodes={nodes} />

      {/* Channel Tables */}
      {channels.map(channel => (
        <JornadaChannelTable key={channel.canal} channel={channel} />
      ))}

      {/* 5 Porquês Panel */}
      <CincoporquesPanel nodes={nodes} />
    </div>
  );
}

// Month selector sub-component
function MonthSelector({
  months,
  selected,
  onSelect,
}: {
  months: { label: string; value: Date }[];
  selected: Date;
  onSelect: (d: Date) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1.5">
        {months.map(m => {
          const isActive =
            m.value.getMonth() === selected.getMonth() &&
            m.value.getFullYear() === selected.getFullYear();
          return (
            <button
              key={m.label}
              onClick={() => onSelect(m.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
