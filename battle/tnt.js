/* tnt.js — اهرب من الـTNT / TNT Run: Kukoro's "Blade" game in the Minecraft-Dungeons voxel look.
   Kukoro (watched in real streams): a square platform over water split in two by a line; chat moves with !l / !r; "a blade will
   pass every 20–30 seconds to kill the most crowded side"; survivors go on, rounds count up, the last one standing wins.
   Ours: a floating voxel platform ringed with TNT, split into two (or three) zones by an iron fence. The zone with the MOST people
   is the one whose fuses are lit (live: it flips as people move), the timer runs out, that zone blows up (blocks fly, players fall),
   the floor rebuilds and the next round is faster. Chat: !يسار / !يمين (!l / !r), !نص (!m) with 3 zones. Engine: BT.Tnt (btcore.js). */
(function(){
'use strict';
var A=window.App,BT=window.BT,MC=window.MC,$=A.$;
A.strings({
 ar:{g_title:'اهرب من الـTNT',g_how:'الشات بيدخل بـ !دخول ويوقف عالمنصة. كل جولة الجهة اللي فيها ناس أكتر بيولّع فيها الـTNT وبتنفجر لما يخلص الوقت. انتقلو بـ !يمين و !يسار. آخر واحد بيضل هو البطل.',
  tn_start:'ابدأ اللعبة',tn_boom:'فجّر هلأ 💥',tn_next:'الجولة الجاية',tn_again:'العب مرة تانية',tn_pause:'وقف مؤقت',tn_resume:'كمّل',tn_new:'لعبة جديدة (نفس اللاعبين)',tn_clear:'مسح الكل',
  tn_hint:'الشات بيدخل بـ !دخول. بالجولة: !يمين أو !يسار (!r / !l). الجهة اللي فيها ناس أكتر هي اللي بتنفجر، فخبّو حالكن بالجهة الفاضية.',
  bt_settings:'الإعدادات',tn_secs:'وقت الجولة',tn_zones:'عدد الجهات',tn_z2:'جهتين (يمين / يسار)',tn_z3:'تلات جهات (+ النص)',tn_speed:'الجولات بتسرع',tn_sp0:'لا',tn_sp1:'شوي',tn_sp2:'عادي',tn_sp3:'كتير',bt_more:'خيارات زيادة',
  tn_jit:'وقت عشوائي ±5 ث (متل كوكيرو)',tn_auto:'الجولة الجاية لحالها',bt_join_t:'وقت الدخول',bt_av:'صور تويتش على الراس',bt_map:'الخريطة',tn_names:'أسامي فوق الراس',
  bt_nolimit:'بلا وقت',bt_manual:'إنت بتضغط',bt_sec:'ث',map_plains:'سهول',map_desert:'صحراء',map_nether:'النذر',map_end:'النهاية',map_cave:'الكهف',
  tn_round:'الجولة {r}',tn_lobby:'الدخول مفتوح',tn_alive:'{a} من {n} عايشين',tn_players:'{n} لاعب',tn_warn:'💣 الجهة اللي فيها ناس أكتر بتنفجر!',tn_manual_w:'الستريمر بيفجّر…',
  tn_zl:'يسار',tn_zr:'يمين',tn_zm:'النص',tn_blow:'هون رح تنفجر!',tn_join_box:'اكتب {j} لتدخل',tn_join_box2:'انتقل: {a}',
  tn_boomed:'💥 انفجرت جهة {z}! طلع {n}',tn_safe0:'💥 انفجرت جهة {z} وهي فاضية!',tn_allout:'💥 كلّن كانو بنفس الجهة!',tn_last:'ضل {n} بس!',tn_win_one:'البطل',tn_win_t:'الفايزين',tn_rank:'الترتيب',tn_r_out:'طلع بالجولة {r}',tn_need:'لازم لاعب واحد عالأقل',
  tn_st_lobby:'الدخول مفتوح: {n} لاعب. اضغط "ابدأ اللعبة".',tn_st_fuse:'الجولة {r}: الجهة الأكتر ناس ({z}) مولّعة. {a} عايشين.',tn_st_boom:'انفجرت جهة {z}. ضل {a}.',tn_st_end:'خلصت! {w}',tn_st_paused:'موقّفة',
  tn_info:'عايش · بجهة {z}',tn_info_out:'طلع بالجولة {r}',tn_info_w:'ربح {w} مرة',
  bt_c_join:'دخول',bt_c_lr:'روح يسار / يمين',bt_c_m:'روح عالنص (3 جهات)',bt_c_info:'معلوماتك',bt_c_cstart:'بلّش',bt_c_cnext:'فجّر هلأ / الجولة الجاية',bt_c_pause:'وقف مؤقت'},
 en:{g_title:'TNT Run',g_how:'Chat joins with !join and stands on the platform. Every round the side with MORE people gets its TNT lit and blows up when the timer runs out. Move with !r and !l. The last one standing wins.',
  tn_start:'Start game',tn_boom:'Blow it now 💥',tn_next:'Next round',tn_again:'Play again',tn_pause:'Pause',tn_resume:'Resume',tn_new:'New game (same players)',tn_clear:'Clear all',
  tn_hint:'Chat joins with !join. During a round: !r or !l (!يمين / !يسار). The side with more people is the one that blows, so hide on the emptier side.',
  bt_settings:'Settings',tn_secs:'Round time',tn_zones:'Sides',tn_z2:'Two (left / right)',tn_z3:'Three (+ middle)',tn_speed:'Rounds speed up',tn_sp0:'No',tn_sp1:'A bit',tn_sp2:'Normal',tn_sp3:'A lot',bt_more:'More options',
  tn_jit:'Random ±5 s (like Kukoro)',tn_auto:'Next round by itself',bt_join_t:'Join time',bt_av:'Twitch pictures on heads',bt_map:'Map',tn_names:'Names over heads',
  bt_nolimit:'No limit',bt_manual:'You press',bt_sec:'s',map_plains:'Plains',map_desert:'Desert',map_nether:'Nether',map_end:'The End',map_cave:'Cave',
  tn_round:'Round {r}',tn_lobby:'Lobby open',tn_alive:'{a} of {n} alive',tn_players:'{n} players',tn_warn:'💣 The side with more people blows up!',tn_manual_w:'The streamer blows it…',
  tn_zl:'Left',tn_zr:'Right',tn_zm:'Middle',tn_blow:'This side blows!',tn_join_box:'Type {j} to join',tn_join_box2:'Move: {a}',
  tn_boomed:'💥 The {z} side blew up! {n} out',tn_safe0:'💥 The {z} side blew up — empty!',tn_allout:'💥 Everyone was on the same side!',tn_last:'Only {n} left!',tn_win_one:'Champion',tn_win_t:'Winners',tn_rank:'Ranking',tn_r_out:'out in round {r}',tn_need:'Needs at least one player',
  tn_st_lobby:'Lobby open: {n} players. Press "Start game".',tn_st_fuse:'Round {r}: the most crowded side ({z}) is lit. {a} alive.',tn_st_boom:'The {z} side blew up. {a} left.',tn_st_end:'Over! {w}',tn_st_paused:'Paused',
  tn_info:'alive · {z} side',tn_info_out:'out in round {r}',tn_info_w:'{w} wins',
  bt_c_join:'Join',bt_c_lr:'Go left / right',bt_c_m:'Go to the middle (3 sides)',bt_c_info:'Your info',bt_c_cstart:'Start',bt_c_cnext:'Blow now / next round',bt_c_pause:'Pause'}
});
function T(k,o){var s=A.t(k);if(o)Object.keys(o).forEach(function(x){s=s.split('{'+x+'}').join(o[x])});return s;}
var EN=function(){return A.lang()==='en'};
var MAPS=['plains','desert','nether','end','cave'];
var KEY='lamma-tn-'+A.channel,store=BT.store(KEY),sv=A.obs?null:store.get();
var CFG={secs:25,zones:2,speed:'2',jit:true,auto:3,join:0,av:true,map:'nether',names:true};
var SPEED={'0':1,'1':.95,'2':.9,'3':.82};
var Q=A.Q;if(A.obs){if(Q.get('sc')!=null)CFG.secs=+Q.get('sc')||0;if(Q.get('zn'))CFG.zones=+Q.get('zn')===3?3:2;if(Q.get('map')&&MAPS.indexOf(Q.get('map'))>=0)CFG.map=Q.get('map');if(Q.get('av'))CFG.av=Q.get('av')==='1';if(Q.get('sp'))CFG.speed=Q.get('sp');}
else if(sv&&sv.cfg)Object.keys(CFG).forEach(function(k){if(sv.cfg[k]!=null)CFG[k]=sv.cfg[k]});
var G=new BT.Tnt({cfg:{zones:CFG.zones,secs:CFG.secs,jitter:CFG.jit,speed:SPEED[CFG.speed]||.9,autoNext:CFG.auto>0,boomSecs:Math.max(2.4,CFG.auto||2.6)}});
if(sv&&sv.wins)G.wins=sv.wins;
function apply(){G.cfg.secs=+CFG.secs;G.cfg.jitter=!!CFG.jit;G.cfg.speed=SPEED[CFG.speed]||.9;G.cfg.autoNext=CFG.auto>0;G.cfg.boomSecs=Math.max(2.4,+CFG.auto||2.6);if(G.phase==='lobby'&&G.cfg.zones!==+CFG.zones){G.cfg.zones=+CFG.zones;G.order.forEach(function(u){var p=G.players[u];if(p.zone>=G.cfg.zones)p.zone=0;});}}
/* shared levels with the arena (one XP per viewer per channel) */
var XPKEY='lamma-ba-'+A.channel;
function addXp(map){if(A.obs)return;try{var s=JSON.parse(localStorage.getItem(XPKEY)||'{}');s.xp=s.xp||{};Object.keys(map).forEach(function(u){s.xp[u]=(s.xp[u]||0)+map[u];});localStorage.setItem(XPKEY,JSON.stringify(s));}catch(e){}}
function lvOf(u){try{var s=JSON.parse(localStorage.getItem(XPKEY)||'{}');return BT.lvlOf((s.xp||{})[u]);}catch(e){return 10;}}
function save(){if(A.obs)return;store.set({cfg:CFG,wins:G.wins});A.updateObsUrl();}
A.obsExtra(function(){return '&sc='+CFG.secs+'&zn='+CFG.zones+'&map='+CFG.map+'&av='+(CFG.av?1:0)+'&sp='+CFG.speed;});
var P=G.pub();

/* ---------- engine (control page, or the overlay on its own from mods' chat) ---------- */
function engine(){return A.runsEngine();}
var lastT=performance.now(),pubAt=0,joinEnd=0,tick=0;
setInterval(function(){var now=performance.now(),dt=(now-lastT)/1000;lastT=now;if(!engine())return;var ph=G.phase,r=G.round;G.step(dt);
  if(G.phase!==ph||G.round!==r){if(G.phase==='boom'){var xp={};G.alive().forEach(function(u){xp[u]=5;});addXp(xp);}if(G.phase==='end'){var xw={};G.winners.forEach(function(u){xw[u]=50;});addXp(xw);save();A.roundEnd({players:G.order.map(function(u){return [u,(G.players[u]||{}).name]}),winners:G.winners.map(function(u){return [u,(G.players[u]||{}).name]})});}}
  if(G.phase==='fuse'&&G.end){var left=Math.ceil(G.end-G.t);if(left<=5&&left>0&&left!==tick){tick=left;A.sfx('tick');}}
  P=G.pub();if(now-pubAt>110){pubAt=now;A.publish(P);}
  if(G.phase==='lobby'&&joinEnd&&Date.now()>=joinEnd){joinEnd=0;startGame();}
},50);
A.onMirror(function(s){if(s&&s.p)P=s;});
A.allowSolo();
function startGame(){apply();if(!G.start()){status(T('tn_need'));return;}A.roundStart();A.sfx('start');P=G.pub();A.publish(P);hud(true);}
function pauseT(){if(G.phase!=='fuse'&&G.phase!=='boom')return;G.paused=!G.paused;P=G.pub();A.publish(P);hud(true);}
function go(){if(G.phase==='lobby'||G.phase==='end'){startGame();return;}G.next();P=G.pub();A.publish(P);hud(true);}
function newGame(){var keep=G.order.map(function(u){var p=G.players[u];return [u,p.name,p.color];});G.reset();apply();keep.forEach(function(k){G.join(k[0],k[1],k[2]);});V={};P=G.pub();A.publish(P);hud(true);}
function clearAll(){G.reset();apply();V={};P=G.pub();A.publish(P);hud(true);}
A.onChat(function(m){if(!engine())return;var c=BT.cmd(m.text);
  if(c&&BT.MODK[c.k]&&A.isCtrl(m)){if(c.k==='start'){if(G.paused)pauseT();else if(G.phase==='lobby'||G.phase==='end')startGame();}else if(c.k==='next')go();else if(c.k==='pause')pauseT();else if(c.k==='reset')newGame();return;}
  if(c&&c.k==='join'){G.join(m.user,m.name,m.color);return;}if(c&&c.k==='leave'){G.leave(m.user);return;}if(c&&c.k==='info'){G.askInfo(m.user);return;}
  var z=BT.zoneCmd(m.text,G.cfg.zones);if(z>=0)G.move(m.user,z,m.name,m.color);});

/* ---------- view ---------- */
var STG=$('stage'),cv=$('tnCanvas'),ctx=cv.getContext('2d'),W=0,H=0,DPR=1,iso=new MC.OIso(ctx,{tw:40});
var V={},parts=[],lastEv=0,shake=0,flashT=0,holes={},t0=performance.now(),prev=t0,hudT=0,lay=null,layKey='';
var ZW=9,ROWS=10;
function cols(){return P.z===3?ZW*3+2:ZW*2+1;}
function zoneX0(z){return z*(ZW+1);}
function size(){var r=cv.parentNode.getBoundingClientRect();var w=Math.max(200,Math.round(r.width)),h=Math.max(120,Math.round(r.height));var d=Math.min(2,window.devicePixelRatio||1);if(w!==W||h!==H||d!==DPR){W=w;H=h;DPR=d;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);layKey='';}}
function fit(){var C=cols(),sk=.28;var u=Math.min(W*.95/(C+ROWS*sk),H*.7/(ROWS*.7+1.6*.78));var ph=ROWS*.7*u;iso.set({tw:u,v:u*.7,sk:sk,zh:u*.78,ox:(W-(C+ROWS*sk)*u)/2,oy:Math.max(H*.19,(H-ph)/2-u*.6)});iso.dpr=DPR;}
var TNT_TOP=null;function tntTop(){if(TNT_TOP)return TNT_TOP;TNT_TOP=MC.pix(['wwwwwwww','wkwwwwkw','wwkwwkww','wwwkkwww','wwwkkwww','wwkwwkww','wkwwwwkw','wwwwwwww'],{w:'#e8e2da',k:'#3a3030'});return TNT_TOP;}
function floorTex(map,x,y){var M=MC.MAPS[map]||MC.MAPS.plains;var f=M.floor;return MC.tex(f[(x*7+y*13)%f.length],1+((x*3+y*5)%3));}
/* the static layers: background + under-platform rock + fence, and one layer per zone (its floor + its TNT ring) */
function layers(){var key=[P.z,CFG.map,W,H,DPR].join('|');if(lay&&layKey===key)return lay;fit();var M=MC.MAPS[CFG.map]||MC.MAPS.plains,C=cols();
  function mkL(){var c=MC.mk(Math.round(W*DPR),Math.round(H*DPR));var g=c.getContext('2d');g.imageSmoothingEnabled=false;return c;}
  var bg=mkL(),g=bg.getContext('2d');g.setTransform(DPR,0,0,DPR,0,0);
  var gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,M.sky[0]);gr.addColorStop(1,M.sky[1]);g.fillStyle=gr;g.fillRect(0,0,W,H);
  var rr=MC.rng(9),bs=Math.max(8,Math.round(W/70));for(var layer=0;layer<2;layer++){var base=H*(.3+layer*.08);g.fillStyle=MC.shade(M.sky[0],1.25-layer*.25);var hh=0;for(var i=0;i<W;i+=bs){hh=Math.max(0,Math.min(H*.12,hh+(rr()-.5)*bs*2));g.fillRect(i,base-hh,bs,hh+2);}}
  /* far below: lava / water / void */
  var sea=M.lava?['rgba(255,110,30,0)','rgba(255,120,40,.55)']:M.void?['rgba(80,40,120,0)','rgba(40,20,70,.6)']:['rgba(40,90,160,0)','rgba(50,110,190,.55)'];var sg=g.createLinearGradient(0,H*.62,0,H);sg.addColorStop(0,sea[0]);sg.addColorStop(1,sea[1]);g.fillStyle=sg;g.fillRect(0,H*.62,W,H*.38);
  if(M.void)for(var s=0;s<140;s++){g.fillStyle='rgba(230,210,255,'+(rr()*.6+.1)+')';g.fillRect(rr()*W,rr()*H,1.5,1.5);}
  var I=new MC.OIso(g,{});I.set({tw:iso.tw,v:iso.v,sk:iso.sk,zh:iso.zh,ox:iso.ox,oy:iso.oy});I.dpr=DPR;
  /* floating-island rock under the platform (tapering) */
  var rock=MC.tex(CFG.map==='nether'?'netherrack':CFG.map==='end'?'endstone':CFG.map==='desert'?'sandstone':'stone',2),dk=MC.tex(CFG.map==='nether'?'nether_bricks':CFG.map==='end'?'obsidian':'deepslate',1);
  for(var lv=3;lv>=1;lv--){var ins=lv*.9;for(var yy=Math.floor(ins);yy<ROWS-ins+.01;yy++)for(var xx=Math.floor(ins*1.4);xx<C-ins*1.4;xx++){if(yy<ROWS-1-ins&&xx<C-1-ins*1.4&&yy>ins&&xx>ins*1.4)continue;I.box(xx,yy,-1-lv,1,1,1,{top:dk,side:lv===3?dk:rock},{outline:'rgba(0,0,0,.35)',dark:.15*lv});}}
  /* the fence between zones */
  for(var z=1;z<P.z;z++){var fx=zoneX0(z)-1;for(var y=0;y<ROWS;y++){I.box(fx,y,-1,1,1,1,{top:MC.tex('obsidian',1),side:MC.tex('obsidian',2)},{});}}
  var zl=[];for(var z2=0;z2<P.z;z2++){var c=mkL(),zg=c.getContext('2d');zg.setTransform(DPR,0,0,DPR,0,0);var J=new MC.OIso(zg,{});J.set({tw:iso.tw,v:iso.v,sk:iso.sk,zh:iso.zh,ox:iso.ox,oy:iso.oy});J.dpr=DPR;var x0=zoneX0(z2);
    for(var y2=0;y2<ROWS;y2++)for(var x2=x0;x2<x0+ZW;x2++){var edge=y2===0||y2===ROWS-1||x2===0||x2===C-1;var top=edge?tntTop():floorTex(CFG.map,x2,y2),side=edge?MC.tex('tnt_side',1):MC.tex(MC.MAPS[CFG.map].floor[0],1);J.box(x2,y2,-1,1,1,1,{top:top,side:side},{outline:'rgba(0,0,0,.4)'});}
    zl.push(c);}
  /* fence posts with torches (lights) */
  var lights=[];for(var z3=1;z3<P.z;z3++){var px=zoneX0(z3)-.5;lights.push({x:px,y:-.2,z:1.2,col:M.light,r:4},{x:px,y:ROWS+.2,z:1.2,col:M.light,r:4});}
  lights.push({x:-.5,y:ROWS/2,z:1,col:M.light,r:3.5},{x:C+.5,y:ROWS/2,z:1,col:M.light,r:3.5});if(M.lava)lights.push({x:C/2,y:ROWS+4,z:-3,col:'#ff7a2a',r:9,lava:1});
  lay={bg:bg,zl:zl,lights:lights,amb:Math.min(.42,M.amb||.3)};layKey=key;return lay;}
