import { mkdtemp, cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), 'ratelslop-games-'));
const games = [
  { repo: 'BouncyKoen', folder: 'bouncykoen', source: 'docs' },
  { repo: 'Concierge-dienst', folder: 'conciergedienst', files: ['index.html', 'assets'] },
  { repo: 'UAVPilot', folder: 'uavpilot', source: 'dist', build: true },
];
const revisions = {};
try {
  for (const game of games) {
    const checkout = join(scratch, game.folder);
    execFileSync('git', ['clone', '--depth', '1', '--branch', 'main', `https://github.com/RatelSlop/${game.repo}.git`, checkout], { stdio: 'inherit' });
    revisions[game.repo] = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: checkout, encoding: 'utf8' }).trim();
    if (game.build) {
      const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      execFileSync(npm, ['ci'], { cwd: checkout, stdio: 'inherit', shell: process.platform === 'win32' });
      execFileSync(npm, ['run', 'build'], { cwd: checkout, stdio: 'inherit', shell: process.platform === 'win32' });
    }
    const target = resolve(root, 'dist', 'games', game.folder);
    const gamesRoot = resolve(root, 'dist', 'games');
    if (!target.startsWith(gamesRoot + (process.platform === 'win32' ? '\\' : '/'))) throw new Error('Invalid game destination');
    await rm(target, { recursive: true, force: true });
    await mkdir(target, { recursive: true });
    if (game.files) {
      for (const file of game.files) await cp(join(checkout, file), join(target, file), { recursive: true });
    } else {
      await cp(join(checkout, game.source), target, { recursive: true, filter: source => !['CNAME', '.git'].includes(source.split(/[\\/]/).pop()) });
    }
    await readFile(join(target, 'index.html'));
    console.log(`Packaged ${game.repo} at ${revisions[game.repo]}`);
  }
  await writeFile(join(root, 'dist', 'build-info.json'), JSON.stringify({ builtAt: new Date().toISOString(), revisions }, null, 2) + '\n');
} finally {
  // scratch is a newly created directory under the OS temporary directory.
  if (!resolve(scratch).startsWith(resolve(tmpdir()) + (process.platform === 'win32' ? '\\' : '/'))) throw new Error('Invalid scratch directory');
  await rm(scratch, { recursive: true, force: true });
}
