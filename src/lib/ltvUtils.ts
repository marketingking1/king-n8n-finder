import { format, differenceInMonths, isValid, startOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LTVRecord,
  LTVMetrics,
  CohortData,
  ChannelLTVData,
  SurvivalPoint,
  MonthlyChurnPoint,
  TicketDistribution,
  LTVFiltersState,
  LTVStatusOriginal,
  LTVStatusCategory,
  StatusBreakdown,
} from '@/types/ltv';

// Google Sheets config
const SPREADSHEET_ID = '1ep-gKGRFkGoCVK0g0HABPDKjn4Wo4CV6WTgWF23BSL4';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

// Data de referência: 01/02/2026
const REFERENCE_DATE = new Date(2026, 1, 1);

// Status mapping para categorias
const STATUS_TO_CATEGORY: Record<string, LTVStatusCategory> = {
  'ATIVO': 'ativo',
  'DESISTENCIA': 'cancelado',
  'INADIMPLENTE': 'cancelado',
  'INATIVO': 'cancelado',
  'PAUSADO': 'pausado',
  'PAUSADO NA AGENDA': 'pausado',
};

// Status que contam como churn (cancelados)
const CHURN_STATUSES: LTVStatusOriginal[] = ['DESISTENCIA', 'INADIMPLENTE', 'INATIVO'];

// Cores por status original
export const STATUS_COLORS: Record<LTVStatusOriginal, string> = {
  'ATIVO': 'hsl(142, 76%, 36%)',           // verde
  'DESISTENCIA': 'hsl(0, 84%, 60%)',       // vermelho
  'INADIMPLENTE': 'hsl(25, 95%, 53%)',     // laranja
  'PAUSADO': 'hsl(38, 92%, 50%)',          // amarelo
  'PAUSADO NA AGENDA': 'hsl(48, 96%, 53%)', // amarelo claro
  'INATIVO': 'hsl(215, 20%, 45%)',         // cinza
};

// Converter serial Excel para Date (Bug 5: normalizar timezone)
export function excelSerialToDate(serial: number): Date | null {
  if (!serial || !Number.isFinite(serial) || serial < 1) return null;
  const utcDate = new Date((serial - 25569) * 86400 * 1000);
  if (!isValid(utcDate)) return null;
  
  // Criar data em timezone local para consistência com REFERENCE_DATE
  const date = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
  
  // Filtrar datas fora do range válido (2015-2026)
  const year = date.getFullYear();
  if (year < 2015 || year > 2026) return null;
  
  return date;
}

