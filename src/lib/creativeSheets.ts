import { format, isValid, parse, parseISO, startOfDay, endOfDay } from 'date-fns';
import { CreativeRawData, CreativeMetrics, CreativeAggregatedMetrics, CreativeFilters } from '@/types/creative';

const GOOGLE_API_KEY = 'AIzaSyAVTiqpacILT6HvKmGWGgnqqYfJrcucF7Y';
const SPREADSHEET_ID = '1ZSG6Mlr-20jnVX5Ap5B_hqZlvDdfyMm4BXVOf3G4SrU';
const SHEET_NAME = 'dados_video_consolidados';

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function parseNumber(value: string | number | undefined | null): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  let str = String(value).trim();
  str = str.replace(/[^\d.,-]/g, '');
  str = str.replace('%', '');

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    str = str.replace(/\./g, '').replace(/,/g, '.');
  } else if (hasComma) {
    str = str.replace(/,/g, '.');
  }

  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
}

function parseSheetDate(value: unknown): Date | null {
  if (value == null || value === '') return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    const serial = value;
    const base = new Date(1899, 11, 30);
    const d = new Date(base.getTime() + serial * 24 * 60 * 60 * 1000);
    return isValid(d) ? d : null;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4,6}$/.test(raw)) {
    const serial = Number(raw);
    if (Number.isFinite(serial)) {
      const base = new Date(1899, 11, 30);
      const d = new Date(base.getTime() + serial * 24 * 60 * 60 * 1000);
      return isValid(d) ? d : null;
    }
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = parseISO(raw.slice(0, 10));
    return isValid(d) ? d : null;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const d = parse(raw, 'dd/MM/yyyy', new Date());
    return isValid(d) ? d : null;
  }

  return null;
}

// Mapeamento das colunas esperadas
interface ColumnIndexes {
  data_edit: number;
  chave_dados_edit: number;
  campanha: number;
  ads: number;
  hook_rate: number;
  hold_rate_25: number;
  completion_rate: number;
  retencao_25_50: number;
  retencao_50_75: number;
  retencao_75_100: number;
  video_avg_time: number;
  actions: number;
  spend: number;
  impressions: number;
  cpm: number;
  ctr: number;
  cpc: number;
  leads: number;
  cpl: number;
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.indexOf(candidate);
    if (idx >= 0) return idx;
  }
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => h.includes(candidate));
    if (idx >= 0) return idx;
  }
  return -1;
}

function resolveColumnIndexes(headerRow: unknown[]): ColumnIndexes {
  const normalized = headerRow.map(normalizeHeader);
  
  return {
    data_edit: findColumnIndex(normalized, ['data edit', 'data_edit', 'data']),
    chave_dados_edit: findColumnIndex(normalized, ['chave dados edit', 'chave_dados_edit', 'chave']),
    campanha: findColumnIndex(normalized, ['campanha', 'campaign']),
    ads: findColumnIndex(normalized, ['ads', 'ad name', 'ad_name', 'anuncio']),
    hook_rate: findColumnIndex(normalized, ['hook rate', 'hook_rate', 'hookrate']),
    hold_rate_25: findColumnIndex(normalized, ['hold rate 3s 25', 'hold_rate_3s_25', 'hold rate 25']),
    completion_rate: findColumnIndex(normalized, ['completion rate', 'completion_rate', 'completionrate']),
    retencao_25_50: findColumnIndex(normalized, ['retencao 25 50', 'retencao 25→50', 'retencao25 50']),
    retencao_50_75: findColumnIndex(normalized, ['retencao 50 75', 'retencao 50→75', 'retencao50 75']),
    retencao_75_100: findColumnIndex(normalized, ['retencao 75 100', 'retencao 75→100', 'retencao75 100']),
    video_avg_time: findColumnIndex(normalized, ['video avg time watched', 'video_avg_time_watched', 'video avg time', 'tempo medio']),
    actions: findColumnIndex(normalized, ['actions', 'acoes']),
    spend: findColumnIndex(normalized, ['spend', 'gasto', 'investimento']),
    impressions: findColumnIndex(normalized, ['impressions', 'impressoes']),
    cpm: findColumnIndex(normalized, ['cpm']),
    ctr: findColumnIndex(normalized, ['ctr']),
    cpc: findColumnIndex(normalized, ['cpc']),
    leads: findColumnIndex(normalized, ['leads']),
    cpl: findColumnIndex(normalized, ['cpl', 'custo por lead']),
  };
}

