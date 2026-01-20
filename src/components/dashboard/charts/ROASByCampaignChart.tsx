import { CampaignMetrics } from '@/types/dashboard';
import { formatROAS } from '@/lib/formatters';
import { ChartCard } from './ChartCard';
import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ROASByCampaignChartProps {
  data: CampaignMetrics[];
}

const COLORS = [
  'hsl(186, 100%, 50%)',   // Primary cyan
  'hsl(210, 100%, 55%)',   // Blue
  'hsl(160, 100%, 45%)',   // Green
  'hsl(230, 80%, 55%)',    // Royal
  'hsl(175, 80%, 45%)',    // Teal
];

export function ROASByCampaignChart({ data }: ROASByCampaignChartProps) {
  // Sort by ROAS and take top 5 campaigns
  const topCampaigns = useMemo(() => {
    return [...data]
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 5);
  }, [data]);

  // Calculate max ROAS for scaling bars
  const maxRoas = useMemo(() => {
    return Math.max(...topCampaigns.map(c => c.roas), 1);
  }, [topCampaigns]);

  // Create chart data
  const chartData = useMemo(() => {
    return topCampaigns.map((campaign, index) => ({
      name: campaign.campanha.length > 25 
        ? campaign.campanha.substring(0, 22) + '...' 
        : campaign.campanha,
      fullName: campaign.campanha,
      roas: campaign.roas,
      investimento: campaign.investimento,
      receita: campaign.receita,
      color: COLORS[index % COLORS.length],
      percentage: (campaign.roas / maxRoas) * 100,
    }));
  }, [topCampaigns, maxRoas]);

  if (chartData.length === 0) {
    return (
      <ChartCard title="ROAS por Campanha" subtitle="Top 5 campanhas">
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Nenhuma campanha disponível
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="ROAS por Campanha" subtitle="Top 5 campanhas por retorno">
      <div className="space-y-3 h-full flex flex-col justify-center px-1">
        {chartData.map((campaign, index) => (
          <div key={index} className="group">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: campaign.color }}
                />
                <span 
                  className="text-muted-foreground truncate text-xs group-hover:text-foreground transition-colors" 
                  title={campaign.fullName}
                >
                  {campaign.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                {campaign.roas >= 1 ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={`font-semibold text-sm ${
                  campaign.roas >= 1 ? 'text-success' : 'text-destructive'
                }`}>
                  {formatROAS(campaign.roas)}
                </span>
              </div>
            </div>
            <div className="h-2 bg-[hsl(217,20%,18%)] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-90"
                style={{ 
                  width: `${campaign.percentage}%`,
                  backgroundColor: campaign.color,
                  boxShadow: `0 0 8px ${campaign.color}40`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
