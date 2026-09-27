
"use strict";
// Owns the frame only. Existing screens and controls retain their state and handlers.
(() => {
  const Runtime=window.YSRuntime;
  const byId = id => document.getElementById(id);
  const shell = document.querySelector('.shell'), header = document.querySelector('.topbar'), nav = byId('mode-nav');
  document.body.classList.add('ui-shell');
  const content = document.createElement('div'); content.id = 'app-content';
  content.tabIndex = -1;
  shell.append(content);
  [...shell.children].filter(node => node.classList.contains('screen')).forEach(node => content.append(node));
  const tray = byId('party-tray'); byId('cups-screen').prepend(tray);
  const title = document.createElement('h1'); title.id = 'app-title'; title.textContent = 'Journey';
  const coin = document.createElement('button'); coin.type = 'button'; coin.className = 'shell-coins ys-hud-money'; coin.setAttribute('aria-label','Open Poké Mart');
  coin.innerHTML = '<span aria-hidden="true">●</span>'; coin.append(byId('coins')); coin.onclick = () => showShop();
  const playerHud = document.createElement('section'); playerHud.className='ys-player-hud'; playerHud.setAttribute('aria-label','Trainer status');
  const identity = document.createElement('div'); identity.className='ys-hud-identity trainer-identity';
  const avatar = document.createElement('img'); avatar.className='ys-hud-avatar player-avatar-chip'; avatar.alt='';
  const identityCopy = document.createElement('span'); identityCopy.className='ys-hud-name'; identityCopy.append(byId('trainer-name'));
  const trainerLabel = document.createElement('small'); trainerLabel.textContent='TRAINER'; identityCopy.append(trainerLabel); identity.append(avatar,identityCopy);
  const hudStatus = document.createElement('div'); hudStatus.className='ys-hud-status';
  const badgeStrip = document.createElement('span'); badgeStrip.className='ys-hud-badges'; badgeStrip.setAttribute('aria-label','Kanto badges');
  const winStat = document.createElement('span'); winStat.className='ys-hud-win'; const winsNode=byId('wins'); if(winsNode)winStat.append(winsNode); const winLabel=document.createElement('small');winLabel.textContent='WINS';winStat.append(winLabel);
  const hudStats=document.createElement('span');hudStats.className='ys-hud-stats';hudStats.append(coin,winStat);hudStatus.append(badgeStrip,hudStats);playerHud.append(identity,hudStatus);
  function syncPlayerHud(){
    const earned=Math.max(0,Math.min(8,Number(Runtime.save?.cupsCompleted)||0));
    badgeStrip.replaceChildren(...Array.from({length:8},(_,i)=>{const pip=document.createElement('i');if(i<earned)pip.className='earned';pip.setAttribute('aria-hidden','true');return pip;}));
    badgeStrip.title=`${earned} of 8 Kanto badges`;
    try{if(window.PlayerAvatar){avatar.src=PlayerAvatar.currentAsset();avatar.style.filter=PlayerAvatar.currentFilter();}else avatar.src=assetUrl('./assets/trainers/cooltrainerm.png');}catch{avatar.src='./assets/trainers/cooltrainerm.png';}
  }
  const icon = path => `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  const music = byId('music-toggle');
  const menuButton = document.createElement('button'); menuButton.type='button'; menuButton.id='shell-menu-button'; menuButton.className='shell-icon';
  menuButton.setAttribute('aria-label','Settings and help'); menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-controls','shell-menu');
  menuButton.innerHTML=icon('<path d="M4 6h16M4 12h16M4 18h16"/>');
  const menu=document.createElement('dialog');menu.id='shell-menu';menu.setAttribute('aria-labelledby','shell-menu-title');
  menu.innerHTML='<header><h2 id="shell-menu-title">Trainer menu</h2><button type="button" class="shell-icon" aria-label="Close menu">×</button></header><div class="shell-menu-actions"></div>';
  const actions=menu.querySelector('.shell-menu-actions');
  const settings=byId('settings-tab'),help=byId('joke-guide'),shop=byId('shop-tab'),reset=byId('reset-save');
  settings.className=help.className=shop.className='secondary-button';settings.textContent='Settings';help.textContent='Help · Professor Joke';shop.textContent='Poké Mart';
  actions.append(settings,help,shop);menu.append(byId('save-tools'),reset);document.body.append(menu);
  const close=()=>{menu.close();menuButton.setAttribute('aria-expanded','false');menuButton.focus();};
  menu.querySelector('header button').onclick=close;
  menuButton.onclick=()=>{menu.showModal();menuButton.setAttribute('aria-expanded','true');};
  menu.addEventListener('click',event=>{if(event.target===menu)close();});
  menu.addEventListener('cancel',event=>{event.preventDefault();close();});
  for(const button of [settings,help,shop,reset])button.addEventListener('click',close,{capture:true});
  const brand=header.querySelector('.brand');header.replaceChildren(brand,title,playerHud,music,menuButton);syncPlayerHud();
  // Keep record nodes that are not surfaced in the compact HUD alive for existing renderers.
  const records=document.createElement('div');records.hidden=true;
  for(const id of ['collection-count','streak'])records.append(Runtime.element(id));shell.append(records);
  const bag=byId('bag-tab');bag.innerHTML=icon('<path d="M5 8h14l-1 12H6L5 8Zm3 0a4 4 0 0 1 8 0"/>')+'<span>Bag</span>';bag.setAttribute('aria-label','Bag');
  byId('cups-tab').innerHTML=icon('<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>')+'<span>Journey</span>';
  byId('trainer-tab').innerHTML=icon('<path d="M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v2a5 5 0 0 0 4 5m8-7h4v2a5 5 0 0 1-4 5m-4 1v5m-4 3h8"/>')+'<span>Cups</span>';
  const labels={'collection-tab':'Party','cups-tab':'Journey','trainer-tab':'Cups','safari-tab':'Safari','pokecenter-tab':'Center','pokedex-tab':'Dex','bag-tab':'Bag','shop-tab':'Shop','settings-tab':'Settings'};
  function syncNav(id){
    const active=id==='shop-tab'?'bag-tab':id;
    for(const button of nav.querySelectorAll('button')){const chosen=button.id===active;button.classList.toggle('active',chosen);if(chosen)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
    title.textContent=labels[id]||'Yellow Stadium';content.scrollTop=0;
  }
  window.YSFlow?.on('nav:changed',({id})=>{syncNav(id);syncPlayerHud();},100);
  window.YSFlow?.on('app:rendered',syncPlayerHud,260);
  window.YSFlow?.on('journey:rendered',syncPlayerHud,260);
  window.YSFlow?.on('battle:ended',syncPlayerHud,260);
  const soundLabel=()=>{const muted=music.getAttribute('aria-pressed')==='true';music.setAttribute('aria-label',muted?'Sound off · turn on':'Sound on · mute');};
  new MutationObserver(soundLabel).observe(music,{attributes:true,attributeFilter:['aria-pressed']});soundLabel();
  // A failed save remains visible even after moving save controls into the menu.
  const saveStatus=window.SaveTools?.status;
  if(saveStatus)window.SaveTools.status=function(ok){saveStatus(ok);menuButton.classList.toggle('save-warning',!ok);menuButton.setAttribute('aria-label',ok?'Settings and help':'Progress not saved · open backup controls');};
  window.AppShell={content,syncNav,closeMenu:close};
})();

