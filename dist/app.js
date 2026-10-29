const $=selector=>document.querySelector(selector);
const icon=id=>`<svg aria-hidden="true"><use href="#${id}"/></svg>`;
const games=[
{id:'de-achterkamers',name:'De Achterkamers',category:'Horror',style:'achterkamers',title:'DE<br>ACHTERKAMERS',image:'art/covers/de-achterkamers.webp',url:'games/de-achterkamers/index.html',repo:'ratelslop-games',source:'https://github.com/RatelSlop/ratelslop-games/tree/main/games/de-achterkamers',tagline:'De bel ging. Jij bleef.',description:'Escape a maze of yellow rooms while the photographic faces of Thomas, Mijke, Marola and Jaap hunt you down. Collect access passes, conserve your sprint, and make it back to the exit.',controls:'WASD: move · Mouse / drag: look · Shift: sprint · E: interact · F: flashlight · M: explored map · Space: look behind. Touch controls available.',meta:'Face-chase horror · Keyboard, mouse & touch',alt:'Photographic floating heads in yellow Backrooms corridors.'},
{id:'bouncykoen',name:'BouncyKoen',category:'Arcade',style:'bouncy',title:'BOUNCY<br>KOEN',image:'art/covers/bouncykoen.webp',url:'games/bouncykoen/index.html',repo:'BouncyKoen',tagline:'One more hop. One more close call.',description:'Hop through a distinctly Dutch world of busy roads, cycle lanes, canals and railway crossings. Keep Koen moving: a cheeky seagull is never far away.',controls:'Arrow keys / WASD to hop. Swipe or use the on-screen D-pad on mobile.',meta:'3D arcade · Touch & keyboard',alt:'Illustrated voxel Koen hopping across a Dutch canal with tulips, bicycles and a yellow train.'},
{id:'conciergedienst',name:'ConciergeDienst',category:'Horror',style:'concierge',title:'CONCIERGE<br>DIENST',image:'art/covers/conciergedienst.webp',url:'games/conciergedienst/index.html',repo:'Concierge-dienst',tagline:'The school is empty. You are not alone.',description:'You are the school caretaker on the night shift. Watch four security cameras, find the changes and report anomalies before the system is overwhelmed. Survive from midnight until 06:00.',controls:'1–4: cameras · Space / R: report · Mouse wheel: zoom · M: sound. Includes frightening images and jump scares.',meta:'Observation horror · Keyboard & mouse',alt:'Illustrated school corridor at night with a security camera and a distant shadow in the doorway.'},
{id:'uavpilot',name:'UAVPilot',category:'Simulation',style:'uav',title:'UAV<br>PILOT',image:'art/covers/uavpilot.webp',url:'games/uavpilot/index.html',repo:'UAVPilot',tagline:'Take the controls. Own the horizon.',description:'Take flight in a destructible, low-poly open world. Pilot eight drone tiers, navigate air defenses and unlock new equipment as you progress.',controls:'Mouse: steer · W/S: throttle · A/D: bank · V: camera · Esc: hangar. Desktop browser with WebGL 2 required.',meta:'Flight sandbox · Keyboard & mouse',alt:'Illustrated fixed-wing drone banking over a countryside town at sunset.'},
{id:'schoolcontrol',name:'SchoolControl',category:'Adventure',style:'school',title:'SCHOOL<br>CONTROL',image:'art/covers/schoolcontrol.webp',url:null,repo:'SchoolControl',tagline:'De laatste bel.',description:'A Dutch school adventure: explore the campus, earn your maths and chemistry passes, and face the director. Choose Thomas with his pencil and dog Bo, or Jasper with his chopsticks and chicken companion.',controls:'WASD / arrows: move · E: interact · J / click: attack · Space: dodge · F: companion. The game also supports touch controls.',meta:'School adventure · Private repository',alt:'Illustrated school adventurers with a pencil, chopsticks, a dog and a chicken outside a Dutch school.'}
];
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
let saved=read('rs-favorites',[]),recent=read('rs-recent',[]),view='discover',filter='all',selectedGame=null,active=null;
if(!Array.isArray(saved))saved=[];
if(!Array.isArray(recent))recent=[];
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2200)}
function toggleSave(game){const removing=saved.includes(game.id);saved=removing?saved.filter(id=>id!==game.id):[...saved,game.id];write('rs-favorites',saved);toast(`${game.name} ${removing?'removed from':'added to'} My list`);renderCards();updatePageSave()}
function makeCard(game){
  const card=document.createElement('article');card.className='game-card';const isSaved=saved.includes(game.id);
  card.innerHTML=`<a class="poster poster-${game.style}" href="#game/${game.id}" aria-label="View ${game.name}"><img src="${game.image}" alt="${game.alt}" loading="lazy" width="1672" height="941"><span class="badge ${game.url?'ready':''}">${game.url?game.category:'Private · Not connected'}</span><img class="poster-studio" src="brand/ratelslop-logo.png" alt="" width="28" height="32"><span class="poster-title">${game.title}</span><span class="card-hover-play">${icon('info')}</span></a><div class="card-text"><div><h3><a href="#game/${game.id}">${game.name}</a></h3><p>${game.category} · ${game.url?'Browser game':'Not connected yet'}</p></div><button class="save iconbutton ${isSaved?'saved':''}" aria-label="${isSaved?'Remove':'Save'} ${game.name} ${isSaved?'from':'to'} My list" aria-pressed="${isSaved}">${icon('heart')}</button></div>`;
  card.querySelector('.save').onclick=()=>toggleSave(game);return card;
}
function renderCards(){
  const search=$('#search-input').value.trim().toLowerCase();const list=games.filter(g=>(view!=='favorites'||saved.includes(g.id))&&(filter==='all'||g.category===filter)&&(!$('#available').checked||g.url)&&`${g.name} ${g.category}`.toLowerCase().includes(search));
  $('#game-grid').replaceChildren(...list.map(makeCard));$('#empty').hidden=list.length>0;
  $('#library-title').textContent=view==='favorites'?'My list':search?'Search results':view==='all'?'The whole collection':'Your next obsession';
  $('#library-subtitle').textContent=view==='favorites'?'Your favorites, ready for another round.':search?`${list.length} game${list.length===1?'':'s'} found`:'Small studio. Unreasonably good distractions.';
  $('.hero').hidden=view!=='discover'||!!search;$('#recent-section').hidden=!recent.length||view!=='discover'||!!search;$('#recent').replaceChildren();
  for(const id of recent){const game=games.find(g=>g.id===id);if(!game?.url)continue;const link=document.createElement('a');link.className='recent-item';link.href=`#play/${game.id}`;link.innerHTML=`<img src="${game.image}" alt=""><div><strong>${game.name}</strong><span>Play again</span></div>${icon('play')}`;$('#recent').append(link)}
}
function updatePageSave(){if(!selectedGame)return;const isSaved=saved.includes(selectedGame.id);$('#game-save').innerHTML=icon('heart')+(isSaved?'Saved to My list':'Add to My list');$('#game-save').setAttribute('aria-pressed',String(isSaved))}
function showGame(game){
  selectedGame=game;$('#game-page').dataset.game=game.id;$('#game-cover').src=game.image;$('#game-cover').alt=game.alt;$('#game-name').innerHTML=game.title;$('#game-tagline').textContent=game.tagline;$('#game-category').textContent=game.category;$('#game-device').textContent=game.meta;$('#game-description').textContent=game.description;$('#game-controls').textContent=game.controls;
  $('#game-availability').textContent=game.url?'Ready to play in your browser. No installation needed.':'This game is not connected to the hub yet. Save it to your list for later.';
  $('#game-start').innerHTML=icon(game.url?'play':'lock')+(game.url?'Play now':'Not connected yet');$('#game-start').disabled=!game.url;$('#game-source').href=game.source||`https://github.com/RatelSlop/${game.repo}`;$('#game-related').replaceChildren(...games.filter(g=>g.id!==game.id).map(makeCard));updatePageSave();
}
function stopGame(){if(!active)return;$('#game-frame').src='about:blank';active=null;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}
function route(){
  const match=location.hash.match(/^#(game|play)\/([a-z0-9-]+)$/);const game=match&&games.find(g=>g.id===match[2]);
  if(location.hash&&!game)history.replaceState(null,'',location.pathname+location.search);
  const playing=!!(game&&match[1]==='play'&&game.url);if(!playing||active?.id!==game.id)stopGame();
  $('#browse').hidden=!!game;$('#game-page').hidden=!game||playing;$('#player').hidden=!playing;$('footer').hidden=playing;document.body.classList.toggle('is-playing',playing);document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',!game&&b.dataset.view===view));
  if(game&&!playing){showGame(game);document.title=`${game.name} — RatelSlop Games`;$('#game-name').focus({preventScroll:true})}
  else if(playing&&!active){active=game;selectedGame=game;$('#player-title').textContent=game.name;$('#controls').textContent=game.controls;$('#game-frame').title=`${game.name} game`;$('#player-loading').hidden=false;$('#game-frame').src=game.url;recent=[game.id,...recent.filter(id=>id!==game.id)].slice(0,4);write('rs-recent',recent);document.title=`Playing ${game.name} — RatelSlop Games`;$('#exit-player').focus({preventScroll:true})}
  else if(!game){selectedGame=null;document.title='RatelSlop Games — Pick your next obsession';renderCards()}
  window.scrollTo(0,0);
}
function navigate(hash=''){if(location.hash===hash)route();else if(!hash){history.pushState(null,'',location.pathname+location.search);route()}else location.hash=hash}
function syncTheme(){const light=document.documentElement.dataset.theme==='light';$('#theme').setAttribute('aria-label',`Switch to ${light?'dark':'light'} theme`);$('#theme').setAttribute('aria-pressed',String(light))}
$('#theme').onclick=()=>{const theme=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=theme;try{localStorage.setItem('rs-theme',theme)}catch{}syncTheme()};syncTheme();
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{view=button.dataset.view;navigate()});
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b===button));renderCards()});
$('#search-input').oninput=()=>{if(location.hash)navigate();else renderCards()};$('#available').onchange=renderCards;
$('#reset').onclick=()=>{view='all';filter='all';$('#search-input').value='';$('#available').checked=false;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b.dataset.filter==='all'));navigate()};
$('#hero-play').onclick=()=>navigate('#play/de-achterkamers');$('#hero-details').onclick=()=>navigate('#game/de-achterkamers');
$('#game-start').onclick=()=>{if(selectedGame?.url)navigate(`#play/${selectedGame.id}`)};$('#game-save').onclick=()=>{if(selectedGame)toggleSave(selectedGame)};$('#game-back').onclick=()=>navigate();$('#exit-player').onclick=()=>navigate(`#game/${active.id}`);
function restart(){if(active){$('#player-loading').hidden=false;$('#game-frame').src=active.url}}
$('#restart').onclick=restart;$('#retry').onclick=restart;$('#game-frame').onload=()=>{$('#player-loading').hidden=true};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#game-stage').requestFullscreen()}catch{toast('Fullscreen is unavailable in this browser')}};
document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!active){event.preventDefault();$('#search-input').focus()}});
document.querySelectorAll('.brand,.footer-brand').forEach(link=>link.onclick=event=>{event.preventDefault();view='discover';$('#search-input').value='';navigate()});
window.addEventListener('hashchange',route);window.addEventListener('popstate',route);renderCards();route();
