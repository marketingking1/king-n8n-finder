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
      <TabsList className="mb-6 bg-muted/30 border border-border/50">
        <TabsTrigger 
          value="macro" 
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Visão Macro
        </TabsTrigger>
        <TabsTrigger 
          value="detailed" 
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Análise Detalhada
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="macro" className="mt-0">
        {macroContent}
      </TabsContent>
      
      <TabsContent value="detailed" className="mt-0">
        {detailedContent}
      </TabsContent>
    </Tabs>
  );
}
