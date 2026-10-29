import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import './style.css';
import {makeRun,tick,interact,nearby,PEOPLE} from './simulation.js';
import {CELL} from './map.js';
import {createScene} from './scene.js';
import {Sound} from './sound.js';
const $=id=>document.getElementById(id),canvas=$('world');
const search=new URLSearchParams(location.search);const initialSeed=Math.max(1,Math.min(999999,Number(search.get('seed'))||42971));
$('seed').value=initialSeed;if(['rustig','normaal','nachtmerrie'].includes(search.get('mode')))$('mode').value=search.get('mode');
$('reduced').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
let run=makeRun(initialSeed,$('mode').value),view=null,screen='menu',ready=false,lookDrag=null,hadLock=false,lastFrame=performance.now(),noticeUntil=0,minimap=false,joystick={x:0,y:0},touchSprint=false;
const keys=new Set(),visited=new Set(),sound=new Sound();
const fmt=value=>`${String(Math.floor(value/60)).padStart(2,'0')}:${String(Math.floor(value%60)).padStart(2,'0')}`;
function storedBest(mode){try{const x=Number(localStorage.getItem('achterkamers-best-'+mode));return x>0?x:null;}catch{return null;}}
function bestLabel(){const b=storedBest($('mode').value);$('best-menu').textContent=b?'Beste ontsnapping: '+fmt(b):'Nog geen ontsnapping geregistreerd.';}
bestLabel();$('mode').onchange=bestLabel;
function notice(text,seconds=3){$('notice').textContent=text;noticeUntil=performance.now()+seconds*1000;$('notice').style.opacity='1';}
function clearInput(){keys.clear();joystick={x:0,y:0};touchSprint=false;lookDrag=null;$('joystick').firstElementChild.style.transform='translate(0,0)';}
function unlock(){if(document.pointerLockElement===canvas)document.exitPointerLock();}
async function lock(){if(matchMedia('(pointer:coarse)').matches)return;try{await canvas.requestPointerLock();}catch{notice('Sleep met de muis om rond te kijken.',4);}}
function setScreen(next){screen=next;$('menu').hidden=next!=='menu';$('hud').hidden=!['playing','paused'].includes(next);$('pause-screen').hidden=next!=='paused';$('result').hidden=next!=='result';if(next!=='playing'){clearInput();unlock();sound.pause();}}
function pause(){if(screen!=='playing')return;setScreen('paused');$('resume').focus();}
async function start(){
 if(!ready)return;const seed=Math.max(1,Math.min(999999,Math.round(Number($('seed').value)||42971)));const mode=$('mode').value;
 sound.init();sound.setVolume(Number($('volume').value)/100);
 if(seed!==run.map.seed){ready=false;$('start').disabled=true;$('load-status').textContent='Nieuwe kamers worden klaargezet.';const old=view;view=null;old?.dispose();run=makeRun(seed,mode);try{view=await createScene(canvas,run.map);}catch(e){fail(e);return;}ready=true;$('start').disabled=false;}
 else run=makeRun(seed,mode);
 visited.clear();minimap=false;$('map').hidden=true;hadLock=false;clearInput();setScreen('playing');history.replaceState(null,'',`?seed=${seed}&mode=${mode}`);notice('Onthoud de uitgang. Verzamel '+run.keys.length+' passen.',5);lock();
}
function finish(){setScreen('result');const won=run.status==='won';let best=storedBest(run.mode);if(won&&(!best||run.time<best)){best=run.time;try{localStorage.setItem('achterkamers-best-'+run.mode,String(best));}catch{}}
 $('result-title').textContent=won?'Je bent buiten.':'Ingehaald.';$('result-copy').textContent=won?'Voor nu. De kamers zijn er morgen ook nog.':`${PEOPLE.find(p=>p.id===run.caughtBy)?.name||'Iemand'} was je net iets te snel af. De passen lagen er nog. De uitgang ook.`;
 $('result-face').hidden=won;if(!won)$('result-face').src=`faces/${run.caughtBy}.webp`;$('result-time').textContent=fmt(run.time);$('result-cards').textContent=run.collected+' / '+run.keys.length;$('result-best').textContent=best?fmt(best):'—';sound.tone(won?660:56,won?.6:.45,.18);$('again').focus();bestLabel();
}
function fail(error){console.error('Game startup failed',error);$('load-status').classList.add('game-error');$('load-status').textContent='De 3D-wereld kon niet laden. Gebruik een recente browser met WebGL en hardwareversnelling.';$('start').textContent='Opnieuw laden';$('start').disabled=false;$('start').onclick=()=>location.reload();}
function drawMap(){const c=$('map'),x=c.getContext('2d'),size=run.map.size,scale=c.width/size;x.clearRect(0,0,c.width,c.height);x.fillStyle='#11180e';x.fillRect(0,0,c.width,c.height);for(const i of visited){const cell=run.map.cells[i];x.fillStyle='#777b53';x.fillRect(cell.x*scale+1,cell.z*scale+1,scale-2,scale-2);x.strokeStyle='#d7d0a0';x.lineWidth=1;cell.open.forEach((open,d)=>{if(open)return;const a=cell.x*scale,b=cell.z*scale;x.beginPath();if(d===0){x.moveTo(a,b);x.lineTo(a+scale,b);}if(d===1){x.moveTo(a+scale,b);x.lineTo(a+scale,b+scale);}if(d===2){x.moveTo(a,b+scale);x.lineTo(a+scale,b+scale);}if(d===3){x.moveTo(a,b);x.lineTo(a,b+scale);}x.stroke();});}for(const k of run.keys)if(!k.taken&&visited.has(k.cell)){x.fillStyle='#f2ca6d';x.fillRect((k.x/CELL)*scale-2,(k.z/CELL)*scale-2,4,4);}const exit=run.map.center(run.map.start);x.fillStyle='#86cd98';x.fillRect(exit.x/CELL*scale-2,exit.z/CELL*scale-2,4,4);x.fillStyle='#fff4d1';x.beginPath();x.arc(run.player.x/CELL*scale,run.player.z/CELL*scale,3,0,Math.PI*2);x.fill();}
function updateHUD(){const p=run.player;$('card-count').textContent=run.collected+' / '+run.keys.length;$('objective-copy').textContent=run.collected===run.keys.length?'Terug naar de uitgang':'Zoek toegangspassen';$('timer').textContent=fmt(run.time);$('compass').textContent=['N','O','Z','W'][((Math.round(-p.yaw/(Math.PI/2))%4)+4)%4];$('stamina-fill').style.width=p.stamina+'%';$('stamina-copy').textContent=p.stamina<12?'Kom op adem.':'Shift om te sprinten';
 const target=nearby(run);$('hint').hidden=!target;$('interact').hidden=!target;if(target){$('hint-label').textContent=target.label;$('interact').textContent=target.label;}
 const enemies=run.enemies.filter(e=>e.active).map(e=>({...e,distance:Math.hypot(e.x-p.x,e.z-p.z)})).sort((a,b)=>a.distance-b.distance);const nearest=enemies[0];$('threat').hidden=!nearest||nearest.distance>17;
 if(nearest&&nearest.distance<17){$('threat-name').textContent=nearest.name;const image='faces/'+nearest.id+'.webp';if($('threat-face').getAttribute('src')!==image)$('threat-face').src=image;}
 $('danger').style.opacity=nearest?String(Math.max(0,(10-nearest.distance)/13)):'0';sound.update(run,nearest?.distance||100);if(minimap)drawMap();if(performance.now()>noticeUntil)$('notice').style.opacity='0';
}
function use(){if(screen!=='playing')return;if(interact(run)){if(run.status==='won'){finish();return;}sound.tone(640,.2,.16);notice(run.collected===run.keys.length?'Alle passen gevonden. Terug naar de uitgang.':'Toegangspas '+run.collected+' gevonden.');}else if(nearby(run)?.kind==='exit')notice('De uitgang is vergrendeld. Je mist nog passen.');}
function toggleTorch(){if(screen!=='playing')return;run.torch=!run.torch;sound.tone(180,.045,.05,'triangle');notice(run.torch?'Zaklamp aan.':'Zaklamp uit.',1.2);}
function toggleMap(){if(screen!=='playing')return;minimap=!minimap;$('map').hidden=!minimap;}
$('start').onclick=start;$('again').onclick=start;$('result-menu').onclick=$('quit').onclick=()=>{setScreen('menu');run=makeRun(run.map.seed,$('mode').value);$('start').focus();};$('pause').onclick=pause;$('resume').onclick=()=>{setScreen('playing');lock();};$('volume').oninput=()=>sound.setVolume(Number($('volume').value)/100);$('interact').onclick=use;$('touch-map').onclick=toggleMap;$('touch-torch').onclick=toggleTorch;
addEventListener('keydown',event=>{if(event.code==='Escape'){if(screen==='playing')pause();else if(screen==='paused'){$('resume').click();}return;}if(screen!=='playing')return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyE','KeyF','KeyM'].includes(event.code))event.preventDefault();keys.add(event.code);if(!event.repeat){if(event.code==='KeyE')use();if(event.code==='KeyF')toggleTorch();if(event.code==='KeyM')toggleMap();}});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{clearInput();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();notice('De 3D-weergave is onderbroken. Herlaad als het beeld niet terugkomt.',10);});
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement===canvas)hadLock=true;else if(hadLock&&screen==='playing')pause();});
canvas.addEventListener('pointerdown',e=>{if(screen!=='playing')return;if(e.pointerType==='touch'||document.pointerLockElement!==canvas){lookDrag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}if(e.pointerType==='mouse'&&document.pointerLockElement!==canvas)lock();});
canvas.addEventListener('pointermove',e=>{if(screen!=='playing'||!lookDrag||lookDrag.id!==e.pointerId||document.pointerLockElement===canvas)return;run.player.yaw-=(e.clientX-lookDrag.x)*.004;run.player.pitch=Math.max(-1.2,Math.min(1.2,run.player.pitch-(e.clientY-lookDrag.y)*.004));lookDrag.x=e.clientX;lookDrag.y=e.clientY;});
canvas.addEventListener('pointerup',()=>{lookDrag=null;});
document.addEventListener('mousemove',e=>{if(screen==='playing'&&document.pointerLockElement===canvas){run.player.yaw-=e.movementX*.0022;run.player.pitch=Math.max(-1.2,Math.min(1.2,run.player.pitch-e.movementY*.0022));}});
const stick=$('joystick');let stickId=null;
stick.onpointerdown=e=>{e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);};stick.onpointermove=e=>{if(e.pointerId!==stickId)return;const r=stick.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/40,dy=(e.clientY-r.top-r.height/2)/40;const l=Math.max(1,Math.hypot(dx,dy));joystick={x:dx/l,y:dy/l};stick.firstElementChild.style.transform=`translate(${joystick.x*31}px,${joystick.y*31}px)`;};stick.onpointerup=stick.onpointercancel=()=>{stickId=null;joystick={x:0,y:0};stick.firstElementChild.style.transform='translate(0,0)';};
$('touch-sprint').onpointerdown=e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touchSprint=true;};$('touch-sprint').onpointerup=$('touch-sprint').onpointercancel=()=>{touchSprint=false;};
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-lastFrame)/1000,.2);lastFrame=now;if(!view)return;
 if(screen==='playing'){if(keys.has('ArrowLeft'))run.player.yaw+=1.7*dt;if(keys.has('ArrowRight'))run.player.yaw-=1.7*dt;
 const input={forward:(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joystick.y,strafe:(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+joystick.x,sprint:touchSprint||keys.has('ShiftLeft')||keys.has('ShiftRight')};
 let remaining=dt;while(remaining>0&&run.status==='playing'){const step=Math.min(.05,remaining);tick(run,input,step);remaining-=step;}visited.add(run.map.cellAt(run.player.x,run.player.z));updateHUD();if(run.status!=='playing')finish();}
 else{$('danger').style.opacity='0';}
 view.render(run,{preview:screen==='menu',reduced:$('reduced').checked,behind:screen==='playing'&&keys.has('Space')});
}
requestAnimationFrame(frame);
createScene(canvas,run.map).then(scene=>{view=scene;ready=true;$('start').disabled=false;$('start').innerHTML='Begin de achtervolging <svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>';$('load-status').textContent='Klaar. Een koptelefoon is aan te raden.';}).catch(fail);
