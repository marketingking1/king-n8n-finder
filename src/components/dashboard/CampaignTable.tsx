import { useState, useMemo } from 'react';
import { CampaignMetrics, MarketingData } from '@/types/dashboard';
import { getROASColor, getCPAColor, groupByGrupo } from '@/lib/metrics';
import { formatCurrency, formatNumber, formatPercent, formatROAS } from '@/lib/formatters';
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
      className="cursor-pointer hover:bg-muted/50 transition-colors text-xs font-medium uppercase tracking-wide"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn(
          "h-3 w-3 transition-colors",
          sortField === field ? "text-primary" : "text-muted-foreground"
        )} />
      </div>
    </TableHead>
  );

  return (
    <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-base font-display font-semibold text-foreground">Performance por Campanha</h3>
        <Button variant="outline" size="sm" onClick={exportCSV} className="h-8 gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
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
            {sortedData.map((row) => {
              const roasColor = getROASColor(row.roas);
              const cpaColor = getCPAColor(row.cpa);
              const isExpanded = expandedCampaign === row.campanha;
              const groupData = isExpanded ? getGroupData(row.campanha) : [];

              return (
                <Collapsible key={row.campanha} open={isExpanded} asChild>
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedCampaign(isExpanded ? null : row.campanha)}
                      >
                        <TableCell className="py-3">
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate text-sm">{row.campanha}</TableCell>
                        <TableCell className="text-sm">{formatCurrency(row.investimento)}</TableCell>
                        <TableCell className="text-sm">{formatNumber(row.impressoes)}</TableCell>
                        <TableCell className="text-sm">{formatNumber(row.cliques)}</TableCell>
                        <TableCell className="text-sm">{formatPercent(row.ctr)}</TableCell>
                        <TableCell className="text-sm">{formatNumber(row.leads)}</TableCell>
                        <TableCell className="text-sm">{formatCurrency(row.cpl)}</TableCell>
                        <TableCell className="text-sm">{formatNumber(row.conversoes)}</TableCell>
                        <TableCell className={cn(
                          "text-sm font-medium",
                          cpaColor === 'destructive' && 'text-destructive',
                          cpaColor === 'warning' && 'text-warning',
                          cpaColor === 'success' && 'text-success'
                        )}>
                          {formatCurrency(row.cpa)}
                        </TableCell>
                        <TableCell className="text-sm">{formatCurrency(row.receita)}</TableCell>
                        <TableCell className={cn(
                          'text-sm font-medium',
                          roasColor === 'success' && 'text-success',
                          roasColor === 'destructive' && 'text-destructive'
                        )}>
                          {formatROAS(row.roas)}
                        </TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <>
                        {groupData.map((group) => (
                          <TableRow key={group.grupo_anuncio} className="bg-[hsl(216,30%,14%)]">
                            <TableCell></TableCell>
                            <TableCell className="pl-8 text-muted-foreground text-sm">{group.grupo_anuncio}</TableCell>
                            <TableCell className="text-sm">{formatCurrency(group.investimento)}</TableCell>
                            <TableCell className="text-sm">{formatNumber(group.impressoes)}</TableCell>
                            <TableCell className="text-sm">{formatNumber(group.cliques)}</TableCell>
                            <TableCell className="text-sm">{formatPercent(group.ctr)}</TableCell>
                            <TableCell className="text-sm">{formatNumber(group.leads)}</TableCell>
                            <TableCell className="text-sm">{formatCurrency(group.cpl)}</TableCell>
                            <TableCell className="text-sm">{formatNumber(group.conversoes)}</TableCell>
                            <TableCell className={cn(
                              "text-sm",
                              getCPAColor(group.cpa) === 'destructive' && 'text-destructive',
                              getCPAColor(group.cpa) === 'warning' && 'text-warning'
                            )}>
                              {formatCurrency(group.cpa)}
                            </TableCell>
                            <TableCell className="text-sm">{formatCurrency(group.receita)}</TableCell>
                            <TableCell className={cn(
                              "text-sm",
                              getROASColor(group.roas) === 'success' && 'text-success',
                              getROASColor(group.roas) === 'destructive' && 'text-destructive'
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
            <TableRow className="bg-[hsl(216,30%,14%)] font-semibold border-t-2 border-border">
              <TableCell></TableCell>
              <TableCell className="text-sm">TOTAL</TableCell>
              <TableCell className="text-sm">{formatCurrency(totals.investimento)}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.impressoes)}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.cliques)}</TableCell>
              <TableCell className="text-sm">{formatPercent(totalMetrics.ctr)}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.leads)}</TableCell>
              <TableCell className="text-sm">{formatCurrency(totalMetrics.cpl)}</TableCell>
              <TableCell className="text-sm">{formatNumber(totals.conversoes)}</TableCell>
              <TableCell className="text-sm">{formatCurrency(totalMetrics.cpa)}</TableCell>
              <TableCell className="text-sm">{formatCurrency(totals.receita)}</TableCell>
              <TableCell className="text-sm">{formatROAS(totalMetrics.roas)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
