export function invoiceTotal(amounts: number[]): number {
  return amounts
    .map((amount) => Math.round(amount * 100) / 100)
    .reduce((total, amount) => total + amount, 0);
}
