import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MarketingData, FilterState } from '@/types/dashboard';
import { format } from 'date-fns';
import { useEffect } from 'react';

async function fetchMarketingData(filters: FilterState): Promise<MarketingData[]> {
  let query = supabase
    .from('vw_marketing_data')
    .select('*');

  if (filters.dateRange.from) {
    query = query.gte('data', format(filters.dateRange.from, 'yyyy-MM-dd'));
  }
  if (filters.dateRange.to) {
    query = query.lte('data', format(filters.dateRange.to, 'yyyy-MM-dd'));
  }
  if (filters.campanhas.length > 0) {
    query = query.in('campanha', filters.campanhas);
  }
  if (filters.grupos.length > 0) {
    query = query.in('grupo_anuncio', filters.grupos);
  }
  if (filters.canais.length > 0) {
    query = query.in('canal', filters.canais);
  }

  const { data, error } = await query.order('data', { ascending: true });

  if (error) throw error;
  return (data as MarketingData[]) || [];
}

async function fetchFilterOptions() {
  const [campanhasRes, gruposRes, canaisRes] = await Promise.all([
    supabase.from('vw_marketing_data').select('campanha').not('campanha', 'is', null),
    supabase.from('vw_marketing_data').select('grupo_anuncio').not('grupo_anuncio', 'is', null),
    supabase.from('vw_marketing_data').select('canal').not('canal', 'is', null),
  ]);

  const campanhas = [...new Set((campanhasRes.data || []).map(r => r.campanha).filter(Boolean))] as string[];
  const grupos = [...new Set((gruposRes.data || []).map(r => r.grupo_anuncio).filter(Boolean))] as string[];
  const canais = [...new Set((canaisRes.data || []).map(r => r.canal).filter(Boolean))] as string[];

  return { campanhas, grupos, canais };
}

export function useDashboardData(filters: FilterState) {
  const queryClient = useQueryClient();

  // Invalidate queries when auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ['marketing-data'] });
      queryClient.invalidateQueries({ queryKey: ['filter-options'] });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ['marketing-data', filters],
    queryFn: () => fetchMarketingData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
