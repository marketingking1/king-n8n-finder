import type { LeadSource } from '../types';

export function SourcesChart({ sources }: { sources: LeadSource[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads por Origem</h3>
      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.name} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
            <span className="text-sm text-gray-700 flex-1">{source.name}</span>
            <div className="w-24 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${source.percentage}%`, backgroundColor: source.color }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600 w-10 text-right">
              {source.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
