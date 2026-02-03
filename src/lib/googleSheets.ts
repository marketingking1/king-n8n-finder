import { endOfDay, format, isValid, parse, parseISO, startOfDay } from 'date-fns';

const GOOGLE_API_KEY = 'AIzaSyAVTiqpacILT6HvKmGWGgnqqYfJrcucF7Y';

// Planilha 1: tabela_objetivo (mídia paga - investimento/custos)
const SPREADSHEET_ID_OBJETIVO = '1ep-gKGRFkGoCVK0g0HABPDKjn4Wo4CV6WTgWF23BSL4';
const SHEET_NAME_OBJETIVO = 'tabela_objetivo';

// Planilha 2: LOVABLE_HISTORICO_2026 (fonte principal para métricas Macro 2026)
const SPREADSHEET_ID_2026 = '1qS646MJtNvxmMDRMTrFQqX6CKtPJRItbhd0t6stb1HM';
const SHEET_NAME_2026 = 'LOVABLE_HISTORICO_2026';
const SHEET_NAME_CUSTO_VENDAS = 'CUSTO_VENDAS';

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

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    // remove accents/diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // normalize separators
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function indexToColumnLetter(index: number): string {
  // 0 -> A, 25 -> Z, 26 -> AA
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const mod = (n - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function parseSheetDate(value: unknown): Date | null {
  if (value == null || value === '') return null;

  // Google Sheets can sometimes return "serial" date numbers (e.g. 46041)
  // when a column loses date formatting or valueRenderOption changes.
  // In Sheets/Excel, day 1 is 1899-12-31; the common JS-friendly base is 1899-12-30.
  if (typeof value === 'number' && Number.isFinite(value)) {
    const serial = value;
    const base = new Date(1899, 11, 30);
    const d = new Date(base.getTime() + serial * 24 * 60 * 60 * 1000);
    return isValid(d) ? d : null;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // Serial date but as a string
  if (/^\d{4,6}$/.test(raw)) {
    const serial = Number(raw);
    if (Number.isFinite(serial)) {
      const base = new Date(1899, 11, 30);
      const d = new Date(base.getTime() + serial * 24 * 60 * 60 * 1000);
      return isValid(d) ? d : null;
    }
  }

  // Most common: 2026-01-20 or 2026-01-20T... or 2026-01-20 00:00:00
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = parseISO(raw.slice(0, 10));
    return isValid(d) ? d : null;
  }

  // Sometimes sheets can format as dd/MM/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const d = parse(raw, 'dd/MM/yyyy', new Date());
    return isValid(d) ? d : null;
  }

  return null;
}

type SheetColumnIndexes = {
  canal: number;
  campanha: number;
  data: number;
  grupo_anuncio: number;
  impressoes: number;
  cliques: number;
  investimento: number;
  leads: number;
  conversoes: number;
  receita: number;
};

const DEFAULT_INDEXES: SheetColumnIndexes = {
  canal: 0,
  campanha: 1,
  data: 2,
  grupo_anuncio: 3,
  impressoes: 4,
  cliques: 5,
  investimento: 6,
  leads: 7,
  conversoes: 8,
  receita: 9,
};

function findColumnIndex(headers: string[], candidates: string[]): number {
  // Prefer exact match, then "contains" match (handles headers like "Gasto (R$)" after sheet updates).
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

function scoreHeaderRow(headers: string[], candidates: Record<keyof SheetColumnIndexes, string[]>): number {
  let score = 0;
  for (const key of Object.keys(candidates) as (keyof SheetColumnIndexes)[]) {
    if (findColumnIndex(headers, candidates[key]) >= 0) score += 1;
  }
  return score;
}

function isMostlyEmptyRow(row: unknown[]): boolean {
  const normalized = row.map(normalizeHeader).filter(Boolean);
  return normalized.length === 0;
}

function resolveSheetColumnIndexes(headerRow: unknown[]): SheetColumnIndexes {
  const normalized = headerRow.map(normalizeHeader);
  if (normalized.every(h => !h)) return DEFAULT_INDEXES;

  const resolved: Partial<SheetColumnIndexes> = {
    canal: findColumnIndex(normalized, ['canal', 'channel']),
    campanha: findColumnIndex(normalized, ['campanha', 'campaign name', 'campaign', 'campaign_name']),
    data: findColumnIndex(normalized, ['data', 'date']),
    grupo_anuncio: findColumnIndex(normalized, ['grupo_anuncio', 'grupo anuncio', 'grupo', 'ad group', 'adgroup']),
    impressoes: findColumnIndex(normalized, ['impressoes', 'imressoes', 'impressions']),
    cliques: findColumnIndex(normalized, ['cliques', 'clicks']),
    investimento: findColumnIndex(normalized, ['investimento', 'gasto', 'spend', 'custo', 'cost']),
    leads: findColumnIndex(normalized, ['leads']),
    conversoes: findColumnIndex(normalized, ['conversoes', 'conversao', 'vendas', 'conversions']),
    receita: findColumnIndex(normalized, ['receita', 'revenue']),
  };

  // Fallback to defaults when a header isn't found.
  return {
    canal: resolved.canal ?? DEFAULT_INDEXES.canal,
    campanha: resolved.campanha ?? DEFAULT_INDEXES.campanha,
    data: resolved.data ?? DEFAULT_INDEXES.data,
    grupo_anuncio: resolved.grupo_anuncio ?? DEFAULT_INDEXES.grupo_anuncio,
    impressoes: resolved.impressoes ?? DEFAULT_INDEXES.impressoes,
    cliques: resolved.cliques ?? DEFAULT_INDEXES.cliques,
    investimento: resolved.investimento ?? DEFAULT_INDEXES.investimento,
    leads: resolved.leads ?? DEFAULT_INDEXES.leads,
    conversoes: resolved.conversoes ?? DEFAULT_INDEXES.conversoes,
    receita: resolved.receita ?? DEFAULT_INDEXES.receita,
  };
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

// Interface para cada linha de LEADS_COMPRADORES
export interface BuyerRow {
  telefone: string;
  canal: string;
  valorCompra: number;
  dataCompra: string; // normalizado para yyyy-MM-dd
}

// Dados agregados de LEADS_COMPRADORES por canal
export interface BuyersByChannel {
  canal: string;
  vendas: number;       // count de linhas (cada linha = 1 venda)
  receita: number;      // sum de valorCompra
  ticketMedio: number;  // receita / vendas
}

// Fetch data from COMPRADORES_PLATAFORMA_EDIT (vendas reais por canal)
export async function fetchLeadsCompradoresData(): Promise<BuyerRow[]> {
  const SHEET_NAME = 'COMPRADORES_PLATAFORMA_EDIT';
  const range = `${SHEET_NAME}!A:C`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID_OBJETIVO}/values/${range}?key=${GOOGLE_API_KEY}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING&_=${Date.now()}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API error (COMPRADORES_PLATAFORMA_EDIT):', errorData);
      throw new Error(`Failed to fetch COMPRADORES_PLATAFORMA_EDIT: ${response.status}`);
    }

    const data = await response.json();
    const values: any[][] = data.values || [];

    if (values.length < 2) return [];

    // Header row: EDIT_DATA, CANAL, VALOR DA COMPRA
    // Skip header (row 0), process remaining rows
    const rows: BuyerRow[] = values.slice(1)
      .filter(row => row[1] && row[0]) // deve ter canal e data
      .map(row => {
        const rawDate = row[0];
        // Datas vêm como serial number (ex: 46023)
        let normalizedDate = '';
        
        if (typeof rawDate === 'number' && Number.isFinite(rawDate)) {
          const serial = rawDate;
          const base = new Date(1899, 11, 30);
          const parsedDate = new Date(base.getTime() + serial * 24 * 60 * 60 * 1000);
          if (isValid(parsedDate)) {
            normalizedDate = format(parsedDate, 'yyyy-MM-dd');
          }
        } else if (typeof rawDate === 'string') {
          const raw = String(rawDate).trim();
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
            const [d, m, y] = raw.split('/');
            normalizedDate = `${y}-${m}-${d}`;
          } else if (/^\d{4,6}$/.test(raw)) {
            // Serial date as string
            const serial = Number(raw);
            if (Number.isFinite(serial)) {
              const base = new Date(1899, 11, 30);
              const parsedDate = new Date(base.getTime() + serial * 24 * 60 * 60 * 1000);
              if (isValid(parsedDate)) {
                normalizedDate = format(parsedDate, 'yyyy-MM-dd');
              }
            }
          }
        }

        return {
          telefone: '', // Não existe nessa planilha
          canal: String(row[1] || '').trim(),
          valorCompra: parseNumber(row[2]),
          dataCompra: normalizedDate,
        };
      });

    return rows;
  } catch (error) {
    console.error('Error fetching COMPRADORES_PLATAFORMA_EDIT data:', error);
    throw error;
  }
}

