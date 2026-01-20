import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatNumber, formatPercent, formatROAS, formatVariation } from '@/lib/formatters';
import { TICKET_MEDIO } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import { CalendarDays, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface YoYData {
  vendas: number;
  leads: number;
  investimento: number;
  cpa: number;
  faturamento: number;
  taxaConversao: number;
  monthName: string;
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
  previousYear: number;
  variation: number;
  invertVariation?: boolean;
}

// Fetch historical data from Google Sheet (lovable_historico)
async function fetchHistoricalData(): Promise<YoYData | null> {
  const GOOGLE_API_KEY = 'AIzaSyAVTiqpacILT6HvKmGWGgnqqYfJrcucF7Y';
  const SPREADSHEET_ID = '1qS646MJtNvxmMDRMTrFQqX6CKtPJRItbhd0t6stb1HM';
  const SHEET_NAME = 'lovable_historico';
  const range = `${SHEET_NAME}!A:O`;
  
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
    
    if (values.length < 2) {
      console.warn('No historical data rows found');
      return null;
    }
    
    // Get current month (0-indexed) to map to column
    // Header row: col 0="dados 2025", cols 1-2 empty, cols 3-14 = Jan-Dez
    // Column mapping: Jan=3, Fev=4, Mar=5, Abr=6, Mai=7, Jun=8, Jul=9, Ago=10, Set=11, Out=12, Nov=13, Dez=14
    const now = new Date();
    const currentMonth = now.getMonth(); // 0=Jan, 1=Feb, etc
    const targetColIndex = currentMonth + 3; // Offset by 3 for empty columns
    
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abri', 'Maio', 'Jul', 'Julho', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthName = monthNames[currentMonth] || 'N/A';
    
    const parseNumber = (value: string | undefined | null): number => {
      if (!value) return 0;
      // Remove R$, %, dots (thousand separators), and convert comma to dot
      const cleaned = String(value).replace(/[R$%\s]/g, '').replace(/\./g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    };
    
    // Build a map of metric name -> value from each row
    // Row structure: [metric_name, "", "", Jan, Fev, Mar, ...]
    const metricsMap: Record<string, number> = {};
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const metricName = (row[0] || '').toLowerCase().trim();
      const metricValue = parseNumber(row[targetColIndex]);
      metricsMap[metricName] = metricValue;
    }
    
    console.log('Historical data metricsMap:', metricsMap, 'for month column:', targetColIndex);
    
    // Extract relevant metrics using exact keys from sheet
    const vendas = metricsMap['vendas'] || 0;
    const leads = metricsMap['lead'] || 0;
    const investimento = metricsMap['investimento mensal'] || 0;
    const cpa = metricsMap['cpa'] || 0;
    const faturamento = metricsMap['faturamento'] || 0;
    
    // Calculate conversion rate (vendas / leads)
    const taxaConversao = leads > 0 ? (vendas / leads) * 100 : 0;
    
    return {
      vendas,
      leads,
      investimento,
      cpa,
      faturamento,
      taxaConversao,
      monthName,
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

function ComparisonRow({ label, current, previous, previousYear, variation, invertVariation }: ComparisonRowProps) {
  const isPositive = invertVariation ? variation < 0 : variation >= 0;
  const isNeutral = Math.abs(variation) < 0.5;
  
  const getIcon = () => {
    if (isNeutral) return <Minus className="h-3.5 w-3.5" />;
    return isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />;
  };
  
  const getColor = () => {
    if (isNeutral) return 'text-muted-foreground';
    return isPositive ? 'text-success' : 'text-destructive';
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{current}</p>
          <p className="text-xs text-muted-foreground">{previous} ({previousYear})</p>
        </div>
        <div className={cn("flex items-center gap-1 min-w-[70px] justify-end", getColor())}>
          {getIcon()}
          <span className="text-xs font-medium">{formatVariation(Math.abs(variation))}</span>
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
    
    // Previous year data
    const prevRoas = historicalData.investimento > 0 
      ? historicalData.faturamento / historicalData.investimento 
      : 0;
    const prevConversao = historicalData.leads > 0 
      ? (historicalData.vendas / historicalData.leads) * 100 
      : 0;
    
    return {
      vendas: { current: currentVendas, previous: historicalData.vendas },
      leads: { current: currentLeads, previous: historicalData.leads },
      investimento: { current: currentInvestimento, previous: historicalData.investimento },
      receita: { current: currentReceita, previous: historicalData.faturamento },
      cpa: { current: currentCpa, previous: historicalData.cpa },
      roas: { current: currentRoas, previous: prevRoas },
      conversao: { current: currentConversao, previous: prevConversao },
    };
  }, [currentData, historicalData]);

  const now = new Date();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const currentMonthName = monthNames[now.getMonth()];

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6">
        <h3 className="text-base font-display font-semibold mb-6 text-foreground">Comparativo Ano Anterior</h3>
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-10 bg-muted/20 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !comparisonData || !historicalData) {
    return (
      <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6">
        <h3 className="text-base font-display font-semibold mb-6 text-foreground">Comparativo Ano Anterior</h3>
        <p className="text-center text-muted-foreground text-sm">Dados históricos não disponíveis</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-display font-semibold text-foreground">Comparativo Ano Anterior</h3>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">{currentMonthName} 2026 vs 2025</span>
        </div>
      </div>
      
      <div>
        <ComparisonRow
          label="Vendas"
          current={formatNumber(comparisonData.vendas.current)}
          previous={formatNumber(comparisonData.vendas.previous)}
          previousYear={2025}
          variation={calculateVariation(comparisonData.vendas.current, comparisonData.vendas.previous)}
        />
        <ComparisonRow
          label="Leads"
          current={formatNumber(comparisonData.leads.current)}
          previous={formatNumber(comparisonData.leads.previous)}
          previousYear={2025}
          variation={calculateVariation(comparisonData.leads.current, comparisonData.leads.previous)}
        />
        <ComparisonRow
          label="Investimento"
          current={formatCurrency(comparisonData.investimento.current)}
          previous={formatCurrency(comparisonData.investimento.previous)}
          previousYear={2025}
          variation={calculateVariation(comparisonData.investimento.current, comparisonData.investimento.previous)}
        />
        <ComparisonRow
          label="Receita"
          current={formatCurrency(comparisonData.receita.current)}
          previous={formatCurrency(comparisonData.receita.previous)}
          previousYear={2025}
          variation={calculateVariation(comparisonData.receita.current, comparisonData.receita.previous)}
        />
        <ComparisonRow
          label="CPA"
          current={formatCurrency(comparisonData.cpa.current)}
          previous={formatCurrency(comparisonData.cpa.previous)}
          previousYear={2025}
          variation={calculateVariation(comparisonData.cpa.current, comparisonData.cpa.previous)}
          invertVariation={true}
        />
        <ComparisonRow
          label="ROAS"
          current={formatROAS(comparisonData.roas.current)}
          previous={formatROAS(comparisonData.roas.previous)}
          previousYear={2025}
          variation={calculateVariation(comparisonData.roas.current, comparisonData.roas.previous)}
        />
        <ComparisonRow
          label="Taxa Conversão"
          current={formatPercent(comparisonData.conversao.current)}
          previous={formatPercent(comparisonData.conversao.previous)}
          previousYear={2025}
          variation={calculateVariation(comparisonData.conversao.current, comparisonData.conversao.previous)}
        />
      </div>
    </div>
  );
}
