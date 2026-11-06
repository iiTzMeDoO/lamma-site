/* hero.js — المحارب / The Perfect Warrior: Kukoro's "Perfect Warrior" in the Minecraft-Dungeons voxel look.
   Kukoro (watched in a real stream, Nov 2026): a square dirt arena; the reigning warrior stands in it with "NAME · N kills" on top;
   challengers wait around it and step in one at a time for an automatic turn-based duel ("Ready" → "FIGHT!", damage numbers,
   DODGE); the winner stays, the loser goes back to the queue. Chat: !kukoro (join), !stats ABCD (a letter A–Z for attack /
   defence / speed / life — find your perfect combination, it depends on your name and changes every month), !heal between duels.
   Ours: same loop; the streamer can start as the first warrior (with an optional HP boost), mobs can challenge when nobody waits.
   Engine: BT.Hero (btcore.js, tested in Node). */
(function(){
'use strict';
var A=window.App,BT=window.BT,MC=window.MC,$=A.$;
A.strings({
 ar:{g_title:'المحارب',g_how:'الشات بيدخل بـ !دخول وبيستنى دورو. المحارب واقف بالساحة وكل متحدّي بيفوت لعندو بمبارزة بالدور. اللي بيربح بيضل، واللي بيخسر بيرجع عآخر الدور. لاقي تركيبتك المثالية بـ !احصائيات ABCD.',
  hr_start:'ابدأ',hr_next:'المبارزة الجاية ⚔',hr_skip:'خلّص المبارزة هلأ',hr_stop:'خلّص اللعبة',hr_again:'العب مرة تانية',hr_pause:'وقف مؤقت',hr_resume:'كمّل',hr_new:'لعبة جديدة (نفس اللاعبين)',hr_demo:'ضيف 20 لاعب تجربة',hr_clear:'مسح الكل',
  hr_hint:'الشات بيدخل بـ !دخول. كل واحد بيختار 4 حروف (A–Z) لـ هجوم / دفاع / سرعة / صحة بـ !احصائيات ABCD، وقيمة كل حرف بتختلف حسب اسمو. !علاج بين المبارزات للمحارب.',
  bt_settings:'الإعدادات',hr_speed:'سرعة القتال',hr_sp_s:'بطيء',hr_sp_n:'عادي',hr_sp_f:'سريع',hr_brk:'استراحة بين المبارزات',hr_streamer:'الستريمر هو المحارب الأول',bt_more:'خيارات زيادة',
  hr_respawn:'الخسران بيرجع عالدور',hr_bots:'موبز بتتحدّى لما ما في حدا',hr_boss:'صحة الستريمر',bt_join_t:'وقت الدخول',bt_av:'صور تويتش على الراس',bt_map:'الخريطة',hr_names:'أسامي فوق الراس',hr_heal:'!علاج بيرجّع',
  bt_nolimit:'بلا وقت',bt_manual:'إنت بتضغط',bt_sec:'ث',map_plains:'سهول',map_desert:'صحراء',map_nether:'النذر',map_end:'النهاية',map_cave:'الكهف',
  hr_lobby:'الدخول مفتوح',hr_players:'{n} لاعب',hr_queue:'{n} بالدور',hr_duel:'المبارزة {r}',hr_champ:'المحارب',hr_kills:'{k} قتلات',hr_kill1:'قتلة وحدة',hr_rec:'الرقم القياسي: {n} · {k}',hr_none:'لسا ما في محارب',
  hr_ready:'جاهزين…',hr_fight:'قتال!',hr_dodge:'تفادى!',hr_crit:'ضربة قوية!',hr_ko:'{w} قتل {l}! ({k})',hr_newc:'👑 محارب جديد: {w}',hr_heal_ev:'💚 {n} تعالج +{v}',hr_stats_ev:'🔤 {n}: {l}',hr_wait:'ناطر متحدّي… اكتب !دخول',hr_next_up:'الجاي',hr_vs:'ضد',
  hr_join_box:'اكتب {j} لتتحدى المحارب',hr_join_box2:'{s} لتغيّر حروفك · {h} للمحارب بين المبارزات',hr_need:'لازم لاعبين عالأقل (أو شغّل الموبز)',hr_end_t:'المحارب الأخير',hr_end_rec:'الرقم القياسي',
  hr_st_lobby:'الدخول مفتوح: {n} لاعب. اضغط "ابدأ".',hr_st_duel:'المبارزة {r}: {a} ضد {b}',hr_st_after:'استراحة · {n} بالدور',hr_st_wait:'ناطرين متحدّي',hr_st_end:'خلصت! المحارب: {w}',hr_st_paused:'موقّفة',
  hr_at:'هجوم',hr_df:'دفاع',hr_sp:'سرعة',hr_hp:'صحة',hr_letters:'الحروف',hr_pos:'دورو: {p}',hr_state_champ:'👑 المحارب',hr_state_fight:'⚔ عم يقاتل',hr_dc:'تفادي {d}% · كريت {c}%',hr_best:'أفضل سلسلة {b} · ربح {w}',
  mob_zombie:'زومبي',mob_skeleton:'هيكل عظمي',mob_husk:'زومبي الصحرا',mob_spider:'عنكبوت',mob_creeper:'كريبر',mob_piglin:'بيغلن',mob_wskel:'هيكل الذابل',mob_enderman:'إندرمان',
  bt_c_join:'دخول',bt_c_stats:'غيّر حروفك (هجوم دفاع سرعة صحة)',bt_c_heal:'تعالج بين المبارزات',bt_c_info:'معلوماتك',bt_c_cstart:'بلّش',bt_c_cnext:'المبارزة الجاية / خلّصها',bt_c_pause:'وقف مؤقت',bt_c_end:'خلّص اللعبة'},
 en:{g_title:'The Perfect Warrior',g_how:'Chat joins with !join and waits in line. The warrior stands in the arena and each challenger steps in for a turn-based duel. The winner stays, the loser goes to the back of the line. Find your perfect combination with !stats ABCD.',
  hr_start:'Start',hr_next:'Next duel ⚔',hr_skip:'Finish this duel now',hr_stop:'End the game',hr_again:'Play again',hr_pause:'Pause',hr_resume:'Resume',hr_new:'New game (same players)',hr_demo:'Add 20 demo players',hr_clear:'Clear all',
  hr_hint:'Chat joins with !join. Everyone picks 4 letters (A–Z) for attack / defence / speed / life with !stats ABCD; what a letter is worth depends on your name. !heal between duels for the warrior.',
  bt_settings:'Settings',hr_speed:'Fight speed',hr_sp_s:'Slow',hr_sp_n:'Normal',hr_sp_f:'Fast',hr_brk:'Break between duels',hr_streamer:'The streamer is the first warrior',bt_more:'More options',
  hr_respawn:'The loser goes back in line',hr_bots:'Mobs challenge when nobody waits',hr_boss:'Streamer HP',bt_join_t:'Join time',bt_av:'Twitch pictures on heads',bt_map:'Map',hr_names:'Names over heads',hr_heal:'!heal restores',
  bt_nolimit:'No limit',bt_manual:'You press',bt_sec:'s',map_plains:'Plains',map_desert:'Desert',map_nether:'Nether',map_end:'The End',map_cave:'Cave',
  hr_lobby:'Lobby open',hr_players:'{n} players',hr_queue:'{n} in line',hr_duel:'Duel {r}',hr_champ:'Warrior',hr_kills:'{k} kills',hr_kill1:'1 kill',hr_rec:'Record: {n} · {k}',hr_none:'No warrior yet',
  hr_ready:'Ready…',hr_fight:'FIGHT!',hr_dodge:'DODGE!',hr_crit:'CRIT!',hr_ko:'{w} beat {l}! ({k})',hr_newc:'👑 New warrior: {w}',hr_heal_ev:'💚 {n} healed +{v}',hr_stats_ev:'🔤 {n}: {l}',hr_wait:'Waiting for a challenger… type !join',hr_next_up:'NEXT',hr_vs:'VS',
  hr_join_box:'Type {j} to challenge the warrior',hr_join_box2:'{s} to change your letters · {h} for the warrior between duels',hr_need:'Needs 2 players (or turn mobs on)',hr_end_t:'Last warrior',hr_end_rec:'Record',
  hr_st_lobby:'Lobby open: {n} players. Press "Start".',hr_st_duel:'Duel {r}: {a} vs {b}',hr_st_after:'Break · {n} in line',hr_st_wait:'Waiting for a challenger',hr_st_end:'Over! Warrior: {w}',hr_st_paused:'Paused',
  hr_at:'ATK',hr_df:'DEF',hr_sp:'SPD',hr_hp:'HP',hr_letters:'Letters',hr_pos:'In line: #{p}',hr_state_champ:'👑 Warrior',hr_state_fight:'⚔ Fighting',hr_dc:'Dodge {d}% · Crit {c}%',hr_best:'Best streak {b} · {w} wins',
  mob_zombie:'Zombie',mob_skeleton:'Skeleton',mob_husk:'Husk',mob_spider:'Spider',mob_creeper:'Creeper',mob_piglin:'Piglin',mob_wskel:'Wither Skeleton',mob_enderman:'Enderman',
  bt_c_join:'Join',bt_c_stats:'Change your letters (atk def spd hp)',bt_c_heal:'Heal between duels',bt_c_info:'Your info',bt_c_cstart:'Start',bt_c_cnext:'Next duel / finish it',bt_c_pause:'Pause',bt_c_end:'End the game'}
});
function T(k,o){var s=A.t(k);if(o)Object.keys(o).forEach(function(x){s=s.split('{'+x+'}').join(o[x])});return s;}
var EN=function(){return A.lang()==='en'};
var MAPS=['plains','desert','nether','end','cave'];
var KEY='lamma-hr-'+A.channel,store=BT.store(KEY),sv=A.obs?null:store.get();
var CFG={speed:'n',brk:4,streamer:true,respawn:true,bots:false,boss:1,join:0,av:true,map:'plains',names:true,heal:50};
var TURN={s:1,n:.7,f:.42};
var Q=A.Q;if(A.obs){if(Q.get('hs')&&TURN[Q.get('hs')])CFG.speed=Q.get('hs');if(Q.get('bk')!=null)CFG.brk=+Q.get('bk')||0;if(Q.get('st'))CFG.streamer=Q.get('st')==='1';if(Q.get('rs'))CFG.respawn=Q.get('rs')==='1';if(Q.get('mb'))CFG.bots=Q.get('mb')==='1';
  if(Q.get('bx'))CFG.boss=Math.max(1,Math.min(3,+Q.get('bx')||1));if(Q.get('map')&&MAPS.indexOf(Q.get('map'))>=0)CFG.map=Q.get('map');if(Q.get('av'))CFG.av=Q.get('av')==='1';if(Q.get('hl'))CFG.heal=Math.max(10,Math.min(100,+Q.get('hl')||50));}
else if(sv&&sv.cfg)Object.keys(CFG).forEach(function(k){if(sv.cfg[k]!=null)CFG[k]=sv.cfg[k]});
var ME=String(A.channel||'').toLowerCase();
var G=new BT.Hero({cfg:{}});
function apply(){G.cfg.turn=TURN[CFG.speed]||.7;G.cfg.brk=+CFG.brk||0;G.cfg.respawn=!!CFG.respawn;G.cfg.bots=!!CFG.bots;G.cfg.boss=+CFG.boss||1;G.cfg.heal=(+CFG.heal||50)/100;G.cfg.streamer=CFG.streamer&&ME?ME:'';
  Object.keys(G.players).forEach(function(u){var p=G.players[u];var r=p.max?p.hp/p.max:1;G.derive(p);p.hp=Math.max(1,Math.round(p.max*r));});}
apply();
var XPKEY='lamma-ba-'+A.channel;
function addXp(map){if(A.obs)return;try{var s=JSON.parse(localStorage.getItem(XPKEY)||'{}');s.xp=s.xp||{};Object.keys(map).forEach(function(u){s.xp[u]=(s.xp[u]||0)+map[u];});localStorage.setItem(XPKEY,JSON.stringify(s));}catch(e){}}
function lvOf(u){try{var s=JSON.parse(localStorage.getItem(XPKEY)||'{}');return BT.lvlOf((s.xp||{})[u]);}catch(e){return 10;}}
function save(){if(A.obs)return;store.set({cfg:CFG});A.updateObsUrl();}
A.obsExtra(function(){return '&hs='+CFG.speed+'&bk='+CFG.brk+'&st='+(CFG.streamer?1:0)+'&rs='+(CFG.respawn?1:0)+'&mb='+(CFG.bots?1:0)+'&bx='+CFG.boss+'&hl='+CFG.heal+'&map='+CFG.map+'&av='+(CFG.av?1:0);});
var P=G.pub();
function streamerIn(){if(!CFG.streamer||!ME||G.players[ME])return;G.join(ME,A.channelName?A.channelName():ME,'#ffd23d');}

/* ---------- engine ---------- */
function engine(){return A.runsEngine();}
var lastT=performance.now(),pubAt=0,joinEnd=0;
setInterval(function(){var now=performance.now(),dt=(now-lastT)/1000;lastT=now;if(!engine())return;var n0=G.evId;G.step(dt);
  if(G.evId!==n0){G.ev.forEach(function(e){if(e.id>n0&&e.k==='ko'&&!G.players[e.w].bot){var x={};x[e.w]=8;addXp(x);}});}
  P=G.pub();if(now-pubAt>100){pubAt=now;A.publish(P);}
  if(G.phase==='lobby'&&joinEnd&&Date.now()>=joinEnd){joinEnd=0;startGame();}
},50);
A.onMirror(function(s){if(s&&s.p)P=s;});
A.allowSolo();
function startGame(){apply();if(G.phase==='end'){newGame();}streamerIn();if(!G.start()){status(T('hr_need'));return;}A.sfx('start');P=G.pub();A.publish(P);hud(true);}
function pauseT(){if(G.phase==='lobby'||G.phase==='end')return;G.paused=!G.paused;P=G.pub();A.publish(P);hud(true);}
function go(){if(G.phase==='lobby'||G.phase==='end'){startGame();return;}G.next();P=G.pub();A.publish(P);hud(true);}
function endGame(){if(G.stop()){A.sfx('win');P=G.pub();A.publish(P);hud(true);}}
function newGame(){var keep=Object.keys(G.players).filter(function(u){return !G.players[u].bot}).map(function(u){var p=G.players[u];return [u,p.name,p.color,p.letters];});G.reset();apply();keep.forEach(function(k){G.join(k[0],k[1],k[2]);G.setStats(k[0],k[3]);});V={};P=G.pub();A.publish(P);hud(true);}
function clearAll(){G.reset();apply();V={};P=G.pub();A.publish(P);hud(true);}
A.onChat(function(m){if(!engine())return;var c=BT.cmd(m.text);if(!c)return;
  if(BT.MODK[c.k]&&A.isCtrl(m)){if(c.k==='start'){if(G.paused)pauseT();else if(G.phase==='lobby'||G.phase==='end')startGame();}else if(c.k==='next')go();else if(c.k==='pause')pauseT();else if(c.k==='reset')newGame();return;}
  if(c.k==='end'&&A.isCtrl(m)){endGame();return;}
  if(c.k==='join'){G.join(m.user,m.name,m.color);return;}if(c.k==='leave'){G.leave(m.user);return;}
  if(c.k==='stats'){if(!G.players[m.user])G.join(m.user,m.name,m.color);G.setStats(m.user,c.arg);return;}
  if(c.k==='heal'){G.heal(m.user);return;}
  if(c.k==='info'){G.askInfo(m.user,c.arg);return;}});

/* ---------- view ---------- */
var STG=$('stage'),cv=$('hrCanvas'),ctx=cv.getContext('2d'),W=0,H=0,DPR=1,iso=new MC.OIso(ctx,{tw:40});
var V={},parts=[],floats=[],lastEv=0,shake=0,flashT=0,t0=performance.now(),prev=t0,hudT=0,lay=null,layKey='',fightT=-9;
var AC=12,AR=8,BACK=2.6;   /* arena columns / rows; the stands behind it are BACK rows deep */
var CHX=AC*.66,FOX=AC*.34,MIDY=AR*.52;
function size(){var r=cv.parentNode.getBoundingClientRect();var w=Math.max(200,Math.round(r.width)),h=Math.max(120,Math.round(r.height));var d=Math.min(2,window.devicePixelRatio||1);if(w!==W||h!==H||d!==DPR){W=w;H=h;DPR=d;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);layKey='';}}
var SK=.3;function fit(){var C=AC+2,R=AR+BACK+1;var u=Math.min(W*.985/(C+R*SK),H*.8/(R*.7+2.4));var ph=R*.7*u;iso.set({tw:u,v:u*.7,sk:SK,zh:u*.78,ox:(W-(C+R*SK)*u)/2+u,oy:Math.max(H*.2,(H-ph)/2)+BACK*.7*u});iso.dpr=DPR;}
function floorTex(map,x,y){var M=MC.MAPS[map]||MC.MAPS.plains;var f=M.floor;return MC.tex(f[(x*7+y*13)%f.length],1+((x*3+y*5)%3));}
function layers(){var key=[CFG.map,W,H,DPR].join('|');if(lay&&layKey===key)return lay;fit();var M=MC.MAPS[CFG.map]||MC.MAPS.plains;
  var bg=MC.mk(Math.round(W*DPR),Math.round(H*DPR)),g=bg.getContext('2d');g.imageSmoothingEnabled=false;g.setTransform(DPR,0,0,DPR,0,0);
  var gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,M.sky[0]);gr.addColorStop(1,M.sky[1]);g.fillStyle=gr;g.fillRect(0,0,W,H);
  var rr=MC.rng(11),bs=Math.max(8,Math.round(W/70));for(var layer=0;layer<2;layer++){var base=H*(.22+layer*.07);g.fillStyle=MC.shade(M.sky[0],1.25-layer*.25);var hh=0;for(var i=0;i<W;i+=bs){hh=Math.max(0,Math.min(H*.1,hh+(rr()-.5)*bs*2));g.fillRect(i,base-hh,bs,hh+2);}}
  if(M.void)for(var s=0;s<140;s++){g.fillStyle='rgba(230,210,255,'+(rr()*.6+.1)+')';g.fillRect(rr()*W,rr()*H*.5,1.5,1.5);}
  var I=new MC.OIso(g,{});I.set({tw:iso.tw,v:iso.v,sk:iso.sk,zh:iso.zh,ox:iso.ox,oy:iso.oy});I.dpr=DPR;
  var wall=MC.tex(CFG.map==='nether'?'nether_bricks':CFG.map==='end'?'endstone':CFG.map==='desert'?'sandstone':'stone',1),dark=MC.tex(CFG.map==='nether'?'netherrack':CFG.map==='end'?'obsidian':'deepslate',1);
  /* the stands behind the arena: two raised steps of stone where the challengers wait */
  for(var by=-Math.ceil(BACK);by<0;by++)for(var bx=-1;bx<=AC;bx++){var hgt=by<-1.5?2:1;I.box(bx,by,-1,1,1,hgt,{top:wall,side:dark},{outline:'rgba(0,0,0,.35)'});}
  /* the arena floor (sunk one block lower than its rim) + the rim */
  for(var y=0;y<AR;y++)for(var x=0;x<AC;x++){I.box(x,y,-1,1,1,1,{top:floorTex(CFG.map,x,y),side:dark},{outline:'rgba(0,0,0,.3)'});}
  for(var x2=-1;x2<=AC;x2++){I.box(x2,AR,-1,1,1,1.35,{top:wall,side:wall},{outline:'rgba(0,0,0,.4)'});}
  for(var y2=0;y2<AR;y2++){I.box(-1,y2,-1,1,1,1.35,{top:wall,side:wall},{outline:'rgba(0,0,0,.4)'});I.box(AC,y2,-1,1,1,1.35,{top:wall,side:wall},{outline:'rgba(0,0,0,.4)'});}
  /* a cross of darker floor where the two fighters stand */
  var lights=[{x:-.5,y:-.3,z:1.6,col:M.light,r:4.5},{x:AC+.5,y:-.3,z:1.6,col:M.light,r:4.5},{x:-.5,y:AR+.5,z:1.6,col:M.light,r:4},{x:AC+.5,y:AR+.5,z:1.6,col:M.light,r:4}];
  if(M.lava)lights.push({x:AC/2,y:AR+5,z:-3,col:'#ff7a2a',r:10,lava:1});
  lay={bg:bg,lights:lights,amb:Math.min(.42,M.amb||.3)};layKey=key;return lay;}
