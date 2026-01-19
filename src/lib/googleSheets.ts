const GOOGLE_API_KEY = 'AIzaSyAVTiqpacILT6HvKmGWGgnqqYfJrcucF7Y';
const SPREADSHEET_ID = '1ep-gKGRFkGoCVK0g0HABPDKjn4Wo4CV6WTgWF23BSL4';
const SHEET_NAME_OBJETIVO = 'tabela_objetivo';
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

function parseNumber(value: string | undefined | null): number {
  if (!value) return 0;
  // Handle comma as decimal separator
  const cleaned = String(value).replace(/[^\d.,-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Macro data interface for Dados_macro_vendas
export interface MacroSheetsRow {
  data: string;
  vendas: number;
  leads: number;
}

export interface MacroSheetsData {
  rows: MacroSheetsRow[];
  totalVendas: number;
  totalLeads: number;
}

// Fetch data from tabela_objetivo (mídia paga - investment/costs)
export async function fetchGoogleSheetsData(): Promise<GoogleSheetsData> {
  const range = `${SHEET_NAME_OBJETIVO}!A:L`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}`;

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
    const dataRows = values.slice(1).filter(row => {
      const canal = row[0] || '';
      return canal && !canal.includes('()') && row.length >= 6;
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

// Fetch data from Dados_macro_vendas (ALL sales - organic + paid)
export async function fetchMacroSheetsData(): Promise<MacroSheetsData> {
  const range = `${SHEET_NAME_MACRO}!A:C`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API error (macro):', errorData);
      throw new Error(`Failed to fetch macro data: ${response.status}`);
    }

    const data = await response.json();
    const values: string[][] = data.values || [];
    
    // Skip header row
    const dataRows = values.slice(1).filter(row => row.length >= 3 && row[0]);

    const rows: MacroSheetsRow[] = dataRows.map(row => ({
      data: row[0] || '',
      vendas: parseNumber(row[1]),
      leads: parseNumber(row[2]),
    }));

    const totalVendas = rows.reduce((sum, row) => sum + row.vendas, 0);
    const totalLeads = rows.reduce((sum, row) => sum + row.leads, 0);

    return { rows, totalVendas, totalLeads };
  } catch (error) {
    console.error('Error fetching macro sheets data:', error);
    throw error;
  }
}

// Filter macro data by date range
export function filterMacroByDateRange(
  rows: MacroSheetsRow[],
  from: Date | undefined,
  to: Date | undefined
): MacroSheetsRow[] {
  return rows.filter(row => {
    if (!row.data) return false;
    const rowDate = new Date(row.data);
    if (from && rowDate < from) return false;
    if (to && rowDate > to) return false;
    return true;
  });
}

// Filter data by date range
export function filterByDateRange(
  rows: SheetsMarketingRow[],
  from: Date | undefined,
  to: Date | undefined
): SheetsMarketingRow[] {
  return rows.filter(row => {
    if (!row.data) return false;
    const rowDate = new Date(row.data);
    if (from && rowDate < from) return false;
    if (to && rowDate > to) return false;
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
