import { useState, useCallback } from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JornadaNode } from '@/types/jornada';

interface CincoporquesPanelProps {
  nodes: JornadaNode[];
}

const GRADIENT_COLORS = [
  'border-red-500/50 bg-red-500/10',
  'border-orange-500/50 bg-orange-500/10',
  'border-amber-500/50 bg-amber-500/10',
  'border-yellow-500/50 bg-yellow-500/10',
  'border-emerald-500/50 bg-emerald-500/10',
];

export function CincoporquesPanel({ nodes }: CincoporquesPanelProps) {
  // Find the most critical node as default problem
  const criticalNode = nodes.find(n => n.status === 'critical')
    || nodes.find(n => n.status === 'warning');

  const defaultProblema = criticalNode
    ? `${criticalNode.label} está ${criticalNode.status === 'critical' ? 'crítico' : 'em alerta'}: ${criticalNode.formattedValue}`
    : '';

  const [problema, setProblema] = useState(defaultProblema);
  const [porques, setPorques] = useState<string[]>(['', '', '', '', '']);

  const handlePorqueChange = useCallback((index: number, value: string) => {
    setPorques(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  return (
    <div className="rounded-xl border border-border bg-[hsl(215,35%,11%)] p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-display font-semibold text-foreground">
          Método 5 Porquês — Root Cause Analysis
        </h3>
      </div>

      <div className="flex items-start gap-2 overflow-x-auto pb-2">
        {/* Problem box */}
        <div className="flex-shrink-0 w-[200px]">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
            Problema Inicial
          </label>
          <textarea
            value={problema}
            onChange={e => setProblema(e.target.value)}
            placeholder="Descreva o problema..."
            className={cn(
              'w-full h-[80px] rounded-lg border px-3 py-2 text-xs resize-none',
              'bg-red-500/5 border-red-500/30 text-foreground',
              'placeholder:text-muted-foreground/50',
              'focus:outline-none focus:ring-1 focus:ring-red-500/50'
            )}
          />
        </div>

        {/* 5 Porquês */}
        {porques.map((porque, idx) => (
          <div key={idx} className="flex items-center gap-2 flex-shrink-0">
            <ArrowRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-6" />
            <div className="w-[180px]">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
                Por quê #{idx + 1}
              </label>
              <textarea
                value={porque}
                onChange={e => handlePorqueChange(idx, e.target.value)}
                placeholder={`Por quê ${idx === 0 ? 'isso acontece?' : 'isso?'}`}
                className={cn(
                  'w-full h-[80px] rounded-lg border px-3 py-2 text-xs resize-none',
                  GRADIENT_COLORS[idx],
                  'text-foreground placeholder:text-muted-foreground/50',
                  'focus:outline-none focus:ring-1 focus:ring-primary/50'
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/60 mt-3">
        Preencha sequencialmente para identificar a causa raiz do problema. O 5o "por quê" geralmente revela a causa fundamental.
      </p>
    </div>
  );
}