// Filter buyers by date range
export function filterBuyersByDateRange(
  rows: BuyerRow[],
  from: Date | undefined,
  to: Date | undefined
): BuyerRow[] {
  const fromDay = from ? startOfDay(from) : undefined;
  const toDay = to ? endOfDay(to) : undefined;

  return rows.filter(row => {
    if (!row.dataCompra) return false;
    const rowDate = parseSheetDate(row.dataCompra);
    if (!rowDate || !isValid(rowDate)) return false;
    if (fromDay && rowDate < fromDay) return false;
    if (toDay && rowDate > toDay) return false;
    return true;
  });
}

// Fetch data from tabela_objetivo (mídia paga - investment/costs)
export async function fetchGoogleSheetsData(): Promise<GoogleSheetsData> {
  // Fetch header first with a wide but tiny range.
  // This makes the ingestion robust to sheet "updates" that insert/reorder columns (a common reason
  // for daily investment to suddenly look wrong).
  // Read a few top rows to find the actual header row (sheet updates sometimes insert title rows).
  const headerRange = `${SHEET_NAME_OBJETIVO}!A1:AZ5`;
  const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID_OBJETIVO}/values/${headerRange}?key=${GOOGLE_API_KEY}&_=${Date.now()}`;

  try {
    const headerResponse = await fetch(headerUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    if (!headerResponse.ok) {
      const errorData = await headerResponse.json();
      console.error('Google Sheets API error (header):', errorData);
      throw new Error(`Failed to fetch Google Sheets header: ${headerResponse.status}`);
    }

    const headerJson = await headerResponse.json();
    const headerRows: unknown[][] = (headerJson.values ?? []) as unknown[][];

    const columnCandidates: Record<keyof SheetColumnIndexes, string[]> = {
      canal: ['canal', 'channel'],
      campanha: ['campanha', 'campaign name', 'campaign', 'campaign name (plataforma)', 'campaign_name'],
      data: ['data', 'date'],
      grupo_anuncio: ['grupo_anuncio', 'grupo anuncio', 'grupo', 'ad group', 'adgroup'],
      impressoes: ['impressoes', 'imressoes', 'impressions'],
      cliques: ['cliques', 'clicks'],
      investimento: ['investimento', 'gasto', 'spend', 'custo', 'cost'],
      leads: ['leads'],
      conversoes: ['conversoes', 'conversao', 'vendas', 'conversions'],
      receita: ['receita', 'revenue'],
    };

    // Pick the best header row among the first 5 rows.
    let bestRowIndex = 0;
    let bestScore = -1;
    for (let i = 0; i < headerRows.length; i += 1) {
      const row = headerRows[i] ?? [];
      if (isMostlyEmptyRow(row)) continue;
      const normalized = row.map(normalizeHeader);
      const score = scoreHeaderRow(normalized, columnCandidates);
      if (score > bestScore) {
        bestScore = score;
        bestRowIndex = i;
      }
    }

    // Header row in Sheets is 1-based.
    const headerRowNumber = bestRowIndex + 1;
    const headerRow: unknown[] = (headerRows[bestRowIndex] ?? []) as unknown[];
    const idx = resolveSheetColumnIndexes(headerRow);

    // If the sheet changed so much that we can't even find the key columns,
    // it's safer to fail than to calculate wrong investments.
    if (idx.data == null || idx.investimento == null || idx.canal == null) {
      throw new Error('Não foi possível mapear colunas (data/investimento/canal) na planilha.');
    }

    // Compute a minimal range that still includes all required columns.
    const lastIndex = Math.max(
      idx.canal,
      idx.campanha,
      idx.data,
      idx.grupo_anuncio,
      idx.impressoes,
      idx.cliques,
      idx.investimento,
      idx.leads,
      idx.conversoes,
      idx.receita
    );

    // Keep the range narrow to avoid response truncation issues.
    const lastCol = indexToColumnLetter(lastIndex);
    const dataRange = `${SHEET_NAME_OBJETIVO}!A${headerRowNumber}:${lastCol}`;
    const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID_OBJETIVO}/values/${dataRange}?key=${GOOGLE_API_KEY}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING&_=${Date.now()}`;

    const response = await fetch(dataUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API error:', errorData);
      throw new Error(`Failed to fetch Google Sheets data: ${response.status}`);
    }

    const data = await response.json();
    const values: any[][] = data.values || [];

    // Useful to debug "investment bugs" right after sheet updates.
    // Only prints in dev builds.
    if ((import.meta as any)?.env?.DEV) {
      const previewHeader = (values[0] || []).map(normalizeHeader);
      console.debug('[Sheets] headerRowNumber', headerRowNumber);
      console.debug('[Sheets] resolvedIndexes', idx);
      console.debug('[Sheets] effectiveHeader(0)', previewHeader);
      console.debug('[Sheets] fetchedRows', Math.max(0, values.length - 1));
    }
    const effectiveHeader = values[0] || [];
    const effectiveIdx = resolveSheetColumnIndexes(effectiveHeader);
    
    // Skip header row and filter out summary rows
    // NOTE: Sheets API trims trailing empty cells; do not rely on row.length.
    const dataRows = values.slice(1).filter(row => {
      const canal = row[effectiveIdx.canal] || '';
      const dateValue = row[effectiveIdx.data];
      const date = parseSheetDate(dateValue);
      return Boolean(canal) && !String(canal).includes('()') && Boolean(date);
    });

    const rows: SheetsMarketingRow[] = dataRows.map(row => {
      const rawDate = row[effectiveIdx.data];
      const parsedDate = parseSheetDate(rawDate);
      // Normalize to ISO yyyy-MM-dd for stable filtering/grouping, regardless of how Sheets formatted it.
      const normalizedDate = parsedDate ? format(parsedDate, 'yyyy-MM-dd') : rawDate;

      return {
        canal: row[effectiveIdx.canal] || '',
        campanha: row[effectiveIdx.campanha] || '',
        data: String(normalizedDate ?? ''),
        grupo_anuncio: row[effectiveIdx.grupo_anuncio] || '',
        impressoes: parseNumber(row[effectiveIdx.impressoes]),
        cliques: parseNumber(row[effectiveIdx.cliques]),
        investimento: parseNumber(row[effectiveIdx.investimento]),
        leads: parseNumber(row[effectiveIdx.leads]),
        conversoes: parseNumber(row[effectiveIdx.conversoes]),
        receita: parseNumber(row[effectiveIdx.receita]),
      };
    });

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

