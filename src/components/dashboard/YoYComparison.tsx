import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatNumber, formatPercent, formatROAS, formatVariation } from '@/lib/formatters';
import { TICKET_MEDIO } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import { CalendarDays, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface YoYData {
  vendas: number;
  leads: number;
  conversaoLeadVenda: number;
  investimento: number;
  cpa: number;
  roas: number;
  receita: number;
}

interface YoYComparisonProps {
  currentData: {
    vendas: number;
    leads: number;
    investimento: number;
  } | undefined;
  isLoading?: boolean;
}

interface ComparisonRowProps {
  label: string;
  current: string;
  previous: string;
  variation: number;
  invertVariation?: boolean;
}

// Fetch historical data from new Google Sheet
async function fetchHistoricalData(): Promise<YoYData> {
  const GOOGLE_API_KEY = 'AIzaSyAVTiqpacILT6HvKmGWGgnqqYfJrcucF7Y';
  const SPREADSHEET_ID = '1S6ucr5KM3arhdukM-z2Qxn7uIrm27gHEKOpC-ExP8sk';
  const SHEET_NAME = '2. DADOS MENSAL';
  const range = `${SHEET_NAME}!A:G`;
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API error (historical):', errorData);
      throw new Error(`Failed to fetch historical data: ${response.status}`);
    }

    const data = await response.json();
    const values: string[][] = data.values || [];
    
    // Get current month to find the same month last year
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed
    const lastYear = now.getFullYear() - 1;
    
    // Month names in Portuguese to match sheet format
    const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const targetMonth = monthNames[currentMonth];
    const targetYear = String(lastYear).slice(-2); // e.g., "25" for 2025
    
    // Search for the row matching the target month/year
    // Expected format: "jan/25" or similar in first column
    const targetKey = `${targetMonth}/${targetYear}`;
    
    const parseNumber = (value: string | undefined | null): number => {
      if (!value) return 0;
      const cleaned = String(value).replace(/[^\d.,-]/g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    };
    
    // Find the matching row (skip header)
    const dataRow = values.slice(1).find(row => {
      const dateCell = (row[0] || '').toLowerCase().trim();
      return dateCell.includes(targetMonth) && dateCell.includes(targetYear);
    });
    
    if (dataRow) {
      const vendas = parseNumber(dataRow[1]);
      const leads = parseNumber(dataRow[2]);
      const investimento = parseNumber(dataRow[3]);
      const receita = vendas * TICKET_MEDIO;
      
      return {
        vendas,
        leads,
        conversaoLeadVenda: leads > 0 ? (vendas / leads) * 100 : 0,
        investimento,
        cpa: vendas > 0 ? investimento / vendas : 0,
        roas: investimento > 0 ? receita / investimento : 0,
        receita,
      };
    }
    
    // Fallback: return zeros if no matching data found
    console.warn(`No historical data found for ${targetKey}`);
    return {
      vendas: 0,
      leads: 0,
      conversaoLeadVenda: 0,
      investimento: 0,
      cpa: 0,
      roas: 0,
      receita: 0,
    };
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
}

function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function ComparisonRow({ label, current, previous, variation, invertVariation }: ComparisonRowProps) {
  const isPositive = invertVariation ? variation < 0 : variation >= 0;
  const isNeutral = Math.abs(variation) < 0.5;
  
  const getIcon = () => {
    if (isNeutral) return <Minus className="h-4 w-4" />;
    return isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };
  
  const getColor = () => {
    if (isNeutral) return 'text-muted-foreground';
    return isPositive ? 'text-success' : 'text-destructive';
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-bold text-foreground">{current}</p>
          <p className="text-xs text-muted-foreground">{previous} (2025)</p>
        </div>
        <div className={cn("flex items-center gap-1 min-w-[80px] justify-end", getColor())}>
          {getIcon()}
          <span className="text-sm font-medium">{formatVariation(Math.abs(variation))}</span>
        </div>
      </div>
    </div>
  );
}

export function YoYComparison({ currentData, isLoading: parentLoading }: YoYComparisonProps) {
  const { data: historicalData, isLoading: histLoading, error } = useQuery({
    queryKey: ['historical-yoy-data'],
    queryFn: fetchHistoricalData,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const isLoading = parentLoading || histLoading;
  
  const comparisonData = useMemo(() => {
    if (!currentData || !historicalData) return null;
    
    const currentVendas = currentData.vendas || 0;
    const currentLeads = currentData.leads || 0;
    const currentInvestimento = currentData.investimento || 0;
    const currentReceita = currentVendas * TICKET_MEDIO;
    const currentCpa = currentVendas > 0 ? currentInvestimento / currentVendas : 0;
    const currentRoas = currentInvestimento > 0 ? currentReceita / currentInvestimento : 0;
    const currentConversao = currentLeads > 0 ? (currentVendas / currentLeads) * 100 : 0;
    
    return {
      vendas: { current: currentVendas, previous: historicalData.vendas },
      leads: { current: currentLeads, previous: historicalData.leads },
      investimento: { current: currentInvestimento, previous: historicalData.investimento },
      receita: { current: currentReceita, previous: historicalData.receita },
      cpa: { current: currentCpa, previous: historicalData.cpa },
      roas: { current: currentRoas, previous: historicalData.roas },
      conversao: { current: currentConversao, previous: historicalData.conversaoLeadVenda },
    };
  }, [currentData, historicalData]);

  const now = new Date();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const currentMonthName = monthNames[now.getMonth()];
  const lastYear = now.getFullYear() - 1;

  if (isLoading) {
    return (
      <div className="glow-card p-6">
        <h3 className="text-lg font-display font-semibold mb-6 text-foreground">Comparativo Ano Anterior</h3>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-muted/20 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !comparisonData) {
    return (
      <div className="glow-card p-6">
        <h3 className="text-lg font-display font-semibold mb-6 text-foreground">Comparativo Ano Anterior</h3>
        <p className="text-center text-muted-foreground">Dados históricos não disponíveis</p>
      </div>
    );
  }

  return (
    <div className="glow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">Comparativo Ano Anterior</h3>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">{currentMonthName} 2026 vs {lastYear}</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <ComparisonRow
          label="Vendas"
          current={formatNumber(comparisonData.vendas.current)}
          previous={formatNumber(comparisonData.vendas.previous)}
          variation={calculateVariation(comparisonData.vendas.current, comparisonData.vendas.previous)}
        />
        <ComparisonRow
          label="Leads"
          current={formatNumber(comparisonData.leads.current)}
          previous={formatNumber(comparisonData.leads.previous)}
          variation={calculateVariation(comparisonData.leads.current, comparisonData.leads.previous)}
        />
        <ComparisonRow
          label="Investimento"
          current={formatCurrency(comparisonData.investimento.current)}
          previous={formatCurrency(comparisonData.investimento.previous)}
          variation={calculateVariation(comparisonData.investimento.current, comparisonData.investimento.previous)}
        />
        <ComparisonRow
          label="Receita"
          current={formatCurrency(comparisonData.receita.current)}
          previous={formatCurrency(comparisonData.receita.previous)}
          variation={calculateVariation(comparisonData.receita.current, comparisonData.receita.previous)}
        />
        <ComparisonRow
          label="CPA"
          current={formatCurrency(comparisonData.cpa.current)}
          previous={formatCurrency(comparisonData.cpa.previous)}
          variation={calculateVariation(comparisonData.cpa.current, comparisonData.cpa.previous)}
          invertVariation={true}
        />
        <ComparisonRow
          label="ROAS"
          current={formatROAS(comparisonData.roas.current)}
          previous={formatROAS(comparisonData.roas.previous)}
          variation={calculateVariation(comparisonData.roas.current, comparisonData.roas.previous)}
        />
        <ComparisonRow
          label="Taxa Conversão"
          current={formatPercent(comparisonData.conversao.current)}
          previous={formatPercent(comparisonData.conversao.previous)}
          variation={calculateVariation(comparisonData.conversao.current, comparisonData.conversao.previous)}
        />
      </div>
    </div>
  );
}
