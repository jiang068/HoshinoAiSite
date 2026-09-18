const {chromium}=require('playwright');
const path=require('node:path');const fs=require('node:fs');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const base=process.env.VIEWER_URL||'http://127.0.0.1:8010/';
(async()=>{
 fs.mkdirSync(path.join(root,'.cache/temp'),{recursive:true});
 const context=await chromium.launchPersistentContext(path.join(root,'.cache/test-browser'),{executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,env:{...process.env,TEMP:path.join(root,'.cache/temp'),TMP:path.join(root,'.cache/temp')},viewport:{width:1440,height:1000}});
 const results={date:new Date().toISOString(),checks:{},errors:[],externalRequests:[]};
 try{
  const page=await context.newPage();page.on('pageerror',e=>results.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')results.errors.push(m.text());});
  page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))results.externalRequests.push(r.url());});
  await page.goto(base);await page.waitForFunction(()=>!!window.viewer,{timeout:60000});await page.waitForTimeout(500);
  await page.screenshot({path:path.join(root,'.cache/front.png')});
  results.checks.groups=await page.evaluate(()=>Object.fromEntries(Object.entries(viewer.groups).map(([k,v])=>[k,v.length])));
  for(const key of Object.keys(results.checks.groups)){
   assert(results.checks.groups[key]>0);await page.locator(`#layer-${key}`).uncheck();
   assert(await page.evaluate(k=>viewer.groups[k].every(o=>!o.visible),key));
   await page.locator(`#layer-${key}`).check();assert(await page.evaluate(k=>viewer.groups[k].every(o=>o.visible),key));
  }
  results.checks.layerToggles=true;
  await page.locator('#solo').click();assert(await page.evaluate(()=>Object.entries(viewer.groups).every(([k,arr])=>arr.every(o=>o.visible===(k==='character')))));
  await page.waitForTimeout(300);await page.screenshot({path:path.join(root,'.cache/character-only.png')});results.checks.solo=true;
  await page.locator('#all').click();
  for(const key of await page.evaluate(()=>Object.keys(viewer.PRESETS))){
   await page.locator(`[data-camera="${key}"]`).click();await page.waitForTimeout(150);
   assert(await page.evaluate(k=>viewer.camera.position.distanceTo(new viewer.camera.position.constructor(...viewer.PRESETS[k].p))<.001,key));
   await page.screenshot({path:path.join(root,`.cache/camera-${key}.png`)});
  }
  results.checks.cameraPresets=7;await page.locator('#reset').click();
  const state=()=>page.evaluate(()=>({p:viewer.camera.position.toArray(),t:viewer.controls.target.toArray(),d:viewer.camera.position.distanceTo(viewer.controls.target)}));
  const initial=await state();await page.mouse.move(450,400);await page.mouse.down({button:'left'});await page.mouse.move(550,430,{steps:12});await page.mouse.up({button:'left'});await page.waitForTimeout(500);const rotated=await state();assert.notDeepEqual(initial.p,rotated.p);
  await page.mouse.down({button:'right'});await page.mouse.move(620,480,{steps:12});await page.mouse.up({button:'right'});await page.waitForTimeout(500);const panned=await state();assert.notDeepEqual(rotated.t,panned.t);
  await page.mouse.wheel(0,-300);await page.waitForTimeout(500);assert((await state()).d<panned.d);
  await page.keyboard.press('r');await page.waitForTimeout(300);assert(Math.abs((await state()).d-initial.d)<.001);results.checks.mouseAndReset=true;
  await page.setViewportSize({width:390,height:844});await page.locator('#reset').click();await page.waitForTimeout(300);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(root,'.cache/mobile.png'),fullPage:true});results.checks.mobileNoOverflow=true;
  assert.equal((await context.request.get(base+'.git/config')).status(),403);assert.equal((await context.request.get(base+'.cache/front.png')).status(),403);results.checks.privatePathsBlocked=true;
  assert.equal(results.errors.length,0);assert.equal(results.externalRequests.length,0);
  console.log(JSON.stringify(results,null,2));
 }finally{fs.writeFileSync(path.join(root,'.cache/test-results.json'),JSON.stringify(results,null,2));await context.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
