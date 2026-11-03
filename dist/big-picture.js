/* Uses the launcher's shared catalog, favorites, history and player routing. */
(()=>{
 const entry=document.createElement('button');entry.id='big-picture-toggle';entry.className='secondary';entry.textContent='Big Picture';entry.setAttribute('aria-label','Enter Big Picture mode');
 document.querySelector('.header-tools').prepend(entry);
 const root=document.createElement('section');root.id='big-picture';root.hidden=true;root.setAttribute('aria-label','Big Picture game library');
 root.innerHTML=`<header class="bp-header"><a class="bp-brand" href="#" data-bp-focus><img src="brand/ratelslop-logo.png" alt="Ratel Slop Studios">RatelSlop <span>BIG PICTURE</span></a><nav aria-label="Big Picture collection"><button data-bp-filter="all" data-bp-focus>All games</button><button data-bp-filter="saved" data-bp-focus>My list</button><button data-bp-filter="recent" data-bp-focus>Recently played</button></nav><div><button id="bp-fullscreen" data-bp-focus aria-label="Toggle Big Picture fullscreen">${icon('expand')}</button><button id="bp-exit" data-bp-focus>Exit Big Picture ${icon('close')}</button></div></header><div class="bp-spotlight"><img id="bp-backdrop" alt=""><div class="bp-gradient"></div><div class="bp-copy"><p class="bp-eyebrow">PICK. PLAY. REPEAT.</p><p id="bp-meta"></p><h1 id="bp-title"></h1><p id="bp-tagline"></p><p id="bp-description"></p><div class="bp-actions"><button id="bp-play" class="primary" data-bp-focus></button><button id="bp-save" class="secondary" data-bp-focus></button></div><p id="bp-controls"></p></div></div><div id="bp-shelves"></div><p class="bp-help">Arrow keys or controller to browse · Enter / A to play · Esc / B to leave</p>`;
 document.body.append(root);
 let enabled=read('rs-big-picture',false)===true,collection='all',currentId=games.find(g=>g.url)?.id||games[0].id;
 const select=id=>{
  const game=games.find(g=>g.id===id);if(!game)return;currentId=id;
  root.querySelector('#bp-backdrop').src=game.image;root.querySelector('#bp-title').textContent=game.name;
  root.querySelector('#bp-tagline').textContent=game.tagline;root.querySelector('#bp-description').textContent=game.description;
  root.querySelector('#bp-meta').textContent=game.category+' / '+(game.url?'READY TO PLAY':'NOT CONNECTED');
  root.querySelector('#bp-controls').textContent=game.controls;
  const play=root.querySelector('#bp-play');play.innerHTML=icon(game.url?'play':'lock')+(game.url?'Play now':'Not connected');play.disabled=!game.url;
  const save=root.querySelector('#bp-save'),isSaved=saved.includes(id);save.innerHTML=icon('heart')+(isSaved?'In My list':'My list');save.setAttribute('aria-pressed',String(isSaved));
  root.querySelectorAll('.bp-card').forEach(card=>card.classList.toggle('bp-selected',card.dataset.game===id));
 };
 function shelf(title,list){
  const section=document.createElement('section');section.className='bp-shelf';
  const heading=document.createElement('h2');heading.textContent=title;const rail=document.createElement('div');rail.className='bp-rail';rail.setAttribute('aria-label',title);
  for(const game of list){
   const card=document.createElement('button');card.className='bp-card';card.dataset.game=game.id;card.setAttribute('data-bp-focus','');card.setAttribute('aria-label',game.name+(game.url?' — play':' — not connected'));
   card.innerHTML=`<span class="bp-poster"><img src="${game.image}" alt="" loading="lazy"><span class="bp-card-category">${game.url?game.category:'Not connected'}</span><span class="bp-card-title">${game.name}</span><span class="bp-card-play">${icon(game.url?'play':'lock')}</span></span>`;
   card.onfocus=()=>select(game.id);card.onpointerenter=()=>select(game.id);card.onclick=()=>{select(game.id);if(game.url)launch();else toast('This game is not connected yet')};rail.append(card);
  }
  section.append(heading,rail);return section;
 }
 function shelves(){
  const target=root.querySelector('#bp-shelves');target.replaceChildren();
  const listed=games.filter(g=>collection==='all'||(collection==='saved'?saved.includes(g.id):recent.includes(g.id)));
  if(collection==='all'){
   const back=recent.map(id=>games.find(g=>g.id===id&&g.url)).filter(Boolean);if(back.length)target.append(shelf('Jump back in',back));
   target.append(shelf('The RatelSlop collection',listed));
   const horror=games.filter(g=>g.category==='Horror');if(horror.length>1)target.append(shelf('After dark',horror));
  }else if(listed.length)target.append(shelf(collection==='saved'?'Your list':'Recently played',collection==='recent'?recent.map(id=>listed.find(g=>g.id===id)).filter(Boolean):listed));
  else{const empty=document.createElement('p');empty.className='bp-empty';empty.textContent=collection==='saved'?'Your list is empty. Save a game with the My list button.':'Your played games will appear here.';target.append(empty);}
  root.querySelectorAll('[data-bp-filter]').forEach(b=>{b.classList.toggle('bp-current',b.dataset.bpFilter===collection);b.setAttribute('aria-pressed',String(b.dataset.bpFilter===collection))});
  select(listed.some(g=>g.id===currentId)?currentId:listed[0]?.id||currentId);
 }
 function sync(){
  const wasHidden=root.hidden,visible=enabled&&!active;root.hidden=!visible;document.body.classList.toggle('big-picture',visible);
  for(const element of document.querySelectorAll('.topbar,#browse,#game-page,footer'))element.inert=visible;
  entry.setAttribute('aria-pressed',String(enabled));
  if(visible){if(selectedGame)currentId=selectedGame.id;shelves();if(wasHidden)root.querySelector(`.bp-card[data-game="${currentId}"]`)?.focus({preventScroll:true});}
 }
 function setMode(value){enabled=value;write('rs-big-picture',value);sync();if(value)root.querySelector('.bp-card')?.focus();else entry.focus();}
 function launch(){const game=games.find(g=>g.id===currentId);if(game?.url){navigate('#play/'+game.id);sync();}}
 entry.onclick=()=>setMode(true);root.querySelector('#bp-exit').onclick=()=>setMode(false);
 root.querySelector('.bp-brand').onclick=e=>{e.preventDefault();collection='all';shelves();};
 root.querySelector('#bp-play').onclick=launch;
 root.querySelector('#bp-save').onclick=()=>{const game=games.find(g=>g.id===currentId);toggleSave(game);shelves();};
 root.querySelectorAll('[data-bp-filter]').forEach(button=>button.onclick=()=>{collection=button.dataset.bpFilter;shelves()});
 root.querySelector('#bp-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{toast('Fullscreen is unavailable in this browser')}};
 function focusDirection(dx,dy){
  const visible=[...root.querySelectorAll('[data-bp-focus]')].filter(e=>!e.disabled&&e.getBoundingClientRect().width>0);
  const focused=document.activeElement;if(!visible.includes(focused)){visible[0]?.focus();return;}
  // Rails retain off-screen cards so left/right can scroll through the full library.
  if(dx&&focused.classList.contains('bp-card')){
   const rail=[...focused.parentElement.children],next=rail[rail.indexOf(focused)+dx];if(next){next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});}return;
  }
  const a=focused.getBoundingClientRect(),ax=a.x+a.width/2,ay=a.y+a.height/2;
  const next=visible.filter(e=>e!==focused).map(e=>{const b=e.getBoundingClientRect(),x=b.x+b.width/2-ax,y=b.y+b.height/2-ay;return{e,forward:dx?x*dx:y*dy,cross:Math.abs(dx?y:x)}}).filter(c=>c.forward>8).sort((a,b)=>(a.forward+a.cross*3)-(b.forward+b.cross*3))[0]?.e;
  if(next){next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
 }
 document.addEventListener('keydown',e=>{
  if(!enabled||active)return;
  const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  if(direction){e.preventDefault();focusDirection(...direction)}else if(e.key==='Escape'){e.preventDefault();setMode(false)}
 });
 let previousButtons=[],nextRepeat=0;
 function controller(now){
  requestAnimationFrame(controller);if(!enabled||active||document.hidden){previousButtons=[];return;}
  let pad;try{pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean)}catch{return;}if(!pad)return;
  const buttons=pad.buttons.map(b=>b.pressed),edge=i=>buttons[i]&&!previousButtons[i];
  const dx=buttons[14]||pad.axes[0]<-.55?-1:buttons[15]||pad.axes[0]>.55?1:0,dy=buttons[12]||pad.axes[1]<-.55?-1:buttons[13]||pad.axes[1]>.55?1:0;
  if((dx||dy)&&now>=nextRepeat){focusDirection(dx,dx?0:dy);nextRepeat=now+220;}else if(!dx&&!dy)nextRepeat=0;
  if(edge(0)){if(root.contains(document.activeElement))document.activeElement.click();else root.querySelector('.bp-card')?.focus();}if(edge(1))setMode(false);previousButtons=buttons;
 }
 window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);requestAnimationFrame(controller);sync();
})();
