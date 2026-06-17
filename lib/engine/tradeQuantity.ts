export function incrementTradeQuantity(current: number, step: number): number {
  const next = Math.round((Number.isFinite(current) ? current : 1) + step);
  return Math.max(1, next);
}
