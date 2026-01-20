import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';

const GOOGLE_API_KEY = 'AIzaSyAVTiqpacILT6HvKmGWGgnqqYfJrcucF7Y';

// Planilha 1: tabela_objetivo (mídia paga - investimento/custos)
const SPREADSHEET_ID_OBJETIVO = '1ep-gKGRFkGoCVK0g0HABPDKjn4Wo4CV6WTgWF23BSL4';
const SHEET_NAME_OBJETIVO = 'tabela_objetivo';

// Planilha 2: Dados_macro_vendas (todas as vendas - orgânico + mídia)
const SPREADSHEET_ID_MACRO = '1FLAmZ4rL2OmxABfIyiPSl9UTgmsC4zc8m039c175ix4';
const SHEET_NAME_MACRO = 'Dados_macro_vendas';

export interface SheetsMarketingRow {
  canal: string;
  campanha: string;
  data: string;
  grupo_anuncio: string;
  impressoes: number;
  cliques: number;
  investimento: number;
  leads: number;
  conversoes: number;
  receita: number;
}

export interface GoogleSheetsData {
  rows: SheetsMarketingRow[];
  vendas: number;
  leads: number;
  taxaConversao: number;
}

function parseNumber(value: string | number | undefined | null): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  // Supports both formats:
  // - pt-BR: "1.234,56"
  // - en-US: "1234.56"
  let str = String(value).trim();
  str = str.replace(/[^\d.,-]/g, '');

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    // Assume dot is thousands separator and comma is decimal separator
    str = str.replace(/\./g, '').replace(/,/g, '.');
  } else if (hasComma) {
    // Assume comma is decimal separator
    str = str.replace(/,/g, '.');
  }

  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
}

// Macro data interface for Dados_macro_vendas (monthly summary)
export interface MacroSheetsData {
  totalVendas: number;
  totalLeads: number;
  custoVendedor: number;
}

// Fetch data from tabela_objetivo (mídia paga - investment/costs)
export async function fetchGoogleSheetsData(): Promise<GoogleSheetsData> {
  // Use A:J range (excludes ID columns K,L) to ensure all data rows are fetched
  const range = `${SHEET_NAME_OBJETIVO}!A:J`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID_OBJETIVO}/values/${range}?key=${GOOGLE_API_KEY}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API error:', errorData);
      throw new Error(`Failed to fetch Google Sheets data: ${response.status}`);
    }

    const data = await response.json();
    const values: string[][] = data.values || [];
    
    // Skip header row and filter out summary rows
    // NOTE: Sheets API trims trailing empty cells; do not rely on row.length.
    const dataRows = values.slice(1).filter(row => {
      const canal = row[0] || '';
      const date = row[2] || '';
      return Boolean(canal) && !canal.includes('()') && Boolean(date);
    });

    const rows: SheetsMarketingRow[] = dataRows.map(row => ({
      canal: row[0] || '',
      campanha: row[1] || '',
      data: row[2] || '',
      grupo_anuncio: row[3] || '',
      impressoes: parseNumber(row[4]),
      cliques: parseNumber(row[5]),
      investimento: parseNumber(row[6]),
      leads: parseNumber(row[7]),
      conversoes: parseNumber(row[8]),
      receita: parseNumber(row[9]),
    }));

    // Note: vendas/leads totals here are from tracked paid media only
    const vendas = rows.reduce((sum, row) => sum + row.conversoes, 0);
    const leads = rows.reduce((sum, row) => sum + row.leads, 0);
    const taxaConversao = leads > 0 ? (vendas / leads) * 100 : 0;

    return { rows, vendas, leads, taxaConversao };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
}

// Fetch data from Dados_macro_vendas (ALL sales - organic + paid - monthly summary)
export async function fetchMacroSheetsData(): Promise<MacroSheetsData> {
  const range = `${SHEET_NAME_MACRO}!A:C`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID_MACRO}/values/${range}?key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API error (macro):', errorData);
      throw new Error(`Failed to fetch macro data: ${response.status}`);
    }

    const data = await response.json();
    const values: string[][] = data.values || [];
    
    // Row 2 contains the totals (row 1 is header)
    const totalsRow = values[1] || [];
    
    return {
      totalVendas: parseNumber(totalsRow[0]),
      totalLeads: parseNumber(totalsRow[1]),
      custoVendedor: parseNumber(totalsRow[2]),
    };
  } catch (error) {
    console.error('Error fetching macro sheets data:', error);
    throw error;
  }
}

// Filter data by date range
export function filterByDateRange(
  rows: SheetsMarketingRow[],
  from: Date | undefined,
  to: Date | undefined
): SheetsMarketingRow[] {
  const fromDay = from ? startOfDay(from) : undefined;
  const toDay = to ? endOfDay(to) : undefined;

  return rows.filter(row => {
    if (!row.data) return false;
    // IMPORTANT: do not use `new Date('YYYY-MM-DD')` (UTC parsing causes off-by-one-day in BR).
    const rowDate = parseISO(row.data);
    if (!isValid(rowDate)) return false;
    if (fromDay && rowDate < fromDay) return false;
    if (toDay && rowDate > toDay) return false;
    return true;
  });
}

// Filter data by selected filters
export function filterRows(
  rows: SheetsMarketingRow[],
  filters: {
    dateRange: { from: Date | undefined; to: Date | undefined };
    campanhas: string[];
    grupos: string[];
    canais: string[];
  }
): SheetsMarketingRow[] {
  let filtered = filterByDateRange(rows, filters.dateRange.from, filters.dateRange.to);

  if (filters.campanhas.length > 0) {
    filtered = filtered.filter(row => filters.campanhas.includes(row.campanha));
  }
  if (filters.grupos.length > 0) {
    filtered = filtered.filter(row => filters.grupos.includes(row.grupo_anuncio));
  }
  if (filters.canais.length > 0) {
    filtered = filtered.filter(row => filters.canais.includes(row.canal));
  }

  return filtered;
}

// Extract unique filter options
export function extractFilterOptions(rows: SheetsMarketingRow[]) {
  const campanhas = [...new Set(rows.map(r => r.campanha).filter(Boolean))].sort();
  const grupos = [...new Set(rows.map(r => r.grupo_anuncio).filter(Boolean))].sort();
  const canais = [...new Set(rows.map(r => r.canal).filter(Boolean))].sort();
  return { campanhas, grupos, canais };
}
