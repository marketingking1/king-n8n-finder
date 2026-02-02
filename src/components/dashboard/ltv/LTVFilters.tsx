import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MultiSelect } from '@/components/dashboard/MultiSelect';
import { cn } from '@/lib/utils';
import { LTVFiltersState } from '@/types/ltv';

interface LTVFiltersProps {
  filters: LTVFiltersState;
  availableChannels: string[];
  onDateRangeChange: (from: Date | undefined, to: Date | undefined) => void;
  onCanaisChange: (canais: string[]) => void;
  onStatusChange: (status: 'todos' | 'ativo' | 'cancelado' | 'pausado') => void;
  onReset: () => void;
}

const STATUS_OPTIONS: Array<{ value: 'todos' | 'ativo' | 'cancelado' | 'pausado'; label: string; color?: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativo', color: 'bg-success' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-destructive' },
  { value: 'pausado', label: 'Pausado', color: 'bg-warning' },
];

export function LTVFilters({
  filters,
  availableChannels,
  onDateRangeChange,
  onCanaisChange,
  onStatusChange,
  onReset,
}: LTVFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-border bg-[hsl(215,35%,11%)]">
      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal min-w-[240px]",
              !filters.dateRange.from && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {filters.dateRange.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                  {format(filters.dateRange.to, "dd/MM/yy", { locale: ptBR })}
                </>
              ) : (
                format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              "Período de matrícula"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
          <CalendarComponent
            mode="range"
            selected={{
              from: filters.dateRange.from,
              to: filters.dateRange.to,
            }}
            onSelect={(range) => onDateRangeChange(range?.from, range?.to)}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
      
      {/* Channel Multi-Select */}
      <div className="min-w-[200px]">
        <MultiSelect
          options={availableChannels}
          selected={filters.canais}
          onChange={onCanaisChange}
          placeholder="Canal de aquisição"
        />
      </div>
      
      {/* Status Toggle - 4 opções com indicador de cor */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2",
              filters.status === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {option.color && (
              <span className={cn("w-2 h-2 rounded-full", option.color)} />
            )}
            {option.label}
          </button>
        ))}
      </div>
      
      {/* Reset Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="text-muted-foreground hover:text-foreground"
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Limpar
      </Button>
    </div>
  );
}
