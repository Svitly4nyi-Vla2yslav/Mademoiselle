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
      await page.screenshot({path:'test-results/'+variant+'-'+id+'.png'});
      console.log(variant+' '+id+': '+start.frame+' -> '+end.frame+' -> '+back.frame);
    }
    assert.deepEqual(errors,[]);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('#start').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#start canvas')).display==='none' && document.querySelector('#start img').naturalWidth>0);
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
