/* levels.js — levels for everyone + «لوحة الصدارة» for لَمّة | Lamma.
   Loaded after app.js, auth-config.js and auth.js on every page (the game pages call it through App: A.roundStart(), A.roundEnd(),
   A.xpPlay(), A.xpWin(), and App.award() feeds it for every winner the games already score).

   WHO EARNS WHAT  (one place: LammaLevels.XP below — change the numbers there)
   • Viewer (a Twitch chatter, id "twitch:<login>"): +play for taking part in a round (once per round), +win for winning,
     plus +perPoint for every point above 1 a game gives (trivia's fastest = 3 pts, codenames = 2 …), capped per round.
   • Streamer (the signed-in Twitch owner of the channel, id "twitch:<login>"): +round for every round that ends with ≥1 player,
     plus +perPlayer for each viewer who played in it (capped).
   • With friends (no stream): the host is the signed-in person (any provider); hosting XP goes to their own player level.
   LEVEL CURVE: level 1 at 0 XP; level n needs 100·(n−1)^1.5 cumulative XP  (Lv2 100, Lv3 283, Lv5 800, Lv10 2 700, Lv20 8 282).

   STORAGE (pluggable): always LOCAL (localStorage "lamma-levels", works today, this device only); and SUPABASE as well once
   SUPABASE_URL + SUPABASE_ANON_KEY are filled in auth-config.js — plain fetch to Supabase REST, all writes through the
   add_xp_batch() SQL function (supabase/schema.sql), queued in localStorage and retried if offline.
   Honest limit: a game that runs in the browser can't fully stop cheating; the SQL function clamps every call and every hour.

   PER-GAME STATS (for «حسابي» /profile/): every closed round also counts, per game (the page's data-game, or its path):
   viewers → played / wins / XP per game + win streak; hosts → rounds hosted / players hosted / XP per game.
   The XP rules above are unchanged. Profiles + cosmetics (frames, name colours, banners, fighter skins) = window.LammaProfile,
   at the end of this file. */