export async function fetchCreativeData(): Promise<CreativeMetrics[]> {
  const range = `${SHEET_NAME}!A:S`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING&_=${Date.now()}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API error (creative):', errorData);
      throw new Error(`Failed to fetch creative data: ${response.status}`);
    }

    const data = await response.json();
    const values: unknown[][] = data.values || [];

    if (values.length === 0) {
      return [];
    }

    const headerRow = values[0];
    const idx = resolveColumnIndexes(headerRow);

    // Log de debug
    if ((import.meta as any)?.env?.DEV) {
      console.debug('[Creative Sheets] resolvedIndexes', idx);
      console.debug('[Creative Sheets] fetchedRows', values.length - 1);
    }

    const dataRows = values.slice(1).filter(row => {
      const ads = row[idx.ads];
      return Boolean(ads);
    });

    // Encontrar o tempo máximo de vídeo para calcular video_score
    let maxVideoTime = 0;
    dataRows.forEach(row => {
      const time = parseNumber(row[idx.video_avg_time] as string | number);
      if (time > maxVideoTime) maxVideoTime = time;
    });

    const metrics: CreativeMetrics[] = dataRows.map(row => {
      const rawDate = row[idx.data_edit];
      const parsedDate = parseSheetDate(rawDate);
      const normalizedDate = parsedDate ? format(parsedDate, 'yyyy-MM-dd') : String(rawDate ?? '');

      const hook_rate = parseNumber(row[idx.hook_rate] as string | number);
      const hold_rate_25 = parseNumber(row[idx.hold_rate_25] as string | number);
      const completion_rate = parseNumber(row[idx.completion_rate] as string | number);
      const retencao_25_50 = parseNumber(row[idx.retencao_25_50] as string | number);
      const retencao_50_75 = parseNumber(row[idx.retencao_50_75] as string | number);
      const retencao_75_100 = parseNumber(row[idx.retencao_75_100] as string | number);
      const video_avg_time = parseNumber(row[idx.video_avg_time] as string | number);
      const actions = parseNumber(row[idx.actions] as string | number);
      const spend = parseNumber(row[idx.spend] as string | number);
      const impressions = parseNumber(row[idx.impressions] as string | number);
      const cpm = parseNumber(row[idx.cpm] as string | number);
      const ctr = parseNumber(row[idx.ctr] as string | number);
      const cpc = parseNumber(row[idx.cpc] as string | number);
      const leads = parseNumber(row[idx.leads] as string | number);
      const cpl = parseNumber(row[idx.cpl] as string | number);

      // Métricas derivadas
      const clicks = impressions * (ctr / 100);
      const taxa_conversao = clicks > 0 ? (actions / clicks) * 100 : 0;
      const eficiencia = impressions > 0 ? (actions / impressions) * 100 : 0;
      const video_score = maxVideoTime > 0 
        ? (completion_rate + (video_avg_time / maxVideoTime * 100)) / 2 
        : completion_rate;
      const roi_video = spend > 0 ? (actions * video_avg_time) / spend : 0;

      return {
        data_edit: normalizedDate,
        chave_dados_edit: String(row[idx.chave_dados_edit] ?? ''),
        campanha: String(row[idx.campanha] ?? ''),
        ads: String(row[idx.ads] ?? ''),
        hook_rate,
        hold_rate_25,
        completion_rate,
        retencao_25_50,
        retencao_50_75,
        retencao_75_100,
        video_avg_time,
        actions,
        spend,
        impressions,
        cpm,
        ctr,
        cpc,
        leads,
        cpl,
        // Derivadas
        clicks,
        taxa_conversao,
        eficiencia,
        video_score,
        roi_video,
      };
    });

    return metrics;
  } catch (error) {
    console.error('Error fetching creative data:', error);
    throw error;
  }
}

// Filtrar dados por filtros
export function filterCreativeData(
  data: CreativeMetrics[],
  filters: CreativeFilters
): CreativeMetrics[] {
  let filtered = [...data];

  // Filtro de data
  if (filters.dateRange.from || filters.dateRange.to) {
    const fromDay = filters.dateRange.from ? startOfDay(filters.dateRange.from) : undefined;
    const toDay = filters.dateRange.to ? endOfDay(filters.dateRange.to) : undefined;

    filtered = filtered.filter(row => {
      const rowDate = parseSheetDate(row.data_edit);
      if (!rowDate || !isValid(rowDate)) return false;
      if (fromDay && rowDate < fromDay) return false;
      if (toDay && rowDate > toDay) return false;
      return true;
    });
  }

  // Filtro de campanhas
  if (filters.campanhas.length > 0) {
    filtered = filtered.filter(row => filters.campanhas.includes(row.campanha));
  }

  // Filtro de tipos de criativo (extrair do prefixo do ads)
  if (filters.tiposCriativo.length > 0) {
    filtered = filtered.filter(row => {
      const tipo = extractTipoCriativo(row.ads);
      return filters.tiposCriativo.includes(tipo);
    });
  }

  // Filtro de variantes
  if (filters.variantes.length > 0) {
    filtered = filtered.filter(row => {
      const variante = extractVariante(row.ads);
      return filters.variantes.includes(variante);
    });
  }

  // Apenas vídeo
  if (filters.apenasVideo) {
    filtered = filtered.filter(row => row.video_avg_time > 0);
  }

  // Mínimo de impressões
  if (filters.minImpressoes > 0) {
    filtered = filtered.filter(row => row.impressions >= filters.minImpressoes);
  }

  return filtered;
}

