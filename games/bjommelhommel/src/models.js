import * as T from 'three';

export const standard = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: 0.84, ...extra });
const sphere = new T.SphereGeometry(1, 24, 16);
const block = new T.BoxGeometry(1, 1, 1);
const cylinder = new T.CylinderGeometry(1, 1, 1, 12);
const up = new T.Vector3(0, 1, 0);
const point = (x, y, z) => new T.Vector3(x, y, z);

export function piece(parent, geometry, material, x, y, z, sx = 1, sy = sx, sz = sx) {
  const mesh = new T.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  parent.add(mesh);
  return mesh;
}

export const ball = (parent, material, x, y, z, sx, sy, sz) => piece(parent, sphere, material, x, y, z, sx, sy, sz);
export const box = (parent, material, x, y, z, sx, sy, sz) => piece(parent, block, material, x, y, z, sx, sy, sz);

export function rod(parent, material, start, end, radius, endRadius = radius) {
  const a = point(...start);
  const b = point(...end);
  const mid = a.clone().lerp(b, 0.5);
  const geometry = radius === endRadius ? cylinder : new T.CylinderGeometry(endRadius / radius, 1, 1, 9);
  const mesh = piece(parent, geometry, material, mid.x, mid.y, mid.z, radius, a.distanceTo(b), radius);
  mesh.quaternion.setFromUnitVectors(up, b.sub(a).normalize());
  return mesh;
}

