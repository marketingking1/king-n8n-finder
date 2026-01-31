import { isValid } from 'date-fns';
import { VideoCreativeRow, AggregatedCreative, DerivedMetrics, CreativeKPIs } from '@/types/creative';

// Bug 8: API key from environment variable
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';

// Planilha de criativos de vídeo
const SPREADSHEET_ID_CREATIVES = '1ZSG6Mlr-20jnVX5Ap5B_hqZlvDdfyMm4BXVOf3G4SrU';
const SHEET_NAME_CREATIVES = 'dados_video_consolidados';

// Bug 3: Converter serial Excel para Date usando UTC
export const excelSerialToDate = (serial: number): Date => {
  const utcDays = Math.floor(serial - 25569); // 25569 = dias entre 30/12/1899 e 01/01/1970
  const date = new Date(0);
  date.setUTCDate(date.getUTCDate() + utcDays);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// Bug 1: Simplified parsing for FORMATTED_VALUE (always strings)
export const parsePercentBR = (value: string | null | undefined): number | null => {
  if (value == null || String(value).trim() === '') return null;
  const cleaned = String(value).replace('%', '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

// Bug 2: Use regex /\./g to remove ALL dots (thousand separators)
export const parseDecimalBR = (value: string | null | undefined): number => {
  if (value == null || String(value).trim() === '') return 0;
  const cleaned = String(value).replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Bug 2: Use regex /\./g to remove ALL dots
export const parseCurrencyBR = (value: string | null | undefined): number => {
  if (value == null || String(value).trim() === '') return 0;
  const cleaned = String(value).replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Divisão segura (kept for aggregation functions)
export const safeDivide = (a: number, b: number, fallback: number = 0): number =>
  b === 0 ? fallback : a / b;

// Converter row da planilha para interface tipada
const parseSheetRow = (row: (string | number | null)[]): VideoCreativeRow => ({
  dataEdit: parseInt(String(row[0])) || 0,
  chaveDadosEdit: String(row[1] || ''),
  campanha: String(row[2] || ''),
  ads: String(row[3] || ''),
  hookRate: parsePercentBR(row[4] != null ? String(row[4]) : null),
  holdRate3s25: parsePercentBR(row[5] != null ? String(row[5]) : null),
  completionRate: parsePercentBR(row[6] != null ? String(row[6]) : null),
  retention25_50: parsePercentBR(row[7] != null ? String(row[7]) : null),
  retention50_75: parsePercentBR(row[8] != null ? String(row[8]) : null),
  retention75_100: parsePercentBR(row[9] != null ? String(row[9]) : null),
  videoAvgTimeWatched: parseInt(String(row[10])) || 0,
  spend: parseDecimalBR(row[11] != null ? String(row[11]) : null),
  impressions: parseInt(String(row[12])) || 0,
  cpm: parseDecimalBR(row[13] != null ? String(row[13]) : null),
  ctr: parseDecimalBR(row[14] != null ? String(row[14]) : null),
  cpc: parseDecimalBR(row[15] != null ? String(row[15]) : null),
  leads: parseInt(String(row[16])) || 0,
  cpl: parseCurrencyBR(row[17] != null ? String(row[17]) : null),
});

// Bug 9: Simplified deriveMetrics without unnecessary safeDivide
export const deriveMetrics = (row: VideoCreativeRow): DerivedMetrics => {
  const views3s = Math.round(((row.hookRate ?? 0) / 100) * row.impressions);
  const views25pct = Math.round(((row.holdRate3s25 ?? 0) / 100) * views3s);
  const views50pct = Math.round(((row.retention25_50 ?? 0) / 100) * views25pct);
  const views75pct = Math.round(((row.retention50_75 ?? 0) / 100) * views50pct);
  const views100pct = Math.round(((row.retention75_100 ?? 0) / 100) * views75pct);
  const clicks = Math.round((row.ctr / 100) * row.impressions);

  return { views3s, views25pct, views50pct, views75pct, views100pct, clicks };
};

// Bug 7: Fixed formatCreativeName to avoid double spaces
export const formatCreativeName = (ads: string): string => {
  return ads
    .replace(/_/g, ' ')
    .replace(/\bv(\d+)/gi, 'V$1')          // normalizar v1/V1 sem espaço extra
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/\s+/g, ' ')                   // colapsar espaços múltiplos
    .trim();
};

// Bug 6: Agregar por criativo com chave composta para evitar duplicatas
export const aggregateByCreative = (rows: VideoCreativeRow[]): AggregatedCreative[] => {
  // Detectar duplicatas: mesmo ads + mesma campanha + mesma data
  const seen = new Map<string, number>();
  const rowsWithKey = rows.map(row => {
    const baseKey = `${row.ads}__${row.campanha}__${row.dataEdit}`;
    const count = (seen.get(baseKey) || 0) + 1;
    seen.set(baseKey, count);
    const uniqueAds = count > 1 ? `${row.ads}_v${count}` : row.ads;
    return { ...row, uniqueAds };
  });

  const grouped = new Map<string, (VideoCreativeRow & { uniqueAds: string })[]>();
  rowsWithKey.forEach(row => {
    const key = row.uniqueAds;
    const existing = grouped.get(key) || [];
    existing.push(row);
    grouped.set(key, existing);
  });

  return Array.from(grouped.entries()).map(([ads, group]) => {
    const totalImpressions = group.reduce((sum, r) => sum + r.impressions, 0);
    const totalSpend = group.reduce((sum, r) => sum + r.spend, 0);
    const totalLeads = group.reduce((sum, r) => sum + r.leads, 0);

    // Média ponderada por impressions
    const weightedAvg = (getter: (r: VideoCreativeRow) => number | null): number => {
      const validRows = group.filter(r => getter(r) !== null && r.impressions > 0);
      if (validRows.length === 0) return 0;
      const totalImp = validRows.reduce((s, r) => s + r.impressions, 0);
      return validRows.reduce((s, r) => s + (getter(r) ?? 0) * r.impressions, 0) / totalImp;
    };

    const dates = group.map(r => r.dataEdit).sort((a, b) => a - b);
    const totalClicks = group.reduce((sum, r) => {
      const derived = deriveMetrics(r);
      return sum + derived.clicks;
    }, 0);

    return {
      ads,
      displayName: formatCreativeName(ads),
      campanhas: [...new Set(group.map(r => r.campanha))],
      totalSpend,
      totalImpressions,
      totalLeads,
      avgHookRate: weightedAvg(r => r.hookRate),
      avgHoldRate: weightedAvg(r => r.holdRate3s25),
      avgCompletionRate: weightedAvg(r => r.completionRate),
      avgRetention25_50: weightedAvg(r => r.retention25_50),
      avgRetention50_75: weightedAvg(r => r.retention50_75),
      avgRetention75_100: weightedAvg(r => r.retention75_100),
      avgWatchTime: weightedAvg(r => r.videoAvgTimeWatched),
      avgCpm: safeDivide(totalSpend, totalImpressions) * 1000,
      avgCtr: weightedAvg(r => r.ctr),
      avgCpc: safeDivide(totalSpend, totalClicks),
      avgCpl: safeDivide(totalSpend, totalLeads),
      totalDays: new Set(group.map(r => r.dataEdit)).size,
      dateRange: {
        start: excelSerialToDate(dates[0]),
        end: excelSerialToDate(dates[dates.length - 1]),
      },
    };
  }).sort((a, b) => b.totalSpend - a.totalSpend);
};

// Calcular KPIs consolidados
export const calculateCreativeKPIs = (rows: VideoCreativeRow[]): CreativeKPIs => {
  const totalImpressions = rows.reduce((sum, r) => sum + r.impressions, 0);
  const totalSpend = rows.reduce((sum, r) => sum + r.spend, 0);
  const totalLeads = rows.reduce((sum, r) => sum + r.leads, 0);
  
  // Calcular total de views 50% usando deriveMetrics
  const totalViews50pct = rows.reduce((sum, r) => {
    const derived = deriveMetrics(r);
    return sum + derived.views50pct;
  }, 0);

  const weightedAvg = (getter: (r: VideoCreativeRow) => number | null): number => {
    const validRows = rows.filter(r => getter(r) !== null && r.impressions > 0);
    if (validRows.length === 0) return 0;
    const totalImp = validRows.reduce((s, r) => s + r.impressions, 0);
    return validRows.reduce((s, r) => s + (getter(r) ?? 0) * r.impressions, 0) / totalImp;
  };

  return {
    totalInvestimento: totalSpend,
    totalImpressions,
    avgHookRate: weightedAvg(r => r.hookRate),
    avgHoldRate: weightedAvg(r => r.holdRate3s25),
    avgCompletionRate: weightedAvg(r => r.completionRate),
    avgWatchTime: weightedAvg(r => r.videoAvgTimeWatched),
    totalLeads,
    totalViews50pct,
    avgCpl: safeDivide(totalSpend, totalLeads),
    avgCpm: safeDivide(totalSpend, totalImpressions) * 1000,
    avgCtr: weightedAvg(r => r.ctr),
  };
};

// Fetch data from dados_video_consolidados
export async function fetchCreativeData(): Promise<VideoCreativeRow[]> {
  // Bug 8: Validate API key
  if (!GOOGLE_API_KEY) {
    throw new Error('VITE_GOOGLE_SHEETS_API_KEY não configurada. Adicione em Settings > Environment Variables.');
  }

  const range = `${SHEET_NAME_CREATIVES}!A:R`;
  // Bug 1: Use FORMATTED_VALUE to get strings like "23,18%" instead of 0.2318
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID_CREATIVES}/values/${range}?key=${GOOGLE_API_KEY}&valueRenderOption=FORMATTED_VALUE&_=${Date.now()}`;

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
    const values: (string | number | null)[][] = data.values || [];

    // Bug 4: Skip header row and filter valid rows with proper validation
    const rows = values.slice(1)
      .filter(row => {
        const dataEdit = parseInt(String(row[0]));
        const ads = row[3];
        const impressions = parseInt(String(row[12]));
        return dataEdit > 0 && ads && impressions > 0;
      })
      .map(row => parseSheetRow(row));

    return rows;
  } catch (error) {
    console.error('Error fetching creative data:', error);
    throw error;
  }
}

// Cores de performance (semáforo)
export const getHookRateColor = (value: number | null): string => {
  if (value === null) return 'hsl(var(--muted))';
  if (value < 15) return 'hsl(0, 84%, 60%)';     // vermelho
  if (value < 25) return 'hsl(38, 92%, 50%)';   // amarelo
  return 'hsl(142, 76%, 36%)';                   // verde
};

export const getHoldRateColor = (value: number | null): string => {
  if (value === null) return 'hsl(var(--muted))';
  if (value < 20) return 'hsl(0, 84%, 60%)';
  if (value < 30) return 'hsl(38, 92%, 50%)';
  return 'hsl(142, 76%, 36%)';
};

export const getCplColor = (value: number): string => {
  if (value === 0) return 'hsl(var(--muted))';
  if (value > 20) return 'hsl(0, 84%, 60%)';     // caro
  if (value > 10) return 'hsl(38, 92%, 50%)';   // atenção
  return 'hsl(142, 76%, 36%)';                   // bom
};

// Bug 3 & 4: Filtrar por data com normalização de timezone/hora
export function filterCreativesByDateRange(
  rows: VideoCreativeRow[],
  from: Date | undefined,
  to: Date | undefined
): VideoCreativeRow[] {
  if (!from && !to) return rows;

  return rows.filter(row => {
    // Bug 4: Filter invalid dates
    if (row.dataEdit <= 0) return false;

    const rowDate = excelSerialToDate(row.dataEdit);

    if (from) {
      const fromStart = new Date(from);
      fromStart.setHours(0, 0, 0, 0);
      if (rowDate < fromStart) return false;
    }

    if (to) {
      const toEnd = new Date(to);
      toEnd.setHours(23, 59, 59, 999);
      if (rowDate > toEnd) return false;
    }

    return true;
  });
}

// Extrair opções de filtro
export function extractCreativeFilterOptions(rows: VideoCreativeRow[]) {
  const campanhas = [...new Set(rows.map(r => r.campanha).filter(Boolean))].sort();
  const criativos = [...new Set(rows.map(r => r.ads).filter(Boolean))].sort();
  return { campanhas, criativos };
}
