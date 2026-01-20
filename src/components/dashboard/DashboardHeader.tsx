import { RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterBar } from './FilterBar';
import { FilterState, Granularity, DateRange } from '@/types/dashboard';

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
  return (
    <header className="border-b border-border bg-[hsl(215,35%,11%)] sticky top-0 z-30">
      <div className="px-6 py-4">
        {/* Top Row: Filters + Actions */}
        <div className="flex items-center justify-between gap-4">
          {/* Filter Bar */}
          <div className="flex-1">
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
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefreshData}
              className="h-9 gap-2 text-success hover:bg-success/10 hover:border-success/50 hover:text-success"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
              className="h-9 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Resetar</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
