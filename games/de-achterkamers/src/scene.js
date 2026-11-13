import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

import {buildEnvironment} from './model-geometry.js';
import {buildLockers,weatherLocker} from './lockers.js';
import {createCeilingLighting} from './lighting.js';
import {addSurfaceWear} from './surfaces.js';
export async function createScene(canvas,map){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#b5ad7b');scene.fog=new THREE.FogExp2('#b5ad7b',.018);
 const camera=new THREE.PerspectiveCamera(78,innerWidth/innerHeight,.06,75);camera.rotation.order='YXZ';
 const ambient=new THREE.HemisphereLight('#fff3ca','#7c7355',1.65);scene.add(ambient);
 // Preserve the packed model's separate meshes, UVs and embedded textures.
 const models=new GLTFLoader(),loader=new THREE.TextureLoader();
 const asset=path=>new URL(path,document.baseURI).href;
 async function texture(path,color=false){
  const map=await loader.loadAsync(asset('textures/'+path+'.jpg'));
  map.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return map;
 }
 const [gltf,lockerAsset,carpet,carpetNormal,steel,steelNormal,steelRough,passTexture]=await Promise.all([
  models.loadAsync(asset('models/backrooms.glb')),models.loadAsync(asset('models/vent-locker.glb')),
  texture('dirty_carpet-diffuse',true),texture('dirty_carpet-nor_gl'),
  texture('green_metal_rust-diffuse',true),texture('green_metal_rust-nor_gl'),texture('green_metal_rust-rough'),
  loader.loadAsync(asset('textures/access-pass.png')),
 ]);
 passTexture.colorSpace=THREE.SRGBColorSpace;
 passTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const carpetMaterial=new THREE.MeshStandardMaterial({
  color:'#a59772',map:carpet,normalMap:carpetNormal,roughness:.96,side:THREE.DoubleSide,
 });
 carpetMaterial.normalScale.set(.65,.65);
 addSurfaceWear(carpetMaterial,'floor');
 const makeEnvironment=()=>buildEnvironment(gltf.scene,map.layout);
 const ceilingLights=createCeilingLighting();

 let environment=makeEnvironment(),environmentRevision=map.revision;
 function configureEnvironment(group){group.traverse(object=>{
  if(!object.isMesh)return;
  object.receiveShadow=true;object.castShadow=object.name.startsWith('wall_')||object.name.startsWith('pillar_');
  const isFixture=object.name.startsWith('fixture_');
  // Separate the original fluorescent faces from the ceiling grid at grazing angles.
  if(isFixture){object.geometry.translate(0,-.008,0);object.computeBoundingBox();object.computeBoundingSphere();}
  if(object.name.startsWith('floor_')){
   const positions=object.geometry.attributes.position;
   const uv=new Float32Array(positions.count*2);
   for(let i=0;i<positions.count;i++){
    uv[i*2]=positions.getX(i)/1.2;uv[i*2+1]=positions.getZ(i)/1.2;
   }
   object.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
   object.material=carpetMaterial;
  }
  const materials=Array.isArray(object.material)?object.material:[object.material];
  for(const material of materials){
   if(material.map)material.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
   material.roughness=Math.max(material.roughness,.8);
   if(object.name.startsWith('ceiling_'))material.side=THREE.DoubleSide;
   if(material.name==='Wallpaper')addSurfaceWear(material,'wall');
   if(isFixture)ceilingLights.panels.add(material);
   else ceilingLights.illuminate(material);
  }
 });}
 configureEnvironment(environment);
 scene.add(environment);
 weatherLocker(lockerAsset.scene,{color:steel,normal:steelNormal,rough:steelRough});
 const lockers=buildLockers(lockerAsset.scene,map.lockers,{plates:true});
 lockers.forEach(locker=>{
  locker.traverse(object=>{if(object.isMesh)ceilingLights.illuminate(object.material);});
  scene.add(locker);
 });
 const flashlight=new THREE.SpotLight('#fff5d7',65,22,.50,.72,1.5);
 flashlight.castShadow=true;flashlight.shadow.mapSize.set(1024,1024);flashlight.shadow.camera.near=.1;flashlight.shadow.camera.far=22;flashlight.shadow.bias=-.0002;flashlight.shadow.normalBias=.025;
 scene.add(flashlight,flashlight.target);
 function label(text,bg='#254b39',fg='#f7f2d3'){const c=document.createElement('canvas');c.width=512;c.height=192;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,512,192);x.strokeStyle=fg;x.lineWidth=7;x.strokeRect(8,8,496,176);x.fillStyle=fg;x.textAlign='center';x.font='bold 64px sans-serif';x.fillText(text,256,119);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide});}
 const start=map.center(map.start);const exit=new THREE.Group();exit.position.set(map.exit.x,0,map.exit.z);exit.rotation.y=map.exit.yaw;scene.add(exit);
 const door=new THREE.Mesh(new THREE.BoxGeometry(1.6,2.65,.16),new THREE.MeshStandardMaterial({color:'#345447',metalness:.25,roughness:.75}));door.position.y=1.325;exit.add(door);
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.65,.62),label('UITGANG'));sign.position.set(0,2.82,.12);exit.add(sign);
 const doorStripe=new THREE.Mesh(new THREE.BoxGeometry(1.25,.12,.08),new THREE.MeshStandardMaterial({color:'#a6a68d',metalness:.7,roughness:.3}));doorStripe.position.set(0,1.2,.13);exit.add(doorStripe);
 const exitLamp=new THREE.PointLight('#7ba37e',.35,2.8);exitLamp.position.set(start.x,2.5,start.z);scene.add(exitLamp);
 const faces=await Promise.all(['mijke','marola','jaap','thomas'].map(id=>loader.loadAsync(new URL(`faces/${id}.webp`,document.baseURI).href)));
 const enemies=faces.map((texture,i)=>{texture.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.08,depthWrite:false,color:'#ffffff',toneMapped:false});const sprite=new THREE.Sprite(mat);sprite.scale.set(2.18,2.18,1);sprite.visible=false;scene.add(sprite);return sprite;});
 const passWidth=.52;
 const passGeometry=new THREE.BoxGeometry(passWidth,passWidth*passTexture.image.height/passTexture.image.width,.018);
 const passEdge=new THREE.MeshStandardMaterial({color:'#260d25',roughness:.65});
 const passFace=new THREE.MeshStandardMaterial({
  map:passTexture,emissiveMap:passTexture,emissive:'#ffffff',emissiveIntensity:.35,roughness:.62,
 });
 const passMaterials=[passEdge,passEdge,passEdge,passEdge,passFace,passFace];
 const cards=map.objectives.map((cell,i)=>{
  const group=new THREE.Group(),p=map.center(cell);
  group.position.set(p.x,0,p.z);
  const pedestal=new THREE.Mesh(new THREE.BoxGeometry(.48,.95,.42),new THREE.MeshStandardMaterial({color:'#535744',roughness:.65,metalness:.4}));
  pedestal.position.y=.475;
  const card=new THREE.Mesh(passGeometry,passMaterials);
  card.position.y=1.3;
  const beacon=new THREE.PointLight('#f4cf75',.4,2.3);
  beacon.position.y=1.7;
  const tag=new THREE.Mesh(new THREE.PlaneGeometry(.7,.26),label(`PAS ${i+1}`,'#292f26','#f3ca74'));
  tag.position.set(0,.74,.22);
  group.add(pedestal,card,beacon,tag);
  scene.add(group);
  return {group,card};
 });
 let previewTime=0,lastLighting=null;const lookTarget=new THREE.Vector3(),toEnemy=new THREE.Vector3();
 function render(run,{preview=false,reduced=false,behind=false}={}){
  if(environmentRevision!==map.revision){
   const previous=environment;scene.remove(previous);environment=makeEnvironment();configureEnvironment(environment);scene.add(environment);environmentRevision=map.revision;lastLighting=null;
   previous.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.dispose?.();}});
  }
  const p=run.player;previewTime+=.016;camera.position.set(p.x,1.63+(reduced||preview?0:Math.sin(run.steps*2.4)*.036),p.z);camera.rotation.y=p.yaw+(behind?Math.PI:0)+(preview?Math.sin(previewTime*.075)*.16:0);camera.rotation.x=p.pitch;
  if(run.hiding!==null){const locker=map.lockers[run.hiding];camera.position.set(locker.x+locker.front.x*.5,1.7,locker.z+locker.front.z*.5);camera.rotation.y=p.yaw;}
  lockers.forEach((locker,i)=>locker.visible=run.hiding!==i);
  camera.fov=THREE.MathUtils.lerp(camera.fov,run.sprint?85:78,.08);camera.updateProjectionMatrix();
  const escape=!preview&&run.phase==='escape',blackout=!preview&&!escape&&run.power.blackout,lighting=`${blackout}:${escape}`;
  if(lighting!==lastLighting){
   lastLighting=lighting;ambient.intensity=blackout?.035:escape?.82:1.17;ambient.color.set(escape?'#ff8b79':'#fff3ca');ambient.groundColor.set(escape?'#491e20':'#7c7355');
   scene.background.set(blackout?'#020302':escape?'#271316':'#b5ad7b');scene.fog.color.copy(scene.background);scene.fog.density=blackout?.075:.018;
   ceilingLights.setMode(blackout?'blackout':escape?'escape':'normal');
  }
  flashlight.position.copy(camera.position);camera.getWorldDirection(lookTarget);flashlight.target.position.copy(camera.position).add(lookTarget);flashlight.visible=run.torch&&run.hiding===null;
  run.enemies.forEach((e,i)=>{
   const sprite=enemies[i];sprite.visible=e.active;sprite.position.set(e.x,1.55+(reduced?0:Math.sin(run.time*3+i)*.07),e.z);
   // Sprites are unlit: explicitly let the flashlight reveal them, with a
   // close-range reveal so a face emerging from the dark reads as a scare.
   toEnemy.copy(sprite.position).sub(camera.position);const distance=toEnemy.length();
   const alignment=toEnemy.normalize().dot(lookTarget);
   const beam=run.torch?THREE.MathUtils.smoothstep(alignment,Math.cos(.66),Math.cos(.36))*Math.max(0,1-distance/22):0;
   const close=1-THREE.MathUtils.smoothstep(distance,.85,2.8);
   sprite.material.color.setScalar(blackout?Math.max(.012,beam,close):1);
  });
  cards.forEach((c,i)=>{c.group.visible=i<run.keys.length&&!run.keys[i].taken;c.card.rotation.y=reduced?0:run.time*.65+i;c.card.position.y=1.29+(reduced?0:Math.sin(run.time*2+i)*.04);});
  exitLamp.color.set(run.collected===run.keys.length?'#93dc9e':'#ba7453');renderer.render(scene,camera);
 }
 const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);};addEventListener('resize',resize);
 function dispose(){
  removeEventListener('resize',resize);
  const geometries=new Set(),materials=new Set(),textures=new Set([carpet,carpetNormal,steel,steelNormal,steelRough]);
  for(const root of [scene,gltf.scene,lockerAsset.scene]){
   root.traverse(object=>{
    if(object.geometry)geometries.add(object.geometry);
    if(object.isInstancedMesh)object.dispose();
    for(const material of [].concat(object.material??[])){
     materials.add(material);
     for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
    }
   });
  }
  geometries.forEach(geometry=>geometry.dispose());
  materials.forEach(material=>material.dispose());
  textures.forEach(map=>map.dispose());
  flashlight.shadow.dispose();
  renderer.dispose();
 }
 return{render,renderer,scene,camera,dispose};
}