function torch(x,y){var b=iso.p(x,y,0);var top=iso.p(x,y,1.1);ctx.fillStyle='#6a4a20';ctx.fillRect(b[0]-iso.tw*.06,top[1],iso.tw*.12,b[1]-top[1]);var f=iso.p(x,y,1.25);MC.glow(ctx,f[0],f[1],iso.tw*.5,'rgba(255,190,80,A)',.8);ctx.fillStyle='#ffd23d';ctx.fillRect(f[0]-iso.tw*.07,f[1]-iso.tw*.1,iso.tw*.14,iso.tw*.16);}
function spot(u,zone){var h=MC.hash(u+':'+zone),h2=MC.hash(zone+'#'+u);var x0=zoneX0(zone);return [x0+.9+(h%1000)/1000*(ZW-1.8),.9+(h2%1000)/1000*(ROWS-1.8)];}
function avatarImg(u){if(!CFG.av)return null;var url=BT.avatar(u);return url?BT.img(url):null;}
function fs(px){return Math.max(W<600?7:9,Math.round(px*iso.tw/48));}
function label(x,y,txt,col,size,weight){ctx.font=(weight||800)+' '+size+'px Cairo,system-ui,sans-serif';ctx.lineWidth=Math.max(2.5,size*.28);ctx.strokeStyle='rgba(0,0,0,.85)';ctx.lineJoin='round';ctx.strokeText(txt,x,y);ctx.fillStyle=col;ctx.fillText(txt,x,y);}
function zname(z){return T(z===0?'tn_zl':z===1?'tn_zr':'tn_zm');}
function zoneQuad(z,inset){var x0=zoneX0(z)+inset,x1=zoneX0(z)+ZW-inset,a=iso.p(x0,inset,0),b=iso.p(x1,inset,0),c=iso.p(x1,ROWS-inset,0),d=iso.p(x0,ROWS-inset,0);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.lineTo(d[0],d[1]);ctx.closePath();}
function addParts(x,y,z,n,col,spd,size,life,up){for(var i=0;i<n;i++)parts.push({x:x+(Math.random()-.5)*(up?ZW:1),y:y+(Math.random()-.5)*(up?ROWS:1),z:z,vx:(Math.random()-.5)*spd,vy:(Math.random()-.5)*spd,vz:Math.random()*spd*1.4+(up?3:.5),life:life||(.6+Math.random()*.6),t:0,col:col[Math.floor(Math.random()*col.length)],s:size||(.12+Math.random()*.12)});}
function cube(x,y,z,s,col){var p=iso.p(x,y,z),r=s*iso.tw*.5;ctx.fillStyle=col;ctx.fillRect(p[0]-r,p[1]-r,r*2,r*2);ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(p[0],p[1]-r,r,r*2);}
function onEvent(e){if(e.k==='boom'){var z=e.zone;holes[z]=performance.now();var cx=zoneX0(z)+ZW/2,cy=ROWS/2,M=MC.MAPS[CFG.map]||MC.MAPS.plains;
    addParts(cx,cy,0,140,['#d83a2a','#e8e2da','#fff','#ffd23d','#ff7a1a','#444',(MC.MAPS[CFG.map].floor[0]==='netherrack'?'#7a2a2a':'#7a7a7a')],5,.2,1.6,true);shake=1.2;flashT=.55;A.sfx('boom');
    (P.p||[]).forEach(function(p){if(p[3]===z){var v=V[p[0]];if(v&&(e.all||!p[4])){v.fall={vz:5+Math.random()*4,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*2+1.5,z:0,t:0};}}});
    banner(e.all?T('tn_allout'):e.n?T('tn_boomed',{z:zname(z),n:e.n}):T('tn_safe0',{z:zname(z)}),true);}
  else if(e.k==='round'){if(e.r>1){var al=(P.p||[]).filter(function(p){return p[4]}).length;banner(T('tn_round',{r:e.r})+(al<=3?' · '+T('tn_last',{n:al}):''),false);}else banner(T('tn_round',{r:1}),false);A.sfx('go');}
  else if(e.k==='end'){A.sfx('win');A.confetti($('stage'),120);}}
