import test from 'node:test';
import assert from 'node:assert/strict';
import {generateMap,MODEL,CELL} from '../src/map.js';
import {makeRun,tick,interact} from '../src/simulation.js';
import {freshSeed} from '../src/layout.js';
import {makePower,updatePower} from '../src/power.js';
test('objectives and enemies stay reachable on the model for every room code',()=>{
 for(let seed=1;seed<=35;seed++){
  const map=generateMap(seed);assert.ok(map.distances(map.start).every(Number.isFinite));
  assert.equal(new Set([...map.objectives,...map.spawns]).size,11);
  for(const id of [...map.objectives,...map.spawns]){
   assert.ok(map.path(map.start,id).length>1);
   const p=map.center(id);assert.equal(map.blocked(p.x,p.z,.7),false);
  }
 }
});
test('seeds reproduce a layout, but a different seed changes walls, rooms and navigation',()=>{
 const a=generateMap(51),b=generateMap(51),c=generateMap(52);
 assert.deepEqual(a.cells,b.cells);assert.deepEqual(a.objectives,b.objectives);
 assert.notDeepEqual(a.cells,c.cells);assert.notDeepEqual(a.walls,c.walls);assert.notDeepEqual(a.layout.rooms,c.layout.rooms);assert.notDeepEqual(a.objectives,c.objectives);
 // Building another match must not replace the first match's collision buckets.
 assert.deepEqual(a.walls,b.walls);
 for(const wall of a.walls)assert.ok(a.blocked(wall.x,wall.z));
});

test('every new match rolls a seed different from the last, even with repeated entropy',()=>{
 for(const previous of [1,42971,999999])assert.notEqual(freshSeed(previous,(previous-1)/999999),previous);
 assert.equal(freshSeed(99,0),1);assert.equal(freshSeed(99,.99999999),999999);
});
test('the assembled maze covers over 11000 square metres with multiple rooms and long routes',()=>{
 const map=generateMap();
 assert.equal(map.cells.length,576);assert.ok(map.length**2>11000);assert.equal(MODEL.rooms,9);
 assert.ok(Math.max(...map.objectives.map(i=>map.path(map.start,i).length*CELL))>150);
 assert.ok(map.cells.filter(c=>c.open.filter(Boolean).length===1).length>20);
});
test('every randomized navigation edge has physical clearance for player and chasers',()=>{
 for(let seed=1;seed<=35;seed++){
  const map=generateMap(seed);
  for(let i=0;i<map.cells.length;i++)for(const n of map.neighbors(i))assert.ok(map.clearSegment(map.center(i),map.center(n),.31));
 }
});

test('power starts bright and recurring blackouts last between one and two minutes',()=>{
 for(let seed=1;seed<=100;seed++){
  const power=makePower(seed);assert.equal(power.blackout,false);assert.ok(power.nextChange>=60&&power.nextChange<=120);
  for(let cycle=0;cycle<8;cycle++){
   const start=power.nextChange;updatePower(power,start-.001);assert.equal(power.blackout,false);
   updatePower(power,start);assert.equal(power.blackout,true);const end=power.nextChange;
   assert.ok(end-start>=60&&end-start<=120);
   updatePower(power,end-.001);assert.equal(power.blackout,true);
   updatePower(power,end);assert.equal(power.blackout,false);assert.ok(power.nextChange-end>=90&&power.nextChange-end<=180);
  }
 }
});

