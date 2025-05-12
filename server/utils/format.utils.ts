export function formatPercentage(value: number): string {
  if (isNaN(value) || !isFinite(value)) {
    return "-";
  }
  return `${Math.round(value)}%`;
}

export function formatNumber(value: number): string {
  if (isNaN(value) || !isFinite(value) || value === 0) {
    return "-";
  }
  return Math.round(value).toString();
}

export function formatKRAverage(value: unknown): string {
  const number = Number(value);
  return !isNaN(number) ? number.toFixed(2) : "-";
}