// Parse valor com vírgula decimal
export function parseDecimal(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/\./g, '').replace(',', '.').trim();
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Parse inteiro
export function parseInt2(value: string | number): number {
  if (typeof value === 'number') return Math.floor(value);
  if (!value) return 0;
  const parsed = parseInt(String(value).trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Obter categoria de status
export function getStatusCategory(status: string): LTVStatusCategory {
  const normalized = status.trim().toUpperCase();
  return STATUS_TO_CATEGORY[normalized] || 'cancelado';
}

// Validar status original
export function normalizeStatus(status: string): LTVStatusOriginal {
  const normalized = status.trim().toUpperCase();
  const validStatuses: LTVStatusOriginal[] = [
    'ATIVO', 'DESISTENCIA', 'INADIMPLENTE', 'PAUSADO', 'PAUSADO NA AGENDA', 'INATIVO'
  ];
  return validStatuses.includes(normalized as LTVStatusOriginal) 
    ? (normalized as LTVStatusOriginal) 
    : 'INATIVO';
}

// Fetch data from LTV_TRATADOS sheet (nova estrutura com 9 colunas)
export async function fetchLTVData(): Promise<LTVRecord[]> {
  const SHEET_NAME = 'LTV_TRATADOS';
  const range = `${SHEET_NAME}!A:I`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING&_=${Date.now()}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API error (LTV_TRATADOS):', errorData);
      throw new Error(`Failed to fetch LTV_TRATADOS: ${response.status}`);
    }

    const data = await response.json();
    const values: any[][] = data.values || [];

    if (values.length < 2) return [];

    // Header esperado (9 colunas):
    // data_da_matricula_edit, data_cancelamento, status, campanha, tag_tratada, 
    // valor_mensalidade, tempo_vida_dias, tempo_vida_meses, receita_total
    // Bug 1: Aceitar linhas com 6+ colunas (G/H/I podem estar vazias e serem cortadas pela API)
    const records: LTVRecord[] = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row || row.length < 6) continue; // Aceitar linhas com pelo menos 6 colunas (A-F)
      
      const serialMatricula = typeof row[0] === 'number' ? row[0] : parseFloat(row[0]);
      const serialCancelamento = typeof row[1] === 'number' ? row[1] : parseFloat(row[1]);
      const statusRaw = String(row[2] || '').trim();
      const campanha = String(row[3] || '');
      const canal = String(row[4] || '(sem canal)').trim();
      const valorMensalidade = parseDecimal(row[5]);
      
      const dataMatricula = excelSerialToDate(serialMatricula);
      if (!dataMatricula) continue;
      
      const dataCancelamento = excelSerialToDate(serialCancelamento);
      const statusOriginal = normalizeStatus(statusRaw);
      const statusCategory = getStatusCategory(statusRaw);
      
      // Colunas G/H/I podem não existir ou estar vazias — calcular se ausentes
      let tempoVidaDias: number;
      let tempoVidaMeses: number;
      let receitaTotal: number;
      
      const hasLifetimeData = row.length >= 9 && row[6] !== '' && row[6] !== null && row[6] !== undefined;
      
      if (hasLifetimeData) {
        // Usar valores pré-calculados da planilha
        tempoVidaDias = parseInt2(row[6]);
        tempoVidaMeses = parseInt2(row[7]);
        receitaTotal = parseDecimal(row[8]);
      } else {
        // Calcular a partir dos dados disponíveis
        const dataFim = dataCancelamento || REFERENCE_DATE;
        const diffTime = dataFim.getTime() - dataMatricula.getTime();
        tempoVidaDias = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        tempoVidaMeses = Math.max(0, Math.floor(tempoVidaDias / 30));
        receitaTotal = valorMensalidade * tempoVidaMeses;
      }
      
      records.push({
        dataMatricula,
        dataCancelamento,
        statusOriginal,
        statusCategory,
        campanha,
        canal: canal || '(sem canal)',
        valorMensalidade,
        tempoVidaDias,
        tempoVidaMeses,
        receitaTotal,
      });
    }

    console.log(`LTV_TRATADOS: Loaded ${records.length} records`);
    return records;
  } catch (error) {
    console.error('Error fetching LTV_TRATADOS data:', error);
    throw error;
  }
}

// Aplicar filtros
export function filterLTVRecords(
  records: LTVRecord[],
  filters: LTVFiltersState
): LTVRecord[] {
  return records.filter(record => {
    // Filtro de data de matrícula
    if (filters.dateRange.from && record.dataMatricula < filters.dateRange.from) {
      return false;
    }
    if (filters.dateRange.to && record.dataMatricula > filters.dateRange.to) {
      return false;
    }
    
    // Filtro de canal
    if (filters.canais.length > 0 && !filters.canais.includes(record.canal)) {
      return false;
    }
    
    // Filtro de status (categoria)
    if (filters.status !== 'todos' && record.statusCategory !== filters.status) {
      return false;
    }
    
    return true;
  });
}