function frame(now){requestAnimationFrame(frame);size();if(!W)return;var dt=Math.min(.05,(now-prev)/1000);prev=now;var t=(now-t0)/1000;var L=layers();fit();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.imageSmoothingEnabled=false;
  (P.ev||[]).forEach(function(e){if(e.id>lastEv){lastEv=e.id;if(now-t0>700)onEvent(e);}});
  var sx=0,sy=0;if(shake>0){sx=(Math.random()-.5)*shake*iso.tw*.35;sy=(Math.random()-.5)*shake*iso.tw*.35;shake=Math.max(0,shake-dt*1.8);}
  var nobg=STG.classList.contains('lay-nobg')&&A.obs;ctx.save();ctx.translate(sx,sy);
  if(nobg)ctx.clearRect(-20,-20,W+40,H+40);else ctx.drawImage(L.bg,0,0,W,H);
  /* zones: a blown zone is a hole for a moment, then its blocks fall back in */
  var C=cols();
  for(var z=0;z<P.z;z++){var ht=holes[z]?(now-holes[z])/1000:9;if(ht<1.5)continue;var drop=ht<2.3?(1-(ht-1.5)/.8):0;ctx.globalAlpha=1-drop*.6;ctx.drawImage(L.zl[z],0,-drop*drop*iso.tw*3,W,H);ctx.globalAlpha=1;}
  /* the lit side: red pulse on its floor, its TNT flashing white, sparks from the fuses */
  var tg=P.tg,left=P.left||0,live=P.ph==='fuse'&&!P.pa;
  if(live&&tg>=0){var urg=P.len>0?Math.max(0,1-left/Math.max(1,P.len)):.4,sp=4+urg*14;var a=(.16+urg*.22)*(.6+.4*Math.sin(t*sp));ctx.fillStyle='rgba(255,40,30,'+a+')';zoneQuad(tg,0);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,'+(Math.sin(t*sp*1.3)>0?.35+urg*.25:0)+')';zoneQuad(tg,0);ctx.save();ctx.clip();ctx.globalCompositeOperation='lighter';var x0=zoneX0(tg);
    for(var ex=x0;ex<x0+ZW;ex++){[0,ROWS-1].forEach(function(ey){var q=iso.p(ex,ey,0);ctx.fillRect(q[0],q[1],iso.tw,iso.v);});}ctx.restore();
    if(Math.random()<.5+urg){var ex2=x0+Math.floor(Math.random()*ZW),ey2=Math.random()<.5?0:ROWS-1;parts.push({x:ex2+.5,y:ey2+.5,z:.1,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6,vz:2+Math.random()*2,life:.5,t:0,col:Math.random()<.5?'#ffd23d':'#fff',s:.07});}}
  for(var z4=1;z4<P.z;z4++){torch(zoneX0(z4)-.5,-.15);}
  /* players */
  var list=[],seen={},alive=0,byZ={};(P.p||[]).forEach(function(p){var u=p[0];seen[u]=1;if(p[4])alive++;var v=V[u];var s=spot(u,p[3]);if(!v){v=V[u]={x:s[0],y:s[1],walk:0,dir:0,zone:p[3],zt:-9};}
    if(v.zone!==p[3]){v.zone=p[3];v.zt=t;}
    if(!v.fall){var x0=zoneX0(p[3]);var dx=s[0]-v.x,dy=s[1]-v.y,d=Math.sqrt(dx*dx+dy*dy);var far=v.x<x0+.2||v.x>x0+ZW-.2;var st=(far?4.4:1.2)*dt;v.px=v.x;v.py=v.y;
      if(far){if(d>.02){v.x+=dx/d*Math.min(d,st);v.y+=dy/d*Math.min(d,st);}}else if(d>.05){v.x+=dx*Math.min(1,dt*.6);v.y+=dy*Math.min(1,dt*.6);}
      if(p[4]&&!far){(byZ[p[3]]=byZ[p[3]]||[]).push(v);}}
    else{var f=v.fall;f.t+=dt;f.vz-=14*dt;f.z+=f.vz*dt;v.x+=f.vx*dt;v.y+=f.vy*dt;}
    if(!p[4]&&!v.fall&&P.ph!=='end')return;if(v.fall&&v.fall.t>2.2)return;list.push({p:p,v:v});});
  /* spacing: players in the same side push each other apart (min distance from how crowded it is), kept inside their side */
  Object.keys(byZ).forEach(function(z){var a=byZ[z],n=a.length,x0=zoneX0(+z);var md=Math.max(.42,Math.min(1.25,Math.sqrt((ZW-1)*(ROWS-1)/Math.max(1,n))*.92)),md2=md*md;
    for(var i=0;i<n;i++){var A=a[i];for(var k=i+1;k<n;k++){var B=a[k];var dx=B.x-A.x,dy=(B.y-A.y)*1.3;if(dx>md||dx<-md||dy>md||dy<-md)continue;var d2=dx*dx+dy*dy;if(d2>=md2)continue;var d=Math.sqrt(d2)||.01,push=(md-d)*.5*Math.min(1,dt*9);if(d<.02){dx=Math.random()-.5;dy=Math.random()-.5;d=.5;}A.x-=dx/d*push;A.y-=dy/d*push/1.3;B.x+=dx/d*push;B.y+=dy/d*push/1.3;}}
    a.forEach(function(v){v.x=Math.max(x0+.45,Math.min(x0+ZW-.45,v.x));v.y=Math.max(.5,Math.min(ROWS-.5,v.y));var mv=Math.abs(v.x-v.px)+Math.abs(v.y-v.py);v.mv=mv>dt*.9?1:0;if(v.mv){v.walk+=dt;v.dir=v.x-v.px>dt*.5?1:v.x-v.px<-dt*.5?3:v.dir;}});});
  Object.keys(V).forEach(function(k){if(!seen[k])delete V[k];});
  list.sort(function(a,b){return a.v.y-b.v.y;});var sc=Math.max(.4,Math.min(.6,1.05-(list.length/170)));
  list.forEach(function(o){var p=o.p,v=o.v,z=v.fall?v.fall.z:0;if(v.fall)ctx.globalAlpha=Math.max(0,1-v.fall.t/2.2);
    MC.drawEntity(iso,{kind:'player',x:v.x,y:v.y,z:z,scale:sc,face:v.mv?v.dir:0,name:p[1],color:p[2],look:MC.look(p[0],p[2]),avatar:avatarImg(p[0]),anim:{walk:v.mv?v.walk:0,flash:v.fall?.4:0},shadow:.28},t);ctx.globalAlpha=1;});
  /* names: small, never on top of each other — a name that would overlap one already drawn is skipped and counted as "+N" for its side */
  ctx.textAlign='center';ctx.textBaseline='bottom';ctx.direction='ltr';var boxes=[],hidden={},nf=fs(8.5);ctx.font='800 '+nf+'px Cairo,system-ui,sans-serif';
  list.slice().reverse().forEach(function(o){var p=o.p,v=o.v;if(v.fall)return;var hp=iso.p(v.x,v.y,2.05*sc+.05);var just=t-v.zt<1.6&&v.zt>0;
    if(just)label(hp[0],hp[1]-(CFG.names?nf+2:0),'!','#ffd23d',fs(13),900);if(!CFG.names)return;
    var w=Math.min(ctx.measureText(p[1]).width,nf*9)+4,h=nf+2,r=[hp[0]-w/2,hp[1]-h,w,h];var hit=boxes.some(function(b){return r[0]<b[0]+b[2]&&b[0]<r[0]+r[2]&&r[1]<b[1]+b[3]&&b[1]<r[1]+r[3];});
    if(hit){if(p[4])hidden[p[3]]=(hidden[p[3]]||0)+1;return;}boxes.push(r);var nm=Array.from(p[1]).length>14?Array.from(p[1]).slice(0,13).join('')+'…':p[1];label(hp[0],hp[1],nm,MC.readableColor(p[2]||'#cfd3ff'),nf,800);});
  /* each side: its name + head count under the platform front (and "+N" names not shown); "this side blows!" floats over the lit one */
  var c=P.c||[];for(var z5=0;z5<P.z;z5++){var lit=live&&z5===tg;var fp=iso.p(zoneX0(z5)+ZW/2,ROWS+.1,-.9);ctx.direction=EN()?'ltr':'rtl';
    label(fp[0],fp[1]+fs(4),zname(z5)+'  👥 '+(c[z5]||0),lit?'#ff6a5a':'#ffffff',fs(19),900);if(hidden[z5])label(fp[0],fp[1]+fs(20),'+'+hidden[z5]+' '+(EN()?'more':'كمان'),'#c9ccf0',fs(10),800);
    if(lit){var cp=iso.p(zoneX0(z5)+ZW/2,ROWS*.45,2.2);label(cp[0],cp[1],'💣 '+T('tn_blow'),'#ffd23d',fs(20),900);}}
  ctx.direction='ltr';
  /* particles */
  parts=parts.filter(function(q){q.t+=dt;if(q.t>q.life)return false;q.vz-=10*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;ctx.globalAlpha=Math.min(1,(q.life-q.t)*3);cube(q.x,q.y,q.z,q.s,q.col);ctx.globalAlpha=1;return true;});if(parts.length>900)parts.splice(0,parts.length-900);
  if(!nobg){var dyn=[];if(live&&tg>=0)dyn.push({x:zoneX0(tg)+ZW/2,y:ROWS/2,z:.5,col:'#ff5030',r:5+Math.sin(t*10)*.5});Object.keys(holes).forEach(function(z){var ht=(now-holes[z])/1000;if(ht<1)dyn.push({x:zoneX0(+z)+ZW/2,y:ROWS/2,z:1,col:'#ffcf6a',r:9*(1-ht)});});MC.lighting(ctx,iso,L.lights,W,H,t,L.amb,dyn);}
  if(flashT>0){ctx.fillStyle='rgba(255,240,200,'+flashT+')';ctx.fillRect(0,0,W,H);flashT=Math.max(0,flashT-dt*1.4);}
  ctx.restore();
  if(now-hudT>200){hudT=now;hud();}
}
requestAnimationFrame(frame);

