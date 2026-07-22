/** Format subscription prices for the Spanish market (e.g. `5,99 €`). */
export function formatEuroPrice(price: string): string {
  const match = price.match(/€?\s*([\d.,]+)\s*€?/);
  if (!match) return price;

  const amount = Number.parseFloat(match[1].replace(',', '.'));
  if (Number.isNaN(amount)) return price;

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}
