// Public HTML only; no private endpoints, credentials or runtime scraping.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const source = new URL('assets/catalog-source.html', root);
const html = await readFile(source, 'utf8');
const decode = s => s.replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"');
const all = [];
for (const card of html.split('data-testid="product-card-vertical-container"').slice(1)) {
  const url = card.match(/href="(\/producten\/product\/[^\"]+)"/)?.[1];
  const label = decode(card.match(/aria-label="([^\"]+)"/)?.[1] || '');
  const img = card.match(/<img[^>]+src="([^\"]+)"/)?.[1];
  const name = decode(card.match(/<img alt="([^\"]+)"/)?.[1] || '');
  const price = label.match(/€([\d.]+)/)?.[1];
  const unit = label.match(/, ([^,€]+) €/)?.[1];
  if (url && img && name && price && !all.some(p => p.url.endsWith(url))) all.push({ name, price: Math.round(Number(price) * 100), unit, url: 'https://www.ah.nl' + url, remoteImage: decode(img) });
}
if (!all.length) throw Error('AH page format changed; retain existing catalog.');
console.log(all.map(p => `${p.name} | ${p.price} | ${p.unit}`).join('\n'));
await writeFile(new URL('research/catalog-extracted.json',root), JSON.stringify(all,null,2));
const groups={zuivel:['AH Mozzarella','AH Zuivelspread naturel','De Zaanse Hoeve Roeryoghurt naturel','De Zaanse Hoeve Vanille vla','AH Houdbare halfvolle melk 6-pack','AH Opschuimmelk'],kruidenierswaren:['AH Ice tea green zero zonder koolzuur','AH Ginger ale','AH Kokosmelk','AH Rozijnen zongedroogd','AH Tarwebloem','AH Tonic regular'],bakkerij:['AH Kaiserbroodjes','AH Witte pistolets','AH Ciabatta','AH Fries roggebrood kuipje','AH Terra Plantaardig 100% pindakaas naturel','AH Honing'],versplein:['AH Mandarijnen','AH Bananen tros','AH Pitloze witte druiven','AH Ananasstukjes op sap','AH Knijpfruit appel banaan','AH Appelmoes 0% suiker toegevoegd 4-pack']};
const selected = [];
for(const [category,names] of Object.entries(groups)) {
  for(const name of names){const p=all.find(p=>p.name===name);if(!p)throw Error('Missing product: '+name);selected.push({...p,category});}
}
await mkdir(new URL('assets/products/',root),{recursive:true});
for (const [i,p] of selected.entries()) {
  p.id = p.url.split('/').at(-2); p.image = `assets/products/${p.id}.webp`;
  const res = await fetch(p.remoteImage); if(!res.ok) throw Error(`${p.name}: ${res.status}`);
  await writeFile(new URL(p.image,root),new Uint8Array(await res.arrayBuffer()));
  p.color = ['#2ba1dc','#e1ba69','#4f9f70','#db7253','#6993c2','#ce5368'][i%6];
}
const logoStart=html.indexOf('<svg',html.indexOf('data-testid="nav-logo"'));
let logo=html.slice(logoStart,html.indexOf('</svg>',logoStart)+6);
logo=logo.slice(0,logo.indexOf('<g class="mBYlAG_dark"'))+'</svg>';
if(!logo.includes('viewBox'))throw Error('Logo not found');
await writeFile(new URL('assets/ah-logo.svg',root),logo);
await writeFile(new URL('assets/catalog.json',root),JSON.stringify({source:'https://www.ah.nl/shop/prijsfavorieten',fetchedAt:new Date().toISOString(),pricing:'Momentopname ah.nl; spelprijzen, geen garantie voor vestiging Gennep.',products:selected},null,2)+'\n');
console.log(`Imported ${selected.length} products with local packaging images.`);
