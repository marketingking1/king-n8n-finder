const GOOGLE_API_KEY = 'AIzaSyAVTiqpacILT6HvKmGWGgnqqYfJrcucF7Y';
const SPREADSHEET_ID = '1ep-gKGRFkGoCVK0g0HABPDKjn4Wo4CV6WTgWF23BSL4';
const SHEET_NAME = 'tabela_objetiva';

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

export async function fetchGoogleSheetsData(): Promise<GoogleSheetsData> {
  // Fetch all data from A:L (headers in row 1, data from row 2)
  const range = `${SHEET_NAME}!A:L`;
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
    
    // Skip header row (index 0) and filter out "summary" rows (rows 2-4 with "google"(), "facebook"(), "linkedin"())
    const dataRows = values.slice(1).filter(row => {
      const canal = row[0] || '';
      // Skip rows that look like summary rows or empty
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

    // Calculate totals
    const vendas = rows.reduce((sum, row) => sum + row.conversoes, 0);
    const leads = rows.reduce((sum, row) => sum + row.leads, 0);
    const taxaConversao = leads > 0 ? (vendas / leads) * 100 : 0;

    return { rows, vendas, leads, taxaConversao };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
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