function torch(x,y,z){var b=iso.p(x,y,z||0);var top=iso.p(x,y,(z||0)+1.1);ctx.fillStyle='#6a4a20';ctx.fillRect(b[0]-iso.tw*.06,top[1],iso.tw*.12,b[1]-top[1]);var f=iso.p(x,y,(z||0)+1.25);MC.glow(ctx,f[0],f[1],iso.tw*.5,'rgba(255,190,80,A)',.8);ctx.fillStyle='#ffd23d';ctx.fillRect(f[0]-iso.tw*.07,f[1]-iso.tw*.1,iso.tw*.14,iso.tw*.16);}
function avatarImg(u){if(!CFG.av||String(u).indexOf('mob#')===0)return null;var url=BT.avatar(u);return url?BT.img(url):null;}
function fs(px){return Math.max(W<600?7:9,Math.round(px*iso.tw/48));}
function label(x,y,txt,col,size,weight){ctx.font=(weight||800)+' '+size+'px Cairo,system-ui,sans-serif';ctx.lineWidth=Math.max(2.5,size*.28);ctx.strokeStyle='rgba(0,0,0,.85)';ctx.lineJoin='round';ctx.strokeText(txt,x,y);ctx.fillStyle=col;ctx.fillText(txt,x,y);}
function nm(p){return p[8]?T('mob_'+p[8]):p[1];}
function short(s,n){var a=Array.from(String(s));return a.length>n?a.slice(0,n-1).join('')+'…':s;}
/* queue slots on the stands: two rows, filled from the arena's left edge */
function qSlot(i){var per=Math.max(6,Math.floor((AC+1)/0.92)),row=Math.floor(i/per),col=i%per;if(row>1)return null;return [-.5+col*.92+(row?.46:0),row===0?-.95:-2.15,row===0?0:1];}
function cube(x,y,z,s,col){var p=iso.p(x,y,z),r=s*iso.tw*.5;ctx.fillStyle=col;ctx.fillRect(p[0]-r,p[1]-r,r*2,r*2);ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(p[0],p[1]-r,r,r*2);}
function addParts(x,y,z,n,col,spd,size,life){for(var i=0;i<n;i++)parts.push({x:x+(Math.random()-.5)*.6,y:y+(Math.random()-.5)*.6,z:z,vx:(Math.random()-.5)*spd,vy:(Math.random()-.5)*spd,vz:Math.random()*spd*1.4+.8,life:life||(.5+Math.random()*.5),t:0,col:col[Math.floor(Math.random()*col.length)],s:size||(.1+Math.random()*.1)});}
function byU(u){var r=null;(P.p||[]).forEach(function(p){if(p[0]===u)r=p;});return r;}
function onEvent(e){var now=performance.now();
  if(e.k==='intro'){fightT=-9;var a=byU(e.a),b=byU(e.b);banner('\u2068'+(a?nm(a):'')+'\u2069  '+T('hr_vs')+'  \u2068'+(b?nm(b):'')+'\u2069',false);A.sfx('go');}
  else if(e.k==='fight'){fightT=now;banner(T('hr_fight'),true);A.sfx('start');}
  else if(e.k==='hit'){var v=V[e.b],va=V[e.a];if(va){va.atkT=now;}if(!v)return;
    if(e.dodge){floats.push({x:v.x,y:v.y,z:2.2,t:0,txt:T('hr_dodge'),col:'#9fe8ff',s:15});v.dodgeT=now;A.sfx('pop');}
    else{floats.push({x:v.x,y:v.y,z:2.1,t:0,txt:'-'+e.d,col:e.crit?'#ffd23d':'#ff5a4a',s:e.crit?22:17});if(e.crit)floats.push({x:v.x,y:v.y,z:2.8,t:0,txt:T('hr_crit'),col:'#ffd23d',s:13});
      v.hitT=now;addParts(v.x,v.y,1,e.crit?14:7,['#b3261e','#ff5a4a','#7a1010'],2.4,.09,.6);shake=e.crit?.6:.25;A.sfx(e.crit?'boom':'tick');}}
  else if(e.k==='ko'){var vl=V[e.l];if(vl){vl.ko={t:0};addParts(vl.x,vl.y,1,26,['#ffffff','#d0d0d0','#888'],3.2,.14,1);}var w=byU(e.w);
    banner(e.nc?T('hr_newc',{w:'\u2068'+(w?nm(w):'')+'\u2069'}):T('hr_ko',{w:'\u2068'+(w?nm(w):'')+'\u2069',l:'\u2068'+(e.lbot?T('mob_'+e.lbot):e.ln)+'\u2069',k:e.k2===1?T('hr_kill1'):T('hr_kills',{k:e.k2})}),true);flashT=.25;A.sfx(e.nc?'win':'boom');if(e.nc)A.confetti($('stage'),60);}
  else if(e.k==='heal'){var vh=V[e.u];if(vh){floats.push({x:vh.x,y:vh.y,z:2.2,t:0,txt:'+'+e.v,col:'#5cff7a',s:17});addParts(vh.x,vh.y,1,12,['#5cff7a','#b8ffc4'],1.6,.08,.8);}A.sfx('pop');}
  else if(e.k==='end'){A.sfx('win');A.confetti($('stage'),120);}}
