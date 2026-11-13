const grain = `
varying vec3 vSurfacePosition;
float surfaceHash(vec3 p) {
 return fract(sin(dot(p, vec3(17.71, 113.2, 57.43))) * 43758.5453);
}
float surfaceNoise(vec3 p) {
 vec3 i = floor(p), f = fract(p);
 f = f*f*(3.0-2.0*f);
 return mix(mix(mix(surfaceHash(i),surfaceHash(i+vec3(1,0,0)),f.x),
                mix(surfaceHash(i+vec3(0,1,0)),surfaceHash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(surfaceHash(i+vec3(0,0,1)),surfaceHash(i+vec3(1,0,1)),f.x),
                mix(surfaceHash(i+vec3(0,1,1)),surfaceHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
`;

export function addSurfaceWear(material, type) {
 if (material.userData.surfaceWear) return;
 material.userData.surfaceWear = type;
 const treatments = {
  floor: 'float wear = mix(.73, 1.04, stain) * mix(.91,1.05,grain);',
  wall: 'float wear = mix(.79, 1.06, stain) * mix(.94,1.03,grain) * mix(.68,1.,smoothstep(.04,.58,vSurfacePosition.y));',
 };
 material.onBeforeCompile = shader => {
  shader.vertexShader = 'varying vec3 vSurfacePosition;\n' + shader.vertexShader.replace('#include <project_vertex>', `
   vec4 surfacePosition = vec4(transformed, 1.0);
   #ifdef USE_INSTANCING
    surfacePosition = instanceMatrix * surfacePosition;
   #endif
   vSurfacePosition = (modelMatrix * surfacePosition).xyz;
   #include <project_vertex>
  `);
  shader.fragmentShader = grain + shader.fragmentShader.replace('#include <color_fragment>', `
   #include <color_fragment>
   float stain = surfaceNoise(vSurfacePosition * vec3(.85, .52, .85));
   float grain = surfaceHash(floor(vSurfacePosition * 176.));
   ${treatments[type]}
   diffuseColor.rgb *= wear;
  `);
 };
 material.customProgramCacheKey = () => 'surface-wear-' + type;
}
