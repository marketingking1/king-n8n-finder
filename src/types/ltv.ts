// Types for LTV Analysis

export interface LTVRecord {
  dataMatricula: Date;
  dataCancelamento: Date | null;
  dataAlunoAtivo: Date | null;
  campanha: string;
  canal: string;
  valorMensalidade: number;
  status: 'ativo' | 'cancelado' | 'indefinido';
  permanenciaMeses: number | null; // null para ativos
}

export interface LTVFiltersState {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  canais: string[];
  status: 'todos' | 'ativos' | 'cancelados';
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
