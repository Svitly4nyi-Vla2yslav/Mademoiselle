import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollSequence from './components/ScrollSequence';
import { MotionSwitch, FullNavigation, Decoration, Speisekarte, pointerMotion, resetPointer } from './components/MotionDetails';
import { motionEnabled, subscribeMotion } from './lib/motion';
import { BrandLogo } from './components/FoodCarousel';
import { CookieSettings, CookieLink } from './components/CookieSettings';
import ReservationForm from './components/ReservationForm';
import './reservation.css';

const media = import.meta.env.BASE_URL + 'media/';
const chapters = [
  { scene: 'coffee', number: '01', title: 'Café', caption: 'Ein Moment für sich.', target: '#start' },
  { scene: 'breakfast', number: '02', title: 'Petit déjeuner', caption: 'Ein Morgen voller Genuss.', target: '#fruehstueck' },
  { scene: 'interior', number: '03', title: 'Ambiance', caption: 'Zeit zum Ankommen.', target: '#ambiente' },
] as const;

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <header className={'site-header' + (scrolled ? ' is-scrolled' : '')}>
      <a className="brand" href="#start" aria-label="Mademoiselle Gourmet Café – Startseite">
        <BrandLogo/>
      </a>
      <nav aria-label="Hauptnavigation">
        <a href="#fruehstueck">Frühstück</a>
        <a href="#genuss">Speisekarte</a>
        <a href="#ambiente">Ambiente</a>
        <a className="nav-visit" href="#besuch">Besuch <span aria-hidden="true">↗</span></a>
      </nav>
      <div className="header-controls"><MotionSwitch/><FullNavigation/></div>
    </header>
  );
}

function Gallery() {
  return (
    <section id="galerie" className="gallery" aria-labelledby="gallery-title">
      <div className="gallery-heading">
        <div><p className="eyebrow">Le journal · 03 impressions</p><h2 id="gallery-title">Momente in <i>Bildern.</i></h2></div>
        <p>Ein kleiner visueller Vorgeschmack auf unsere Designidee.</p>
      </div>
      <div className="gallery-grid">
        {chapters.map(chapter => (
          <a key={chapter.scene} className="gallery-card" href={chapter.target} onPointerMove={event=>pointerMotion(event,'tilt')} onPointerLeave={event=>resetPointer(event.currentTarget)}>
            <div className="gallery-image">
              <img src={media + chapter.scene + '/desktop/poster.webp'} alt="" loading="lazy" decoding="async" />
              <span className="gallery-index">{chapter.number}</span>
            </div>
            <div className="gallery-caption"><div><h3>{chapter.title}</h3><p>{chapter.caption}</p></div><span aria-hidden="true">↗</span></div>
          </a>
        ))}
      </div>
      <p className="gallery-note">KI-Visualisierungen · illustrative Designstudie</p>
    </section>
  );
}

