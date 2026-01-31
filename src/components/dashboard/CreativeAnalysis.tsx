import { useState } from 'react';
import { VideoOff, AlertTriangle, RefreshCw, CalendarIcon } from 'lucide-react';
import { useFilteredCreativeData } from '@/hooks/useCreativeData';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CreativeKPICards,
  CreativeRetentionFunnel,
  CreativeTable,
  TopCreativesChart,
  HookRateVsCplChart,
} from '@/components/dashboard/creative';

interface CreativeAnalysisProps {
  dateRange?: { from?: Date; to?: Date };
}

export function CreativeAnalysis({ dateRange: initialDateRange }: CreativeAnalysisProps) {
  const queryClient = useQueryClient();
  
  // Local date range state
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>(
    initialDateRange || {}
  );
  
  const { rawData, aggregated, kpis, isLoading, error } = useFilteredCreativeData({ dateRange });

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['creative-sheets-data'] });
  };

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Erro ao carregar dados da planilha
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {error instanceof Error ? error.message : 'Erro desconhecido'}
        </p>
        <details className="text-xs text-muted-foreground mb-4">
          <summary className="cursor-pointer hover:text-foreground">
            Detalhes técnicos
          </summary>
          <pre className="mt-2 p-2 bg-muted/30 rounded text-left overflow-auto max-w-md">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
        <Button onClick={handleRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Empty state (after loading)
  if (!isLoading && (!rawData || rawData.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <VideoOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum criativo encontrado
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Não há dados de criativos de vídeo para os filtros selecionados
        </p>
        <p className="text-xs text-muted-foreground">
          Tente ajustar o período ou verifique se a planilha possui dados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border">
        <span className="text-sm font-medium text-muted-foreground">Período:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.from}
              onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground">até</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !dateRange.to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.to}
              onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
        {(dateRange.from || dateRange.to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateRange({})}
            className="text-muted-foreground hover:text-foreground"
          >
            Limpar
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <CreativeKPICards kpis={kpis} isLoading={isLoading} />

      {/* Funnel and Top Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreativeRetentionFunnel data={rawData} isLoading={isLoading} />
        <TopCreativesChart data={aggregated} isLoading={isLoading} />
      </div>

      {/* Scatter Plot */}
      <HookRateVsCplChart data={aggregated} isLoading={isLoading} />

      {/* Creative Table */}
      <CreativeTable data={aggregated} isLoading={isLoading} />
    </div>
  );
}
