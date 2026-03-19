import { VideoOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useFilteredCreativeData } from '@/hooks/useCreativeData';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import {
  CreativeKPICards,
  CreativeRetentionFunnel,
  CreativeTable,
  TopCreativesChart,
  HookRateVsCplChart,
} from '@/components/dashboard/creative';

interface CreativeAnalysisProps {
  dateRange?: { from?: Date; to?: Date };
  campanhas?: string[];
}

export function CreativeAnalysis({ dateRange, campanhas = [] }: CreativeAnalysisProps) {
  const queryClient = useQueryClient();
  
  const { rawData, aggregated, kpis, isLoading, error } = useFilteredCreativeData({ 
    dateRange,
    campanhas: campanhas.length > 0 ? campanhas : undefined,
  });

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