(function(){
'use strict';
var A=window.App;
var XP={
  viewer:{play:5,win:10,perPoint:5,maxWinPerRound:60},
  streamer:{round:20,perPlayer:2,maxPlayers:50},
  autoRoundSec:60,            // a game that scores without marking rounds (wheel, chain…): host XP at most once per this many seconds
  idleCloseMin:20,            // an open round nobody closed is closed after this many minutes
  maxPerCall:200              // same clamp as the SQL function
};
function levelFor(xp){xp=Math.max(0,+xp||0);return 1+Math.floor(Math.pow(xp/100,2/3)+1e-9)}
function xpFor(level){level=Math.max(1,level|0);return Math.round(100*Math.pow(level-1,1.5))}
function progress(xp){xp=Math.max(0,+xp||0);var lv=levelFor(xp),a=xpFor(lv),b=xpFor(lv+1);return {level:lv,xp:xp,from:a,to:b,pct:b>a?Math.min(1,(xp-a)/(b-a)):1}}

/* ---------- config / backends ---------- */
var CFG=window.LAMMA_AUTH_CONFIG||{};
function cs(k){var v=CFG[k];return typeof v==='string'?v.trim():''}
var SB_URL=cs('SUPABASE_URL').replace(/\/+$/,''),SB_KEY=cs('SUPABASE_ANON_KEY');
var SB_ON=/^https:\/\/[a-z0-9.-]+$/i.test(SB_URL)&&SB_KEY.length>20&&SB_KEY.indexOf('PASTE')<0;
var LKEY='lamma-levels',QKEY='lamma-levels-q';
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function clean(s,n){return String(s==null?'':s).replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n||40)}
function safeImg(u){return typeof u==='string'&&/^https:\/\/[^\s"'<>]{1,300}$/.test(u)?u:''}
var ID_RE=/^(twitch|discord|google|guest):[^\s:<>"']{1,64}$/;
/* the games, as the profile lists them (key = the page's data-game) */
var GAMES=[
  {k:'fast',ar:'أسرع واحد',en:'Fastest Typer',ic:'⚡',href:'/games/fast/'},
  {k:'trivia',ar:'أسئلة سريعة',en:'Quick Trivia',ic:'❓',href:'/games/trivia/'},
  {k:'guess',ar:'خمّن الرقم',en:'Guess the Number',ic:'🔢',href:'/games/guess/'},
  {k:'charades',ar:'تمثيل',en:'Charades',ic:'🎭',href:'/games/charades/'},
  {k:'chain',ar:'سلسلة كلمات',en:'Word Chain',ic:'🔗',href:'/games/chain/'},
  {k:'codenames',ar:'كلمات سرية',en:'Secret Words',ic:'🕵️',href:'/games/codenames/'},
  {k:'likely',ar:'مين الأرجح؟',en:'Most Likely',ic:'🗳️',href:'/games/likely/'},
  {k:'wheel-classic',ar:'العجلة الكلاسيك',en:'Classic Wheel',ic:'🎡',href:'/wheels/wheel-classic.html'},
  {k:'wheel',ar:'عجلة الشخصنة',en:'Personal Wheel',ic:'🎯',href:'/wheels/wheel-pick.html'},
  {k:'battle-arena',ar:'معركة الساحة',en:'Arena Battle',ic:'⚔️',href:'/battle/battle-arena.html'},
  {k:'battle-colors',ar:'لعبة الألوان',en:'Colour Floor',ic:'🎨',href:'/battle/battle-colors.html'},
  {k:'hero',ar:'المحارب',en:'The Perfect Warrior',ic:'🛡️',href:'/battle/hero.html'},
  {k:'tnt',ar:'اهرب من الـTNT',en:'TNT Run',ic:'💣',href:'/battle/tnt.html'}];
var GAME_KEYS=GAMES.map(function(g){return g.k});
function gameKey(){
  var g=(A&&A.game)||(document.body&&document.body.getAttribute('data-game'))||'';
  if(GAME_KEYS.indexOf(g)<0){var p=location.pathname,m=p.match(/^\/games\/([a-z]+)/)||p.match(/^\/battle\/([a-z-]+)\.html/)||p.match(/^\/wheels\/(wheel-classic)\.html/);
    g=m?m[1]:(/^\/wheels\/wheel-pick/.test(p)?'wheel':'');}
  return GAME_KEYS.indexOf(g)>=0?g:'';
}
var GAME=gameKey();

var Local={
  name:'local',
  load:function(){var d=null;try{d=JSON.parse(lsGet(LKEY)||'null')}catch(e){}if(!d||typeof d!=='object')d={};d.players=d.players||{};d.streamers=d.streamers||{};
    /* the old demo mode (removed Nov 2026) left test entries on this device: drop them */
    var drop=0;['players','streamers'].forEach(function(t){Object.keys(d[t]).forEach(function(k){if(/^demo:/.test(k)||d[t][k].demo){delete d[t][k];drop++}})});if(drop)lsSet(LKEY,JSON.stringify(d));return d},
  save:function(d){lsSet(LKEY,JSON.stringify(d))},
  add:function(items){
    var d=Local.load(),now=new Date().toISOString();
    items.forEach(function(it){
      var tb=it.kind==='streamer'?d.streamers:d.players,r=tb[it.id]||{id:it.id,display:it.display||it.id,avatar:'',provider:it.id.split(':')[0],xp:0,level:1,rounds:0,since:now};
      var amt=Math.max(0,Math.min(XP.maxPerCall,it.amount|0));
      r.display=it.display||r.display;if(it.avatar)r.avatar=it.avatar;r.xp+=amt;r.level=levelFor(r.xp);
      r.rounds=(r.rounds||0)+(it.rounds|0);r.updated_at=now;if(!r.since)r.since=now;tb[it.id]=r;
      statLocal(r,it,amt,now);
    });
    Local.save(d);return Promise.resolve(true);
  },
  top:function(kind,n){var d=Local.load(),tb=kind==='streamer'?d.streamers:d.players;
    return Promise.resolve(Object.keys(tb).map(function(k){return tb[k]}).sort(function(a,b){return b.xp-a.xp||String(a.display).localeCompare(String(b.display))}).slice(0,n||50))},
  get:function(kind,id){var d=Local.load(),tb=kind==='streamer'?d.streamers:d.players;return tb[id]||null}
};
/* per-game counters on a local record:
   viewer  r.games[g] = {p: rounds played, w: rounds won, x: XP, t: last played}  + r.played, r.wins, r.streak, r.best
   host    r.host[g]  = {p: rounds hosted, n: players hosted, x: XP, t}          + r.hosted, r.hostedPlayers
   (a streamer record keeps its hosting in r.host too; a friends-mode host is a player record with r.host) */
function statLocal(r,it,amt,now){
  var g=GAME_KEYS.indexOf(it.game)>=0?it.game:'';if(!g)return;
  if(it.host){r.host=r.host||{};var h=r.host[g]||(r.host[g]={p:0,n:0,x:0,t:''});
    h.p+=Math.min(1,it.rounds|0);h.n+=Math.max(0,Math.min(XP.streamer.maxPlayers,it.players|0));h.x+=amt;h.t=now;
    r.hosted=(r.hosted||0)+Math.min(1,it.rounds|0);r.hostedPlayers=(r.hostedPlayers||0)+Math.max(0,Math.min(XP.streamer.maxPlayers,it.players|0));return}
  if(!it.played)return;
  r.games=r.games||{};var s=r.games[g]||(r.games[g]={p:0,w:0,x:0,t:''});
  s.p++;s.x+=amt;s.t=now;r.played=(r.played||0)+1;
  if(it.won){s.w++;r.wins=(r.wins||0)+1;r.streak=(r.streak||0)+1;r.best=Math.max(r.best||0,r.streak)}else r.streak=0;
}
var Supa={
  name:'supabase',on:SB_ON,
  /* the legacy "anon" key is a JWT and also goes as Bearer; a new "sb_publishable_…" key goes in apikey only */
  h:function(){var h={apikey:SB_KEY,'Content-Type':'application/json',Accept:'application/json'};if(/^eyJ/.test(SB_KEY))h.Authorization='Bearer '+SB_KEY;return h},
  add:function(items){
    if(!SB_ON||!items.length||!window.fetch)return Promise.resolve(false);
    return fetch(SB_URL+'/rest/v1/rpc/add_xp_batch',{method:'POST',headers:Supa.h(),body:JSON.stringify({items:items.map(function(it){
      var o={kind:it.kind,id:it.id,display:it.display||'',avatar:it.avatar||'',amount:it.amount|0,rounds:it.rounds|0};
      if(it.game){o.game=it.game;o.played=it.played?1:0;o.won=it.won?1:0;o.players=it.players|0;o.host=it.host?1:0}return o})})})
      .then(function(r){if(!r.ok)throw new Error('supabase '+r.status);return true});
  },
  top:function(kind,n){
    if(!SB_ON||!window.fetch)return Promise.reject(new Error('off'));
    var t=kind==='streamer'?'streamers':'players';
    return fetch(SB_URL+'/rest/v1/'+t+'?select=id,display,avatar,'+(t==='players'?'provider,':'rounds,')+'xp,level,updated_at&order=xp.desc&limit='+(n||50),{headers:Supa.h()})
      .then(function(r){if(!r.ok)throw new Error('supabase '+r.status);return r.json()});
  },
  getOne:function(kind,id){
    if(!SB_ON||!window.fetch)return Promise.reject(new Error('off'));
    var t=kind==='streamer'?'streamers':'players';
    return fetch(SB_URL+'/rest/v1/'+t+'?select=*&id=eq.'+encodeURIComponent(id)+'&limit=1',{headers:Supa.h()})
      .then(function(r){if(!r.ok)throw new Error('supabase '+r.status);return r.json()}).then(function(a){return a&&a[0]||null});
  },
  /* the profile page: per-game rows (kind viewer | streamer) */
  stats:function(id){
    if(!SB_ON||!window.fetch)return Promise.reject(new Error('off'));
    return fetch(SB_URL+'/rest/v1/game_stats?select=kind,game,played,wins,xp,players,last_at&id=eq.'+encodeURIComponent(id),{headers:Supa.h()})
      .then(function(r){if(!r.ok)throw new Error('supabase '+r.status);return r.json()});
  },
  profiles:function(ids){
    if(!SB_ON||!window.fetch||!ids.length)return Promise.reject(new Error('off'));
    var list=ids.map(function(i){return '"'+String(i).replace(/["\\]/g,'')+'"'}).join(',');
    return fetch(SB_URL+'/rest/v1/profiles?select=*&id=in.('+encodeURIComponent(list)+')',{headers:Supa.h()})
      .then(function(r){if(!r.ok)throw new Error('supabase '+r.status);return r.json()});
  },
  saveProfile:function(p){
    if(!SB_ON||!window.fetch)return Promise.reject(new Error('off'));
    return fetch(SB_URL+'/rest/v1/rpc/save_profile',{method:'POST',headers:Supa.h(),body:JSON.stringify(p)})
      .then(function(r){if(!r.ok)throw new Error('supabase '+r.status);return r.json()});
  }
};
/* the online queue: merged per kind+id, sent in one request, kept until Supabase says OK */
function qLoad(){try{var q=JSON.parse(lsGet(QKEY)||'[]');return Array.isArray(q)?q:[]}catch(e){return []}}
function enqueue(items){
  if(!SB_ON||!items.length)return;
  var q=qLoad(),by={};q.forEach(function(it){by[it.kind+'|'+it.id]=it});
  items.forEach(function(it){if(it.game){q.push(it);return}  /* a round with per-game stats travels as it is */
    var k=it.kind+'|'+it.id,o=by[k];if(o&&!o.game){o.amount+=it.amount;o.rounds=(o.rounds|0)+(it.rounds|0);o.display=it.display||o.display;o.avatar=it.avatar||o.avatar}else{o={kind:it.kind,id:it.id,display:it.display,avatar:it.avatar||'',amount:it.amount,rounds:it.rounds|0};by[k]=o;q.push(o)}});
  lsSet(QKEY,JSON.stringify(q.slice(-300)));flushSoon(800);
}
var flushT=0,flushing=false;
function flushSoon(ms){clearTimeout(flushT);flushT=setTimeout(flush,ms||0)}
function flush(){
  if(flushing||!SB_ON)return;var q=qLoad();if(!q.length)return;
  /* the server clamps each call to maxPerCall: split bigger sums into several items */
  var send=[];q.slice(0,100).forEach(function(it){if(it.game){send.push(it);return}var left=it.amount|0,r=it.rounds|0;while(left>0||r>0){var a=Math.min(XP.maxPerCall,Math.max(0,left));send.push({kind:it.kind,id:it.id,display:it.display,avatar:it.avatar,amount:a,rounds:Math.min(r,1)});left-=a;r=Math.max(0,r-1);if(send.length>=150)break;}});
  flushing=true;
  Supa.add(send).then(function(){flushing=false;var cur=qLoad();lsSet(QKEY,JSON.stringify(cur.slice(Math.min(100,q.length))));if(cur.length>100)flushSoon(1500);emit()},
    function(){flushing=false;flushSoon(30000)});
}

/* ---------- who is hosting, and may this page record? ---------- */
function Au(){return window.LammaAuth||null}
function sess(){var L=Au();return L&&L.session?L.session():null}
function mode(){var L=Au();return L&&L.mode?L.mode():'stream'}
function canRecord(){
  if(!A||A.obs)return false;                                   // overlays never record
  var L=Au();if(L&&L.canControl&&!L.canControl(A.channel))return false;   // a locked visitor never records
  return true;
}
/* the host of this page's rounds: {kind,id,display,avatar,online} or null */
function host(){
  var s=sess(),ch=A&&A.channel;
  if(mode()==='friends'){if(!s)return null;return {kind:'player',id:s.provider+':'+(s.provider==='twitch'?s.login:s.id),display:s.display||s.login,avatar:s.avatar||'',online:true}}
  if(!ch)return null;
  var verified=!!(s&&s.provider==='twitch'&&String(s.login).toLowerCase()===ch);
  return {kind:'streamer',id:'twitch:'+ch,display:verified?(s.display||ch):ch,avatar:verified?(s.avatar||''):'',online:verified};
}
function viewerId(u){return 'twitch:'+String(u||'').toLowerCase()}

/* ---------- rounds ---------- */
var R=null,lastAutoHost=0;
function openRound(explicit){R={explicit:!!explicit,at:Date.now(),p:{}};armIdle()}
var idleT=0,autoT=0;
function armIdle(){clearTimeout(idleT);idleT=setTimeout(function(){if(R)closeRound()},XP.idleCloseMin*60000)}
function touch(u,n){
  if(!u)return null;var id=viewerId(u);if(!ID_RE.test(id))return null;
  var h=host();if(h&&id===h.id)return null;                    // the streamer playing in their own round earns as host, not as viewer
  var p=R.p[id];if(!p){p=R.p[id]={id:id,display:clean(n||u,40),win:0};}else if(n)p.display=clean(n,40);
  return p;
}
function roundStart(){if(!canRecord())return;if(R)closeRound();openRound(true)}
/* opts (optional): {players:[[user,name]…], winners:[[user,name]…]} — games with their own player list pass it;
   without it, everyone who wrote in chat during the round counts as having played */
function roundEnd(opts){
  if(!canRecord()){R=null;return}
  if(!R)return;                                                 // nothing open (already closed, or a stop with no round running)
  opts=opts||{};
  if(opts.players&&opts.players.length){var keep={};opts.players.forEach(function(x){var p=touch(x[0],x[1]);if(p)keep[p.id]=1});
    if(R.explicit)Object.keys(R.p).forEach(function(k){if(!keep[k]&&!R.p[k].win)delete R.p[k]});}
  (opts.winners||[]).forEach(function(x){winIn(x[0],x[1],1)});
  closeRound();
}
function winIn(u,n,pts){var p=touch(u,n);if(!p)return;var add=XP.viewer.win+XP.viewer.perPoint*Math.max(0,(pts|0)-1);p.win=Math.min(XP.viewer.maxWinPerRound,p.win+add)}
function chat(m){
  if(!R||!R.explicit||!m||m.broadcaster||m.host)return;
  if(!canRecord())return;
  touch(m.user,m.name);armIdle();
}
function played(u,n){if(!canRecord()||!u)return;if(!R)openRound(false);touch(u,n);autoClose()}
function win(u,n,pts){
  if(!canRecord()||!u||!(pts>0))return;
  if(!R)openRound(false);
  winIn(u,n,pts);autoClose();
}
function autoClose(){if(R&&!R.explicit){clearTimeout(autoT);autoT=setTimeout(function(){if(R&&!R.explicit)closeRound()},4000)}}
function closeRound(){
  clearTimeout(idleT);clearTimeout(autoT);var r=R;R=null;if(!r)return;
  var ids=Object.keys(r.p);if(!ids.length)return;
  var local=[],online=[],h=host();
  ids.forEach(function(id){var p=r.p[id];
    var it={kind:'player',id:id,display:p.display,avatar:'',amount:XP.viewer.play+p.win};
    if(GAME){it.game=GAME;it.played=1;it.won=p.win>0?1:0}local.push(it);
    if(h&&h.online)online.push(it)});
  if(h){
    var hostOk=r.explicit||Date.now()-lastAutoHost>XP.autoRoundSec*1000;
    if(hostOk){lastAutoHost=Date.now();
      var n=Math.min(XP.streamer.maxPlayers,ids.length),hit={kind:h.kind,id:h.id,display:h.display,avatar:h.avatar,amount:XP.streamer.round+XP.streamer.perPlayer*n,rounds:1};
      if(GAME){hit.game=GAME;hit.host=1;hit.players=n}
      local.push(hit);if(h.online)online.push(hit)}
  }
  Local.add(local);enqueue(online);emit();
}
window.addEventListener('pagehide',function(){if(R&&Object.keys(R.p).length)closeRound();try{flush()}catch(e){}});

/* ---------- reading ---------- */
function top(kind,n){
  /* online first; falls back to this device when Supabase is off, empty or unreachable */
  if(!SB_ON)return Local.top(kind,n).then(function(rows){return {rows:rows,source:'local'}});
  return Supa.top(kind,n).then(function(rows){
    if(rows&&rows.length)return {rows:rows,source:'supabase'};
    return Local.top(kind,n).then(function(l){return {rows:l,source:'local',empty:true}});
  },function(){return Local.top(kind,n).then(function(l){return {rows:l,source:'local',error:true}})});
}
function meIds(){var s=sess();if(!s)return [];var ids=[];
  if(s.provider==='twitch'){ids.push({kind:'streamer',id:'twitch:'+s.login});ids.push({kind:'player',id:'twitch:'+s.login})}
  else ids.push({kind:'player',id:s.provider+':'+s.id});return ids}
/* the signed-in person's own level (the best of their streamer / player records on this device) */
function mine(){var best=null;meIds().forEach(function(x){var r=Local.get(x.kind,x.id);if(r&&(!best||r.xp>best.xp))best=r});return best}
function localLevel(id){var d=Local.load(),r=d.players[id]||d.streamers[id];return r?r.level:0}

/* ---------- UI bits: the level badge, the header link ---------- */
var STR={ar:{lv:'المستوى',nav:'لوحة الصدارة',xp:'نقطة خبرة'},en:{lv:'Level',nav:'Leaderboard',xp:'XP'}};
function L(k){var l=A&&A.lang?A.lang():'ar';return (STR[l]||STR.ar)[k]}
function badge(level,cls){var b=document.createElement('span');b.className='lv-badge'+(cls?' '+cls:'');b.textContent='Lv'+(level||1);b.title=L('lv')+' '+(level||1);b.setAttribute('dir','ltr');return b}
/* auth.js calls this on the header "signed in as" chip */
function decorate(chip){
  /* «حسابي»: the chip opens /profile/ and wears the equipped frame, name colour and custom picture */
  try{var P=window.LammaProfile,pid=P&&P.myId(),pp=pid?P.deco(pid):{},av=chip.querySelector('.auth-av'),nm=chip.querySelector('bdi');
    if(av){P.applyFrame(av,pp.frame);if(pp.avatar&&P.imgOk(pp.avatar)){var im=av.querySelector('img');if(!im){while(av.firstChild)av.removeChild(av.firstChild);im=document.createElement('img');im.alt='';av.appendChild(im)}im.src=pp.avatar}}
    if(nm)P.applyColor(nm,pp.name_color);
    if(location.pathname.indexOf('/profile')===0&&!/[?&]id=/.test(location.search))chip.setAttribute('aria-current','page');
  }catch(e){}
  var me=mine();var b=badge(me?me.level:1,'lv-me');if(me){var p=progress(me.xp);b.title=L('lv')+' '+p.level+' · '+me.xp+' '+L('xp')}
  chip.appendChild(b);
  if(SB_ON){var x=meIds()[0];if(x)Supa.getOne(x.kind,x.id).then(function(r){if(r&&r.level){b.textContent='Lv'+r.level;b.title=L('lv')+' '+r.level+' · '+r.xp+' '+L('xp')}},function(){})}
}
function trophy(){var NS='http://www.w3.org/2000/svg',s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.8');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');
  ['M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z','M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3'].forEach(function(d){var p=document.createElementNS(NS,'path');p.setAttribute('d',d);s.appendChild(p)});return s}
function navLink(){
  if(!A||A.obs)return;var end=document.querySelector('header.top .top-end');if(!end)return;
  var a=document.getElementById('lvNav'),M=window.LammaMenu||(window.LammaMenuEnsure&&window.LammaMenuEnsure());
  if(!a){a=document.createElement('a');a.id='lvNav';a.href='/leaderboard/';
    if(M){a.className='lmn-row lv-nav';var ic=document.createElement('span');ic.className='lmn-ico';ic.appendChild(trophy());a.appendChild(ic);
      var tx=document.createElement('span');tx.className='lmn-txt';var lab=document.createElement('span');lab.className='lmn-lab';tx.appendChild(lab);a.appendChild(tx);
      a.addEventListener('click',function(){M.close(true)});M.add('board',a,3)}
    else{a.className='icon-btn lv-nav';a.appendChild(trophy());var lb=document.getElementById('langBtn');end.insertBefore(a,lb&&lb.parentNode===end?lb:null)}}
  a.setAttribute('aria-label',L('nav'));
  var lt=a.querySelector('.lmn-lab');if(lt)lt.textContent=L('nav');else a.title=L('nav');
  if(location.pathname.indexOf('/leaderboard')===0)a.setAttribute('aria-current','page');
}
var fns=[];function onChange(f){fns.push(f)}
function emit(){
  var me=mine();if(me)document.querySelectorAll('.lv-me').forEach(function(b){b.textContent='Lv'+me.level;b.title=L('lv')+' '+me.level+' · '+me.xp+' '+L('xp')});
  fns.forEach(function(f){try{f()}catch(e){console.error(e)}});try{window.dispatchEvent(new CustomEvent('lamma-levels'))}catch(e){}}
window.addEventListener('storage',function(e){if(e.key===LKEY)emit()});


/* =====================================================================================================================
   PROFILES + COSMETICS — window.LammaProfile (used by /profile/, the leaderboard rows, the header chip and the arena skins)
   A profile id is the same id the levels use: "twitch:<login>" for Twitch (viewers from chat included), else "<provider>:<id>".
   Saved on this device ("lamma-profiles"); with Supabase also online through save_profile() (supabase/schema.sql), which
   re-checks every unlock against the XP / wins it holds. Honest limit: with the public key only, the server can't tell WHO
   calls save_profile, so it can't strongly tie an edit to the owner (same as the XP note above).

   UNLOCK RULES (one place — change them here AND in schema.sql's lamma_unlocked()):
   level = the best of the person's viewer / streamer level · wins = rounds won as a viewer (all games)            */
var COS={
  frame:[
    {k:'none',ar:'بلا إطار',en:'No frame',req:{}},
    {k:'bronze',ar:'برونزي',en:'Bronze',req:{lv:3}},
    {k:'silver',ar:'فضي',en:'Silver',req:{lv:5}},
    {k:'gold',ar:'ذهبي',en:'Gold',req:{lv:10}},
    {k:'emerald',ar:'زمردي',en:'Emerald',req:{lv:15}},
    {k:'diamond',ar:'ماسي',en:'Diamond',req:{lv:20}},
    {k:'champion',ar:'بطل',en:'Champion',req:{wins:10}},
    {k:'legend',ar:'أسطورة',en:'Legend',req:{wins:50}}],
  color:[
    {k:'default',ar:'الافتراضي',en:'Default',req:{},c:'#eceefa'},
    {k:'periwinkle',ar:'لون لَمّة',en:'Lamma',req:{},c:'#9AA0D0'},
    {k:'steel',ar:'فولاذي',en:'Steel',req:{lv:2},c:'#b9c2d6'},
    {k:'ice',ar:'ثلجي',en:'Ice',req:{lv:4},c:'#8fd3ff'},
    {k:'emerald',ar:'زمردي',en:'Emerald',req:{lv:6},c:'#3ddc97'},
    {k:'coral',ar:'مرجاني',en:'Coral',req:{lv:8},c:'#ff7a6b'},
    {k:'gold',ar:'ذهبي',en:'Gold',req:{lv:10},c:'#f2c94c'},
    {k:'aurora',ar:'شفق',en:'Aurora',req:{lv:20},c:'#5ee0d0'}],
  banner:[
    {k:'night',ar:'ليل',en:'Night',req:{}},
    {k:'grid',ar:'شبكة',en:'Grid',req:{}},
    {k:'waves',ar:'موج',en:'Waves',req:{lv:2}},
    {k:'steel',ar:'فولاذ',en:'Steel',req:{lv:3}},
    {k:'aurora',ar:'شفق',en:'Aurora',req:{lv:5}},
    {k:'emerald',ar:'زمرد',en:'Emerald',req:{lv:8}},
    {k:'ember',ar:'جمر',en:'Ember',req:{lv:12}},
    {k:'gold',ar:'ذهب',en:'Gold',req:{lv:15}}],
  /* the fighter skin in «معركة الساحة» (official Minecraft head accounts on mc-heads.net); "mc" = your own Minecraft name */
  skin:[
    {k:'steve',ar:'ستيف',en:'Steve',req:{},mc:''},
    {k:'alex',ar:'أليكس',en:'Alex',req:{},mc:'MHF_Alex'},
    {k:'villager',ar:'قروي',en:'Villager',req:{wins:1},mc:'MHF_Villager'},
    {k:'zombie',ar:'زومبي',en:'Zombie',req:{wins:3},mc:'MHF_Zombie'},
    {k:'skeleton',ar:'هيكل عظمي',en:'Skeleton',req:{wins:5},mc:'MHF_Skeleton'},
    {k:'creeper',ar:'كريبر',en:'Creeper',req:{wins:10},mc:'MHF_Creeper'},
    {k:'enderman',ar:'إندرمان',en:'Enderman',req:{wins:25},mc:'MHF_Enderman'},
    {k:'blaze',ar:'بليز',en:'Blaze',req:{wins:50},mc:'MHF_Blaze'},
    {k:'mc',ar:'سكن حسابك في ماينكرافت',en:'Your own Minecraft skin',req:{lv:10},mc:'*'}]
};
function cosItem(type,k){var l=COS[type]||[];for(var i=0;i<l.length;i++)if(l[i].k===k)return l[i];return null}
/* {ok, have, need, pct, by:'lv'|'wins'} for one item at this level / wins */
function unlockState(it,lv,wins){
  var r=it&&it.req||{};
  if(r.lv&&r.lv>1)return {ok:lv>=r.lv,have:lv,need:r.lv,pct:Math.min(1,(lv-1)/(r.lv-1)),by:'lv'};
  if(r.wins)return {ok:wins>=r.wins,have:wins,need:r.wins,pct:Math.min(1,wins/r.wins),by:'wins'};
  return {ok:true,have:0,need:0,pct:1,by:''};
}
var MC_NAME=/^[A-Za-z0-9_]{3,16}$/;
/* a stored skin value: a key from COS.skin, or "mc:<MinecraftName>" */
function skinKey(v){v=String(v||'');return v.indexOf('mc:')===0?'mc':v}
function skinMc(v){v=String(v||'');if(v.indexOf('mc:')===0){var n=v.slice(3);return MC_NAME.test(n)?n:''}var it=cosItem('skin',v);return it&&it.mc!=='*'?it.mc:''}
function isBuiltinBanner(v){return /^b:[a-z]+$/.test(String(v||''))&&!!cosItem('banner',String(v).slice(2))}
function imgOk(v,max){v=String(v||'');if(!v)return true;
  if(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(v))return v.length<=(max||200000);
  return /^https:\/\/[^\s"'<>()]{1,300}$/.test(v)}

var PKEY='lamma-profiles',PCACHE={};
function pAll(){try{var d=JSON.parse(lsGet(PKEY)||'{}');return d&&typeof d==='object'?d:{}}catch(e){return {}}}
function pLocal(id){return pAll()[id]||null}
function pSaveLocal(id,p){var d=pAll();d[id]=p;try{localStorage.setItem(PKEY,JSON.stringify(d));return true}catch(e){return false}}
function myId(){var s=sess();if(!s)return '';return s.provider+':'+(s.provider==='twitch'?String(s.login).toLowerCase():s.id)}
/* this device's records for an id, merged into one view: {player, host, level, wins} */
function localView(id){
  var d=Local.load(),pl=d.players[id]||null,st=d.streamers[id]||null,host={games:{},hosted:0,players:0,xp:st?st.xp:0};
  [st&&st.host,pl&&pl.host].forEach(function(h){if(!h)return;Object.keys(h).forEach(function(g){var a=host.games[g]||(host.games[g]={p:0,n:0,x:0,t:''}),b=h[g];a.p+=b.p|0;a.n+=b.n|0;a.x+=b.x|0;if(b.t>a.t)a.t=b.t;host.hosted+=b.p|0;host.players+=b.n|0})});
  if(st&&!st.host&&st.rounds)host.hosted=Math.max(host.hosted,st.rounds);  // rounds from before the per-game counters
  return {player:pl,streamer:st,host:host,level:Math.max(pl?pl.level:0,st?st.level:0,1),wins:pl?(pl.wins|0):0,since:[pl&&pl.since,st&&st.since].filter(Boolean).sort()[0]||''};
}
/* the same view from Supabase rows */
function serverView(pl,st,rows){
  var v={player:pl?{id:pl.id,display:pl.display,avatar:pl.avatar,xp:pl.xp|0,level:pl.level||levelFor(pl.xp),played:pl.played|0,wins:pl.wins|0,streak:pl.streak|0,best:pl.best_streak|0,since:pl.created_at||'',games:{}}:null,
    streamer:st?{id:st.id,display:st.display,avatar:st.avatar,xp:st.xp|0,level:st.level||levelFor(st.xp),rounds:st.rounds|0,since:st.created_at||''}:null,host:{games:{},hosted:0,players:0,xp:st?st.xp|0:0}};
  (rows||[]).forEach(function(r){if(GAME_KEYS.indexOf(r.game)<0)return;
    if(r.kind==='viewer'){if(!v.player)v.player={id:'',xp:0,level:1,played:0,wins:0,streak:0,best:0,games:{}};v.player.games[r.game]={p:r.played|0,w:r.wins|0,x:r.xp|0,t:r.last_at||''}}
    else{v.host.games[r.game]={p:r.played|0,n:r.players|0,x:r.xp|0,t:r.last_at||''};v.host.hosted+=r.played|0;v.host.players+=r.players|0}});
  if(st&&!v.host.hosted)v.host.hosted=st.rounds|0;
  v.level=Math.max(v.player?v.player.level:0,v.streamer?v.streamer.level:0,1);v.wins=v.player?v.player.wins:0;
  v.since=[v.player&&v.player.since,v.streamer&&v.streamer.since].filter(Boolean).sort()[0]||'';
  return v;
}
/* everything the profile page shows for one id → Promise<{id, profile, view, source}> */
function loadProfile(id){
  var lp=pLocal(id),lv=localView(id);
  function local(extra){return Object.assign({id:id,profile:lp||{},view:lv,source:'local'},extra||{})}
  if(!SB_ON)return Promise.resolve(local());
  var tw=/^twitch:/.test(id);
  return Promise.all([Supa.getOne('player',id).catch(function(){return null}),tw?Supa.getOne('streamer',id).catch(function(){return null}):Promise.resolve(null),
      Supa.stats(id),Supa.profiles([id]).then(function(a){return a&&a[0]||null})]).then(function(r){
    if(!r[0]&&!r[1]&&!r[2].length&&!r[3])return local({empty:true});
    var sp=r[3]||{};PCACHE[id]=sp;
    var prof=Object.assign({},sp);if(lp&&lp.updated_at&&(!sp.updated_at||lp.updated_at>sp.updated_at))prof=Object.assign(prof,lp);
    return {id:id,profile:prof,view:serverView(r[0],r[1],r[2]),source:'supabase'};
  },function(){return local({error:true})});
}
/* clamp a profile to what this level / wins unlock (the server does the same) */
function sanitize(p,lv,wins){
  var o={};
  o.bio=clean(p.bio,160);
  o.fav_game=GAME_KEYS.indexOf(p.fav_game)>=0?p.fav_game:'';
  o.avatar=imgOk(p.avatar,200000)?String(p.avatar||''):'';
  var b=String(p.banner||'');o.banner=isBuiltinBanner(b)?(unlockState(cosItem('banner',b.slice(2)),lv,wins).ok?b:''):(imgOk(b,200000)?b:'');
  ['frame','color'].forEach(function(t){var f=t==='color'?'name_color':'frame',it=cosItem(t,p[f]);o[f]=it&&unlockState(it,lv,wins).ok&&it.k!=='none'&&it.k!=='default'?it.k:''});
  var sk=String(p.skin||''),si=cosItem('skin',skinKey(sk));o.skin=si&&unlockState(si,lv,wins).ok&&si.k!=='steve'&&(si.k!=='mc'||skinMc(sk))?sk:'';
  return o;
}
function saveProfile(patch){
  var id=myId();if(!id)return Promise.reject(new Error('signed-out'));
  var cur=pLocal(id)||{},v=localView(id);
  function finish(lv,wins){
    var p=sanitize(Object.assign({},cur,patch),lv,wins);p.updated_at=new Date().toISOString();p.since=cur.since||p.updated_at;
    var s=sess();p.display=clean(s&&(s.display||s.login),40);
    if(!pSaveLocal(id,p))return Promise.reject(new Error('quota'));
    PCACHE[id]=p;LCACHE[id]=p;emitP(id);
    if(!SB_ON)return Promise.resolve({profile:p,online:false});
    return Supa.saveProfile({p_id:id,p_display:p.display,p_avatar:p.avatar,p_banner:p.banner,p_bio:p.bio,p_frame:p.frame,p_name_color:p.name_color,p_skin:p.skin,p_fav_game:p.fav_game})
      .then(function(row){var r=Array.isArray(row)?row[0]:row;if(r&&r.id){PCACHE[id]=r}return {profile:p,online:true,server:r}},function(e){return {profile:p,online:false,error:String(e&&e.message||e)}});
  }
  if(!SB_ON)return finish(v.level,v.wins);
  return loadProfile(id).then(function(x){return finish(Math.max(v.level,x.view.level),Math.max(v.wins,x.view.wins))},function(){return finish(v.level,v.wins)});
}
/* the cosmetics shown next to a name elsewhere (leaderboard rows, header, arena): cached, fetched in batches */
var want={},wantT=0,LCACHE={};
function lc(id){var l=LCACHE[id];if(l===undefined)l=LCACHE[id]=pLocal(id)||null;return l}
function deco(id){
  if(!id)return {};var p=PCACHE[id];if(p!==undefined)return p||{};
  if(SB_ON&&!want[id]){want[id]=1;if(!wantT)wantT=setTimeout(fetchWanted,250)}
  return lc(id)||{};
}
function fetchWanted(){wantT=0;var ids=Object.keys(want).filter(function(i){return PCACHE[i]===undefined}).slice(0,60);want={};if(!ids.length)return;
  ids.forEach(function(i){PCACHE[i]=lc(i)});
  Supa.profiles(ids).then(function(rows){(rows||[]).forEach(function(r){if(r&&r.id){var lp=pLocal(r.id);PCACHE[r.id]=lp&&lp.updated_at>(r.updated_at||'')?lp:r}});emitP()},function(){});}
var pfns=[];function onProfile(f){pfns.push(f)}
function emitP(id){pfns.forEach(function(f){try{f(id)}catch(e){console.error(e)}});try{window.dispatchEvent(new CustomEvent('lamma-profile',{detail:id||''}))}catch(e){}}
function applyFrame(el,frame){if(!el)return;el.className=el.className.replace(/\s*pf-fr(-[a-z]+)?/g,'');if(frame&&frame!=='none'&&cosItem('frame',frame))el.className+=' pf-fr pf-fr-'+frame}
function applyColor(el,c){if(!el)return;el.className=el.className.replace(/\s*pf-nc-[a-z]+/g,'');if(c&&c!=='default'&&cosItem('color',c))el.className+=' pf-nc-'+c}
function profileUrl(id){return '/profile/?id='+encodeURIComponent(id)}
/* the arena: the fighter skin a viewer equipped on their profile (used when they did not pick one with !سكن) */
function skinOf(login){var id='twitch:'+String(login||'').toLowerCase();var p=deco(id);return p&&p.skin?skinMc(p.skin):''}
window.addEventListener('storage',function(e){if(e.key===PKEY){PCACHE={};LCACHE={};emitP()}});
window.LammaProfile={COS:COS,GAMES:GAMES,game:GAME,item:cosItem,unlockState:unlockState,skinMc:skinMc,skinKey:skinKey,isBuiltinBanner:isBuiltinBanner,imgOk:imgOk,
  myId:myId,local:pLocal,localView:localView,load:loadProfile,save:saveProfile,sanitize:sanitize,deco:deco,onChange:onProfile,applyFrame:applyFrame,applyColor:applyColor,url:profileUrl,skinOf:skinOf};

window.LammaLevels={XP:XP,levelFor:levelFor,xpFor:xpFor,progress:progress,backend:SB_ON?'supabase':'local',online:SB_ON,
  roundStart:roundStart,roundEnd:roundEnd,chat:chat,played:played,win:win,flush:flush,
  top:top,mine:mine,localLevel:localLevel,local:Local,supabase:Supa,host:host,canRecord:canRecord,
  badge:badge,decorate:decorate,onChange:onChange,games:GAMES,game:GAME};
if(A&&!A.obs){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',navLink);else navLink();
  if(A.onLang)A.onLang(navLink);
  onChange(function(){if(A.renderBoard)A.renderBoard()});
  setTimeout(function(){if(A.renderBoard)A.renderBoard()},0);
  if(SB_ON)flushSoon(2000);
}
})();
