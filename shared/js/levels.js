/* levels.js — levels for everyone + «لوحة الصدارة» for لَمّة | Lamma.
   Loaded after app.js, auth-config.js and auth.js on every page (the game pages call it through App: A.roundStart(), A.roundEnd(),
   A.xpPlay(), A.xpWin(), and App.award() feeds it for every winner the games already score).

   WHO EARNS WHAT  (one place: LammaLevels.XP below — change the numbers there)
   • Viewer (a Twitch chatter, id "twitch:<login>"): +play for taking part in a round (once per round), +win for winning,
     plus +perPoint for every point above 1 a game gives (trivia's fastest = 3 pts, codenames = 2 …), capped per round.
   • Streamer (the signed-in Twitch owner of the channel, id "twitch:<login>"): +round for every round that ends with ≥1 player,
     plus +perPlayer for each viewer who played in it (capped).
   • With friends (no stream): the host is the signed-in person (any provider); hosting XP goes to their own player level.
   • Demo chatters (demo mode) count only on this device, never online.
   LEVEL CURVE: level 1 at 0 XP; level n needs 100·(n−1)^1.5 cumulative XP  (Lv2 100, Lv3 283, Lv5 800, Lv10 2 700, Lv20 8 282).

   STORAGE (pluggable): always LOCAL (localStorage "lamma-levels", works today, this device only); and SUPABASE as well once
   SUPABASE_URL + SUPABASE_ANON_KEY are filled in auth-config.js — plain fetch to Supabase REST, all writes through the
   add_xp_batch() SQL function (supabase/schema.sql), queued in localStorage and retried if offline.
   Honest limit: a game that runs in the browser can't fully stop cheating; the SQL function clamps every call and every hour. */
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
var ID_RE=/^(twitch|discord|google|guest|demo):[^\s:<>"']{1,64}$/;

var Local={
  name:'local',
  load:function(){var d=null;try{d=JSON.parse(lsGet(LKEY)||'null')}catch(e){}if(!d||typeof d!=='object')d={};d.players=d.players||{};d.streamers=d.streamers||{};return d},
  save:function(d){lsSet(LKEY,JSON.stringify(d))},
  add:function(items){
    var d=Local.load(),now=new Date().toISOString();
    items.forEach(function(it){
      var tb=it.kind==='streamer'?d.streamers:d.players,r=tb[it.id]||{id:it.id,display:it.display||it.id,avatar:'',provider:it.id.split(':')[0],xp:0,level:1,rounds:0};
      r.display=it.display||r.display;if(it.avatar)r.avatar=it.avatar;r.xp+=Math.max(0,Math.min(XP.maxPerCall,it.amount|0));r.level=levelFor(r.xp);
      r.rounds=(r.rounds||0)+(it.rounds|0);r.updated_at=now;if(it.demo)r.demo=true;tb[it.id]=r;
    });
    Local.save(d);return Promise.resolve(true);
  },
  top:function(kind,n){var d=Local.load(),tb=kind==='streamer'?d.streamers:d.players;
    return Promise.resolve(Object.keys(tb).map(function(k){return tb[k]}).sort(function(a,b){return b.xp-a.xp||String(a.display).localeCompare(String(b.display))}).slice(0,n||50))},
  get:function(kind,id){var d=Local.load(),tb=kind==='streamer'?d.streamers:d.players;return tb[id]||null}
};
var Supa={
  name:'supabase',on:SB_ON,
  /* the legacy "anon" key is a JWT and also goes as Bearer; a new "sb_publishable_…" key goes in apikey only */
  h:function(){var h={apikey:SB_KEY,'Content-Type':'application/json',Accept:'application/json'};if(/^eyJ/.test(SB_KEY))h.Authorization='Bearer '+SB_KEY;return h},
  add:function(items){
    if(!SB_ON||!items.length||!window.fetch)return Promise.resolve(false);
    return fetch(SB_URL+'/rest/v1/rpc/add_xp_batch',{method:'POST',headers:Supa.h(),body:JSON.stringify({items:items.map(function(it){
      return {kind:it.kind,id:it.id,display:it.display||'',avatar:it.avatar||'',amount:it.amount|0,rounds:it.rounds|0}})})})
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
    return fetch(SB_URL+'/rest/v1/'+t+'?select=id,display,avatar,xp,level&id=eq.'+encodeURIComponent(id)+'&limit=1',{headers:Supa.h()})
      .then(function(r){if(!r.ok)throw new Error('supabase '+r.status);return r.json()}).then(function(a){return a&&a[0]||null});
  }
};
/* the online queue: merged per kind+id, sent in one request, kept until Supabase says OK */
function qLoad(){try{var q=JSON.parse(lsGet(QKEY)||'[]');return Array.isArray(q)?q:[]}catch(e){return []}}
function enqueue(items){
  if(!SB_ON||!items.length)return;
  var q=qLoad(),by={};q.forEach(function(it){by[it.kind+'|'+it.id]=it});
  items.forEach(function(it){var k=it.kind+'|'+it.id,o=by[k];if(o){o.amount+=it.amount;o.rounds=(o.rounds|0)+(it.rounds|0);o.display=it.display||o.display;o.avatar=it.avatar||o.avatar}else{o={kind:it.kind,id:it.id,display:it.display,avatar:it.avatar||'',amount:it.amount,rounds:it.rounds|0};by[k]=o;q.push(o)}});
  lsSet(QKEY,JSON.stringify(q.slice(-300)));flushSoon(800);
}
var flushT=0,flushing=false;
function flushSoon(ms){clearTimeout(flushT);flushT=setTimeout(flush,ms||0)}
function flush(){
  if(flushing||!SB_ON)return;var q=qLoad();if(!q.length)return;
  /* the server clamps each call to maxPerCall: split bigger sums into several items */
  var send=[];q.slice(0,100).forEach(function(it){var left=it.amount|0,r=it.rounds|0;while(left>0||r>0){var a=Math.min(XP.maxPerCall,Math.max(0,left));send.push({kind:it.kind,id:it.id,display:it.display,avatar:it.avatar,amount:a,rounds:Math.min(r,1)});left-=a;r=Math.max(0,r-1);if(send.length>=150)break;}});
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
function viewerId(u,demo){u=String(u||'').toLowerCase();return demo?'demo:'+u.replace(/^demo_/,''):'twitch:'+u}
function isDemoUser(u){return /^demo_/.test(String(u||''))}

/* ---------- rounds ---------- */
var R=null,lastAutoHost=0;
function openRound(explicit){R={explicit:!!explicit,at:Date.now(),p:{},demo:A&&A.demo&&A.demo()};armIdle()}
var idleT=0,autoT=0;
function armIdle(){clearTimeout(idleT);idleT=setTimeout(function(){if(R)closeRound()},XP.idleCloseMin*60000)}
function touch(u,n,demo){
  if(!u)return null;var id=viewerId(u,demo);if(!ID_RE.test(id))return null;
  var h=host();if(h&&id===h.id)return null;                    // the streamer playing in their own round earns as host, not as viewer
  var p=R.p[id];if(!p){p=R.p[id]={id:id,display:clean(n||u,40),win:0,demo:!!demo};}else if(n)p.display=clean(n,40);
  return p;
}
function roundStart(){if(!canRecord())return;if(R)closeRound();openRound(true)}
/* opts (optional): {players:[[user,name]…], winners:[[user,name]…]} — games with their own player list pass it;
   without it, everyone who wrote in chat during the round counts as having played */
function roundEnd(opts){
  if(!canRecord()){R=null;return}
  if(!R)return;                                                 // nothing open (already closed, or a stop with no round running)
  opts=opts||{};
  if(opts.players&&opts.players.length){var keep={};opts.players.forEach(function(x){var p=touch(x[0],x[1],isDemoUser(x[0])||R.demo);if(p)keep[p.id]=1});
    if(R.explicit)Object.keys(R.p).forEach(function(k){if(!keep[k]&&!R.p[k].win)delete R.p[k]});}
  (opts.winners||[]).forEach(function(x){winIn(x[0],x[1],1)});
  closeRound();
}
function winIn(u,n,pts){var p=touch(u,n,isDemoUser(u)||(R&&R.demo));if(!p)return;var add=XP.viewer.win+XP.viewer.perPoint*Math.max(0,(pts|0)-1);p.win=Math.min(XP.viewer.maxWinPerRound,p.win+add)}
function chat(m){
  if(!R||!R.explicit||!m||m.broadcaster||m.host)return;
  if(!canRecord())return;
  touch(m.user,m.name,!!m.fake);armIdle();
}
function played(u,n){if(!canRecord()||!u)return;if(!R)openRound(false);touch(u,n,isDemoUser(u)||(A.demo&&A.demo()));autoClose()}
function win(u,n,pts){
  if(!canRecord()||!u||!(pts>0))return;
  if(!R)openRound(false);
  winIn(u,n,pts);autoClose();
}
function autoClose(){if(R&&!R.explicit){clearTimeout(autoT);autoT=setTimeout(function(){if(R&&!R.explicit)closeRound()},4000)}}
function closeRound(){
  clearTimeout(idleT);clearTimeout(autoT);var r=R;R=null;if(!r)return;
  var ids=Object.keys(r.p);if(!ids.length)return;
  var local=[],online=[],h=host(),realPlayers=0;
  ids.forEach(function(id){var p=r.p[id],amt=XP.viewer.play+p.win;
    var it={kind:'player',id:id,display:p.display,avatar:'',amount:amt,demo:p.demo};local.push(it);
    if(!p.demo){realPlayers++;if(h&&h.online)online.push(it)}});
  if(h){
    var hostOk=r.explicit||Date.now()-lastAutoHost>XP.autoRoundSec*1000;
    if(hostOk){lastAutoHost=Date.now();
      var n=Math.min(XP.streamer.maxPlayers,ids.length),hit={kind:h.kind,id:h.id,display:h.display,avatar:h.avatar,amount:XP.streamer.round+XP.streamer.perPlayer*n,rounds:1,demo:!realPlayers};
      local.push(hit);if(h.online&&realPlayers){var oh={};for(var k in hit)oh[k]=hit[k];oh.amount=XP.streamer.round+XP.streamer.perPlayer*Math.min(XP.streamer.maxPlayers,realPlayers);online.push(oh)}}
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
  var me=mine();var b=badge(me?me.level:1,'lv-me');if(me){var p=progress(me.xp);b.title=L('lv')+' '+p.level+' · '+me.xp+' '+L('xp')}
  chip.appendChild(b);
  if(SB_ON){var x=meIds()[0];if(x)Supa.getOne(x.kind,x.id).then(function(r){if(r&&r.level){b.textContent='Lv'+r.level;b.title=L('lv')+' '+r.level+' · '+r.xp+' '+L('xp')}},function(){})}
}
function trophy(){var NS='http://www.w3.org/2000/svg',s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.8');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');
  ['M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z','M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3'].forEach(function(d){var p=document.createElementNS(NS,'path');p.setAttribute('d',d);s.appendChild(p)});return s}
function navLink(){
  if(!A||A.obs)return;var end=document.querySelector('header.top .top-end');if(!end)return;
  var a=document.getElementById('lvNav');
  if(!a){a=document.createElement('a');a.id='lvNav';a.className='icon-btn lv-nav';a.href='/leaderboard/';a.appendChild(trophy());
    var lb=document.getElementById('langBtn');end.insertBefore(a,lb||null);}
  a.setAttribute('aria-label',L('nav'));a.title=L('nav');
  if(location.pathname.indexOf('/leaderboard')===0)a.setAttribute('aria-current','page');
}
var fns=[];function onChange(f){fns.push(f)}
function emit(){
  var me=mine();if(me)document.querySelectorAll('.lv-me').forEach(function(b){b.textContent='Lv'+me.level;b.title=L('lv')+' '+me.level+' · '+me.xp+' '+L('xp')});
  fns.forEach(function(f){try{f()}catch(e){console.error(e)}});try{window.dispatchEvent(new CustomEvent('lamma-levels'))}catch(e){}}
window.addEventListener('storage',function(e){if(e.key===LKEY)emit()});

window.LammaLevels={XP:XP,levelFor:levelFor,xpFor:xpFor,progress:progress,backend:SB_ON?'supabase':'local',online:SB_ON,
  roundStart:roundStart,roundEnd:roundEnd,chat:chat,played:played,win:win,flush:flush,
  top:top,mine:mine,localLevel:localLevel,local:Local,supabase:Supa,host:host,canRecord:canRecord,
  badge:badge,decorate:decorate,onChange:onChange};
if(A&&!A.obs){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',navLink);else navLink();
  if(A.onLang)A.onLang(navLink);
  onChange(function(){if(A.renderBoard)A.renderBoard()});
  setTimeout(function(){if(A.renderBoard)A.renderBoard()},0);
  if(SB_ON)flushSoon(2000);
}
})();
