import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {categories,items,priceLabel} from '../lib/menuData';
import {motionEnabled,subscribeMotion} from '../lib/motion';
import {ProductArt} from './ProductArt';
const root=import.meta.env.BASE_URL+'brand/';
export function useBrandAssets(){
 const [ready,setReady]=useState(false);
 useEffect(()=>{const abort=new AbortController();fetch(root+'assets.json',{signal:abort.signal,cache:'no-cache'}).then(r=>r.ok?r.json():null).then(x=>setReady(x?.ready===true)).catch(()=>{});return()=>abort.abort();},[]);
 return ready;
}
export function BrandLogo(){const ready=useBrandAssets();return <img className="brand-logo" src={root+(ready?'logo-light.webp':'logo.svg')} alt="Mademoiselle Gourmet Café" width="210" height="76"/>;}
export function FoodCarousel(){
 const [category,setCategory]=useState(0),[active,setActive]=useState(0),[playing,setPlaying]=useState(true),[hover,setHover]=useState(false),[focus,setFocus]=useState(false),[visible,setVisible]=useState(false),[motion,setMotion]=useState(motionEnabled),[exploded,setExploded]=useState(false);
 const stage=useRef<HTMLDivElement>(null), touch=useRef<number|null>(null);
 const ready=useBrandAssets(), group=items.filter(item=>item.category===category), count=group.length;
 const step=(delta:number)=>{setActive(a=>(a+delta+count)%count);setExploded(false);};
 useEffect(()=>subscribeMotion(()=>setMotion(motionEnabled())),[]);
 useEffect(()=>{if(!stage.current)return;const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.18});observer.observe(stage.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{if(!playing||!motion||hover||focus||!visible||exploded)return;const timer=window.setInterval(()=>{if(!document.hidden)setActive(a=>(a+1)%count);},6500);return()=>clearInterval(timer);},[playing,motion,hover,focus,visible,exploded,count]);
 const current=group[active];
 return <div className="food-carousel" aria-label="Animierte Speisekarten-Designstudie">
 <p className="food-caption">La carte · Illustrationen & Ideen</p>
 <div className="menu-preview food-tabs" aria-label="Speisekartenkategorien">{categories.map((name,i)=><button type="button" key={name} aria-pressed={i===category} onClick={()=>{setCategory(i);setActive(0);setExploded(false);}}><small>0{i+1} /</small><span>{name}</span></button>)}</div>
 <div className="menu-detail food-detail" data-category={category} data-active={current.id} data-art={ready?'generated':'svg'} ref={stage} onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(true);}} onPointerLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocus(false);}} onTouchStart={e=>touch.current=e.changedTouches[0].clientX} onTouchEnd={e=>{if(touch.current===null)return;const d=e.changedTouches[0].clientX-touch.current;touch.current=null;if(Math.abs(d)>45)step(d<0?1:-1);}}>
  <div className="food-stage" aria-live="off"><div className="food-orbit" aria-hidden="true"/>
   {group.map((item,i)=>{let offset=(i-active+count)%count;if(offset>count/2)offset-=count;const selected=offset===0;return <article key={item.id} className={'food-card'+(selected?' is-active':'')} data-offset={offset} aria-hidden={!selected} style={{'--slot':offset,'--distance':Math.abs(offset),'--depth':-Math.abs(offset)*85+'px','--tilt':offset*-13+'deg','--rise':Math.abs(offset)*18+'px','--scale':1-Math.abs(offset)*.12} as CSSProperties}>
    <span className="food-ornament" aria-hidden="true">❦</span><h3>{item.name}</h3><p>{item.description}</p>
    <div className="food-illustration">{ready&&!(selected&&exploded)?<img src={root+'menu/'+item.id+'.webp'} alt={item.name+' – KI-Illustration'} width="480" height="480" decoding="async" loading={selected?'eager':'lazy'} onError={e=>{e.currentTarget.hidden=true;e.currentTarget.nextElementSibling?.classList.remove('art-fallback-hidden');}}/>:null}<div className={ready&&!(selected&&exploded)?'art-fallback-hidden':''}><ProductArt item={item} exploded={selected&&exploded}/></div></div>
    <span className="food-price">{priceLabel(item.price)}</span>
   </article>;})}
  </div>
  <div className="food-controls"><button type="button" className="food-arrow" aria-label="Vorheriges Produkt" onClick={()=>step(-1)}>‹</button><div className="food-dots">{group.map((item,i)=><button key={item.id} type="button" aria-label={item.name+' anzeigen'} aria-pressed={i===active} onClick={()=>{setActive(i);setExploded(false);}}/>)}</div><button type="button" className="food-arrow" aria-label="Nächstes Produkt" onClick={()=>step(1)}>›</button></div>
  <div className="food-actions"><button type="button" aria-pressed={playing} onClick={()=>setPlaying(p=>!p)}>{playing?'Autoplay pausieren':'Autoplay starten'}</button>{category===0&&<button type="button" aria-pressed={exploded} onClick={()=>setExploded(x=>!x)}>{exploded?'Schichten zusammenfügen':'Schichten entdecken'}</button>}</div>
  <p className="food-current" aria-live="polite">{active+1} / {count} · {current.name}</p>
 </div>
 <p className="food-disclaimer">Illustrative Auswahl · KI- und Vektorgrafiken · Keine bestätigte Speisekarte. Preise, Zutaten und Verfügbarkeit bitte direkt beim Café erfragen.</p>
 <a className="food-source" href="https://cafe-mademoiselle-hildesheim.eatbu.com/?lang=de" target="_blank" rel="noopener noreferrer">Originalwebsite des Cafés ↗</a>
 </div>;
}
