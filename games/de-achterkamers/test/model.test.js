import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Box3,Matrix4,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildEnvironment} from '../src/model-geometry.js';
import {generateMap,MODEL,HEIGHT} from '../src/map.js';
import {buildLockers} from '../src/lockers.js';

const bytes=await readFile(new URL('../public/models/backrooms.glb',import.meta.url));
const length=bytes.readUInt32LE(12),data=JSON.parse(bytes.subarray(20,20+length));
data.buffers[0].uri='data:application/octet-stream;base64,'+bytes.subarray(28+length).toString('base64');
for(const material of data.materials){delete material.pbrMetallicRoughness?.baseColorTexture;delete material.pbrMetallicRoughness?.metallicRoughnessTexture;}
delete data.images;delete data.textures;
globalThis.ProgressEvent??=class{};
const {scene}=await new GLTFLoader().parseAsync(JSON.stringify(data),'');

test('the original packed ceiling tiles, raised grid and lights cover the randomized maze',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),MODEL.sha256);
 for(const seed of [51,52]){
  const map=generateMap(seed),environment=buildEnvironment(scene,map.layout);
  const ceilings=environment.children.filter(m=>m.name.startsWith('ceiling_'));
  assert.deepEqual(ceilings.map(m=>m.material.name).sort(),['Celing_Gaps','Celing_Tiles']);
  for(const ceiling of ceilings){
   assert.equal(ceiling.count,16);assert.ok(ceiling.geometry.attributes.position.count>100);
   const bounds=new Box3().setFromObject(ceiling);
   assert.ok(Math.abs(bounds.min.x)<.001&&Math.abs(bounds.min.z)<.001);
   assert.ok(Math.abs(bounds.max.x-map.length)<.001&&Math.abs(bounds.max.z-map.length)<.001);
   assert.ok(bounds.min.y>HEIGHT-.02&&bounds.max.y<=HEIGHT+.001);
  }
  assert.ok(environment.children.some(m=>m.name==='fixture_Ligts'&&m.count===16));
 }
});

test('randomized rendered wall and pillar bounds agree with their live collision rectangles',()=>{
 for(const seed of [1,51,52,42971]){
  const map=generateMap(seed);if(seed===52)map.shiftCorridors([map.center(map.start)]);
  const environment=buildEnvironment(scene,map.layout);
  for(const [prefix,rectangles] of [['wall_',map.walls],['pillar_',map.pillars]]){
   const meshes=environment.children.filter(m=>m.name.startsWith(prefix));
   assert.ok(meshes.length);
   for(let i=0;i<rectangles.length;i++){
    const box=new Box3();
    for(const mesh of meshes){const matrix=new Matrix4();mesh.getMatrixAt(i,matrix);box.union(mesh.geometry.boundingBox.clone().applyMatrix4(matrix));}
    const center=box.getCenter(new Vector3()),size=box.getSize(new Vector3()),r=rectangles[i];
    for(const [a,b] of [[center.x,r.x],[center.z,r.z],[size.x,r.w],[size.z,r.d]])assert.ok(Math.abs(a-b)<.0001);
   }
  }
 }
});

test('the downloaded CC0 locker retains detailed geometry and fits its collision footprint',async()=>{
 const asset=await readFile(new URL('../public/models/locker.glb',import.meta.url));
 assert.equal(createHash('sha256').update(asset).digest('hex'),'5338c68dfb627645f9c89438061d36698d2302858fc79f1bb006d108bc45f604');
 const length=asset.readUInt32LE(12),data=JSON.parse(asset.subarray(20,20+length));data.buffers[0].uri='data:application/octet-stream;base64,'+asset.subarray(28+length).toString('base64');
 for(const material of data.materials){delete material.pbrMetallicRoughness?.baseColorTexture;delete material.pbrMetallicRoughness?.metallicRoughnessTexture;delete material.normalTexture;delete material.occlusionTexture;}
 delete data.images;delete data.textures;
 const {scene:source}=await new GLTFLoader().parseAsync(JSON.stringify(data),'');
 let triangles=0;source.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});assert.ok(triangles>=5000);
 const map=generateMap(51),lockers=buildLockers(source,map.lockers);
 lockers.forEach((object,i)=>{const box=new Box3().setFromObject(object),size=box.getSize(new Vector3()),l=map.lockers[i];assert.ok(Math.abs(size.x-l.w)<.001);assert.ok(Math.abs(size.z-l.d)<.001);assert.ok(Math.abs(size.y-2.35)<.001);});
});
