// Assemble the packed model's separate pieces into a full-size Backrooms maze.
export const GRID=24,CELL_SIZE=4.4,HEIGHT=3.15,TILE_SIZE=CELL_SIZE*6;
export const LENGTH=GRID*CELL_SIZE;
export const DIRECTIONS=[[0,-1],[1,0],[0,1],[-1,0]];

export function freshSeed(previous,entropy=Math.random()){
 const seed=1+Math.floor(entropy*999999);
 return seed===previous?seed%999999+1:seed;
}

export function makeLayout(seed=42971){
 let state=seed>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const cells=Array.from({length:GRID*GRID},(_,i)=>({x:i%GRID,z:Math.floor(i/GRID),open:[false,false,false,false],kind:'corridor'}));
 const index=(x,z)=>x<0||z<0||x>=GRID||z>=GRID?-1:z*GRID+x;
 const connect=(a,b)=>{
  const c=cells[a],n=cells[b],d=DIRECTIONS.findIndex(([dx,dz])=>c.x+dx===n.x&&c.z+dz===n.z);
  c.open[d]=true;n.open[(d+2)%4]=true;
 };
 const seen=new Set([0]),stack=[0];
 while(stack.length){
  const current=stack[stack.length-1],c=cells[current];
  const choices=DIRECTIONS.map(([dx,dz])=>index(c.x+dx,c.z+dz)).filter(i=>i>=0&&!seen.has(i));
  if(!choices.length){stack.pop();continue;}
  const next=choices[Math.floor(random()*choices.length)];connect(current,next);seen.add(next);stack.push(next);
 }
 // Loops allow escapes and alternate chaser routes without flattening the maze.
 for(let i=0;i<cells.length;i++)for(const d of [1,2]){
  const [dx,dz]=DIRECTIONS[d],n=index(cells[i].x+dx,cells[i].z+dz);
  if(n>=0&&!cells[i].open[d]&&random()<.09)connect(i,n);
 }
 // One room per sector, with new dimensions and offsets each match.
 const rooms=[];
 for(let rz=0;rz<3;rz++)for(let rx=0;rx<3;rx++){
  const w=2+Math.floor(random()*3),h=2+Math.floor(random()*3);
  rooms.push({x:rx*8+1+Math.floor(random()*(7-w)),z:rz*8+1+Math.floor(random()*(7-h)),w,h});
 }
 for(const room of rooms)for(let z=room.z;z<room.z+room.h;z++)for(let x=room.x;x<room.x+room.w;x++){
  const i=index(x,z);cells[i].kind='room';
  if(x<room.x+room.w-1)connect(i,index(x+1,z));
  if(z<room.z+room.h-1)connect(i,index(x,z+1));
 }
 const start=index(1,0);connect(start,index(1,1));
 const walls=[];
 for(const c of cells)for(let d=0;d<4;d++){
  if(c.open[d]||(d===0&&c.z>0)||(d===3&&c.x>0))continue;
  const vertical=d===1||d===3;
  walls.push({x:(c.x+.5)*CELL_SIZE+DIRECTIONS[d][0]*CELL_SIZE/2,z:(c.z+.5)*CELL_SIZE+DIRECTIONS[d][1]*CELL_SIZE/2,w:vertical?.22:CELL_SIZE+.22,d:vertical?CELL_SIZE+.22:.22,vertical});
 }
 const pillars=[];
 rooms.forEach((room,r)=>{
  for(let z=1;z<room.h;z++)for(let x=1;x<room.w;x++)if((x+z+r)%2===0)pillars.push({x:(room.x+x)*CELL_SIZE,z:(room.z+z)*CELL_SIZE,w:1.05,d:1.05});
 });
 const tiles=[];
 for(let z=0;z<4;z++)for(let x=0;x<4;x++)tiles.push({x:(x+.5)*TILE_SIZE,z:(z+.5)*TILE_SIZE});
 return{cells,walls,pillars,tiles,rooms,start,exit:{x:1.5*CELL_SIZE,z:.16,yaw:0}};
}
export const LAYOUT=makeLayout();
