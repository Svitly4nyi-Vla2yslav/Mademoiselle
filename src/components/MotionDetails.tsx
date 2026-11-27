import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { motionEnabled, setMotionEnabled, subscribeMotion } from '../lib/motion';
import { FoodCarousel } from './FoodCarousel';

const media = import.meta.env.BASE_URL + 'media/';
const links = [
  ['Start','#start'], ['Frühstück','#fruehstueck'], ['Speisekarte','#genuss'],
  ['Ambiente','#ambiente'], ['Galerie','#galerie'], ['Besuch','#besuch'], ['Reservierung','#reservierung'],
] as const;

export function MotionSwitch() {
  const [enabled, setEnabled] = useState(motionEnabled);
  useEffect(() => subscribeMotion(() => setEnabled(motionEnabled())), []);
  return <button type="button" className="motion-switch" aria-pressed={enabled} onClick={() => setMotionEnabled(!enabled)} aria-label="Scroll-Animationen" title={enabled ? 'Animationen ausschalten' : 'Animationen einschalten'}><span className="motion-dot" aria-hidden="true"/>{enabled ? 'Motion an' : 'Motion aus'}</button>;
}
export function FullNavigation() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open,setOpen] = useState(false);
  const close = () => dialog.current?.close();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  },[open]);
  return <>
    <button className="nav-toggle" type="button" aria-expanded={open} aria-controls="full-menu" onClick={() => { dialog.current?.showModal(); setOpen(true); }}>Menü <span aria-hidden="true">☰</span></button>
    <dialog ref={dialog} id="full-menu" className="full-menu" onClose={() => setOpen(false)} aria-label="Hauptmenü">
      <div className="full-menu-top"><span>MADEMOISELLE <i>Gourmet Café</i></span><button type="button" onClick={close} autoFocus>Schließen ×</button></div>
      <div className="full-menu-body"><nav aria-label="Vollbildnavigation">{links.map(([label,href],i)=><a key={href} href={href} onClick={close} style={{animationDelay:i*55+'ms'}}><small>0{i+1}</small>{label}<span aria-hidden="true">↗</span></a>)}</nav>
      <div className="full-menu-photo"><img src={media+'interior/desktop/poster.webp'} alt="" loading="lazy"/><span>Un moment de bonheur.</span></div></div>
    </dialog>
  </>;
}
export function Decoration() {
  return <svg className="flourish" viewBox="0 0 260 94" aria-hidden="true" fill="none">
    <g className="flourish-lines" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path pathLength="1" d="M130 80C115 64 105 48 130 14C155 48 145 64 130 80Z"/>
      <path pathLength="1" d="M130 80C99 79 74 39 48 44C18 51 35 81 60 65C77 54 63 28 40 22C20 16 8 25 4 35M130 80C161 79 186 39 212 44C242 51 225 81 200 65C183 54 197 28 220 22C240 16 252 25 256 35"/>
      <path pathLength="1" d="M130 53C116 35 96 24 78 30C93 43 112 46 130 53M130 53C144 35 164 24 182 30C167 43 148 46 130 53"/>
    </g><circle cx="130" cy="8" r="3" fill="currentColor"/>
  </svg>;
}
export function Speisekarte(){return <FoodCarousel/>;}
export function pointerMotion(event: PointerEvent<HTMLElement>, kind: 'tilt'|'magnet') {
  if (!motionEnabled() || event.pointerType !== 'mouse') return;
  const el=event.currentTarget, r=el.getBoundingClientRect();
  const x=Math.max(-1,Math.min(1,(event.clientX-r.left-r.width/2)/(r.width/2)));
  const y=Math.max(-1,Math.min(1,(event.clientY-r.top-r.height/2)/(r.height/2)));
  if(kind==='tilt') { el.style.setProperty('--tilt-x',(-y*12)+'deg'); el.style.setProperty('--tilt-y',(x*14)+'deg'); }
  else { el.style.setProperty('--mag-x',(x*14)+'px'); el.style.setProperty('--mag-y',(y*9)+'px'); }
}
export function resetPointer(el: HTMLElement) {
  for(const name of ['--tilt-x','--tilt-y','--mag-x','--mag-y']) el.style.removeProperty(name);
}
