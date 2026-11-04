import model from './model-data.js';
import {makeLayout,wallsForCells,GRID,DIRECTIONS} from './layout.js';

export const DIRS=DIRECTIONS.map(([dx,dz],i)=>[dx,dz,['north','east','south','west'][i]]);
export const CELL=model.cellSize,HEIGHT=model.height;
export const MODEL=model;
const key=(x,z)=>`${x},${z}`;

export function generateMap(seed=42971){
 const layout=makeLayout(seed),bucketSize=CELL,buckets=new Map(),props=[];
 function rebuildCollision(){
 buckets.clear();
 for(const rectangle of [...layout.walls,...layout.pillars,...props]){
  const {x,z,w,d}=rectangle;
  for(let bx=Math.floor((x-w/2)/bucketSize);bx<=Math.floor((x+w/2)/bucketSize);bx++)
   for(let bz=Math.floor((z-d/2)/bucketSize);bz<=Math.floor((z+d/2)/bucketSize);bz++){
    const id=key(bx,bz);if(!buckets.has(id))buckets.set(id,[]);buckets.get(id).push(rectangle);
   }
 }
 }
 rebuildCollision();
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
 const map={seed,size,cells,start,exit,center,cellAt,neighbors,distances,path,move,blocked,clearSegment,objectives:selected.slice(1,8),spawns:selected.slice(8,12),walls:layout.walls,pillars:layout.pillars,layout,length:model.length,revision:0,changedCells:[],lockers:[]};
 const candidates=[];
 for(let i=0;i<cells.length;i++)if(!selected.includes(i))for(let d=0;d<4;d++)if(!cells[i].open[d]){
  const [dx,dz]=DIRS[d],p=center(i),x=p.x+dx*1.63,z=p.z+dz*1.63;
  if(!blocked(x,z,.46))candidates.push({cell:i,x,z,front:{x:-dx,z:-dz},yaw:Math.atan2(-dx,-dz),w:dx?.9:.95,d:dx?.95:.9});
 }
 for(let n=0;n<12&&candidates.length;n++){
  let best=0,value=-Infinity;
  for(let i=0;i<candidates.length;i++){const c=candidates[i],score=n?Math.min(...map.lockers.map(l=>Math.hypot(c.x-l.x,c.z-l.z))):-Math.hypot(c.x-center(start).x,c.z-center(start).z);if(score>value){value=score;best=i;}}
  const locker=candidates.splice(best,1)[0];locker.id=n;locker.approach={x:locker.x+locker.front.x*.9,z:locker.z+locker.front.z*.9};
  if(map.lockers.some(l=>Math.hypot(l.x-locker.x,l.z-locker.z)<10))break;
  map.lockers.push(locker);props.push(locker);
  for(let i=candidates.length-1;i>=0;i--)if(candidates[i].cell===locker.cell)candidates.splice(i,1);
 }
 rebuildCollision();
 map.shiftCorridors=(occupants=[])=>{
  const protectedPoints=[...occupants,...map.lockers];map.changedCells=[];
  const safe=(a,b)=>{const p=center(a),q=center(b);return cells[a].kind!=='room'&&cells[b].kind!=='room'&&protectedPoints.every(o=>Math.hypot(o.x-(p.x+q.x)/2,o.z-(p.z+q.z)/2)>CELL*2.2);};
  const setEdge=(a,b,open)=>{const d=DIRS.findIndex(([dx,dz])=>cells[a].x+dx===cells[b].x&&cells[a].z+dz===cells[b].z);cells[a].open[d]=open;cells[b].open[(d+2)%4]=open;};
  const refreshEdges=()=>cells.forEach((c,i)=>edges[i]=c.open.flatMap((open,d)=>open?[(c.z+DIRS[d][1])*GRID+c.x+DIRS[d][0]]:[]));
  let swaps=0;
  for(let attempt=0;attempt<180&&swaps<4;attempt++){
   const a=Math.floor(random()*cells.length),d=random()<.5?1:2,c=cells[a],b=(c.z+DIRS[d][1])*GRID+c.x+DIRS[d][0];
   if(c.x+DIRS[d][0]>=GRID||c.z+DIRS[d][1]>=GRID||c.open[d]||!safe(a,b))continue;
   // Open a new connection, then remove one edge of its old route: never disconnect the maze.
   const route=path(a,b),closable=[];
   for(let i=1;i<route.length;i++)if(safe(route[i-1],route[i]))closable.push([route[i-1],route[i]]);
   if(!closable.length)continue;
   const [u,v]=closable[Math.floor(random()*closable.length)];setEdge(a,b,true);setEdge(u,v,false);refreshEdges();
   map.changedCells.push(a,b,u,v);swaps++;
  }
  if(swaps){layout.walls.splice(0,layout.walls.length,...wallsForCells(cells));rebuildCollision();map.revision++;}
  return swaps;
 };
 return map;
}
