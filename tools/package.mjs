// Make a static-only output. Never include original sources, Git or caches.
import {mkdir,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const out=join(root,'dist');await mkdir(out,{recursive:true});
for(const file of ['index.html','main.js','styles.css','README.md','ATTRIBUTION.md','vendor'])await cp(join(root,file),join(out,file),{recursive:true});
await mkdir(join(out,'assets'),{recursive:true});
for(const file of ['hoshino.glb','optimization-report.json'])await cp(join(root,'assets',file),join(out,'assets',file));
console.log('Static site prepared in dist/; no deployment performed.');
