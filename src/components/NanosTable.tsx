import type { NanoCreative } from '../types';

export function NanosTable({ creatives }: { creatives: NanoCreative[] }) {
  const totals = creatives.reduce(
    (acc, c) => ({
      mql: acc.mql + c.mql,
      calls: acc.calls + c.calls,
      vendas: acc.vendas + c.vendas,
      spend: acc.spend + c.spend,
    }),
    { mql: 0, calls: 0, vendas: 0, spend: 0 }
  );
  const totalCpa = totals.vendas > 0 ? totals.spend / totals.vendas : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 pb-3">
        <h3 className="text-sm font-semibold text-gray-700">Análise Nanos — Métricas por Criativo</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-2 text-gray-500 font-medium">Criativo</th>
              <th className="text-right px-5 py-2 text-gray-500 font-medium">MQL</th>
              <th className="text-right px-5 py-2 text-gray-500 font-medium">Call Realizada</th>
              <th className="text-right px-5 py-2 text-gray-500 font-medium">Vendas</th>
              <th className="text-right px-5 py-2 text-gray-500 font-medium">Spend</th>
              <th className="text-right px-5 py-2 text-gray-500 font-medium">CPA</th>
            </tr>
          </thead>
          <tbody>
            {creatives.map((c) => {
              const callRate = c.mql > 0 ? ((c.calls / c.mql) * 100).toFixed(0) : '0';
              const saleRate = c.calls > 0 ? ((c.vendas / c.calls) * 100).toFixed(0) : '0';
              return (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900 max-w-[220px] truncate">{c.name}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{c.mql}</td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {c.calls}
                    <span className="text-xs text-gray-400 ml-1">({callRate}%)</span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {c.vendas}
                    <span className="text-xs text-gray-400 ml-1">({saleRate}%)</span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    R${c.spend.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-medium ${c.cpa <= 210 ? 'text-green-600' : c.cpa <= 230 ? 'text-amber-600' : 'text-red-600'}`}>
                      R${c.cpa.toFixed(0)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
              <td className="px-5 py-3 text-gray-700">TOTAL</td>
              <td className="px-5 py-3 text-right text-gray-900">{totals.mql}</td>
              <td className="px-5 py-3 text-right text-gray-900">
                {totals.calls}
                <span className="text-xs text-gray-400 ml-1 font-normal">
                  ({totals.mql > 0 ? ((totals.calls / totals.mql) * 100).toFixed(0) : 0}%)
                </span>
              </td>
              <td className="px-5 py-3 text-right text-gray-900">
                {totals.vendas}
                <span className="text-xs text-gray-400 ml-1 font-normal">
                  ({totals.calls > 0 ? ((totals.vendas / totals.calls) * 100).toFixed(0) : 0}%)
                </span>
              </td>
              <td className="px-5 py-3 text-right text-gray-700">
                R${totals.spend.toLocaleString('pt-BR')}
              </td>
              <td className="px-5 py-3 text-right text-green-700">R${totalCpa.toFixed(0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
