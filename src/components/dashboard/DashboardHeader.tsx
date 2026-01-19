import { Crown, LogOut, RefreshCw, Download } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Dashboard de Marketing</h1>
              <p className="text-sm text-muted-foreground">King of Languages</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
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
