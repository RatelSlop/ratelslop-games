import { MazeGenerator } from './vendor/backedges/generator.ts';
export const DIRS=[[0,-1,'north'],[1,0,'east'],[0,1,'south'],[-1,0,'west']];
export const CELL=4.4, HEIGHT=3.15;
export function generateMap(seed=42971,size=14){
 const generator=new MazeGenerator({seed,cellSize:CELL,passageDensity:.31,minConnections:2,roomFrequency:.12,hallFrequency:.002,atriumFrequency:0,cacheLimit:4096});
 const cells=Array.from({length:size*size},(_,i)=>({x:i%size,z:Math.floor(i/size),open:[],kind:'corridor'}));
 const index=(x,z)=>x<0||z<0||x>=size||z>=size?-1:z*size+x;
 for(const c of cells){c.kind=generator.getCell(c.x,c.z).kind;c.open=DIRS.map(([dx,dz,dir])=>index(c.x+dx,c.z+dz)>=0&&generator.isPassable(c.x,c.z,dir));}
 const connect=(a,b)=>{const c=cells[a],d=cells[b];const dir=DIRS.findIndex(([dx,dz])=>c.x+dx===d.x&&c.z+dz===d.z);if(dir>=0){c.open[dir]=true;d.open[(dir+2)%4]=true;}};
 const neighbors=i=>cells[i].open.flatMap((open,d)=>open?[index(cells[i].x+DIRS[d][0],cells[i].z+DIRS[d][1])]:[]);
 const distances=start=>{const dist=Array(cells.length).fill(Infinity);dist[start]=0;const queue=[start];for(let q=0;q<queue.length;q++)for(const next of neighbors(queue[q]))if(dist[next]===Infinity){dist[next]=dist[queue[q]]+1;queue.push(next);}return dist;};
 // Finite extraction can cut paths in the infinite source map; join every island.
 let dist=distances(0);while(dist.includes(Infinity)){let joined=false;for(let a=0;a<cells.length&&!joined;a++)if(dist[a]<Infinity)for(const [dx,dz]of DIRS){const b=index(cells[a].x+dx,cells[a].z+dz);if(b>=0&&dist[b]===Infinity){connect(a,b);joined=true;break;}}dist=distances(0);}
 const start=index(1,1);connect(start,index(2,1));connect(index(2,1),index(3,1));
 const center=i=>({x:(cells[i].x+.5)*CELL,z:(cells[i].z+.5)*CELL});
 const walls=[];
 for(let i=0;i<cells.length;i++){const c=cells[i];for(let d=0;d<4;d++){if(c.open[d]||((d===0&&c.z>0)||(d===3&&c.x>0)))continue;let x=(c.x+.5)*CELL,z=(c.z+.5)*CELL;const vertical=d===1||d===3;if(d===0)z-=CELL/2;if(d===2)z+=CELL/2;if(d===1)x+=CELL/2;if(d===3)x-=CELL/2;walls.push({x,z,w:vertical?.24:CELL+.24,d:vertical?CELL+.24:.24});}}
 const cellAt=(x,z)=>index(Math.floor(x/CELL),Math.floor(z/CELL));
 const blocked=(x,z,r=.27)=>x<r||z<r||x>size*CELL-r||z>size*CELL-r||walls.some(w=>x>w.x-w.w/2-r&&x<w.x+w.w/2+r&&z>w.z-w.d/2-r&&z<w.z+w.d/2+r);
 function move(body,dx,dz,r=.27){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));for(let i=0;i<steps;i++){if(!blocked(body.x+dx/steps,body.z,r))body.x+=dx/steps;if(!blocked(body.x,body.z+dz/steps,r))body.z+=dz/steps;}}
 function path(from,to){if(from<0||to<0)return[];const prev=Array(cells.length).fill(-1),queue=[from];prev[from]=from;for(let q=0;q<queue.length&&prev[to]===-1;q++)for(const n of neighbors(queue[q]))if(prev[n]===-1){prev[n]=queue[q];queue.push(n);}if(prev[to]===-1)return[];const result=[to];while(result[0]!==from)result.unshift(prev[result[0]]);return result;}
 const selected=[start];for(let n=0;n<9;n++){const all=selected.map(distances);let best=-1,score=-1;for(let i=0;i<cells.length;i++){const s=Math.min(...all.map(a=>a[i]));if(s>score&&!selected.includes(i)){score=s;best=i;}}selected.push(best);}
 return{seed,size,cells,walls,start,center,cellAt,neighbors,distances,path,move,blocked,objectives:selected.slice(1,8),spawns:selected.slice(5,9)};
}