function frame(now){requestAnimationFrame(frame);size();if(!W)return;var dt=Math.min(.05,(now-prev)/1000);prev=now;var t=(now-t0)/1000;var L=layers();fit();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.imageSmoothingEnabled=false;
  (P.ev||[]).forEach(function(e){if(e.id>lastEv){lastEv=e.id;if(now-t0>700)onEvent(e);}});
  var sx=0,sy=0;if(shake>0){sx=(Math.random()-.5)*shake*iso.tw*.3;sy=(Math.random()-.5)*shake*iso.tw*.3;shake=Math.max(0,shake-dt*2.2);}
  var nobg=STG.classList.contains('lay-nobg')&&A.obs;ctx.save();ctx.translate(sx,sy);
  if(nobg)ctx.clearRect(-20,-20,W+40,H+40);else ctx.drawImage(L.bg,0,0,W,H);
  /* a soft spotlight on the duel spot */
  var duel=P.ph==='intro'||P.ph==='duel';if(duel){var cp=iso.p(AC/2,MIDY,0);MC.glow(ctx,cp[0],cp[1],iso.tw*4,'rgba(255,220,140,A)',.18);}
  /* targets: champion right of centre, challenger left; the queue on the stands; out = gone */
  var list=[],seen={},qi=0;
  (P.p||[]).forEach(function(p){var u=p[0];seen[u]=1;var tx,ty,tz=0,face=0;
    if(u===P.ch){tx=CHX;ty=MIDY;face=3;}else if(u===P.fo){tx=P.ph==='intro'||P.ph==='duel'?FOX:FOX;ty=MIDY;face=1;}
    else if(p[6]==='queue'){var s=qSlot(qi++);if(!s)return;tx=s[0]+.5;ty=s[1]+.5;tz=s[2];face=0;}else return;
    var v=V[u];if(!v){v=V[u]={x:tx,y:ty,z:tz,walk:0,dir:face};if(u===P.fo){v.x=FOX-3;v.y=-1;}}
    v.tz=tz;var dx=tx-v.x,dy=ty-v.y,d=Math.sqrt(dx*dx+dy*dy);var spd=(u===P.fo||u===P.ch?3.2:5)*dt;v.mv=0;
    if(d>.03){v.x+=dx/d*Math.min(d,spd);v.y+=dy/d*Math.min(d,spd);v.walk+=dt;v.mv=1;v.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?0:2);}else{v.dir=face;}
    v.z+=(tz-v.z)*Math.min(1,dt*8);
    list.push({p:p,v:v});});
  Object.keys(V).forEach(function(k){if(!seen[k]){var v=V[k];if(v.ko&&v.ko.t<1.4){v.ko.t+=dt;list.push({p:v.last,v:v,gone:1});return;}delete V[k];}else V[k].last=(P.p||[]).filter(function(p){return p[0]===k})[0];});
  list.sort(function(a,b){return (a.v.y-a.v.z*.6)-(b.v.y-b.v.z*.6);});
  var nq=0;list.forEach(function(o){if(o.p&&o.p[6]==='queue')nq++;});var qsc=Math.max(.42,Math.min(.6,.7-nq/120));
  list.forEach(function(o){var p=o.p,v=o.v;if(!p)return;var fighter=p[0]===P.ch||p[0]===P.fo;var sc=fighter?1.2:qsc;var lunge=0;
    if(v.atkT&&now-v.atkT<320){var k=(now-v.atkT)/320;lunge=Math.sin(k*Math.PI)*.55*(p[0]===P.ch?-1:1);}
    var dodge=v.dodgeT&&now-v.dodgeT<300?Math.sin((now-v.dodgeT)/300*Math.PI)*.35:0;
    if(o.gone){ctx.globalAlpha=Math.max(0,1-o.v.ko.t/1.4);}
    var kind=p[8]||'player';
    MC.drawEntity(iso,{kind:kind,x:v.x+lunge,y:v.y-dodge,z:v.z+(o.gone?o.v.ko.t*.8:0),scale:sc,face:fighter?(p[0]===P.ch?3:1):v.dir,name:p[1],color:p[2],look:MC.look(p[0],p[2]),avatar:avatarImg(p[0]),
      anim:{walk:v.mv?v.walk:0,atk:v.atkT&&now-v.atkT<320?(now-v.atkT)/320:0,flash:v.hitT&&now-v.hitT<180?.7:0},shadow:.3},t);ctx.globalAlpha=1;});
  for(var tq=0;tq<2;tq++){torch(-.5,-.3+tq*0,0);torch(AC+.5,-.3,0);}
  /* labels: fighters get name + HP bar (+ crown and kills for the warrior); the queue gets small names, the next one "الجاي" */
  ctx.textAlign='center';ctx.textBaseline='bottom';ctx.direction='ltr';var nf=fs(8);var boxes=[];
  list.slice().reverse().forEach(function(o){var p=o.p,v=o.v;if(!p||o.gone)return;var fighter=p[0]===P.ch||p[0]===P.fo;
    if(fighter){var hp=iso.p(v.x,v.y,v.z+2.25);var bw=iso.tw*1.9,bh=Math.max(5,iso.tw*.16),x0=hp[0]-bw/2,y0=hp[1]-bh;var fr=Math.max(0,Math.min(1,p[3]/Math.max(1,p[4])));
      ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(x0-2,y0-2,bw+4,bh+4);ctx.fillStyle=fr>.5?'#4fdc5a':fr>.25?'#ffd23d':'#ff4a3a';ctx.fillRect(x0,y0,bw*fr,bh);
      label(hp[0],y0-2,p[3]+' / '+p[4],'#ffffff',fs(8.5),800);
      var nmY=y0-fs(8.5)-4;label(hp[0],nmY,(p[0]===P.ch?'👑 ':'')+short(nm(p),16),MC.readableColor(p[2]||(p[8]?'#c9ccf0':'#cfd3ff')),fs(12),900);
      if(p[0]===P.ch&&p[5]>0)label(hp[0],nmY-fs(12)-2,'⚔ '+(p[5]===1?T('hr_kill1'):T('hr_kills',{k:p[5]})),'#ffd23d',fs(9.5),900);
      if(P.ph==='duel'&&P.at===p[0]){var ap=iso.p(v.x,v.y,v.z+.05);ctx.fillStyle='rgba(255,210,61,.25)';ctx.beginPath();ctx.ellipse(ap[0],ap[1],iso.tw*.5,iso.tw*.25,0,0,Math.PI*2);ctx.fill();}
      return;}
    if(!CFG.names)return;var q=iso.p(v.x,v.y,v.z+2.05*qsc+.05);var first=P.p.filter(function(z){return z[6]==='queue'})[0];var nx=first&&first[0]===p[0];
    ctx.font='800 '+nf+'px Cairo,system-ui,sans-serif';var txt=short(nm(p),12);var w=ctx.measureText(txt).width+4,h=nf+2,r=[q[0]-w/2,q[1]-h,w,h];
    if(!nx&&boxes.some(function(b){return r[0]<b[0]+b[2]&&b[0]<r[0]+r[2]&&r[1]<b[1]+b[3]&&b[1]<r[1]+r[3];}))return;boxes.push(r);
    label(q[0],q[1],txt,MC.readableColor(p[2]||'#cfd3ff'),nf,800);if(nx)label(q[0],q[1]-nf-2,'▼ '+T('hr_next_up'),'#ffd23d',fs(8.5),900);});
  var more=Math.max(0,(P.qn||0)-nq);if(more>0){var mp=iso.p(AC+.6,-2.2,2);ctx.textAlign='left';label(mp[0],mp[1],'+'+more,'#c9ccf0',fs(12),900);ctx.textAlign='center';}
  if(P.ph==='wait'){var wp=iso.p(AC/2,MIDY,1.6);label(wp[0],wp[1],T('hr_wait'),'#ffffff',fs(13),900);}
  /* floating words */
  floats=floats.filter(function(f){f.t+=dt;if(f.t>1.1)return false;var p=iso.p(f.x,f.y,f.z+f.t*1.1);ctx.globalAlpha=Math.min(1,(1.1-f.t)*3);label(p[0],p[1],f.txt,f.col,fs(f.s),900);ctx.globalAlpha=1;return true;});
  parts=parts.filter(function(q){q.t+=dt;if(q.t>q.life)return false;q.vz-=10*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;ctx.globalAlpha=Math.min(1,(q.life-q.t)*3);cube(q.x,q.y,q.z,q.s,q.col);ctx.globalAlpha=1;return true;});if(parts.length>600)parts.splice(0,parts.length-600);
  if(!nobg){var dyn=[];if(duel)dyn.push({x:AC/2,y:MIDY,z:1.2,col:'#ffd8a0',r:5});MC.lighting(ctx,iso,L.lights,W,H,t,L.amb,dyn);}
  if(flashT>0){ctx.fillStyle='rgba(255,240,200,'+flashT+')';ctx.fillRect(0,0,W,H);flashT=Math.max(0,flashT-dt*1.4);}
  ctx.restore();
  if(now-hudT>200){hudT=now;hud();}
}
requestAnimationFrame(frame);

