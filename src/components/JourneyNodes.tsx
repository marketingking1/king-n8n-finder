import { useState, useMemo, useEffect } from 'react';
import type { DailyJourneyData, JourneyNode, CompareMode } from '../types';

function aggregateNodes(data: DailyJourneyData[]): JourneyNode[] {
  if (data.length === 0) return [];
  const nodeNames = data[0].nodes.map((n) => n.node);
  return nodeNames.map((name) => {
    const totals = data.reduce(
      (acc, day) => {
        const n = day.nodes.find((x) => x.node === name);
        if (!n) return acc;
        return { total: acc.total + n.total, converted: acc.converted + n.converted, dropped: acc.dropped + n.dropped };
      },
      { total: 0, converted: 0, dropped: 0 }
    );
    return {
      node: name,
      total: totals.total,
      converted: totals.converted,
      dropped: totals.dropped,
      conversionRate: totals.total > 0 ? (totals.converted / totals.total) * 100 : 0,
    };
  });
}

function formatDateBR(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function shiftMonth(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function shiftYear(dateStr: string, years: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

interface Props {
  dailyData: DailyJourneyData[];
  globalPeriod?: string;
  globalCompareMode?: CompareMode;
}

export function JourneyNodes({ dailyData, globalPeriod, globalCompareMode }: Props) {
  const minDate = dailyData.length > 0 ? dailyData[0].date : '';
  const maxDate = dailyData.length > 0 ? dailyData[dailyData.length - 1].date : '';

  const [localPeriod, setLocalPeriod] = useState<'7d' | '14d' | '30d' | 'custom'>('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [compareMode, setCompareMode] = useState<CompareMode>('none');

  // Sync from global props
  useEffect(() => {
    if (globalCompareMode !== undefined) {
      setCompareMode(globalCompareMode);
    }
  }, [globalCompareMode]);

  useEffect(() => {
    if (!globalPeriod) return;
    if (globalPeriod === '7d' || globalPeriod === '14d' || globalPeriod === '30d') {
      setLocalPeriod(globalPeriod);
      setStartDate('');
      setEndDate('');
    } else if (globalPeriod === '90d' && maxDate) {
      setStartDate(shiftDate(maxDate, -89));
      setEndDate(maxDate);
      setLocalPeriod('custom');
    }
  }, [globalPeriod, maxDate]);

  // Filter data
  const filteredData = useMemo(() => {
    if (localPeriod === 'custom' && startDate && endDate) {
      return dailyData.filter((d) => d.date >= startDate && d.date <= endDate);
    }
    const days = localPeriod === '7d' ? 7 : localPeriod === '14d' ? 14 : 30;
    return dailyData.slice(-days);
  }, [dailyData, localPeriod, startDate, endDate]);

  // Comparison data
  const comparisonData = useMemo(() => {
    if (compareMode === 'none' || filteredData.length === 0) return null;

    const currentStart = filteredData[0].date;
    const currentEnd = filteredData[filteredData.length - 1].date;
    const dayCount = filteredData.length;

    let compStart: string;
    let compEnd: string;

    if (compareMode === 'previous') {
      compEnd = shiftDate(currentStart, -1);
      compStart = shiftDate(currentStart, -dayCount);
    } else if (compareMode === 'same-last-month') {
      compStart = shiftMonth(currentStart, -1);
      compEnd = shiftMonth(currentEnd, -1);
    } else if (compareMode === 'same-last-year') {
      compStart = shiftYear(currentStart, -1);
      compEnd = shiftYear(currentEnd, -1);
    } else {
      return null;
    }

    const result = dailyData.filter((d) => d.date >= compStart && d.date <= compEnd);
    return result.length > 0 ? result : null;
  }, [compareMode, filteredData, dailyData]);

  const nodes = aggregateNodes(filteredData);
  const compNodes = comparisonData ? aggregateNodes(comparisonData) : null;
  const maxTotal = Math.max(...nodes.map((n) => n.total), ...(compNodes?.map((n) => n.total) || []), 1);

  const handlePeriodClick = (p: '7d' | '14d' | '30d') => {
    setLocalPeriod(p);
    setStartDate('');
    setEndDate('');
  };

  const handleStartDate = (val: string) => {
    setStartDate(val);
    if (val && endDate) setLocalPeriod('custom');
  };

  const handleEndDate = (val: string) => {
    setEndDate(val);
    if (startDate && val) setLocalPeriod('custom');
  };

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
    setLocalPeriod('7d');
  };

  // Filter label
  const filterLabel = (() => {
    if (localPeriod === 'custom' && startDate && endDate) {
      return `${formatDateBR(startDate)} — ${formatDateBR(endDate)} (${filteredData.length} dias)`;
    }
    const d = localPeriod === '7d' ? 7 : localPeriod === '14d' ? 14 : 30;
    return `Últimos ${d} dias`;
  })();

  const compareLabels: Record<CompareMode, string> = {
    none: '',
    previous: 'período anterior',
    'same-last-month': 'mesmo período mês passado',
    'same-last-year': 'mesmo período ano passado',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Análise de Nós da Jornada</h3>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">De:</label>
          <input
            type="date"
            value={startDate}
            min={minDate}
            max={endDate || maxDate}
            onChange={(e) => handleStartDate(e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2 py-1.5 text-gray-700"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Até:</label>
          <input
            type="date"
            value={endDate}
            min={startDate || minDate}
            max={maxDate}
            onChange={(e) => handleEndDate(e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2 py-1.5 text-gray-700"
          />
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200" />

        {/* Quick period buttons */}
        <div className="flex rounded-md overflow-hidden border border-gray-300">
          {(['7d', '14d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodClick(p)}
              className={`text-xs px-3 py-1.5 transition-colors ${
                localPeriod === p && !startDate
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p === '7d' ? '7 dias' : p === '14d' ? '14 dias' : '30 dias'}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200" />

        {/* Comparison */}
        <select
          value={compareMode}
          onChange={(e) => setCompareMode(e.target.value as CompareMode)}
          className="text-xs border border-gray-300 rounded-md px-2 py-1.5 text-gray-700"
        >
          <option value="none">Sem comparação</option>
          <option value="previous">vs Período anterior</option>
          <option value="same-last-month">vs Mês anterior</option>
          <option value="same-last-year">vs Ano anterior</option>
        </select>

        {/* Clear dates */}
        {startDate && (
          <button
            onClick={clearDates}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Limpar datas
          </button>
        )}
      </div>

      {/* Active filter info */}
      <p className="text-xs text-gray-400 mb-4">
        {filterLabel}
        {compareMode !== 'none' && compNodes && (
          <span className="ml-2 text-blue-500">
            | Comparando com {compareLabels[compareMode]} ({comparisonData?.length} dias)
          </span>
        )}
        {compareMode !== 'none' && !compNodes && (
          <span className="ml-2 text-amber-500">
            | Sem dados disponíveis para comparação
          </span>
        )}
      </p>

      {/* Journey visualization */}
      <div className="space-y-3">
        {nodes.map((node, i) => {
          const compNode = compNodes?.[i];
          const diff = compNode ? node.conversionRate - compNode.conversionRate : null;
          const diffTotal = compNode ? node.total - compNode.total : null;

          return (
            <div key={node.node} className="group">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-32 text-right font-medium">{node.node}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden relative">
                  <div
                    className="h-full rounded-full flex items-center pl-2 transition-all"
                    style={{
                      width: `${(node.total / maxTotal) * 100}%`,
                      backgroundColor: i === nodes.length - 1 ? '#059669' : `hsl(${220 + i * 15}, 70%, ${55 + i * 3}%)`,
                    }}
                  >
                    <span className="text-xs text-white font-medium">{node.total}</span>
                  </div>
                  {compNode && (
                    <div
                      className="absolute top-0 left-0 h-full rounded-full border-2 border-dashed border-gray-400 opacity-40"
                      style={{ width: `${(compNode.total / maxTotal) * 100}%` }}
                    />
                  )}
                </div>
                <div className="w-36 text-right">
                  <span className="text-xs font-medium text-gray-700">
                    {node.conversionRate.toFixed(1)}%
                  </span>
                  {diff !== null && (
                    <span className={`text-xs ml-1 ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      ({diff >= 0 ? '+' : ''}{diff.toFixed(1)}pp)
                    </span>
                  )}
                  {diffTotal !== null && (
                    <span className={`text-xs ml-1 ${diffTotal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {diffTotal >= 0 ? '+' : ''}{diffTotal}
                    </span>
                  )}
                </div>
              </div>
              {/* Drop-off indicator */}
              {i < nodes.length - 1 && (
                <div className="flex items-center gap-3 mt-1">
                  <span className="w-32" />
                  <div className="flex-1 flex items-center gap-1 pl-2">
                    <span className="text-[10px] text-red-400">
                      ↓ -{node.dropped} ({node.total > 0 ? ((node.dropped / node.total) * 100).toFixed(0) : 0}% drop)
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison legend */}
      {compNodes && (
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] text-gray-500">Período atual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2 rounded-full border-2 border-dashed border-gray-400 opacity-40" />
            <span className="text-[10px] text-gray-500">Período de comparação</span>
          </div>
        </div>
      )}
    </div>
  );
}
