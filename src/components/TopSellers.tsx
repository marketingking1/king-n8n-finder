import type { Seller } from '../types';

export function TopSellers({ sellers }: { sellers: Seller[] }) {
  const max = sellers[0]?.revenue ?? 1;

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Vendedores</h3>
      <div className="space-y-3">
        {sellers.map((seller, i) => (
          <div key={seller.name} className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 w-5">{i + 1}.</span>
            <span className="text-sm text-gray-700 w-24">{seller.name}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(seller.revenue / max) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 w-20 text-right">
              R${(seller.revenue / 1000).toFixed(0)}K
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
