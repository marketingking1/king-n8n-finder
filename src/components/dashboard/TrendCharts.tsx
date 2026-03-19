import { TimeSeriesData, FunnelData, CampaignMetrics } from '@/types/dashboard';
import { InvestmentChart } from './charts/InvestmentChart';
import { ImpressionsChart } from './charts/ImpressionsChart';
import { CTRChart } from './charts/CTRChart';
import { ConversionRateChart } from './charts/ConversionRateChart';
import { CPAChart } from './charts/CPAChart';
import { ROASByCampaignChart } from './charts/ROASByCampaignChart';
import { motion } from 'framer-motion';

interface TrendChartsProps {
  timeSeriesData: TimeSeriesData[];
  weeklyTimeSeriesData: TimeSeriesData[]; // Dados sempre agregados por semana para CTR
  funnelData: FunnelData[];
  campaignMetrics?: CampaignMetrics[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export function TrendCharts({ timeSeriesData, weeklyTimeSeriesData, funnelData, campaignMetrics = [] }: TrendChartsProps) {
  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* First row: Investment, Impressions, CTR */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={rowVariants}
      >
        <InvestmentChart data={timeSeriesData} delay={0} />
        <ImpressionsChart data={timeSeriesData} delay={0.08} />
        {/* CTR usa dados semanais para cálculo correto: SUM(cliques)/SUM(impressões) */}
        <CTRChart data={weeklyTimeSeriesData} delay={0.16} />
      </motion.div>
      
      {/* Second row: Conversion Rate, CPA, ROAS by Campaign */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={rowVariants}
      >
        <ConversionRateChart data={timeSeriesData} delay={0.24} />
        <CPAChart data={timeSeriesData} delay={0.32} />
        <ROASByCampaignChart data={campaignMetrics} delay={0.4} />
      </motion.div>
    </motion.div>
  );
}
