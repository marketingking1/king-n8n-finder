const GOOGLE_API_KEY = 'AIzaSyBmBfb4pM3VqtnLhjZjzYTWUN9UuqXDjkI';
const SPREADSHEET_ID = '1FLAmZ4rL2OmxABfIyiPSl9UTgmsC4zc8m039c175ix4';
const SHEET_NAME = 'Dados_macro_vendas';

export interface GoogleSheetsData {
  leads: number;
  vendas: number;
}

export async function fetchGoogleSheetsData(): Promise<GoogleSheetsData> {
  const range = `${SHEET_NAME}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API error:', errorData);
      throw new Error(`Failed to fetch Google Sheets data: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length < 2) {
      return { leads: 0, vendas: 0 };
    }

    // Find header indices
    const headers = rows[0].map((h: string) => h?.toLowerCase?.() || '');
    const leadsIndex = headers.findIndex((h: string) => h.includes('lead'));
    const vendasIndex = headers.findIndex((h: string) => h.includes('venda'));

    // Sum all values from data rows
    let totalLeads = 0;
    let totalVendas = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (leadsIndex >= 0 && row[leadsIndex]) {
        totalLeads += parseFloat(String(row[leadsIndex]).replace(/[^\d.-]/g, '')) || 0;
      }
      if (vendasIndex >= 0 && row[vendasIndex]) {
        totalVendas += parseFloat(String(row[vendasIndex]).replace(/[^\d.-]/g, '')) || 0;
      }
    }

    return { leads: totalLeads, vendas: totalVendas };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
}
