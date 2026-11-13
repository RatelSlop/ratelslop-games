import {
 Box3, BoxGeometry, CanvasTexture, Group, Mesh, MeshStandardMaterial, PlaneGeometry,
 SRGBColorSpace, Vector3,
} from 'three';

export function weatherLocker(source, maps) {
 const steel=new MeshStandardMaterial({
  color:'#b8baa3',map:maps.color,normalMap:maps.normal,roughnessMap:maps.rough,
  roughness:.85,metalness:.28,
 });
 steel.normalScale.set(.42,.42);
 const wornHardware=new MeshStandardMaterial({color:'#8a8471',roughness:.55,metalness:.56});
 const dark=new MeshStandardMaterial({color:'#292c25',roughness:.96,metalness:.1});
 const shelves=[];
 source.traverse(object=>{
  if(!object.isMesh)return;
  const name=object.name.replaceAll('_',' ');
  if(name.includes('internal steel shelf')) shelves.push(object);
  else if(name.includes('nickel')||name.includes('hinge'))object.material=wornHardware;
  else if(name.includes('glide')||name.includes('foot'))object.material=dark;
  else object.material=steel;
 });
 shelves.forEach(object=>object.removeFromParent());
 // Dark backing lets the perforation geometry read in direct light.
 const backing=new Mesh(new BoxGeometry(.61,1.66,.02),dark);
 backing.position.set(0,1.028,.207);
 source.add(backing);
}

function numberPlate(number){
 const canvas=document.createElement('canvas');
 canvas.width=128;canvas.height=64;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#4e5248';ctx.fillRect(0,0,128,64);
 ctx.fillStyle='#b1a787';ctx.fillRect(5,5,118,54);
 ctx.fillStyle='#282b22';ctx.font='bold 39px monospace';ctx.textAlign='center';
 ctx.fillText(String(number).padStart(2,'0'),64,46);
 const map=new CanvasTexture(canvas);map.colorSpace=SRGBColorSpace;
 return new Mesh(new PlaneGeometry(.18,.09),new MeshStandardMaterial({map,roughness:.85}));
}

// The vented steel door faces +Z, which is rotated into the playable corridor.
export function buildLockers(source,placements,{plates=false}={}){
 source.updateMatrixWorld(true);
 const bounds=new Box3().setFromObject(source),size=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3());
 return placements.map(locker=>{
  const group=new Group(),normalization=new Group(),model=source.clone(true);
  model.position.sub(new Vector3(center.x,bounds.min.y,center.z));
  normalization.scale.set(.95/size.x,2.35/size.y,.9/size.z);
  normalization.add(model);group.add(normalization);
  group.position.set(locker.x,0,locker.z);group.rotation.y=locker.yaw;
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  if(plates){
   const plate=numberPlate(locker.id+1);
   plate.position.set(0,2.18,.451);
   group.add(plate);
  }
  return group;
 });
}
