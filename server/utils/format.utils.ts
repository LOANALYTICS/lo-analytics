export function formatPercentage(value: number): string {
  if (isNaN(value) || !isFinite(value)) {
    return "-";
  }
  return `${Math.round(value)}%`;
}

export function formatNumber(value: number): string {
  if (isNaN(value) || !isFinite(value)) {
    return "-";
  }
  return Math.round(value).toString();
}
