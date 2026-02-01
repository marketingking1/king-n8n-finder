import { useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Upload, X, RefreshCw } from 'lucide-react';
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
  onStatusChange: (status: 'todos' | 'ativos' | 'cancelados') => void;
  onReset: () => void;
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export function LTVFilters({
  filters,
  availableChannels,
  onDateRangeChange,
  onCanaisChange,
  onStatusChange,
  onReset,
  onUpload,
  isLoading,
}: LTVFiltersProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset input para permitir reupload do mesmo arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
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
      
      {/* Status Toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        {(['todos', 'ativos', 'cancelados'] as const).map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              filters.status === status
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
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
      
      <div className="flex-1" />
      
      {/* Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        variant="outline"
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        {isLoading ? 'Processando...' : 'Upload CSV'}
      </Button>
    </div>
  );
}
