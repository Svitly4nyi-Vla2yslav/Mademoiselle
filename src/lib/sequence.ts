export interface Manifest { frameCount: number; fps: number; width: number; height: number; pattern: string; poster: string }
export function validManifest(value: unknown): value is Manifest {
  if (!value || typeof value !== 'object') return false;
  const m = value as Partial<Manifest>;
  return typeof m.frameCount === 'number' && Number.isInteger(m.frameCount) && m.frameCount > 0 && m.frameCount <= 10000 &&
    typeof m.width === 'number' && m.width > 0 && typeof m.height === 'number' && m.height > 0 &&
    typeof m.fps === 'number' && m.fps > 0 && m.pattern === 'frame-{index}.webp' && m.poster === 'poster.webp';
}
export function clampFrame(progress: number, count: number) {
  return Math.round(Math.max(0, Math.min(1, progress)) * (count - 1));
}
export function frameUrl(base: string, manifest: Manifest, index: number) {
  return base + manifest.pattern.replace('{index}', String(index).padStart(4, '0'));
}
export function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  if (!image.naturalWidth || !image.naturalHeight) return;
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
}
