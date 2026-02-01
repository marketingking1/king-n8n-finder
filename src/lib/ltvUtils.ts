import { format, differenceInDays, isValid, startOfMonth, parseISO } from 'date-fns';
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
} from '@/types/ltv';

// Data de referência: 01/02/2026
const REFERENCE_DATE = new Date(2026, 1, 1);
const ACTIVE_FLAG_SERIAL = 46054;

// Converter serial Excel para Date
export function excelSerialToDate(serial: number): Date | null {
  if (!serial || !Number.isFinite(serial) || serial < 1) return null;
  const date = new Date((serial - 25569) * 86400 * 1000);
  if (!isValid(date)) return null;
  
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

// Parse CSV linha a linha
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse do CSV completo
export function parseLTVCSV(csvContent: string): LTVRecord[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const records: LTVRecord[] = [];
  
  // Pular header
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 6) continue;
    
    const serialMatricula = parseFloat(cols[0]);
    const serialCancelamento = parseFloat(cols[1]);
    const serialAlunoAtivo = parseFloat(cols[2]);
    const campanha = cols[3] || '';
    const canal = cols[4] || '(sem canal)';
    const valorMensalidade = parseDecimal(cols[5]);
    
    const dataMatricula = excelSerialToDate(serialMatricula);
    if (!dataMatricula) continue; // Ignorar registros sem data válida
    
    const dataCancelamento = excelSerialToDate(serialCancelamento);
    const dataAlunoAtivo = excelSerialToDate(serialAlunoAtivo);
    
    // Determinar status
    let status: 'ativo' | 'cancelado' | 'indefinido' = 'indefinido';
    if (serialAlunoAtivo === ACTIVE_FLAG_SERIAL) {
      status = 'ativo';
    } else if (dataCancelamento) {
      status = 'cancelado';
    }
    
    // Calcular permanência em meses
    let permanenciaMeses: number | null = null;
    if (status === 'cancelado' && dataCancelamento) {
      const dias = differenceInDays(dataCancelamento, dataMatricula);
      permanenciaMeses = dias / 30.44;
    } else if (status === 'ativo') {
      // Permanência parcial para ativos
      const dias = differenceInDays(REFERENCE_DATE, dataMatricula);
      permanenciaMeses = dias / 30.44;
    }
    
    records.push({
      dataMatricula,
      dataCancelamento,
      dataAlunoAtivo,
      campanha,
      canal: canal || '(sem canal)',
      valorMensalidade,
      status,
      permanenciaMeses,
    });
  }
  
  return records;
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
    
    // Filtro de status
    if (filters.status === 'ativos' && record.status !== 'ativo') {
      return false;
    }
    if (filters.status === 'cancelados' && record.status !== 'cancelado') {
      return false;
    }
    
    return true;
  });
}

// Calcular métricas principais
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
    };
  }
  
  const cancelados = records.filter(r => r.status === 'cancelado');
  const ativos = records.filter(r => r.status === 'ativo');
  
  // Ticket médio
  const ticketMedio = records.reduce((sum, r) => sum + r.valorMensalidade, 0) / records.length;
  
  // Permanência média (apenas cancelados)
  const permanenciaMedia = cancelados.length > 0
    ? cancelados.reduce((sum, r) => sum + (r.permanenciaMeses || 0), 0) / cancelados.length
    : 0;
  
  // LTV médio
  const ltvMedio = ticketMedio * permanenciaMedia;
  
  // Taxa de churn
  const taxaChurn = (cancelados.length / records.length) * 100;
  
  // Retenção mês 3 - alunos que ficaram mais de 3 meses
  // Elegíveis: matriculados há mais de 3 meses
  const tresMesesAtras = new Date(REFERENCE_DATE);
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
  
  const elegiveisM3 = records.filter(r => r.dataMatricula <= tresMesesAtras);
  const sobreviventesM3 = elegiveisM3.filter(r => {
    if (r.status === 'ativo') return true;
    if (r.status === 'cancelado' && r.permanenciaMeses !== null) {
      return r.permanenciaMeses >= 3;
    }
    return false;
  });
  
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
  };
}

// Curva de sobrevivência
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
    
    // Sobreviventes: não cancelaram antes do mês M
    const sobreviventes = elegiveis.filter(r => {
      if (r.status === 'ativo') return true;
      if (r.status === 'cancelado' && r.permanenciaMeses !== null) {
        return r.permanenciaMeses >= mes;
      }
      return true; // indefinido conta como sobrevivente
    });
    
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

// LTV por canal
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
    
    const cancelados = channelRecords.filter(r => r.status === 'cancelado');
    const ativos = channelRecords.filter(r => r.status === 'ativo');
    
    const ticketMedio = channelRecords.reduce((sum, r) => sum + r.valorMensalidade, 0) / channelRecords.length;
    
    const permanenciaMedia = cancelados.length > 0
      ? cancelados.reduce((sum, r) => sum + (r.permanenciaMeses || 0), 0) / cancelados.length
      : 0;
    
    const ltv = ticketMedio * permanenciaMedia;
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

// Churn mensal (últimos 12 meses)
export function calculateMonthlyChurn(records: LTVRecord[]): MonthlyChurnPoint[] {
  const cancelados = records.filter(r => r.status === 'cancelado' && r.dataCancelamento);
  
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
export function calculateTicketDistribution(records: LTVRecord[]): TicketDistribution[] {
  const faixas = [
    { label: 'R$ 0-100', min: 0, max: 100 },
    { label: 'R$ 101-200', min: 101, max: 200 },
    { label: 'R$ 201-300', min: 201, max: 300 },
    { label: 'R$ 301-400', min: 301, max: 400 },
    { label: 'R$ 401-500', min: 401, max: 500 },
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
      if (valor >= faixas[i].min && valor <= faixas[i].max) {
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

// Tabela de cohort
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
    const cancelados = cohortRecords.filter(r => r.status === 'cancelado');
    
    const ticketMedio = cohortRecords.reduce((sum, r) => sum + r.valorMensalidade, 0) / cohortRecords.length;
    
    const permanenciaMedia = cancelados.length > 0
      ? cancelados.reduce((sum, r) => sum + (r.permanenciaMeses || 0), 0) / cancelados.length
      : 0;
    
    const taxaChurn = (cancelados.length / cohortRecords.length) * 100;
    const taxaRetencao = 100 - taxaChurn;
    const ltv = ticketMedio * permanenciaMedia;
    
    result.push({
      cohort: format(cohortDate, 'MMM/yyyy', { locale: ptBR }),
      cohortDate,
      alunos: cohortRecords.length,
      ticketMedio,
      permanenciaMedia,
      taxaChurn,
      taxaRetencao,
      ltv,
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