// Interface para dados mensais de 2026
export interface Macro2026Data {
  // Métricas principais
  totalVendas: number;      // Vendas (total do mês)
  totalLeads: number;       // Leads (total do mês)
  totalMql: number;         // MQL (total do mês)
  // Métricas extras disponíveis na planilha LOVABLE_HISTORICO_2026
  faturamento: number;      // Faturamento
  ticketMedio: number;      // Ticket Médio
  investimento: number;     // Investimento Mensal
  custoVendedor: number;    // Custo Vendedor (da planilha)
  cpa: number;              // CPA (Custo por Aquisição - mídia)
  cac: number;              // CAC (CPA + Custo Vendedor)
  cpl: number;              // CPL
  cpmql: number;            // Custo por MQL
  roas: number;             // ROAS
  roi: number;              // ROI
  taxaConversao: number;    // Taxa de Conversão Lead > MQL (%)
  taxaConversaoMqlVenda: number; // Taxa de Conversão MQL > Venda (%)
}

// Fetch Custo Vendedor from CUSTO_VENDAS tab
// Estrutura simples: Linha 1 = nome (COMISSA_POR_VENDA), Linha 2 = valor (ex: 130)
// Este é o custo fixo por venda (comissão do vendedor)
async function fetchCustoVendedor(): Promise<number> {
  const range = `${SHEET_NAME_CUSTO_VENDAS}!A:A`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID_2026}/values/${range}?key=${GOOGLE_API_KEY}&valueRenderOption=FORMATTED_VALUE&_=${Date.now()}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    
    if (!response.ok) {
      console.error('Google Sheets API error (CUSTO_VENDAS):', response.status);
      return 0;
    }

    const data = await response.json();
    const values: string[][] = data.values || [];
    
    console.debug('[CUSTO_VENDAS] Raw data:', values);
    
    // Estrutura: Linha 1 = nome da métrica, Linha 2 = valor
    // Ex: [["COMISSA_POR_VENDA"], ["130"]]
    if (values.length >= 2) {
      const custoVendedor = parseNumber(values[1]?.[0]);
      console.debug('[CUSTO_VENDAS] Custo por Vendedor (comissão por venda):', custoVendedor);
      return custoVendedor;
    }
    
    console.warn('[CUSTO_VENDAS] Estrutura inesperada, retornando 0');
    return 0;
    
  } catch (error) {
    console.error('Error fetching CUSTO_VENDAS:', error);
    return 0;
  }
}

