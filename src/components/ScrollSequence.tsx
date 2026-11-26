import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { frameUrl, clampFrame, drawCover, type Manifest, validManifest } from '../lib/sequence';
import { liquidMask } from '../lib/liquidMask';

gsap.registerPlugin(ScrollTrigger);
const mediaRoot = import.meta.env.BASE_URL + 'media/';
type Scene = 'coffee' | 'breakfast' | 'interior';
type Props = { id: string; scene: Scene; children: ReactNode; priority?: boolean; scrollLength?: number; align?: 'left' | 'right'; portalTo?: Scene };
const MAX_CACHE = 18;
const smooth = (a: number, b: number, p: number) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const MAX_IN_FLIGHT = 3;

export default function ScrollSequence({ id, scene, children, priority = false, scrollLength = 180, align = 'left', portalTo }: Props) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = section.current;
    const surface = canvas.current;
    const holder = stage.current;
    if (!el || !surface || !holder) return;
    const ctx = surface.getContext('2d', { alpha: false });
    if (!ctx) return;
    const responsive = window.matchMedia('(max-width: 767px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let stop = () => {};
    const setup = () => {
      stop();
      surface.classList.remove('is-ready');
      el.classList.remove('is-past');
      holder.classList.remove('is-copy-hidden');
      delete surface.dataset.frame;
      delete surface.dataset.frameCount;
      delete surface.dataset.variant;
      for (const key of ['--scene-progress', '--copy-opacity', '--copy-shift', '--camera-scale', '--transition-out', '--transition-in', '--shade-opacity', '--liquid-mask', '--liquid-rim-mask', '--liquid-rim-opacity', '--liquid-visibility']) holder.style.removeProperty(key);
      delete holder.dataset.liquidProgress;
      if (reduced.matches) return;
      const variant = responsive.matches ? 'mobile' : 'desktop';
      surface.dataset.variant = variant;
      const base = mediaRoot + scene + '/' + variant + '/';
      const abort = new AbortController();
      const cache = new Map<number, HTMLImageElement>();
      const pending = new Map<number, HTMLImageElement>();
      const failed = new Set<number>();
      let manifest: Manifest | undefined;
      let target = 0;
      let progress = 0;
      let portalProgress = 0;
      let stageWidth = Math.max(1, holder.clientWidth);
      let stageHeight = Math.max(1, holder.clientHeight);
      let disposed = false;
      let active = false;
      let started = false;
      let lastImage: HTMLImageElement | undefined;
      let raf = 0;
      let observer: IntersectionObserver | undefined;
      const render = () => {
        raf = 0;
        if (disposed) return;
        let selected = target;
        let image = cache.get(target);
        if (!image) {
          let distance = Infinity;
          for (const [index, candidate] of cache) {
            if (Math.abs(index - target) < distance) {
              selected = index; image = candidate; distance = Math.abs(index - target);
            }
          }
        }
        if (!image && !lastImage) return;
        if (image) {
          cache.delete(selected); cache.set(selected, image);
          lastImage = image;
          surface.dataset.frame = String(selected);
        }
        if (lastImage) {
          drawCover(ctx, lastImage, surface.width, surface.height);
          surface.classList.add('is-ready');
        }
      };
      const scheduleRender = () => { if (!raf && !disposed) raf = requestAnimationFrame(render); };
      const paintLiquid = () => {
        if (!portalTo) return;
        const mask = liquidMask(portalProgress, stageWidth, stageHeight, responsive.matches);
        holder.style.setProperty('--liquid-mask', mask.image);
        holder.style.setProperty('--liquid-rim-mask', mask.rim);
        holder.style.setProperty('--liquid-rim-opacity', String(mask.rimOpacity));
        holder.style.setProperty('--liquid-visibility', portalProgress > 0 ? 'visible' : 'hidden');
        holder.dataset.liquidProgress = String(portalProgress);
      };
      const resize = () => {
        const rect = holder.getBoundingClientRect();
        stageWidth = Math.max(1, rect.width);
        stageHeight = Math.max(1, rect.height);
        paintLiquid();
        const ratio = Math.min(window.devicePixelRatio || 1, responsive.matches ? 1.5 : 2, Math.sqrt(2_500_000 / Math.max(1, rect.width * rect.height)));
        const w = Math.max(1, Math.round(rect.width * ratio));
        const h = Math.max(1, Math.round(rect.height * ratio));
        if (surface.width !== w || surface.height !== h) {
          surface.width = w; surface.height = h;
          if (lastImage) drawCover(ctx, lastImage, w, h);
          scheduleRender();
        }
      };
      const pump = () => {
        if (!manifest || disposed || !active) return;
        const order = [target];
        for (let i = 1; i <= 8; i++) order.push(target + i, target - i);
        for (const index of order) {
          if (pending.size >= MAX_IN_FLIGHT) break;
          if (index < 0 || index >= manifest.frameCount || cache.has(index) || pending.has(index) || failed.has(index)) continue;
          const image = new Image();
          image.decoding = 'async';
          pending.set(index, image);
          image.onload = () => {
            pending.delete(index);
            if (disposed) return;
            cache.set(index, image);
            while (cache.size > MAX_CACHE) {
              const victim = [...cache.keys()].filter(key => key !== target && key !== index).sort((a,b) => Math.abs(b-target)-Math.abs(a-target))[0];
              if (victim === undefined) break;
              cache.delete(victim);
            }
            scheduleRender(); pump();
          };
          image.onerror = () => { pending.delete(index); failed.add(index); pump(); };
          image.src = frameUrl(base, manifest, index);
        }
      };
      const update = (p: number) => {
        progress = p;
        holder.style.setProperty('--scene-progress', String(p));
        const exit = smooth(.30, .68, p);
        const entry = priority ? 1 : smooth(0, .16, p);
        const portal = portalTo ? smooth(.66, 1, p) : 0;
        if (portalTo && portal !== portalProgress) {
          portalProgress = portal;
          paintLiquid();
        }
        holder.style.setProperty('--shade-opacity', String(1 - exit * .78));
        holder.classList.toggle('is-copy-hidden', entry * (1 - exit) < .04);
        if (portalTo) el.classList.toggle('is-past', p >= .9999);
        holder.style.setProperty('--copy-opacity', String(entry * (1 - exit)));
        holder.style.setProperty('--copy-shift', String((1 - entry) * 24 - exit * 42) + 'px');
        holder.style.setProperty('--camera-scale', String(1 + (portalTo ? .13 : .055) * smooth(.15, .92, p)));
        holder.style.setProperty('--transition-out', String(portalTo ? 0 : smooth(.87, 1, p)));
        holder.style.setProperty('--transition-in', String(priority || scene === 'breakfast' ? 0 : 1 - smooth(0, .13, p)));
        if (!manifest) return;
        target = clampFrame(p, manifest.frameCount);
        scheduleRender(); pump();
      };
      const trigger = ScrollTrigger.create({
        trigger: el, start: 'top top', end: 'bottom bottom',
        onUpdate: self => update(self.progress),
        onRefresh: self => update(self.progress),
      });
      const start = async () => {
        if (started || disposed) return;
        started = true;
        try {
          const response = await fetch(base + 'manifest.json', { signal: abort.signal });
          if (!response.ok) throw new Error('Manifest unavailable');
          const data: unknown = await response.json();
          if (!validManifest(data)) throw new Error('Invalid manifest');
          if (disposed) return;
          manifest = data;
          surface.dataset.frameCount = String(data.frameCount);
          update(progress);
        } catch (error) {
          if (!disposed) console.warn('[ScrollSequence] Poster fallback:', scene, error);
        }
      };
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(entries => {
          active = entries.some(entry => entry.isIntersecting);
          if (active) { void start(); pump(); }
        }, { rootMargin: '600px 0px' });
        observer.observe(el);
      } else { active = true; void start(); }
      if (priority) { active = true; void start(); }
      const ro = new ResizeObserver(resize);
      ro.observe(holder);
      resize();
      update(trigger.progress);
      stop = () => {
        disposed = true; abort.abort(); observer?.disconnect(); ro.disconnect(); trigger.kill();
        cancelAnimationFrame(raf);
        for (const image of pending.values()) { image.onload = null; image.onerror = null; image.src = ''; }
        pending.clear(); cache.clear(); lastImage = undefined;
      };
    };
    setup();
    responsive.addEventListener('change', setup);
    reduced.addEventListener('change', setup);
    return () => { stop(); responsive.removeEventListener('change', setup); reduced.removeEventListener('change', setup); };
  }, [scene, priority, portalTo]);
  return (
    <section ref={section} id={id} className={'sequence sequence--' + align + ' sequence--' + scene + (portalTo ? ' sequence--portal-source' : '')} style={{ minHeight: scrollLength + 'svh' }}>
      <div ref={stage} className="sequence-stage">
        <picture className="sequence-poster" aria-hidden="true">
          <source media="(max-width: 767px)" srcSet={mediaRoot + scene + '/mobile/poster.webp'} />
          <img src={mediaRoot + scene + '/desktop/poster.webp'} alt="" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'low'} onLoad={event => { event.currentTarget.style.visibility = ''; }} onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />
        </picture>
        <canvas ref={canvas} className="sequence-canvas" aria-hidden="true" />
        <div className="sequence-shade" aria-hidden="true" />
        <div className="scene-transition scene-transition--in" aria-hidden="true" />
        <div className="scene-transition scene-transition--out" aria-hidden="true" />
        {portalTo && <div className="scene-liquid-rim" aria-hidden="true" />}
        {portalTo && (
          <div className="scene-portal scene-portal--liquid" aria-hidden="true" data-transition="organic-liquid">
            <picture>
              <source media="(max-width: 767px)" srcSet={mediaRoot + portalTo + '/mobile/poster.webp'} />
              <img src={mediaRoot + portalTo + '/desktop/poster.webp'} alt="" loading="eager" decoding="async" />
            </picture>
            <div className="scene-portal-shade" />
          </div>
        )}
        <div className="sequence-copy">{children}</div>
        <div className="sequence-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
