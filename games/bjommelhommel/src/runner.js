export const LANE_WIDTH = 2.15;
const lanes = [-1, 0, 1];
const rowDistance = 24;
export const obstacles = {
  bike: { name: 'een fietser', pace: 1.32, width: .69, above: 2.35 },
  fatbike: { name: 'een fatbike', pace: 1.46, width: .83, above: 2.35 },
  cargo: { name: 'een bakfiets', pace: 1.25, width: .9, above: 2.35 },
  branch: { name: 'een overhangende tak', width: .76, below: .58 },
  barrier: { name: 'een wegversperring', width: .79, above: 1.5 },
  hay: { name: 'een hooibaal', width: .8, above: 1.62 },
  bollards: { name: 'fietspaaltjes', width: .74, above: 1.59 },
  gate: { name: 'een slagboom', width: .82, below: .57, above: 2.2 },
};

const opening = ['bike', 'fatbike', 'hay', 'branch', 'cargo', 'bollards', 'gate', 'barrier'];
const hazardMix = ['bike', 'bike', 'fatbike', 'cargo', 'branch', 'barrier', 'hay', 'bollards', 'gate'];

export function approachOffset(object, distance) {
  const offset = object.z - distance;
  return offset * (obstacles[object.kind]?.pace ?? 1);
}

export function createRun(random = Math.random) {
  return {
    random, distance: 0, pollen: 0, time: 0, speed: 12,
    lane: 0, x: 0, height: 1.12, motion: null, nextRow: 36, row: 0,
    objects: [], passed: 0, ended: false, impact: null,
  };
}

export function steer(run, action) {
  if (run.ended) return;
  if (action === 'left') run.lane = Math.max(-1, run.lane - 1);
  if (action === 'right') run.lane = Math.min(1, run.lane + 1);
  if ((action === 'rise' || action === 'dive') && !run.motion) {
    run.motion = { kind: action, time: 0, duration: action === 'rise' ? 0.94 : 0.72 };
  }
}

function spawnRow(run) {
  const { random, nextRow, row } = run;
  const safeLane = row < 2 ? 0 : lanes[Math.floor(random() * lanes.length)];
  const double = row > 3 && random() < Math.min(0.72, 0.33 + row * 0.015);
  const hazards = lanes.filter(lane => lane !== safeLane);
  if (!double) hazards.splice(row === 0 ? 1 : row === 1 ? 0 : random() < 0.5 ? 0 : 1, 1);

  for (const lane of hazards) {
    const kind = opening[row] ?? hazardMix[Math.floor(random() * hazardMix.length)];
    run.objects.push({ kind, lane, z: nextRow });
  }
  for (let i = 0; i < 5; i++) {
    run.objects.push({ kind: 'pollen', lane: safeLane, z: nextRow - 13 + i * 2.1 });
  }
  run.row++;
  run.nextRow += rowDistance + random() * 5;
}

export function step(run, dt) {
  if (run.ended) return;
  run.time += dt;
  run.speed = Math.min(25, 12 + run.distance / 116);
  run.distance += run.speed * dt;
  const goal = run.lane * LANE_WIDTH;
  run.x += (goal - run.x) * Math.min(1, dt * 13);
  if (run.motion) {
    const motion = run.motion;
    motion.time += dt;
    const progress = Math.min(1, motion.time / motion.duration);
    const lift = Math.sin(progress * Math.PI) ** 0.72;
    run.height = 1.12 + lift * (motion.kind === 'rise' ? 1.94 : -0.88);
    if (progress === 1) run.motion = null;
  } else {
    run.height = 1.12 + Math.sin(run.time * 7) * 0.055;
  }

  while (run.nextRow < run.distance + 86) spawnRow(run);

  for (const object of run.objects) {
    if (object.used) continue;
    const offset = approachOffset(object, run.distance);
    if (offset < -2.5) {
      object.used = true;
      if (object.kind !== 'pollen') run.passed++;
      continue;
    }
    const hazard = obstacles[object.kind];
    const depth = object.kind === 'cargo' ? 1.56 : 1.32;
    if (Math.abs(offset) > depth || Math.abs(object.lane * LANE_WIDTH - run.x) > (hazard?.width ?? .69)) continue;
    if (object.kind === 'pollen') {
      if (Math.abs(run.height - 1.2) < 0.73) {
        object.used = true;
        run.pollen++;
      }
      continue;
    }
    const clears = run.height < hazard.below || run.height > hazard.above;
    if (!clears) {
      run.impact = object.kind;
      run.ended = true;
      return;
    }
  }
  run.objects = run.objects.filter(object => !object.used);
}