/* ---------- HUD (DOM) ---------- */
var bnT=null;
function banner(text,big){var el=$('hrBanner');el.textContent=text;el.className='bt-banner'+(big?' big':'');el.hidden=false;clearTimeout(bnT);bnT=setTimeout(function(){el.hidden=true},big?1800:1500);}
function status(t){var s=$('hrStatus');if(s)s.textContent=t;}
function headEl(u,color){var av=CFG.av&&String(u).indexOf('mob#')!==0?BT.avatar(u):null;var s=document.createElement('span');s.className='bt-head';
  if(av){var im=document.createElement('img');im.src=av;im.alt='';im.referrerPolicy='no-referrer';s.appendChild(im);}else{var lk=MC.look(u,color);var c=document.createElement('canvas');c.width=8;c.height=8;c.getContext('2d').drawImage(MC.face('player',lk.skin,lk.hair,lk.style),0,0);s.appendChild(c);}return s;}
var hk='',ck='';
function hud(force){var ph=P.ph,n=(P.p||[]).length;
  /* the warrior box: crown, picture, name, kills; the record under it */
  var cb=$('hrChamp'),c=P.ch?byU(P.ch):null;var k=JSON.stringify([c&&c.slice(0,6),P.rec,ph,EN(),P.qn,P.r]);
  if(k!==ck||force){ck=k;A.clear(cb);var top=document.createElement('div');top.className='hr-ct';
    if(c){top.appendChild(headEl(c[0],c[2]));var tx=document.createElement('div');tx.className='hr-cn';var l1=document.createElement('div');l1.className='hr-cl';l1.textContent='👑 '+T('hr_champ');tx.appendChild(l1);tx.appendChild(BT.name(nm(c),c[2],'hr-nm'));top.appendChild(tx);
      var kk=document.createElement('b');kk.className='hr-k';kk.textContent=String(c[5]);var ks=document.createElement('small');ks.textContent=EN()?'kills':'قتلات';var kw=document.createElement('div');kw.className='hr-kw';kw.appendChild(kk);kw.appendChild(ks);top.appendChild(kw);}
    else{var nn=document.createElement('div');nn.className='hr-cl';nn.textContent=ph==='lobby'?T('hr_lobby')+' · '+T('hr_players',{n:n}):T('hr_none');top.appendChild(nn);}
    cb.appendChild(top);var sub=document.createElement('div');sub.className='hr-sub';var bits=[];if(ph!=='lobby'&&P.r)bits.push(T('hr_duel',{r:P.r}));if(ph!=='lobby')bits.push(T('hr_queue',{n:P.qn||0}));if(P.rec)bits.push(T('hr_rec',{n:short(P.rec[1],14),k:P.rec[3]}));sub.textContent=bits.join(' · ');if(bits.length)cb.appendChild(sub);}
  var jk=JSON.stringify([EN()]);if(jk!==hk||force){hk=jk;var jb=$('hrJoin');A.clear(jb);var l1b=document.createElement('div');l1b.className='bt-join-l';BT.fill(l1b,T('hr_join_box',{j:'\u0001'}),[BT.cmdEl(EN()?'!join':'!دخول')]);jb.appendChild(l1b);
    var l2=document.createElement('div');l2.className='bt-join-s';var pcs=T('hr_join_box2',{s:'\u0001',h:'\u0002'}).split(/([\u0001\u0002])/);pcs.forEach(function(x){if(x==='\u0001')l2.appendChild(BT.cmdEl(EN()?'!stats ABCD':'!احصائيات ABCD'));else if(x==='\u0002')l2.appendChild(BT.cmdEl(EN()?'!heal':'!علاج'));else if(x)l2.appendChild(document.createTextNode(x));});jb.appendChild(l2);}
  /* end card */
  var w=$('hrWin');if(ph==='end'){var wk=JSON.stringify([c&&c[0],P.rec,EN()]);if(w._k!==wk){w._k=wk;A.clear(w);var h=document.createElement('h3');h.textContent='👑 '+T('hr_end_t');w.appendChild(h);var ul=document.createElement('ul');
      if(c){var li=document.createElement('li');li.appendChild(headEl(c[0],c[2]));li.appendChild(BT.name(nm(c),c[2]));var sm=document.createElement('small');sm.textContent=' · '+(c[5]===1?T('hr_kill1'):T('hr_kills',{k:c[5]}));li.appendChild(sm);ul.appendChild(li);}w.appendChild(ul);
      if(P.rec){var rp=document.createElement('p');rp.className='hr-recp';rp.textContent='🏆 '+T('hr_end_rec')+': '+P.rec[1]+' · '+T('hr_kills',{k:P.rec[3]});w.appendChild(rp);}
      w.className='bt-win won';w.hidden=false;}}else{w.hidden=true;w._k='';}
  /* !معلومات card */
  var gi=$('hrInfo');if(P.gi){var g=P.gi;var gk=JSON.stringify([g.u,g.l,g.hp,g.kills,g.state,EN()]);if(gi._k!==gk){gi._k=gk;A.clear(gi);var hd=document.createElement('div');hd.className='hi-h';hd.appendChild(headEl(g.u,g.c));var tt=document.createElement('div');
      tt.appendChild(BT.name(g.bot?T('mob_'+g.bot):g.name,g.c,'gi-nm'));var s1=document.createElement('div');s1.className='hi-s';s1.textContent=(g.state==='champ'?T('hr_state_champ'):g.state==='fight'?T('hr_state_fight'):g.pos?T('hr_pos',{p:g.pos}):'')+(g.bot?'':' · LV '+lvOf(g.u));tt.appendChild(s1);hd.appendChild(tt);gi.appendChild(hd);
      if(!g.bot){var lt=document.createElement('div');lt.className='hi-l';lt.textContent=T('hr_letters')+': ';var lb=document.createElement('b');lb.dir='ltr';lb.textContent=g.l.split('').join(' ');lt.appendChild(lb);gi.appendChild(lt);}
      var bars=document.createElement('div');bars.className='hi-bars';[['at','⚔️'],['df','🛡️'],['sp','💨'],['hp','❤️']].forEach(function(s,i){var r=document.createElement('div');r.className='hi-r';var a=document.createElement('span');a.textContent=s[1]+' '+T('hr_'+s[0])+(g.bot?'':' ('+g.l.charAt(i)+')');var bb=document.createElement('i');var f=document.createElement('u');f.style.width=Math.round(Math.min(100,g.st[s[0]]))+'%';bb.appendChild(f);var v=document.createElement('b');v.textContent=String(g.st[s[0]]);r.appendChild(a);r.appendChild(bb);r.appendChild(v);bars.appendChild(r);});gi.appendChild(bars);
      var s2=document.createElement('div');s2.className='hi-s';s2.textContent='❤️ '+g.hp+' / '+g.max+' · '+T('hr_dc',{d:g.dodge,c:g.crit});gi.appendChild(s2);
      var s3=document.createElement('div');s3.className='hi-s';s3.textContent='⚔ '+(g.kills===1?T('hr_kill1'):T('hr_kills',{k:g.kills}))+' · '+T('hr_best',{b:g.best,w:g.wins});gi.appendChild(s3);gi.hidden=false;}}else{gi.hidden=true;gi._k='';}
  if(!A.obs)ctrlHud();}