// Calcular métricas principais (usando valores pré-calculados)
// Bug 4: filtrar registros incompletos antes de calcular médias
// Bug 6: usar >= em vez de > para retenção mês 3
export function calculateLTVMetrics(records: LTVRecord[]): LTVMetrics {
  if (records.length === 0) {
    return {
      ltvMedio: 0,
      ticketMedio: 0,
      permanenciaMedia: 0,
      taxaChurn: 0,
      retencaoMes3: 0,
      totalAlunos: 0,
      alunosAtivos: 0,
      alunosCancelados: 0,
      alunosPausados: 0,
    };
  }
  
  const ativos = records.filter(r => r.statusOriginal === 'ATIVO');
  const cancelados = records.filter(r => CHURN_STATUSES.includes(r.statusOriginal));
  const pausados = records.filter(r => r.statusCategory === 'pausado');
  
  // Bug 4: Filtrar registros com dados completos para cálculo de médias
  const recordsComLTV = records.filter(r => r.receitaTotal > 0);
  const recordsComTicket = records.filter(r => r.valorMensalidade > 0);
  const recordsComPermanencia = records.filter(r => r.tempoVidaMeses > 0);
  
  // LTV Médio: média(receita_total) - apenas registros com LTV > 0
  const ltvMedio = recordsComLTV.length > 0
    ? recordsComLTV.reduce((sum, r) => sum + r.receitaTotal, 0) / recordsComLTV.length
    : 0;
  
  // Ticket médio: média(valor_mensalidade) - apenas registros com ticket > 0
  const ticketMedio = recordsComTicket.length > 0
    ? recordsComTicket.reduce((sum, r) => sum + r.valorMensalidade, 0) / recordsComTicket.length
    : 0;
  
  // Permanência média: média(tempo_vida_meses) - apenas registros com permanência > 0
  const permanenciaMedia = recordsComPermanencia.length > 0
    ? recordsComPermanencia.reduce((sum, r) => sum + r.tempoVidaMeses, 0) / recordsComPermanencia.length
    : 0;
  
  // Taxa de churn: (DESISTENCIA + INADIMPLENTE + INATIVO) / total × 100
  const taxaChurn = (cancelados.length / records.length) * 100;
  
  // Bug 6: Retenção mês 3: alunos com tempo_vida_meses >= 3 / elegíveis × 100
  const tresMesesAtras = new Date(REFERENCE_DATE);
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
  
  const elegiveisM3 = records.filter(r => r.dataMatricula <= tresMesesAtras);
  const sobreviventesM3 = elegiveisM3.filter(r => r.tempoVidaMeses >= 3);
  
  const retencaoMes3 = elegiveisM3.length > 0
    ? (sobreviventesM3.length / elegiveisM3.length) * 100
    : 0;
  
  return {
    ltvMedio,
    ticketMedio,
    permanenciaMedia,
    taxaChurn,
    retencaoMes3,
    totalAlunos: records.length,
    alunosAtivos: ativos.length,
    alunosCancelados: cancelados.length,
    alunosPausados: pausados.length,
  };
}

// Curva de sobrevivência (usando tempo_vida_meses pré-calculado)
// Bug 6: usar >= em vez de > para não subcontar alunos na borda
export function calculateSurvivalCurve(records: LTVRecord[]): SurvivalPoint[] {
  const points: SurvivalPoint[] = [];
  
  for (let mes = 0; mes <= 24; mes++) {
    // Elegíveis: matriculados há mais de M meses
    const mesesAtras = new Date(REFERENCE_DATE);
    mesesAtras.setMonth(mesesAtras.getMonth() - mes);
    
    const elegiveis = records.filter(r => r.dataMatricula <= mesesAtras);
    
    if (elegiveis.length === 0) {
      points.push({ mes, taxa: 0, elegíveis: 0, sobreviventes: 0 });
      continue;
    }
    
    // Bug 6: Sobreviventes: alunos com tempo_vida_meses >= M
    const sobreviventes = elegiveis.filter(r => r.tempoVidaMeses >= mes);
    
    const taxa = (sobreviventes.length / elegiveis.length) * 100;
    
    points.push({
      mes,
      taxa,
      elegíveis: elegiveis.length,
      sobreviventes: sobreviventes.length,
    });
  }
  
  return points;
}

