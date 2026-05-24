/** Monthly savings for a negotiation (uses stored value or computes from bill vs target). */
export function getMonthlySavings(n) {
  const stored = Number(n?.savings_achieved);
  if (stored > 0) return stored;
  if (n?.status === "won") {
    const current = Number(n.current_amount);
    const target = Number(n.target_price);
    if (current > 0 && target > 0 && current > target) {
      return current - target;
    }
  }
  return 0;
}

/** Best offer savings — shown even when no deal was formally closed. */
export function getBestOfferSavings(n) {
  const best = Number(n?.best_offer_received);
  const current = Number(n?.current_amount);
  if (best > 0 && current > 0 && current > best) {
    return current - best;
  }
  return 0;
}