function ctrlHud(){var ph=G.phase;$('hrGo').textContent=T(ph==='lobby'?'hr_start':ph==='end'?'hr_again':ph==='duel'||ph==='intro'?'hr_skip':'hr_next');$('hrPause').textContent=T(G.paused?'hr_resume':'hr_pause');$('hrPause').disabled=(ph==='lobby'||ph==='end');$('hrStop').disabled=(ph==='lobby'||ph==='end');
  var c=G.players[G.champ],f=G.players[G.foe];var st=G.paused?T('hr_st_paused'):ph==='lobby'?T('hr_st_lobby',{n:G.queue.length}):(ph==='intro'||ph==='duel')?T('hr_st_duel',{r:G.round,a:c?c.name:'',b:f?(f.bot?T('mob_'+f.bot):f.name):''}):ph==='after'?T('hr_st_after',{n:G.queue.length}):ph==='wait'?T('hr_st_wait'):T('hr_st_end',{w:c?c.name:'—'});status(st);
  $('hrN').textContent=String(Object.keys(G.players).length);}
/* ---------- control panel ---------- */
if(!A.obs){
  $('hrGo').addEventListener('click',go);$('hrPause').addEventListener('click',pauseT);$('hrStop').addEventListener('click',endGame);$('hrNew').addEventListener('click',newGame);$('hrClear').addEventListener('click',clearAll);
  $('hrDemoAdd').addEventListener('click',function(){var B=A.BOTS||[];for(var i=0;i<20;i++){var b=B[i%Math.max(1,B.length)]||['Bot','#ffd23d'];var nm2=(b[0]||'Bot')+(i>=B.length?'_'+(Math.floor(i/Math.max(1,B.length))+1):'');G.join('demo_h'+i,nm2,b[1]);}P=G.pub();A.publish(P);hud(true);});
  BT.tmr($('hrBrkRow'),function(){return CFG.brk},function(v){CFG.brk=v;apply();save();},4);
  BT.tmr($('hrJoinRow'),function(){return CFG.join},function(v){CFG.join=v;joinEnd=v>0?Date.now()+v*1000:0;save();},60);
  var spd=$('hrSpeed');spd.value=CFG.speed;spd.addEventListener('change',function(){CFG.speed=spd.value;apply();save();});
  var bx=$('hrBoss');bx.value=String(CFG.boss);bx.addEventListener('change',function(){CFG.boss=+bx.value;apply();save();});
  var hl=$('hrHeal');hl.value=String(CFG.heal);hl.addEventListener('change',function(){CFG.heal=+hl.value;apply();save();});
  var mp=$('hrMap');mp.value=CFG.map;mp.addEventListener('change',function(){CFG.map=mp.value;save();layKey='';});
  [['hrStreamer','streamer'],['hrRespawn','respawn'],['hrBots','bots'],['hrAv','av'],['hrNames','names']].forEach(function(a){var e=$(a[0]);e.checked=!!CFG[a[1]];e.addEventListener('change',function(){CFG[a[1]]=e.checked;apply();save();hud(true);});});
  BT.xtra($('hrXtra'),'lamma-hrxtra');if(CFG.join>0)joinEnd=Date.now()+CFG.join*1000;A.onLang(function(){hud(true);});}
