import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MODEL} from './map.js';
import {buildEnvironment} from './model-geometry.js';
export async function createScene(canvas,map){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#020302');scene.fog=new THREE.FogExp2('#040504',.075);
 const camera=new THREE.PerspectiveCamera(78,innerWidth/innerHeight,.06,75);camera.rotation.order='YXZ';
 const ambient=new THREE.HemisphereLight('#cbd1b5','#050605',.035);scene.add(ambient);
 // Preserve the packed model's separate meshes, UVs and embedded textures.
 const gltf=await new GLTFLoader().loadAsync(new URL('models/backrooms.glb',document.baseURI).href);
 const environment=buildEnvironment(gltf.scene);
 environment.traverse(object=>{
  if(!object.isMesh)return;
  object.receiveShadow=true;object.castShadow=object.name.startsWith('wall_')||object.name.startsWith('pillar_');
  const materials=Array.isArray(object.material)?object.material:[object.material];
  for(const material of materials){
   if(material.map)material.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
   material.roughness=Math.max(material.roughness,.8);
   if(material.name==='Ligts'){material.emissive.set('#b9b583');material.emissiveIntensity=.035;}
  }
 });
 scene.add(environment);
 const positions=MODEL.lights.map(([x,y,z])=>new THREE.Vector3(x,y-.12,z));
 const pool=Array.from({length:4},()=>{const l=new THREE.PointLight('#b9b583',.12,3.6,2);scene.add(l);return l;});
 const flashlight=new THREE.SpotLight('#fff5d7',65,22,.50,.72,1.5);
 flashlight.castShadow=true;flashlight.shadow.mapSize.set(1024,1024);flashlight.shadow.camera.near=.1;flashlight.shadow.camera.far=22;flashlight.shadow.bias=-.0002;flashlight.shadow.normalBias=.025;
 scene.add(flashlight,flashlight.target);
 function label(text,bg='#254b39',fg='#f7f2d3'){const c=document.createElement('canvas');c.width=512;c.height=192;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,512,192);x.strokeStyle=fg;x.lineWidth=7;x.strokeRect(8,8,496,176);x.fillStyle=fg;x.textAlign='center';x.font='bold 64px sans-serif';x.fillText(text,256,119);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide});}
 const start=map.center(map.start);const exit=new THREE.Group();exit.position.set(map.exit.x,0,map.exit.z);exit.rotation.y=map.exit.yaw;scene.add(exit);
 const door=new THREE.Mesh(new THREE.BoxGeometry(1.6,2.65,.16),new THREE.MeshStandardMaterial({color:'#345447',metalness:.25,roughness:.75}));door.position.y=1.325;exit.add(door);
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.65,.62),label('UITGANG'));sign.position.set(0,2.82,.12);exit.add(sign);
 const doorStripe=new THREE.Mesh(new THREE.BoxGeometry(1.25,.12,.08),new THREE.MeshStandardMaterial({color:'#a6a68d',metalness:.7,roughness:.3}));doorStripe.position.set(0,1.2,.13);exit.add(doorStripe);
 const exitLamp=new THREE.PointLight('#7ba37e',.35,2.8);exitLamp.position.set(start.x,2.5,start.z);scene.add(exitLamp);
 const loader=new THREE.TextureLoader();const faces=await Promise.all(['mijke','marola','jaap','thomas'].map(id=>loader.loadAsync(new URL(`faces/${id}.webp`,document.baseURI).href)));
 const enemies=faces.map((texture,i)=>{texture.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.08,depthWrite:false,color:'#ffffff',toneMapped:false});const sprite=new THREE.Sprite(mat);sprite.scale.set(2.18,2.18,1);sprite.visible=false;scene.add(sprite);return sprite;});
 const cards=map.objectives.map((cell,i)=>{const g=new THREE.Group();const p=map.center(cell);g.position.set(p.x,0,p.z);const pedestal=new THREE.Mesh(new THREE.BoxGeometry(.48,.95,.42),new THREE.MeshStandardMaterial({color:'#535744',roughness:.65,metalness:.4}));pedestal.position.y=.475;g.add(pedestal);const card=new THREE.Mesh(new THREE.BoxGeometry(.29,.45,.025),new THREE.MeshStandardMaterial({color:'#f8c75a',emissive:'#9f6d13',emissiveIntensity:.12,roughness:.35,metalness:.35}));card.position.y=1.3;g.add(card);const beacon=new THREE.PointLight('#f4cf75',.4,2.3);beacon.position.y=1.7;g.add(beacon);const tag=new THREE.Mesh(new THREE.PlaneGeometry(.7,.26),label(`PAS ${i+1}`,'#292f26','#f3ca74'));tag.position.set(0,.74,.22);g.add(tag);scene.add(g);return{group:g,card};});
 let previewTime=0;const lookTarget=new THREE.Vector3(),toEnemy=new THREE.Vector3();
 function render(run,{preview=false,reduced=false,behind=false}={}){
  const p=run.player;previewTime+=.016;camera.position.set(p.x,1.63+(reduced||preview?0:Math.sin(run.steps*2.4)*.036),p.z);camera.rotation.y=p.yaw+(behind?Math.PI:0)+(preview?Math.sin(previewTime*.075)*.16:0);camera.rotation.x=p.pitch;
  camera.fov=THREE.MathUtils.lerp(camera.fov,run.sprint?85:78,.08);camera.updateProjectionMatrix();
  const nearest=positions.map((pos,i)=>({i,d:pos.distanceToSquared(camera.position)})).sort((a,b)=>a.d-b.d).slice(0,4);
  pool.forEach((l,i)=>{l.visible=!!nearest[i];if(nearest[i])l.position.copy(positions[nearest[i].i]);});
  flashlight.position.copy(camera.position);camera.getWorldDirection(lookTarget);flashlight.target.position.copy(camera.position).add(lookTarget);flashlight.visible=run.torch;
  run.enemies.forEach((e,i)=>{
   const sprite=enemies[i];sprite.visible=e.active;sprite.position.set(e.x,1.55+(reduced?0:Math.sin(run.time*3+i)*.07),e.z);
   // Sprites are unlit: explicitly let the flashlight reveal them, with a
   // close-range reveal so a face emerging from the dark reads as a scare.
   toEnemy.copy(sprite.position).sub(camera.position);const distance=toEnemy.length();
   const alignment=toEnemy.normalize().dot(lookTarget);
   const beam=run.torch?THREE.MathUtils.smoothstep(alignment,Math.cos(.66),Math.cos(.36))*Math.max(0,1-distance/22):0;
   const close=1-THREE.MathUtils.smoothstep(distance,.85,2.8);
   sprite.material.color.setScalar(Math.max(.012,beam,close));
  });
  cards.forEach((c,i)=>{c.group.visible=i<run.keys.length&&!run.keys[i].taken;c.card.rotation.y=reduced?0:run.time*.65+i;c.card.position.y=1.29+(reduced?0:Math.sin(run.time*2+i)*.04);});
  exitLamp.color.set(run.collected===run.keys.length?'#93dc9e':'#ba7453');renderer.render(scene,camera);
 }
 const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);};addEventListener('resize',resize);
 function dispose(){removeEventListener('resize',resize);scene.traverse(object=>{object.geometry?.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];for(const material of materials){if(!material)continue;material.map?.dispose();material.dispose();}});renderer.dispose();}
 return{render,renderer,scene,camera,dispose};
}
