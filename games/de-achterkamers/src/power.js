// Match time drives outages, so pausing also freezes the power schedule.
export function makePower(seed){
 let state=(seed^0x6d2b79f5)>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 return{blackout:false,nextChange:60+random()*60,changes:0,random};
}

export function updatePower(power,time){
 while(time>=power.nextChange){
  power.blackout=!power.blackout;power.changes++;
  power.nextChange+=power.blackout?60+power.random()*60:90+power.random()*90;
 }
}
