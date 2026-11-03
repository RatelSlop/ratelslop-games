import model from './model-data.js';
import {makeLayout,GRID,DIRECTIONS} from './layout.js';

export const DIRS=DIRECTIONS.map(([dx,dz],i)=>[dx,dz,['north','east','south','west'][i]]);
export const CELL=model.cellSize,HEIGHT=model.height;
export const MODEL=model;
const key=(x,z)=>`${x},${z}`;

export function generateMap(seed=42971){
 const layout=makeLayout(seed),bucketSize=CELL,buckets=new Map();
 for(const rectangle of [...layout.walls,...layout.pillars]){
  const {x,z,w,d}=rectangle;
  for(let bx=Math.floor((x-w/2)/bucketSize);bx<=Math.floor((x+w/2)/bucketSize);bx++)
   for(let bz=Math.floor((z-d/2)/bucketSize);bz<=Math.floor((z+d/2)/bucketSize);bz++){
    const id=key(bx,bz);if(!buckets.has(id))buckets.set(id,[]);buckets.get(id).push(rectangle);
   }
 }
 function blocked(x,z,r=.27){
  if(!Number.isFinite(x)||!Number.isFinite(z)||x<r||z<r||x>model.length-r||z>model.length-r)return true;
  for(let bx=Math.floor((x-r)/bucketSize);bx<=Math.floor((x+r)/bucketSize);bx++)
   for(let bz=Math.floor((z-r)/bucketSize);bz<=Math.floor((z+r)/bucketSize);bz++)
    if(buckets.get(key(bx,bz))?.some(w=>x>w.x-w.w/2-r&&x<w.x+w.w/2+r&&z>w.z-w.d/2-r&&z<w.z+w.d/2+r))return true;
  return false;
 }
 function clearSegment(a,b,r=.34){
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.08));
  for(let i=0;i<=steps;i++)if(blocked(a.x+(b.x-a.x)*i/steps,a.z+(b.z-a.z)*i/steps,r))return false;
  return true;
 }
 function move(body,dx,dz,r=.27){
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));
  for(let i=0;i<steps;i++){
   if(!blocked(body.x+dx/steps,body.z,r))body.x+=dx/steps;
   if(!blocked(body.x,body.z+dz/steps,r))body.z+=dz/steps;
  }
 }

 const cells=layout.cells,centers=cells.map(c=>({x:(c.x+.5)*CELL,z:(c.z+.5)*CELL}));
 const edges=cells.map(c=>c.open.flatMap((open,d)=>open?[(c.z+DIRS[d][1])*GRID+c.x+DIRS[d][0]]:[]));
 const size=GRID,start=layout.start,exit=layout.exit;
 const center=i=>centers[i];
 const neighbors=i=>edges[i]||[];
 function cellAt(x,z){
  const cx=Math.floor(x/CELL),cz=Math.floor(z/CELL);
  return cx<0||cz<0||cx>=size||cz>=size?-1:cz*size+cx;
 }
 function distances(from){
  const dist=Array(cells.length).fill(Infinity);if(!centers[from])return dist;
  dist[from]=0;const queue=[from];
  for(let q=0;q<queue.length;q++)for(const n of edges[queue[q]])if(dist[n]===Infinity){dist[n]=dist[queue[q]]+1;queue.push(n);}
  return dist;
 }
 function path(from,to){
  if(!centers[from]||!centers[to])return[];
  const previous=new Int32Array(cells.length).fill(-1),queue=[from];previous[from]=from;
  for(let q=0;q<queue.length&&previous[to]===-1;q++)for(const n of edges[queue[q]])if(previous[n]===-1){previous[n]=queue[q];queue.push(n);}
  if(previous[to]===-1)return[];
  const result=[to];while(result[result.length-1]!==from)result.push(previous[result[result.length-1]]);
  return result.reverse();
 }
 // Architecture, collision, navigation and placements all belong to this seed.
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const jitter=cells.map(()=>random()),safe=centers.map((p,i)=>!blocked(p.x,p.z,.7)?i:-1).filter(i=>i>=0);
 const selected=[start],nearest=distances(start);
 for(let n=0;n<11;n++){
  let best=-1,score=-1;
  for(const i of safe){const value=nearest[i]*(.8+jitter[i]*.4);if(!selected.includes(i)&&Number.isFinite(value)&&value>score){best=i;score=value;}}
  if(best<0)throw new Error('Not enough safe objective locations in model.');
  selected.push(best);const dist=distances(best);dist.forEach((d,i)=>nearest[i]=Math.min(nearest[i],d));
 }
 return{seed,size,cells,start,exit,center,cellAt,neighbors,distances,path,move,blocked,clearSegment,objectives:selected.slice(1,8),spawns:selected.slice(8,12),walls:layout.walls,pillars:layout.pillars,layout,length:model.length};
}