export default function App() {
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!main.current) return;
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      if (!motionEnabled()) return;
      const root = main.current;
      if (!root) return;
      const ctx = gsap.context(() => {
        root.querySelectorAll<HTMLElement>('.editorial-index').forEach(el => {
          gsap.fromTo(el, { yPercent: -14 }, { yPercent: 14, ease: 'none',
            scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
        root.querySelectorAll<HTMLElement>('.gallery-image').forEach(el => {
          gsap.fromTo(el, { '--image-drift': '-10%' }, { '--image-drift': '10%', ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
        root.querySelectorAll<HTMLElement>('.gallery-card').forEach(el => {
          gsap.fromTo(el, {'--depth-tilt':'-8deg'}, {'--depth-tilt':'8deg',ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:true}});
        });
        root.querySelectorAll<HTMLElement>('.gallery-image').forEach(el=>{
          gsap.fromTo(el,{'--reveal':'95%'},{'--reveal':'0%',ease:'none',scrollTrigger:{trigger:el,start:'top 98%',end:'top 48%',scrub:true}});
        });
        root.querySelectorAll<SVGElement>('.flourish').forEach(el=>{
          gsap.fromTo(el,{'--draw':'1'},{'--draw':'0',ease:'none',scrollTrigger:{trigger:el,start:'top 95%',end:'top 45%',scrub:true}});
        });
        root.querySelectorAll<HTMLElement>('.editorial--welcome h2, .editorial--rose h2, .visit h2').forEach(el => {
          gsap.fromTo(el, { y: 44 }, { y: -18, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
      }, root);
      cleanup = () => ctx.revert();
      ScrollTrigger.refresh();
    };
    setup();
    const unsubscribe=subscribeMotion(setup);
    return () => { unsubscribe(); cleanup(); };
  }, []);
  return (
    <>
      <a className="skip" href="#content">Zum Inhalt</a>
      <Header />
      <main ref={main} id="content" data-motion-version="4.4">
        <ScrollSequence id="start" scene="coffee" priority scrollLength={280} align="left" portalTo="breakfast">
          <p className="eyebrow"><span className="chapter-rule" /> Hildesheim · Café & Genuss</p>
          <h1>Ein kleiner<br/>Moment <i>Paris.</i></h1>
          <p className="intro">Zeit für die schönen Dinge des Tages.</p>
          <a className="button magnetic" onPointerMove={event=>pointerMotion(event,'magnet')} onPointerLeave={event=>resetPointer(event.currentTarget)} href="#fruehstueck">Entdecken <span aria-hidden="true">↘</span></a>
          <span className="scroll-hint" aria-hidden="true">SCROLLEN & ENTDECKEN <span>↓</span></span>
        </ScrollSequence>
        <ScrollSequence id="fruehstueck" scene="breakfast" scrollLength={210} align="right">
          <p className="eyebrow"><span className="chapter-rule" /> 01 · Der schöne Morgen</p>
          <h2>Frühstück<br/><i>mit Liebe.</i></h2>
          <p className="intro">Ein guter Tag beginnt mit Genuss.</p>
          <a className="button magnetic" onPointerMove={event=>pointerMotion(event,'magnet')} onPointerLeave={event=>resetPointer(event.currentTarget)} href="#genuss">Genuss entdecken <span aria-hidden="true">↘</span></a>
        </ScrollSequence>
        <section className="editorial editorial--welcome" aria-labelledby="welcome">
          <span className="editorial-index" aria-hidden="true">M.</span>
          <p className="eyebrow">Bonjour, Mademoiselle</p>
          <Decoration/>
          <h2 id="welcome">Genuss beginnt<br/>mit den <i>kleinen Dingen.</i></h2>
          <p>Ein duftender Kaffee, ein gemütlicher Morgen und ein Moment ganz für sich. Eine Einladung, den Alltag für einen Augenblick zu vergessen.</p>
          <a className="text-link" href="#fruehstueck">Le petit déjeuner <span aria-hidden="true">↓</span></a>
        </section>
        <section id="genuss" className="editorial editorial--rose" aria-labelledby="sweet">
          <span className="editorial-index" aria-hidden="true">G.</span>
          <p className="eyebrow">02 · Kleine Auszeiten</p>
          <Decoration/>
          <h2 id="sweet">Ein bisschen<br/><i>Lebensfreude.</i></h2>
          <p>Kaffee, Gespräche und die Freude an einem besonderen Augenblick.</p>
          <Speisekarte/>
          <p className="concept-note">Speisekarten-Konzept · Das tatsächliche Angebot und die Preise sind noch nicht bestätigt.</p>
        </section>
        <ScrollSequence id="ambiente" scene="interior" scrollLength={210} align="left">
          <p className="eyebrow"><span className="chapter-rule" /> 03 · Die Atmosphäre</p>
          <h2>Ein Ort zum<br/><i>Wohlfühlen.</i></h2>
          <p className="intro">Ankommen. Durchatmen. Den Moment genießen.</p>
          <a className="button magnetic" onPointerMove={event=>pointerMotion(event,'magnet')} onPointerLeave={event=>resetPointer(event.currentTarget)} href="#besuch">Bis bald <span aria-hidden="true">↘</span></a>
        </ScrollSequence>
        <Gallery />
        <section id="besuch" className="editorial visit" aria-labelledby="visit-title">
          <span className="editorial-index" aria-hidden="true">M.</span>
          <p className="eyebrow">Mademoiselle · Hildesheim</p>
          <Decoration/>
          <h2 id="visit-title">À <i>bientôt.</i></h2>
          <p>Diese Website ist eine Designstudie. Aktuelle Angebote und Öffnungszeiten bitte direkt beim Café erfragen.</p>
          <p className="visit-contact">Kurzer Hagen 3 · 31134 Hildesheim<br/><a href="tel:+4951216751589">+49 5121 6751589</a><br/><a href="https://cafe-mademoiselle-hildesheim.eatbu.com/?lang=de" target="_blank" rel="noopener noreferrer">Originalwebsite & Öffnungszeiten ↗</a></p>
          <a className="button" href="#reservierung">Reservierung & Anfrage <span aria-hidden="true">↘</span></a>
          <a className="button button--dark magnetic" onPointerMove={event=>pointerMotion(event,'magnet')} onPointerLeave={event=>resetPointer(event.currentTarget)} href="#start">Zum Anfang <span aria-hidden="true">↑</span></a>
        </section>
        <ReservationForm/>
      </main>
      <footer><span>MADEMOISELLE <em>Gourmet Café</em></span><small>Designkonzept · KI-Visualisierungen · Keine offizielle Café-Website</small><small>Konzept: VS Web Studio · Motion 4.4 · Maison Collection</small><div className="footer-legal"><a href="/impressum/">Impressum</a><a href="/datenschutz/">Datenschutz</a><CookieLink/></div></footer>
      <CookieSettings/>
    </>
  );
}
