import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const live = Boolean(process.env.TEST_SITE_URL);
const url = process.env.TEST_SITE_URL || 'http://127.0.0.1:4173/';
const server = live ? undefined : spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'inherit'});
let browser;
try {
  if (!live) for (let i=0;;i++) {
    try { if ((await fetch(url)).ok) break; } catch {}
    if (i>=50) throw Error('Preview did not start');
    await new Promise(r=>setTimeout(r,200));
  }
  const output=live?'test-results/live':'test-results/local';
  await mkdir(output,{recursive:true});
  browser = await chromium.launch();
  for (const [variant,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]) {
    const page = await browser.newPage({viewport,deviceScaleFactor:1,isMobile:variant==='mobile',hasTouch:variant==='mobile',reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    if(live) {
      // Netlify publishes independently of CI; do not test an older release.
      let current=false;
      for(let attempt=0;attempt<24;attempt++){
        try {
          const response=await page.goto(url+'?release=4.3&attempt='+attempt,{waitUntil:'domcontentloaded',timeout:15000});
          if(response?.ok() && await page.locator('[data-motion-version="4.3"]').count()){current=true;break;}
          await page.locator('[data-motion-version="4.3"]').waitFor({timeout:3000});current=true;break;
        }catch{}
        await new Promise(resolve=>setTimeout(resolve,3000));
      }
      assert(current,'live site has not published Motion 4.3 or is inaccessible');
      errors.length=0;
    } else await page.goto(url);
    await page.waitForSelector('[data-motion-version="4.3"]');
    await page.locator('.cookie-banner').getByRole('button',{name:'Ablehnen',exact:true}).click();
    assert.equal(await page.locator('.cookie-banner').count(),0);
    const consent=await page.evaluate(()=>JSON.parse(localStorage.getItem('mademoiselle-consent-v1')));
    assert.equal(consent.statistics,false);assert.equal(consent.marketing,false);
    assert(await page.locator('.brand-logo').evaluate(async img=>{await img.decode();return img.naturalWidth>0;}));
    for(const path of ['brand/favicon.svg','impressum/','datenschutz/']){
      assert((await page.request.get(new URL(path,url).href)).ok(),path+' HTTP');
    }
    const assetManifest=await page.request.get(new URL('brand/assets.json',url).href);
    assert.equal((await assetManifest.json()).ready,true,'approved brand files published');
    const og=await page.locator('meta[property="og:image"]').getAttribute('content');
    assert(og.endsWith('/brand/share.jpg'),'OG points to approved social card');
    const share=await page.request.get(new URL('brand/share.jpg',url).href);
    assert(share.ok()&&share.headers()['content-type']?.includes('image/jpeg'));
    for(const name of ['logo.webp','logo-light.webp','icon-16.png','icon-32.png','icon-192.png','icon-512.png','apple-touch-icon.png','favicon.ico','menu/espresso.webp','menu/macchiato.webp','menu/cappuccino.webp','menu/latte.webp','menu/creme.webp','menu/chocolate.webp','menu/french.webp','menu/croissant.webp','menu/breakfast.webp','menu/vegetarian.webp','menu/yogurt.webp','menu/brunch.webp','menu/cheesecake.webp','menu/choco-cake.webp','menu/lemon.webp','menu/berry.webp','menu/apple.webp','menu/petits.webp']){
      const response=await page.request.get(new URL('brand/'+name,url).href);
      assert(response.ok()&&response.headers()['content-type']?.startsWith('image/'),'brand image '+name);
    }
    await page.waitForFunction(()=>document.querySelector('.brand-logo').getAttribute('src').endsWith('logo-light.webp'));
    assert.equal(await page.locator('html').getAttribute('data-motion'),'on','motion starts enabled even with system reduced-motion');
    assert.equal(await page.locator('.motion-switch').getAttribute('aria-pressed'),'true');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('html').getAttribute('data-motion'),'on','system preference does not override explicit site behavior');
    for(const scene of ['coffee','breakfast','interior']){
      const manifest=await page.request.get(new URL('media/'+scene+'/'+variant+'/manifest.json',url).href);
      assert(manifest.ok(),'manifest HTTP '+scene+'/'+variant);
      const data=await manifest.json();
      const last=await page.request.get(new URL('media/'+scene+'/'+variant+'/frame-'+String(data.frameCount-1).padStart(4,'0')+'.webp',url).href);
      assert(last.ok() && last.headers()['content-type']?.includes('image/webp'),'frame HTTP/MIME '+scene+'/'+variant);
    }
    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';});
    for (const id of ['start','fruehstueck','ambiente']) {
      const canvas = page.locator('#'+id+' canvas');
      const seek = async progress => {
        await page.waitForFunction(id=>{
          const stage=document.querySelector('#'+id+' .sequence-stage');
          return Number(stage.dataset.scrollEnd)>Number(stage.dataset.scrollStart);
        },id);
        const destination=await page.evaluate(({id,progress})=>{
          const stage=document.querySelector('#'+id+' .sequence-stage');
          const start=Number(stage.dataset.scrollStart), end=Number(stage.dataset.scrollEnd);
          const top=Math.round(start+(end-start)*progress);
          window.scrollTo({top,behavior:'instant'});
          return top;
        },{id,progress});
        // Wait for the physical scroll position, GSAP progress and exact decoded
        // frame together; a nearby cached frame alone is not a settled scene.
        await page.waitForFunction(({id,destination,variant})=>{
          const stage=document.querySelector('#'+id+' .sequence-stage');
          const c=stage.querySelector('canvas');
          const start=Number(stage.dataset.scrollStart), end=Number(stage.dataset.scrollEnd);
          const span=end-start;
          const actual=Math.min(1,Math.max(0,(window.scrollY-start)/span));
          const applied=Number(stage.style.getPropertyValue('--scene-progress'));
          const count=Number(c.dataset.frameCount);
          return span>0 && Math.abs(window.scrollY-destination)<=1 &&
            Math.abs(applied-actual)*span<=.5 &&
            c.classList.contains('is-ready') && c.dataset.variant===variant &&
            count>1 && Number(c.dataset.frame)===Math.round(applied*(count-1));
        },{id,destination,variant},{timeout:20000});
        return canvas.evaluate(c=>({frame:Number(c.dataset.frame),pixels:c.toDataURL()}));
      };
      const start=await seek(.2);
      const startShot=await page.screenshot({path:output+'/'+variant+'-'+id+'-early.png'});
      const startMotion=await page.locator('#'+id+' .sequence-stage').evaluate(el=>({zoom:Number(el.style.getPropertyValue('--camera-scale')),light:Number(el.style.getPropertyValue('--shade-opacity')),shift:parseFloat(el.style.getPropertyValue('--copy-shift'))}));
      const end=await seek(.8);
      const endShot=await page.screenshot({path:output+'/'+variant+'-'+id+'-late.png'});
      const endMotion=await page.locator('#'+id+' .sequence-stage').evaluate(el=>({zoom:Number(el.style.getPropertyValue('--camera-scale')),light:Number(el.style.getPropertyValue('--shade-opacity')),shift:parseFloat(el.style.getPropertyValue('--copy-shift'))}));
      assert(!startShot.equals(endShot),id+' visible screenshot changes');
      assert(endMotion.zoom>startMotion.zoom && endMotion.light<startMotion.light && endMotion.shift<startMotion.shift,id+' cinematic zoom, lighting, text parallax');
      assert.equal(await canvas.evaluate(c=>getComputedStyle(c).visibility),'visible');
      const back=await seek(.2);
      assert(end.frame>start.frame, id+' forward');
      assert(back.frame<end.frame, id+' reverse');
      assert.notEqual(start.pixels,end.pixels,id+' rendered image did not change');
      const stage = page.locator('#'+id+' .sequence-stage');
      const opacityAtStart = await stage.evaluate(el=>Number(getComputedStyle(el.querySelector('.sequence-copy')).opacity));
      await seek(.8);
      const opacityAtEnd = await stage.evaluate(el=>Number(getComputedStyle(el.querySelector('.sequence-copy')).opacity));
      assert(opacityAtStart>.5 && opacityAtEnd<.05, id+' cinematic title exit');
      await seek(.2);
      if (id === 'start') {
        const state = () => stage.evaluate(el=>{
          const portal = el.querySelector('.scene-portal');
          const rim = el.querySelector('.scene-liquid-rim');
          const style = getComputedStyle(portal);
          const rect=el.getBoundingClientRect();
          return { progress:Number(el.dataset.liquidProgress), sceneProgress:Number(el.style.getPropertyValue('--scene-progress')), scrollY:window.scrollY, span:Number(el.dataset.scrollEnd)-Number(el.dataset.scrollStart), width:rect.width, height:rect.height, mask:style.clipPath, visibility:style.visibility, rim:getComputedStyle(rim).clipPath, rimOpacity:Number(getComputedStyle(rim).opacity) };
        });
        assert.equal((await state()).visibility,'hidden','liquid closed at early scroll');
        await seek(.77);
        const first = await state();
        assert(first.progress>0 && first.progress<1 && first.visibility==='visible');
        assert(first.mask.startsWith('polygon(') && first.mask.split(',').length>=80,'organic outline contains 80 points');
        assert(first.rim!==first.mask && first.rimOpacity>0,'visible crema edge');
        await page.waitForFunction(()=>document.querySelector('.scene-portal img').naturalWidth>0);
        await page.screenshot({path:output+'/'+variant+'-liquid-early.png'});
        await seek(.85);
        const second = await state();
        assert(second.progress>first.progress && second.mask!==first.mask,'liquid grows and changes shape');
        await page.screenshot({path:output+'/'+variant+'-liquid-mid.png'});
        await seek(.95);
        const late = await state();
        assert(late.progress>second.progress && late.mask!==second.mask,'liquid expands across viewport');
        await page.screenshot({path:output+'/'+variant+'-liquid-late.png'});
        // Step across the overlapping sticky stages and verify that no child
        // with explicit visibility can keep covering the breakfast chapter.
        await page.evaluate(()=>{
          const source=document.getElementById('start');
          const stage=source.querySelector('.sequence-stage');
          window.scrollTo(0,source.getBoundingClientRect().top+window.scrollY+source.offsetHeight-stage.offsetHeight+3);
        });
        await page.waitForFunction(()=>{
          const source=document.getElementById('start');
          const next=document.querySelector('#fruehstueck .sequence-stage');
          return source.classList.contains('is-past') &&
            getComputedStyle(source.querySelector('.scene-portal')).visibility==='hidden' &&
            getComputedStyle(source.querySelector('.scene-liquid-rim')).visibility==='hidden' &&
            Math.abs(next.getBoundingClientRect().top)<=5;
        });
        await page.waitForFunction(()=>{
          const canvas=document.querySelector('#fruehstueck canvas');
          return canvas.classList.contains('is-ready') && Number(canvas.dataset.frame)<=1;
        },null,{timeout:20000});
        await page.screenshot({path:output+'/'+variant+'-liquid-handoff.png'});
        await seek(.77);
        const reverse = await state();
        assert(Math.abs(reverse.scrollY-first.scrollY)<=1,'reverse returns to the same physical scroll position');
        assert(Math.abs(reverse.sceneProgress-first.sceneProgress)*first.span<=1.5,'reverse GSAP position differs by at most 1.5 scroll pixels');
        assert(Math.abs(reverse.width-first.width)<.5 && Math.abs(reverse.height-first.height)<.5,'same viewport dimensions');
        assert.equal(reverse.visibility,'visible','liquid reappears after reversing the handoff');
        // On mobile Chromium the scroll offset can be rounded to a fractional
        // CSS pixel. Require pixel-equivalent outlines, not string equality
        // for distinct floating point inputs. At identical inputs require exact equality.
        const polygonCoordinates = mask => [...mask.matchAll(/(-?\d+(?:\.\d+)?)%/g)].map(m=>Number(m[1]));
        const compare = (a,b,label) => {
          if (reverse.progress===first.progress && reverse.width===first.width && reverse.height===first.height) {
            assert.equal(a,b,label+' identical inputs');
          }
          const x=polygonCoordinates(a), y=polygonCoordinates(b);
          assert.equal(x.length,160,label+' 80 vertices');
          assert.equal(y.length,x.length,label+' vertex count');
          const maxDelta=Math.max(...x.map((v,i)=>Math.abs(v-y[i])*(i%2===0?first.width:first.height)/100));
          assert(maxDelta<=2,label+' coordinate drift '+maxDelta.toFixed(3)+'px exceeds 2px');
          console.log(variant+' '+label+': '+maxDelta.toFixed(3)+'px drift');
        };
        compare(first.mask,reverse.mask,'liquid reverse outline');
        compare(first.rim,reverse.rim,'liquid reverse rim');
        await seek(.2);
        assert.equal((await state()).visibility,'hidden','liquid closes on reverse');
      }
      await page.screenshot({path:output+'/'+variant+'-'+id+'.png'});
      console.log(variant+' '+id+': '+start.frame+' -> '+end.frame+' -> '+back.frame);
    }
    assert.equal(await page.locator('[data-motion-version="4.3"]').count(),1);
    assert.equal(await page.locator('#start + #fruehstueck').count(),1);
    assert.equal(await page.locator('.gallery-card').count(),3);
    assert.equal(await page.locator('.menu-preview button').count(),3);
    const menu=page.locator('.menu-preview button');
    await menu.nth(1).click();
    assert.equal(await page.locator('.menu-detail').getAttribute('data-category'),'1');
    assert.equal(await menu.nth(1).getAttribute('aria-pressed'),'true');
    await menu.nth(2).click();
    assert.equal(await page.locator('.menu-detail').getAttribute('data-category'),'2');
    await page.waitForFunction(()=>document.querySelector('.food-detail').dataset.art==='generated'&&document.querySelector('.food-card.is-active img')?.naturalWidth>0);
    const stageFood=page.locator('.food-stage');
    await stageFood.scrollIntoViewIfNeeded();
    await page.evaluate(()=>document.activeElement?.blur());
    await page.mouse.move(1,1);
    const autoBefore=await page.locator('.food-detail').getAttribute('data-active');
    await page.waitForFunction(id=>document.querySelector('.food-detail').dataset.active!==id,autoBefore,{timeout:15000});
    console.log(variant+' carousel autoplay: passed');
    const next=page.getByRole('button',{name:'Nächstes Produkt'});
    const before=await page.locator('.food-detail').getAttribute('data-active');
    await next.click();
    assert.notEqual(await page.locator('.food-detail').getAttribute('data-active'),before);
    await page.getByRole('button',{name:'Vorheriges Produkt'}).click();
    assert.equal(await page.locator('.food-detail').getAttribute('data-active'),before);
    assert.equal(await page.locator('.food-card').count(),6);
    await menu.nth(0).click();
    await page.getByRole('button',{name:'Schichten entdecken'}).click();
    assert.equal(await page.locator('.food-card.is-active .product-art.exploded').count(),1);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.food-card.is-active .art-glass')).transform!=='none');
    await page.screenshot({path:output+'/'+variant+'-coffee-layers.png'});
    await page.getByRole('button',{name:'Schichten zusammenfügen'}).click();
    await page.getByRole('button',{name:'Autoplay pausieren'}).click();
    assert.equal(await page.getByRole('button',{name:'Autoplay starten'}).getAttribute('aria-pressed'),'false');
    await stageFood.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('.food-card.is-active img')?.naturalWidth>0);
    await page.screenshot({path:output+'/'+variant+'-speisekarte.png'});
    const pausedAt=await page.locator('.food-detail').getAttribute('data-active');
    await page.evaluate(()=>document.activeElement?.blur());
    await page.mouse.move(1,1);
    await page.waitForTimeout(7000);
    assert.equal(await page.locator('.food-detail').getAttribute('data-active'),pausedAt,'autoplay paused');
    if(variant==='mobile'){
      await stageFood.dispatchEvent('touchstart',{changedTouches:[{clientX:260,clientY:300}]});
      await stageFood.dispatchEvent('touchend',{changedTouches:[{clientX:100,clientY:310}]});
      assert.notEqual(await page.locator('.food-detail').getAttribute('data-active'),pausedAt,'mobile swipe');
    }
    console.log(variant+' menu category interactions: passed');
    // Exercise actual computed visual states, not just DOM presence.
    const seekElement = async (selector, viewportFraction) => {
      await page.evaluate(({selector,viewportFraction})=>{
        const el=document.querySelector(selector);
        window.scrollTo({top:Math.round(el.getBoundingClientRect().top+window.scrollY-innerHeight*viewportFraction),behavior:'instant'});
      },{selector,viewportFraction});
    };
    const flourish='.editorial--welcome .flourish';
    const drawValue=()=>page.locator(flourish+' path').first().evaluate(el=>parseFloat(getComputedStyle(el).strokeDashoffset));
    await seekElement(flourish,.90);
    await page.waitForFunction(selector=>parseFloat(getComputedStyle(document.querySelector(selector+' path')).strokeDashoffset)>.65,flourish);
    const undrawn=await drawValue();
    await page.screenshot({path:output+'/'+variant+'-svg-partial.png'});
    await seekElement(flourish,.35);
    await page.waitForFunction(selector=>parseFloat(getComputedStyle(document.querySelector(selector+' path')).strokeDashoffset)<.05,flourish);
    const drawn=await drawValue();
    assert(drawn<undrawn,'SVG stroke draws on scroll');
    await page.screenshot({path:output+'/'+variant+'-svg-drawn.png'});
    await seekElement(flourish,.90);
    await page.waitForFunction(selector=>parseFloat(getComputedStyle(document.querySelector(selector+' path')).strokeDashoffset)>.65,flourish);
    console.log(variant+' SVG draw/reverse: '+undrawn+' -> '+drawn+' -> '+await drawValue());
    const card=page.locator('.gallery-card').first();
    const image=card.locator('.gallery-image');
    const galleryWidths=await page.locator('.gallery-card').evaluateAll(cards=>cards.map(el=>el.offsetWidth));
    assert(new Set(galleryWidths).size===3,'asymmetrical gallery widths');
    const maskValue=()=>image.evaluate(el=>parseFloat(getComputedStyle(el).getPropertyValue('--reveal')));
    const tiltValue=()=>card.evaluate(el=>parseFloat(getComputedStyle(el).getPropertyValue('--depth-tilt')));
    await seekElement('.gallery-image',.94);
    await page.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('.gallery-image')).getPropertyValue('--reveal'))>65);
    const closed=await maskValue(), tiltEarly=await tiltValue();
    const clipBefore=await image.evaluate(el=>getComputedStyle(el).clipPath);
    await page.screenshot({path:output+'/'+variant+'-gallery-mask-partial.png'});
    await seekElement('.gallery-image',.30);
    await page.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('.gallery-image')).getPropertyValue('--reveal'))<5);
    const opened=await maskValue(), tiltLate=await tiltValue();
    assert(opened<closed && (await image.evaluate(el=>getComputedStyle(el).clipPath))!==clipBefore,'image clip-path opens on scroll');
    assert(tiltLate>tiltEarly,'scroll-driven perspective changes');
    assert((await card.evaluate(el=>getComputedStyle(el).transform)).startsWith('matrix3d('),'computed 3D transform');
    await page.screenshot({path:output+'/'+variant+'-gallery-mask-open.png'});
    await seekElement('.gallery-image',.94);
    await page.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('.gallery-image')).getPropertyValue('--reveal'))>65);
    console.log(variant+' gallery mask/reverse: '+closed+' -> '+opened+' -> '+await maskValue()+'; widths '+galleryWidths.join('/'));
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({path:output+'/'+variant+'-gallery.png'});
    if(variant==='desktop'){
      const box=await card.boundingBox();
      await page.mouse.move(box.x+box.width*.75,box.y+box.height*.25);
      await page.waitForFunction(()=>Math.abs(parseFloat(document.querySelector('.gallery-card').style.getPropertyValue('--tilt-y')))>1);
      assert((await card.evaluate(el=>getComputedStyle(el).transform)).startsWith('matrix3d('),'pointer perspective transform');
      console.log('desktop pointer perspective: passed');
      const button=page.locator('#besuch .magnetic');
      await button.scrollIntoViewIfNeeded();
      const b=await button.boundingBox();
      await page.mouse.move(b.x+b.width*.75,b.y+b.height*.25);
      await page.waitForFunction(()=>Math.abs(parseFloat(document.querySelector('#besuch .magnetic').style.getPropertyValue('--mag-x')))>1);
      await page.waitForFunction(()=>{const t=getComputedStyle(document.querySelector('#besuch .magnetic')).transform;return t!=='none' && Math.abs(new DOMMatrix(t).m41)>1;});
      console.log('desktop magnetic computed translation: passed');
      await page.screenshot({path:output+'/'+variant+'-magnetic.png'});
    }
    await page.locator('.nav-toggle').click();
    assert.equal(await page.locator('#full-menu').evaluate(el=>el.open),true);
    await page.screenshot({path:output+'/'+variant+'-navigation.png'});
    await page.locator('#full-menu a[href="#besuch"]').click();
    await page.waitForFunction(()=>location.hash==='#besuch' && !document.querySelector('#full-menu').open);
    console.log(variant+' fullscreen navigation: passed');
    assert.deepEqual(errors,[]);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
    await page.locator('.motion-switch').click();
    await page.waitForFunction(()=>document.documentElement.dataset.motion==='off' && document.querySelector('#start .sequence-stage').dataset.mediaState==='paused');
    assert.equal(await page.locator('.motion-switch').getAttribute('aria-pressed'),'false');
    await page.emulateMedia({reducedMotion:'no-preference'});
    assert.equal(await page.locator('html').getAttribute('data-motion'),'off','system preference does not restart manually disabled motion');
    await page.locator('#start').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#start canvas')).display==='none' && document.querySelector('#start img').naturalWidth>0);
    assert.equal(await page.locator('#start .sequence-copy').evaluate(el=>getComputedStyle(el).opacity),'1');
    assert.equal(await page.locator('.scene-portal').evaluate(el=>getComputedStyle(el).display),'none');
    assert.equal(await page.locator('.scene-liquid-rim').evaluate(el=>getComputedStyle(el).display),'none');
    assert.equal(await page.locator('#fruehstueck').evaluate(el=>getComputedStyle(el).marginTop),'0px');
    await page.locator('.motion-switch').click();
    await page.waitForFunction(()=>document.documentElement.dataset.motion==='on' && document.querySelector('#start canvas').classList.contains('is-ready'));
    assert.equal(await page.locator('.motion-switch').getAttribute('aria-pressed'),'true');
    await page.locator('.motion-switch').click();
    await page.waitForFunction(()=>document.documentElement.dataset.motion==='off');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(url+'?release=4.3&default=on');
    await page.waitForFunction(()=>document.documentElement.dataset.motion==='on' && document.querySelector('#start canvas')?.classList.contains('is-ready'));
    assert.equal(await page.locator('.motion-switch').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.cookie-banner').count(),0,'consent persists');
    await page.getByRole('button',{name:'Cookie-Einstellungen',exact:true}).click();
    await page.locator('.cookie-options').getByLabel('Statistik').check();
    await page.getByRole('button',{name:'Auswahl speichern'}).click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mademoiselle-consent-v1')).statistics),true);
    console.log(variant+' brand, menu, privacy and default-on checks: passed');
    await page.close();
  }
} finally {
  await browser?.close();
  server?.kill();
}
