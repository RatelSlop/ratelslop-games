import { mkdir, cp } from 'node:fs/promises';
const out = new URL('../../dist/games/ah-gennep/', import.meta.url);
await mkdir(out,{recursive:true});
for(const file of ['index.html','style.css','main.js','world.js','layout.js','engine.js','assets/catalog.json','assets/products','assets/ah-logo.svg','vendor']) await cp(new URL(file,import.meta.url),new URL(file,out),{recursive:true});
console.log('Built AH Gennep → dist/games/ah-gennep');