/* ---------- HUD (DOM) ---------- */
var bnT=null;
function banner(text,big){var el=$('tnBanner');el.textContent=text;el.className='bt-banner'+(big?' big':'');el.hidden=false;clearTimeout(bnT);bnT=setTimeout(function(){el.hidden=true},big?2400:1600);}
function status(t){var s=$('tnStatus');if(s)s.textContent=t;}
function headEl(u,color,name){var av=CFG.av?BT.avatar(u):null;var s=document.createElement('span');s.className='bt-head';
  if(av){var im=document.createElement('img');im.src=av;im.alt='';im.referrerPolicy='no-referrer';s.appendChild(im);}else{var lk=MC.look(u,color);var c=document.createElement('canvas');c.width=8;c.height=8;c.getContext('2d').drawImage(MC.face('player',lk.skin,lk.hair,lk.style),0,0);s.appendChild(c);}return s;}
var hk='';
function hud(force){var ph=P.ph,n=(P.p||[]).length,al=(P.p||[]).filter(function(p){return p[4]}).length;
  $('tnRound').textContent=ph==='lobby'?T('tn_lobby'):T('tn_round',{r:P.r});
  $('tnAlive').textContent=ph==='lobby'?T('tn_players',{n:n}):T('tn_alive',{a:al,n:n});
  var ring=$('tnRing'),tl=$('tnTime');var showT=ph==='fuse'&&P.len>0;ring.hidden=!(ph==='fuse');tl.textContent=showT?String(Math.ceil(P.left)):'💣';ring.style.setProperty('--p',showT?Math.max(0,P.left/P.len).toFixed(3):1);ring.classList.toggle('low',showT&&P.left<=5);
  $('tnWarn').textContent=ph==='fuse'?(P.len>0?T('tn_warn'):T('tn_manual_w')):'';
  var jk=JSON.stringify([EN(),P.z]);if(jk!==hk||force){hk=jk;var jb=$('tnJoin');A.clear(jb);var l1=document.createElement('div');l1.className='bt-join-l';BT.fill(l1,T('tn_join_box',{j:'\u0001'}),[BT.cmdEl(EN()?'!join':'!دخول')]);jb.appendChild(l1);
    var l2=document.createElement('div');l2.className='bt-join-s';var cm=[BT.cmdEl('!يسار'),' ',BT.cmdEl('!يمين')];if(P.z===3)cm.push(' ',BT.cmdEl('!نص'));cm.push('  ·  ',BT.ltr([BT.cmdEl('!l'),' ',BT.cmdEl('!r')].concat(P.z===3?[' ',BT.cmdEl('!m')]:[])));BT.fill(l2,T('tn_join_box2',{a:'\u0001'}),[]);A.clear(l2);l2.appendChild(document.createTextNode(T('tn_join_box2',{a:''})));cm.forEach(function(x){l2.appendChild(typeof x==='string'?document.createTextNode(x):x);});jb.appendChild(l2);}
  /* winners + ranking */
  var w=$('tnWin');if(ph==='end'){var wk=JSON.stringify([P.win,EN()]);if(w._k!==wk){w._k=wk;A.clear(w);var ws=P.win||[];var h=document.createElement('h3');h.textContent='👑 '+(ws.length===1?T('tn_win_one'):T('tn_win_t'));w.appendChild(h);
      var byU={};(P.p||[]).forEach(function(p){byU[p[0]]=p;});var ul=document.createElement('ul');ws.slice(0,16).forEach(function(u){var p=byU[u];if(!p)return;var li=document.createElement('li');li.appendChild(headEl(u,p[2],p[1]));li.appendChild(BT.name(p[1],p[2]));ul.appendChild(li);});w.appendChild(ul);
      var rest=(P.p||[]).filter(function(p){return ws.indexOf(p[0])<0;}).sort(function(a,b){return b[5]-a[5];}).slice(0,5);if(rest.length){var rk=document.createElement('ol');rk.className='tn-rank';rk.start=ws.length+1;rest.forEach(function(p){var li=document.createElement('li');li.appendChild(BT.name(p[1],p[2]));var sm=document.createElement('small');sm.textContent=' · '+T('tn_r_out',{r:p[5]});li.appendChild(sm);rk.appendChild(li);});w.appendChild(rk);}
      w.className='bt-win won';w.hidden=false;}}else{w.hidden=true;w._k='';}
  /* !معلومات card */
  var gi=$('tnInfo');if(P.gi){var g=P.gi;var gk=g.u+g.alive+g.round+EN();if(gi._k!==gk){gi._k=gk;A.clear(gi);gi.appendChild(headEl(g.u,g.c,g.name));var tx=document.createElement('div');tx.appendChild(BT.name(g.name,g.c,'gi-nm'));var s1=document.createElement('div');s1.textContent='LV '+lvOf(g.u)+' · '+(g.alive?T('tn_info',{z:zname(g.zone)}):T('tn_info_out',{r:g.out}))+' · 🏆 '+T('tn_info_w',{w:g.wins});tx.appendChild(s1);gi.appendChild(tx);gi.hidden=false;}}else{gi.hidden=true;gi._k='';}
  if(!A.obs)ctrlHud();}