// Extrair tipo de criativo do nome do ad
export function extractTipoCriativo(adsName: string): string {
  // Extrai o prefixo antes do último "_v"
  const match = adsName.match(/^(.+?)(?:_v\d+)?$/);
  return match ? match[1] : adsName;
}

// Extrair variante do nome do ad
export function extractVariante(adsName: string): string {
  const match = adsName.match(/_v(\d+)$/);
  return match ? `v${match[1]}` : 'v1';
}

// Calcular métricas agregadas
export function calculateAggregatedMetrics(data: CreativeMetrics[]): CreativeAggregatedMetrics {
  if (data.length === 0) {
    return {
      hook_rate_avg: 0,
      hold_rate_25_avg: 0,
      completion_rate_avg: 0,
      retencao_25_50_avg: 0,
      retencao_50_75_avg: 0,
      retencao_75_100_avg: 0,
      video_avg_time_avg: 0,
      actions_total: 0,
      leads_total: 0,
      spend_total: 0,
      impressions_total: 0,
      cpm_avg: 0,
      ctr_avg: 0,
      cpc_avg: 0,
      cpl_avg: 0,
      taxa_conversao_avg: 0,
      eficiencia_avg: 0,
      video_score_avg: 0,
      roi_video_avg: 0,
    };
  }

  const count = data.length;
  const sum = data.reduce(
    (acc, row) => ({
      hook_rate: acc.hook_rate + row.hook_rate,
      hold_rate_25: acc.hold_rate_25 + row.hold_rate_25,
      completion_rate: acc.completion_rate + row.completion_rate,
      retencao_25_50: acc.retencao_25_50 + row.retencao_25_50,
      retencao_50_75: acc.retencao_50_75 + row.retencao_50_75,
      retencao_75_100: acc.retencao_75_100 + row.retencao_75_100,
      video_avg_time: acc.video_avg_time + row.video_avg_time,
      actions: acc.actions + row.actions,
      leads: acc.leads + row.leads,
      spend: acc.spend + row.spend,
      impressions: acc.impressions + row.impressions,
      cpm: acc.cpm + row.cpm,
      ctr: acc.ctr + row.ctr,
      cpc: acc.cpc + row.cpc,
      cpl: acc.cpl + row.cpl,
      taxa_conversao: acc.taxa_conversao + row.taxa_conversao,
      eficiencia: acc.eficiencia + row.eficiencia,
      video_score: acc.video_score + row.video_score,
      roi_video: acc.roi_video + row.roi_video,
    }),
    {
      hook_rate: 0,
      hold_rate_25: 0,
      completion_rate: 0,
      retencao_25_50: 0,
      retencao_50_75: 0,
      retencao_75_100: 0,
      video_avg_time: 0,
      actions: 0,
      leads: 0,
      spend: 0,
      impressions: 0,
      cpm: 0,
      ctr: 0,
      cpc: 0,
      cpl: 0,
      taxa_conversao: 0,
      eficiencia: 0,
      video_score: 0,
      roi_video: 0,
    }
  );

  return {
    hook_rate_avg: sum.hook_rate / count,
    hold_rate_25_avg: sum.hold_rate_25 / count,
    completion_rate_avg: sum.completion_rate / count,
    retencao_25_50_avg: sum.retencao_25_50 / count,
    retencao_50_75_avg: sum.retencao_50_75 / count,
    retencao_75_100_avg: sum.retencao_75_100 / count,
    video_avg_time_avg: sum.video_avg_time / count,
    actions_total: sum.actions,
    leads_total: sum.leads,
    spend_total: sum.spend,
    impressions_total: sum.impressions,
    cpm_avg: sum.cpm / count,
    ctr_avg: sum.ctr / count,
    cpc_avg: sum.cpc / count,
    cpl_avg: sum.cpl / count,
    taxa_conversao_avg: sum.taxa_conversao / count,
    eficiencia_avg: sum.eficiencia / count,
    video_score_avg: sum.video_score / count,
    roi_video_avg: sum.roi_video / count,
  };
}

// Extrair opções de filtro únicas
export function extractCreativeFilterOptions(data: CreativeMetrics[]) {
  const campanhas = [...new Set(data.map(r => r.campanha).filter(Boolean))].sort();
  const tiposCriativo = [...new Set(data.map(r => extractTipoCriativo(r.ads)).filter(Boolean))].sort();
  const variantes = [...new Set(data.map(r => extractVariante(r.ads)).filter(Boolean))].sort();
  const maxImpressoes = Math.max(...data.map(r => r.impressions), 0);

  return { campanhas, tiposCriativo, variantes, maxImpressoes };
}
