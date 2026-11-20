import { escape, gate, page } from './pages.js';

const day = 86_400_000;
const reviewers = ['dhooij@ratelslop.studio', 'fhorst@ratelslop.studio'];
const cookie = '__Host-ratelslop';
const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2,'0')).join('');
const digest = async value => hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const sql = (env, text, ...args) => env.DB.prepare(text).bind(...args);

export function nextMonth(now) {
 const date = new Date(now);
 const originalDay = date.getUTCDate();
 date.setUTCDate(1);
 date.setUTCMonth(date.getUTCMonth()+1);
 const lastDay = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
 date.setUTCDate(Math.min(originalDay,lastDay));
 return date.getTime();
}

async function sign(env, message) {
 const key = await crypto.subtle.importKey('raw',encoder.encode(env.ACCESS_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(message)));
}

function equal(a,b) {
 if(a?.length!==b.length) return false;
 let diff=0;
 for(let i=0;i<b.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}

const rawCode = async (env,id) => (await sign(env,'code:'+id)).slice(0,24).toUpperCase();

function html(body,status=200) {
 return new Response(body,{status,headers:{
  'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'same-origin',
  'X-Content-Type-Options':'nosniff',
  'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
 }});
}
function redirect(path,session) {
 const headers={Location:path,'Cache-Control':'no-store'};
 if(session) headers['Set-Cookie']=session;
 return new Response(null,{status:303,headers});
}

async function limited(env, key, limit, window) {
 const now=Date.now();
 const row=await sql(env,"INSERT INTO limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<=? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING count",key,now+window,now,now).first();
 return row.count>limit;
}

async function send(env,key,to,subject,body) {
 const result=await fetch('https://api.resend.com/emails',{
  method:'POST',signal:AbortSignal.timeout(15000),
  headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':key},
  body:JSON.stringify({from:env.FROM,to,subject,html:body}),
 });
 if(!result.ok) throw new Error('Resend rejected email');
}

async function sendReview(env,row) {
 const query=new URLSearchParams({id:row.id,token:await sign(env,'review:'+row.id)});
 const url=escape(env.ORIGIN+'/access/review?'+query);
 await send(env,'review-'+row.id,reviewers,'Toegangsaanvraag RatelSlop Games',
  '<p>'+escape(row.email)+' vraagt toegang tot RatelSlop Games.</p><p><a href="'+url+'&amp;choice=allow">Toestaan</a> · <a href="'+url+'&amp;choice=deny">Weigeren</a></p><p>Bevestig je keuze op de website. De link is zeven dagen geldig.</p>');
 await sql(env,'UPDATE requests SET review_sent=? WHERE id=?',Date.now(),row.id).run();
}

async function sendCode(env,row) {
 const code=(await rawCode(env,row.id)).match(/.{4}/g).join('-');
 const expiry=new Date(row.expires).toLocaleString('nl-NL',{timeZone:'Europe/Amsterdam'});
 await send(env,'code-'+row.id,[row.email],'Je toegangscode voor RatelSlop Games',
  '<p>Je aanvraag is goedgekeurd. Je code is <strong>'+code+'</strong>.</p><p>Geldig tot '+expiry+' (Nederlandse tijd).</p><p><a href="'+escape(env.ORIGIN)+'/access">Open RatelSlop Games</a></p>');
 await sql(env,'UPDATE requests SET code_sent=? WHERE id=?',Date.now(),row.id).run();
}

async function apply(env,ctx,fields,ip) {
 const email=(fields.get('email')||'').trim().toLowerCase();
 if(email.length>254 || !/^[^\s<>@]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) return html(gate('Vul een geldig e-mailadres in.'),400);
 if(await limited(env,'apply:'+ip,5,day)) return html(gate('Te veel aanvragen. Probeer het morgen opnieuw.'),429);
 const id=hex(crypto.getRandomValues(new Uint8Array(24))), now=Date.now();
 const row=await sql(env,'INSERT INTO requests(id,email,created,day) VALUES(?,?,?,?) ON CONFLICT(email,day) DO NOTHING RETURNING id,email',id,email,now,Math.floor(now/day)).first();
 if(row) ctx.waitUntil(sendReview(env,row).catch(()=>console.warn('Review email queued for retry')));
 return html(gate('Je aanvraag is ontvangen. Na goedkeuring ontvang je een code per e-mail.'));
}

async function review(env,url,method,fields) {
 const id=url.searchParams.get('id')||'';
 if(!/^[a-f0-9]{48}$/.test(id) || !equal(url.searchParams.get('token'),await sign(env,'review:'+id))) return html(page('Ongeldige link',''),403);
 const row=await sql(env,'SELECT * FROM requests WHERE id=?',id).first();
 const now=Date.now();
 if(!row || row.created<=now-7*day) return html(page('Deze link is verlopen',''),410);
 if(row.status!=='pending') return html(page('Aanvraag is al verwerkt',row.status==='approved'?'<p>Toegang goedgekeurd.</p>':'<p>Toegang geweigerd.</p>'));
 if(method==='GET') {
  const allow=url.searchParams.get('choice')==='allow';
  return html(page('Bevestig je beslissing','<p>'+escape(row.email)+'</p><form method="post" action="'+escape(url.pathname+url.search)+'"><button name="decision" value="'+(allow?'allow':'deny')+'">'+(allow?'Toestaan':'Weigeren')+'</button></form>'));
 }
 const decision=fields.get('decision');
 if(!['allow','deny'].includes(decision)) return html(page('Ongeldige beslissing',''),400);
 const allow=decision==='allow';
 const changed=await sql(env,"UPDATE requests SET status=?,decided=?,expires=?,code_hash=? WHERE id=? AND status='pending' AND created>? RETURNING *",allow?'approved':'denied',now,allow?nextMonth(now):null,allow?await digest(await rawCode(env,id)):null,id,Date.now()-7*day).first();
 if(!changed) return html(page('Aanvraag is al verwerkt',''));
 if(!allow) return html(page('Toegang geweigerd',''));
 try { await sendCode(env,changed); }
 catch { return html(page('Toegang goedgekeurd','<p>De mail staat klaar voor een nieuwe verzendpoging.</p>'),202); }
 return html(page('Toegang goedgekeurd','<p>De code is verstuurd.</p>'));
}

async function login(env,fields,ip) {
 if(await limited(env,'login:'+ip,20,900000)) return html(gate('Te veel pogingen. Probeer het over 15 minuten opnieuw.'),429);
 const code=(fields.get('code')||'').replace(/[\s-]/g,'').toUpperCase();
 const row=/^[A-F0-9]{24}$/.test(code) && await sql(env,"SELECT id,expires FROM requests WHERE status='approved' AND code_hash=? AND expires>?",await digest(code),Date.now()).first();
 if(!row) return html(gate('Deze code is ongeldig of verlopen.'),401);
 const session=row.id+'.'+row.expires;
 const remaining=Math.max(0,Math.floor((row.expires-Date.now())/1000));
 return redirect('/',cookie+'='+session+'.'+await sign(env,'session:'+session)+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+remaining);
}

async function authorized(request,env) {
 const token=request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookie+'='))?.slice(cookie.length+1)||'';
 const match=/^([a-f0-9]{48}\.\d{13})\.([a-f0-9]{64})$/.exec(token);
 return Boolean(match && Number(match[1].split('.')[1])>Date.now() && equal(match[2],await sign(env,'session:'+match[1])));
}

