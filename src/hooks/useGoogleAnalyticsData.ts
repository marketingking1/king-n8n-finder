import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { DateRange } from '@/types/dashboard';

const GA_PROPERTY_ID = '329839086';

export interface GADailyRow {
  campaign: string;
  date: string; // YYYYMMDD
  sessions: number;
  engagedSessions: number;
  totalUsers: number;
  newUsers: number;
  conversions: number;
}

export interface GAAggregated {
  sessions: number;
  engagedSessions: number;
  totalUsers: number;
  newUsers: number;
  conversions: number;
}

export interface GAByWeek {
  weekIndex: number; // 0-3
  data: GAAggregated;
}

export interface GoogleAnalyticsData {
  rows: GADailyRow[];
  total: GAAggregated;
}

async function fetchGAData(startDate: string, endDate: string): Promise<GoogleAnalyticsData> {
  const { data, error } = await supabase.functions.invoke('google-analytics', {
    body: {
      propertyId: GA_PROPERTY_ID,
      startDate,
      endDate,
    },
  });

  if (error) throw new Error(`GA fetch error: ${error.message}`);
  if (data.error) throw new Error(`GA API error: ${data.error}`);

  const rows: GADailyRow[] = data.rows || [];

  const total: GAAggregated = rows.reduce(
    (acc, row) => ({
      sessions: acc.sessions + row.sessions,
      engagedSessions: acc.engagedSessions + row.engagedSessions,
      totalUsers: acc.totalUsers + row.totalUsers,
      newUsers: acc.newUsers + row.newUsers,
      conversions: acc.conversions + row.conversions,
    }),
    { sessions: 0, engagedSessions: 0, totalUsers: 0, newUsers: 0, conversions: 0 }
  );

  return { rows, total };
}

export function useGoogleAnalyticsData(dateRange: DateRange) {
  const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
  const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '';

  return useQuery({
    queryKey: ['google-analytics', startDate, endDate],
    queryFn: () => fetchGAData(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

/**
 * Aggregate GA daily rows into weekly buckets for a given month.
 * weekBoundaries: array of { start: Date, end: Date } for each week.
 */
export function aggregateGAByWeeks(
  rows: GADailyRow[],
  weekBoundaries: Array<{ start: Date; end: Date }>
): GAByWeek[] {
  return weekBoundaries.map((week, idx) => {
    const startStr = format(week.start, 'yyyyMMdd');
    const endStr = format(week.end, 'yyyyMMdd');

    const weekRows = rows.filter(r => r.date >= startStr && r.date <= endStr);

    const data: GAAggregated = weekRows.reduce(
      (acc, row) => ({
        sessions: acc.sessions + row.sessions,
        engagedSessions: acc.engagedSessions + row.engagedSessions,
        totalUsers: acc.totalUsers + row.totalUsers,
        newUsers: acc.newUsers + row.newUsers,
        conversions: acc.conversions + row.conversions,
      }),
      { sessions: 0, engagedSessions: 0, totalUsers: 0, newUsers: 0, conversions: 0 }
    );

    return { weekIndex: idx, data };
  });
}