// LTV por canal (usando receita_total pré-calculado)
// Bug 4: filtrar registros incompletos antes de calcular médias
export function calculateLTVByChannel(records: LTVRecord[]): ChannelLTVData[] {
  const channelMap: Record<string, LTVRecord[]> = {};
  
  for (const record of records) {
    const canal = record.canal || '(sem canal)';
    if (!channelMap[canal]) {
      channelMap[canal] = [];
    }
    channelMap[canal].push(record);
  }
  
  const result: ChannelLTVData[] = [];
  
  for (const [canal, channelRecords] of Object.entries(channelMap)) {
    if (channelRecords.length < 5) continue; // Mínimo 5 alunos
    
    const cancelados = channelRecords.filter(r => CHURN_STATUSES.includes(r.statusOriginal));
    const ativos = channelRecords.filter(r => r.statusOriginal === 'ATIVO');
    
    // Bug 4: Filtrar registros com dados completos para cálculo de médias
    const recordsComTicket = channelRecords.filter(r => r.valorMensalidade > 0);
    const recordsComPermanencia = channelRecords.filter(r => r.tempoVidaMeses > 0);
    const recordsComLTV = channelRecords.filter(r => r.receitaTotal > 0);
    
    const ticketMedio = recordsComTicket.length > 0
      ? recordsComTicket.reduce((sum, r) => sum + r.valorMensalidade, 0) / recordsComTicket.length
      : 0;
    const permanenciaMedia = recordsComPermanencia.length > 0
      ? recordsComPermanencia.reduce((sum, r) => sum + r.tempoVidaMeses, 0) / recordsComPermanencia.length
      : 0;
    const ltv = recordsComLTV.length > 0
      ? recordsComLTV.reduce((sum, r) => sum + r.receitaTotal, 0) / recordsComLTV.length
      : 0;
    const churnPercent = (cancelados.length / channelRecords.length) * 100;
    
    result.push({
      canal,
      alunos: channelRecords.length,
      ticketMedio,
      permanenciaMedia,
      ltv,
      churnPercent,
      ativos: ativos.length,
    });
  }
  
  return result.sort((a, b) => b.ltv - a.ltv);
}

// Churn mensal (últimos 12 meses) - apenas status de churn
export function calculateMonthlyChurn(records: LTVRecord[]): MonthlyChurnPoint[] {
  const cancelados = records.filter(r => 
    CHURN_STATUSES.includes(r.statusOriginal) && r.dataCancelamento
  );
  
  const monthMap: Record<string, number> = {};
  
  for (const record of cancelados) {
    if (!record.dataCancelamento) continue;
    
    const monthKey = format(record.dataCancelamento, 'yyyy-MM');
    monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
  }
  
  // Ordenar por data e pegar últimos 12 meses
  const sortedMonths = Object.keys(monthMap).sort().slice(-12);
  
  return sortedMonths.map(month => ({
    mes: format(parseISO(`${month}-01`), 'MMM/yy', { locale: ptBR }),
    cancelamentos: monthMap[month],
  }));
}

// Distribuição de ticket
// Bug 3: corrigir faixas para incluir valores decimais (usar < em vez de <=)
export function calculateTicketDistribution(records: LTVRecord[]): TicketDistribution[] {
  const faixas = [
    { label: 'R$ 0-100', min: 0, max: 101 },
    { label: 'R$ 101-200', min: 101, max: 201 },
    { label: 'R$ 201-300', min: 201, max: 301 },
    { label: 'R$ 301-400', min: 301, max: 401 },
    { label: 'R$ 401-500', min: 401, max: 501 },
    { label: 'R$ 500+', min: 501, max: Infinity },
  ];
  
  const distribution: TicketDistribution[] = faixas.map(faixa => ({
    faixa: faixa.label,
    quantidade: 0,
    percentual: 0,
  }));
  
  for (const record of records) {
    const valor = record.valorMensalidade;
    for (let i = 0; i < faixas.length; i++) {
      // Bug 3: usar < no max para incluir valores decimais
      if (valor >= faixas[i].min && valor < faixas[i].max) {
        distribution[i].quantidade++;
        break;
      }
    }
  }
  
  const total = records.length;
  for (const item of distribution) {
    item.percentual = total > 0 ? (item.quantidade / total) * 100 : 0;
  }
  
  return distribution;
}

