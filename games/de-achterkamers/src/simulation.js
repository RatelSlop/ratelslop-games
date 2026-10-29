import {generateMap} from './map.js';
export const PEOPLE=[{id:'mijke',name:'Mijke',speed:2.85},{id:'marola',name:'Marola',speed:3.05},{id:'jaap',name:'Jaap',speed:3.2},{id:'thomas',name:'Thomas',speed:3.65}];
export const MODES={rustig:{cards:3,speed:.77,grace:22},normaal:{cards:5,speed:1,grace:15},nachtmerrie:{cards:7,speed:1.12,grace:8}};
export function makeRun(seed=42971,mode='normaal'){
 const map=generateMap(seed),rules=MODES[mode]||MODES.normaal;
 const player={...map.center(map.start),yaw:-Math.PI/2,pitch:0,stamina:100};
 return{map,rules,mode,player,time:0,steps:0,collected:0,status:'playing',torch:true,sprint:false,regenDelay:0,noise:0,keys:map.objectives.slice(0,rules.cards).map(cell=>({cell,...map.center(cell),taken:false})),enemies:PEOPLE.map((p,i)=>({...p,...map.center(map.spawns[i]),path:[],repath:0,active:false})),event:''};
}
export function nearby(run){const p=run.player;const key=run.keys.find(k=>!k.taken&&Math.hypot(p.x-k.x,p.z-k.z)<2.15);if(key)return{kind:'card',key,label:'Pak toegangspas'};if(Math.hypot(p.x-run.map.center(run.map.start).x,p.z-run.map.center(run.map.start).z)<2.4)return{kind:'exit',label:run.collected===run.keys.length?'Open de uitgang':`${run.keys.length-run.collected} passen ontbreken`};return null;}
export function interact(run){if(run.status!=='playing')return false;const target=nearby(run);if(target?.kind==='card'){target.key.taken=true;run.collected++;run.event='card';return true;}if(target?.kind==='exit'&&run.collected===run.keys.length){run.status='won';run.event='won';return true;}return false;}
export function tick(run,input,delta){
 if(run.status!=='playing')return;
 const dt=Math.min(.05,Math.max(0,delta));run.event='';run.time+=dt;const p=run.player;
 const f=input.forward||0,s=input.strafe||0;let len=Math.hypot(f,s);const moving=len>.05;
 run.sprint=!!input.sprint&&moving&&p.stamina>1;
 const speed=run.sprint?7.15:4.1;
 if(run.sprint){p.stamina=Math.max(0,p.stamina-20*dt);run.regenDelay=1.1;}else{run.regenDelay=Math.max(0,run.regenDelay-dt);if(!run.regenDelay)p.stamina=Math.min(100,p.stamina+14*dt);}
 if(moving){len=Math.max(1,len);const dx=(-Math.sin(p.yaw)*f+Math.cos(p.yaw)*s)/len*speed*dt;const dz=(-Math.cos(p.yaw)*f-Math.sin(p.yaw)*s)/len*speed*dt;const x=p.x,z=p.z;run.map.move(p,dx,dz);run.steps+=Math.hypot(p.x-x,p.z-z);}
 run.noise=run.sprint?1:moving?.3:0;
 const count=Math.min(4,1+Math.floor((run.collected+1)/2));
 for(let i=0;i<run.enemies.length;i++){
  const e=run.enemies[i];e.active=run.time>run.rules.grace&&i<count;if(!e.active)continue;
  e.repath-=dt;if(e.repath<=0){e.path=run.map.path(run.map.cellAt(e.x,e.z),run.map.cellAt(p.x,p.z));e.repath=.45+i*.04;}
  if(e.path.length>1){const goal=run.map.center(e.path[1]);if(Math.hypot(goal.x-e.x,goal.z-e.z)<.15)e.path.shift();}
  const target=e.path.length>1?run.map.center(e.path[1]):p;
  const dx=target.x-e.x,dz=target.z-e.z,distance=Math.hypot(dx,dz),v=e.speed*run.rules.speed*(run.sprint?1.045:1)*dt;
  if(distance>.03)run.map.move(e,dx/distance*Math.min(v,distance),dz/distance*Math.min(v,distance),.31);
  if(Math.hypot(e.x-p.x,e.z-p.z)<.82){run.status='caught';run.caughtBy=e.id;run.event='caught';break;}
 }
}
