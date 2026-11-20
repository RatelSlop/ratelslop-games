export const DEPARTMENTS = {versplein:'Groente & fruit',bakkerij:'Brood & beleg',zuivel:'Zuivel & kaas',kruidenierswaren:'Boodschappen'};
export const DAY_SECONDS = 480;
export const capacity = 18;
export const money = cents => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(cents/100);
export const wholesale = p => Math.round(p.price*.62);
export function createState(products,day=1,cash=35000){return {version:1,day,cash,time:0,revenue:0,served:0,lost:0,filled:0,scanned:0,satisfaction:100,stock:Object.fromEntries(products.map((p,i)=>[p.id,{shelf:6+(i*7)%13,warehouse:12}])),queue:[],orders:[],checkout:null,selfscan:0,nextCustomer:12,nextIssue:55,ended:false};}
export function validateSave(s,products){
 const nonnegative=n=>Number.isFinite(n)&&n>=0,integer=n=>Number.isInteger(n)&&n>=0;
 const basket=c=>c&&Array.isArray(c.items)&&c.items.length>0&&c.items.length<=5&&c.items.every(id=>products.some(p=>p.id===id))&&nonnegative(c.wait);
 return !!(s&&s.version===1&&integer(s.day)&&s.day>0&&integer(s.cash)&&nonnegative(s.time)&&s.time<=DAY_SECONDS&&['revenue','served','lost','filled','scanned','selfscan'].every(k=>integer(s[k]))&&nonnegative(s.satisfaction)&&s.satisfaction<=100&&s.selfscan<=9&&nonnegative(s.nextCustomer)&&nonnegative(s.nextIssue)&&typeof s.ended==='boolean'&&Array.isArray(s.queue)&&s.queue.length<=6&&s.queue.every(basket)&&(!s.checkout||(basket(s.checkout)&&integer(s.checkout.index)&&s.checkout.index<=s.checkout.items.length))&&Array.isArray(s.orders)&&s.orders.every(o=>o&&products.some(p=>p.id===o.id)&&o.qty===12&&nonnegative(o.eta))&&products.every(p=>s.stock?.[p.id]&&integer(s.stock[p.id].shelf)&&s.stock[p.id].shelf<=capacity&&integer(s.stock[p.id].warehouse)));
}
export function fill(s,id,qty=6){const p=s.stock[id];if(!p||s.ended)return 0;const n=Math.min(qty,capacity-p.shelf,p.warehouse);p.shelf+=n;p.warehouse-=n;s.filled+=n;return n;}
export function order(s,p){if(s.ended)return false;const cost=wholesale(p)*12;if(s.cash<cost||s.orders.some(o=>o.id===p.id))return false;s.cash-=cost;s.orders.push({id:p.id,qty:12,eta:s.time+25});return true;}
export function total(items,products){return items.reduce((n,id)=>n+(products.find(p=>p.id===id)?.price||0),0);}
function sell(s,customer,products){const value=total(customer.items,products);s.cash+=value;s.revenue+=value;s.served++;s.satisfaction=Math.min(100,s.satisfaction+1);return value;}
export function beginCheckout(s){if(s.checkout||!s.queue.length||s.ended)return false;s.checkout={...s.queue.shift(),index:0};return true;}
export function scan(s){if(!s.checkout||s.ended)return null;const id=s.checkout.items[s.checkout.index];if(!id)return null;s.checkout.index++;s.scanned++;return id;}
export function pay(s,products){if(!s.checkout||s.ended||s.checkout.index<s.checkout.items.length)return 0;const value=sell(s,s.checkout,products);s.checkout=null;return value;}
export function resolveSelfscan(s){if(!s.selfscan||s.ended)return false;s.selfscan=0;s.satisfaction=Math.min(100,s.satisfaction+4);return true;}
export function tick(s,dt,products,rng=Math.random){
 if(s.ended)return [];dt=Math.max(0,Math.min(dt,1));s.time=Math.min(DAY_SECONDS,s.time+dt);const events=[];
 for(const o of [...s.orders])if(o.eta<=s.time){s.stock[o.id].warehouse+=o.qty;s.orders.splice(s.orders.indexOf(o),1);events.push({type:'delivery',id:o.id});}
 if(s.time>=s.nextCustomer){s.nextCustomer=s.time+10+rng()*9;const items=[];const count=2+Math.floor(rng()*4);for(let i=0;i<count;i++){const available=products.filter(p=>s.stock[p.id].shelf>0);if(!available.length)break;const p=available[Math.min(available.length-1,Math.floor(rng()*available.length))];s.stock[p.id].shelf--;items.push(p.id);}
  if(items.length){const c={id:Math.floor(s.time*1000),items,wait:0};if(rng()<.5&&!s.selfscan){sell(s,c,products);events.push({type:'selfsale'});}else if(s.queue.length<6){s.queue.push(c);events.push({type:'customer'});}else{for(const id of items)s.stock[id].shelf++;s.lost++;s.satisfaction=Math.max(0,s.satisfaction-5);}}else{s.lost++;s.satisfaction=Math.max(0,s.satisfaction-4);}}
 for(const c of [...s.queue]){c.wait+=dt;if(c.wait>110){for(const id of c.items)s.stock[id].warehouse++;s.queue.splice(s.queue.indexOf(c),1);s.lost++;s.satisfaction=Math.max(0,s.satisfaction-8);events.push({type:'left'});}}
 if(s.time>=s.nextIssue){s.nextIssue=s.time+70+rng()*40;if(!s.selfscan){s.selfscan=1+Math.floor(rng()*9);events.push({type:'assistance'});}}
 if(s.time>=DAY_SECONDS){s.ended=true;events.push({type:'end'});}return events;
}
export function nextDay(s,products){const n=createState(products,s.day+1,s.cash);n.stock=structuredClone(s.stock);for(const c of s.queue)for(const id of c.items)n.stock[id].warehouse++;if(s.checkout)for(const id of s.checkout.items)n.stock[id].warehouse++;n.orders=s.orders.map(o=>({...o,eta:Math.max(0,o.eta-s.time)}));return n;}