export function rng(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function bee() {
  const model = new T.Group();
  const gold = standard(0xffbd23);
  const dark = standard(0x211b12);
  const pale = standard(0xeee4bd);
  const glass = new T.MeshPhysicalMaterial({
    color: 0xd9f7ff, roughness: 0.22, metalness: 0.08, transparent: true,
    opacity: 0.53, side: T.DoubleSide, depthWrite: false,
  });
  const abdomen = new T.SphereGeometry(1, 36, 28);
  const coords = abdomen.attributes.position;
  const colors = [];
  const bandColor = z => z > 0.72 ? pale.color : (z > 0.32 || (z > -0.41 && z < -0.07)) ? dark.color : gold.color;
  for (let i = 0; i < coords.count; i++) bandColor(coords.getZ(i)).toArray(colors, i * 3);
  abdomen.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  piece(model, abdomen, standard(0xffffff, { vertexColors: true }), 0, 0, 0.27, 0.48, 0.43, 0.68);
  ball(model, gold, 0, 0.025, -0.24, 0.43, 0.43, 0.43);
  ball(model, dark, 0, 0.07, -0.56, 0.34, 0.31, 0.29);
  const eye = standard(0x161919, { roughness: 0.19 });
  const wings = [];
  for (const sign of [-1, 1]) {
    ball(model, eye, sign * 0.25, 0.14, -0.67, 0.115, 0.163, 0.14);
    rod(model, dark, [sign * 0.14, 0.29, -0.65], [sign * 0.23, 0.56, -0.84], 0.026, 0.015);
    ball(model, dark, sign * 0.23, 0.56, -0.84, 0.04);
    const joint = new T.Group();
    joint.position.set(sign * 0.19, 0.27, -0.2);
    model.add(joint);
    const wing = ball(joint, glass, sign * 0.48, 0, 0.22, 0.65, 0.025, 0.23);
    wing.rotation.y = -sign * 0.44;
    {
      const vein = new T.MeshBasicMaterial({ color: 0xd1bb93, transparent: true, opacity: 0.55 });
      rod(joint, vein, [0, .01, 0], [sign * 0.99, .01, 0.41], 0.012, 0.004);
      rod(joint, vein, [sign * 0.24, .015, .12], [sign * .64, .015, .45], 0.009, 0.004);
    }
    wings.push(joint);
    for (let i = 0; i < 3; i++) {
      const z = -0.43 + i * 0.23;
      rod(model, dark, [sign * 0.23, -0.15, z], [sign * (0.40 + i * 0.035), -0.34, z + 0.17], 0.033, 0.018);
    }
  }
  {
    const random = rng(741);
    const hair = new T.InstancedMesh(new T.ConeGeometry(.012, .105, 3), standard(0xffffff), 1700);
    const matrix = new T.Matrix4();
    const rotation = new T.Quaternion();
    const normal = new T.Vector3();
    for (let i = 0; i < hair.count; i++) {
      const y = 2 * random() - 1;
      const theta = random() * Math.PI * 2;
      const radial = Math.sqrt(1 - y * y);
      normal.set(Math.cos(theta) * radial, y, Math.sin(theta) * radial);
      const length = .45 + random() * .8;
      const position = point(normal.x * .48, y * .43, normal.z * .68 + .27).addScaledVector(normal, .025);
      rotation.setFromUnitVectors(up, normal);
      matrix.compose(position, rotation, point(1, length, 1));
      hair.setMatrixAt(i, matrix);
      hair.setColorAt(i, bandColor(normal.z).clone().lerp(pale.color, random() * .21));
    }
    model.add(hair);
  }
  model.userData.wings = wings;
  return model;
}

const bikePaint = [0xc84230, 0x548685, 0xe3c061, 0x689e52];
export function cyclist(kind, variant) {
  const fat = kind === 'fatbike';
  const cargo = kind === 'cargo';
  const model = new T.Group();
  const paint = standard(fat ? [0x303838, 0x303838, 0x563a2e, 0x434b3a][variant] : bikePaint[variant], { metalness: 0.35 });
  const rubber = standard(0x1c201d);
  const metal = standard(0xa9a9a0, { metalness: 0.63, roughness: 0.34 });
  const cloth = standard([0xe3a54b, 0x436d80, 0x853a54, 0x749b4e][variant]);
  const trousers = standard(0x2d3b43);
  const skin = standard([0xe7ad78, 0xb8744e, 0xcf976f, 0x8c563e][variant]);
  const seam = standard([0xa96131, 0x274858, 0x4e2436, 0x426133][variant]);
  const lens = standard(0x172b32, { roughness: .12, metalness: .38 });
  const helmet = standard([0xefe6ca, 0x273538, 0xb74b35, 0xe5ad48][variant]);
  const tire = fat ? 0.112 : 0.035;
  const radius = fat ? 0.34 : 0.38;
  const wheelY = radius + tire;
  const wheels = [];
  const frontZ = cargo ? 1.22 : .72;
  for (const z of [-.70, frontZ]) {
    const wheel = new T.Group();
    wheel.position.set(0, wheelY, z);
    model.add(wheel);
    const ring = piece(wheel, new T.TorusGeometry(radius, tire, 12, 44), rubber, 0, 0, 0);
    ring.rotation.y = Math.PI / 2;
    const rim = piece(wheel, new T.TorusGeometry(radius - 0.027, 0.015, 6, 25), metal, 0, 0, 0);
    rim.rotation.y = Math.PI / 2;
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI * 2 / 16;
      rod(wheel, metal, [0, 0, 0], [0, Math.cos(angle) * radius, Math.sin(angle) * radius], .0075);
    }
    rod(wheel, metal, [-.094, 0, 0], [.094, 0, 0], .044);
    const disk = piece(wheel, new T.CylinderGeometry(.096, .096, .018, 24), metal, .079, 0, 0);
    disk.rotation.z = Math.PI / 2;
    if (fat) {
      const tread = new T.InstancedMesh(new T.BoxGeometry(.07, .023, .062), rubber, 36);
      const stamp = new T.Object3D();
      for (let i = 0; i < tread.count; i++) {
        const angle = i * Math.PI * 2 / tread.count;
        stamp.position.set((i % 2 ? 1 : -1) * .05, Math.cos(angle) * (radius + tire - .004), Math.sin(angle) * (radius + tire - .004));
        stamp.rotation.x = angle;
        stamp.updateMatrix();
        tread.setMatrixAt(i, stamp.matrix);
      }
      wheel.add(tread);
    }
    wheels.push(wheel);
  }
  const rear = [0, wheelY, -0.7], front = [0, wheelY, frontZ], crank = [0, 0.54, -0.11];
  const seat = [0, fat ? 0.98 : 1.13, -0.40], stem = [0, 1.19, 0.52];
  for (const [a, b] of [[rear, crank], [rear, seat], [crank, seat], [crank, stem], [seat, stem]]) {
    rod(model, paint, a, b, fat ? 0.068 : 0.035);
  }
  for (const sign of [-1, 1]) {
    rod(model, metal, [sign * 0.10, front[1], front[2]], [sign * 0.067, stem[1], stem[2]], fat ? 0.036 : 0.024);
  }
  if (!fat) {
    const fender = new T.TorusGeometry(radius + tire + .035, .022, 7, 28, Math.PI * 1.06);
    for (const z of [-.70, frontZ]) {
      const guard = piece(model, fender, paint, 0, wheelY, z, 1, 1, 2.05);
      guard.rotation.y = Math.PI / 2;
    }
    ball(model, standard(0xffeab8, { emissive: 0x6a461a, emissiveIntensity: .7 }), 0, .98, .64, .053, .062, .052);
  }
  if (cargo) {
    const crate = standard(0x87623a);
    box(model, crate, 0, .60, .84, .66, .10, .84);
    for (const sign of [-1, 1]) {
      box(model, crate, sign * .32, .78, .84, .055, .36, .84);
      box(model, crate, 0, .78, .84 + sign * .39, .67, .36, .055);
    }
    box(model, standard(0xb9a17b), .04, .78, .85, .39, .28, .49);
  }
  rod(model, rubber, [-0.29, 1.22, 0.56], [0.29, 1.22, 0.56], 0.037);
  box(model, rubber, 0, seat[1], seat[2], fat ? 0.27 : 0.16, 0.08, fat ? 0.61 : 0.27);
  if (fat) {
    box(model, paint, 0, 0.74, 0.02, 0.18, 0.18, 0.53).rotation.x = -0.49;
    ball(model, standard(0xffefb8, { emissive: 0xc9aa4e, emissiveIntensity: 0.47 }), 0, 1.11, 0.66, 0.105, 0.076, 0.06);
  }
  ball(model, trousers, 0, seat[1] + .12, -.36, .225, .19, .18);
  const jacket = new T.Group();
  jacket.position.set(0, 1.45, -.08);
  jacket.rotation.x = .49;
  model.add(jacket);
  ball(jacket, cloth, 0, 0, 0, .255, .35, .177);
  ball(jacket, cloth, 0, .17, .01, .279, .154, .164);
  ball(jacket, seam, 0, -.25, .003, .205, .075, .153);
  rod(jacket, seam, [0, -.26, .14], [0, .265, .146], .012);
  for (const sign of [-1, 1]) {
    rod(jacket, seam, [sign * .07, -.20, .163], [sign * .18, -.105, .14], .013);
    const strap = ball(jacket, seam, sign * .175, .06, .131, .026, .257, .045);
    strap.rotation.z = sign * -.12;
  }
  if (variant % 2 === 0) {
    ball(jacket, seam, 0, .02, -.205, .203, .259, .105);
    ball(jacket, cloth, 0, -.055, -.289, .155, .13, .043);
  }

  rod(model, skin, [0, 1.65, .06], [0, 1.83, .132], .074);
  ball(model, skin, 0, 1.90, .139, .139, .158, .135);
  ball(model, skin, 0, 1.83, .18, .106, .095, .105);
  ball(model, skin, 0, 1.891, .273, .032, .041, .042);
  rod(model, seam, [-.034, 1.817, .264], [.034, 1.817, .264], .008);
  ball(model, helmet, 0, 2.017, .132, .172, .098, .176);
  ball(model, helmet, 0, 1.989, .248, .141, .029, .089);
  for (const sign of [-1, 1]) {
    ball(model, skin, sign * .136, 1.885, .133, .025, .047, .025);
    ball(model, lens, sign * .056, 1.936, .254, .053, .031, .027);
    rod(model, rubber, [sign * .135, 1.999, .13], [sign * .086, 1.806, .167], .009);
    for (let i = 0; i < 2; i++) {
      const vent = ball(model, rubber, sign * (.055 + i * .048), 2.098 - i * .018, .134, .016, .014, .064);
      vent.rotation.x = -.2;
    }
  }
  rod(model, lens, [-.062, 1.941, .27], [.062, 1.941, .27], .009);
  const crankArms = [];
  const legs = [];
  for (const sign of [-1, 1]) {
    const shoulder = [sign * .208, 1.645, .002];
    const elbow = [sign * .285, 1.41, .276];
    const grip = [sign * .245, 1.237, .54];
    ball(model, cloth, ...shoulder, .096, .109, .106);
    rod(model, cloth, shoulder, elbow, .077, .062);
    rod(model, variant % 2 ? cloth : skin, elbow, grip, .061, .039);
    ball(model, seam, grip[0], grip[1] + .025, grip[2] - .025, .05, .058, .048);
    ball(model, skin, ...grip, .043, .049, .059);
    rod(model, metal, [sign * .25, 1.24, .56], [sign * .19, 1.24, .60], .012);
    crankArms.push(piece(model, cylinder, metal, 0, 0, 0));
    legs.push({
      sign,
      upper: piece(model, sphere, trousers, 0, 0, 0),
      lower: piece(model, sphere, trousers, 0, 0, 0),
      shoe: ball(model, rubber, 0, 0, 0, .083, .058, .145),
      hip: point(sign * .135, seat[1] + .10, -.34),
    });
  }
  model.userData.animate = time => {
    for (const wheel of wheels) wheel.rotation.x = time * 12;
    for (const [index, leg] of legs.entries()) {
      const angle = time * 7 + (leg.sign === 1 ? Math.PI : 0);
      const foot = point(leg.sign * .16, .52 + Math.sin(angle) * .14, -.11 + Math.cos(angle) * .15);
      const knee = point(leg.sign * .17, (leg.hip.y + foot.y) / 2 + .13, .21 + Math.cos(angle) * .07);
      for (const [part, a, b, width] of [[leg.upper, leg.hip, knee, .088], [leg.lower, knee, foot, .068]]) {
        part.position.copy(a).lerp(b, .5);
        part.scale.set(width, a.distanceTo(b) * .64, width);
        part.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
      }
      leg.shoe.position.copy(foot).z += .045;
      const pedal = crankArms[index];
      const pivot = point(foot.x, .54, -.11);
      pedal.position.copy(pivot).lerp(foot, .5);
      pedal.scale.set(.021, pivot.distanceTo(foot), .021);
      pedal.quaternion.setFromUnitVectors(up, foot.clone().sub(pivot).normalize());
    }
  };
  return model;
}
