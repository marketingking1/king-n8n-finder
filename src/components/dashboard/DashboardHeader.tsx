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
    <header className="header-sticky">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl gradient-primary">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Acompanhamento de performance - <span className="text-gradient-gold">Perpétuo</span>
              </h1>
              <p className="text-sm text-muted-foreground">Performance Marketing Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefreshData} 
              className="border-accent/30 hover:border-accent/50 hover:bg-accent/10 text-accent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset} 
              className="border-primary/30 hover:border-primary/50 hover:bg-primary/10 text-primary-light"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut} 
              className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive-light"
            >
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
