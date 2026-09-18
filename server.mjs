import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {brotliCompressSync,gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {join,extname} from 'node:path';
const root=fileURLToPath(new URL(process.argv[3]==='--dist'?'./dist/':'.',import.meta.url));
const port=Number(process.argv[2]||8010);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.glb':'model/gltf-binary','.wasm':'application/wasm','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8'};
const publicRoots=new Set(['index.html','main.js','stage.js','styles.css','gallery.html','gallery.js','gallery.css','README.md','ATTRIBUTION.md','docs','assets','vendor']);
const compressible=new Set(['.html','.js','.css','.json','.md','.svg','.txt']);
http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const parts=(pathname==='/'?'index.html':pathname.replace(/^\//,'')).split('/');
  if(parts.some(p=>p==='..'||p.includes('\\')||p.includes(':')||p.startsWith('.'))||!publicRoots.has(parts[0])){res.writeHead(403);res.end('Forbidden');return;}
  const file=join(root,...parts);if(!(await stat(file)).isFile()){res.writeHead(404);res.end();return;}
  const body=await readFile(file);const ext=extname(file);const accepts=String(req.headers['accept-encoding']||'');let payload=body;let encoding='';
  if(compressible.has(ext)&&body.length>512){if(/\bbr\b/.test(accepts)){payload=brotliCompressSync(body);encoding='br';}else if(/\bgzip\b/.test(accepts)){payload=gzipSync(body,{level:9});encoding='gzip';}}
  const hashed=/[.-][A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/.test(parts.at(-1));
  const headers={'Content-Type':types[ext]||'application/octet-stream','Content-Length':payload.length,'Cache-Control':hashed?'public, max-age=31536000, immutable':'no-cache','Vary':'Accept-Encoding','X-Content-Type-Options':'nosniff'};if(encoding)headers['Content-Encoding']=encoding;
  res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:payload);
 }catch(e){res.writeHead(e.code==='ENOENT'?404:400);res.end('Not found or invalid request');}
}).listen(port,'127.0.0.1',()=>console.log(`Hoshino Model Lab: http://127.0.0.1:${port}/`));
