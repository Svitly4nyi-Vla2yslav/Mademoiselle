import ScrollSequence from './components/ScrollSequence';

export default function App() {
  return (
    <>
      <a className="skip" href="#content">Zum Inhalt</a>
      <header className="site-header">
        <a className="brand" href="#start" aria-label="Mademoiselle Gourmet Café – Startseite">
          <span>MADEMOISELLE</span><em>Gourmet Café</em>
        </a>
        <nav aria-label="Hauptnavigation">
          <a href="#fruehstueck">Frühstück</a>
          <a href="#ambiente">Ambiente</a>
          <a href="#besuch">Besuch</a>
        </nav>
      </header>
      <main id="content">
        <ScrollSequence id="start" scene="coffee" priority scrollLength={220} align="left">
          <p className="eyebrow">Hildesheim · Café & Genuss</p>
          <h1>Ein kleiner<br/>Moment <i>Paris.</i></h1>
          <p className="intro">Zeit für die schönen Dinge des Tages.</p>
          <a className="button" href="#fruehstueck">Entdecken <span aria-hidden="true">↘</span></a>
          <span className="scroll-hint" aria-hidden="true">SCROLLEN & ENTDECKEN <span>↓</span></span>
        </ScrollSequence>
        <section className="editorial" aria-labelledby="welcome">
          <p className="eyebrow">Bonjour, Mademoiselle</p>
          <div className="ornament" aria-hidden="true">✦</div>
          <h2 id="welcome">Genuss beginnt<br/>mit den <i>kleinen Dingen.</i></h2>
          <p>Ein duftender Kaffee, ein gemütlicher Morgen und ein Moment ganz für sich. Eine Einladung, den Alltag für einen Augenblick zu vergessen.</p>
        </section>
        <ScrollSequence id="fruehstueck" scene="breakfast" scrollLength={180} align="right">
          <p className="eyebrow">01 · Der schöne Morgen</p>
          <h2>Frühstück<br/><i>mit Liebe.</i></h2>
          <p className="intro">Ein guter Tag beginnt mit Genuss.</p>
        </ScrollSequence>
        <section className="editorial editorial--rose" aria-labelledby="sweet">
          <p className="eyebrow">02 · Kleine Auszeiten</p>
          <div className="ornament" aria-hidden="true">✧</div>
          <h2 id="sweet">Ein bisschen<br/><i>Lebensfreude.</i></h2>
          <p>Kaffee, Gespräche und die Freude an einem besonderen Augenblick.</p>
        </section>
        <ScrollSequence id="ambiente" scene="interior" scrollLength={180} align="left">
          <p className="eyebrow">03 · Die Atmosphäre</p>
          <h2>Ein Ort zum<br/><i>Wohlfühlen.</i></h2>
          <p className="intro">Ankommen. Durchatmen. Den Moment genießen.</p>
        </ScrollSequence>
        <section id="besuch" className="editorial visit">
          <p className="eyebrow">Mademoiselle · Hildesheim</p>
          <h2>À <i>bientôt.</i></h2>
          <p>Dieses Designkonzept ist eine unveröffentlichte Website-Vorschau. Speisekarte, Öffnungszeiten und Kontaktdaten werden erst nach Bestätigung ergänzt.</p>
          <a className="button button--dark" href="#start">Zum Anfang ↑</a>
        </section>
      </main>
      <footer><span>MADEMOISELLE <em>Gourmet Café</em></span><small>Designkonzept · KI-Visualisierungen · Keine offizielle Café-Website</small><small>Konzept: VS Web Studio</small></footer>
    </>
  );
}
