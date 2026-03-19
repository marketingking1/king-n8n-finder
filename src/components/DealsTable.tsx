import type { Deal } from '../types';

const stageBadge: Record<string, string> = {
  Prospecção: 'bg-blue-100 text-blue-700',
  Qualificação: 'bg-indigo-100 text-indigo-700',
  Proposta: 'bg-purple-100 text-purple-700',
  Negociação: 'bg-amber-100 text-amber-700',
  Fechamento: 'bg-green-100 text-green-700',
};

export function DealsTable({ deals }: { deals: Deal[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 pb-3">
        <h3 className="text-sm font-semibold text-gray-700">Deals Recentes</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-2 text-gray-500 font-medium">Lead</th>
            <th className="text-right px-5 py-2 text-gray-500 font-medium">Valor</th>
            <th className="text-left px-5 py-2 text-gray-500 font-medium">Stage</th>
            <th className="text-left px-5 py-2 text-gray-500 font-medium">Vendedor</th>
            <th className="text-right px-5 py-2 text-gray-500 font-medium">Dias</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.lead} className="border-t border-gray-50 hover:bg-gray-50">
              <td className="px-5 py-3 font-medium text-gray-900">{deal.lead}</td>
              <td className="px-5 py-3 text-right text-gray-700">
                R${deal.value.toLocaleString('pt-BR')}
              </td>
              <td className="px-5 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge[deal.stage] ?? ''}`}>
                  {deal.stage}
                </span>
              </td>
              <td className="px-5 py-3 text-gray-700">{deal.seller}</td>
              <td className="px-5 py-3 text-right text-gray-500">{deal.days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
