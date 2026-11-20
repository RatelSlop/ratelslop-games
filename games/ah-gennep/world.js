import * as T from './vendor/three.module.js';
import {footprint,locations,entrances,wallSegments,wallObstacle,coolingFixtures,rackPlacements,productZone,canStand} from './layout.js';
export {locations} from './layout.js';
const BLUE=0x009fe3,ORANGE=0xff7900;
export function createWorld(canvas,products){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 const scene=new T.Scene();scene.background=new T.Color('#c8d8dc');scene.fog=new T.Fog('#d3ddd9',40,85);
 const camera=new T.PerspectiveCamera(68,1,.08,100);camera.position.set(locations.ingang.x,1.68,locations.ingang.z);let yaw=Math.PI,pitch=0;
 scene.add(new T.HemisphereLight(0xf6faff,0x766b57,2.25));const sun=new T.DirectionalLight(0xfff4df,2.1);sun.position.set(-7,16,-10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-32,right:32,top:34,bottom:-34,near:.1,far:80});sun.shadow.bias=-.001;sun.shadow.normalBias=.04;scene.add(sun);
 const obstacles=[],stations=Object.entries(locations).map(([key,value])=>({key,...value})),stockMeshes=new Map(),npc=[];
 const materials=new Map(),cube=new T.BoxGeometry(1,1,1),dummy=new T.Object3D(),lightMaterial=new T.MeshBasicMaterial({color:0xffffff}),coldLightMaterial=new T.MeshBasicMaterial({color:0xf7fff8});
 function mat(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.76}));return materials.get(color);}
 function box(x,y,z,w,h,d,color,parent=scene){const m=new T.Mesh(cube,typeof color==='object'?color:mat(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=y<3.7&&h<3.5;m.receiveShadow=true;parent.add(m);return m;}
 function solid(x,z,w,d){obstacles.push({x,z,w,d});}
 function texture(draw,w=1024,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
 function label(text,x,y,z,w=3,h=.65,bg='#25302d',fg='#fff',rotation=0,parent=scene){const t=texture((c,W,H)=>{c.fillStyle=bg;c.fillRect(0,0,W,H);c.fillStyle=fg;c.font='bold 110px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(text,W/2,H/2,W-45);});const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t,side:T.DoubleSide}));m.position.set(x,y,z);m.rotation.y=rotation;parent.add(m);return m;}
 const tile=texture((c,w,h)=>{c.fillStyle='#7b7365';c.fillRect(0,0,w,h);c.strokeStyle='#a99f8d';c.lineWidth=3;c.strokeRect(0,0,w,h);c.strokeRect(w/2,0,w/2,h/2);c.strokeRect(0,h/2,w/2,h/2);for(let i=0;i<120;i++){c.fillStyle=i%2?'#ffffff06':'#00000006';c.fillRect(i*97%w,i*37%h,40,2);}},512,512);
 tile.wrapS=tile.wrapT=T.RepeatWrapping;tile.repeat.set(.65,.65);
 const shape=new T.Shape();footprint.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 const floorGeometry=new T.ShapeGeometry(shape);const floor=new T.Mesh(floorGeometry,new T.MeshStandardMaterial({map:tile,roughness:.65}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const roof=new T.Mesh(floorGeometry,new T.MeshStandardMaterial({color:0xe1e0d7,side:T.DoubleSide}));roof.rotation.x=-Math.PI/2;roof.position.y=4.5;scene.add(roof);
 const glass=new T.MeshStandardMaterial({color:0xb6dce8,transparent:true,opacity:.25,roughness:.15});
 for(const wall of wallSegments()){
  const b=wallObstacle(wall);obstacles.push(b);const north=wall.kind==='facade';const window=wall.kind==='glass'||north;box(b.x,window?1.55:2.25,b.z,b.w,window?3.1:4.5,b.d,window?glass:0xc9c9bd);
  if(window){box(b.x,.12,b.z,b.w,.24,b.d+.03,0x737e7b);box(b.x,3.3,b.z,b.w,.4,b.d+.03,0x7a8887);}
  if(north){box(b.x,3.95,b.z,b.w,1,b.d+.1,BLUE);for(let x=wall.a[0]+.3;x<wall.b[0];x+=2.5)box(x,1.6,b.z,.055,3.1,.2,0x798886);}
 }
 label('Albert Heijn van der Laan',-4,3.95,-22.85,15,.68,'#009fe3','#fff',Math.PI);
 // Open northern outside entrance, separate inward gate to the right/east of fruit cooling.
 for(const x of [-6,-2])box(x,1.6,-23,.1,3.2,.18,0x697f89);
 label('INGANG / UITGANG',-4,2.85,-22.8,4,.4,'#007aa9','#fff',Math.PI);
 for(const [x,text] of [[entrances.shop.x,'WINKEL IN'],[entrances.checkoutExit.x,'UITGANG']]){
  box(x-1.95,.65,-12,.08,1.3,.08,0x839697);box(x+1.95,.65,-12,.08,1.3,.08,0x839697);
  label(text,x,2.8,-12.1,3.8,.48,'#009fe3','#fff',Math.PI);
 }
 label('WINKELINGANG',10,1.7,-13.7,3.8,.45,'#009fe3','#fff',Math.PI);
 // Ceiling grid and white light tracks clipped to the stepped building footprint.
 for(let x=-23;x<28;x+=2.5)for(let z=-22;z<20;z+=2.5)if(canStand(x,z,[],.1)){
  box(x,4.45,z,2.45,.025,.025,0xadaca2);box(x,4.45,z,.025,.025,2.45,0xadaca2);
  if(Math.round((x+23)/2.5)%2===0&&Math.round((z+22)/2.5)%2===0){box(x,4.15,z,.12,.08,2.2,0xefefeb);box(x,3.99,z,.22,.26,.28,0xd6d8d3);box(x,3.85,z,.16,.015,.2,lightMaterial);}
 }
 const productMaterials=new Map(products.map(p=>{const t=new T.TextureLoader().load(p.image);t.colorSpace=T.SRGBColorSpace;return [p.id,new T.MeshStandardMaterial({map:t,roughness:.75})];}));
 const priceMaterials=new Map();
 function priceMaterial(p){if(!priceMaterials.has(p.id)){const tx=texture((c,w,h)=>{c.fillStyle='white';c.fillRect(0,0,w,h);c.fillStyle='#1b303a';c.font='bold 62px Arial';c.fillText(p.name.slice(0,30),14,70);c.font='bold 120px Arial';c.fillText((p.price/100).toFixed(2).replace('.',','),14,210);},512,256);priceMaterials.set(p.id,new T.MeshBasicMaterial({map:tx}));}return priceMaterials.get(p.id);}
 function productFaces(p,group,width=1.5){const faces=new T.InstancedMesh(cube,productMaterials.get(p.id),18);faces.frustumCulled=false;for(let r=0;r<3;r++)for(let c=0;c<6;c++){dummy.position.set(-width*.4+c*width*.16,.72+r*.5,.29);dummy.scale.set(width*.145,.38,.15);dummy.updateMatrix();faces.setMatrixAt(r*6+c,dummy.matrix);}group.add(faces);if(!stockMeshes.has(p.id))stockMeshes.set(p.id,[]);stockMeshes.get(p.id).push(faces);for(let r=0;r<3;r++){const l=new T.Mesh(new T.PlaneGeometry(.46,.17),priceMaterial(p));l.position.set(0,.47+r*.5,.54);group.add(l);}}
 function rack({p,x,z,rotation,style}){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);const wood=style==='bread'||style==='produce';box(0,1,0,1.65,2,.65,wood?0xa98c61:0xdde0d9,g);for(let r=0;r<3;r++){box(0,.46+r*.5,.08,1.7,.055,.86,wood?0x9c7d53:0xe5e6df,g);box(0,.46+r*.5,.51,1.7,.1,.04,0x414b45,g);}productFaces(p,g,1.6);solid(x,z,rotation===0||Math.abs(rotation)===Math.PI?1.75:.88,rotation===0||Math.abs(rotation)===Math.PI?.88:1.75);}
 rackPlacements(products).forEach(f=>{rack(f);const key=productZone(f.p);stations.push({key,category:f.p.category,stockGroup:key,label:locations[key].label,x:f.x+Math.sin(f.rotation)*1.4,z:f.z+Math.cos(f.rotation)*1.4});});
 // All cold and frozen retail displays are perimeter fixtures, never central islands.
 for(const f of coolingFixtures(products)){
  const g=new T.Group();g.position.set(f.x,0,f.z);g.rotation.y=f.rotation;scene.add(g);
  const dark=f.kind==='freezer'?0x4f605f:0x333d37;
  box(0,1.08,0,f.length,2.16,.72,dark,g);box(0,1.15,-.33,f.length-.1,1.85,.06,0x9caaa1,g);
  for(let r=0;r<3;r++){box(0,.46+r*.5,.08,f.length,.05,.9,0xb3bdb5,g);box(0,.46+r*.5,.51,f.length,.1,.04,0x3b4741,g);}
  box(0,2.14,.17,f.length,.07,.7,coldLightMaterial,g);
  if(f.product)productFaces(f.product,g,Math.min(f.length-.2,2.6));else for(let r=0;r<3;r++)for(let c=0;c<8;c++){
   const colors=f.kind==='meat'?[0xb46a65,0xdb9a93,0xceaaa0]:f.kind==='fruit'?[0xc87c2f,0xb9bb59,0x97433b]:[0xa3c0d4,0xbac6dd,0xa9b8aa];
   box(-f.length*.43+c*f.length*.12,.64+r*.5,.24,f.length*.1,.24,.25,colors[c%3],g);
  }
  if(f.kind==='freezer'){box(0,1.15,.55,f.length-.08,1.85,.025,glass,g);for(let c=-1;c<=1;c++){box(c*f.length/3,1.15,.58,.035,1.85,.04,0x98aaa7,g);box(c*f.length/3+.25,1.15,.64,.025,.4,.035,0xd8e1da,g);}}
  const turned=Math.abs(f.rotation)===Math.PI/2;solid(f.x,f.z,turned?.95:f.length,turned?f.length:.95);
  if(f.product)stations.push({key:f.zone,category:f.product.category,stockGroup:f.zone,label:locations[f.zone].label,x:f.x+Math.sin(f.rotation)*1.4,z:f.z+Math.cos(f.rotation)*1.4});
 }
 // Slatted fresh-department backdrops and wall-mounted signage.
 for(const [text,x,z,ry,w] of [['FRUIT',6,-22.6,0,5],['VLEES',15.75,-5,-Math.PI/2,6],['KAAS',15.75,8.8,-Math.PI/2,5],['ZUIVEL',-7,18.8,Math.PI,10],['BAKKERIJ',9,18.8,Math.PI,9],['DRANK',-15.75,6,Math.PI/2,7],['VRIEZERS',-15.75,-5,Math.PI/2,7]]){
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);for(let y=2.5;y<3.65;y+=.16)box(0,y,0,w,.07,.1,0xb1946e,g);label(text,0,3.05,.08,w-.2,.75,'#28322b','#fff',0,g);
 }
 label('OVERIG',-5,2.8,3,5,.55,'#263a35','#fff',Math.PI);label('GROENTE & FRUIT',7,2.8,-4,7,.6,'#263a35','#fff',Math.PI);
 // Uncooled produce islands and the tree from the interior reference photographs.
 for(const z of [-6,-1]){box(9,.46,z,4.8,.9,1.65,0xaa8a60);box(9,.95,z,4.9,.12,1.8,0x26362a);solid(9,z,4.9,1.8);for(let j=0;j<8;j++)for(let k=0;k<8;k++){const m=new T.Mesh(new T.IcosahedronGeometry(.13,1),mat([0xe8a326,0x92aa44,0xe57229,0xc64235][j%4]));m.position.set(7+j*.53+(k%2)*.2,1.1,z-.55+Math.floor(k/2)*.3);scene.add(m);}}
 const trunk=new T.Mesh(new T.CylinderGeometry(.2,.32,3,8),mat(0x675d40));trunk.position.set(4,1.5,-5);trunk.castShadow=true;scene.add(trunk);solid(4,-5,.85,.85);
 for(let i=0;i<42;i++){const a=i*2.399,r=.4+(i%7)*.25;const leaf=new T.Mesh(new T.IcosahedronGeometry(.65,1),mat([0x3e673c,0x527b47,0x6e8b50][i%3]));leaf.position.set(4+Math.cos(a)*r,3+(i%4)*.25,-5+Math.sin(a)*r);leaf.scale.y=.55;leaf.castShadow=true;scene.add(leaf);}
 box(2,.75,10,2.4,.12,2,ORANGE);box(2,.36,10,2.2,.7,1.8,0xa2845a);solid(2,10,2.4,2);label('BONUS',2,1.6,10,1.2,.5,'#ff7900');
 // Flowers in the northwestern annex; keep a clear aisle back to the entrance.
 for(const x of [-22,-15])for(const z of [-21,-15]){box(x,.7,z,2.4,1.4,1.2,0xb69d76);solid(x,z,2.4,1.2);for(let i=0;i<6;i++){box(x-.9+i*.35,1.5,z,.22,.25,.22,0x627458);const flower=new T.Mesh(new T.IcosahedronGeometry(.2,1),mat(i%2?0xd19ec1:0xe7d7b5));flower.position.set(x-.9+i*.35,1.8,z);scene.add(flower);}}
 label('BLOEMEN',-19,2.85,-22.7,7,.7);box(-10,.65,-16,4,1.3,.9,0xb69b73);solid(-10,-16,4,.9);label('SERVICE',-10,2.1,-16.1,3.5,.5,'#343f38','#fff',Math.PI);
 // Two belt checkouts west of the nine selfscan terminals, before the exit gate.
 for(const x of [-12,-9.5]){box(x,.72,-8.3,1.3,1.44,3.5,0x86918c);box(x,.8,-8,1.2,.08,2.2,0x26322c);box(x+.7,1.1,-9.2,.55,.5,.35,BLUE);solid(x,-8.3,1.4,3.5);}
 box(-8.1,.6,-9,.55,.15,.55,0x304139);box(-8.1,.32,-9,.08,.6,.08,0x87958e);label('KASSA 1 · 2',-10.8,2.7,-10,4.8,.5,'#009fe3','#fff',Math.PI);
 for(let i=0;i<9;i++){const x=-6.6+(i%3)*1.65,z=-10+Math.floor(i/3)*1.65;box(x,.5,z,.7,1,.65,0xb2bdb5);box(x,1.2,z,.55,.48,.14,0x31433b);box(x,1.2,z+.08,.43,.32,.01,BLUE);solid(x,z,.8,.75);}
 label('ZELFSCAN',-4,2.7,-10.8,5,.6,'#009fe3','#fff',Math.PI);
 // Staff-only rooms are walkable through the corridor's door openings.
 for(const [text,x,z] of [['MAGAZIJN',19,-2],['KOELMAGAZIJN',19,-14],['KANTOOR',19,13],['LAAD / LOS',25,-5]])label(text,x,2.8,z,3.6,.48,'#65796d');
 for(const z of [-10,-6,0,6])for(const x of [17.1,22]){box(x,.9,z,.9,1.8,2,0xad926a);solid(x,z,.9,2);for(let j=0;j<3;j++)box(x,.3+j*.55,z,.94,.04,2.03,0x68786d);}
 for(const x of [11,14,22]){box(x,1,-21,1.6,2,2,0xbdcbc4);solid(x,-21,1.6,2);}
 box(21,1,-17,1.5,2,2,0xbdcbc4);solid(21,-17,1.5,2);
 box(21,.75,17,2.7,.12,1.4,0xac9574);box(21,1.1,17,.7,.5,.1,0x2c413a);solid(21,17,2.7,1.4);box(26,.15,-6,2.3,.3,2.3,0xb7986d);solid(26,-6,2.3,2.3);
 // Batch static fixtures after their transforms are final. Keep stock and shoppers separate.
 scene.updateMatrixWorld(true);
 const batches=new Map(),priceIds=new Set([...priceMaterials.values()].map(m=>m.id));
 scene.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||o.material.transparent)return;
  if(!['BoxGeometry','IcosahedronGeometry','CylinderGeometry'].includes(o.geometry.type)&&!priceIds.has(o.material.id))return;
  const key=o.geometry.type+JSON.stringify(o.geometry.parameters)+':'+o.material.id+':'+o.castShadow;
  if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);
 });
 for(const meshes of batches.values()){
  if(meshes.length<2)continue;
  const first=meshes[0],batch=new T.InstancedMesh(first.geometry,first.material,meshes.length);
  batch.castShadow=first.castShadow;batch.receiveShadow=true;
  meshes.forEach((m,i)=>{batch.setMatrixAt(i,m.matrixWorld);m.removeFromParent();});scene.add(batch);
 }
 const humanGeo=new T.CapsuleGeometry(.22,.55,3,6),headGeo=new T.SphereGeometry(.18,8,6);
 for(let i=0;i<8;i++){const g=new T.Group();scene.add(g);const body=new T.Mesh(humanGeo,mat([0x477fa0,0x8b645e,0x476758,0xc9ae80][i%4]));body.position.y=.95;g.add(body);const head=new T.Mesh(headGeo,mat([0xe3b89a,0xc58c69,0x8d604b][i%3]));head.position.y=1.55;g.add(head);for(const x of [-.13,.13])box(x,.35,0,.15,.65,.16,0x344638,g);box(0,.7,-.6,.6,.08,.8,0x80978b,g);for(const x of [-.3,.3])box(x,.9,-.6,.035,.4,.8,0xa7b9ac,g);npc.push({g,i});}
 const waypoints=[[-2,-4],[2,-4],[2,4],[12.5,4],[12.5,-10],[2,-10],[2,-4]];
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(canvas);resize();
 return {camera,scene,renderer,stations,position:camera.position,
  look(dx,dy){yaw-=dx*.0028;pitch=T.MathUtils.clamp(pitch-dy*.0028,-1.15,1.1);},
  move(x,z,dt,sprint=false){const speed=(sprint?5:3)*dt,nx=camera.position.x+(x*Math.cos(yaw)-z*Math.sin(yaw))*speed,nz=camera.position.z+(-x*Math.sin(yaw)-z*Math.cos(yaw))*speed;if(canStand(nx,camera.position.z,obstacles))camera.position.x=nx;if(canStand(camera.position.x,nz,obstacles))camera.position.z=nz;},
  go(key){const p=locations[key];if(!p)return;camera.position.set(p.x,1.68,p.z);yaw=p.yaw;pitch=0;},
  nearest(){return stations.map(s=>({...s,d:Math.hypot(camera.position.x-s.x,camera.position.z-s.z)})).sort((a,b)=>a.d-b.d)[0];},
  stock(state){for(const [id,groups]of stockMeshes)for(const faces of groups)faces.count=state.stock[id]?.shelf||0;},
  render(t,state){camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);npc.forEach(({g,i})=>{if(i<state.queue.length){g.position.set(-12,0,-5+i*1.1);g.rotation.y=0;}else{const f=(t*.18+i*1.7)%waypoints.length,n=Math.floor(f),a=waypoints[n],b=waypoints[(n+1)%waypoints.length],k=f-n;g.position.set(a[0]+(b[0]-a[0])*k,0,a[1]+(b[1]-a[1])*k);g.rotation.y=Math.atan2(a[0]-b[0],a[1]-b[1]);}});renderer.render(scene,camera);},
  // Read-only geometric data for development checks; not persisted game state.
  getObstacles(){return obstacles.map(o=>({...o}));},
 };
}
