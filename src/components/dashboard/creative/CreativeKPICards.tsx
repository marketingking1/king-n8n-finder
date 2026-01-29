import { CreativeAggregatedMetrics } from '@/types/creative';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { 
  Video, Eye, Play, Clock, Target, Users, DollarSign, 
  MousePointer, TrendingUp, Zap, BarChart3, Percent
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CreativeKPICardsProps {
  metrics: CreativeAggregatedMetrics;
  isLoading?: boolean;
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  colorType: 'positive' | 'negative' | 'neutral';
  tooltip: string;
  index: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.03,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

function KPICard({ title, value, icon, colorType, tooltip, index }: KPICardProps) {
  const getValueColor = () => {
    switch (colorType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          custom={index}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:border-primary/30 transition-all duration-200 cursor-help min-w-0"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-shrink-0 p-1.5 rounded-md bg-primary/10 text-primary">
              {icon}
            </div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
              {title}
            </p>
          </div>
          <p className={cn("text-lg font-display font-bold tracking-tight truncate", getValueColor())}>
            {value}
          </p>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function KPICardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-3 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-md bg-muted/30" />
        <div className="h-2.5 w-16 bg-muted/30 rounded" />
      </div>
      <div className="h-5 w-12 bg-muted/30 rounded" />
    </div>
  );
}

export function CreativeKPICards({ metrics, isLoading }: CreativeKPICardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Linha 1 - Vídeo */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Métricas de Vídeo</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[...Array(7)].map((_, i) => <KPICardSkeleton key={i} />)}
          </div>
        </div>
        {/* Linha 2 - Conversão e Volume */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Conversão e Volume</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <KPICardSkeleton key={i} />)}
          </div>
        </div>
        {/* Linha 3 - Custos e Taxas */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Custos e Taxas</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <KPICardSkeleton key={i} />)}
          </div>
        </div>
        {/* Linha 4 - Derivadas */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Métricas Calculadas</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <KPICardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Linha 1 - Métricas de Vídeo (7 cards) */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
          <Video className="h-3 w-3" />
          Métricas de Vídeo
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <KPICard
            title="Hook Rate"
            value={formatPercent(metrics.hook_rate_avg)}
            icon={<Play className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Porcentagem de pessoas que começam a assistir o vídeo. Quanto maior, melhor."
            index={0}
          />
          <KPICard
            title="Hold Rate 25%"
            value={formatPercent(metrics.hold_rate_25_avg)}
            icon={<Eye className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Porcentagem de pessoas que assistem até 25% do vídeo. Quanto maior, melhor."
            index={1}
          />
          <KPICard
            title="Completion Rate"
            value={formatPercent(metrics.completion_rate_avg)}
            icon={<Video className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Porcentagem de pessoas que assistem o vídeo completo. Quanto maior, melhor."
            index={2}
          />
          <KPICard
            title="Ret. 25→50%"
            value={formatPercent(metrics.retencao_25_50_avg)}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Retenção do 25% ao 50% do vídeo. Quanto maior, melhor."
            index={3}
          />
          <KPICard
            title="Ret. 50→75%"
            value={formatPercent(metrics.retencao_50_75_avg)}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Retenção do 50% ao 75% do vídeo. Quanto maior, melhor."
            index={4}
          />
          <KPICard
            title="Ret. 75→100%"
            value={formatPercent(metrics.retencao_75_100_avg)}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Retenção do 75% ao 100% do vídeo. Quanto maior, melhor."
            index={5}
          />
          <KPICard
            title="Tempo Médio"
            value={`${metrics.video_avg_time_avg.toFixed(1)}s`}
            icon={<Clock className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Tempo médio de visualização do vídeo em segundos. Quanto maior, melhor."
            index={6}
          />
        </div>
      </div>

      {/* Linha 2 - Conversão e Volume (4 cards) */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
          <Target className="h-3 w-3" />
          Conversão e Volume
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard
            title="Actions"
            value={formatNumber(metrics.actions_total)}
            icon={<MousePointer className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Total de ações/conversões realizadas. Quanto maior, melhor."
            index={7}
          />
          <KPICard
            title="Leads"
            value={formatNumber(metrics.leads_total)}
            icon={<Users className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Total de leads gerados. Quanto maior, melhor."
            index={8}
          />
          <KPICard
            title="Spend"
            value={formatCurrency(metrics.spend_total)}
            icon={<DollarSign className="h-3.5 w-3.5" />}
            colorType="negative"
            tooltip="Total investido em anúncios. Quanto menor para o mesmo resultado, melhor."
            index={9}
          />
          <KPICard
            title="Impressões"
            value={formatNumber(metrics.impressions_total)}
            icon={<Eye className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Total de impressões dos anúncios. Quanto maior, melhor."
            index={10}
          />
        </div>
      </div>

      {/* Linha 3 - Custos e Taxas (4 cards) */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
          <DollarSign className="h-3 w-3" />
          Custos e Taxas
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard
            title="CPM"
            value={formatCurrency(metrics.cpm_avg)}
            icon={<DollarSign className="h-3.5 w-3.5" />}
            colorType="negative"
            tooltip="Custo por mil impressões. Quanto menor, melhor."
            index={11}
          />
          <KPICard
            title="CTR"
            value={formatPercent(metrics.ctr_avg)}
            icon={<Percent className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Taxa de cliques. Quanto maior, melhor."
            index={12}
          />
          <KPICard
            title="CPC"
            value={formatCurrency(metrics.cpc_avg)}
            icon={<DollarSign className="h-3.5 w-3.5" />}
            colorType="negative"
            tooltip="Custo por clique. Quanto menor, melhor."
            index={13}
          />
          <KPICard
            title="CPL"
            value={formatCurrency(metrics.cpl_avg)}
            icon={<DollarSign className="h-3.5 w-3.5" />}
            colorType="negative"
            tooltip="Custo por lead. Quanto menor, melhor."
            index={14}
          />
        </div>
      </div>

      {/* Linha 4 - Métricas Derivadas (4 cards) */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
          <Zap className="h-3 w-3" />
          Métricas Calculadas
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard
            title="Taxa Conversão"
            value={formatPercent(metrics.taxa_conversao_avg)}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Taxa de conversão (Actions/Cliques). Quanto maior, melhor."
            index={15}
          />
          <KPICard
            title="Eficiência"
            value={formatPercent(metrics.eficiencia_avg)}
            icon={<Zap className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Eficiência (Actions/Impressões). Quanto maior, melhor."
            index={16}
          />
          <KPICard
            title="Video Score"
            value={metrics.video_score_avg.toFixed(1)}
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Score de engajamento de vídeo (0-100). Quanto maior, melhor."
            index={17}
          />
          <KPICard
            title="ROI Vídeo"
            value={metrics.roi_video_avg.toFixed(2)}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            colorType="positive"
            tooltip="Retorno sobre investimento em vídeo. Quanto maior, melhor."
            index={18}
          />
        </div>
      </div>
    </div>
  );
}
