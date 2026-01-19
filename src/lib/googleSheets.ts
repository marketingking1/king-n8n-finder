const GOOGLE_API_KEY = 'AIzaSyAVTiqpacILT6HvKmGWGgnqqYfJrcucF7Y';
const SPREADSHEET_ID = '1FLAmZ4rL2OmxABfIyiPSl9UTgmsC4zc8m039c175ix4';
const SHEET_NAME = 'Dados_macro_vendas';

export interface GoogleSheetsData {
  vendas: number;
  leads: number;
  taxaConversao: number;
}

export async function fetchGoogleSheetsData(): Promise<GoogleSheetsData> {
  const range = `${SHEET_NAME}!A2:B2`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API error:', errorData);
      throw new Error(`Failed to fetch Google Sheets data: ${response.status}`);
    }

    const data = await response.json();
    const values = data.values?.[0] || [];

    // A2 = Vendas totais, B2 = Leads totais
    const vendas = parseFloat(String(values[0] || '0').replace(/[^\d.-]/g, '')) || 0;
    const leads = parseFloat(String(values[1] || '0').replace(/[^\d.-]/g, '')) || 0;
    const taxaConversao = leads > 0 ? (vendas / leads) * 100 : 0;

    return { vendas, leads, taxaConversao };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
}
