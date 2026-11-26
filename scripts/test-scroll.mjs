import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = 'http://127.0.0.1:4173/';
const server = spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'inherit'});
let browser;
try {
  for (let i=0;;i++) {
    try { if ((await fetch(url)).ok) break; } catch {}
    if (i>=50) throw Error('Preview did not start');
    await new Promise(r=>setTimeout(r,200));
  }
  await mkdir('test-results',{recursive:true});
  browser = await chromium.launch();
  for (const [variant,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]) {
    const page = await browser.newPage({viewport,deviceScaleFactor:1,isMobile:variant==='mobile',hasTouch:variant==='mobile'});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url);
    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';});
    for (const id of ['start','fruehstueck','ambiente']) {
      const canvas = page.locator('#'+id+' canvas');
      const seek = async progress => {
        await page.evaluate(({id,progress})=>{
          const section=document.getElementById(id);
          const stage=section.querySelector('.sequence-stage');
          const top=section.getBoundingClientRect().top+window.scrollY;
          window.scrollTo(0, Math.round(top+(section.offsetHeight-stage.offsetHeight)*progress));
        },{id,progress});
        await page.waitForFunction(({id,progress,variant})=>{
          const c=document.querySelector('#'+id+' canvas');
          const count=Number(c.dataset.frameCount);
          return c.classList.contains('is-ready') && c.dataset.variant===variant && count>1 && Math.abs(Number(c.dataset.frame)-Math.round(progress*(count-1)))<=1;
        },{id,progress,variant},{timeout:20000});
        return canvas.evaluate(c=>({frame:Number(c.dataset.frame),pixels:c.toDataURL()}));
      };
      const start=await seek(.2);
      const end=await seek(.8);
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
          return { progress:Number(el.dataset.liquidProgress), mask:style.clipPath, visibility:style.visibility, rim:getComputedStyle(rim).clipPath, rimOpacity:Number(getComputedStyle(rim).opacity) };
        });
        assert.equal((await state()).visibility,'hidden','liquid closed at early scroll');
        await seek(.77);
        const first = await state();
        assert(first.progress>0 && first.progress<1 && first.visibility==='visible');
        assert(first.mask.startsWith('polygon(') && first.mask.split(',').length>=80,'organic outline contains 80 points');
        assert(first.rim!==first.mask && first.rimOpacity>0,'visible crema edge');
        await page.waitForFunction(()=>document.querySelector('.scene-portal img').naturalWidth>0);
        await page.screenshot({path:'test-results/'+variant+'-liquid-early.png'});
        await seek(.85);
        const second = await state();
        assert(second.progress>first.progress && second.mask!==first.mask,'liquid grows and changes shape');
        await page.screenshot({path:'test-results/'+variant+'-liquid-mid.png'});
        await seek(.95);
        const late = await state();
        assert(late.progress>second.progress && late.mask!==second.mask,'liquid expands across viewport');
        await page.screenshot({path:'test-results/'+variant+'-liquid-late.png'});
        await seek(.77);
        assert.equal((await state()).mask,first.mask,'exact same shape at same scroll position in reverse');
        await seek(.2);
        assert.equal((await state()).visibility,'hidden','liquid closes on reverse');
      }
      await page.screenshot({path:'test-results/'+variant+'-'+id+'.png'});
      console.log(variant+' '+id+': '+start.frame+' -> '+end.frame+' -> '+back.frame);
    }
    assert.equal(await page.locator('[data-motion-version="3.1"]').count(),1);
    assert.equal(await page.locator('#start + #fruehstueck').count(),1);
    assert.equal(await page.locator('.gallery-card').count(),3);
    assert.equal(await page.locator('.menu-preview article').count(),3);
    await page.locator('nav a[href="#besuch"]').click();
    await page.waitForFunction(()=>location.hash==='#besuch');
    assert.deepEqual(errors,[]);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
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
  server.kill();
}
