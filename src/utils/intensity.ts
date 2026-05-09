/**
 * Sun-intensity colour helpers for the editorial palette.
 *
 *   ≥70  → bright sun  (full sun)
 *   ≥40  → coral       (partial)
 *   ≥1   → sage        (filtered, in shade)
 *    0   → muted gray  (night / overcast)
 */
export function intensityColor(v: number): string {
  if (v >= 70) return '#ED8A1F';
  if (v >= 40) return '#FF6B4A';
  if (v >= 1)  return '#6B9981';
  return '#92929A';
}

/** Soft tinted background for an intensity badge — pairs with intensityColor. */
export function intensityTint(v: number): string {
  if (v >= 70) return 'rgba(237,138,31,0.14)';
  if (v >= 40) return 'rgba(255,107,74,0.12)';
  if (v >= 1)  return 'rgba(107,153,129,0.16)';
  return 'rgba(146,146,154,0.12)';
}

/** Human-friendly label for a given intensity. */
export function intensityLabel(v: number): string {
  if (v >= 70) return 'Full sun';
  if (v >= 40) return 'Partial sun';
  if (v >= 1)  return 'Mostly shaded';
  return 'No sun';
}
