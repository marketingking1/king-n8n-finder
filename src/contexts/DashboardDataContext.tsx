import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ChannelMetrics, AggregatedMetrics, CampaignMetrics } from '@/types/dashboard';

// Types for dashboard data
interface MacroMetrics {
  investimento: number;
  vendas: number;
  conversoes: number;
  leads: number;
  mql: number;
  faturamento: number;
  receita: number;
  cpa: number;
  cac: number;
  roas: number;
  roi: number;
  ctr: number;
  cpl: number;
  ticketMedio: number;
  taxaConversao: number;
}

interface CreativeKPIs {
  totalInvestimento: number;
  totalImpressions: number;
  avgHookRate: number;
  avgHoldRate: number;
  avgCompletionRate: number;
  totalLeads: number;
  avgCpl: number;
  avgCpm: number;
}

interface TopCreative {
  ads: string;
  displayName?: string;
  totalSpend: number;
  avgHookRate: number;
  avgHoldRate: number;
  avgCpl: number;
  totalLeads: number;
}

interface LTVMetrics {
  ltvMedio: number;
  ticketMedio: number;
  permanenciaMedia: number;
  taxaChurn: number;
  retencaoMes3: number;
  totalAlunos: number;
  alunosAtivos: number;
  alunosCancelados: number;
  alunosPausados?: number;
}

interface ChannelLTVData {
  canal: string;
  alunos: number;
  ltv: number;
  churnPercent: number;
  permanenciaMedia: number;
}

export interface DashboardDataState {
  macro?: Partial<MacroMetrics>;
  channelMetrics?: ChannelMetrics[];
  campaignMetrics?: CampaignMetrics[];
  creativeKPIs?: CreativeKPIs;
  topCreatives?: TopCreative[];
  ltvMetrics?: LTVMetrics;
  channelLTV?: ChannelLTVData[];
}

interface DashboardDataContextValue extends DashboardDataState {
  setMacroData: (macro: Partial<MacroMetrics>, channelMetrics?: ChannelMetrics[]) => void;
  setCampaignData: (campaignMetrics: CampaignMetrics[]) => void;
  setCreativeData: (creativeKPIs: CreativeKPIs, topCreatives: TopCreative[]) => void;
  setLTVData: (ltvMetrics: LTVMetrics, channelLTV: ChannelLTVData[]) => void;
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardDataState>({});

  const setMacroData = useCallback((macro: Partial<MacroMetrics>, channelMetrics?: ChannelMetrics[]) => {
    setData((prev) => ({ ...prev, macro, channelMetrics }));
  }, []);

  const setCampaignData = useCallback((campaignMetrics: CampaignMetrics[]) => {
    setData((prev) => ({ ...prev, campaignMetrics }));
  }, []);

  const setCreativeData = useCallback((creativeKPIs: CreativeKPIs, topCreatives: TopCreative[]) => {
    setData((prev) => ({ ...prev, creativeKPIs, topCreatives }));
  }, []);

  const setLTVData = useCallback((ltvMetrics: LTVMetrics, channelLTV: ChannelLTVData[]) => {
    setData((prev) => ({ ...prev, ltvMetrics, channelLTV }));
  }, []);

  return (
    <DashboardDataContext.Provider
      value={{
        ...data,
        setMacroData,
        setCampaignData,
        setCreativeData,
        setLTVData,
      }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData(): DashboardDataState {
  const context = useContext(DashboardDataContext);
  if (!context) {
    // Return empty state if used outside provider (for safety)
    return {};
  }
  return context;
}

export function useDashboardDataActions() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardDataActions must be used within a DashboardDataProvider');
  }
  return {
    setMacroData: context.setMacroData,
    setCampaignData: context.setCampaignData,
    setCreativeData: context.setCreativeData,
    setLTVData: context.setLTVData,
  };
}
