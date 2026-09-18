// Make a static-only output. Never include original sources, Git or caches.
import {mkdir,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const out=join(root,'dist');await mkdir(out,{recursive:true});
for(const file of ['index.html','main.js','stage.js','styles.css','gallery.html','gallery.js','gallery.css','README.md','ATTRIBUTION.md','docs','vendor'])await cp(join(root,file),join(out,file),{recursive:true});
await mkdir(join(out,'assets'),{recursive:true});
for(const file of ['hoshino.glb','optimization-report.json','official-ai-character.png','official-ai-newyear.jpg','official-ai-valentine.jpg','official-ai-song-vol1.jpg'])await cp(join(root,'assets',file),join(out,'assets',file));
console.log('Static site prepared in dist/; no deployment performed.');
