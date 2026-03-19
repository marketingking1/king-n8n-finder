import { useState, useMemo } from 'react';
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

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

interface Props {
  dailyData: DailyJourneyData[];
}

export function JourneyNodes({ dailyData }: Props) {
  const [period, setPeriod] = useState<'7d' | '14d' | '30d'>('7d');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [compareMode, setCompareMode] = useState<CompareMode>('none');

  const filteredData = useMemo(() => {
    if (selectedDate) {
      return dailyData.filter((d) => d.date === selectedDate);
    }
    const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
    return dailyData.slice(-days);
  }, [dailyData, period, selectedDate]);

  const comparisonData = useMemo(() => {
    if (compareMode === 'none') return null;
    const currentDays = filteredData.length;
    if (compareMode === 'previous') {
      const endIdx = dailyData.indexOf(filteredData[0]);
      if (endIdx <= 0) return null;
      const startIdx = Math.max(0, endIdx - currentDays);
      return dailyData.slice(startIdx, endIdx);
    }
    if (compareMode === 'same-last-month') {
      return filteredData.map((d) => {
        const date = new Date(d.date);
        date.setMonth(date.getMonth() - 1);
        const targetDate = date.toISOString().split('T')[0];
        return dailyData.find((x) => x.date === targetDate);
      }).filter(Boolean) as DailyJourneyData[];
    }
    if (compareMode === 'same-last-year') {
      return filteredData.map((d) => {
        const date = new Date(d.date);
        date.setFullYear(date.getFullYear() - 1);
        const targetDate = date.toISOString().split('T')[0];
        return dailyData.find((x) => x.date === targetDate);
      }).filter(Boolean) as DailyJourneyData[];
    }
    return null;
  }, [compareMode, filteredData, dailyData]);

  const nodes = aggregateNodes(filteredData);
  const compNodes = comparisonData ? aggregateNodes(comparisonData) : null;
  const maxTotal = Math.max(...nodes.map((n) => n.total), 1);

  const availableDates = dailyData.map((d) => d.date);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="text-sm font-semibold text-gray-700">Análise de Nós da Jornada</h3>
        <div className="flex flex-wrap items-center gap-2">
          {/* Daily date picker */}
          <select
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              if (e.target.value) setPeriod('7d');
            }}
            className="text-xs border border-gray-300 rounded-md px-2 py-1.5 text-gray-700"
          >
            <option value="">Período agregado</option>
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {formatDate(d)} (diário)
              </option>
            ))}
          </select>

          {/* Period filter (disabled when daily selected) */}
          {!selectedDate && (
            <div className="flex rounded-md overflow-hidden border border-gray-300">
              {(['7d', '14d', '30d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-xs px-3 py-1.5 ${period === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {p === '7d' ? '7 dias' : p === '14d' ? '14 dias' : '30 dias'}
                </button>
              ))}
            </div>
          )}

          {/* Comparison filter */}
          <select
            value={compareMode}
            onChange={(e) => setCompareMode(e.target.value as CompareMode)}
            className="text-xs border border-gray-300 rounded-md px-2 py-1.5 text-gray-700"
          >
            <option value="none">Sem comparação</option>
            <option value="previous">vs Período anterior</option>
            <option value="same-last-month">vs Mesmo período mês passado</option>
            <option value="same-last-year">vs Mesmo período ano passado</option>
          </select>
        </div>
      </div>

      {/* Label showing active filter */}
      <p className="text-xs text-gray-400 mb-4">
        {selectedDate
          ? `Dia: ${formatDate(selectedDate)}`
          : `Últimos ${period === '7d' ? '7' : period === '14d' ? '14' : '30'} dias`}
        {compareMode !== 'none' && compNodes && (
          <span className="ml-2 text-blue-500">
            | Comparando com {compareMode === 'previous' ? 'período anterior' : compareMode === 'same-last-month' ? 'mesmo período mês passado' : 'mesmo período ano passado'}
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
                  {/* Comparison bar overlay */}
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
    </div>
  );
}
