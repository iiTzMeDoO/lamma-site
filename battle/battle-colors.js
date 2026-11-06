/* battle-colors.js — لعبة الألوان / Colour Floor (Kukoro "Colorblind" system, Minecraft wool look).
   20 numbered wool columns; each round a target colour shows on top with a timer; chat types !1…!20 (or just the number) to stand
   on a column and can change their mind until the reveal; everyone not on the colour falls into the void (round 1 also saves the
   neighbouring column, Kukoro's rule). 5 rounds (setting), the gradient narrows every round, round 5 = "آخر جولة!". Up to hundreds
   of players: each column shows its first figures and a "+N". The control page runs the game (BT.Colors in btcore.js) and mirrors
   it to the OBS overlay; the overlay can also run on its own from mods' chat commands (!ابدأ / !التالي / !وقف). */
(function(){
'use strict';
var A=window.App,BT=window.BT,MC=window.MC,$=A.$;
A.strings({
 ar:{g_title:'لعبة الألوان',g_how:'الشات بيدخل بـ !دخول، وبكل جولة بيبين لون فوق: كل واحد بيكتب رقم العمود اللي لونو نفسو. اللي غلط بيوقع.',
  bc_start:'ابدأ اللعبة',bc_reveal:'اكشف هلأ',bc_next:'الجولة الجاية',bc_again:'العب مرة تانية',bc_pause:'وقف مؤقت',bc_resume:'كمّل',bc_new:'لعبة جديدة (نفس اللاعبين)',bc_clear:'مسح الكل',
  bc_hint:'الشات بيدخل بـ !دخول، وبالجولة بيكتب رقم العمود (!7 أو 7). اللي مش على اللون الصح بيوقع.',bt_settings:'الإعدادات',bc_pick_t:'وقت الجولة',bc_rounds:'عدد الجولات',bt_more:'خيارات زيادة',
  bc_auto:'الجولة الجاية لحالها بعد',bt_join_t:'وقت الدخول',bc_late:'رقم بالجولة الأولى بيدخّل اللاعب',bc_nb:'الجولة الأولى: العمود الجنب كمان بينجّي',bt_av:'صور تويتش على الراس',bt_map:'الخلفية',
  bt_nolimit:'بلا وقت',bt_manual:'إنت بتضغط',bt_sec:'ث',map_plains:'سهول',map_desert:'صحراء',map_nether:'النذر',map_end:'النهاية',map_cave:'الكهف',
  bc_round:'الجولة {r}/{n}',bc_lastr:'آخر جولة!',bc_alive:'{a} من {n} لسا واقفين',bc_lobby:'الدخول مفتوح',bc_players:'{n} لاعب',
  bc_join_box:'اكتب {j} لتدخل',bc_join_box2:'وبالجولة اكتب رقم العمود {c}',bc_pick_now:'اكتب رقم العمود اللي لونو متل فوق!',
  bc_st_lobby:'الدخول مفتوح: {n} لاعب. اضغط "ابدأ اللعبة" لما تجهز.',bc_st_pick:'الجولة {r}: الشات عم يختار. {a} لاعب لسا واقفين.',bc_st_reveal:'وقع {f}، وضل {a}.',bc_st_end:'خلصت! الفايزين: {w}',bc_st_paused:'موقّف مؤقتاً',
  bc_fell:'وقع {n}!',bc_safe:'ما حدا وقع!',bc_win_t:'الفايزين',bc_win_one:'البطل',bc_win_none:'ما ضل حدا',bc_need:'لازم لاعب واحد عالأقل',
  bt_c_join:'دخول',bt_c_col:'رقم العمود',bt_c_cstart:'بلّش',bt_c_cnext:'اكشف / الجولة الجاية',bt_c_pause:'وقف مؤقت'},
 en:{g_title:'Colour Floor',g_how:'Chat joins with !join. Each round a colour shows on top: type the number of the column with the same colour. Wrong column falls.',
  bc_start:'Start game',bc_reveal:'Reveal now',bc_next:'Next round',bc_again:'Play again',bc_pause:'Pause',bc_resume:'Resume',bc_new:'New game (same players)',bc_clear:'Clear all',
  bc_hint:'Chat joins with !join, then types a column number each round (!7 or 7). Anyone not on the right colour falls.',bt_settings:'Settings',bc_pick_t:'Round time',bc_rounds:'Rounds',bt_more:'More options',
  bc_auto:'Next round by itself after',bt_join_t:'Join time',bc_late:'A number in round 1 joins the player',bc_nb:'Round 1: the next column is safe too',bt_av:'Twitch pictures on heads',bt_map:'Backdrop',
  bt_nolimit:'No limit',bt_manual:'You press',bt_sec:'s',map_plains:'Plains',map_desert:'Desert',map_nether:'Nether',map_end:'The End',map_cave:'Cave',
  bc_round:'Round {r}/{n}',bc_lastr:'Last round!',bc_alive:'{a} of {n} still standing',bc_lobby:'Join is open',bc_players:'{n} players',
  bc_join_box:'Type {j} to join',bc_join_box2:'then type a column number {c}',bc_pick_now:'Type the number of the column with this colour!',
  bc_st_lobby:'Join is open: {n} players. Press "Start game" when ready.',bc_st_pick:'Round {r}: chat is choosing. {a} still standing.',bc_st_reveal:'{f} fell, {a} left.',bc_st_end:'Done! Winners: {w}',bc_st_paused:'Paused',
  bc_fell:'{n} fell!',bc_safe:'Nobody fell!',bc_win_t:'Winners',bc_win_one:'Champion',bc_win_none:'Nobody left',bc_need:'Needs at least one player',
  bt_c_join:'join',bt_c_col:'column number',bt_c_cstart:'start',bt_c_cnext:'reveal / next round',bt_c_pause:'pause'}
});
function T(k,o){var s=A.t(k);if(o)Object.keys(o).forEach(function(x){s=s.split('{'+x+'}').join(o[x])});return s;}
var KEY='lamma-bc-'+A.channel,store=BT.store(KEY);
var G=new BT.Colors({rounds:5});
var CFG={pick:15,auto:4,join:0,late:true,nb:true,av:true,map:'plains',rounds:5};
var Q=A.Q;if(A.obs){if(Q.get('pk')!=null)CFG.pick=+Q.get('pk')||0;if(Q.get('rd'))CFG.rounds=+Q.get('rd')||5;if(Q.get('map'))CFG.map=Q.get('map');if(Q.get('av'))CFG.av=Q.get('av')==='1';if(Q.get('au')!=null)CFG.auto=+Q.get('au')||0;}
else{var sv=store.get();if(sv&&sv.cfg)Object.keys(CFG).forEach(function(k){if(sv.cfg[k]!=null)CFG[k]=sv.cfg[k]});}
var S={deadline:0,paused:false,left:0,revealAt:0,nextAt:0,joinEnd:0};
function apply(){G.rounds=CFG.rounds;G.lateJoin=CFG.late;G.neighbour=CFG.nb;}
apply();
function save(){if(A.obs)return;store.set({cfg:CFG,g:G.pub(),s:{paused:S.paused}});A.updateObsUrl();}
A.obsExtra(function(){return '&pk='+CFG.pick+'&rd='+CFG.rounds+'&map='+CFG.map+'&av='+(CFG.av?1:0)+'&au='+CFG.auto;});

/* ---------- engine (control page, or the overlay on its own) ---------- */
function engine(){return A.runsEngine();}
function startGame(){if(!G.order.length){flash(T('bc_need'));return;}apply();G.start();A.roundStart();S.deadline=CFG.pick>0?Date.now()+CFG.pick*1000:0;S.paused=false;A.sfx('start');changed();}
function reveal(){var r=G.reveal();if(!r)return;S.deadline=0;A.sfx(r.fall.length?'boom':'win');
  banner(r.fall.length?T('bc_fell',{n:r.fall.length}):T('bc_safe'));
  if(r.end){A.roundEnd({players:G.order.map(function(u){return [u,(G.players[u]||{}).name]}),winners:G.winners.map(function(u){return [u,(G.players[u]||{}).name]})});S.nextAt=0;setTimeout(function(){A.sfx('win');A.confetti($('stage'),90);},900);}
  else S.nextAt=CFG.auto>0?Date.now()+CFG.auto*1000+1600:0;
  changed();}
function nextRound(){if(G.phase!=='reveal')return;G.nextRound();S.nextAt=0;S.deadline=CFG.pick>0?Date.now()+CFG.pick*1000:0;if(G.isLast())banner(T('bc_lastr'),true);A.sfx('go');changed();}
function go(){if(G.phase==='lobby'||G.phase==='end')startGame();else if(G.phase==='pick')reveal();else if(G.phase==='reveal')nextRound();}
function pause(){if(G.phase!=='pick'&&G.phase!=='reveal')return;if(!S.paused){S.paused=true;S.left=S.deadline?Math.max(0,S.deadline-Date.now()):0;S.nleft=S.nextAt?Math.max(0,S.nextAt-Date.now()):0;S.deadline=0;S.nextAt=0;}
  else{S.paused=false;if(S.left)S.deadline=Date.now()+S.left;if(S.nleft)S.nextAt=Date.now()+S.nleft;}changed();}
function newGame(){var keep=G.order.map(function(u){var p=G.players[u];return [u,p.name,p.color]});G.reset();apply();keep.forEach(function(k){G.join(k[0],k[1],k[2])});S.paused=false;S.deadline=0;S.nextAt=0;$('bcWin').hidden=true;changed();}
function clearAll(){G.reset();apply();S.paused=false;S.deadline=0;S.nextAt=0;$('bcWin').hidden=true;changed();}
setInterval(function(){if(!engine()||S.paused)return;var n=Date.now();
  if(G.phase==='pick'&&S.deadline&&n>=S.deadline)reveal();
  else if(G.phase==='reveal'&&S.nextAt&&n>=S.nextAt)nextRound();
  if(G.phase==='pick'&&S.deadline){var left=Math.ceil((S.deadline-n)/1000);if(left<=5&&left>0&&left!==S._tick){S._tick=left;A.sfx('tick');}}
},200);

A.onChat(function(m){if(!engine())return;var c=BT.cmd(m.text);
  if(c&&BT.MODK[c.k]){if(!A.isCtrl(m))return;if(c.k==='start'){if(G.phase==='lobby'||G.phase==='end')startGame();else go();}else if(c.k==='next')go();else if(c.k==='pause')pause();else if(c.k==='reset')newGame();return;}
  if(c&&c.k==='join'){if(G.join(m.user,m.name,m.color))changed();return;}
  if(c&&c.k==='leave'){if(G.leave(m.user))changed();return;}
  var n=BT.colNum(m.text,G.n);if(n>=0){if(G.phase==='lobby'){if(CFG.late&&G.join(m.user,m.name,m.color))changed();return;}if(G.choose(m.user,n,m.name,m.color))changedSoft();}
});
/* ---------- sync ---------- */
var pubT=null;
function pubState(){return {g:G.pub(),dl:S.deadline,na:S.nextAt,pa:S.paused,left:S.left,cfg:{map:CFG.map,av:CFG.av,pick:CFG.pick},bn:S.bn||null};}
function changed(){render();save();A.publish(pubState());}
function changedSoft(){render();if(!pubT)pubT=setTimeout(function(){pubT=null;save();A.publish(pubState());},180);}
A.onMirror(function(s){if(!s||!s.g)return;G.load(s.g);S.deadline=s.dl;S.nextAt=s.na;S.paused=s.pa;S.left=s.left;if(s.cfg){CFG.map=s.cfg.map;CFG.av=s.cfg.av;CFG.pick=s.cfg.pick;}
  if(s.bn&&(!S.bn||s.bn.t!==S.bn.t)){S.bn=s.bn;showBanner(s.bn);}render();});
A.allowSolo();

/* ---------- banners ---------- */
var bnT=null;
function banner(text,big){S.bn={t:Date.now(),x:text,b:!!big};showBanner(S.bn);}
function showBanner(b){var el=$('bcBanner');el.textContent=b.x;el.className='bt-banner'+(b.b?' big':'');el.hidden=false;clearTimeout(bnT);bnT=setTimeout(function(){el.hidden=true},b.b?2600:1800);}
function flash(t){var st=$('bcStatus');if(st)st.textContent=t;}

/* ---------- DOM render (target box, join box, status, winners) ---------- */
function render(){
  var pub=G.pub(),al=G.alive().length,n=G.order.length;
  var sw=$('bcSw'),q=$('bcQ');
  if(G.phase==='lobby'){sw.style.background='';sw.classList.add('empty');q.textContent='?';}
  else{sw.classList.remove('empty');sw.style.background=pub.tc;q.textContent='';}
  $('bcRound').textContent=G.phase==='lobby'?T('bc_lobby'):T('bc_round',{r:G.round,n:G.rounds});
  var last=$('bcLast');last.hidden=!(G.isLast()&&G.phase==='pick');last.textContent=T('bc_lastr');
  $('bcAlive').textContent=G.phase==='lobby'?T('bc_players',{n:n}):T('bc_alive',{a:al,n:n});
  var jb=$('bcJoin');A.clear(jb);
  var l1=document.createElement('div');l1.className='bt-join-l';BT.fill(l1,T('bc_join_box',{j:'\u0001'}),[BT.cmdEl('!دخول'),' / ',BT.cmdEl('!join')]);jb.appendChild(l1);
  var l2=document.createElement('div');l2.className='bt-join-s';BT.fill(l2,T('bc_join_box2',{c:'\u0001'}),[BT.ltr([BT.cmdEl('!1'),' … ',BT.cmdEl('!20')])]);jb.appendChild(l2);
  /* winners card */
  var w=$('bcWin');
  if(G.phase==='end'){var ws=G.winners;A.clear(w);var h=document.createElement('h3');h.textContent=ws.length===1?('👑 '+T('bc_win_one')):ws.length?('👑 '+T('bc_win_t')):T('bc_win_none');w.appendChild(h);
    var ul=document.createElement('ul');ws.slice(0,24).forEach(function(u){var p=G.players[u];var li=document.createElement('li');li.appendChild(headEl(u,p.color,p.name));li.appendChild(BT.name(p.name,p.color));ul.appendChild(li);});w.appendChild(ul);
    if(ws.length>24){var more=document.createElement('p');more.textContent='+'+(ws.length-24);w.appendChild(more);}w.hidden=false;}
  else w.hidden=true;
  /* control page */
  if(!A.obs){var gb=$('bcGo');gb.textContent=T(G.phase==='lobby'?'bc_start':G.phase==='pick'?'bc_reveal':G.phase==='reveal'?'bc_next':'bc_again');
    $('bcPause').textContent=T(S.paused?'bc_resume':'bc_pause');$('bcPause').disabled=!(G.phase==='pick'||G.phase==='reveal');
    var st=S.paused?T('bc_st_paused'):G.phase==='lobby'?T('bc_st_lobby',{n:n}):G.phase==='pick'?T('bc_st_pick',{r:G.round,a:al}):G.phase==='reveal'?T('bc_st_reveal',{f:G.lastFall.length,a:al}):T('bc_st_end',{w:G.winners.map(function(u){return G.players[u].name}).slice(0,6).join('، ')||'—'});
    flash(st);}
}
function headEl(u,color,name){var av=CFG.av?BT.avatar(u):null;var s=document.createElement('span');s.className='bt-head';
  if(av){var im=document.createElement('img');im.src=av;im.alt='';im.referrerPolicy='no-referrer';s.appendChild(im);}else{var lk=MC.look(u,color);s.style.background=lk.shirt;s.textContent=Array.from(String(name||'?'))[0].toUpperCase();}return s;}

/* ---------- canvas: wool columns + blocky players ---------- */
var STG=$('stage'),cv=$('bcCanvas'),ctx=cv.getContext('2d'),W=0,H=0,DPR=1,bgCache=null,bgKey='';
var FIG={};/* user → {x,y,vy,fall,t0,col} animation state */
function size(){var r=cv.parentNode.getBoundingClientRect();var w=Math.max(200,Math.round(r.width)),h=Math.max(120,Math.round(r.height));DPR=Math.min(2,window.devicePixelRatio||1);if(w!==W||h!==H||cv.width!==Math.round(w*DPR)){W=w;H=h;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);bgKey='';}}
function backdrop(){var key=CFG.map+W+'x'+H;if(bgKey===key&&bgCache)return bgCache;var M=MC.MAPS[CFG.map]||MC.MAPS.plains;var c=MC.mk(Math.round(W*DPR),Math.round(H*DPR)),x=c.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);
  var g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,M.sky[0]);g.addColorStop(1,M.sky[1]);x.fillStyle=g;x.fillRect(0,0,W,H);
  var r=MC.rng(5),bs=Math.max(8,Math.round(W/64));
  /* distant blocky hills / pillars */
  for(var layer=0;layer<2;layer++){var base=H*(.42+layer*.1),col=MC.shade(M.sky[1],1.6-layer*.35);x.fillStyle=col;var hh=0;for(var i=0;i<W;i+=bs){hh=Math.max(0,Math.min(H*.25,hh+(r()-.5)*bs*2.2));x.fillRect(i,base-hh,bs,H);}}
  if(M.void){for(var s=0;s<120;s++){x.fillStyle='rgba(230,210,255,'+(r()*.6+.1)+')';x.fillRect(r()*W,r()*H*.6,1.5,1.5);}}
  bgCache=c;bgKey=key;return c;}
