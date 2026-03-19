import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, startOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns';
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

interface DatePreset {
  label: string;
  getRange: () => DateRange;
}

function getDatePresets(): DatePreset[] {
  const today = new Date();
  return [
    {
      label: 'Hoje',
      getRange: () => ({ from: startOfDay(today), to: endOfDay(today) }),
    },
    {
      label: 'Ontem',
      getRange: () => {
        const yesterday = subDays(today, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      },
    },
    {
      label: 'Últimos 7 dias',
      getRange: () => ({ from: startOfDay(subDays(today, 6)), to: endOfDay(today) }),
    },
    {
      label: 'Esta semana',
      getRange: () => ({
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: endOfDay(today),
      }),
    },
    {
      label: 'Semana passada',
      getRange: () => {
        const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        return { from: lastWeekStart, to: endOfWeek(lastWeekStart, { weekStartsOn: 1 }) };
      },
    },
    {
      label: 'Este mês',
      getRange: () => ({ from: startOfMonth(today), to: endOfDay(today) }),
    },
    {
      label: 'Mês passado',
      getRange: () => {
        const prevMonth = subMonths(today, 1);
        return {
          from: startOfMonth(prevMonth),
          to: new Date(today.getFullYear(), today.getMonth(), 0), // last day of prev month
        };
      },
    },
  ];
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
  const [open, setOpen] = useState(false);
  const presets = getDatePresets();

  const granularityOptions: { value: Granularity; label: string }[] = [
    { value: 'day', label: 'Dia' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mês' },
  ];

  const handlePreset = (preset: DatePreset) => {
    onDateRangeChange(preset.getRange());
    setOpen(false);
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    onDateRangeChange({ from: range?.from, to: range?.to });
    // Auto-close when both dates are selected
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  // Detect which preset is active
  const activePresetLabel = (() => {
    if (!filters.dateRange.from || !filters.dateRange.to) return null;
    const from = startOfDay(filters.dateRange.from);
    const to = startOfDay(filters.dateRange.to);
    for (const p of presets) {
      const r = p.getRange();
      if (r.from && r.to && startOfDay(r.from).getTime() === from.getTime() && startOfDay(r.to).getTime() === to.getTime()) {
        return p.label;
      }
    }
    return null;
  })();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Range Picker with Presets */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal min-w-[220px] border-border/50 hover:border-primary/50 hover:bg-primary/5",
              !filters.dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
            {activePresetLabel ? (
              <span>
                <span className="font-medium text-primary">{activePresetLabel}</span>
                <span className="text-muted-foreground ml-1.5 text-xs">
                  ({format(filters.dateRange.from!, "dd/MM", { locale: ptBR })} - {format(filters.dateRange.to!, "dd/MM", { locale: ptBR })})
                </span>
              </span>
            ) : filters.dateRange.from ? (
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
        <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
          <div className="flex">
            {/* Presets sidebar */}
            <div className="flex flex-col border-r border-border p-2 min-w-[140px]">
              <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Atalhos</p>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset)}
                  className={cn(
                    "text-left text-sm px-3 py-1.5 rounded-md transition-colors",
                    activePresetLabel === preset.label
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-foreground hover:bg-muted/50"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {/* Calendar */}
            <div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange.from}
                selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                onSelect={handleCalendarSelect}
                numberOfMonths={2}
                locale={ptBR}
              />
            </div>
          </div>
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