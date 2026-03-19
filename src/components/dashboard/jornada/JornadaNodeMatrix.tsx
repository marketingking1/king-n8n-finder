import { ArrowRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { JornadaNode, NodeStatus } from '@/types/jornada';

interface JornadaNodeMatrixProps {
  nodes: JornadaNode[];
}

const STATUS_STYLES: Record<NodeStatus, { bg: string; border: string; text: string; dot: string }> = {
  ok: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    dot: 'bg-red-400',
  },
};

export function JornadaNodeMatrix({ nodes }: JornadaNodeMatrixProps) {
  if (nodes.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-foreground">
          Funil de Formulário Nativo
        </h3>
        <span className="text-[10px] text-muted-foreground/60">
          Investimento → CPM → CTR → Lead (form nativo) → MQL → Venda
        </span>
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {nodes.map((node, idx) => {
            const style = STATUS_STYLES[node.status];
            return (
              <div key={node.key} className="flex items-center gap-2 flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex flex-col items-center justify-center rounded-lg border px-4 py-3 min-w-[120px] cursor-default transition-colors',
                        style.bg,
                        style.border
                      )}
                    >
                      {/* Status dot */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={cn('w-2 h-2 rounded-full', style.dot)} />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          {node.status}
                        </span>
                      </div>
                      {/* Value */}
                      <span className={cn('text-lg font-display font-bold tabular-nums', style.text)}>
                        {node.formattedValue}
                      </span>
                      {/* Label */}
                      <span className="text-[11px] text-muted-foreground mt-0.5 text-center">
                        {node.label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-[hsl(216,30%,14%)] border-border max-w-[280px]"
                  >
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium">{node.tooltip}</p>
                      {node.acoes.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                            Ações sugeridas:
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {node.acoes.map((acao, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-muted-foreground/50">-</span>
                                {acao}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Arrow between nodes */}
                {idx < nodes.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
