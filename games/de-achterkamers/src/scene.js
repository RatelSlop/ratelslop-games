import * as THREE from 'three';
import {CELL,HEIGHT} from './map.js';
export async function createScene(canvas,map){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#76704a');scene.fog=new THREE.FogExp2('#817748',.036);
 const camera=new THREE.PerspectiveCamera(78,innerWidth/innerHeight,.06,75);camera.rotation.order='YXZ';
 const ambient=new THREE.HemisphereLight('#fff6ca','#383321',1.65);scene.add(ambient);
 function texture(kind){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle=kind==='wall'?'#c7bc7e':kind==='floor'?'#756e4d':'#c1bd9f';ctx.fillRect(0,0,512,512);let n=319;const rand=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296};const data=ctx.getImageData(0,0,512,512);for(let i=0;i<data.data.length;i+=4){const d=(rand()-.5)*(kind==='floor'?50:17);data.data[i]+=d;data.data[i+1]+=d;data.data[i+2]+=d;}ctx.putImageData(data,0,0);
  if(kind==='wall'){ctx.strokeStyle='#827b4928';ctx.lineWidth=2;for(let x=20;x<512;x+=43)for(let y=5;y<512;y+=58){ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-20,y+18,x+20,y+30,x,y+52);ctx.bezierCurveTo(x+20,y+30,x-20,y+18,x,y);ctx.stroke();}for(let i=0;i<18;i++){let x=rand()*512,y=rand()*512;const g=ctx.createRadialGradient(x,y,0,x,y,40+rand()*80);g.addColorStop(0,'#615b3828');g.addColorStop(1,'#615b3800');ctx.fillStyle=g;ctx.fillRect(x-120,y-120,240,240);}ctx.fillStyle='#4e472344';ctx.fillRect(0,480,512,32);}
  if(kind==='ceiling'){ctx.strokeStyle='#817b64';ctx.lineWidth=3;ctx.strokeRect(0,0,512,512);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;
 }
 const wallTex=texture('wall');wallTex.repeat.set(2,1);
 const floorTex=texture('floor');floorTex.repeat.set(map.size*4,map.size*4);
 const ceilingTex=texture('ceiling');ceilingTex.repeat.set(map.size*4,map.size*4);
 const wallMat=new THREE.MeshStandardMaterial({map:wallTex,roughness:1,bumpMap:wallTex,bumpScale:.025});
 const floorMat=new THREE.MeshStandardMaterial({map:floorTex,roughness:1,bumpMap:floorTex,bumpScale:.035});
 const ceilingMat=new THREE.MeshStandardMaterial({map:ceilingTex,roughness:1});
 const box=new THREE.BoxGeometry(1,1,1);const transform=new THREE.Object3D();
 function instances(material,items){const mesh=new THREE.InstancedMesh(box,material,items.length);items.forEach((it,i)=>{transform.position.set(it.x,it.y,it.z);transform.scale.set(it.w,it.h,it.d);transform.rotation.set(0,0,0);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);});scene.add(mesh);return mesh;}
 const length=map.size*CELL;instances(floorMat,[{x:length/2,y:-.10,z:length/2,w:length,h:.2,d:length}]);instances(ceilingMat,[{x:length/2,y:HEIGHT+.08,z:length/2,w:length,h:.16,d:length}]);
 instances(wallMat,map.walls.map(w=>({...w,y:HEIGHT/2,h:HEIGHT})));
 const trimMat=new THREE.MeshStandardMaterial({color:'#554e32',roughness:1});instances(trimMat,map.walls.map(w=>({...w,y:.1,h:.20,w:w.w+.035,d:w.d+.035})));
 const corniceMat=new THREE.MeshStandardMaterial({color:'#b5af87',roughness:1});instances(corniceMat,map.walls.map(w=>({...w,y:HEIGHT-.12,h:.18,w:w.w+.05,d:w.d+.05})));
 const panels=[],frames=[],positions=[];
 map.cells.forEach((c,i)=>{const center=map.center(i);if((c.x+c.z)%2===0||i===map.start){panels.push({...center,y:HEIGHT-.15,w:1.55,h:.025,d:.53});frames.push({...center,y:HEIGHT-.075,w:1.67,h:.10,d:.65});positions.push(new THREE.Vector3(center.x,HEIGHT-.3,center.z));}});
 instances(new THREE.MeshStandardMaterial({color:'#514e40',roughness:.7}),frames);
 const lamps=instances(new THREE.MeshBasicMaterial({color:'#fff4c3',toneMapped:false}),panels);
 const pool=Array.from({length:4},()=>{const l=new THREE.PointLight('#fff0bb',12,10,2);scene.add(l);return l;});
 const flashlight=new THREE.SpotLight('#fff5d7',24,20,.48,.62,1.3);scene.add(flashlight,flashlight.target);
 function label(text,bg='#254b39',fg='#f7f2d3'){const c=document.createElement('canvas');c.width=512;c.height=192;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,512,192);x.strokeStyle=fg;x.lineWidth=7;x.strokeRect(8,8,496,176);x.fillStyle=fg;x.textAlign='center';x.font='bold 64px sans-serif';x.fillText(text,256,119);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide});}
 const start=map.center(map.start);const exit=new THREE.Group();exit.position.set(start.x,.0,start.z-1.6);scene.add(exit);
 const door=new THREE.Mesh(new THREE.BoxGeometry(1.6,2.65,.16),new THREE.MeshStandardMaterial({color:'#345447',metalness:.25,roughness:.75}));door.position.y=1.325;exit.add(door);
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.65,.62),label('UITGANG'));sign.position.set(0,2.82,.12);exit.add(sign);
 const doorStripe=new THREE.Mesh(new THREE.BoxGeometry(1.25,.12,.08),new THREE.MeshStandardMaterial({color:'#a6a68d',metalness:.7,roughness:.3}));doorStripe.position.set(0,1.2,.13);exit.add(doorStripe);
 const exitLamp=new THREE.PointLight('#7ba37e',4,6);exitLamp.position.set(start.x,2.5,start.z);scene.add(exitLamp);
 const loader=new THREE.TextureLoader();const faces=await Promise.all(['mijke','marola','jaap','thomas'].map(id=>loader.loadAsync(new URL(`faces/${id}.webp`,document.baseURI).href)));
 const enemies=faces.map((texture,i)=>{texture.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.08,depthWrite:false,color:'#ffffff',toneMapped:false});const sprite=new THREE.Sprite(mat);sprite.scale.set(2.18,2.18,1);sprite.visible=false;scene.add(sprite);return sprite;});
 const cards=map.objectives.map((cell,i)=>{const g=new THREE.Group();const p=map.center(cell);g.position.set(p.x,0,p.z);const pedestal=new THREE.Mesh(new THREE.BoxGeometry(.48,.95,.42),new THREE.MeshStandardMaterial({color:'#535744',roughness:.65,metalness:.4}));pedestal.position.y=.475;g.add(pedestal);const card=new THREE.Mesh(new THREE.BoxGeometry(.29,.45,.025),new THREE.MeshStandardMaterial({color:'#f8c75a',emissive:'#9f6d13',emissiveIntensity:.55,roughness:.35,metalness:.35}));card.position.y=1.3;g.add(card);const beacon=new THREE.PointLight('#f4cf75',3.5,4.3);beacon.position.y=1.7;g.add(beacon);const tag=new THREE.Mesh(new THREE.PlaneGeometry(.7,.26),label(`PAS ${i+1}`,'#292f26','#f3ca74'));tag.position.set(0,.74,.22);g.add(tag);scene.add(g);return{group:g,card};});
 let previewTime=0;const lookTarget=new THREE.Vector3();
 function render(run,{preview=false,reduced=false,behind=false}={}){
  const p=run.player;previewTime+=.016;camera.position.set(p.x,1.63+(reduced||preview?0:Math.sin(run.steps*2.4)*.036),p.z);camera.rotation.y=p.yaw+(behind?Math.PI:0)+(preview?Math.sin(previewTime*.075)*.16:0);camera.rotation.x=p.pitch;
  camera.fov=THREE.MathUtils.lerp(camera.fov,run.sprint?85:78,.08);camera.updateProjectionMatrix();
  const nearest=positions.map((pos,i)=>({i,d:pos.distanceToSquared(camera.position)})).sort((a,b)=>a.d-b.d).slice(0,4);
  pool.forEach((l,i)=>{l.position.copy(positions[nearest[i].i]);l.intensity=12;});
  flashlight.position.copy(camera.position);camera.getWorldDirection(lookTarget);flashlight.target.position.copy(camera.position).add(lookTarget);flashlight.visible=run.torch;
  run.enemies.forEach((e,i)=>{enemies[i].visible=e.active;enemies[i].position.set(e.x,1.55+(reduced?0:Math.sin(run.time*3+i)*.07),e.z);});
  cards.forEach((c,i)=>{c.group.visible=i<run.keys.length&&!run.keys[i].taken;c.card.rotation.y=reduced?0:run.time*.65+i;c.card.position.y=1.29+(reduced?0:Math.sin(run.time*2+i)*.04);});
  exitLamp.color.set(run.collected===run.keys.length?'#93dc9e':'#ba7453');renderer.render(scene,camera);
 }
 const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);};addEventListener('resize',resize);
 function dispose(){removeEventListener('resize',resize);scene.traverse(object=>{object.geometry?.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];for(const material of materials){if(!material)continue;material.map?.dispose();material.dispose();}});renderer.dispose();}
 return{render,renderer,scene,camera,dispose};
}
