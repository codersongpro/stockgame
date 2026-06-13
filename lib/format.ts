// Display formatting helpers (Korean-friendly money / number formatting).

export function formatMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1_0000_0000) return `${sign}${(abs / 1_0000_0000).toFixed(2)}억`;
  if (abs >= 1_0000) return `${sign}${(abs / 1_0000).toFixed(1)}만`;
  return `${sign}${Math.round(abs).toLocaleString()}`;
}

export function formatMoneyFull(n: number): string {
  return `${Math.round(n).toLocaleString()}`;
}

export function formatNum(n: number): string {
  return Math.round(n).toLocaleString();
}

export function formatPct(n: number, digits = 1): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

export function changePct(curr: number, prev: number): number {
  if (!prev) return 0;
  return ((curr - prev) / prev) * 100;
}
