import {Box3,Group,InstancedMesh,Matrix4,Object3D,Vector3} from 'three';
import {LAYOUT,CELL_SIZE,HEIGHT,TILE_SIZE} from './layout.js';

// Reuse the actual model parts, their UVs, normals and embedded materials.
// Instancing keeps hundreds of walls and sixteen ceiling sections inexpensive.
export function buildEnvironment(source){
 source.updateMatrixWorld(true);
 const meshes=[];source.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const select=prefix=>meshes.filter(m=>m.parent.name.startsWith(prefix));
 const wall=select('Avarage_Wall_All_Sizes'),pillar=select('Ground_Cube_No_Baseboard');
 const floor=select('Carpet_'),ceiling=select('Celing'),fixtures=select('Lights_');
 if(!wall.length||!pillar.length||!floor.length||!ceiling.length||!fixtures.length)throw new Error('Packed map modules are missing.');
 const environment=new Group(),transform=new Object3D();
 function bounds(parts){const box=new Box3();parts.forEach(m=>box.union(new Box3().setFromObject(m)));return box;}
 function instances(parts,reference,target,placements,type){
  const center=reference.getCenter(new Vector3()),size=reference.getSize(new Vector3());
  const normalization=new Matrix4().makeScale(target.x/size.x,target.y/size.y,target.z/size.z)
   .multiply(new Matrix4().makeTranslation(-center.x,-reference.min.y,-center.z));
  for(const part of parts){
   const geometry=part.geometry.clone().applyMatrix4(part.matrixWorld).applyMatrix4(normalization);
   geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const mesh=new InstancedMesh(geometry,part.material,placements.length);mesh.name=`${type}_${part.material.name}`;
   placements.forEach((p,i)=>{
    transform.position.set(p.x,0,p.z);transform.rotation.set(0,p.vertical===false?Math.PI/2:0,0);transform.scale.set(1,1,1);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
   });
   mesh.computeBoundingBox();mesh.computeBoundingSphere();environment.add(mesh);
  }
 }
 instances(wall,bounds(wall),new Vector3(.22,HEIGHT,CELL_SIZE+.22),LAYOUT.walls,'wall');
 instances(pillar,bounds(pillar),new Vector3(1.05,HEIGHT,1.05),LAYOUT.pillars,'pillar');
 const shell=bounds([...floor,...ceiling]);
 instances([...floor,...ceiling,...fixtures],shell,new Vector3(TILE_SIZE,HEIGHT,TILE_SIZE),LAYOUT.tiles,'shell');
 return environment;
}