function colGeom(){var n=G.n,mx=W*.025,cw=(W-mx*2)/n,top=H*.5,bottom=H*.86;return {n:n,mx:mx,cw:cw,top:top,bot:bottom,depth:Math.min(cw*.32,H*.04)};}
function drawFigure(x,y,s,u,p,alpha,rot){ /* x,y = feet; s = block size (figure is 2s tall, 1s wide) */
  var lk=MC.look(u,p.color);ctx.save();ctx.globalAlpha=alpha==null?1:alpha;ctx.translate(x,y);if(rot)ctx.rotate(rot);
  var w=s*.5,hh=s*.5;ctx.fillStyle='rgba(0,0,0,.35)';if(!rot)ctx.fillRect(-w*.6,-1,w*1.2,2);
  ctx.fillStyle=lk.pants;ctx.fillRect(-w/2,-s*.75,w/2,s*.75);ctx.fillStyle=MC.shade(lk.pants,.8);ctx.fillRect(0,-s*.75,w/2,s*.75);
  ctx.fillStyle=lk.shirt;ctx.fillRect(-w/2,-s*1.5,w,s*.78);ctx.fillStyle=MC.shade(lk.shirt,.78);ctx.fillRect(-w/2-w*.45,-s*1.5,w*.45,s*.7);ctx.fillRect(w/2,-s*1.5,w*.45,s*.7);
  var av=CFG.av?BT.avatar(u):null,im=av?BT.img(av):null;ctx.imageSmoothingEnabled=!!(im&&im.complete&&im.naturalWidth);
  if(im&&im.complete&&im.naturalWidth){ctx.drawImage(im,-hh/2,-s*2,hh,hh);}else{ctx.imageSmoothingEnabled=false;ctx.drawImage(MC.face('player',lk.skin,lk.hair,lk.style),-hh/2,-s*2,hh,hh);}
  ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=Math.max(1,s/18);ctx.strokeRect(-hh/2,-s*2,hh,hh);
  ctx.restore();}
