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
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Performance por Campanha</CardTitle>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedCampaign(isExpanded ? null : row.campanha)}
                        >
                          <TableCell>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{row.campanha}</TableCell>
                          <TableCell>{formatCurrency(row.investimento)}</TableCell>
                          <TableCell>{formatNumber(row.impressoes)}</TableCell>
                          <TableCell>{formatNumber(row.cliques)}</TableCell>
                          <TableCell>{formatPercent(row.ctr)}</TableCell>
                          <TableCell>{formatNumber(row.leads)}</TableCell>
                          <TableCell>{formatCurrency(row.cpl)}</TableCell>
                          <TableCell>{formatNumber(row.conversoes)}</TableCell>
                          <TableCell className={cn(
                            cpaColor === 'destructive' && 'text-destructive font-medium',
                            cpaColor === 'warning' && 'text-warning font-medium',
                            cpaColor === 'success' && 'text-success font-medium'
                          )}>
                            {formatCurrency(row.cpa)}
                          </TableCell>
                          <TableCell>{formatCurrency(row.receita)}</TableCell>
                          <TableCell className={cn(
                            'font-medium',
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
                            <TableRow key={group.grupo_anuncio} className="bg-muted/30">
                              <TableCell></TableCell>
                              <TableCell className="pl-8 text-muted-foreground">{group.grupo_anuncio}</TableCell>
                              <TableCell>{formatCurrency(group.investimento)}</TableCell>
                              <TableCell>{formatNumber(group.impressoes)}</TableCell>
                              <TableCell>{formatNumber(group.cliques)}</TableCell>
                              <TableCell>{formatPercent(group.ctr)}</TableCell>
                              <TableCell>{formatNumber(group.leads)}</TableCell>
                              <TableCell>{formatCurrency(group.cpl)}</TableCell>
                              <TableCell>{formatNumber(group.conversoes)}</TableCell>
                              <TableCell className={cn(
                                getCPAColor(group.cpa) === 'destructive' && 'text-destructive',
                                getCPAColor(group.cpa) === 'warning' && 'text-warning'
                              )}>
                                {formatCurrency(group.cpa)}
                              </TableCell>
                              <TableCell>{formatCurrency(group.receita)}</TableCell>
                              <TableCell className={cn(
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
              <TableRow className="bg-muted font-bold border-t-2">
                <TableCell></TableCell>
                <TableCell>TOTAL</TableCell>
                <TableCell>{formatCurrency(totals.investimento)}</TableCell>
                <TableCell>{formatNumber(totals.impressoes)}</TableCell>
                <TableCell>{formatNumber(totals.cliques)}</TableCell>
                <TableCell>{formatPercent(totalMetrics.ctr)}</TableCell>
                <TableCell>{formatNumber(totals.leads)}</TableCell>
                <TableCell>{formatCurrency(totalMetrics.cpl)}</TableCell>
                <TableCell>{formatNumber(totals.conversoes)}</TableCell>
                <TableCell>{formatCurrency(totalMetrics.cpa)}</TableCell>
                <TableCell>{formatCurrency(totals.receita)}</TableCell>
                <TableCell>{formatROAS(totalMetrics.roas)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
