import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRun,tick,interact,nearby} from '../src/simulation.js';
import {generateMap,CELL} from '../src/map.js';
import {updatePhantom} from '../src/phantom.js';

test('lockers are distributed, solid and accessible without blocking navigation',()=>{
 for(let seed=1;seed<=12;seed++){
  const map=generateMap(seed);assert.ok(map.lockers.length>=8);
  for(const l of map.lockers){assert.ok(map.blocked(l.x,l.z));assert.equal(map.blocked(l.approach.x,l.approach.z),false);assert.ok(map.path(map.start,l.cell).length>1);}
 }
});

test('a player can hide and leave, cannot walk inside a locker, and retains flashlight preference',()=>{
 const r=makeRun(51),l=r.map.lockers[0];Object.assign(r.player,l.approach);r.torch=false;
 assert.equal(nearby(r).kind,'locker');assert.equal(interact(r),true);assert.equal(r.hiding,l.id);
 const before={x:r.player.x,z:r.player.z};tick(r,{forward:1,strafe:1,sprint:true},.05);
 assert.deepEqual({x:r.player.x,z:r.player.z},before);assert.equal(r.noise,0);assert.equal(r.sprint,false);assert.equal(r.torch,false);
 assert.equal(nearby(r).kind,'leave');assert.equal(interact(r),true);assert.equal(r.hiding,null);assert.equal(r.event,'leave');
});

test('unseen hiding conceals the player, but a chaser that witnesses entry can open the locker',()=>{
 for(const witnessed of [false,true]){
  const r=makeRun(52),l=r.map.lockers[0];Object.assign(r.player,l.approach);
  r.enemies=[{...r.enemies[0],...l.approach,activationOrder:0,active:witnessed}];r.rules={...r.rules,grace:0};r.time=2;
  assert.ok(interact(r));assert.equal(r.enemies[0].suspiciousLocker,witnessed?l.id:null);
  tick(r,{},.02);assert.equal(r.status,witnessed?'caught':'playing');
 }
});

test('blackout corridor swaps keep every cell reachable and avoid nearby people and lockers',()=>{
 let swaps=0;
 for(let seed=1;seed<=20;seed++){
  const map=generateMap(seed),p=map.center(map.start),before=JSON.stringify(map.cells);
  const count=map.shiftCorridors([p,...map.spawns.map(map.center)]);swaps+=count;
  assert.ok(map.distances(map.start).every(Number.isFinite));
  assert.equal(map.blocked(p.x,p.z),false);
  if(count){assert.notEqual(JSON.stringify(map.cells),before);assert.equal(map.revision,1);}
  for(let i=0;i<map.cells.length;i++)for(const n of map.neighbors(i))assert.ok(map.clearSegment(map.center(i),map.center(n),.31));
  for(const l of map.lockers){assert.equal(map.blocked(l.approach.x,l.approach.z),false);assert.ok(map.path(map.start,l.cell).length);}
  for(const key of map.objectives)assert.ok(map.path(map.start,key).length);
 }
 assert.ok(swaps>20);
});

test('each fresh power failure shifts corridors once, while pause freezes changes',()=>{
 const r=makeRun(82);r.enemies=[];r.time=r.power.nextChange-.01;
 tick(r,{},.02);assert.ok(r.power.blackout);const revision=r.map.revision;assert.ok(revision>0);
 tick(r,{},.02);assert.equal(r.map.revision,revision);
 r.status='paused';r.time=r.power.nextChange+.01;tick(r,{},.05);assert.equal(r.power.blackout,true);assert.equal(r.map.revision,revision);
});

test('the last pass starts the final escape and activates every chaser before the grace period ends',()=>{
 for(const mode of ['rustig','normaal','nachtmerrie']){
  const r=makeRun(43,mode);assert.equal(r.phase,'collect');
  for(const k of r.keys){Object.assign(r.player,{x:k.x,z:k.z});assert.ok(interact(r));}
  assert.equal(r.phase,'escape');assert.equal(r.event,'escape');assert.equal(r.status,'playing');
  tick(r,{},.01);assert.equal(r.enemies.filter(e=>e.active).length,4);
  Object.assign(r.player,r.map.center(r.map.start));assert.ok(interact(r));assert.equal(r.status,'won');
 }
});

test('phantom footsteps originate behind the player and cease when they turn around',()=>{
 const r=makeRun(64);r.enemies=[];r.time=r.phantom.next;updatePhantom(r);
 const f=r.phantom,dx=f.x-r.player.x,dz=f.z-r.player.z;
 assert.ok(dx*Math.sin(r.player.yaw)+dz*Math.cos(r.player.yaw)>0);assert.equal(f.serial,1);assert.ok(f.remaining>=2);
 r.player.yaw+=Math.PI;r.time=f.stepAt;updatePhantom(r);assert.equal(f.remaining,0);assert.equal(f.serial,1);
 r.status='paused';const next=f.next,time=r.time;tick(r,{},.05);assert.equal(r.time,time);assert.equal(f.next,next);
 assert.equal(r.status,'paused');
});
