import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { ball, bee, box, cyclist, piece, rng, rod, standard } from './models.js';
import { approachOffset, LANE_WIDTH, obstacles } from './runner.js';
import { createObstacle, dressSegment, districtAt, SEGMENT } from './route.js';
export { districtAt };

const asset = path => import.meta.env.BASE_URL + path;
const SEGMENTS = 12;
const roadY = 0.015;

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function instance(parent, geometry, material, transforms) {
  const mesh = new T.InstancedMesh(geometry, material, transforms.length);
  const dummy = new T.Object3D();
  transforms.forEach(([x, y, z, sx, sy, sz, ry = 0], index) => {
    dummy.position.set(x, y, z);
    dummy.scale.set(sx, sy, sz);
    dummy.rotation.y = ry;
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  parent.add(mesh);
  return mesh;
}

function cycleSign(group, x, z, mats) {
  rod(group, mats.metal, [x, 0, z], [x, 2.2, z], 0.045);
  const sign = piece(group, new T.CylinderGeometry(.36, .36, .045, 32), mats.sign, x, 2.08, z);
  sign.rotation.x = Math.PI / 2;
  const icon = new T.Group();
  icon.position.set(x, 2.08, z + .027);
  group.add(icon);
  for (const xx of [-.16, .16]) piece(icon, new T.TorusGeometry(.08, .012, 6, 16), mats.white, xx, -.038, 0);
  for (const [a, b] of [
    [[-.16, -.038, 0], [-.07, .08, 0]], [[-.16, -.038, 0], [.04, -.038, 0]],
    [[-.07, .08, 0], [.04, -.038, 0]], [[.04, -.038, 0], [.10, .09, 0]],
    [[.10, .09, 0], [.16, -.038, 0]], [[-.07, .08, 0], [.10, .09, 0]],
  ]) rod(icon, mats.white, a, b, .01);
}

function windmill(mats) {
  const group = new T.Group();
  piece(group, new T.CylinderGeometry(.58, 1.25, 5.2, 8), mats.brick, 0, 2.6, 0);
  piece(group, new T.ConeGeometry(.97, 1.25, 8), mats.roof, 0, 5.75, 0);
  const rotor = new T.Group();
  rotor.position.set(0, 4.7, .81);
  group.add(rotor);
  for (let i = 0; i < 4; i++) {
    const arm = new T.Group();
    arm.rotation.z = i * Math.PI / 2;
    rotor.add(arm);
    box(arm, mats.wood, 0, 1.55, 0, .075, 3.45, .09);
    for (let rung = 0; rung < 9; rung++) box(arm, mats.wood, .21, .99 + rung * .25, 0, .47, .043, .045);
    box(arm, mats.white, .40, 2.02, 0, .22, 2.19, .033);
  }
  group.userData.rotor = rotor;
  return group;
}

function makeSegment(index, mats) {
  const group = new T.Group();
  const random = rng(412 + index * 13);
  const onBridge = districtAt(index * SEGMENT) === 'Houten brug';
  if (onBridge) {
    box(group, mats.water, 0, -.18, -SEGMENT / 2, 9, .06, SEGMENT);
    for (const sign of [-1, 1]) box(group, mats.ground, sign * 32, -.09, -SEGMENT / 2, 55, .14, SEGMENT);
  } else {
    box(group, mats.ground, 0, -.09, -SEGMENT / 2, 120, .14, SEGMENT);
    box(group, mats.road, 0, 0, -SEGMENT / 2, 7.05, .06, SEGMENT);
  }
  box(group, mats.water, 11.8, .009, -SEGMENT / 2, 8.8, .04, SEGMENT);
  const marks = [];
  for (const x of [-3.36, 3.36]) marks.push([x, roadY + .02, -SEGMENT / 2, .065, .009, SEGMENT]);
  for (const x of [-LANE_WIDTH / 2, LANE_WIDTH / 2]) {
    for (let z = 1; z < SEGMENT; z += 4) marks.push([x, roadY + .02, -z, .045, .008, 1.33]);
  }
  if (!onBridge) instance(group, new T.BoxGeometry(1, 1, 1), mats.mark, marks);
  if (index % 3 === 0) cycleSign(group, -4.25, -7, mats);

  const crowns = [[], [], []];
  const trunks = [];
  const leaves = [];
  for (let i = 0; i < (10); i++) {
    const right = i % 2 === 1;
    const minEdge = onBridge ? 5.2 : 4.8;
    const x = right ? 5.8 + random() * 1.12 : -(minEdge + random() * 16);
    const z = -random() * SEGMENT;
    const h = 3.7 + random() * 5.4;
    const radius = 1.22 + h * .19;
    trunks.push([x, h * .35, z, h * .035, h * .72, h * .035, random() * 6]);
    for (let c = 0; c < (6); c++) {
      const r = radius * (.43 + random() * .48);
      crowns[i % 3].push([x + (random() - .5) * radius, h * (.61 + random() * .33), z + (random() - .5) * radius, r, r * (.76 + random() * .5), r, random() * 7]);
    }
  }
  const foliage = new T.IcosahedronGeometry(1, 1);
  const distantTrees = new T.Group();
  group.add(distantTrees);
  group.userData.distantTrees = distantTrees;
  crowns.forEach((placements, i) => {
    instance(distantTrees, foliage, mats.crowns[i], placements).castShadow = true;
  });
  instance(distantTrees, new T.CylinderGeometry(.57, 1, 1, 8), mats.wood, trunks).castShadow = true;
  const flowers = [[], [], []];
  const centers = [];
  const stems = [];
  for (let i = 0; i < (130); i++) {
    const x = (i % 2 ? 1 : -1) * ((onBridge ? 4.65 : 3.75) + random() ** 1.6 * 3.3);
    const z = -random() * SEGMENT;
    const h = .17 + random() * .6;
    stems.push([x, h / 2, z, .016, h, .016]);
    leaves.push([x + .11, h * .45, z, .15, .038, .065, random() * 7]);
    if (i % 3 !== 0) {
      centers.push([x, h, z, .043, .032, .043]);
      for (let p = 0; p < 5; p++) {
        const angle = p * Math.PI * .4;
        flowers[i % 3].push([x + Math.cos(angle) * .066, h, z + Math.sin(angle) * .066, .057, .026, .046, angle]);
      }
    }
  }
  instance(group, new T.CylinderGeometry(1, 1, 1, 5), mats.leaf, stems);
  instance(group, new T.IcosahedronGeometry(1, 0), mats.leaf, leaves);
  const petal = new T.SphereGeometry(1, 6, 4);
  instance(group, petal, mats.gold, centers);
  flowers.forEach((positions, i) => instance(group, petal, mats.petals[i], positions));

  if (index === 0 || index === 2) {
    const mill = windmill(mats);
    mill.position.set(17, 0, -24);
    mill.scale.setScalar(1.3);
    group.add(mill);
    group.userData.rotor = mill.userData.rotor;
  }
  dressSegment(group, index, mats, random);
  group.userData.index = index;
  return group;
}

function createMaterials() {
  const road = standard(0xc58b75);
  const ground = standard(0x819d4a);
  return {
    road, ground,
    water: new T.MeshPhysicalMaterial({ color: 0x48786e, roughness: .24, metalness: .28 }),
    crowns: [0x366637, 0x53833d, 0x6e994c].map(c => standard(c)),
    petals: [0xe4adf0, 0xffcf56, 0xfff4cf].map(c => standard(c)),
    wood: standard(0x59462e), mark: standard(0xf1d9b2),
    leaf: standard(0x467d3a), gold: standard(0xffc443, { emissive: 0x9e5d13, emissiveIntensity: .25 }),
    white: standard(0xffeed4), metal: standard(0x78918b, { metalness: .5 }), sign: standard(0x275c96),
    brick: standard(0xc5987d), roof: standard(0x423b32), barrier: standard(0xd96143),
    plank: standard(0xb69b77), tile: standard(0x904b36),
    bloom: [standard(0xd7b8c4), standard(0xc58e9d)],
  };
}

async function loadAssets(segments, mats) {
  const loader = new GLTFLoader();
  const textureLoader = new T.TextureLoader();
  const loadTexture = async (name, color) => {
    const texture = await textureLoader.loadAsync(asset('textures/' + name + '.jpg'));
    texture.colorSpace = color ? T.SRGBColorSpace : T.NoColorSpace;
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
  };
  const [stump, grass, tree, asphalt, asphaltNormal, earth, earthNormal, brick, plank] = await Promise.all([
    loader.loadAsync(asset('models/tree_stump_01/tree_stump_01.gltf')),
    loader.loadAsync(asset('models/grass_medium_01/grass_medium_01.gltf')),
    loader.loadAsync(asset('models/cycle-tree.glb')),
    loadTexture('asphalt_02_diff', true), loadTexture('asphalt_02_nor_gl', false),
    loadTexture('forest_ground_04_diff', true), loadTexture('forest_ground_04_nor_gl', false),
    loadTexture('red_brick_diff', true), loadTexture('wooden_gate_diff', true),
  ]);
  for (const [mat, color, normal, u, v] of [[mats.road, asphalt, asphaltNormal, 3, 13], [mats.ground, earth, earthNormal, 39, 11]]) {
    color.repeat.set(u, v);
    normal.repeat.set(u, v);
    mat.map = color;
    mat.normalMap = normal;
    mat.normalScale.setScalar(.57);
    mat.needsUpdate = true;
  }
  mats.brick.map = brick;
  brick.repeat.set(2.4, 1.8);
  mats.plank.map = plank;
  mats.brick.needsUpdate = mats.plank.needsUpdate = true;
  grass.scene.traverse(mesh => {
    if (mesh.isMesh && mesh.material.transparent) {
      mesh.material.transparent = false;
      mesh.material.alphaTest = .35;
    }
  });
  const bounds = new T.Box3().setFromObject(tree.scene);
  const treeHeight = bounds.max.y - bounds.min.y;
  tree.scene.position.y = -bounds.min.y;
  tree.scene.traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (mesh.material.transparent) {
      mesh.material.transparent = false;
      mesh.material.alphaTest = .36;
    }
  });
  for (const segment of segments) {
    const i = segment.userData.index;
    const trees = new T.Group();
    trees.name = 'Detailed trees';
    segment.add(trees);
    segment.userData.detailedTrees = trees;
    for (const [x, z, height] of [[5.95, -3, 7.1], [-5.65, -11, 8.1], [6.35, -22, 6.8]]) {
      const wrapper = new T.Group();
      wrapper.add(tree.scene.clone());
      wrapper.scale.setScalar((height + (i % 3) * .38) / treeHeight);
      wrapper.rotation.y = i * 1.4 + z;
      wrapper.position.set(x, 0, z);
      trees.add(wrapper);
    }
    if (i % 2 === 0 && districtAt(i * SEGMENT) !== 'Houten brug') {
      const root = stump.scene.clone();
      root.scale.setScalar(1.5);
      root.position.set(i === 0 ? -4.7 : 4.6, -.02, -5.5);
      segment.add(root);
    }
    for (let j = 0; j < 4; j++) {
      const tuft = grass.scene.clone();
      tuft.scale.setScalar(1.7);
      tuft.rotation.y = j * 1.7;
      tuft.position.set((j % 2 ? 1 : -1) * (districtAt(i * SEGMENT) === 'Houten brug' ? 4.75 : 4.18), .01, -2 - j * 7);
      segment.add(tuft);
    }
  }
}