// Breakdown por status original
export function calculateStatusBreakdown(records: LTVRecord[]): StatusBreakdown[] {
  const statusCount: Record<LTVStatusOriginal, number> = {
    'ATIVO': 0,
    'DESISTENCIA': 0,
    'INADIMPLENTE': 0,
    'PAUSADO': 0,
    'PAUSADO NA AGENDA': 0,
    'INATIVO': 0,
  };
  
  for (const record of records) {
    statusCount[record.statusOriginal]++;
  }
  
  const total = records.length;
  const result: StatusBreakdown[] = [];
  
  for (const [status, quantidade] of Object.entries(statusCount)) {
    if (quantidade > 0) {
      result.push({
        status: status as LTVStatusOriginal,
        quantidade,
        percentual: total > 0 ? (quantidade / total) * 100 : 0,
        color: STATUS_COLORS[status as LTVStatusOriginal],
      });
    }
  }
  
  // Ordenar por quantidade decrescente
  return result.sort((a, b) => b.quantidade - a.quantidade);
}

// Tabela de cohort (usando valores pré-calculados)
// Bug 4: filtrar registros incompletos antes de calcular médias
export function calculateCohortData(records: LTVRecord[]): CohortData[] {
  const cohortMap: Record<string, LTVRecord[]> = {};
  
  for (const record of records) {
    const cohortKey = format(startOfMonth(record.dataMatricula), 'yyyy-MM');
    if (!cohortMap[cohortKey]) {
      cohortMap[cohortKey] = [];
    }
    cohortMap[cohortKey].push(record);
  }
  
  const result: CohortData[] = [];
  
  for (const [cohortKey, cohortRecords] of Object.entries(cohortMap)) {
    const cohortDate = parseISO(`${cohortKey}-01`);
    const cancelados = cohortRecords.filter(r => CHURN_STATUSES.includes(r.statusOriginal));
    const ativos = cohortRecords.filter(r => r.statusOriginal === 'ATIVO');
    
    // Bug 4: Filtrar registros com dados completos para cálculo de médias
    const recordsComTicket = cohortRecords.filter(r => r.valorMensalidade > 0);
    const recordsComPermanencia = cohortRecords.filter(r => r.tempoVidaMeses > 0);
    const recordsComLTV = cohortRecords.filter(r => r.receitaTotal > 0);
    
    const ticketMedio = recordsComTicket.length > 0
      ? recordsComTicket.reduce((sum, r) => sum + r.valorMensalidade, 0) / recordsComTicket.length
      : 0;
    const permanenciaMedia = recordsComPermanencia.length > 0
      ? recordsComPermanencia.reduce((sum, r) => sum + r.tempoVidaMeses, 0) / recordsComPermanencia.length
      : 0;
    const ltv = recordsComLTV.length > 0
      ? recordsComLTV.reduce((sum, r) => sum + r.receitaTotal, 0) / recordsComLTV.length
      : 0;
    
    const taxaChurn = (cancelados.length / cohortRecords.length) * 100;
    const taxaRetencao = 100 - taxaChurn;
    
    result.push({
      cohort: format(cohortDate, 'MMM/yyyy', { locale: ptBR }),
      cohortDate,
      alunos: cohortRecords.length,
      ticketMedio,
      permanenciaMedia,
      taxaChurn,
      taxaRetencao,
      ltv,
      ativos: ativos.length,
    });
  }
  
  return result.sort((a, b) => b.cohortDate.getTime() - a.cohortDate.getTime());
}

// Obter lista de canais únicos
export function getUniqueChannels(records: LTVRecord[]): string[] {
  const channels = new Set<string>();
  for (const record of records) {
    channels.add(record.canal || '(sem canal)');
  }
  return Array.from(channels).sort();
}
