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
    const page = await browser.newPage({viewport,deviceScaleFactor:1,isMobile:variant==='mobile',hasTouch:variant==='mobile'});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    if(live) {
      // Netlify publishes independently of CI; do not test an older release.
      let current=false;
      for(let attempt=0;attempt<24;attempt++){
        try {
          const response=await page.goto(url+'?release=4.0&attempt='+attempt,{waitUntil:'domcontentloaded',timeout:15000});
          if(response?.ok() && await page.locator('[data-motion-version="4.0"]').count()){current=true;break;}
          await page.locator('[data-motion-version="4.0"]').waitFor({timeout:3000});current=true;break;
        }catch{}
        await new Promise(resolve=>setTimeout(resolve,3000));
      }
      assert(current,'live site has not published Motion 4.0 or is inaccessible');
      errors.length=0;
    } else await page.goto(url);
    await page.waitForSelector('[data-motion-version="4.0"]');
    assert.equal(await page.locator('html').getAttribute('data-motion'),'on');
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
    assert.equal(await page.locator('[data-motion-version="4.0"]').count(),1);
    assert.equal(await page.locator('#start + #fruehstueck').count(),1);
    assert.equal(await page.locator('.gallery-card').count(),3);
    assert.equal(await page.locator('.menu-preview button').count(),3);
    const menu=page.locator('.menu-preview button');
    await menu.nth(1).click();
    assert.equal(await page.locator('.menu-detail').getAttribute('data-category'),'1');
    assert.equal(await menu.nth(1).getAttribute('aria-pressed'),'true');
    await menu.nth(2).click();
    assert.equal(await page.locator('.menu-detail').getAttribute('data-category'),'2');
    await page.screenshot({path:output+'/'+variant+'-speisekarte.png'});
    const card=page.locator('.gallery-card').first();
    await card.scrollIntoViewIfNeeded();
    const image=card.locator('.gallery-image');
    await page.waitForFunction(()=>parseFloat(document.querySelector('.gallery-image').style.getPropertyValue('--reveal'))<95);
    await page.screenshot({path:output+'/'+variant+'-gallery.png'});
    assert(await page.locator('.flourish-lines path').count()>0);
    if(variant==='desktop'){
      const box=await card.boundingBox();
      await page.mouse.move(box.x+box.width*.75,box.y+box.height*.25);
      await page.waitForFunction(()=>Math.abs(parseFloat(document.querySelector('.gallery-card').style.getPropertyValue('--tilt-y')))>1);
      const button=page.locator('#besuch .magnetic');
      await button.scrollIntoViewIfNeeded();
      const b=await button.boundingBox();
      await page.mouse.move(b.x+b.width*.75,b.y+b.height*.25);
      await page.waitForFunction(()=>Math.abs(parseFloat(document.querySelector('#besuch .magnetic').style.getPropertyValue('--mag-x')))>1);
      await page.screenshot({path:output+'/'+variant+'-magnetic.png'});
    }
    await page.locator('.nav-toggle').click();
    assert.equal(await page.locator('#full-menu').evaluate(el=>el.open),true);
    await page.screenshot({path:output+'/'+variant+'-navigation.png'});
    await page.locator('#full-menu a[href="#besuch"]').click();
    await page.waitForFunction(()=>location.hash==='#besuch');
    assert.deepEqual(errors,[]);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
    await page.locator('.motion-switch').click();
    await page.waitForFunction(()=>document.documentElement.dataset.motion==='off' && document.querySelector('#start .sequence-stage').dataset.mediaState==='paused');
    await page.locator('.motion-switch').click();
    await page.waitForFunction(()=>document.documentElement.dataset.motion==='on');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('#start').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#start canvas')).display==='none' && document.querySelector('#start img').naturalWidth>0);
    assert.equal(await page.locator('#start .sequence-copy').evaluate(el=>getComputedStyle(el).opacity),'1');
    assert.equal(await page.locator('.scene-portal').evaluate(el=>getComputedStyle(el).display),'none');
    assert.equal(await page.locator('.scene-liquid-rim').evaluate(el=>getComputedStyle(el).display),'none');
    assert.equal(await page.locator('#fruehstueck').evaluate(el=>getComputedStyle(el).marginTop),'0px');
    await page.close();
  }
} finally {
  await browser?.close();
  server?.kill();
}
