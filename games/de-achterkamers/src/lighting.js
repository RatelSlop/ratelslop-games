import {Color} from 'three';
import {LENGTH, TILE_SIZE} from './layout.js';
import model from './model-data.js';

// The original fixture pattern repeats with each ceiling section.
const firstSection = model.lights.filter(([x,,z]) => x < TILE_SIZE && z < TILE_SIZE);
const rows = [...new Set(firstSection.map(([, ,z]) => z))].sort((a,b) => a-b);
const columnSpacing = Math.min(...firstSection.map(([x]) => x));
const columnsPerSection = Math.round(TILE_SIZE / columnSpacing);
const sectionCount = LENGTH / TILE_SIZE;
const lampHeight = firstSection[0][1] - .16;

const lampShader = `
varying vec3 vLampSurface;
uniform vec3 ceilingLightColor;
const float ceilingTileSize = ${TILE_SIZE.toFixed(5)};
const float ceilingColumnSpacing = ceilingTileSize / ${columnsPerSection}.0;
const int ceilingRowCount = ${rows.length};
const float ceilingRows[ceilingRowCount] = float[](${rows.map(z => z.toFixed(5)).join(', ')});

float ceilingIllumination(vec3 worldNormal) {
  float column = floor(vLampSurface.x / ceilingColumnSpacing + .5);
  float row = floor(vLampSurface.z / (ceilingTileSize / float(ceilingRowCount)));
  float brightness = 0.0;
  for (int x = -1; x <= 1; ++x) {
    float c = column + float(x);
    // The original section has no fixtures on its outermost grid line.
    if (c <= 0.0 || c >= ${columnsPerSection * sectionCount}.0 || mod(c, ${columnsPerSection}.0) == 0.0) continue;
    for (int z = -2; z <= 2; ++z) {
      float r = row + float(z);
      if (r < 0.0 || r >= ${rows.length * sectionCount}.0) continue;
      float section = floor(r / float(ceilingRowCount));
      float lampZ = section * ceilingTileSize + ceilingRows[int(mod(r, float(ceilingRowCount)))];
      vec3 ray = vec3(c * ceilingColumnSpacing, ${lampHeight.toFixed(5)}, lampZ) - vLampSurface;
      float distanceSquared = dot(ray, ray);
      float facing = max(0.0, dot(worldNormal, ray) * inversesqrt(max(distanceSquared, .01)));
      float falloff = 1.0 - smoothstep(12.0, 20.25, distanceSquared);
      brightness += facing * falloff / (distanceSquared + 1.15);
    }
  }
  return brightness;
}
`;

export function createCeilingLighting() {
  const litMaterials = new WeakSet();
  const panels = new Set();
  const light = {value: new Color()};

  function illuminate(material) {
    if (!material.isMeshStandardMaterial || litMaterials.has(material)) return;
    litMaterials.add(material);
    const compile = material.onBeforeCompile;
    const cacheKey = material.customProgramCacheKey();
    material.customProgramCacheKey = () => cacheKey + ':ceiling-lights';
    material.onBeforeCompile = (shader, renderer) => {
      compile.call(material, shader, renderer);
      shader.uniforms.ceilingLightColor = light;
      shader.vertexShader = 'varying vec3 vLampSurface;\n' + shader.vertexShader.replace(
        '#include <project_vertex>', `
        vec4 lampSurface = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          lampSurface = instanceMatrix * lampSurface;
        #endif
        vLampSurface = (modelMatrix * lampSurface).xyz;
        #include <project_vertex>`
      );
      shader.fragmentShader = lampShader + shader.fragmentShader.replace(
        '#include <lights_fragment_end>', `
        if (dot(ceilingLightColor, ceilingLightColor) > 0.0) {
          vec3 worldNormal = transformNormalByInverseViewMatrix(normal, viewMatrix);
          irradiance += ceilingLightColor * ceilingIllumination(worldNormal);
        }
        #include <lights_fragment_end>`
      );
    };
  }

  function setMode(mode) {
    const blackout = mode === 'blackout';
    const emergency = mode === 'escape';
    light.value.set(emergency ? '#ff513f' : '#fff0c0').multiplyScalar(blackout ? 0 : 8);
    for (const material of panels) {
      material.emissive.set(emergency ? '#ff263a' : '#fff1bf');
      material.emissiveIntensity = blackout ? 0 : 2;
    }
  }

  setMode('normal');
  return {illuminate, panels, setMode};
}