function createView() {
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0xd9e3ce, .013);
  scene.add(new T.HemisphereLight(0xe6f2ff, 0x687447, 2.15));
  const sun = new T.DirectionalLight(0xffe1ae, 3.05);
  sun.position.set(-14, 20, 5);
  scene.add(sun, sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 21, bottom: -16, near: 1, far: 58 });
  sun.shadow.bias = -.00045;
  sun.shadow.normalBias = .045;
  const sky = new Sky();
  sky.scale.setScalar(450000);
  sky.material.uniforms.turbidity.value = 2.9;
  sky.material.uniforms.rayleigh.value = 2.2;
  sky.material.uniforms.mieCoefficient.value = .009;
  sky.material.uniforms.sunPosition.value.set(-.75, .48, -.42);
  scene.add(sky);
  const mats = createMaterials();
  const segments = Array.from({ length: SEGMENTS }, (_, i) => makeSegment(i, mats));
  for (const group of segments) {
    group.traverse(mesh => { if (mesh.isMesh) mesh.receiveShadow = true; });
    scene.add(group);
  }
  const avatar = bee();
  scene.add(avatar);
  avatar.traverse(mesh => { if (mesh.isMesh && !mesh.material.transparent && !mesh.isInstancedMesh) mesh.castShadow = true; });
  const objects = new Map();
  const pools = new Map();
  const templates = new Map();
  function createObject(kind, variant) {
    if (obstacles[kind]?.pace) {
      const rider = cyclist(kind, variant);
      rider.traverse(mesh => { if (mesh.isMesh) mesh.castShadow = true; });
      return rider;
    }
    if (kind === 'hay' || kind === 'bollards' || kind === 'gate') {
      if (!templates.has(kind)) templates.set(kind, createObstacle(kind, mats));
      return templates.get(kind).clone();
    }
    if (!templates.has(kind)) {
      const model = new T.Group();
      if (kind === 'pollen') {
        piece(model, new T.IcosahedronGeometry(.185, 1), mats.gold, 0, 0, 0);
        const ring = piece(model, new T.TorusGeometry(.244, .017, 6, 16), mats.gold, 0, 0, 0);
        ring.rotation.y = Math.PI / 2;
      } else if (kind === 'branch') {
        rod(model, mats.wood, [-.95, .26, 0], [.97, -.14, .15], .13, .067);
        for (let i = 0; i < 5; i++) {
          ball(model, mats.leaf, -.68 + i * .37, .21 - i * .068, .10, .36, .2, .24);
        }
      } else {
        for (const x of [-.73, .73]) box(model, mats.metal, x, .29, 0, .13, .58, .15);
        box(model, mats.barrier, 0, .54, 0, 1.69, .27, .13);
        for (const x of [-.58, 0, .58]) box(model, mats.white, x, .54, .069, .21, .18, .012).rotation.z = .24;
      }
      templates.set(kind, model);
    }
    return templates.get(kind).clone();
  }
  function syncObjects(data, time) {
    const active = new Set(data.objects);
    for (const [object, mesh] of objects) {
      if (active.has(object) && !object.used) continue;
      mesh.removeFromParent();
      pools.get(mesh.userData.poolKey).push(mesh);
      objects.delete(object);
    }
    for (const object of active) {
      const offset = data === previewRoute ? object.z : approachOffset(object, data.distance);
      if (object.used || offset > 85) continue;
      let mesh = objects.get(object);
      if (!mesh) {
        const variant = Math.abs(Math.round(object.z + object.lane * 11)) % 4;
        const key = obstacles[object.kind]?.pace ? object.kind + variant : object.kind;
        if (!pools.has(key)) pools.set(key, []);
        mesh = pools.get(key).pop() || createObject(object.kind, variant);
        mesh.userData.poolKey = key;
        objects.set(object, mesh);
        scene.add(mesh);
      }
      const h = object.kind === 'pollen' ? 1.18 + Math.sin(time * 4 + object.z) * .16 : object.kind === 'branch' ? 1.39 : 0;
      mesh.position.set(object.lane * LANE_WIDTH, h, -offset);
      if (object.kind === 'pollen') mesh.rotation.y = time * 2.2;
      if (mesh.userData.animate) {
        mesh.rotation.y = (data === previewRoute ? -.29 : -.065) + Math.sin(time * 2 + object.lane) * .054;
        mesh.userData.animate(time);
      }
    }
  }

  return { scene, avatar, segments, syncObjects, ready: loadAssets(segments, mats) };
}