function ctrlHud(){var ph=G.phase;$('tnGo').textContent=T(ph==='lobby'?'tn_start':ph==='fuse'?'tn_boom':ph==='boom'?'tn_next':'tn_again');$('tnPause').textContent=T(G.paused?'tn_resume':'tn_pause');$('tnPause').disabled=!(ph==='fuse'||ph==='boom');
  var al=G.alive().length,n=G.order.length;var st=G.paused?T('tn_st_paused'):ph==='lobby'?T('tn_st_lobby',{n:n}):ph==='fuse'?T('tn_st_fuse',{r:G.round,z:zname(G.target()),a:al}):ph==='boom'?T('tn_st_boom',{z:zname(G.last?G.last.zone:0),a:al}):T('tn_st_end',{w:G.winners.map(function(u){return G.players[u].name}).slice(0,6).join('، ')||'—'});status(st);
  $('tnN').textContent=String(n);}
/* ---------- control panel ---------- */
if(!A.obs){
  $('tnGo').addEventListener('click',go);$('tnPause').addEventListener('click',pauseT);$('tnNew').addEventListener('click',newGame);$('tnClear').addEventListener('click',clearAll);
  BT.tmr($('tnSecsRow'),function(){return CFG.secs},function(v){CFG.secs=v;apply();save();},25);
  BT.tmr($('tnAutoRow'),function(){return CFG.auto},function(v){CFG.auto=v;apply();save();},3);
  BT.tmr($('tnJoinRow'),function(){return CFG.join},function(v){CFG.join=v;joinEnd=v>0?Date.now()+v*1000:0;save();},60);
  var zs=$('tnZones');zs.value=String(CFG.zones);zs.addEventListener('change',function(){if(G.phase!=='lobby'&&G.phase!=='end'){zs.value=String(CFG.zones);return;}CFG.zones=+zs.value;if(G.phase==='end')newGame();apply();save();P=G.pub();A.publish(P);});
  var spd=$('tnSpeed');spd.value=CFG.speed;spd.addEventListener('change',function(){CFG.speed=spd.value;apply();save();});
  var mp=$('tnMap');mp.value=CFG.map;mp.addEventListener('change',function(){CFG.map=mp.value;save();layKey='';});
  [['tnJit','jit'],['tnAv','av'],['tnNames','names']].forEach(function(a){var e=$(a[0]);e.checked=!!CFG[a[1]];e.addEventListener('change',function(){CFG[a[1]]=e.checked;apply();save();hud(true);});});
  BT.xtra($('tnXtra'),'lamma-tnxtra');if(CFG.join>0)joinEnd=Date.now()+CFG.join*1000;A.onLang(function(){hud(true);});}
