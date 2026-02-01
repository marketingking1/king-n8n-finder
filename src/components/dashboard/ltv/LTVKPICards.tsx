import { motion } from 'framer-motion';
import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  TrendingDown, 
  ShieldCheck, 
  Users 
} from 'lucide-react';
import { LTVMetrics } from '@/types/ltv';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LTVKPICardsProps {
  metrics: LTVMetrics;
  isLoading?: boolean;
}

interface KPICardData {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
}

export function LTVKPICards({ metrics, isLoading }: LTVKPICardsProps) {
  const cards: KPICardData[] = [
    {
      title: 'LTV Médio',
      value: formatCurrency(metrics.ltvMedio),
      subtitle: 'Receita média por aluno',
      icon: DollarSign,
      colorClass: 'text-success',
      bgClass: 'bg-success/10',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(metrics.ticketMedio),
      subtitle: 'Mensalidade média',
      icon: CreditCard,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10',
    },
    {
      title: 'Permanência Média',
      value: `${metrics.permanenciaMedia.toFixed(1)} meses`,
      subtitle: 'Tempo médio até churn',
      icon: Clock,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10',
    },
    {
      title: 'Taxa de Churn',
      value: formatPercent(metrics.taxaChurn),
      subtitle: '% de alunos que cancelaram',
      icon: TrendingDown,
      colorClass: 'text-destructive',
      bgClass: 'bg-destructive/10',
    },
    {
      title: 'Retenção Mês 3',
      value: formatPercent(metrics.retencaoMes3),
      subtitle: 'Sobrevivência ao 3º mês',
      icon: ShieldCheck,
      colorClass: 'text-success',
      bgClass: 'bg-success/10',
    },
    {
      title: 'Total de Alunos',
      value: formatNumber(metrics.totalAlunos),
      subtitle: `Ativos: ${formatNumber(metrics.alunosAtivos)} · Cancelados: ${formatNumber(metrics.alunosCancelados)}`,
      icon: Users,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10',
    },
  ];
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className={cn("rounded-lg p-2", card.bgClass)}>
                <Icon className={cn("h-5 w-5", card.colorClass)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium truncate">
                  {card.title}
                </p>
                <p className={cn("text-xl font-display font-bold mt-1", card.colorClass)}>
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {card.subtitle}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
