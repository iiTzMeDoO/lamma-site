/* codenames.js — كلمات سرية / Secret Words, played like Codenames.
   Chat only joins (!join). The streamer splits the players into red/blue, picks each team's SPYMASTER (a viewer who gets a private
   link with the key, or the streamer himself) and each team's CAPTAIN. The team discusses in chat; only the captain's !pick N counts,
   everyone else's picks show as a live suggestion tally. Spymaster clues: "!clue word 2" in chat (only from that team's spymaster),
   or typed by the streamer in the panel.
   The key exists only in this control page (and in the spymaster link the streamer hands out). The overlay state carries revealed
   cards only, and the full key only once the game is over. */
(function(){
'use strict';
var A=window.App,C=A.C,W=window.Words,$=A.$,el=A.el;
A.strings({
 ar:{g_title:'كلمات سرية',g_how:'متل كود نيمز: الشات بيكتب !join، إنت بتقسمهم أحمر وأزرق، وبتختار لكل فريق سباي ماستر (بيشوف المفتاح برابط سري) وكابتن. الفريق بيتناقش بالشات، وبس اختيار الكابتن !pick ورقم بينحسب. انتبهو من القاتل ☠️',
  k_start:'ابدأ اللعبة',k_endturn:'إنهاء الدور',k_newboard:'لوح جديد',k_tolobby:'رجوع للفرق',k_teams:'الفرق',k_open:'!join مفتوح',k_split:'قسّم تلقائي',k_roles:'أدوار عشوائية',k_clearteams:'رجّع الكل للانتظار',
  k_drag_hint:'اسحب الأسماء بين الأعمدة، أو استعمل الأزرار: 🔴 🔵 للفريق، 🕵️ سباي ماستر، ⭐ كابتن (هو اللي اختيارو بينحسب).',k_waiting:'بالانتظار',k_red:'الأحمر',k_blue:'الأزرق',
  k_spy_red:'سباي ماستر الأحمر',k_spy_blue:'سباي ماستر الأزرق',k_cap_red:'كابتن الأحمر',k_cap_blue:'كابتن الأزرق',k_link:'🔗 نسخ رابط السباي ماستر',k_link_copied:'انتسخ الرابط ✓ ابعتو بالخاص',
  k_link_help:'ابعت الرابط بالخاص للسباي ماستر بس (ديسكورد/واتساب). فيه المفتاح، فلا تحطو بالشات ولا عالستريم. كل لوح جديد إلو رابط جديد.',
  k_clue:'التلميح (إذا السباي ماستر قالو بالصوت)',k_num:'كم كلمة',k_setclue:'حط التلميح',k_key:'المفتاح — إلك بس (ما بيطلع بالأوفرلي)',c_hide:'إخفاء',c_show:'إظهار',w_settings:'الإعدادات',
  k_timer:'وقت الدور',k_timer_off:'بلا وقت',k_tally:'اقتراحات الشات',k_tally_on:'بتبين عالكروت',k_tally_off:'مخفية',k_click:'الضغط عالكرت هون بيكشفو (إذا الكابتن قال بالصوت)',
  k_none:'— ما حدا —',k_me:'أنا (الستريمر)',k_spy:'سباي ماستر',k_cap:'كابتن',k_members:'اللاعبين',k_left:'باقي',
  k_lobby_t:'كلمات سرية',k_lobby_s:'اكتب !join لتنضم — الستريمر بيقسم الفرق',k_joined:'{n} منضمين',
  k_turn:'دور {t}',k_t_red:'الأحمر',k_t_blue:'الأزرق',k_wait_clue:'السباي ماستر عم يفكر بتلميح…',k_clue_l:'التلميح',k_guesses:'باقي {n} محاولات',k_guesses_inf:'محاولات مفتوحة',
  k_cap_picks:'الكابتن {x} بيختار: !pick رقم',k_discuss:'الفريق بيتناقش بالشات — بس الكابتن بيحسم',k_win:'فاز الفريق {t}!',k_win_x:'القاتل ☠️ — فاز الفريق {t}',
  k_ev_pick:'{x} اختار «{w}»',k_ev_clue:'تلميح {t}: {w} — {n}',k_ev_end:'خلص دور {t}',k_ev_timeout:'خلص الوقت — دور {t} خلص',
  k_st_lobby:'مرحلة الفرق: {n} منضمين، {r} أحمر، {b} أزرق',k_st_clue:'دور {t}: بانتظار التلميح',k_st_guess:'دور {t}: «{w}» {n} — الكابتن {x} بيختار',k_st_over:'خلصت: فاز {t}',
  k_need:'لازم لاعب واحد على الأقل بكل فريق',k_cards:'{n} كروت',
  k_cmd_join:'انضم للعبة',k_cmd_pick:'الكابتن بيختار كرت (الباقي اقتراحات)',k_cmd_clue:'السباي ماستر بيعطي تلميح',k_cmd_pass:'الكابتن بينهي الدور',k_cmd_new:'لوح جديد',k_cmd_end:'إنهاء الدور'},
 en:{g_title:'Secret Words',g_how:'Like Codenames: chat types !join, you split them into red and blue and pick each team\'s spymaster (who sees the key through a private link) and captain. The team discusses in chat; only the captain\'s !pick number counts. Beware the assassin ☠️',
  k_start:'Start game',k_endturn:'End turn',k_newboard:'New board',k_tolobby:'Back to teams',k_teams:'Teams',k_open:'!join open',k_split:'Auto-split',k_roles:'Random roles',k_clearteams:'Everyone back to waiting',
  k_drag_hint:'Drag names between columns, or use the buttons: 🔴 🔵 team, 🕵️ spymaster, ⭐ captain (only the captain\'s pick counts).',k_waiting:'Waiting',k_red:'Red',k_blue:'Blue',
  k_spy_red:'Red spymaster',k_spy_blue:'Blue spymaster',k_cap_red:'Red captain',k_cap_blue:'Blue captain',k_link:'🔗 Copy spymaster link',k_link_copied:'Link copied ✓ send it privately',
  k_link_help:'Send the link privately to the spymaster only (Discord/WhatsApp). It contains the key, so never post it in chat or on stream. Every new board has a new link.',
  k_clue:'Clue (if the spymaster said it out loud)',k_num:'How many',k_setclue:'Set clue',k_key:'Key — only you (never in the overlay)',c_hide:'Hide',c_show:'Show',w_settings:'Settings',
  k_timer:'Turn time',k_timer_off:'No timer',k_tally:'Chat suggestions',k_tally_on:'Shown on cards',k_tally_off:'Hidden',k_click:'Clicking a card here reveals it (if the captain said it out loud)',
  k_none:'— nobody —',k_me:'Me (streamer)',k_spy:'Spymaster',k_cap:'Captain',k_members:'Players',k_left:'left',
  k_lobby_t:'Secret Words',k_lobby_s:'Type !join to play — the streamer picks the teams',k_joined:'{n} joined',
  k_turn:'{t}\'s turn',k_t_red:'Red',k_t_blue:'Blue',k_wait_clue:'The spymaster is thinking of a clue…',k_clue_l:'Clue',k_guesses:'{n} guesses left',k_guesses_inf:'Unlimited guesses',
  k_cap_picks:'Captain {x} picks: !pick number',k_discuss:'The team discusses in chat — the captain decides',k_win:'{t} team wins!',k_win_x:'Assassin ☠️ — {t} team wins',
  k_ev_pick:'{x} picked “{w}”',k_ev_clue:'{t} clue: {w} — {n}',k_ev_end:'{t}\'s turn is over',k_ev_timeout:'Time\'s up — {t}\'s turn is over',
  k_st_lobby:'Teams: {n} joined, {r} red, {b} blue',k_st_clue:'{t}\'s turn: waiting for the clue',k_st_guess:'{t}\'s turn: “{w}” {n} — captain {x} picks',k_st_over:'Over: {t} won',
  k_need:'Each team needs at least one player',k_cards:'{n} cards',
  k_cmd_join:'join the game',k_cmd_pick:'captain picks a card (others = suggestions)',k_cmd_clue:'spymaster gives a clue',k_cmd_pass:'captain ends the turn',k_cmd_new:'new board',k_cmd_end:'end turn'}
});
function fmt(s,o){return String(s).replace(/\{(\w)\}/g,function(_,k){return o[k]!=null?o[k]:''})}
function tname(t){return A.t(t==='red'?'k_t_red':'k_t_blue')}
function other(t){return t==='red'?'blue':'red'}
function rnd(n){var a=new Uint8Array(n),s='',c='abcdefghjkmnpqrstuvwxyz23456789';(window.crypto||{}).getRandomValues?crypto.getRandomValues(a):a.forEach(function(_,i){a[i]=Math.random()*256|0});for(var i=0;i<n;i++)s+=c[a[i]%c.length];return s}

var S={players:{},order:[],open:true,spy:{red:'',blue:''},cap:{red:'',blue:''},words:[],key:[],rev:[],first:'red',turn:'red',phase:'lobby',
  clue:null,left:0,timer:120,deadline:0,winner:null,why:'',tally:{},voters:{},ev:null,evT:0,tok:'',bid:'',showTally:true,clickReveal:true,lang:A.lang()};
var hidden=false;

function save(){if(A.obs)return;A.LS.set('lamma-cn-'+A.channel,JSON.stringify({p:S.players,o:S.order,open:S.open,spy:S.spy,cap:S.cap,timer:S.timer,showTally:S.showTally,clickReveal:S.clickReveal,
  w:S.words,k:S.key,r:S.rev,first:S.first,turn:S.turn,phase:S.phase,clue:S.clue,left:S.left,winner:S.winner,why:S.why,tok:S.tok,bid:S.bid,lang:S.lang}));}
function members(t){return S.order.filter(function(u){return S.players[u]&&S.players[u].team===t})}
function pname(u){return u==='@me'?A.t('k_me'):(S.players[u]?S.players[u].n:'')}
function newBoard(){
  var pool=W.GRID[A.lang()]||W.GRID.ar;if(typeof pool==='string')pool=pool.split(/\s+/);
  var words=C.shuffle(pool.filter(Boolean)).slice(0,25);
  var first=Math.random()<.5?'red':'blue';
  var key=[];for(var i=0;i<9;i++)key.push(first[0]);for(i=0;i<8;i++)key.push(other(first)[0]);for(i=0;i<7;i++)key.push('n');key.push('x');
  S.words=words;S.key=C.shuffle(key);S.rev=words.map(function(){return false});S.first=first;S.turn=first;S.clue=null;S.left=0;S.winner=null;S.why='';S.tally={};S.voters={};
  S.tok=rnd(12);S.bid=rnd(6);S.lang=A.lang();S.ev=null;
}
function remaining(t){var n=0;for(var i=0;i<25;i++)if(S.key[i]===t[0]&&!S.rev[i])n++;return n}
function event(t,o){S.ev=Object.assign({t:t},o||{});S.evT=Date.now();}
function startGame(){
  if(!members('red').length||!members('blue').length){alert(A.t('k_need'));return;}
  ['red','blue'].forEach(function(t){var m=members(t);if(S.spy[t]!=='@me'&&m.indexOf(S.spy[t])<0)S.spy[t]=m.length>1?m[0]:'@me';if(m.indexOf(S.cap[t])<0||S.cap[t]===S.spy[t])S.cap[t]=m.filter(function(u){return u!==S.spy[t]})[0]||m[0];});
  if(!S.words.length||S.phase==='over'||S.rev.some(Boolean))newBoard();
  S.phase='clue';S.turn=S.first;beginTurn();A.roundStart();A.sfx('start');save();changed();
}
function beginTurn(){S.clue=null;S.left=0;S.tally={};S.voters={};S.deadline=S.timer>0?Date.now()+S.timer*1000:0;}
function endTurn(why){if(S.phase!=='clue'&&S.phase!=='guess')return;event(why==='timeout'?'timeout':'end',{tm:S.turn});S.turn=other(S.turn);S.phase='clue';beginTurn();save();changed();}
function setClue(word,n){
  word=String(word||'').replace(/[\u0000-\u001f]/g,'').trim().slice(0,30);if(!word||S.phase!=='clue')return false;
  n=parseInt(C.normalize(String(n)),10);if(isNaN(n)||n<0)n=1;if(n>9)n=9;
  S.clue={w:word,n:n};S.left=n===0?99:n+1;S.phase='guess';event('clue',{tm:S.turn,w:word,n:n===0?'∞':n});A.sfx('go');save();changed();return true;
}
function reveal(i,by){
  if(S.phase!=='guess'&&!(S.phase==='clue'&&by==='@streamer'))return;
  if(i<0||i>24||S.rev[i])return;
  S.rev[i]=true;var c=S.key[i],t=S.turn;event('pick',{x:by==='@streamer'?A.t('k_me'):pname(by),w:S.words[i],c:c,i:i});S.tally={};S.voters={};
  if(c==='x'){A.sfx('boom');return gameOver(other(t),'assassin');}
  if(remaining('red')===0)return gameOver('red','cards');
  if(remaining('blue')===0)return gameOver('blue','cards');
  if(c===t[0]){A.sfx('pop');S.left--;if(S.left<=0){S.turn=other(t);S.phase='clue';beginTurn();}}
  else{A.sfx('bad');S.turn=other(t);S.phase='clue';beginTurn();}
  save();changed();
}
function gameOver(team,why){
  S.phase='over';S.winner=team;S.why=why;S.deadline=0;A.sfx('win');
  members(team).forEach(function(u){A.award(u,S.players[u].n,2)});
  A.roundEnd({players:members('red').concat(members('blue')).map(function(u){return [u,S.players[u].n]})});
  save();changed();A.confetti($('stage'),130);
}
setInterval(function(){
  if(!A.runsEngine())return;
  if((S.phase==='clue'||S.phase==='guess')&&S.deadline&&Date.now()>=S.deadline){endTurn('timeout');return;}
  if(S.deadline){var s=Math.ceil((S.deadline-Date.now())/1000);if(s!==S._s){S._s=s;changed();}}
},250);

/* ---------- chat ---------- */
function boardIndex(text){
  var n=C.normalize(text);var m=/^(\d{1,2})$/.exec(n);if(m){var v=+m[1];return v>=1&&v<=25?v-1:-1;}
  var k=C.tokens(text).join(' ');for(var i=0;i<25;i++){if(C.tokens(S.words[i]||'').join(' ')===k)return i;}return -1;
}
A.onChat(function(m){
  if(!A.runsEngine())return;
  var cmd=C.parseCmd(m.text),c=cmd?cmd.cmd:'';
  if(cmd&&A.isCtrl(m)){
    if(c==='codenames'||c==='newboard'){newBoard();S.phase=members('red').length&&members('blue').length?'clue':'lobby';if(S.phase==='clue')beginTurn();save();changed();return;}
    if(c==='endturn'){endTurn('end');return;}
  }
  if(cmd&&(c==='join'||c==='انضم'||c==='انضمام'||c==='دخول'||c==='red'||c==='blue'||c==='احمر'||c==='ازرق')){
    if(!S.open)return;if(!S.players[m.user]){S.players[m.user]={n:m.name,c:m.color,team:''};S.order.push(m.user);A.sfx('pop');save();changed();}return;}
  if(cmd&&(c==='leave'||c==='طلوع')){if(S.players[m.user]&&S.phase==='lobby'){delete S.players[m.user];S.order=S.order.filter(function(u){return u!==m.user});save();changed();}return;}
  var p=S.players[m.user];if(!p)return;
  var t=S.turn;
  if(cmd&&(c==='clue'||c==='تلميح')&&S.phase==='clue'&&S.spy[t]===m.user){
    var args=cmd.rest.split(/\s+/);var num=args.length>1&&/^\d$/.test(C.normalize(args[args.length-1]))?args.pop():'1';setClue(args.join(' '),num);return;}
  if(S.phase!=='guess'||p.team!==t||S.spy[t]===m.user)return;
  var isCap=S.cap[t]===m.user;
  if(cmd&&(c==='pass'||c==='end'||c==='خلص'||c==='بس')){if(isCap)endTurn('end');return;}
  var idx=-1,commit=false;
  if(cmd&&(c==='pick'||c==='اختار'||c==='اختر')){idx=boardIndex(cmd.rest);commit=isCap;}
  else if(cmd&&/^\d{1,2}$/.test(c)){idx=boardIndex(c);commit=isCap;}          /* "!7" */
  else if(!cmd){idx=boardIndex(m.text);}                                       /* bare "7" or a board word = discussion */
  if(idx<0||S.rev[idx])return;
  if(commit){reveal(idx,m.user);return;}
  var prev=S.voters[m.user];if(prev===idx)return;if(prev!=null){S.tally[prev]=Math.max(0,(S.tally[prev]||1)-1);if(!S.tally[prev])delete S.tally[prev];}
  S.voters[m.user]=idx;S.tally[idx]=(S.tally[idx]||0)+1;changed();
});

/* ---------- public state ---------- */
function cardFace(i,over){return (S.rev[i]||over)?S.key[i]:''}   /* a card's colour is public only once revealed (all of them once the game is over) */
function pub(){
  var over=S.phase==='over';
  function team(t){return {spy:S.spy[t]==='@me'?{n:A.t('k_me'),me:1}:(S.players[S.spy[t]]?{n:S.players[S.spy[t]].n,c:S.players[S.spy[t]].c}:null),
    cap:S.players[S.cap[t]]?{n:S.players[S.cap[t]].n,c:S.players[S.cap[t]].c}:null,
    m:members(t).filter(function(u){return u!==S.spy[t]&&u!==S.cap[t]}).slice(0,40).map(function(u){return [S.players[u].n,S.players[u].c||'']}),
    n:members(t).length,left:S.words.length?remaining(t):0}}
  return {phase:S.phase,turn:S.turn,first:S.first,words:S.words,
    cards:S.words.map(function(_,i){return cardFace(i,over)}),rev:S.rev.slice(),
    clue:S.clue,left:S.left,timer:S.timer,secs:S.deadline?Math.max(0,Math.ceil((S.deadline-Date.now())/1000)):0,
    winner:S.winner,why:S.why,tally:S.showTally?S.tally:{},ev:S.ev,evT:S.evT,red:team('red'),blue:team('blue'),
    lobby:S.order.filter(function(u){return !S.players[u].team}).slice(0,60).map(function(u){return [S.players[u].n,S.players[u].c||'']}),joined:S.order.length,lang:A.lang()};
}

/* ---------- rendering (stage) ---------- */
var SVGNS='http://www.w3.org/2000/svg';
function agent(kind){
  var s=document.createElementNS(SVGNS,'svg');s.setAttribute('viewBox','0 0 64 64');s.setAttribute('class','k2-art');s.setAttribute('aria-hidden','true');
  var paths=kind==='x'?
   ['M32 8c-11 0-19 8-19 18 0 6 3 10 7 13v7h24v-7c4-3 7-7 7-13 0-10-8-18-19-18z','M24 24a4.5 4.5 0 1 0 0 .1zM40 24a4.5 4.5 0 1 0 0 .1z','M26 50h4v6h-4zM34 50h4v6h-4z']:
   kind==='n'?
   ['M32 12a9 9 0 1 1 0 18a9 9 0 1 1 0-18z','M14 58c1-12 8-20 18-20s17 8 18 20z']:
   ['M18 22c2-6 8-10 14-10s12 4 14 10l6 2-6 2H18l-6-2z','M32 26a8 8 0 1 1 0 16a8 8 0 1 1 0-16z','M24 34h16v2H24z','M12 60c1-11 9-18 20-18s19 7 20 18z','M29 44l3 8 3-8z'];
  paths.forEach(function(d,i){var p=document.createElementNS(SVGNS,'path');p.setAttribute('d',d);if(kind==='x'&&i===1)p.setAttribute('class','k2-eye');if(kind!=='x'&&kind!=='n'&&i===2)p.setAttribute('class','k2-shade');s.appendChild(p);});
  return s;
}
function teamPanel(t,T,P){
  var pnl=el('div','k2-team t-'+t+(P.turn===t&&(P.phase==='clue'||P.phase==='guess')?' on':''));
  var h=el('div','k2-th');h.appendChild(el('span','k2-tn',tname(t)));h.appendChild(el('b','k2-left',P.words.length?String(T.left):'·'));pnl.appendChild(h);
  function role(ic,lab,who){var r=el('div','k2-roleline');r.appendChild(el('span','k2-ic',ic));var c=el('span','k2-rc');c.appendChild(el('small',null,lab));c.appendChild(who?A.nameEl(who.n,who.c):el('span','nm dim','—'));r.appendChild(c);return r}
  pnl.appendChild(role('🕵️',A.t('k_spy'),T.spy));
  pnl.appendChild(role('⭐',A.t('k_cap'),T.cap));
  var ul=el('ul','k2-mem');T.m.forEach(function(x){var li=el('li');li.appendChild(A.nameEl(x[0],x[1]));ul.appendChild(li);});
  if(T.n>T.m.length+(T.spy&&!T.spy.me?1:0)+(T.cap?1:0)&&T.m.length>=40)ul.appendChild(el('li','more','…'));
  pnl.appendChild(el('p','k2-ml',A.t('k_members')+' · '+T.n));pnl.appendChild(ul);
  return pnl;
}
var key='',lastRevCount=0;
function draw(P){
  var k=JSON.stringify([P,A.lang(),A.obs]);if(k===key)return;key=k;
  var gs=$('gs');A.clear(gs);gs.setAttribute('data-phase',P.phase);gs.setAttribute('data-turn',P.turn);
  gs.appendChild(teamPanel('red',P.red,P));
  var mid=el('div','k2-mid');mid.dir=A.lang()==='ar'?'rtl':'ltr';
  var bar=el('div','k2-bar');
  var lg=el('span','s-logo');lg.appendChild(el('b',null,'لَمّة'));lg.appendChild(el('i',null,'LAMMA'));bar.appendChild(lg);
  var info=el('div','k2-info');
  if(P.phase==='lobby'){info.appendChild(el('p','k2-turn',A.t('k_lobby_t')));info.appendChild(A.rich('p','k2-sub',A.t('k_lobby_s')));}
  else if(P.phase==='over'){info.appendChild(el('p','k2-turn c-'+P.winner,fmt(A.t(P.why==='assassin'?'k_win_x':'k_win'),{t:tname(P.winner)})));}
  else{
    info.appendChild(el('p','k2-turn c-'+P.turn,fmt(A.t('k_turn'),{t:tname(P.turn)})));
    if(P.phase==='clue')info.appendChild(el('p','k2-sub',A.t('k_wait_clue')));
    else if(P.clue){var cl=el('p','k2-clue');cl.appendChild(el('small',null,A.t('k_clue_l')));var cw=el('b',null,P.clue.w);cw.dir='auto';cl.appendChild(cw);cl.appendChild(el('span','k2-cn',P.clue.n===0?'∞':String(P.clue.n)));info.appendChild(cl);
      var T=P[P.turn];info.appendChild(A.rich('p','k2-sub',T.cap?fmt(A.t('k_cap_picks'),{x:'\u2068'+T.cap.n+'\u2069'}):A.t('k_discuss')));}
  }
  bar.appendChild(info);
  var right=el('div','k2-meta');
  if(P.phase==='guess'&&P.clue)right.appendChild(el('span','s-pill',P.clue.n===0?A.t('k_guesses_inf'):fmt(A.t('k_guesses'),{n:P.left})));
  if(P.secs&&(P.phase==='clue'||P.phase==='guess')){var tm=el('span','k2-timer'+(P.secs<=15?' low':''),'⏱ '+Math.floor(P.secs/60)+':'+('0'+P.secs%60).slice(-2));right.appendChild(tm);}
  bar.appendChild(right);mid.appendChild(bar);
  if(P.phase==='lobby'&&!P.rev.some(Boolean)&&(!P.words.length||P.joined<99)){
    var lob=el('div','k2-lobby');lob.appendChild(el('p','k2-lob-n',fmt(A.t('k_joined'),{n:P.joined})));
    var ul=el('ul','k2-cloud');P.lobby.forEach(function(x){var li=el('li');li.appendChild(A.nameEl(x[0],x[1]));ul.appendChild(li);});lob.appendChild(ul);
    mid.appendChild(lob);
  }else{
    var grid=el('div','k2-grid');var revCount=P.rev.filter(Boolean).length;
    P.words.forEach(function(w,i){
      var c=P.cards[i],r=P.rev[i];
      var cd=el(A.obs?'div':'button','k2-card'+(r?' rv c-'+c:(c?' peek c-'+c:''))+(r&&revCount>lastRevCount&&P.ev&&P.ev.i===i?' just':''));
      if(!A.obs){cd.type='button';cd.setAttribute('data-i',String(i));cd.setAttribute('aria-label',(i+1)+' '+w);}
      cd.appendChild(el('span','k2-num',String(i+1)));
      if(r||c)cd.appendChild(agent(c==='r'||c==='b'?'agent':c));
      var wl=el('span','k2-word'+(Array.from(w).length>6?' long':Array.from(w).length>4?' mid':''),w);wl.dir='auto';cd.appendChild(wl);
      var tv=P.tally[i];if(tv&&!r){cd.appendChild(el('span','k2-vote',String(tv)));cd.classList.add('voted');}
      grid.appendChild(cd);
    });
    lastRevCount=revCount;
    var best=-1,bv=0;Object.keys(P.tally).forEach(function(k){if(P.tally[k]>bv){bv=P.tally[k];best=+k}});if(best>=0&&grid.children[best])grid.children[best].classList.add('lead');
    mid.appendChild(grid);
  }
  var et='';if(P.ev){var e=P.ev;et=e.t==='pick'?fmt(A.t('k_ev_pick'),{x:'\u2068'+e.x+'\u2069',w:'\u2068'+e.w+'\u2069'}):e.t==='clue'?fmt(A.t('k_ev_clue'),{t:tname(e.tm),w:'\u2068'+e.w+'\u2069',n:e.n}):e.t==='timeout'?fmt(A.t('k_ev_timeout'),{t:tname(e.tm)}):fmt(A.t('k_ev_end'),{t:tname(e.tm)});}
  if(et&&P.phase!=='lobby')mid.appendChild(el('p','k2-log',et));
  gs.appendChild(mid);
  gs.appendChild(teamPanel('blue',P.blue,P));
}

/* ---------- control panel ---------- */
var dragU=null;
function chip(u){
  var p=S.players[u];var li=el('li','k2-chip'+(S.spy[p.team]===u?' is-spy':'')+(S.cap[p.team]===u?' is-cap':''));li.draggable=true;li.setAttribute('data-u',u);
  li.addEventListener('dragstart',function(e){dragU=u;try{e.dataTransfer.setData('text/plain',u)}catch(x){}li.classList.add('drag');});
  li.addEventListener('dragend',function(){li.classList.remove('drag');dragU=null;});
  var badge='';if(S.spy[p.team]===u)badge='🕵️ ';if(S.cap[p.team]===u)badge+='⭐ ';
  if(badge)li.appendChild(el('span','k2-badge',badge.trim()));
  li.appendChild(A.nameEl(p.n,p.c));
  var bx=el('span','k2-acts');
  function b(txt,title,fn){var x=el('button','mini',txt);x.type='button';x.title=title;x.setAttribute('aria-label',title+' '+p.n);x.addEventListener('click',fn);bx.appendChild(x)}
  if(p.team!=='red')b('🔴',A.t('k_red'),function(){move(u,'red')});
  if(p.team!=='blue')b('🔵',A.t('k_blue'),function(){move(u,'blue')});
  if(p.team){b('🕵️',A.t('k_spy'),function(){S.spy[p.team]=u;if(S.cap[p.team]===u)S.cap[p.team]='';save();changed();});
    b('⭐',A.t('k_cap'),function(){S.cap[p.team]=u;if(S.spy[p.team]===u)S.spy[p.team]='';save();changed();});
    b('↩',A.t('k_waiting'),function(){move(u,'')});}
  b('✖','✖',function(){var t=p.team;if(S.spy[t]===u)S.spy[t]='';if(S.cap[t]===u)S.cap[t]='';delete S.players[u];S.order=S.order.filter(function(x){return x!==u});save();changed();});
  li.appendChild(bx);return li;
}
function move(u,t){var p=S.players[u];if(!p)return;var old=p.team;if(old&&S.spy[old]===u)S.spy[old]='';if(old&&S.cap[old]===u)S.cap[old]='';p.team=t;save();changed();}
function fillSel(sel,t,kind){
  var cur=kind==='spy'?S.spy[t]:S.cap[t];A.clear(sel);
  var o=el('option',null,A.t('k_none'));o.value='';sel.appendChild(o);
  if(kind==='spy'){var me=el('option',null,A.t('k_me'));me.value='@me';sel.appendChild(me);}
  members(t).forEach(function(u){var x=el('option',null,S.players[u].n);x.value=u;sel.appendChild(x);});
  sel.value=cur||'';
}
var ctrlKey='';
function renderCtrl(){
  if(A.obs)return;
  var st,T=S.turn;
  if(S.phase==='lobby')st=fmt(A.t('k_st_lobby'),{n:S.order.length,r:members('red').length,b:members('blue').length});
  else if(S.phase==='clue')st=fmt(A.t('k_st_clue'),{t:tname(T)});
  else if(S.phase==='guess')st=fmt(A.t('k_st_guess'),{t:tname(T),w:S.clue?S.clue.w:'',n:S.clue?(S.clue.n||'∞'):'',x:pname(S.cap[T])||'—'});
  else st=fmt(A.t('k_st_over'),{t:tname(S.winner)});
  var se=$('kStatus');se.textContent=st;se.className='w2-status k2-st t-'+(S.phase==='over'?S.winner:S.phase==='lobby'?'':T);
  $('kStart').textContent=S.phase==='lobby'?A.t('k_start'):(S.phase==='over'?A.t('k_newboard'):A.t('k_start'));
  $('kStart').disabled=S.phase==='clue'||S.phase==='guess';$('kEnd').disabled=!(S.phase==='clue'||S.phase==='guess');
  $('kClueBtn').disabled=S.phase!=='clue';
  var k=JSON.stringify([S.players,S.order,S.spy,S.cap,S.key,S.rev,S.words,hidden,A.lang()]);if(k===ctrlKey)return;ctrlKey=k;
  [['',$('kListWait'),$('kNWait')],['red',$('kListRed'),$('kNRed')],['blue',$('kListBlue'),$('kNBlue')]].forEach(function(r){
    A.clear(r[1]);var ms=S.order.filter(function(u){return S.players[u]&&(S.players[u].team||'')===r[0]});
    ms.sort(function(a,b){function w(u){return S.spy[r[0]]===u?0:S.cap[r[0]]===u?1:2}return w(a)-w(b)});
    ms.forEach(function(u){r[1].appendChild(chip(u))});r[2].textContent=ms.length;});
  fillSel($('kSpyRed'),'red','spy');fillSel($('kSpyBlue'),'blue','spy');fillSel($('kCapRed'),'red','cap');fillSel($('kCapBlue'),'blue','cap');
  var kk=$('kKey');A.clear(kk);
  S.words.forEach(function(w,i){var d=el('div','kk c-'+(hidden?'h':S.key[i])+(S.rev[i]?' done':''));d.appendChild(el('span','kc-n',String(i+1)));var s=el('span','kk-w',w);s.dir='auto';d.appendChild(s);kk.appendChild(d);});
}
function spyLink(t){
  if(!S.words.length)newBoard();
  var payload={v:1,id:S.bid,tok:S.tok,team:t,ch:A.channel,lang:S.lang,w:S.words,k:S.key.join(''),first:S.first,
    cap:{red:S.cap.red||'',blue:S.cap.blue||''},spy:{red:S.spy.red||'',blue:S.spy.blue||''}};
  var json=JSON.stringify(payload);var b64=btoa(unescape(encodeURIComponent(json))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return location.origin+location.pathname.replace(/codenames\.html$/,'').replace(/\/?$/,'/')+'spymaster.html#'+b64;
}
function changed(){var P=pub();draw(P);A.publish(P);renderCtrl();}

if(!A.obs){
  var sv={};try{sv=JSON.parse(A.LS.get('lamma-cn-'+A.channel,'{}'))||{}}catch(e){}
  if(sv.p){S.players=sv.p;S.order=(sv.o||Object.keys(sv.p)).filter(function(u){return sv.p[u]});S.open=sv.open!==false;S.spy=sv.spy||S.spy;S.cap=sv.cap||S.cap;S.timer=sv.timer==null?120:sv.timer;
    S.showTally=sv.showTally!==false;S.clickReveal=sv.clickReveal!==false;
    if(sv.w&&sv.w.length===25){S.words=sv.w;S.key=sv.k;S.rev=sv.r;S.first=sv.first;S.turn=sv.turn;S.phase=sv.phase||'lobby';S.clue=sv.clue;S.left=sv.left;S.winner=sv.winner;S.why=sv.why;S.tok=sv.tok;S.bid=sv.bid;S.lang=sv.lang||A.lang();
      if(S.phase==='clue'||S.phase==='guess')S.deadline=S.timer>0?Date.now()+S.timer*1000:0;}}
  if(!S.words.length)newBoard();
  $('kOpen').checked=S.open;$('kTimer').value=String(S.timer);$('kTally').value=S.showTally?'1':'0';$('kClick').checked=S.clickReveal;
  $('kOpen').addEventListener('change',function(){S.open=this.checked;save();});
  $('kTimer').addEventListener('change',function(){S.timer=+this.value;if(S.phase==='clue'||S.phase==='guess')S.deadline=S.timer>0?Date.now()+S.timer*1000:0;save();changed();});
  $('kTally').addEventListener('change',function(){S.showTally=this.value==='1';save();changed();});
  $('kClick').addEventListener('change',function(){S.clickReveal=this.checked;save();});
  $('kStart').addEventListener('click',function(){if(S.phase==='over'){newBoard();S.phase='clue';beginTurn();save();changed();return;}startGame();});
  $('kEnd').addEventListener('click',function(){endTurn('end')});
  $('kNew').addEventListener('click',function(){newBoard();if(S.phase!=='lobby'){S.phase='clue';beginTurn();}save();changed();});
  $('kLobby').addEventListener('click',function(){S.phase='lobby';S.deadline=0;save();changed();});
  $('kSplit').addEventListener('click',function(){var all=C.shuffle(S.order.filter(function(u){return S.players[u]}));all.forEach(function(u,i){S.players[u].team=i%2?'blue':'red'});S.spy={red:'',blue:''};S.cap={red:'',blue:''};save();changed();});
  $('kRoles').addEventListener('click',function(){['red','blue'].forEach(function(t){var m=C.shuffle(members(t));S.spy[t]=m.length>1?m[0]:'@me';S.cap[t]=m.length>1?m[1]:(m[0]||'');});save();changed();});
  $('kClearT').addEventListener('click',function(){S.order.forEach(function(u){S.players[u].team=''});S.spy={red:'',blue:''};S.cap={red:'',blue:''};save();changed();});
  [['kSpyRed','spy','red'],['kSpyBlue','spy','blue'],['kCapRed','cap','red'],['kCapBlue','cap','blue']].forEach(function(r){$(r[0]).addEventListener('change',function(){
    S[r[1]][r[2]]=this.value;var o=r[1]==='spy'?'cap':'spy';if(S[o][r[2]]===this.value)S[o][r[2]]='';save();changed();});});
  [['kLinkRed','red'],['kLinkBlue','blue']].forEach(function(r){$(r[0]).addEventListener('click',function(){var b=this;A.copyText(spyLink(r[1]),null);var o=A.t('k_link');b.textContent=A.t('k_link_copied');setTimeout(function(){b.textContent=o},1800);});});
  $('kClueBtn').addEventListener('click',function(){if(setClue($('kClue').value,$('kNum').value))$('kClue').value='';});
  $('kHide').addEventListener('click',function(){hidden=!hidden;this.textContent=A.t(hidden?'c_show':'c_hide');ctrlKey='';renderCtrl();});
  $('gs').addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.k2-card');if(!b||!S.clickReveal)return;var i=+b.getAttribute('data-i');if(S.phase==='guess'||S.phase==='clue')reveal(i,'@streamer');});
  ['kColWait','kListRed','kListBlue'].forEach(function(){});
  document.querySelectorAll('.k2-col').forEach(function(col){
    col.addEventListener('dragover',function(e){e.preventDefault();col.classList.add('over')});
    col.addEventListener('dragleave',function(){col.classList.remove('over')});
    col.addEventListener('drop',function(e){e.preventDefault();col.classList.remove('over');var u=dragU;try{u=e.dataTransfer.getData('text/plain')||u}catch(x){}if(u&&S.players[u])move(u,col.getAttribute('data-team')||'');});
  });
}
A.onLang(function(){key='';ctrlKey='';changed();});
A.onMirror(function(P){draw(P)});

changed();
A.start();
})();
