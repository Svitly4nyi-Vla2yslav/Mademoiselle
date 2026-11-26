/** A deterministic, responsive liquid-shaped reveal. No time-based animation or filters. */
export interface LiquidMask {
  image: string;
  rim: string;
  rimOpacity: number;
}
const SAMPLES = 80;
const clamp = (n: number) => Math.min(1, Math.max(0, n));

export function liquidMask(progress: number, width: number, height: number, mobile: boolean): LiquidMask {
  const p = clamp(progress);
  const w = Math.max(1, width), h = Math.max(1, height);
  const cx = w * (mobile ? .52 : .61), cy = h * (mobile ? .72 : .64);
  const farthest = Math.max(
    Math.hypot(cx, cy), Math.hypot(w - cx, cy),
    Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy),
  );
  // Finish beyond every viewport corner. The wave envelope vanishes at both ends.
  const radius = farthest * 1.19 * p;
  const envelope = Math.sin(Math.PI * p);
  const rimWidth = Math.min(24, Math.max(7, Math.min(w, h) * .022)) * envelope;
  const phase = p * 1.65;
  const points: string[] = [], rimPoints: string[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const a = i / SAMPLES * Math.PI * 2;
    const wave = envelope * (
      .19 * Math.sin(3 * a + phase) +
      .105 * Math.cos(5 * a - phase * 1.3) +
      .047 * Math.sin(8 * a + phase * .7)
    );
    const distance = radius * (1 + wave);
    const point = (r: number) => (
      ((cx + Math.cos(a) * r) / w * 100).toFixed(3) + '% ' +
      ((cy + Math.sin(a) * r) / h * 100).toFixed(3) + '%'
    );
    points.push(point(distance));
    rimPoints.push(point(distance + rimWidth));
  }
  return {
    image: 'polygon(' + points.join(',') + ')',
    rim: 'polygon(' + rimPoints.join(',') + ')',
    rimOpacity: .72 * envelope,
  };
}
