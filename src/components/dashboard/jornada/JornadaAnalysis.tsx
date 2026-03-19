import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Calendar, GitCompare } from 'lucide-react';
import { format, subMonths, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
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

type Granularity = 'monthly' | 'daily';
type CompareMode = 'none' | 'previous-period' | 'same-last-month';

export function JornadaAnalysis({ dateRange }: JornadaAnalysisProps) {
  const availableMonths = useMemo(() => getAvailableMonths(), []);
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    dateRange.from || availableMonths[0]?.value || new Date()
  );
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [compareMode, setCompareMode] = useState<CompareMode>('none');

  // Current data
  const currentDateOverride = useMemo<Date | undefined>(() => {
    if (granularity === 'daily' && selectedDay) {
      return new Date(selectedDay + 'T00:00:00');
    }
    return selectedMonth;
  }, [granularity, selectedDay, selectedMonth]);

  const currentDateRange = useMemo<DateRange>(() => {
    if (granularity === 'daily' && selectedDay) {
      const d = new Date(selectedDay + 'T00:00:00');
      return { from: startOfDay(d), to: endOfDay(d) };
    }
    return { from: startOfMonth(selectedMonth), to: endOfMonth(selectedMonth) };
  }, [granularity, selectedDay, selectedMonth]);

  const { channels, nodes, isLoading, hasData } = useJornadaData(currentDateOverride);

  // Comparison data
  const comparisonMonth = useMemo<Date | undefined>(() => {
    if (compareMode === 'none') return undefined;
    if (compareMode === 'previous-period') {
      if (granularity === 'daily' && selectedDay) {
        return subDays(new Date(selectedDay + 'T00:00:00'), 1);
      }
      return subMonths(selectedMonth, 1);
    }
    if (compareMode === 'same-last-month') {
      return subMonths(selectedMonth, 1);
    }
    return undefined;
  }, [compareMode, granularity, selectedDay, selectedMonth]);

  const { channels: compChannels, nodes: compNodes, isLoading: compLoading } = useJornadaData(
    comparisonMonth || new Date()
  );

  const showComparison = compareMode !== 'none' && !compLoading && compChannels.length > 0;

  // Generate available days for the selected month
  const availableDays = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const now = new Date();
    const days: { label: string; value: string }[] = [];
    let d = new Date(start);
    while (d <= end && d <= now) {
      days.push({
        label: format(d, 'dd/MM (EEE)', { locale: ptBR }),
        value: format(d, 'yyyy-MM-dd'),
      });
      d = new Date(d.getTime() + 86400000);
    }
    return days;
  }, [selectedMonth]);

  // Comparison label
  const comparisonLabel = useMemo(() => {
    if (compareMode === 'none') return '';
    if (compareMode === 'previous-period') {
      if (granularity === 'daily' && selectedDay) {
        return `vs dia anterior`;
      }
      return `vs ${format(subMonths(selectedMonth, 1), 'MMMM', { locale: ptBR })}`;
    }
    if (compareMode === 'same-last-month') {
      return `vs ${format(subMonths(selectedMonth, 1), 'MMMM', { locale: ptBR })}`;
    }
    return '';
  }, [compareMode, granularity, selectedDay, selectedMonth]);

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
        <FiltersRow
          granularity={granularity}
          onGranularityChange={setGranularity}
          availableMonths={availableMonths}
          selectedMonth={selectedMonth}
          onMonthSelect={setSelectedMonth}
          availableDays={availableDays}
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
          compareMode={compareMode}
          onCompareModeChange={setCompareMode}
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
            Nenhum dado encontrado para o período selecionado.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FiltersRow
        granularity={granularity}
        onGranularityChange={setGranularity}
        availableMonths={availableMonths}
        selectedMonth={selectedMonth}
        onMonthSelect={setSelectedMonth}
        availableDays={availableDays}
        selectedDay={selectedDay}
        onDaySelect={setSelectedDay}
        compareMode={compareMode}
        onCompareModeChange={setCompareMode}
      />

      {/* Comparison label */}
      {showComparison && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <GitCompare className="h-3.5 w-3.5" />
          <span>Comparando {comparisonLabel}</span>
          <span className="text-[10px]">(barras tracejadas = período comparado)</span>
        </div>
      )}

      {/* Node Matrix */}
      <JornadaNodeMatrix
        nodes={nodes}
        comparisonNodes={showComparison ? compNodes : undefined}
      />

      {/* Channel Tables */}
      {channels.map((channel, idx) => (
        <JornadaChannelTable
          key={channel.canal}
          channel={channel}
          comparisonChannel={showComparison ? compChannels[idx] : undefined}
          isDailyMode={granularity === 'daily' && !!selectedDay}
        />
      ))}

      {/* 5 Porquês Panel */}
      <CincoporquesPanel nodes={nodes} />
    </div>
  );
}

// Filters sub-component
function FiltersRow({
  granularity,
  onGranularityChange,
  availableMonths,
  selectedMonth,
  onMonthSelect,
  availableDays,
  selectedDay,
  onDaySelect,
  compareMode,
  onCompareModeChange,
}: {
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  availableMonths: { label: string; value: Date }[];
  selectedMonth: Date;
  onMonthSelect: (d: Date) => void;
  availableDays: { label: string; value: string }[];
  selectedDay: string;
  onDaySelect: (d: string) => void;
  compareMode: CompareMode;
  onCompareModeChange: (m: CompareMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Granularity toggle */}
      <div className="flex rounded-lg overflow-hidden border border-border">
        {(['monthly', 'daily'] as const).map(g => (
          <button
            key={g}
            onClick={() => {
              onGranularityChange(g);
              if (g === 'monthly') onDaySelect('');
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors',
              granularity === g
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            {g === 'monthly' ? 'Mensal' : 'Diário'}
          </button>
        ))}
      </div>

      {/* Month selector (always visible) */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1.5">
          {availableMonths.map(m => {
            const isActive =
              m.value.getMonth() === selectedMonth.getMonth() &&
              m.value.getFullYear() === selectedMonth.getFullYear();
            return (
              <button
                key={m.label}
                onClick={() => {
                  onMonthSelect(m.value);
                  onDaySelect('');
                }}
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

      {/* Day selector (only in daily mode) */}
      {granularity === 'daily' && (
        <select
          value={selectedDay}
          onChange={e => onDaySelect(e.target.value)}
          className="text-xs rounded-lg border border-border bg-card text-foreground px-3 py-1.5"
        >
          <option value="">Selecione o dia</option>
          {availableDays.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      )}

      {/* Comparison mode */}
      <div className="flex items-center gap-1.5 ml-auto">
        <GitCompare className="h-3.5 w-3.5 text-muted-foreground" />
        <select
          value={compareMode}
          onChange={e => onCompareModeChange(e.target.value as CompareMode)}
          className="text-xs rounded-lg border border-border bg-card text-foreground px-3 py-1.5"
        >
          <option value="none">Sem comparação</option>
          <option value="previous-period">vs Período anterior</option>
          <option value="same-last-month">vs Mesmo período mês passado</option>
        </select>
      </div>
    </div>
  );
}
