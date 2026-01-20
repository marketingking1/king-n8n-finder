import { useState, useMemo } from 'react';
import { CampaignMetrics, MarketingData } from '@/types/dashboard';
import { getROASColor, getCPAColor, groupByGrupo } from '@/lib/metrics';
import { formatCurrency, formatNumber, formatPercent, formatROAS } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Download, ArrowUpDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CampaignTableProps {
  data: CampaignMetrics[];
  allData: MarketingData[];
}

type SortField = 'campanha' | 'investimento' | 'impressoes' | 'cliques' | 'ctr' | 'leads' | 'cpl' | 'conversoes' | 'cpa' | 'receita' | 'roas';
type SortDirection = 'asc' | 'desc';

export function CampaignTable({ data, allData }: CampaignTableProps) {
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('investimento');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [data, sortField, sortDirection]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, row) => ({
        investimento: acc.investimento + row.investimento,
        impressoes: acc.impressoes + row.impressoes,
        cliques: acc.cliques + row.cliques,
        leads: acc.leads + row.leads,
        conversoes: acc.conversoes + row.conversoes,
        receita: acc.receita + row.receita,
      }),
      { investimento: 0, impressoes: 0, cliques: 0, leads: 0, conversoes: 0, receita: 0 }
    );
  }, [data]);

  const totalMetrics = {
    ctr: totals.impressoes > 0 ? (totals.cliques / totals.impressoes) * 100 : 0,
    cpl: totals.leads > 0 ? totals.investimento / totals.leads : 0,
    cpa: totals.conversoes > 0 ? totals.investimento / totals.conversoes : 0,
    roas: totals.investimento > 0 ? totals.receita / totals.investimento : 0,
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getGroupData = (campanha: string) => {
    const campaignData = allData.filter(d => d.campanha === campanha);
    return groupByGrupo(campaignData);
  };

  const exportCSV = () => {
    const headers = ['Campanha', 'Investimento', 'Impressões', 'Cliques', 'CTR', 'Leads', 'CPL', 'Conversões', 'CPA', 'Receita', 'ROAS'];
    const rows = sortedData.map(row => [
      row.campanha,
      row.investimento.toFixed(2),
      row.impressoes,
      row.cliques,
      row.ctr.toFixed(2),
      row.leads,
      row.cpl.toFixed(2),
      row.conversoes,
      row.cpa.toFixed(2),
      row.receita.toFixed(2),
      row.roas.toFixed(2),
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'performance_campanhas.csv';
    link.click();
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-card-hover transition-colors text-muted-foreground uppercase text-xs font-medium"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3 text-primary" />
      </div>
    </TableHead>
  );

  return (
    <Card className="glow-card overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-primary/10 bg-background">
        <CardTitle className="text-lg text-foreground">Performance por Campanha</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportCSV}
          className="border-primary/30 hover:border-primary/50 hover:bg-primary/10 text-primary-light"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-background border-b border-primary/10 hover:bg-background">
                <TableHead className="w-8"></TableHead>
                <SortHeader field="campanha">Campanha</SortHeader>
                <SortHeader field="investimento">Investimento</SortHeader>
                <SortHeader field="impressoes">Impressões</SortHeader>
                <SortHeader field="cliques">Cliques</SortHeader>
                <SortHeader field="ctr">CTR</SortHeader>
                <SortHeader field="leads">Leads</SortHeader>
                <SortHeader field="cpl">CPL</SortHeader>
                <SortHeader field="conversoes">Conversões</SortHeader>
                <SortHeader field="cpa">CPA</SortHeader>
                <SortHeader field="receita">Receita</SortHeader>
                <SortHeader field="roas">ROAS</SortHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, index) => {
                const roasColor = getROASColor(row.roas);
                const cpaColor = getCPAColor(row.cpa);
                const isExpanded = expandedCampaign === row.campanha;
                const groupData = isExpanded ? getGroupData(row.campanha) : [];
                const isEven = index % 2 === 0;

                return (
                  <Collapsible key={row.campanha} open={isExpanded} asChild>
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow 
                          className={cn(
                            "cursor-pointer transition-all duration-150",
                            isEven ? "bg-card" : "bg-[hsl(212_27%_9%)]",
                            "hover:bg-card-hover hover:border-l-2 hover:border-l-primary"
                          )}
                          onClick={() => setExpandedCampaign(isExpanded ? null : row.campanha)}
                        >
                          <TableCell>
                            {isExpanded 
                              ? <ChevronDown className="h-4 w-4 text-primary" /> 
                              : <ChevronRight className="h-4 w-4 text-primary" />
                            }
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{row.campanha}</TableCell>
                          <TableCell className="tabular-nums">{formatCurrency(row.investimento)}</TableCell>
                          <TableCell className="tabular-nums">{formatNumber(row.impressoes)}</TableCell>
                          <TableCell className="tabular-nums">{formatNumber(row.cliques)}</TableCell>
                          <TableCell className="tabular-nums">{formatPercent(row.ctr)}</TableCell>
                          <TableCell className="tabular-nums">{formatNumber(row.leads)}</TableCell>
                          <TableCell className="tabular-nums">{formatCurrency(row.cpl)}</TableCell>
                          <TableCell className="tabular-nums">{formatNumber(row.conversoes)}</TableCell>
                          <TableCell className={cn(
                            "tabular-nums font-medium",
                            cpaColor === 'destructive' && 'text-destructive-light',
                            cpaColor === 'warning' && 'text-warning',
                            cpaColor === 'success' && 'text-accent'
                          )}>
                            {formatCurrency(row.cpa)}
                          </TableCell>
                          <TableCell className="tabular-nums text-accent">{formatCurrency(row.receita)}</TableCell>
                          <TableCell className={cn(
                            'font-medium tabular-nums',
                            roasColor === 'success' && 'text-accent',
                            roasColor === 'destructive' && 'text-destructive-light'
                          )}>
                            {formatROAS(row.roas)}
                          </TableCell>
                        </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                        <>
                          {groupData.map((group) => (
                            <TableRow key={group.grupo_anuncio} className="bg-secondary/50">
                              <TableCell></TableCell>
                              <TableCell className="pl-8 text-muted-foreground">{group.grupo_anuncio}</TableCell>
                              <TableCell className="tabular-nums">{formatCurrency(group.investimento)}</TableCell>
                              <TableCell className="tabular-nums">{formatNumber(group.impressoes)}</TableCell>
                              <TableCell className="tabular-nums">{formatNumber(group.cliques)}</TableCell>
                              <TableCell className="tabular-nums">{formatPercent(group.ctr)}</TableCell>
                              <TableCell className="tabular-nums">{formatNumber(group.leads)}</TableCell>
                              <TableCell className="tabular-nums">{formatCurrency(group.cpl)}</TableCell>
                              <TableCell className="tabular-nums">{formatNumber(group.conversoes)}</TableCell>
                              <TableCell className={cn(
                                "tabular-nums",
                                getCPAColor(group.cpa) === 'destructive' && 'text-destructive-light',
                                getCPAColor(group.cpa) === 'warning' && 'text-warning',
                                getCPAColor(group.cpa) === 'success' && 'text-accent'
                              )}>
                                {formatCurrency(group.cpa)}
                              </TableCell>
                              <TableCell className="tabular-nums">{formatCurrency(group.receita)}</TableCell>
                              <TableCell className={cn(
                                "tabular-nums",
                                getROASColor(group.roas) === 'success' && 'text-accent',
                                getROASColor(group.roas) === 'destructive' && 'text-destructive-light'
                              )}>
                                {formatROAS(group.roas)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                );
              })}
              {/* Totals Row */}
              <TableRow className="bg-muted font-bold border-t-2 border-primary/20">
                <TableCell></TableCell>
                <TableCell className="text-foreground">TOTAL</TableCell>
                <TableCell className="tabular-nums">{formatCurrency(totals.investimento)}</TableCell>
                <TableCell className="tabular-nums">{formatNumber(totals.impressoes)}</TableCell>
                <TableCell className="tabular-nums">{formatNumber(totals.cliques)}</TableCell>
                <TableCell className="tabular-nums">{formatPercent(totalMetrics.ctr)}</TableCell>
                <TableCell className="tabular-nums">{formatNumber(totals.leads)}</TableCell>
                <TableCell className="tabular-nums">{formatCurrency(totalMetrics.cpl)}</TableCell>
                <TableCell className="tabular-nums">{formatNumber(totals.conversoes)}</TableCell>
                <TableCell className="tabular-nums">{formatCurrency(totalMetrics.cpa)}</TableCell>
                <TableCell className="tabular-nums text-accent">{formatCurrency(totals.receita)}</TableCell>
                <TableCell className="tabular-nums">{formatROAS(totalMetrics.roas)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
