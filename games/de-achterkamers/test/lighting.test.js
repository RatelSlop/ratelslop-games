import test from 'node:test';
import assert from 'node:assert/strict';
import {MeshStandardMaterial} from 'three';
import {createCeilingLighting} from '../src/lighting.js';
import {TILE_SIZE} from '../src/layout.js';
import model from '../src/model-data.js';

test('the repeating ceiling layout represents every original fixture', () => {
 const sections = new Map();
 for (const [x,,z] of model.lights) {
  const sx = Math.floor(x / TILE_SIZE), sz = Math.floor(z / TILE_SIZE);
  const key = [sx,sz].join(',');
  if (!sections.has(key)) sections.set(key, []);
  sections.get(key).push([x - sx*TILE_SIZE,z - sz*TILE_SIZE]);
 }
 assert.equal(sections.size,16);
 const first = sections.get('0,0');
 assert.equal(first.length,48);
 for (const fixtures of sections.values()) {
  assert.equal(fixtures.length,first.length);
  fixtures.forEach(([x,z],i) => {
   assert.ok(Math.hypot(x-first[i][0],z-first[i][1]) < .0001);
  });
 }
});

test('panels and world-space illumination start lit and follow the match power state', () => {
 const lights = createCeilingLighting();
 const panel = new MeshStandardMaterial(), wall = new MeshStandardMaterial();
 lights.panels.add(panel);
 lights.illuminate(wall);
 const shader = {uniforms:{},vertexShader:'#include <project_vertex>',fragmentShader:'#include <lights_fragment_end>'};
 wall.onBeforeCompile(shader);
 assert.match(shader.vertexShader, /modelMatrix \* lampSurface/);
 assert.match(shader.fragmentShader, /irradiance \+= ceilingLightColor/);
 const color = shader.uniforms.ceilingLightColor.value;
 assert.ok(color.r > 0);
 lights.setMode('normal');
 assert.equal(panel.emissiveIntensity,2);
 lights.setMode('blackout');
 assert.equal(panel.emissiveIntensity,0);
 assert.equal(color.getHex(),0);
 lights.setMode('escape');
 assert.equal(panel.emissive.getHexString(),'ff263a');
 assert.ok(color.r > color.g);
});
