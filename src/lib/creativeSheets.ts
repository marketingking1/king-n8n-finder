import { isValid } from 'date-fns';
import { VideoCreativeRow, AggregatedCreative, DerivedMetrics, CreativeKPIs } from '@/types/creative';

const GOOGLE_API_KEY = 'AIzaSyAVTiqpacILT6HvKmGWGgnqqYfJrcucF7Y';

// Planilha de criativos de vídeo
const SPREADSHEET_ID_CREATIVES = '1ZSG6Mlr-20jnVX5Ap5B_hqZlvDdfyMm4BXVOf3G4SrU';
const SHEET_NAME_CREATIVES = 'dados_video_consolidados';

// Converter serial Excel para Date
export const excelSerialToDate = (serial: number): Date => {
  const base = new Date(1899, 11, 30);
  return new Date(base.getTime() + serial * 24 * 60 * 60 * 1000);
};

// Converter "23,18%" → 23.18 | "" → null
export const parsePercentBR = (value: string | number | null | undefined): number | null => {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace('%', '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

// Converter "441,19" → 441.19
export const parseDecimalBR = (value: string | number | null | undefined): number => {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Converter "R$ 22,54" → 22.54 | "R$ 0,00" → 0
export const parseCurrencyBR = (value: string | number | null | undefined): number => {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace('R$', '').replace('.', '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Divisão segura
export const safeDivide = (a: number, b: number, fallback: number = 0): number =>
  b === 0 ? fallback : a / b;

// Converter row da planilha para interface tipada
const parseSheetRow = (row: (string | number | null)[]): VideoCreativeRow => ({
  dataEdit: parseInt(String(row[0])) || 0,
  chaveDadosEdit: String(row[1] || ''),
  campanha: String(row[2] || ''),
  ads: String(row[3] || ''),
  hookRate: parsePercentBR(row[4]),
  holdRate3s25: parsePercentBR(row[5]),
  completionRate: parsePercentBR(row[6]),
  retention25_50: parsePercentBR(row[7]),
  retention50_75: parsePercentBR(row[8]),
  retention75_100: parsePercentBR(row[9]),
  videoAvgTimeWatched: parseInt(String(row[10])) || 0,
  spend: parseDecimalBR(row[11]),
  impressions: parseInt(String(row[12])) || 0,
  cpm: parseDecimalBR(row[13]),
  ctr: parseDecimalBR(row[14]),
  cpc: parseDecimalBR(row[15]),
  leads: parseInt(String(row[16])) || 0,
  cpl: parseCurrencyBR(row[17]),
});

// Back-calculate absolute view counts
export const deriveMetrics = (row: VideoCreativeRow): DerivedMetrics => {
  const views3s = Math.round(
    safeDivide((row.hookRate ?? 0) * row.impressions, 100)
  );
  const views25pct = Math.round(
    safeDivide((row.holdRate3s25 ?? 0) * views3s, 100)
  );
  const views50pct = Math.round(
    safeDivide((row.retention25_50 ?? 0) * views25pct, 100)
  );
  const views75pct = Math.round(
    safeDivide((row.retention50_75 ?? 0) * views50pct, 100)
  );
  const views100pct = Math.round(
    safeDivide((row.retention75_100 ?? 0) * views75pct, 100)
  );
  const clicks = Math.round(
    safeDivide(row.ctr * row.impressions, 100)
  );

  return { views3s, views25pct, views50pct, views75pct, views100pct, clicks };
};

// Formatar nome do criativo para exibição
export const formatCreativeName = (ads: string): string => {
  return ads
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/V(\d+)/g, ' V$1')
    .trim();
};

// Agregar por criativo (média ponderada por impressions)
export const aggregateByCreative = (rows: VideoCreativeRow[]): AggregatedCreative[] => {
  const grouped = new Map<string, VideoCreativeRow[]>();

  rows.forEach(row => {
    const existing = grouped.get(row.ads) || [];
    existing.push(row);
    grouped.set(row.ads, existing);
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
    avgCpl: safeDivide(totalSpend, totalLeads),
    avgCpm: safeDivide(totalSpend, totalImpressions) * 1000,
    avgCtr: weightedAvg(r => r.ctr),
  };
};

// Fetch data from dados_video_consolidados
export async function fetchCreativeData(): Promise<VideoCreativeRow[]> {
  const range = `${SHEET_NAME_CREATIVES}!A:R`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID_CREATIVES}/values/${range}?key=${GOOGLE_API_KEY}&valueRenderOption=UNFORMATTED_VALUE&_=${Date.now()}`;

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

    // Skip header row and filter valid rows
    const rows = values.slice(1)
      .filter(row => {
        const ads = row[3];
        const impressions = row[12];
        return ads && impressions;
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

// Filtrar por data
export function filterCreativesByDateRange(
  rows: VideoCreativeRow[],
  from: Date | undefined,
  to: Date | undefined
): VideoCreativeRow[] {
  if (!from && !to) return rows;

  return rows.filter(row => {
    const rowDate = excelSerialToDate(row.dataEdit);
    if (!isValid(rowDate)) return false;
    if (from && rowDate < from) return false;
    if (to && rowDate > to) return false;
    return true;
  });
}

// Extrair opções de filtro
export function extractCreativeFilterOptions(rows: VideoCreativeRow[]) {
  const campanhas = [...new Set(rows.map(r => r.campanha).filter(Boolean))].sort();
  const criativos = [...new Set(rows.map(r => r.ads).filter(Boolean))].sort();
  return { campanhas, criativos };
}
