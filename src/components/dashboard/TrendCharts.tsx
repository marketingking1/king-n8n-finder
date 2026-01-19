import { TimeSeriesData, FunnelData, CampaignMetrics } from '@/types/dashboard';
import { InvestmentChart } from './charts/InvestmentChart';
import { ImpressionsChart } from './charts/ImpressionsChart';
import { CTRChart } from './charts/CTRChart';
import { ConversionRateChart } from './charts/ConversionRateChart';
import { CPAChart } from './charts/CPAChart';
import { ROASByCampaignChart } from './charts/ROASByCampaignChart';

interface TrendChartsProps {
  timeSeriesData: TimeSeriesData[];
  funnelData: FunnelData[];
  campaignMetrics?: CampaignMetrics[];
}

export function TrendCharts({ timeSeriesData, funnelData, campaignMetrics = [] }: TrendChartsProps) {
  return (
    <div className="space-y-6">
      {/* First row: Investment, Impressions, CTR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InvestmentChart data={timeSeriesData} />
        <ImpressionsChart data={timeSeriesData} />
        <CTRChart data={timeSeriesData} />
      </div>
      
      {/* Second row: Conversion Rate, CPA, ROAS by Campaign */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ConversionRateChart data={timeSeriesData} />
        <CPAChart data={timeSeriesData} />
        <ROASByCampaignChart data={campaignMetrics} />
      </div>
    </div>
  );
}