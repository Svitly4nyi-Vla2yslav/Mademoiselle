import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

let total = 0;
for (const scene of ['coffee', 'breakfast', 'interior']) {
  for (const variant of ['desktop', 'mobile']) {
    const folder = join('public','media',scene,variant);
    const manifest = JSON.parse(readFileSync(join(folder,'manifest.json'),'utf8'));
    assert(Number.isInteger(manifest.frameCount) && manifest.frameCount > 1);
    assert.equal(manifest.pattern,'frame-{index}.webp');
    assert.equal(manifest.poster,'poster.webp');
    assert(manifest.fps > 0 && manifest.width > 0 && manifest.height > 0);
    assert(variant === 'mobile' ? manifest.height > manifest.width : manifest.width > manifest.height);
    const expected = Array.from({length:manifest.frameCount},(_,i)=>'frame-'+String(i).padStart(4,'0')+'.webp');
    assert.deepEqual(readdirSync(folder).filter(f=>/^frame-\d+\.webp$/.test(f)).sort(),expected);
    for (const name of [...expected,manifest.poster]) {
      const data = readFileSync(join(folder,name));
      assert.equal(data.toString('ascii',0,4),'RIFF',name);
      assert.equal(data.toString('ascii',8,12),'WEBP',name);
      assert(data.length > 12,name);
    }
    const source = join('media-source',scene,variant+'.mp4');
    assert(statSync(source).size > 0, source);
    total += expected.length;
    console.log(scene+'/'+variant+': '+expected.length+' frames, poster and source present');
  }
}
console.log('Verified '+total+' WebP frames across six sequences.');
