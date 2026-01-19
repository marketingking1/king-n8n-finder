import { useMacroData } from '@/hooks/useMacroData';
import { MacroKPICards } from './MacroKPICards';
import { SecondaryKPICards } from './SecondaryKPICards';
import { Skeleton } from '@/components/ui/skeleton';

export function MacroSection() {
  const { current, variations, isLoading, periodLabel } = useMacroData();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Nenhum dado macro disponível para o período
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MacroKPICards 
        current={current} 
        variations={variations} 
        periodLabel={periodLabel} 
      />
      <SecondaryKPICards 
        current={current} 
        variations={variations} 
      />
    </div>
  );
}
