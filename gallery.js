import * as THREE from 'three';
import {OrbitControls} from './vendor/three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from './vendor/three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from './vendor/three/examples/jsm/loaders/DRACOLoader.js';

const LAYERS={character:['人物','原精度'],stage:['舞台与屏幕','保留构图'],rig:['支架与灯具','简化'],confetti:['礼花碎片','独立网格'],props:['兔子与装饰道具','简化'],effects:['透明特效','Alpha'],venue:['外围场馆','低精度']};
const PRESETS={front:{label:'正面全身',p:[0,2.95,3.9],t:[0,2.85,.2]},portrait:{label:'面部特写',p:[.06,3.28,1.25],t:[.01,3.25,.22]},left:{label:'左前侧',p:[-2.5,3.1,2.9],t:[0,2.85,.1]},right:{label:'右前侧',p:[2.5,3.1,2.9],t:[0,2.85,.1]},back:{label:'背面细节',p:[0,3,-2.8],t:[0,2.85,.1]},wide:{label:'舞台全景',p:[0,5.1,11],t:[0,3,-1.6]},high:{label:'俯视舞台',p:[3,8.5,5.5],t:[0,2.5,-.5]}};
const $=s=>document.querySelector(s);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x15121e);
const camera=new THREE.PerspectiveCamera(36,1,.01,200);
const groups=Object.fromEntries(Object.keys(LAYERS).map(k=>[k,[]]));
let renderer,controls,model;
function fail(error){console.error(error);$('#loading').classList.remove('hidden');$('#loading h2').textContent='无法载入模型';$('#progress').textContent='请使用本地服务器，并确认浏览器支持 WebGL 2。';$('#bar').hidden=true;$('#status').textContent='加载失败';}
function setLayer(key,visible){for(const obj of groups[key])obj.visible=visible;$(`#layer-${key}`).checked=visible;}
function preset(key){
  const {p,t}=PRESETS[key];
  // Flush damping before an exact reset. Narrow screens pull back to avoid cropping.
  controls.enableDamping=false;controls.update();
  controls.target.set(...t);camera.position.set(...p);
  camera.position.sub(controls.target).multiplyScalar(Math.max(1,.9/camera.aspect)).add(controls.target);
  controls.update();controls.enableDamping=true;
  document.querySelectorAll('[data-camera]').forEach(b=>{b.classList.toggle('active',b.dataset.camera===key);b.setAttribute('aria-pressed',String(b.dataset.camera===key));});
}
function resize(){const v=$('#viewport');camera.aspect=v.clientWidth/v.clientHeight;camera.updateProjectionMatrix();renderer.setSize(v.clientWidth,v.clientHeight,false);}
async function start(){
  renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  $('#viewport').append(renderer.domElement);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.screenSpacePanning=true;controls.minDistance=.08;controls.maxDistance=60;
  controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
  renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
  for(const [key,[name,note]] of Object.entries(LAYERS)){
    const label=document.createElement('label');label.className='layer';label.innerHTML=`<input id="layer-${key}" type="checkbox" checked><span>${name}</span><small>${note}</small>`;
    label.querySelector('input').onchange=e=>setLayer(key,e.target.checked);$('#layer-list').append(label);
  }
  for(const [key,value] of Object.entries(PRESETS)){
    const button=document.createElement('button');button.textContent=value.label;button.dataset.camera=key;button.onclick=()=>preset(key);$('#camera-list').append(button);
  }
  $('#all').onclick=()=>Object.keys(groups).forEach(k=>setLayer(k,true));
  $('#solo').onclick=()=>{Object.keys(groups).forEach(k=>setLayer(k,k==='character'));preset('front');};
  $('#reset').onclick=()=>preset('front');window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r'&&!e.ctrlKey&&!e.metaKey)preset('front');});
  resize();preset('front');new ResizeObserver(()=>{resize();}).observe($('#viewport'));
  renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
  const draco=new DRACOLoader().setDecoderPath('./vendor/three/examples/jsm/libs/draco/gltf/');
  try{
    const gltf=await new GLTFLoader().setDRACOLoader(draco).loadAsync('./assets/hoshino.glb',e=>{
      const percent=e.total?100*e.loaded/e.total:0;$('#bar').value=percent;$('#progress').textContent=`${(e.loaded/1e6).toFixed(2)} MB · ${percent>=100?'解码模型…':Math.round(percent)+'%'}`;
    });
    model=gltf.scene;scene.add(model);
    model.traverse(o=>{if(!o.isMesh)return;const key=o.userData.viewerGroup;if(!groups[key])throw new Error(`Unknown model group: ${key}`);groups[key].push(o);if(o.material.transparent)o.material.depthWrite=false;});
    for(const k of Object.keys(groups))if(!groups[k].length)throw new Error(`Missing model group: ${k}`);
    $('#layers').disabled=false;$('#cameras').disabled=false;$('#loading').classList.add('hidden');$('#status').textContent='● 已就绪';
    window.viewer={scene,camera,controls,renderer,model,groups,preset,setLayer,PRESETS};
    const response=await fetch('./assets/optimization-report.json');if(response.ok){const r=await response.json();$('#stats').textContent=`GLB ${(r.glb_bytes/1e6).toFixed(2)} MB · ${r.export_triangles.toLocaleString()} 三角面 · 减少 ${r.saved_percent}% 体积`;}
  }finally{draco.dispose();}
}
start().catch(fail);
