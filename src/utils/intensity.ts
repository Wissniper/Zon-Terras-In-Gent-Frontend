/**
 * Sun-intensity colour helpers for the lifestyle palette.
 *
 *   ≥70  → gold      (full sun)
 *   ≥40  → terracotta (partial)
 *   ≥1   → sage     (filtered, in shade)
 *    0   → muted brown (night / overcast)
 */
export function intensityColor(v: number): string {
  if (v >= 70) return '#E5870A';
  if (v >= 40) return '#C4502A';
  if (v >= 1)  return '#8FA382';
  return '#8B7758';
}

/** Soft tinted background for an intensity badge — pairs with intensityColor. */
export function intensityTint(v: number): string {
  if (v >= 70) return 'rgba(229,135,10,0.14)';
  if (v >= 40) return 'rgba(196,80,42,0.12)';
  if (v >= 1)  return 'rgba(143,163,130,0.16)';
  return 'rgba(139,119,88,0.12)';
}

/** Human-friendly label for a given intensity. */
export function intensityLabel(v: number): string {
  if (v >= 70) return 'Full sun';
  if (v >= 40) return 'Partial sun';
  if (v >= 1)  return 'Mostly shaded';
  return 'No sun';
}
