import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CampaignMetrics } from '@/types/dashboard';
import { formatROAS } from '@/lib/formatters';
import { ChartCard } from './ChartCard';
import { useMemo } from 'react';

interface ROASByCampaignChartProps {
  data: CampaignMetrics[];
}

const COLORS = [
  'hsl(var(--chart-magenta))',
  'hsl(var(--chart-pink))',
  'hsl(var(--chart-purple))',
  'hsl(var(--chart-blue))',
  'hsl(var(--chart-green))',
];

export function ROASByCampaignChart({ data }: ROASByCampaignChartProps) {
  // Sort by ROAS and take top 5 campaigns
  const topCampaigns = useMemo(() => {
    return [...data]
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 5);
  }, [data]);

  // Create chart data showing campaigns as bars
  const chartData = useMemo(() => {
    return topCampaigns.map((campaign, index) => ({
      name: campaign.campanha.length > 20 
        ? campaign.campanha.substring(0, 17) + '...' 
        : campaign.campanha,
      fullName: campaign.campanha,
      roas: campaign.roas,
      color: COLORS[index % COLORS.length],
    }));
  }, [topCampaigns]);

  if (chartData.length === 0) {
    return (
      <ChartCard title="ROAS por campanha">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Nenhuma campanha disponível
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="ROAS por campanha">
      <div className="space-y-3 h-full flex flex-col justify-center">
        {chartData.map((campaign, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: campaign.color }}
                />
                <span className="text-muted-foreground truncate max-w-[150px]" title={campaign.fullName}>
                  {campaign.name}
                </span>
              </div>
              <span className="font-medium text-foreground">{formatROAS(campaign.roas)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, (campaign.roas / 3) * 100)}%`,
                  backgroundColor: campaign.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}