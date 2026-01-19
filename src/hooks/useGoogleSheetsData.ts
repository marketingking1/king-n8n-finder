import { useQuery } from '@tanstack/react-query';
import { fetchGoogleSheetsData, GoogleSheetsData } from '@/lib/googleSheets';

export function useGoogleSheetsData() {
  return useQuery<GoogleSheetsData>({
    queryKey: ['google-sheets-data'],
    queryFn: fetchGoogleSheetsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
