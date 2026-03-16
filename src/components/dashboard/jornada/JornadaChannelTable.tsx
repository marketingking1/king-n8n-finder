import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JORNADA_CHANNEL_COLORS, JORNADA_INDICATORS } from '@/hooks/useJornadaData';
import type { JornadaChannel, JornadaChannelWeek, JornadaIndicator } from '@/types/jornada';

interface JornadaChannelTableProps {
  channel: JornadaChannel;
}

function formatValue(value: number, format: JornadaIndicator['format']): string {
  switch (format) {
    case 'currency':
      return value >= 1000
        ? `R$ ${(value / 1000).toFixed(1)}k`
        : `R$ ${value.toFixed(2)}`;
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'number':
      return value >= 1000
        ? `${(value / 1000).toFixed(1)}k`
        : Math.round(value).toLocaleString('pt-BR');
    case 'decimal':
      return value.toFixed(2);
    default:
      return value.toString();
  }
}

function getCellColor(value: number, indicator: JornadaIndicator): string {
  if (value === 0) return 'text-muted-foreground';

  // Cost metrics: lower is better
  const costMetrics = ['cpm', 'custoClick', 'custoPorLead', 'cpmql', 'custoPorReuniao', 'cpa'];
  // Rate metrics: higher is better
  const rateMetrics = ['ctrLink', 'connectRate', 'taxaConversaoPagina', 'leadToMql', 'roas'];

  if (costMetrics.includes(indicator.key)) {
    return 'text-foreground'; // neutral for costs
  }
  if (rateMetrics.includes(indicator.key)) {
    return 'text-foreground';
  }
  return 'text-foreground';
}

export function JornadaChannelTable({ channel }: JornadaChannelTableProps) {
  const colors = JORNADA_CHANNEL_COLORS[channel.canal];

  const weekHeaders = useMemo(() => {
    return channel.semanas.map((_, idx) => `S${idx + 1}`);
  }, [channel.semanas]);

  return (
    <div className={cn('rounded-xl border overflow-hidden', colors.border)}>
      {/* Channel Header */}
      <div className={cn('px-4 py-3 font-display font-semibold text-sm', colors.bg, colors.text)}>
        {channel.canal}
      </div>

      <TooltipProvider delayDuration={200}>
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(216,30%,14%)] hover:bg-[hsl(216,30%,14%)]">
              <TableHead className="w-[180px] text-xs font-medium text-muted-foreground">
                Indicador
              </TableHead>
              {weekHeaders.map(h => (
                <TableHead key={h} className="text-center text-xs font-medium text-muted-foreground w-[100px]">
                  {h}
                </TableHead>
              ))}
              <TableHead className="text-center text-xs font-semibold text-foreground w-[110px] border-l border-border">
                Mês
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {JORNADA_INDICATORS.map((indicator, rowIdx) => (
              <TableRow
                key={indicator.key}
                className={cn(
                  'hover:bg-muted/30',
                  rowIdx % 2 === 0 ? 'bg-transparent' : 'bg-[hsl(216,30%,12%)]'
                )}
              >
                <TableCell className="text-xs font-medium text-muted-foreground py-2">
                  <div className="flex items-center gap-1.5">
                    <span>{indicator.label}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-[hsl(216,30%,14%)] border-border max-w-[250px]">
                        <p className="text-xs">{indicator.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
                {channel.semanas.map((semana, idx) => {
                  const value = semana[indicator.key] as number;
                  return (
                    <TableCell
                      key={idx}
                      className={cn(
                        'text-center text-xs py-2 tabular-nums',
                        getCellColor(value, indicator)
                      )}
                    >
                      {formatValue(value, indicator.format)}
                    </TableCell>
                  );
                })}
                <TableCell
                  className={cn(
                    'text-center text-xs font-semibold py-2 tabular-nums border-l border-border',
                    getCellColor(channel.mes[indicator.key] as number, indicator)
                  )}
                >
                  {formatValue(channel.mes[indicator.key] as number, indicator.format)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}