function frame(now){
  requestAnimationFrame(frame);size();if(!W)return;var t=now/1000;
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.imageSmoothingEnabled=false;if(STG.classList.contains('lay-nobg'))ctx.clearRect(0,0,W,H);else ctx.drawImage(backdrop(),0,0,W,H);
  var g=colGeom(),pal=G.pal,reveal=(G.phase==='reveal'||G.phase==='end'),tol=G.tol();
  /* columns: ONE seamless gradient strip (Kukoro Colorblind floor) — no gaps, no outlines, no gridlines between colours */
  var now2=Date.now(),hb=g.bot-g.top;
  for(var i=0;i<g.n;i++){var x=g.mx+i*g.cw,ok=reveal&&Math.abs(i-G.target)<=tol,gone=reveal&&!ok;
    var drop=gone?Math.min(1,(now2-(S._rv||now2))/700):0;var y0=g.top+drop*H*.6;
    ctx.globalAlpha=gone?Math.max(0,1-drop*1.2):1;
    var x0=Math.floor(x),x1=Math.ceil(x+g.cw)+(i<g.n-1?1:0);/* 1px overlap into the next colour: no hairline seam */
    ctx.fillStyle=pal[i];ctx.fillRect(x0,Math.floor(y0),x1-x0,Math.ceil(hb)+1);
    ctx.fillStyle=MC.shade(pal[i],1.18);ctx.fillRect(x0,Math.floor(y0-g.depth),x1-x0,Math.ceil(g.depth)+1);
    if(ok&&reveal){ctx.globalAlpha=.18+Math.sin(t*6)*.12;ctx.fillStyle='#fff';ctx.fillRect(x0,Math.floor(y0-g.depth),x1-x0,Math.ceil(hb+g.depth));}
    ctx.globalAlpha=1;}
  /* one soft light across the whole strip (top highlight, darker toward the bottom) — drawn once so it never marks the columns */
  var sh=ctx.createLinearGradient(0,g.top-g.depth,0,g.bot);sh.addColorStop(0,'rgba(255,255,255,.16)');sh.addColorStop(.12,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(0,0,0,.22)');
  ctx.fillStyle=sh;
  if(!reveal)ctx.fillRect(Math.floor(g.mx),Math.floor(g.top-g.depth),Math.ceil(g.cw*g.n),Math.ceil(hb+g.depth)+1);
  else for(var i2=0;i2<g.n;i2++){if(Math.abs(i2-G.target)<=tol){var xa=Math.floor(g.mx+i2*g.cw);ctx.fillRect(xa,Math.floor(g.top-g.depth),Math.ceil(g.mx+(i2+1)*g.cw)-xa+(i2<g.n-1?1:0),Math.ceil(hb+g.depth)+1);}}
  /* numbers BELOW the strip: !1 … !20 (every 5th only when the columns are too narrow) */
  var fsn=Math.max(9,Math.min(g.cw*.42,H*.042)),every=g.cw<fsn*1.9?5:1;ctx.font='800 '+fsn+'px Cairo,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='ltr';
  for(var i3=0;i3<g.n;i3++){var num=i3+1;if(every>1&&num!==1&&num%every)continue;var nx=g.mx+i3*g.cw+g.cw/2,ny=g.bot+fsn*1.05;
    var okc=reveal&&Math.abs(i3-G.target)<=tol;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillText('!'+num,nx+1,ny+1);ctx.fillStyle=okc?'#ffd23d':'#fff';ctx.fillText('!'+num,nx,ny);}
  /* players: stacks per column (alive), lobby crowd, falling */
  var pub=G.order,per=[],s=Math.min(g.cw*.85,H*.11);for(var k=0;k<g.n;k++)per.push([]);var crowd=[];
  pub.forEach(function(u){var p=G.players[u];if(!p.alive){if(G.lastFall.indexOf(u)>=0)fallFig(u,p);return;}if(p.col>=0)per[p.col].push(u);else crowd.push(u);});
  var maxRows=3,perRow=Math.max(1,Math.floor(g.cw/(s*.55)));
  per.forEach(function(list,ci){var x=g.mx+ci*g.cw+g.cw/2;var shown=Math.min(list.length,perRow*maxRows);
    for(var j=shown-1;j>=0;j--){var u=list[j],p=G.players[u],row=Math.floor(j/perRow),inRow=j%perRow,cnt=Math.min(perRow,shown-row*perRow);
      var tx=x+(inRow-(cnt-1)/2)*s*.55,ty=g.top-g.depth*.4-row*s*.32;var f=FIG[u]||(FIG[u]={x:tx,y:ty});f.x+=(tx-f.x)*.18;f.y+=(ty-f.y)*.18;f.fall=0;
      var hop=Math.abs(tx-f.x)>2?Math.abs(Math.sin(t*14))*s*.12:0;drawFigure(f.x,f.y-hop,s*(1-row*.08),u,p,1);}
    if(list.length){var fs3=Math.max(9,s*.34);ctx.font='800 '+fs3+'px Cairo,system-ui';ctx.textAlign='center';ctx.direction='ltr';var ly=g.top-g.depth-s*2.1-(Math.min(maxRows,Math.ceil(shown/perRow))-1)*s*.32;var lbl=String(list.length);var tw2=ctx.measureText(lbl).width+fs3*.6;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x-tw2/2,ly-fs3*1.05,tw2,fs3*1.25);ctx.fillStyle=list.length>shown?'#ffd23d':'#fff';ctx.fillText(lbl,x,ly-fs3*.15);}
  });
  /* not-yet-chosen players wait on a ledge above (up to 60 shown, then +N) */
  var cs=s*.62,cap=Math.min(crowd.length,60),rowN=Math.max(1,Math.floor(W*.9/(cs*.6)));
  for(var c2=0;c2<cap;c2++){var u2=crowd[c2],p2=G.players[u2],rr=Math.floor(c2/rowN),ii=c2%rowN,cntr=Math.min(rowN,cap-rr*rowN);var tx2=W/2+(ii-(cntr-1)/2)*cs*.6,ty2=H*.3-rr*cs*.5+(G.phase==='lobby'?H*.06:0);
    var f2=FIG[u2]||(FIG[u2]={x:tx2,y:ty2});f2.x+=(tx2-f2.x)*.15;f2.y+=(ty2-f2.y)*.15;drawFigure(f2.x,f2.y+Math.sin(t*3+c2)*1.5,cs,u2,p2,1);}
  if(crowd.length>cap){ctx.font='800 '+Math.max(10,cs*.5)+'px Cairo,system-ui';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText('+'+(crowd.length-cap),W/2,H*.3+cs*.6+(G.phase==='lobby'?H*.06:0));}
  /* falling figures */
  Object.keys(FIG).forEach(function(u){var f=FIG[u];if(!f.fall)return;var dt=(Date.now()-f.fall)/1000;if(dt>1.6)return;var p=G.players[u];if(!p)return;f.vy=(f.vy||0)+H*.0016;f.y+=f.vy;drawFigure(f.x,f.y,s,u,p,Math.max(0,1-dt/1.6),dt*4*(f.dir||1));
    if(dt<.25){for(var q=0;q<3;q++){ctx.fillStyle='rgba(255,255,255,'+(.6-dt*2)+')';ctx.fillRect(f.x+(Math.random()-.5)*s,f.y-s*Math.random()*2,3,3);}}});
  /* timer ring */
  var ring=$('bcRing'),tm=$('bcTime');if(G.phase==='pick'&&(S.deadline||S.paused)&&CFG.pick>0){var left=S.paused?S.left:Math.max(0,S.deadline-Date.now());var sec=Math.ceil(left/1000);tm.textContent=String(sec);ring.style.setProperty('--p',String(Math.min(1,left/(CFG.pick*1000))));ring.classList.toggle('low',sec<=5);ring.hidden=false;}
  else if(G.phase==='pick'){tm.textContent='∞';ring.style.setProperty('--p','1');ring.classList.remove('low');ring.hidden=false;}else ring.hidden=true;
}
var lastFallKey='';
function fallFig(u,p){var f=FIG[u];if(!f)return;if(!f.fall){f.fall=Date.now();f.vy=-H*.008;f.dir=Math.random()<.5?-1:1;}}
/* when a reveal lands, start the drop timer for the wrong columns */
var _ph='';setInterval(function(){if(G.phase!==_ph){if(G.phase==='reveal'||G.phase==='end'){if(_ph==='pick')S._rv=Date.now();}else S._rv=0;_ph=G.phase;}},50);
requestAnimationFrame(frame);

