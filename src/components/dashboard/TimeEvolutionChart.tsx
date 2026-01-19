import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TimeSeriesData } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface TimeEvolutionChartProps {
  data: TimeSeriesData[];
}

export function TimeEvolutionChart({ data }: TimeEvolutionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evolução Temporal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="data" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => {
                  if (name === 'Conversões') return [formatNumber(value), name];
                  return [formatCurrency(value), name];
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="investimento" 
                name="Investimento"
                stroke="hsl(var(--chart-blue))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="receita" 
                name="Receita"
                stroke="hsl(var(--chart-green))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="conversoes" 
                name="Conversões"
                stroke="hsl(var(--chart-orange))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
