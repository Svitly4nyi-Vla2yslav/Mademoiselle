import { mkdirSync, readdirSync, copyFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
for (const scene of ['coffee','breakfast','interior']) {
  for (const variant of ['desktop','mobile']) {
    const source = join('media-source', scene, variant + '.mp4');
    if (!existsSync(source)) throw new Error('Missing source: ' + source);
    const dir = join('public','media',scene,variant);
    mkdirSync(dir,{recursive:true});
    for (const file of readdirSync(dir)) if (/^frame-\d{4}\.webp$/.test(file)) rmSync(join(dir,file));
    const width = variant === 'desktop' ? 1280 : 720;
    const result = spawnSync('ffmpeg',['-v','error','-y','-i',source,'-an','-vf','fps=15,scale='+width+':-2:flags=lanczos','-c:v','libwebp','-quality','68','-compression_level','4','-start_number','0',join(dir,'frame-%04d.webp')],{stdio:'inherit'});
    if (result.error || result.status !== 0) throw result.error || new Error('ffmpeg failed');
    const frames = readdirSync(dir).filter(file => /^frame-\d{4}\.webp$/.test(file)).sort();
    if (!frames.length) throw new Error('No frames generated');
    const probe = spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',join(dir,frames[0])],{encoding:'utf8'});
    if (probe.status !== 0) throw new Error('ffprobe failed');
    const dimensions = JSON.parse(probe.stdout).streams[0];
    copyFileSync(join(dir,frames[0]),join(dir,'poster.webp'));
    writeFileSync(join(dir,'manifest.json'),JSON.stringify({frameCount:frames.length,fps:15,width:dimensions.width,height:dimensions.height,pattern:'frame-{index}.webp',poster:'poster.webp'},null,2)+'\n');
    console.log(scene,variant,frames.length);
  }
}
