// North is -Z. Relative positions follow the user's labelled satellite sketch.
// Distances are game units; the photograph does not establish measured dimensions.
export const footprint = [[-24,-23],[23,-23],[23,-9],[28,-9],[28,1],[23,1],[23,19],[-16,19],[-16,-13],[-24,-13]];
export const mapBounds = {left:-26,top:-27,width:57,height:50};
export const zones = [
 {id:'bloemen',label:'Bloemen',x:-24,z:-23,w:12,d:10,color:'#d6b5df'},
 {id:'ingang',label:'Ingang / uitgang',x:-12,z:-23,w:15,d:10,color:'#c1e6fa'},
 {id:'fruitkoeling',label:'Fruitkoeling',x:3,z:-23,w:6,d:10,color:'#b9dec4'},
 {id:'koelmagazijn',label:'Magazijn · koelingen',x:9,z:-23,w:14,d:10,color:'#c1e6fa'},
 {id:'versplein',label:'Groente en fruit',x:2,z:-12,w:14,d:13,color:'#b9dec4'},
 {id:'vlees',label:'Vlees',x:14,z:-12,w:2,d:13,color:'#a3ceaf'},
 {id:'kassa',label:'Kassa',x:-13,z:-11,w:5,d:5,color:'#f3e7ae'},
 {id:'zelfscan',label:'Zelfscan',x:-8,z:-11,w:7,d:5,color:'#f3e7ae'},
 {id:'vriezers',label:'Vriezers',x:-16,z:-12,w:2.5,d:13,color:'#fff093'},
 {id:'drank',label:'Drank',x:-16,z:1,w:2.5,d:11,color:'#f4bed1'},
 {id:'kruidenierswaren',label:'Overig',x:-12,z:-3,w:13,d:16,color:'#f3e7ae'},
 {id:'zuivel',label:'Zuivel',x:-16,z:15,w:16,d:4,color:'#b9dec4'},
 {id:'bakkerij',label:'Bakkerij',x:3,z:15,w:13,d:4,color:'#d9b595'},
 {id:'kaas',label:'Kaas',x:12,z:5,w:4,d:7,color:'#edb6aa'},
 {id:'magazijn',label:'Magazijn',x:16,z:-13,w:7,d:25,color:'#c1e6fa'},
 {id:'kantoor',label:'Kantoor',x:16,z:12,w:7,d:7,color:'#c1e6fa'},
 {id:'laden',label:'Laad / los',x:23,z:-9,w:5,d:10,color:'#fff093'},
];
export const entrances = {
 outside:{x:-4,z:-23,width:4},
 shop:{x:10,z:-12,width:4},
 checkoutExit:{x:-9,z:-12,width:4},
};
export const locations = {
 ingang:{x:-4,z:-20,yaw:Math.PI,label:'Ingang / uitgang'},
 winkelpoort:{x:10,z:-10,yaw:Math.PI,label:'Winkelingang'},
 bloemen:{x:-17,z:-18,yaw:0,label:'Bloemen'},
 fruitkoeling:{x:6,z:-16,yaw:0,label:'Fruitkoeling'},
 versplein:{x:5.7,z:-5,yaw:Math.PI,label:'Groente & fruit',category:'versplein'},
 vlees:{x:12,z:-2,yaw:-Math.PI/2,label:'Vleeskoeling'},
 kaas:{x:13,z:9,yaw:-Math.PI/2,label:'Kaas',category:'zuivel',stockGroup:'kaas'},
 zuivel:{x:-6,z:16,yaw:Math.PI,label:'Zuivel',category:'zuivel',stockGroup:'zuivel'},
 bakkerij:{x:8,z:16,yaw:Math.PI,label:'Bakkerij & beleg',category:'bakkerij'},
 kruidenierswaren:{x:-7.4,z:3,yaw:Math.PI,label:'Overig',category:'kruidenierswaren',stockGroup:'kruidenierswaren'},
 drank:{x:-13,z:6,yaw:Math.PI/2,label:'Drank',category:'kruidenierswaren',stockGroup:'drank'},
 vriezers:{x:-13,z:-2,yaw:Math.PI/2,label:'Vriezers'},
 kassa:{x:-8.1,z:-9,yaw:Math.PI/2,label:'Bandkassa 1'},
 zelfscan:{x:-2,z:-7,yaw:Math.PI/2,label:'Zelfscancontrole'},
 magazijn:{x:19,z:3,yaw:Math.PI,label:'Magazijn'},
 koelmagazijn:{x:19,z:-17,yaw:0,label:'Magazijn · koelingen'},
 laden:{x:25,z:-2,yaw:0,label:'Laad / los'},
 kantoor:{x:19,z:16,yaw:Math.PI,label:'Kantoor'},
};
export function productZone(p){
 if(p.category==='zuivel')return /mozzarella|zuivelspread/i.test(p.name)?'kaas':'zuivel';
 if(p.category==='kruidenierswaren'&&/ice tea|ginger ale|tonic/i.test(p.name))return 'drank';
 return p.category;
}
export function insideFootprint(x,z){let inside=false;for(let i=0,j=footprint.length-1;i<footprint.length;j=i++){
 const [xi,zi]=footprint[i],[xj,zj]=footprint[j];
 if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;
 }return inside;}