test('pausing freezes blackout restoration and the flashlight works without ceiling power',()=>{
 const r=makeRun(81);r.rules={...r.rules,grace:Infinity};r.time=r.power.nextChange-.01;tick(r,{},.02);
 assert.equal(r.power.blackout,true);assert.equal(r.torch,true);
 r.time=r.power.nextChange-.01;r.status='paused';const deadline=r.power.nextChange,time=r.time;
 for(let n=0;n<100;n++)tick(r,{},.05);
 assert.equal(r.time,time);assert.equal(r.power.nextChange,deadline);assert.equal(r.power.blackout,true);
 r.status='playing';tick(r,{},.02);assert.equal(r.power.blackout,false);
});
test('individual model wall modules stop large motion without tunneling',()=>{
 const map=generateMap(),wall=map.walls.find(w=>w.w<1&&w.x>CELL&&w.z>CELL&&!map.blocked(w.x-1,w.z));
 assert.ok(wall);const body={x:wall.x-1,z:wall.z};
 map.move(body,6,0);assert.ok(body.x<wall.x);assert.equal(map.blocked(body.x,body.z),false);
});
test('the assembled floor has closed outside boundaries and walkable interior tile seams',()=>{
 const map=generateMap();
 assert.equal(map.blocked(-1,4),true);assert.equal(map.blocked(map.length+1,4),true);
 assert.equal(map.blocked(4,map.length+1),true);
 for(const cell of map.cells){const p=map.center(cell.z*map.size+cell.x);assert.equal(map.blocked(p.x,p.z,.7),false);}
});
test('the separate source pillar modules block movement inside the large rooms',()=>{
 const map=generateMap(),pillar=map.pillars[0],body={x:pillar.x-1.2,z:pillar.z};
 assert.equal(map.blocked(body.x,body.z),false);assert.equal(map.blocked(pillar.x,pillar.z),true);
 map.move(body,4,0);assert.ok(body.x<pillar.x);assert.equal(map.blocked(body.x,body.z),false);
});
test('collected cards cannot be claimed twice and exit requires all cards',()=>{const r=makeRun(11,'rustig');assert.equal(interact(r),false);for(const key of r.keys){Object.assign(r.player,{x:key.x,z:key.z});assert.equal(interact(r),true);assert.equal(interact(r),false);}Object.assign(r.player,r.map.center(r.map.start));assert.equal(interact(r),true);assert.equal(r.status,'won');});
test('pause freezes simulation and enemy grace prevents spawn catches',()=>{const r=makeRun(8);r.status='paused';const before={...r.player};tick(r,{forward:1},1);assert.deepEqual(r.player,before);assert.equal(r.time,0);r.status='playing';tick(r,{forward:1},.04);assert.equal(r.enemies.some(e=>e.active),false);});
test('enemy paths use walkable cell edges and catch triggers terminal state',()=>{const r=makeRun(4);r.time=20;const p=r.player;Object.assign(r.enemies[0],{x:p.x+.1,z:p.z+.1});tick(r,{},.016);assert.equal(r.status,'caught');assert.equal(r.caughtBy,'mijke');});
test('complete routes collect every pass and reach the exit in all modes and multiple codes',()=>{for(const seed of [42971,51,52])for(const mode of ['rustig','normaal','nachtmerrie']){const r=makeRun(seed,mode);r.rules={...r.rules,grace:Infinity};function walkTo(cell){for(const id of r.map.path(r.map.cellAt(r.player.x,r.player.z),cell)){const goal=r.map.center(id);let attempts=0;while(Math.hypot(goal.x-r.player.x,goal.z-r.player.z)>.08&&attempts++<500){const dx=goal.x-r.player.x,dz=goal.z-r.player.z,d=Math.hypot(dx,dz);r.player.yaw=0;tick(r,{forward:-dz/d,strafe:dx/d},Math.min(.04,d/4.1));}assert.ok(attempts<500,'route segment must not get stuck');}}for(const key of r.keys){walkTo(key.cell);assert.equal(interact(r),true);}walkTo(r.map.start);assert.equal(interact(r),true);assert.equal(r.status,'won');}});
test('a pursuing face can navigate the maze to the stationary player',()=>{const r=makeRun(42971);r.rules={...r.rules,grace:0};for(let i=0;i<6000&&r.status==='playing';i++)tick(r,{},.05);assert.equal(r.status,'caught');});

test('Thomas outruns walking but leaves a sprint escape, and difficulty scales his actual movement',()=>{
 for(const mode of ['rustig','normaal','nachtmerrie']){
  const r=makeRun(42971,mode),enemy=r.enemies.find(e=>e.id==='thomas');
  r.time=30;r.collected=5;
  const neighbor=r.map.neighbors(r.map.start)[0];Object.assign(enemy,r.map.center(neighbor));
  const before={x:enemy.x,z:enemy.z};tick(r,{},.05);
  const moved=Math.hypot(enemy.x-before.x,enemy.z-before.z)/.05;
  assert.ok(moved>4.1,'walking is not enough to escape Thomas');
  assert.ok(moved<7.15,'sprinting still creates distance');
  assert.ok(Math.abs(moved-5.8*r.rules.speed)<.001);
 }
});

test('individual source walls prevent catches and pickups through the model',()=>{
 const r=makeRun(),wall=r.map.walls.find(w=>w.w<1&&w.x>CELL&&w.z>CELL&&!r.map.blocked(w.x-1,w.z));
 const x=wall.x,z=wall.z;
 Object.assign(r.player,{x:x-.39,z});
 Object.assign(r.enemies[0],{x:x+.39,z});r.rules={...r.rules,grace:0};
 r.keys[0]={x:x+.39,z,taken:false};
 assert.equal(interact(r),false);tick(r,{},.001);assert.equal(r.status,'playing');
});
