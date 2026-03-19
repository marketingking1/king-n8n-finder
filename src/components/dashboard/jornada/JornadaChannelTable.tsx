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
import { JORNADA_CHANNEL_COLORS, getIndicatorsForChannel } from '@/hooks/useJornadaData';
import type { JornadaChannel, JornadaIndicator } from '@/types/jornada';

interface JornadaChannelTableProps {
  channel: JornadaChannel;
  comparisonChannel?: JornadaChannel;
  isDailyMode?: boolean;
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

function getCellColor(value: number): string {
  if (value === 0) return 'text-muted-foreground';
  return 'text-foreground';
}

function DeltaBadge({ current, comparison, format: fmt }: { current: number; comparison: number; format: JornadaIndicator['format'] }) {
  if (comparison === 0 && current === 0) return null;
  const isRate = fmt === 'percent' || fmt === 'decimal';
  let delta: number;
  let label: string;
  if (isRate) {
    delta = current - comparison;
    label = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pp`;
  } else {
    delta = comparison !== 0 ? ((current - comparison) / comparison) * 100 : 0;
    label = `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%`;
  }
  if (delta === 0) return null;
  return (
    <span className={`text-[9px] font-medium ml-1 ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {label}
    </span>
  );
}

export function JornadaChannelTable({ channel, comparisonChannel, isDailyMode }: JornadaChannelTableProps) {
  const colors = JORNADA_CHANNEL_COLORS[channel.canal];
  const indicators = useMemo(() => getIndicatorsForChannel(channel.channelType), [channel.channelType]);

  const weekHeaders = useMemo(() => {
    return channel.semanas.map((_, idx) => `S${idx + 1}`);
  }, [channel.semanas]);

  const subtitle = channel.channelType === 'native-form'
    ? 'Formulário Nativo'
    : 'Landing Page';

  return (
    <div className={cn('rounded-xl border overflow-hidden', colors.border)}>
      {/* Channel Header */}
      <div className={cn('px-4 py-3 flex items-center justify-between', colors.bg)}>
        <span className={cn('font-display font-semibold text-sm', colors.text)}>
          {channel.canal}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {subtitle}
        </span>
      </div>

      <TooltipProvider delayDuration={200}>
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(216,30%,14%)] hover:bg-[hsl(216,30%,14%)]">
              <TableHead className="w-[180px] text-xs font-medium text-muted-foreground">
                Indicador
              </TableHead>
              {!isDailyMode && weekHeaders.map(h => (
                <TableHead key={h} className="text-center text-xs font-medium text-muted-foreground w-[100px]">
                  {h}
                </TableHead>
              ))}
              <TableHead className={`text-center text-xs font-semibold text-foreground w-[110px] ${!isDailyMode ? 'border-l border-border' : ''}`}>
                {isDailyMode ? 'Dia' : 'Mês'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {indicators.map((indicator, rowIdx) => (
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
                {!isDailyMode && channel.semanas.map((semana, idx) => {
                  const value = semana[indicator.key] as number;
                  const compValue = comparisonChannel?.semanas[idx]?.[indicator.key] as number | undefined;
                  return (
                    <TableCell
                      key={idx}
                      className={cn(
                        'text-center text-xs py-2 tabular-nums',
                        getCellColor(value)
                      )}
                    >
                      {formatValue(value, indicator.format)}
                      {compValue !== undefined && comparisonChannel && (
                        <DeltaBadge current={value} comparison={compValue} format={indicator.format} />
                      )}
                    </TableCell>
                  );
                })}
                <TableCell
                  className={cn(
                    'text-center text-xs font-semibold py-2 tabular-nums',
                    !isDailyMode && 'border-l border-border',
                    getCellColor(channel.mes[indicator.key] as number)
                  )}
                >
                  {formatValue(channel.mes[indicator.key] as number, indicator.format)}
                  {comparisonChannel && (
                    <DeltaBadge
                      current={channel.mes[indicator.key] as number}
                      comparison={comparisonChannel.mes[indicator.key] as number}
                      format={indicator.format}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}
