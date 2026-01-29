import { useMemo } from 'react';
import { useFilteredCreativeData, useCreativeFilters } from '@/hooks/useCreativeData';
import { CreativeKPICards } from './CreativeKPICards';
import { CreativeMasterTable } from './CreativeMasterTable';
import { motion } from 'framer-motion';
import { Video, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function CreativeAnalysisSection() {
  const { filters } = useCreativeFilters();
  const { data, aggregatedMetrics, filterOptions, isLoading, error, refetch } = useFilteredCreativeData(filters);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">Erro ao carregar dados de criativos</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Não foi possível conectar à planilha de dados de vídeo. Verifique se a planilha está acessível.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Análise de Criativos</h2>
            <p className="text-sm text-muted-foreground">
              Performance de criativos com todas as 19 métricas de vídeo, conversão e custo
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <CreativeKPICards metrics={aggregatedMetrics} isLoading={isLoading} />

      {/* Master Table */}
      <CreativeMasterTable data={data} isLoading={isLoading} />
    </motion.section>
  );
}
