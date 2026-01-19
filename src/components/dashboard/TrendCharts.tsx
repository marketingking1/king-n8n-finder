import { TimeSeriesData, FunnelData } from '@/types/dashboard';
import { TimeEvolutionChart } from './TimeEvolutionChart';
import { ROASChart } from './ROASChart';
import { FunnelChart } from './FunnelChart';

interface TrendChartsProps {
  timeSeriesData: TimeSeriesData[];
  funnelData: FunnelData[];
}

export function TrendCharts({ timeSeriesData, funnelData }: TrendChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeEvolutionChart data={timeSeriesData} />
        <ROASChart data={timeSeriesData} />
      </div>
      <FunnelChart data={funnelData} />
    </div>
  );
}