// Shared by scene collision and geometric route checks.
export function wallSegments(){
 const walls=[];
 const segment=(a,b,kind='outside')=>walls.push({a,b,kind});
 for(let i=0;i<footprint.length;i++){
  const a=footprint[i],b=footprint[(i+1)%footprint.length];
  if(i===0){const e=entrances.outside;segment(a,[e.x-e.width/2,e.z],'facade');segment([e.x+e.width/2,e.z],b,'facade');}
  else segment(a,b);
 }
 // Retail entrance is east/right of the fruit cooler. Checkouts have a separate exit.
 segment([-16,-12],[-11,-12],'glass');segment([-7,-12],[8,-12],'glass');segment([12,-12],[16,-12],'glass');
 // Warehouse corridor, cold warehouse, office and loading bay, with real openings.
 segment([16,-23],[16,-4],'partition');segment([16,-1],[16,10],'partition');segment([16,12],[16,19],'partition');
 segment([9,-23],[9,-15],'partition');
 segment([9,-13],[18,-13],'partition');segment([21,-13],[23,-13],'partition');
 segment([16,12],[18,12],'partition');segment([21,12],[23,12],'partition');
 segment([23,-9],[23,-6],'partition');segment([23,-3],[23,1],'partition');
 return walls;
}
export function wallObstacle({a,b}){return {x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,w:Math.abs(a[0]-b[0])||.16,d:Math.abs(a[1]-b[1])||.16};}
export function canStand(x,z,obstacles,radius=.28){
 if(![[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]].every(([dx,dz])=>insideFootprint(x+dx,z+dz)))return false;
 return !obstacles.some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius);
}
export function rackPlacements(products){
 const racks=[];
 products.filter(p=>productZone(p)==='bakkerij').forEach((p,i)=>racks.push({p,x:4+i*1.8,z:18.25,rotation:Math.PI,style:'bread'}));
 products.filter(p=>productZone(p)==='drank').forEach((p,i)=>racks.push({p,x:-15.3,z:3+i*3,rotation:Math.PI/2,style:'drinks'}));
 const dry=products.filter(p=>productZone(p)==='kruidenierswaren');
 for(const x of [-10,-5,0])for(let j=0;j<6;j++)for(const side of [-1,1])racks.push({p:dry[j%dry.length],x:x+side*.46,z:-1+j*2.1,rotation:side>0?Math.PI/2:-Math.PI/2,style:'ambient'});
 products.filter(p=>productZone(p)==='versplein').forEach((p,i)=>racks.push({p,x:3.5+(i%3)*2,z:-9+Math.floor(i/3)*6,rotation:0,style:'produce'}));
 return racks;
}
export function coolingFixtures(products){
 const fixtures=[
  {kind:'fruit',x:6,z:-21.9,rotation:0,zone:'fruitkoeling',length:4.8},
  ...[-10,-7,-4,-1].map(z=>({kind:'freezer',x:-15.35,z,rotation:Math.PI/2,zone:'vriezers',length:2.8})),
  ...[-10,-7,-4,-1].map(z=>({kind:'meat',x:15.35,z,rotation:-Math.PI/2,zone:'vlees',length:2.8})),
 ];
 const milk=products.filter(p=>productZone(p)==='zuivel');
 milk.forEach((p,i)=>fixtures.push({kind:'dairy',x:-13+i*3.5,z:18.35,rotation:Math.PI,zone:'zuivel',length:3.3,product:p}));
 const cheese=products.filter(p=>productZone(p)==='kaas');
 cheese.forEach((p,i)=>fixtures.push({kind:'cheese',x:15.35,z:6.5+i*3.3,rotation:-Math.PI/2,zone:'kaas',length:2.8,product:p}));
 return fixtures;
}
export function mapSvg(position){
 const b=mapBounds;
 const rooms=zones.map(r=>{
  const narrow=r.w<r.d*.4,rotate=narrow?` transform="rotate(90 ${r.x+r.w/2} ${r.z+r.d/2})"`:'';
  return `<g><rect x="${r.x}" y="${r.z}" width="${r.w}" height="${r.d}" rx=".18" fill="${r.color}" stroke="#fff" stroke-width=".16"/><text x="${r.x+r.w/2}" y="${r.z+r.d/2}"${rotate}>${r.label}</text></g>`;
 }).join('');
 return `<svg class="store-map-svg" viewBox="${b.left} ${b.top} ${b.width} ${b.height}" role="img" aria-label="Winkelplattegrond naar de aangeleverde satellietschets. Noord boven, ingang in de noordgevel, winkelingang rechts van de fruitkoeling."><title>Indeling Albert Heijn Gennep</title><text class="north-arrow" x="-24" y="-25">↑ NOORD · WILHELMINAPLEIN</text><polygon points="${footprint.map(p=>p.join(',')).join(' ')}" fill="#e0e7e8" stroke="#73939c" stroke-width=".25"/>${rooms}<path d="M -4 -23 L -4 -14.5 L 10 -14.5 L 10 -10" class="entry-route"/><text x="9.8" y="-11.3" class="entry-label">↓ IN</text><path d="M -9 -10 L -9 -13" class="exit-route"/><circle class="player-pin" cx="${position.x}" cy="${position.z}" r=".65"/><text x="${position.x}" y="${position.z-1.2}" class="player-label">JIJ</text></svg>`;
}
