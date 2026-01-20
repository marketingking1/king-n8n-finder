import { Rocket, LogOut, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { FilterBar } from './FilterBar';
import { FilterState, Granularity, DateRange } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';

interface DashboardHeaderProps {
  filters: FilterState;
  filterOptions: {
    campanhas: string[];
    grupos: string[];
    canais: string[];
  };
  onDateRangeChange: (range: DateRange) => void;
  onGranularityChange: (granularity: Granularity) => void;
  onCampanhasChange: (campanhas: string[]) => void;
  onGruposChange: (grupos: string[]) => void;
  onCanaisChange: (canais: string[]) => void;
  onReset: () => void;
  onRefreshData: () => void;
}

export function DashboardHeader({
  filters,
  filterOptions,
  onDateRangeChange,
  onGranularityChange,
  onCampanhasChange,
  onGruposChange,
  onCanaisChange,
  onReset,
  onRefreshData,
}: DashboardHeaderProps) {
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Até logo!',
      description: 'Você saiu da sua conta.',
    });
  };

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/30">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Acompanhamento de performance - <span className="text-gradient">Perpétuo</span>
              </h1>
              <p className="text-sm text-muted-foreground">Performance Marketing Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefreshData} className="border-border/50 hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-500">
              <RotateCcw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={onReset} className="border-border/50 hover:border-primary/50 hover:bg-primary/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <FilterBar
          filters={filters}
          filterOptions={filterOptions}
          onDateRangeChange={onDateRangeChange}
          onGranularityChange={onGranularityChange}
          onCampanhasChange={onCampanhasChange}
          onGruposChange={onGruposChange}
          onCanaisChange={onCanaisChange}
        />
      </div>
    </header>
  );
}