/* ---------- control panel wiring ---------- */
if(!A.obs){
  $('bcGo').addEventListener('click',go);$('bcPause').addEventListener('click',pause);$('bcNew').addEventListener('click',newGame);$('bcClear').addEventListener('click',clearAll);
  BT.tmr($('bcPickRow'),function(){return CFG.pick},function(v){CFG.pick=v;if(G.phase==='pick'&&!S.paused)S.deadline=v>0?Date.now()+v*1000:0;changed();},15);
  BT.tmr($('bcAutoRow'),function(){return CFG.auto},function(v){CFG.auto=v;changed();},4);
  BT.tmr($('bcJoinRow'),function(){return CFG.join},function(v){CFG.join=v;S.joinEnd=v>0?Date.now()+v*1000:0;changed();},60);
  var rd=$('bcRounds');rd.value=String(CFG.rounds);rd.addEventListener('change',function(){CFG.rounds=+rd.value||5;apply();changed();});
  [['bcLate','late'],['bcNb','nb'],['bcAv','av']].forEach(function(a){var e=$(a[0]);e.checked=!!CFG[a[1]];e.addEventListener('change',function(){CFG[a[1]]=e.checked;apply();changed();});});
  var mp=$('bcMap');mp.value=CFG.map;mp.addEventListener('change',function(){CFG.map=mp.value;bgKey='';changed();});
  BT.xtra($('bcXtra'),'lamma-bcxtra');
  /* a saved game survives a refresh */
  var sv2=store.get();if(sv2&&sv2.g&&sv2.g.pl){G.load(sv2.g);if(G.phase==='pick'){S.deadline=CFG.pick>0?Date.now()+CFG.pick*1000:0;}if(G.phase==='reveal')S.nextAt=CFG.auto>0?Date.now()+CFG.auto*1000:0;}
  /* join timer: closes the lobby by starting the game */
  setInterval(function(){if(G.phase==='lobby'&&S.joinEnd&&Date.now()>=S.joinEnd){S.joinEnd=0;if(G.order.length)startGame();}},500);
  if(CFG.join>0)S.joinEnd=Date.now()+CFG.join*1000;
}
/* ---------- layout editor ---------- */
BT.logo($('btLogo'));
window.LammaLayout&&window.LammaLayout.init({root:$('gs'),stage:$('stage'),key:'battle-colors',items:[
  {id:'floor',z:1,code:'f',kind:'box',ar:'الأعمدة',en:'Columns',def:{x:0,y:0,w:100,h:100,s:1},minW:30,minH:30},
  {id:'target',z:3,code:'t',kind:'box',ar:'اللون والوقت',en:'Colour & timer',def:{x:33,y:3.5,w:34,h:17,s:1},minW:14,minH:8},
  {id:'join',z:2,code:'j',kind:'box',ar:'صندوق الدخول',en:'Join box',def:{x:2,y:3.5,w:27,h:15,s:1},minW:10,minH:6}
]});
render();A.publish(pubState());
A.start();
})();
