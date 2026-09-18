import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';
import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import {transformSync} from 'esbuild';

const root=fileURLToPath(new URL('.',import.meta.url));
const three=fileURLToPath(new URL('./vendor/three/build/three.module.js',import.meta.url));
const decoderRoot='vendor/three/examples/jsm/libs/draco/gltf';
const staticFiles=[
  'assets/hoshino.glb',
  'assets/optimization-report.json',
  `${decoderRoot}/draco_decoder.wasm`,
  `${decoderRoot}/draco_wasm_wrapper.js`,
  `${decoderRoot}/draco_decoder.js`,
  'vendor/three/LICENSE',
  'vendor/three/examples/jsm/libs/draco/LICENSE',
  'vendor/three/examples/jsm/libs/draco/README.md',
  'README.md',
  'ATTRIBUTION.md',
];

function staticAssets(){
  return {name:'static-assets',generateBundle(){
    for(const file of staticFiles){
      let source=readFileSync(resolve(root,file));
      if(file.endsWith('.js'))source=transformSync(source.toString(),{loader:'js',minify:true,legalComments:'none',target:'es2018'}).code;
      this.emitFile({type:'asset',fileName:file,source});
    }
  }};
}

function externalizeDracoDefaults(){
  return {name:'externalize-draco-defaults',transform(code,id){
    if(!id.replaceAll('\\\\','/').endsWith('/DRACOLoader.js'))return;
    return {code:code.replace(/new URL\([\s\S]*?import\.meta\.url\s*\)\.toString\(\)/g,"''"),map:null};
  }};
}

export default defineConfig({
  root,
  base:'./',
  publicDir:false,
  resolve:{alias:[{find:'three',replacement:three}]},
  plugins:[externalizeDracoDefaults(),staticAssets()],
  build:{
    outDir:'dist',
    emptyOutDir:true,
    sourcemap:false,
    minify:'esbuild',
    cssMinify:'lightningcss',
    assetsInlineLimit:0,
    chunkSizeWarningLimit:700,
    rollupOptions:{input:{index:resolve(root,'index.html'),gallery:resolve(root,'gallery.html')}},
  },
});
