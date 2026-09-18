import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,extname} from 'node:path';
const root=fileURLToPath(new URL(process.argv[3]==='--dist'?'./dist/':'.',import.meta.url));
const port=Number(process.argv[2]||8010);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.glb':'model/gltf-binary','.wasm':'application/wasm','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8'};
const publicRoots=new Set(['index.html','main.js','styles.css','README.md','ATTRIBUTION.md','assets','vendor']);
http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const parts=(pathname==='/'?'index.html':pathname.replace(/^\//,'')).split('/');
  if(parts.some(p=>p==='..'||p.includes('\\')||p.includes(':')||p.startsWith('.'))||!publicRoots.has(parts[0])){res.writeHead(403);res.end('Forbidden');return;}
  const file=join(root,...parts);if(!(await stat(file)).isFile()){res.writeHead(404);res.end();return;}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
 }catch(e){res.writeHead(e.code==='ENOENT'?404:400);res.end('Not found or invalid request');}
}).listen(port,'127.0.0.1',()=>console.log(`Hoshino Model Lab: http://127.0.0.1:${port}/`));
