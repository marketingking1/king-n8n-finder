import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  return (
    <div className="flex flex-wrap items-center gap-4">
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
            <CalendarIcon className="mr-2 h-4 w-4" />
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
              <span>Selecionar período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
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

      {/* Granularity */}
      <Tabs 
        value={filters.granularity} 
        onValueChange={(v) => onGranularityChange(v as Granularity)}
      >
        <TabsList>
          <TabsTrigger value="day">Dia</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mês</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Multi-selects */}
      <MultiSelect
        options={filterOptions.campanhas}
        selected={filters.campanhas}
        onChange={onCampanhasChange}
        placeholder="Campanhas"
      />

      <MultiSelect
        options={filterOptions.grupos}
        selected={filters.grupos}
        onChange={onGruposChange}
        placeholder="Grupos"
      />

      <MultiSelect
        options={filterOptions.canais}
        selected={filters.canais}
        onChange={onCanaisChange}
        placeholder="Canais"
      />
    </div>
  );
}
