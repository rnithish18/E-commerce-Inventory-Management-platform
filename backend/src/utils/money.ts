/**
 * Money utilities — all amounts in integer paise (₹1 = 100 paise)
 * NEVER use floats for monetary arithmetic
 */

export function formatPaise(paise: number): string {
  if (!Number.isInteger(paise)) {
    throw new Error(`formatPaise: received non-integer value ${paise}`);
  }
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function calculateDiscountPercent(pricePaise: number, mrpPaise: number): number {
  if (mrpPaise <= 0 || mrpPaise <= pricePaise) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}

/**
 * Calculate tax in paise (18% GST, integer arithmetic only)
 */
export function calculateTax(subtotalPaise: number, taxRatePercent = 18): number {
  return Math.round((subtotalPaise * taxRatePercent) / 100);
}

/**
 * Calculate shipping in paise
 * Free above 50000 paise (₹500), else 5000 paise (₹50)
 */
export function calculateShipping(subtotalPaise: number): number {
  return subtotalPaise >= 50000 ? 0 : 5000;
}