export default {
 async fetch(request,env,ctx) {
  const url=new URL(request.url);
  const viaBridge=url.origin===env.BRIDGE_ORIGIN && env.BRIDGE_SECRET?.length>=32 &&
   equal(request.headers.get('X-RatelSlop-Bridge'),env.BRIDGE_SECRET);
  if(url.origin!==env.ORIGIN && !viaBridge) return new Response(null,{status:403});
  if(env.ACCESS_SECRET?.length<32 || !env.ACCESS_SECRET || !env.RESEND_API_KEY) return html(page('Toegang tijdelijk niet beschikbaar',''),503);
  try {
   const post=request.method==='POST';
   if(post && request.headers.get('Origin')!==env.ORIGIN) return new Response(null,{status:403});
   if(!post && !['GET','HEAD'].includes(request.method)) return new Response(null,{status:405});
   if(post && Number(request.headers.get('Content-Length'))>4096) return new Response(null,{status:413});
   const body=post?await request.text():'';
   if(body.length>4096) return new Response(null,{status:413});
   const fields=new URLSearchParams(body);
   if(url.pathname==='/access/review' && request.method!=='HEAD') return await review(env,url,request.method,fields);
   if(post) {
    const sourceIP=viaBridge ? request.headers.get('X-RatelSlop-Client-IP') : request.headers.get('CF-Connecting-IP');
    const ip=await sign(env,'ip:'+(sourceIP||'local'));
    if(url.pathname==='/access/request') return await apply(env,ctx,fields,ip);
    if(url.pathname==='/access/login') return await login(env,fields,ip);
    return new Response(null,{status:405});
   }
   if(url.pathname==='/access') return html(gate());
   if(!await authorized(request,env)) return redirect('/access');
   const asset=await env.ASSETS.fetch(request);
   const response=new Response(asset.body,asset);
   response.headers.set('Cache-Control','private, no-store');
   return response;
  } catch {
   console.error('Access request failed');
   return html(page('Tijdelijk niet beschikbaar','<p>Probeer het later opnieuw.</p>'),503);
  }
 },
 async scheduled(event,env) {
  const now=Date.now(), since=now-23*3600000;
  const reviews=await sql(env,"SELECT * FROM requests WHERE status='pending' AND review_sent IS NULL AND created>? LIMIT 10",since).all();
  const codes=await sql(env,"SELECT * FROM requests WHERE status='approved' AND code_sent IS NULL AND decided>? AND expires>? LIMIT 10",since,now).all();
  await Promise.allSettled([...reviews.results.map(row=>sendReview(env,row)),...codes.results.map(row=>sendCode(env,row))]);
  await sql(env,'DELETE FROM limits WHERE expires<=?',now).run();
 },
};
