import type { NanoCreative } from '../types';

interface Props {
  creatives: NanoCreative[];
}

export function NanosKPIs({ creatives }: Props) {
  const totals = creatives.reduce(
    (acc, c) => ({
      mql: acc.mql + c.mql,
      calls: acc.calls + c.calls,
      vendas: acc.vendas + c.vendas,
      spend: acc.spend + c.spend,
    }),
    { mql: 0, calls: 0, vendas: 0, spend: 0 }
  );
  const cpa = totals.vendas > 0 ? totals.spend / totals.vendas : 0;
  const mqlToCall = totals.mql > 0 ? ((totals.calls / totals.mql) * 100).toFixed(1) : '0';
  const callToVenda = totals.calls > 0 ? ((totals.vendas / totals.calls) * 100).toFixed(1) : '0';

  const cards = [
    { label: 'MQL Total', value: totals.mql.toString(), sub: `${creatives.length} criativos ativos` },
    { label: 'Calls Realizadas', value: totals.calls.toString(), sub: `${mqlToCall}% dos MQLs` },
    { label: 'Vendas', value: totals.vendas.toString(), sub: `${callToVenda}% das calls` },
    { label: 'CPA Médio', value: `R$${cpa.toFixed(0)}`, sub: `Spend: R$${totals.spend.toLocaleString('pt-BR')}` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">{card.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
          <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
