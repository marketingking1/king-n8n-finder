import { useState } from 'react';
import { KPICard } from './components/KPICard';
import { FunnelChart } from './components/FunnelChart';
import { SourcesChart } from './components/SourcesChart';
import { RevenueChart } from './components/RevenueChart';
import { TopSellers } from './components/TopSellers';
import { DealsTable } from './components/DealsTable';
import { NanosKPIs } from './components/NanosKPIs';
import { NanosTable } from './components/NanosTable';
import { JourneyNodes } from './components/JourneyNodes';
import { kpis, funnel, leadSources, topSellers, monthlyRevenue, recentDeals } from './data/mock-kommo';
import { nanoCreatives, dailyJourneyData } from './data/mock-nanos';
import type { CompareMode } from './types';

type Tab = 'visao-geral' | 'analise-nanos';
type Period = '7d' | '14d' | '30d' | '90d';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('visao-geral');
  const [period, setPeriod] = useState<Period>('30d');
  const [compareMode, setCompareMode] = useState<CompareMode>('none');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'visao-geral', label: 'Visão Geral' },
    { key: 'analise-nanos', label: 'Análise Nanos' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard de Vendas CRM</h1>
            <p className="text-sm text-gray-500">Dados KOMMO - Atualizado em tempo real</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 text-gray-700"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="14d">Últimos 14 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
            <select
              value={compareMode}
              onChange={(e) => setCompareMode(e.target.value as CompareMode)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 text-gray-700"
            >
              <option value="none">Sem comparação</option>
              <option value="previous">vs Período anterior</option>
              <option value="same-last-month">vs Mês anterior</option>
              <option value="same-last-year">vs Ano anterior</option>
            </select>
            <button className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700">
              Atualizar
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {activeTab === 'visao-geral' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi) => (
                <KPICard key={kpi.label} kpi={kpi} />
              ))}
            </div>

            {/* Funnel + Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FunnelChart stages={funnel} />
              <SourcesChart sources={leadSources} />
            </div>

            {/* Revenue + Top Sellers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RevenueChart data={monthlyRevenue} />
              <TopSellers sellers={topSellers} />
            </div>

            {/* Deals Table */}
            <DealsTable deals={recentDeals} />
          </>
        )}

        {activeTab === 'analise-nanos' && (
          <>
            {/* KPIs resumo nanos */}
            <NanosKPIs creatives={nanoCreatives} />

            {/* Tabela de criativos com MQL, Calls, Vendas, CPA */}
            <NanosTable creatives={nanoCreatives} />

            {/* Análise de nós da jornada com filtro diário e comparação */}
            <JourneyNodes
              dailyData={dailyJourneyData}
              globalPeriod={period}
              globalCompareMode={compareMode}
            />
          </>
        )}
      </main>
    </div>
  );
}