if(window.LammaAvatars&&LammaAvatars.onChange)LammaAvatars.onChange(function(){hud(true);});

var PANEL=BT.panel({key:'tnt',root:$('gs'),stage:$('stage'),onPause:pauseT,isPaused:function(){return !!G.paused},canPause:function(){return G.phase==='fuse'||G.phase==='boom'},onNext:go,
  cmds:[['!دخول','!join','انضم','join'],['!يسار','!l','روح شمال','go left'],['!يمين','!r','روح يمين','go right'],['!نص','!m','الوسط (3 جهات)','middle (3 sides)'],['!معلومات','!getinfo','شوف حالك','your card'],['!خروج','!leave','اطلع','leave']],
  short:['الجهة اللي فيها ناس أكتر بتنفجر لما يخلص الوقت. خبّي حالك بالجهة الفاضية!','The side with MORE people blows up when the timer ends. Hide on the emptier side!'],
  how:[['الشات بيدخل بـ !دخول وبيوقف عالمنصة فوق الفراغ.','كل جولة في عدّاد. الجهة اللي فيها ناس أكتر بيولّع فيها الـTNT (بتشوفها حمرا وبتلمع) وبتنفجر لما يخلص الوقت. اللي فيها بيوقعو.','انتقل بين الجهات بـ !يسار و !يمين (أو !l و !r)، ومع 3 جهات كمان !نص. الجهة الأكتر ناس بتتغيّر مباشرة لما الناس تنتقل، فالعبوها صح!','كل جولة أسرع من اللي قبلها. آخر واحد بيضل هو البطل، وإذا كلّن كانو بنفس الجهة بيربحو سوا.'],
       ['Chat joins with !join and stands on the platform over the void.','Every round has a timer. The side with MORE people gets its TNT lit (it glows red and flashes) and blows when time runs out; everyone on it falls.','Move between the sides with !l and !r (or !يسار / !يمين), plus !m with 3 sides. The most crowded side changes live as people move, so play it smart!','Every round is faster than the last. The last one standing wins; if everyone was on the same side, they win together.']],
  ctrl:[['!ابدأ','!start','بلّش (مود)','start (mod)'],['!التالي','!next','فجّر هلأ / الجولة الجاية (مود)','blow now / next round (mod)'],['!وقف','!pause','وقف / كمّل (مود)','pause / resume (mod)'],['Space','Space','وقف / كمّل','pause / resume'],['N','N','فجّر هلأ / الجولة الجاية','blow now / next round'],['F','F','شاشة كاملة','fullscreen']]});
/* ---------- layout editor ---------- */
BT.logo($('btLogo'));
window.LammaLayout&&window.LammaLayout.init({root:$('gs'),stage:$('stage'),key:'tnt',items:[
  {id:'field',z:1,code:'a',kind:'box',ar:'المنصة',en:'Platform',def:{x:22,y:0,w:78,h:100,s:1},minW:30,minH:30},
  {id:'round',z:4,code:'r',kind:'box',ar:'الجولة والوقت',en:'Round & timer',def:{x:41,y:2,w:40,h:14,s:1},minW:14,minH:6},
  {id:'join',z:3,code:'j',kind:'box',ar:'صندوق الدخول',en:'Join box',def:{x:38,y:88.5,w:46,h:9.5,s:1},minW:12,minH:5},
  PANEL.item
]});
hud(true);A.publish(P);
A.start();
})();
