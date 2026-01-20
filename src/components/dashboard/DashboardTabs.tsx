import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp } from 'lucide-react';
import { ReactNode } from 'react';

interface DashboardTabsProps {
  macroContent: ReactNode;
  detailedContent: ReactNode;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function DashboardTabs({ macroContent, detailedContent, activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="mb-6 bg-card border border-primary/20">
        <TabsTrigger 
          value="macro" 
          className="data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_hsl(var(--glow-primary)/0.3)] gap-2 transition-all duration-200"
        >
          <TrendingUp className="h-4 w-4" />
          Visão Macro
        </TabsTrigger>
        <TabsTrigger 
          value="detailed" 
          className="data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_hsl(var(--glow-primary)/0.3)] gap-2 transition-all duration-200"
        >
          <BarChart3 className="h-4 w-4" />
          Análise Detalhada
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="macro" className="mt-0 animate-fade-in">
        {macroContent}
      </TabsContent>
      
      <TabsContent value="detailed" className="mt-0 animate-fade-in">
        {detailedContent}
      </TabsContent>
    </Tabs>
  );
}
