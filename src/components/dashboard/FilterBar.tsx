import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FilterState, Granularity, DateRange } from '@/types/dashboard';
import { MultiSelect } from './MultiSelect';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filters: FilterState;
  filterOptions: {
    campanhas: string[];
    grupos: string[];
    canais: string[];
  };
  onDateRangeChange: (range: DateRange) => void;
  onGranularityChange: (granularity: Granularity) => void;
  onCampanhasChange: (campanhas: string[]) => void;
  onGruposChange: (grupos: string[]) => void;
  onCanaisChange: (canais: string[]) => void;
}

export function FilterBar({
  filters,
  filterOptions,
  onDateRangeChange,
  onGranularityChange,
  onCampanhasChange,
  onGruposChange,
  onCanaisChange,
}: FilterBarProps) {
  const granularityOptions: { value: Granularity; label: string }[] = [
    { value: 'day', label: 'Dia' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mês' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal min-w-[220px] border-border/50 hover:border-primary/50 hover:bg-primary/5",
              !filters.dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
            {filters.dateRange.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(filters.dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Select date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={filters.dateRange.from}
            selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
            onSelect={(range) => onDateRangeChange({ from: range?.from, to: range?.to })}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      {/* Multi-selects with improved styling */}
      <MultiSelect
        options={filterOptions.campanhas}
        selected={filters.campanhas}
        onChange={onCampanhasChange}
        placeholder="Campanha"
      />

      <MultiSelect
        options={filterOptions.grupos}
        selected={filters.grupos}
        onChange={onGruposChange}
        placeholder="Grupo de anúncio"
      />

      <MultiSelect
        options={filterOptions.canais}
        selected={filters.canais}
        onChange={onCanaisChange}
        placeholder="Canal"
      />
    </div>
  );
}