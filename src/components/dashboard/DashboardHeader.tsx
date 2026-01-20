import { Crown, LogOut, RefreshCw, RotateCcw } from 'lucide-react';
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
    <header className="border-b border-border bg-[hsl(215,35%,11%)] sticky top-0 z-50">
      <div className="px-6 py-4">
        {/* Top Row: Branding + Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-display font-semibold text-foreground">
                King of Languages
              </h1>
              <p className="text-xs text-muted-foreground">Dashboard de Marketing</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefreshData}
              className="h-9 gap-2 text-success hover:bg-success/10 hover:border-success/50 hover:text-success"
            >
              <RotateCcw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
              className="h-9 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Resetar
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="h-9 gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
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