if(window.LammaAvatars&&LammaAvatars.onChange)LammaAvatars.onChange(function(){hud(true);});
/* demo chat: bots join, try letter combinations, the warrior heals */
A.onDemo(function(){var bots=A.BOTS.slice(0,14);bots.forEach(function(b,i){A.later(150+i*160,function(){A.say(i%2?'!join':'!دخول',A.bot(i));});});
  setInterval(function(){if(!A.demo())return;if(G.phase==='after'&&G.champ&&!G.players[G.champ].bot&&Math.random()<.5){var c=G.players[G.champ];A.say(Math.random()<.5?'!heal':'!علاج',{user:c.user,name:c.name,color:c.color});}
    if(Math.random()<.35){var q=G.queue[Math.floor(Math.random()*G.queue.length)];var p=q&&G.players[q];if(p&&!p.bot){var L='';for(var i=0;i<4;i++)L+=String.fromCharCode(65+Math.floor(Math.random()*26));A.say((Math.random()<.5?'!stats ':'!احصائيات ')+L,{user:p.user,name:p.name,color:p.color});}}},1500);});

var PANEL=BT.panel({key:'hero',root:$('gs'),stage:$('stage'),onPause:pauseT,isPaused:function(){return !!G.paused},canPause:function(){return G.phase!=='lobby'&&G.phase!=='end'},onNext:go,
  cmds:[['!دخول','!join','تحدّى المحارب','challenge'],['!احصائيات ABCD','!stats ABCD','حروفك: هجوم دفاع سرعة صحة','your letters: atk def spd hp'],['!علاج','!heal','تعالج بين المبارزات','heal between duels'],['!معلومات','!getinfo','شوف حالك','your card'],['!خروج','!leave','اطلع','leave']],
  short:['المحارب بيضل بالساحة وكل واحد بيتحداه بدورو. لاقي أحسن 4 حروف إلك بـ !احصائيات!','The warrior holds the arena and everyone challenges him in turn. Find your best 4 letters with !stats!'],
  how:[['الشات بيدخل بـ !دخول وبيوقف عالمدرّج ناطر دورو.','المحارب واقف بالساحة. كل مرة بيفوت أول واحد بالدور وبتصير مبارزة بالدور: الأسرع بيضرب أول، وفي تفادي وضربات قوية.','اللي بيربح بيضل المحارب وبتزيد قتلاتو، واللي بيخسر بيرجع عآخر الدور بصحة كاملة.','كل واحد إلو 4 حروف من A لـ Z: هجوم، دفاع، سرعة، صحة. قيمة كل حرف بتختلف حسب اسمك وبتتغيّر كل شهر، فجرّب تركيبات بـ !احصائيات ABCD لحتى تلاقي الأقوى.','المحارب بيقدر يكتب !علاج بين المبارزات ليرجّع شوية صحة.'],
       ['Chat joins with !join and waits on the stands.','The warrior stands in the arena. The first one in line steps in for a turn-based duel: the faster one strikes first, with dodges and crits.','The winner stays the warrior and adds a kill; the loser goes to the back of the line with full HP.','Everyone has 4 letters A–Z: attack, defence, speed, life. What a letter is worth depends on your name and changes every month, so try combinations with !stats ABCD until you find the strongest.','The warrior can type !heal between duels to get some HP back.']],
  ctrl:[['!ابدأ','!start','بلّش (مود)','start (mod)'],['!التالي','!next','المبارزة الجاية / خلّصها (مود)','next duel / finish it (mod)'],['!وقف','!pause','وقف / كمّل (مود)','pause / resume (mod)'],['!خلص','!end','خلّص اللعبة (مود)','end the game (mod)'],['Space','Space','وقف / كمّل','pause / resume'],['N','N','المبارزة الجاية','next duel'],['F','F','شاشة كاملة','fullscreen']]});
/* ---------- layout editor ---------- */
BT.logo($('btLogo'));
window.LammaLayout&&window.LammaLayout.init({root:$('gs'),stage:$('stage'),key:'hero',items:[
  {id:'field',z:1,code:'a',kind:'box',ar:'الساحة',en:'Arena',def:{x:22,y:0,w:78,h:100,s:1},minW:30,minH:30},
  {id:'champ',z:4,code:'c',kind:'box',ar:'المحارب والقتلات',en:'Warrior & kills',def:{x:40,y:1.5,w:40,h:15.5,s:1},minW:14,minH:6},
  {id:'join',z:3,code:'j',kind:'box',ar:'صندوق الدخول',en:'Join box',def:{x:36,y:88.5,w:50,h:9.5,s:1},minW:12,minH:5},
  PANEL.item
]});
hud(true);A.publish(P);
A.start();
})();
