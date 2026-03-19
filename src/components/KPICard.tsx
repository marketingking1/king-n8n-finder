import type { KPI } from '../types';

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7 mt-2">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#059669' : '#DC2626'}
        strokeWidth="2"
      />
    </svg>
  );
}

export function KPICard({ kpi }: { kpi: KPI }) {
  const positive = kpi.change >= 0;
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
      <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
      <span className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {positive ? '▲' : '▼'} {kpi.changeLabel}
      </span>
      <Sparkline data={kpi.trend} positive={positive} />
    </div>
  );
}
