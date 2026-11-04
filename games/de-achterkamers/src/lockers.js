import {Box3,Group,Vector3} from 'three';

// Reuse the downloaded full-height locker, including vents, hinges and hardware.
export function buildLockers(source,placements){
 source.updateMatrixWorld(true);const bounds=new Box3().setFromObject(source),size=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3());
 return placements.map(locker=>{
  const group=new Group(),normalization=new Group(),model=source.clone(true);
  model.position.set(-center.x,-bounds.min.y,-center.z);normalization.scale.set(.95/size.x,2.35/size.y,.9/size.z);normalization.add(model);group.add(normalization);
  group.position.set(locker.x,0,locker.z);group.rotation.y=locker.yaw;
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return group;
 });
}
