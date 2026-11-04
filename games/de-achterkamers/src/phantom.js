export function makePhantom(seed){
 let state=(seed^0xa341316c)>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 return{random,next:18+random()*22,remaining:0,stepAt:0,serial:0,x:0,z:0,yaw:0};
}
export function updatePhantom(run){
 const f=run.phantom,p=run.player;
 if(f.remaining&&Math.abs(Math.atan2(Math.sin(p.yaw-f.yaw),Math.cos(p.yaw-f.yaw)))>.55){f.remaining=0;f.next=run.time+22+f.random()*25;}
 if(!f.remaining&&run.time>=f.next){
  f.remaining=3+Math.floor(f.random()*3);f.stepAt=run.time;f.yaw=p.yaw;
  const angle=p.yaw+(f.random()-.5)*.8,distance=4+f.random()*4;
  f.x=p.x+Math.sin(angle)*distance;f.z=p.z+Math.cos(angle)*distance;
 }
 if(f.remaining&&run.time>=f.stepAt){f.serial++;f.remaining--;f.stepAt=run.time+.38+f.random()*.16;if(!f.remaining)f.next=run.time+24+f.random()*28;}
}
