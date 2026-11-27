import { useState, type FormEvent } from 'react';
import { pointerMotion, resetPointer } from './MotionDetails';

type Mode = 'table' | 'event' | 'order';
const options = [
 {id:'table',title:'Tisch reservieren',description:'Ein Platz für Sie und Ihre Liebsten.',icon:'table'},
 {id:'event',title:'Feier anfragen',description:'Besondere Anlässe mit bis zu 30 Gästen.',icon:'event'},
 {id:'order',title:'Bestellung anfragen',description:'Kaffee, Kuchen oder etwas zum Mitnehmen.',icon:'order'}
] as const;
function berlinDate() {
 const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const get=(type:string)=>parts.find(p=>p.type===type)?.value;
 return get('year')+'-'+get('month')+'-'+get('day');
}
function ModeIcon({mode}:{mode:Mode}) {
 return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 {mode==='table'?<><path d="M7 23h34M12 23v17m24-17v17M6 17v12m36-12v12M4 29h10m20 0h10"/><path d="M18 10h12l-2 9h-8zM23 6v-2m4 2 2-3"/></>:mode==='event'?<><path d="M9 34h30v6H9zM12 23h24v11H12zM15 23v-6h18v6M20 17v-6m8 6v-6M20 7v-2m8 2v-2"/><path d="M6 10l3 2m30-2-3 2M8 16l2 1m30-1-2 1"/></>:<><path d="M10 15h28l3 25H7zM17 15v-4a7 7 0 0 1 14 0v4M17 27h14m-7-5v10"/></>}
 </svg>;
}

export default function ReservationForm(){
 const [mode,setMode]=useState<Mode>('table');
 const [sent,setSent]=useState(false);
 const [revision,setRevision]=useState(0);
 const submit=(event:FormEvent<HTMLFormElement>)=>{
   event.preventDefault();
   const form=event.currentTarget;
   if(!form.reportValidity())return;
   // Demo only. No network request, persistence, or actual reservation.
   form.reset();
   setMode('table');
   setRevision(n=>n+1);
   setSent(true);
 };
 return <section id="reservierung" className="reservation-section" aria-labelledby="reservation-title">
  <div className="reservation-intro">
   <p className="reservation-kicker">04 · Un moment pour vous</p>
   <h2 id="reservation-title">Ein Tisch.<br/><i>Ein schöner Moment.</i></h2>
   <p>Ob eine kleine Auszeit allein, ein Frühstück zu zweit oder ein besonderer Anlass mit bis zu 30 Gästen: Hier beginnt Ihre Anfrage.</p>
   <div className="reservation-photo"><img src="/media/interior/desktop/poster.webp" alt="KI-Illustration eines gemütlichen Café-Interieurs" loading="lazy" decoding="async" width="960" height="540"/><span>À votre table.</span></div>
   <p className="reservation-contact">Kurzer Hagen 3 · Hildesheim<br/><a href="tel:+4951216751589">+49 5121 6751589</a></p>
  </div>
  <div className="reservation-panel">
   <p className="reservation-kicker">Réservation · Ihre Anfrage</p>
   <p className="reservation-demo" id="reservation-demo"><strong>Demo / Designstudie.</strong> Es werden keine Daten übertragen und keine echten Reservierungen oder Bestellungen vorgenommen. Bitte verwenden Sie nur Testdaten. Für eine echte Anfrage wenden Sie sich direkt an das Café.</p>
   <form key={revision} className="reservation-form" aria-describedby="reservation-demo" onSubmit={submit} onChange={()=>setSent(false)} autoComplete="off">
    <fieldset className="reservation-modes"><legend>Was möchten Sie anfragen?</legend>
     {options.map(option=><label key={option.id} className={'reservation-mode'+(mode===option.id?' is-selected':'')}>
       <input type="radio" name="request-mode" value={option.id} checked={mode===option.id} onChange={()=>{setMode(option.id);setSent(false);}}/>
       <ModeIcon mode={option.id}/><strong>{option.title}</strong><small>{option.description}</small>
     </label>)}
    </fieldset>
    <div className="reservation-fields">
     <label htmlFor="reservation-name">Ihr Name *<input id="reservation-name" required type="text" maxLength={100} placeholder="Vor- und Nachname"/></label>
     <label htmlFor="reservation-email">E-Mail *<input id="reservation-email" required type="email" maxLength={160} placeholder="name@beispiel.de"/></label>
     <label htmlFor="reservation-phone">Telefon (optional)<input id="reservation-phone" type="tel" maxLength={40} placeholder="+49 …"/></label>
     {mode!=='order'?<label htmlFor="reservation-guests">Personen *<select key={mode} id="reservation-guests" required defaultValue=""><option value="" disabled>Personenzahl wählen</option>{Array.from({length:30},(_,i)=><option value={i+1} key={i+1}>{i+1} {i===0?'Person':'Personen'}</option>)}</select></label>:<label htmlFor="reservation-pickup">Abholung<select id="reservation-pickup" defaultValue="abholung"><option value="abholung">Zum Mitnehmen</option><option value="vorort">Vor Ort</option></select></label>}
     <label htmlFor="reservation-date">{mode==='order'?'Wunschtag':'Datum'} *<input id="reservation-date" type="date" min={berlinDate()} required/></label>
     <label htmlFor="reservation-time">Wunschzeit *<input id="reservation-time" type="time" required/></label>
     {mode==='event'&&<label className="reservation-wide" htmlFor="reservation-occasion">Anlass *<select id="reservation-occasion" required defaultValue=""><option value="" disabled>Bitte wählen</option><option>Geburtstag</option><option>Familienfeier</option><option>Firmenfeier</option><option>Sonstiger Anlass</option></select></label>}
     <label className="reservation-wide" htmlFor="reservation-message">{mode==='order'?'Gewünschte Produkte und Mengen *':'Besondere Wünsche (optional)'}<textarea key={mode} id="reservation-message" rows={4} maxLength={1000} required={mode==='order'} placeholder={mode==='order'?'z. B. 2 Cappuccinos und 1 Stück Kuchen':mode==='event'?'Was macht Ihre Feier besonders?':'z. B. Kinderstuhl oder ein ruhiger Platz am Fenster'}/></label>
    </div>
    <label className="reservation-check"><input id="reservation-ack" type="checkbox" required/><span>Ich habe den Demo-Hinweis und die <a href="/datenschutz/" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a> gelesen. *</span></label>
    <button className="reservation-submit magnetic" type="submit" onPointerMove={e=>pointerMotion(e,'magnet')} onPointerLeave={e=>resetPointer(e.currentTarget)}>{mode==='table'?'Reservierungsanfrage senden':mode==='event'?'Feieranfrage senden':'Bestellanfrage senden'} <span aria-hidden="true">↗</span></button>
    <small className="reservation-required">* Pflichtfelder · Wunschzeiten sind keine bestätigten Verfügbarkeiten.</small>
   </form>
   <div className="reservation-status" role="status" aria-live="polite" aria-atomic="true">{sent&&<div className="reservation-success"><svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#28794b"/><path d="m9 16 5 5 9-10" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg><div><strong>Ihre Nachricht wurde erfolgreich gesendet! (Demo)</strong><p>Die Eingaben wurden zurückgesetzt. Es wurde keine Nachricht übertragen und keine Buchung ausgelöst.</p></div></div>}</div>
  </div>
 </section>;
}
