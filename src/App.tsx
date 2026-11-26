import { useEffect, useState } from 'react';
import ScrollSequence from './components/ScrollSequence';

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
        <span>MADEMOISELLE</span><em>Gourmet Café</em>
      </a>
      <nav aria-label="Hauptnavigation">
        <a href="#fruehstueck">Frühstück</a>
        <a href="#genuss">Genuss</a>
        <a href="#ambiente">Ambiente</a>
        <a className="nav-visit" href="#besuch">Besuch <span aria-hidden="true">↗</span></a>
      </nav>
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
          <a key={chapter.scene} className="gallery-card" href={chapter.target}>
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
  return (
    <>
      <a className="skip" href="#content">Zum Inhalt</a>
      <Header />
      <main id="content">
        <ScrollSequence id="start" scene="coffee" priority scrollLength={240} align="left">
          <p className="eyebrow"><span className="chapter-rule" /> Hildesheim · Café & Genuss</p>
          <h1>Ein kleiner<br/>Moment <i>Paris.</i></h1>
          <p className="intro">Zeit für die schönen Dinge des Tages.</p>
          <a className="button" href="#fruehstueck">Entdecken <span aria-hidden="true">↘</span></a>
          <span className="scroll-hint" aria-hidden="true">SCROLLEN & ENTDECKEN <span>↓</span></span>
        </ScrollSequence>
        <section className="editorial editorial--welcome" aria-labelledby="welcome">
          <span className="editorial-index" aria-hidden="true">M.</span>
          <p className="eyebrow">Bonjour, Mademoiselle</p>
          <div className="ornament" aria-hidden="true">✦</div>
          <h2 id="welcome">Genuss beginnt<br/>mit den <i>kleinen Dingen.</i></h2>
          <p>Ein duftender Kaffee, ein gemütlicher Morgen und ein Moment ganz für sich. Eine Einladung, den Alltag für einen Augenblick zu vergessen.</p>
          <a className="text-link" href="#fruehstueck">Le petit déjeuner <span aria-hidden="true">↓</span></a>
        </section>
        <ScrollSequence id="fruehstueck" scene="breakfast" scrollLength={210} align="right">
          <p className="eyebrow"><span className="chapter-rule" /> 01 · Der schöne Morgen</p>
          <h2>Frühstück<br/><i>mit Liebe.</i></h2>
          <p className="intro">Ein guter Tag beginnt mit Genuss.</p>
          <a className="button" href="#genuss">Genuss entdecken <span aria-hidden="true">↘</span></a>
        </ScrollSequence>
        <section id="genuss" className="editorial editorial--rose" aria-labelledby="sweet">
          <p className="eyebrow">02 · Kleine Auszeiten</p>
          <div className="ornament" aria-hidden="true">✧</div>
          <h2 id="sweet">Ein bisschen<br/><i>Lebensfreude.</i></h2>
          <p>Kaffee, Gespräche und die Freude an einem besonderen Augenblick.</p>
          <div className="menu-preview" aria-label="Vorgesehene Speisekartenbereiche">
            <article><span>01 /</span><h3>Kaffee & Getränke</h3><p>Für kleine Genussmomente.</p></article>
            <article><span>02 /</span><h3>Frühstück</h3><p>Für einen schönen Start in den Tag.</p></article>
            <article><span>03 /</span><h3>Süße Momente</h3><p>Für die Pause zwischendurch.</p></article>
          </div>
          <p className="concept-note">Speisekarten-Konzept · Das tatsächliche Angebot und die Preise sind noch nicht bestätigt.</p>
        </section>
        <ScrollSequence id="ambiente" scene="interior" scrollLength={210} align="left">
          <p className="eyebrow"><span className="chapter-rule" /> 03 · Die Atmosphäre</p>
          <h2>Ein Ort zum<br/><i>Wohlfühlen.</i></h2>
          <p className="intro">Ankommen. Durchatmen. Den Moment genießen.</p>
          <a className="button" href="#besuch">Bis bald <span aria-hidden="true">↘</span></a>
        </ScrollSequence>
        <Gallery />
        <section id="besuch" className="editorial visit" aria-labelledby="visit-title">
          <span className="editorial-index" aria-hidden="true">M.</span>
          <p className="eyebrow">Mademoiselle · Hildesheim</p>
          <div className="ornament" aria-hidden="true">✦</div>
          <h2 id="visit-title">À <i>bientôt.</i></h2>
          <p>Dieses Designkonzept ist eine unveröffentlichte Website-Vorschau. Speisekarte, Öffnungszeiten und Kontaktdaten werden erst nach Bestätigung ergänzt.</p>
          <a className="button button--dark" href="#start">Zum Anfang <span aria-hidden="true">↑</span></a>
        </section>
      </main>
      <footer><span>MADEMOISELLE <em>Gourmet Café</em></span><small>Designkonzept · KI-Visualisierungen · Keine offizielle Café-Website</small><small>Konzept: VS Web Studio</small></footer>
    </>
  );
}
