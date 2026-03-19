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
      <TabsList className="mb-6 w-auto inline-flex">
        <TabsTrigger 
          value="macro" 
          className="gap-2 px-4"
        >
          <TrendingUp className="h-4 w-4" />
          Visão Macro
        </TabsTrigger>
        <TabsTrigger 
          value="detailed" 
          className="gap-2 px-4"
        >
          <BarChart3 className="h-4 w-4" />
          Análise Micro
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
