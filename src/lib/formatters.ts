export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
}

export function formatDecimal(value: number, decimals = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${formatDecimal(value)}%`;
}

export function formatROAS(value: number): string {
  return `${formatDecimal(value)}x`;
}

export function formatVariation(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatDecimal(value)}%`;
}

export function formatCompact(value: number): string {
  if (value >= 1000000) {
    return `${formatDecimal(value / 1000000, 1)}M`;
  }
  if (value >= 1000) {
    return `${formatDecimal(value / 1000, 1)}K`;
  }
  return formatNumber(value);
}