export function createRenderer(canvas) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const camera = new T.PerspectiveCamera(59, 1, .12, 210);
  const view = createView();
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  let lookX = 0;
  const aim = new T.Vector3();

  const resize = () => {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    camera.fov = camera.aspect < 0.75 ? 67 : 59;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();

  return {
    ready: view.ready,
    draw(run, preview, time, dt) {
      const narrow = camera.aspect < .78;
      const { avatar, segments, scene, syncObjects } = view;
      const distance = preview ? 0 : run.distance;
      for (const segment of segments) {
        const offset = segment.userData.index * SEGMENT - distance;
        segment.position.z = -(((offset + SEGMENT) % (SEGMENT * SEGMENTS) + SEGMENT * SEGMENTS) % (SEGMENT * SEGMENTS) - SEGMENT);
        segment.visible = segment.position.z > -145 && segment.position.z < 29;
        if (segment.userData.detailedTrees) {
          const detailed = segment.position.z > -50 && segment.position.z < 31;
          segment.userData.detailedTrees.visible = detailed;
          segment.userData.distantTrees.visible = !detailed;
        }
        if (segment.userData.rotor) segment.userData.rotor.rotation.z = time * .42;
      }
      const x = preview ? (narrow ? .72 : 1.30) : run.x;
      const height = preview ? 1.78 : run.height;
      const bob = reducedMotion ? 0 : Math.sin(time * 6) * (preview ? .08 : .035);
      avatar.position.set(x, height + bob, preview ? -.1 : 0);
      avatar.scale.setScalar(preview ? 1.26 : .81);
      avatar.rotation.y = preview ? 1.95 : (run.x - run.lane * LANE_WIDTH) * .12;
      avatar.rotation.z = preview ? .11 : (run.x - run.lane * LANE_WIDTH) * .28;
      avatar.rotation.x = preview ? .12 : (height - 1.12) * -.18;
      avatar.userData.wings.forEach((wing, index) => {
        wing.rotation.z = (index === 0 ? -1 : 1) * (reducedMotion ? .32 : .38 + Math.sin(time * 83) * .57);
      });
      lookX = preview ? (narrow ? .78 : -1.48) : T.MathUtils.lerp(lookX, run.x * .28, Math.min(1, dt * 7));
      if (preview && narrow) {
        camera.position.set(.45, 3.05, 5.2);
        aim.set(.58, .30, -9);
      } else {
        camera.position.set(lookX, preview ? 3.35 : 3.35 + (height - 1.12) * .24, preview ? 5.2 : 5.9);
        aim.set(lookX, preview ? 1.67 : 1.35, -9);
      }
      camera.lookAt(aim);
      syncObjects(preview ? previewRoute : run, time);
      renderer.render(scene, camera);
    },
  };
}

const previewRoute = {
  distance: 0,
  objects: [
    { kind: 'bike', lane: -1, z: 8.1 },
    { kind: 'fatbike', lane: 1, z: 8.7 },
    { kind: 'hay', lane: -1, z: 19 },
    { kind: 'gate', lane: 1, z: 24 },
    { kind: 'cargo', lane: -1, z: 28 },
    { kind: 'bike', lane: 0, z: 29 },
    ...Array.from({ length: 8 }, (_, i) => ({ kind: 'pollen', lane: 0, z: 3.7 + i * 2.2 })),
  ],
};
