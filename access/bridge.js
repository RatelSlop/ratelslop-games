export default {
 async fetch(request,env) {
  const incoming=new URL(request.url);
  if(incoming.origin!==env.PUBLIC_ORIGIN) return new Response(null,{status:403});
  if(!env.BRIDGE_SECRET || env.BRIDGE_SECRET.length<32) {
   return new Response('De gamehub is tijdelijk niet beschikbaar.',{status:503});
  }

  const destination=new URL(env.UPSTREAM);
  destination.pathname=incoming.pathname;
  destination.search=incoming.search;
  const headers=new Headers(request.headers);
  headers.delete('Host');
  headers.set('X-RatelSlop-Bridge',env.BRIDGE_SECRET);
  headers.set('X-RatelSlop-Client-IP',request.headers.get('CF-Connecting-IP')||'unknown');

  const forwarded=new Request(destination,request);
  const upstream=await fetch(new Request(forwarded,{headers,redirect:'manual'}));
  if(upstream.status<300 || upstream.status>=400 || !upstream.headers.has('Location')) return upstream;
  const response=new Response(upstream.body,upstream);
  const location=new URL(upstream.headers.get('Location'),destination);
  if(location.origin===destination.origin) response.headers.set('Location',location.pathname+location.search+location.hash);
  return response;
 },
};