// Fetch data from LOVABLE_HISTORICO_2026 (planilha de referência 2026)
// IMPORTANT: usa o período selecionado no filtro (dateRange) para escolher o(s) mês(es) a consolidar.
// Estrutura REAL da planilha: Coluna A = nome da métrica, Colunas B e C são vazias/labels
// Colunas D-O (índices 3-14) = Jan-Dez
export async function fetchMacro2026Data(params?: {
  from?: Date;
  to?: Date;
}): Promise<Macro2026Data> {
  // A planilha tem métricas na coluna A e valores mensais nas colunas D-O (Jan-Dez)
  // Colunas A, B, C são: nome_métrica, label/vazio, label/vazio
  const range = `${SHEET_NAME_2026}!A:O`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID_2026}/values/${range}?key=${GOOGLE_API_KEY}&valueRenderOption=FORMATTED_VALUE&_=${Date.now()}`;

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
      console.error('Google Sheets API error (LOVABLE_HISTORICO_2026):', errorData);
      throw new Error(`Failed to fetch 2026 data: ${response.status}`);
    }

    const data = await response.json();
    const values: string[][] = data.values || [];
    
    // Debug: mostrar estrutura da planilha para identificar colunas corretas
    console.debug('[Macro2026] First 5 rows:', values.slice(0, 5));
    console.debug('[Macro2026] Total rows:', values.length);
    
    // Detectar dinamicamente qual coluna contém os dados de Janeiro
    // Procurar na primeira linha (header) ou segunda linha por "Jan", "Janeiro", "1", etc.
    let januaryColumnIndex = 3; // Default: coluna D (índice 3)
    
    // Verificar headers para encontrar a coluna de Janeiro
    if (values.length > 0) {
      const headerRow = values[0];
      for (let i = 0; i < headerRow.length; i++) {
        const header = normalizeHeader(headerRow[i]);
        if (header === 'jan' || header === 'janeiro' || header === '1' || header.includes('jan')) {
          januaryColumnIndex = i;
          console.debug('[Macro2026] Found January at column index:', i, 'value:', headerRow[i]);
          break;
        }
      }
    }
    
    // Calcular offset baseado na posição de Janeiro
    // Se Janeiro está no índice 3 (coluna D), offset = 3 - 1 = 2
    const MONTH_COLUMN_OFFSET = januaryColumnIndex - 1;
    console.debug('[Macro2026] Using MONTH_COLUMN_OFFSET:', MONTH_COLUMN_OFFSET);
    
    const startDate = params?.from ?? new Date();
    const endDate = params?.to ?? params?.from ?? startDate;

    const startMonth = Math.min(12, Math.max(1, startDate.getMonth() + 1));
    const endMonth = Math.min(12, Math.max(1, endDate.getMonth() + 1));
    const monthStart = Math.min(startMonth, endMonth);
    const monthEnd = Math.max(startMonth, endMonth);
    
    // Índices de coluna calculados dinamicamente
    const columnIndexes = Array.from(
      { length: monthEnd - monthStart + 1 }, 
      (_, i) => monthStart + i + MONTH_COLUMN_OFFSET
    );
    const isMultiMonth = columnIndexes.length > 1;

    console.debug('[Macro2026] Date range:', startDate?.toISOString(), 'to', endDate?.toISOString());
    console.debug('[Macro2026] Months:', monthStart, 'to', monthEnd);
    console.debug('[Macro2026] Column indexes:', columnIndexes);

    const metricsSumMap: Record<string, number> = {};

    for (const row of values) {
      const metricName = normalizeHeader(row[0] || '');
      if (!metricName) continue;

      let sum = 0;
      for (const colIndex of columnIndexes) {
        const cellValue = row[colIndex];
        const parsed = parseNumber(cellValue);
        sum += parsed;
        // Debug para métricas importantes
        if (metricName === 'cpa' || metricName === 'vendas' || metricName === 'faturamento') {
          console.debug(`[Macro2026] ${metricName} col[${colIndex}]:`, cellValue, '-> parsed:', parsed);
        }
      }
      metricsSumMap[metricName] = sum;
    }

    // Debug: mostrar todas as métricas encontradas
    console.debug('[Macro2026] metricsSumMap keys:', Object.keys(metricsSumMap));
    console.debug('[Macro2026] metricsSumMap:', metricsSumMap);
    console.debug('[Macro2026] isMultiMonth:', isMultiMonth);
    
    // Mapear métricas pelos nomes normalizados da planilha LOVABLE_HISTORICO_2026
    const vendas = metricsSumMap['vendas'] || 0;
    const leads = metricsSumMap['lead'] || metricsSumMap['leads'] || 0;
    const mql = metricsSumMap['mql'] || 0;
    const faturamentoSum = metricsSumMap['faturamento'] || 0;
    const investimentoSum = metricsSumMap['investimento mensal'] || metricsSumMap['investimento'] || 0;
    
    // Buscar Custo Vendedor da aba CUSTO_VENDAS
    const custoVendedorPorVenda = await fetchCustoVendedor();
    // custoVendedorPorVenda é o custo fixo por venda (comissão), ex: R$130
    // Para calcular o custo total, multiplicamos pelo número de vendas
    const custoVendedorSum = custoVendedorPorVenda * vendas;

    console.debug('[Macro2026] Parsed volumes:', { vendas, leads, mql, faturamentoSum, investimentoSum, custoVendedorSum });

    // Para 1 mês: usamos os valores da própria planilha (batem com o reporting dela).
    // Para múltiplos meses: recalculamos métricas derivadas de forma consistente a partir dos totais.
    const ticketMedio = isMultiMonth
      ? (vendas > 0 ? faturamentoSum / vendas : 0)
      : (metricsSumMap['ticket medio'] || metricsSumMap['ticketmedio'] || 0);
    
    // CPA: SEMPRE calcular internamente = investimento / vendas
    const cpa = vendas > 0 ? investimentoSum / vendas : 0;
    
    console.debug('[Macro2026] CPA debug:', { investimentoSum, vendas, cpa });
    
    // CAC = CPA + Custo Vendedor (usando valor da planilha)
    // Se custoVendedorSum for o total acumulado, dividimos pelo número de vendas para ter custo unitário
    const custoVendedorUnitario = vendas > 0 ? custoVendedorSum / vendas : 0;
    const cac = cpa + custoVendedorUnitario;
    
    console.debug('[Macro2026] CAC debug:', { cpa, custoVendedorSum, custoVendedorUnitario, cac });
    
    // CPL: custo por lead
    const cplCalculated = leads > 0 ? investimentoSum / leads : 0;
    const cplFromSheet = metricsSumMap['cpl'] || 0;
    const cpl = isMultiMonth ? cplCalculated : (cplFromSheet > 0 ? cplFromSheet : cplCalculated);
    
    // CPMQL: custo por MQL
    const cpmqlCalculated = mql > 0 ? investimentoSum / mql : 0;
    const cpmqlFromSheet = metricsSumMap['cpmql'] || 0;
    const cpmql = isMultiMonth ? cpmqlCalculated : (cpmqlFromSheet > 0 ? cpmqlFromSheet : cpmqlCalculated);
    
    // ROAS: retorno sobre investimento em ads
    const roasCalculated = investimentoSum > 0 ? faturamentoSum / investimentoSum : 0;
    const roasFromSheet = metricsSumMap['roas'] || 0;
    const roas = isMultiMonth ? roasCalculated : (roasFromSheet > 0 ? roasFromSheet : roasCalculated);
    
    // ROI: retorno sobre investimento (%)
    const roiCalculated = investimentoSum > 0 ? ((faturamentoSum - investimentoSum) / investimentoSum) * 100 : 0;
    const roiFromSheet = metricsSumMap['roi'] || 0;
    const roi = isMultiMonth ? roiCalculated : (roiFromSheet > 0 ? roiFromSheet : roiCalculated);
    
    // Taxa de conversão Lead > MQL
    const taxaConversaoCalculated = leads > 0 ? (mql / leads) * 100 : 0;
    const taxaConversaoFromSheet = metricsSumMap['lead > mql'] || metricsSumMap['taxa de conversao'] || 0;
    const taxaConversao = isMultiMonth ? taxaConversaoCalculated : (taxaConversaoFromSheet > 0 ? taxaConversaoFromSheet : taxaConversaoCalculated);
    
    // Taxa de conversão MQL > Venda
    const taxaMqlVendaCalculated = mql > 0 ? (vendas / mql) * 100 : 0;
    const taxaMqlVendaFromSheet = metricsSumMap['tx conversao mql > venda'] || metricsSumMap['taxa conversao mql venda'] || 0;
    const taxaConversaoMqlVenda = isMultiMonth ? taxaMqlVendaCalculated : (taxaMqlVendaFromSheet > 0 ? taxaMqlVendaFromSheet : taxaMqlVendaCalculated);
    
    console.debug('[Macro2026] Final metrics:', { cpa, cac, custoVendedorSum, roas, roi, cpl, cpmql, taxaConversao, taxaConversaoMqlVenda });
    
    return {
      totalVendas: vendas,
      totalLeads: leads,
      totalMql: mql,
      faturamento: faturamentoSum,
      ticketMedio,
      investimento: investimentoSum,
      custoVendedor: custoVendedorSum,
      cpa,
      cac,
      cpl,
      cpmql,
      roas,
      roi,
      taxaConversao,
      taxaConversaoMqlVenda,
    };
  } catch (error) {
    console.error('Error fetching LOVABLE_HISTORICO_2026 data:', error);
    throw error;
  }
}

// Nota: fetchMacroSheetsData removida - usamos apenas fetchMacro2026Data agora

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
    // Also handle dd/MM/yyyy and timestamps that sometimes appear after sheet updates.
    const rowDate = parseSheetDate(row.data);
    if (!rowDate || !isValid(rowDate)) return false;
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
