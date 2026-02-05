// Types for LTV Analysis

// Status original da planilha
export type LTVStatusOriginal = 
  | 'ATIVO' 
  | 'DESISTENCIA' 
  | 'INADIMPLENTE' 
  | 'PAUSADO' 
  | 'PAUSADO NA AGENDA' 
  | 'INATIVO';

// Categoria agrupada para filtros
export type LTVStatusCategory = 'ativo' | 'cancelado' | 'pausado' | 'inadimplente';

export interface LTVRecord {
  dataMatricula: Date;
  dataCancelamento: Date | null;
  statusOriginal: LTVStatusOriginal;
  statusCategory: LTVStatusCategory;
  campanha: string;
  canal: string;
  valorMensalidade: number;
  tempoVidaDias: number;
  tempoVidaMeses: number;
  receitaTotal: number; // LTV individual já calculado
}

export interface LTVFiltersState {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  canais: string[];
  status: 'todos' | 'ativo' | 'cancelado' | 'pausado' | 'inadimplente';
}

export interface LTVMetrics {
  ltvMedio: number;
  ticketMedio: number;
  permanenciaMedia: number;
  taxaChurn: number;
  retencaoMes3: number;
  totalAlunos: number;
  alunosAtivos: number;
  alunosCancelados: number;
  alunosPausados: number;
  alunosInadimplentes: number;
}

export interface CohortData {
  cohort: string; // "Jan/2024"
  cohortDate: Date;
  alunos: number;
  ticketMedio: number;
  permanenciaMedia: number;
  taxaChurn: number;
  taxaRetencao: number;
  ltv: number;
  ativos: number;
}

export interface ChannelLTVData {
  canal: string;
  alunos: number;
  ticketMedio: number;
  permanenciaMedia: number;
  ltv: number;
  churnPercent: number;
  ativos: number;
}

export interface SurvivalPoint {
  mes: number;
  taxa: number;
  elegíveis: number;
  sobreviventes: number;
}

export interface MonthlyChurnPoint {
  mes: string; // "Jan/2024"
  cancelamentos: number;
}

export interface TicketDistribution {
  faixa: string;
  quantidade: number;
  percentual: number;
}

export interface StatusBreakdown {
  status: LTVStatusOriginal;
  quantidade: number;
  percentual: number;
  color: string;
}
