import * as T from 'three';
import { box, piece, rod, standard } from './models.js';

export const SEGMENT = 28;
const names = ['Polderdijk', 'Bloesemgaard', 'Dorp aan de vaart', 'Houten brug'];
export const districtAt = distance => names[Math.floor(distance / (SEGMENT * 3)) % names.length];
const post = new T.CylinderGeometry(.1, .115, 1, 10);
const canopy = new T.IcosahedronGeometry(1, 1);
const roofShape = new T.CylinderGeometry(1, 1, 1, 3, 1, false, Math.PI / 3);
const white = standard(0xe4dfd3);
const glass = standard(0x273e43, { roughness: .22, metalness: .28 });
const shutter = standard(0x315545);
const orange = standard(0xd95724);
const hay = standard(0xb5893e);
const straw = standard(0xd5ad56);
const binding = standard(0x6e5029);

function railing(group, x, mats, height) {
  for (let z = -2; z > -SEGMENT; z -= 4) {
    piece(group, post, mats.plank, x, height / 2, z, 1, height, 1);
  }
  for (const fraction of [.42, .87]) {
    box(group, mats.plank, x, height * fraction, -SEGMENT / 2, .11, .12, SEGMENT);
  }
}

function cottage(group, x, z, mats, index) {
  const house = new T.Group();
  house.position.set(x, 0, z);
  house.rotation.y = .22;
  group.add(house);
  box(house, mats.brick, 0, 1.6, 0, 4.5, 3.2, 3.8);
  const roof = piece(house, roofShape, index % 2 ? mats.roof : mats.tile, 0, 3.56, 0, 3.02, 4, 1.24);
  roof.rotation.x = Math.PI / 2;
  box(house, mats.brick, 1.18, 4.09, -.9, .48, 1.06, .48);
  box(house, mats.roof, 1.18, 4.68, -.9, .56, .14, .55);
  for (const y of [1.32, 2.51]) {
    for (const xx of [-1.35, 1.35]) {
      box(house, white, xx, y, 1.914, .85, .93, .10);
      box(house, glass, xx, y, 1.976, .69, .78, .026);
      box(house, white, xx, y, 1.999, .033, .79, .03);
      box(house, white, xx, y, 1.999, .69, .033, .03);
      box(house, shutter, xx + Math.sign(xx) * .55, y, 1.95, .23, .87, .077);
    }
  }
  box(house, shutter, 0, .88, 1.94, .73, 1.78, .08);
  box(house, glass, 0, 1.29, 1.995, .49, .56, .03);
  house.traverse(mesh => { if (mesh.isMesh) mesh.castShadow = true; });
}

export function dressSegment(group, index, mats, random) {
  const section = districtAt(index * SEGMENT);
  if (section === 'Houten brug') {
    for (let z = -.27; z > -SEGMENT; z -= .57) {
      box(group, mats.plank, 0, .028, z, 6.95, .065, .55);
    }
    for (const sign of [-1, 1]) railing(group, sign * 3.53, mats, 1.09);
  } else if (section === 'Dorp aan de vaart') {
    railing(group, 6.3, mats, .84);
    cottage(group, -7.2, -10, mats, index);
    cottage(group, -12, -22, mats, index + 1);
    for (let z = -4; z > -SEGMENT; z -= 9) {
      rod(group, mats.metal, [4.3, 0, z], [4.3, 2.9, z], .049);
      rod(group, mats.metal, [4.3, 2.9, z], [3.91, 2.98, z], .036);
      box(group, mats.metal, 3.83, 2.97, z, .35, .10, .24);
      box(group, white, 3.83, 2.91, z, .23, .028, .16);
    }
    const boat = new T.Group();
    boat.position.set(10.4, .1, -14);
    group.add(boat);
    piece(boat, new T.SphereGeometry(1, 16, 8), shutter, 0, 0, 0, .82, .29, 2.55);
    box(boat, mats.plank, 0, .24, 0, 1.26, .12, 3.57);
    box(boat, white, 0, .50, -.77, .91, .49, 1.05);
    box(boat, glass, 0, .52, -.225, .72, .26, .025);
  } else if (section === 'Bloesemgaard') {
    railing(group, -4.6, mats, .77);
    for (let z = -3; z > -SEGMENT; z -= 5.5) {
      for (const x of [-7, -11, -15]) {
        rod(group, mats.wood, [x, 0, z], [x, 2.23, z], .10, .06);
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2;
          const bloom = piece(group, canopy, mats.bloom[i % 2], x + Math.cos(a) * .53, 2.07 + random() * .48, z + Math.sin(a) * .53, .72, .64, .71);
          bloom.castShadow = true;
        }
      }
    }
  } else {
    railing(group, 6.3, mats, .8);
    for (const [x, z, angle] of [[-7.2, -5.5, .3], [-11, -18, 1.08]]) {
      const bale = createObstacle('hay', mats);
      bale.position.set(x, 0, z);
      bale.rotation.y = angle;
      group.add(bale);
    }
  }
}

export function createObstacle(kind, mats) {
  const model = new T.Group();
  if (kind === 'hay') {
    const bale = piece(model, new T.CylinderGeometry(.52, .52, 1.33, 24), hay, 0, .52, 0);
    bale.rotation.z = Math.PI / 2;
    for (let i = 0; i < 7; i++) {
      for (const x of [-.672, .672]) {
        const band = piece(model, new T.TorusGeometry(.075 + .066 * i, .009, 4, 24), i % 2 ? straw : binding, x, .52, 0);
        band.rotation.y = Math.PI / 2;
      }
    }
    for (const x of [-.42, .42]) {
      const strap = piece(model, new T.TorusGeometry(.522, .012, 4, 28), binding, x, .52, 0);
      strap.rotation.y = Math.PI / 2;
    }
    const fibers = new T.InstancedMesh(new T.BoxGeometry(.19, .014, .012), straw, 80);
    const pose = new T.Object3D();
    for (let i = 0; i < fibers.count; i++) {
      const a = i * 2.39996;
      pose.position.set(((i * 37) % 79) / 63 - .62, .52 + Math.sin(a) * .523, Math.cos(a) * .523);
      pose.rotation.set(-a, 0, .4 * Math.sin(i));
      pose.updateMatrix();
      fibers.setMatrixAt(i, pose.matrix);
    }
    model.add(fibers);
  } else if (kind === 'bollards') {
    for (const x of [-.51, 0, .51]) {
      piece(model, post, orange, x, .53, 0, 1, 1.03, 1);
      piece(model, post, white, x, .79, 0, 1.015, .15, 1.015);
      piece(model, post, mats.metal, x, .045, 0, 1.55, .09, 1.55);
    }
  } else if (kind === 'gate') {
    box(model, mats.metal, -.97, .69, 0, .15, 1.39, .21);
    box(model, white, .015, 1.33, 0, 1.93, .177, .115);
    for (const x of [-.70, -.27, .16, .59]) box(model, orange, x, 1.33, .061, .21, .18, .015);
  }
  model.traverse(mesh => { if (mesh.isMesh) mesh.castShadow = true; });
  return model;
}
