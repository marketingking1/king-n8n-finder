import type { MonthlyRevenue } from '../types';

export function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
  const max = Math.max(...data.map((d) => d.value));

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Mensal</h3>
      <div className="flex items-end gap-4 h-40">
        {data.map((item) => (
          <div key={item.month} className="flex flex-col items-center flex-1">
            <span className="text-xs text-gray-500 mb-1">
              R${(item.value / 1000).toFixed(0)}K
            </span>
            <div
              className="w-full bg-blue-500 rounded-t-md"
              style={{ height: `${(item.value / max) * 120}px` }}
            />
            <span className="text-xs text-gray-500 mt-2">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
