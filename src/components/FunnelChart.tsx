import type { FunnelStage } from '../types';

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.count));

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Funil de Vendas</h3>
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.name} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-24 text-right">{stage.name}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
              <div
                className="h-full rounded-full flex items-center pl-2"
                style={{
                  width: `${(stage.count / max) * 100}%`,
                  backgroundColor: stage.color,
                }}
              >
                <span className="text-xs text-white font-medium">{stage.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
