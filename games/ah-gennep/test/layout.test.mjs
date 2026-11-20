import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {footprint,zones,locations,entrances,insideFootprint,wallSegments,wallObstacle,canStand,coolingFixtures,rackPlacements,productZone,mapSvg} from '../layout.js';
const products=JSON.parse(await readFile(new URL('../assets/catalog.json',import.meta.url))).products;
const bounds=f=>{const turned=Math.abs(f.rotation)===Math.PI/2;return{x:f.x,z:f.z,w:turned?.95:f.length,d:turned?f.length:.95};};
const obstacles=[...wallSegments().map(wallObstacle),...coolingFixtures(products).map(bounds),...rackPlacements(products).map(f=>({x:f.x,z:f.z,w:Math.abs(f.rotation)===Math.PI/2?.88:1.75,d:Math.abs(f.rotation)===Math.PI/2?1.75:.88}))];
test('satellite layout has northern annex, east loading bay and no rectangular corner shortcut',()=>{
 assert.ok(insideFootprint(-20,-18));assert.ok(insideFootprint(25,-4));assert.equal(insideFootprint(-20,0),false);assert.equal(insideFootprint(25,10),false);assert.equal(insideFootprint(-4,-24),false);assert.equal(Math.min(...footprint.map(p=>p[1])),entrances.outside.z);
});
test('north entry reaches every department and staff room through doorways',()=>{
 const step=.25,start=locations.ingang,queue=[[start.x,start.z]],seen=new Set([`${start.x},${start.z}`]);
 for(let i=0;i<queue.length;i++){
  const [x,z]=queue[i];for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=x+dx,nz=z+dz,key=`${nx},${nz}`;if(!seen.has(key)&&canStand(nx,nz,obstacles)){seen.add(key);queue.push([nx,nz]);}}
 }
 for(const [key,p]of Object.entries(locations)){
  assert.ok(canStand(p.x,p.z,obstacles),`${key} shortcut must not spawn in a wall or shelf`);
  assert.ok(queue.some(([x,z])=>Math.hypot(x-p.x,z-p.z)<.4),`${key} must be reachable on foot`);
 }
});
test('retail gate is right of the fruit cooler with a separate checkout exit',()=>{
 const fruit=zones.find(z=>z.id==='fruitkoeling');assert.ok(entrances.shop.x>fruit.x+fruit.w);assert.ok(canStand(entrances.shop.x,entrances.shop.z,obstacles));assert.ok(canStand(entrances.checkoutExit.x,entrances.checkoutExit.z,obstacles));assert.equal(canStand(0,-12,obstacles),false);
});
test('cold displays fit their department and back onto its perimeter',()=>{
 for(const f of coolingFixtures(products)){
  const room=zones.find(r=>r.id===f.zone),b=bounds(f);
  assert.ok(b.x-b.w/2>=room.x-.01&&b.x+b.w/2<=room.x+room.w+.01,`${f.zone} width`);
  assert.ok(b.z-b.d/2>=room.z-.01&&b.z+b.d/2<=room.z+room.d+.01,`${f.zone} depth`);
  const rear=f.rotation===0?Math.abs(b.z-b.d/2-room.z):f.rotation===Math.PI?Math.abs(b.z+b.d/2-room.z-room.d):f.rotation>0?Math.abs(b.x-b.w/2-room.x):Math.abs(b.x+b.w/2-room.x-room.w);
  assert.ok(rear<1.2,`${f.zone}: no cold island in the middle of the floor`);
 }
});
test('cheese, dairy and drinks stock are assigned to their labelled departments',()=>{
 const cold=coolingFixtures(products).filter(f=>f.product);
 assert.equal(cold.length,products.filter(p=>p.category==='zuivel').length);
 for(const f of cold)assert.equal(productZone(f.product),f.zone);
 for(const rack of rackPlacements(products).filter(f=>f.style==='drinks'))assert.equal(productZone(rack.p),'drank');
});
test('map includes every labelled area, north and the actual player position',()=>{
 const svg=mapSvg({x:-4,z:-20});for(const r of zones)assert.ok(svg.includes(r.label),r.id);assert.match(svg,/NOORD/);assert.match(svg,/cx="-4" cy="-20"/);assert.match(svg,/viewBox="-26 -27 57 50"/);
});
