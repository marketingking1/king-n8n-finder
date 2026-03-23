import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { 
  fetchGoogleSheetsData, 
  GoogleSheetsData, 
  SheetsMarketingRow,
  filterRows,
  extractFilterOptions 
} from '@/lib/googleSheets';
import { FilterState } from '@/types/dashboard';

export function useGoogleSheetsData() {
  return useQuery<GoogleSheetsData>({
    queryKey: ['google-sheets-data'],
    queryFn: fetchGoogleSheetsData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useFilteredSheetsData(filters: FilterState) {
  const { data, isLoading, error } = useGoogleSheetsData();

  const filteredData = useMemo(() => {
    if (!data) return null;
    const filtered = filterRows(data.rows, filters);
    
    // Recalculate totals for filtered data
    const vendas = filtered.reduce((sum, row) => sum + row.conversoes, 0);
    const leads = filtered.reduce((sum, row) => sum + row.leads, 0);
    const taxaConversao = leads > 0 ? (vendas / leads) * 100 : 0;

    return { rows: filtered, vendas, leads, taxaConversao };
  }, [data, filters]);

  return { data: filteredData, isLoading, error };
}

export function useSheetsFilterOptions() {
  const { data, isLoading } = useGoogleSheetsData();

  const filterOptions = useMemo(() => {
    if (!data) return { campanhas: [], grupos: [], canais: [] };
    return extractFilterOptions(data.rows);
  }, [data]);

  return { data: filterOptions, isLoading };
}

// Convert sheets data to MarketingData format for compatibility
export function sheetsToMarketingData(rows: SheetsMarketingRow[]) {
  return rows.map(row => ({
    data: row.data,
    campanha: row.campanha || null,
    grupo_anuncio: row.grupo_anuncio || null,
    canal: row.canal || null,
    investimento: row.investimento,
    impressoes: row.impressoes,
    cliques: row.cliques,
    leads: row.leads,
    conversoes: row.conversoes,
    receita: row.receita,
  }));
}
