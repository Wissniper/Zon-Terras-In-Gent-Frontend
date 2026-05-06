export function intensityColor(v: number): string {
  if (v >= 70) return '#E5870A';
  if (v >= 40) return '#F5AC32';
  return '#9B8570';
}
