/* party.js — معركة البلوك / Block Brawl: a Kukoro-style party game for Twitch chat with a Minecraft theme (original art).
   Two modes: the CAVE (mob boss, round track, sidebar with chat commands) and the COLOUR FLOOR
   (20 numbered columns; the screen shows a colour, wrong columns drop). The world is drawn by arena.js.
   Viewers: !join (or !join <MinecraftName> for their own skin). The streamer drives everything from the control panel. */
(function(){
'use strict';
var A=window.App,C=A.C,$=A.$,el=A.el;
A.allowSolo();
A.strings({
 ar:{g_title:'معركة البلوك',g_how:'المتابعين بيكتبو !join (أو !join واسمهم بماينكرافت) وبيطلعو بالخريطة. وضعين: الكهف مع الزعيم، وأرضية الألوان.',
  m_cave:'الكهف',m_colors:'أرضية الألوان',p_mode:'الوضع',p_rounds:'عدد الجولات',p_players:'اللاعبين',p_start:'ابدأ',p_back:'رجوع للساحة',p_skipround:'تخطّي الجولة',p_clear:'امسح اللاعبين',p_settings:'الإعدادات',p_pick:'وقت الاختيار (ث)',p_tags:'أسماء فوق الشخصيات',p_obsclear:'خلفية شفافة بالـ OBS (بس الشخصيات)',
  p_pause:'إيقاف مؤقت',p_resume:'كمّل',p_need2:'لازم لاعبين اتنين عالأقل',p_kick:'طرد',p_lobby:'الساحة مفتوحة',p_ingame:'اللعبة شغالة',p_won:'في بطل!',p_paused:'متوقفة',
  p_rgames:'جولات الكهف',p_win:'اختارو بطل',p_out:'طلّعو',p_in:'رجّعو',p_vols:'المتطوعين — اختار البطل',p_choose:'اختار',p_tip:'كل شي بإيدك: طرد، إرجاع لاعب، اختيار البطل، اختيار المتطوع، تخطي الجولة والإيقاف المؤقت.',
  kk_cmds:'أوامر الشات',kk_how:'طريقة اللعب',kk_paused:'متوقف ⏸',
  c_spawn:'ادخل',c_skin:'سكن ماينكرافت تبعك',c_jump:'تطوّع',c_hide:'اختفي',c_stop:'وقّف حركتك',c_vote:'صوّت لمتطوع',c_info:'شوف لفلك',c_dodge:'يسار / يمين',c_gear:'سيف · قوس · درع · سطل',c_chest:'اختار صندوق',c_col:'روح عالعمود',
  mg_dodge:'تفادى!',mg_counters:'الزعيم بيستدعي',mg_chests:'صناديق TNT',mg_vol:'المتطوعين',mg_final:'الأخير بيربح',mg_color:'أرضية الألوان',
  h_lobby:'اكتب !join لتدخل الخريطة. الستريمر بيبلّش اللعبة لما يكتمل العدد.',
  h_dodge:'الزعيم رح يضرب جهة من الساحة بسيف عملاق. اكتب !A لتروح يسار أو !D لتروح يمين قبل ما يخلص الوقت.',
  h_counters:'الزعيم رح يستدعي موبز. اختار عدّتك: !1 سيف ضد الزومبي، !2 قوس ضد السكيلتون، !3 درع ضد الكريبر، !4 سطل مي ضد الإندرمان.',
  h_chests:'في 3 صناديق، واحد فيه TNT. اكتب !1 أو !2 أو !3 لتوقف جنب صندوق.',
  h_vol:'اكتب !jump لتتطوع. بعدين الشات بيصوّت بـ !vote اسم، والبطل بيواجه الزعيم. المتطوعين بيقفزو بالحفرة: سلايم = درع، حمم = برا.',
  h_final:'آخر جولة: الزعيم بيضرب لحتى يضل واحد. !A أو !D.',
  h_color:'الشاشة بتعرض لون. اكتب رقم العمود (!1 لـ !20) اللي لونو متل الشاشة. الأعمدة البعيدة بتوقع.',
  b_pick:'اختارو!',b_strike:'الضربة!',b_missed:'الزعيم فوّت الضربة!',b_none:'محدا طلع!',b_out:'{n} طلعو · ضل {m}',b_coming:'إجا {m}!',b_tnt:'TNT!',b_jump:'مين بيتطوع؟ !jump',b_vote:'صوّتو: !vote اسم',b_fight:'{n} ضد الزعيم!',b_win:'{n} ضرب الزعيم! 💥',b_lose:'الزعيم ربح على {n}',b_slime:'سلايم! المتطوعين أخدو درع 🛡',b_lava:'حمم! 🔥',b_novol:'ما حدا تطوّع',
  b_go:'روحو عاللون!',b_drop:'وقعت الأعمدة!',b_winner:'البطل!',b_runner:'الوصيف',b_join:'اكتب !join للدخول',b_join2:'أو !join واسمك بماينكرافت ليطلع السكن تبعك',b_wait:'بانتظار اللاعبين…',
  g_sword:'سيف',g_bow:'قوس',g_shield:'درع',g_bucket:'سطل مي',m_zombie:'زومبي',m_skeleton:'سكيلتون',m_creeper:'كريبر',m_enderman:'إندرمان',and:' و ',vs:'ضد',rumor:'إشاعة: ما في {m} 👀',
  st_players:'لاعبين',st_round:'جولة',p_cmd_join:'ادخل',p_cmd_joinmc:'ادخل بسكن ماينكرافت تبعك',p_cmd_pick:'اختار',p_cmd_go:'أوامر الجولة',p_cmd_open:'افتح الساحة',p_cmd_start:'ابدأ الكهف',p_cmd_colors:'ابدأ أرضية الألوان',c_cmd_stop:'وقّف ورجّع للساحة'},
 en:{g_title:'Block Brawl',g_how:'Viewers type !join (or !join plus their Minecraft name) and appear on the map. Two modes: the Cave with a boss, and the Colour Floor.',
  m_cave:'Cave',m_colors:'Colour Floor',p_mode:'Mode',p_rounds:'Rounds',p_players:'Players',p_start:'Start',p_back:'Back to lobby',p_skipround:'Skip round',p_clear:'Clear players',p_settings:'Settings',p_pick:'Pick time (s)',p_tags:'Name tags',p_obsclear:'Transparent background in OBS (characters only)',
  p_pause:'Pause',p_resume:'Resume',p_need2:'Needs at least 2 players',p_kick:'Kick',p_lobby:'Lobby open',p_ingame:'Game running',p_won:'We have a champion!',p_paused:'Paused',
  p_rgames:'Cave rounds',p_win:'Make champion',p_out:'Eliminate',p_in:'Bring back',p_vols:'Volunteers — pick the champion',p_choose:'Pick',p_tip:'You control everything: kick, bring players back, crown a winner, pick the volunteer, skip rounds and pause.',
  kk_cmds:'CHAT COMMANDS',kk_how:'HOW TO PLAY',kk_paused:'PAUSED ⏸',
  c_spawn:'Spawn',c_skin:'Your MC skin',c_jump:'Volunteer',c_hide:'Hide',c_stop:'Stop moving',c_vote:'Vote volunteer',c_info:'Your level',c_dodge:'Left / Right',c_gear:'Sword · Bow · Shield · Bucket',c_chest:'Pick a chest',c_col:'Go to column',
  mg_dodge:'DODGE!',mg_counters:'BOSS SUMMONS',mg_chests:'TNT CHESTS',mg_vol:'VOLUNTEERS',mg_final:'LAST ONE STANDING',mg_color:'COLOUR FLOOR',
  h_lobby:'Type !join to enter the map. The streamer starts when everyone is in.',
  h_dodge:'The boss will smash one side with a giant sword. Type !A to go left or !D to go right before time runs out.',
  h_counters:'The boss summons mobs. Pick your gear: !1 sword beats zombies, !2 bow beats skeletons, !3 shield beats creepers, !4 bucket beats endermen.',
  h_chests:'Three chests, one hides TNT. Type !1, !2 or !3 to stand by a chest.',
  h_vol:'Type !jump to volunteer. Chat votes with !vote name and the champion faces the boss. Volunteers jump in the pit: slime = shield, lava = out.',
  h_final:'Final round: the boss keeps striking until one is left. !A or !D.',
  h_color:'The screen shows a colour. Type the column number (!1 to !20) that matches it. Columns too far away drop.',
  b_pick:'PICK!',b_strike:'STRIKE!',b_missed:'The boss missed!',b_none:'Nobody out!',b_out:'{n} out · {m} left',b_coming:'{m} incoming!',b_tnt:'TNT!',b_jump:'Who volunteers? !jump',b_vote:'Vote: !vote name',b_fight:'{n} vs the boss!',b_win:'{n} hit the boss! 💥',b_lose:'The boss beat {n}',b_slime:'Slime! Volunteers got a shield 🛡',b_lava:'Lava! 🔥',b_novol:'Nobody volunteered',
  b_go:'Find the colour!',b_drop:'Columns dropped!',b_winner:'CHAMPION!',b_runner:'Runner-up',b_join:'Type !join to enter',b_join2:'or !join plus your Minecraft name to use your skin',b_wait:'Waiting for players…',
  g_sword:'Sword',g_bow:'Bow',g_shield:'Shield',g_bucket:'Water bucket',m_zombie:'Zombie',m_skeleton:'Skeleton',m_creeper:'Creeper',m_enderman:'Enderman',and:' & ',vs:'vs',rumor:'Rumor: no {m} 👀',
  st_players:'players',st_round:'round',p_cmd_join:'join',p_cmd_joinmc:'join with your Minecraft skin',p_cmd_pick:'pick',p_cmd_go:'round commands',p_cmd_open:'open the lobby',p_cmd_start:'start the Cave',p_cmd_colors:'start the Colour Floor',c_cmd_stop:'stop, back to lobby'}
});
function f(k,o){var s=A.t(k);for(var x in o)s=s.split('{'+x+'}').join(o[x]);return s}
function svgFrom(map,pal,extra){
  var h=map.length,w=map[0].length,r='';
  for(var y=0;y<h;y++)for(var x=0;x<w;x++){var c=map[y][x];if(c==='.'||!pal[c])continue;r+='<rect x="'+x+'" y="'+y+'" width="1.02" height="1.02" fill="'+pal[c]+'"/>';}
  return 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" shape-rendering="crispEdges">'+r+(extra||'')+'</svg>');
}
var MOBS={
 zombie:{map:['gggggggg','gGggggGg','gkkggkkg','gggggggg','ggGkkGgg','gggggggg','cccccccc','gccccccg','gccccccg','gccccccg','bbbbbbbb','bbb..bbb','bbb..bbb','kkk..kkk'],pal:{g:'#4f9a3c',G:'#3a7a2b',k:'#1b1b1b',c:'#2aa6a6',b:'#3b3f9e'}},
 creeper:{map:['abacabab','bacabaca','akkbbkka','akkbbkka','baakkaab','abkkkkba','bkkabkkb','abkbakba','.babab..','.ababa..','.babab..','.ababa..','aba..aba','bab..bab'],pal:{a:'#5cbf4a',b:'#3e8f31',c:'#8be07a',k:'#121212'}},
 creeperBack:{map:['abacabab','bacabaca','abcbabca','bacabcab','abacabab','babacaba','abcababc','babacaba','.babab..','.ababa..','.babab..','.ababa..','aba..aba','bab..bab'],pal:{a:'#5cbf4a',b:'#3e8f31',c:'#8be07a'}},
 skeleton:{map:['wwwwwwww','wllwwllw','wkkwwkkw','wwwwwwww','wkkkkkkw','wwwwwwww','.dwwwwd.','w.kwwk.w','w.wwww.w','w.kwwk.w','..wwww..','..w..w..','..w..w..','..d..d..'],pal:{w:'#dcdcdc',l:'#f4f4f4',d:'#9a9a9a',k:'#1d1d1d'}},
 enderman:{map:['kkkkkkkk','kkkkkkkk','kkkkkkkk','pPkkkkPp','kkkkkkkk','kkkkkkkk','..kkkk..','.kkkkkk.','k.kkkk.k','k.kkkk.k','k.kkkk.k','k.kkkk.k','k.kkkk.k','..k..k..','..k..k..','..k..k..','..k..k..','..k..k..','..k..k..','..k..k..'],pal:{k:'#141018',p:'#e9a3ff',P:'#b23df0'}}
};
var GEAR=[
 {k:'sword',map:['......ss','.....sSs','....sSs.','...sSs..','g.sSs...','.gSs....','.hg.....','h.g.....'],pal:{s:'#d9f0ff',S:'#7fb2d9',g:'#e6c14a',h:'#7a4a1f'},beats:'zombie'},
 {k:'bow',map:['..ww.s..','.w...s..','w....s..','w..aaaaa','w....s..','w....s..','.w...s..','..ww.s..'],pal:{w:'#9a6a35',s:'#e8e8e8',a:'#cfcfcf'},beats:'skeleton'},
 {k:'shield',map:['.rrrrrr.','rwwwwwwr','rwdwwdwr','rwwwwwwr','rwwddwwr','.rwwwwr.','..rwwr..','...rr...'],pal:{r:'#a6aeb8',w:'#9a6a35',d:'#6b4420'},beats:'creeper'},
 {k:'bucket',map:['i......i','.i....i.','IbbbbbbI','IbBbbBbI','IbbbbbbI','IiiiiiiI','.IiiiiI.','..IIII..'],pal:{i:'#c3cbd3',I:'#7d858d',b:'#3b82f6',B:'#8cc0ff'},beats:'enderman'}
];

MOBS.zombie.src=svgFrom(MOBS.zombie.map,MOBS.zombie.pal);MOBS.creeper.src=svgFrom(MOBS.creeper.map,MOBS.creeper.pal);MOBS.skeleton.src=svgFrom(MOBS.skeleton.map,MOBS.skeleton.pal);MOBS.enderman.src=svgFrom(MOBS.enderman.map,MOBS.enderman.pal);
GEAR.forEach(function(g){g.src=svgFrom(g.map,g.pal)});
var MOBKEYS=['zombie','skeleton','creeper','enderman'];
var SHIRTS=['#e94b4b','#3b82f6','#22c55e','#f59e0b','#a855f7','#ec4899','#14b8a6','#f97316','#eab308','#6366f1'];
var CAVE_GAMES=['dodge','counters','chests','vol'];
var ICON={dodge:'⚔️',counters:'🧟',chests:'💣',vol:'🙋',final:'💀',color:'🎨'};
var COLN=20,CHESTX=[16,36,56],CHESTY=26;

/* ---------- engine ---------- */
var S={mode:'cave',ph:'lobby',P:{},order:[],round:0,rounds:5,plan:[],mg:'',step:'',endsAt:0,msg:null,mobs:[],rumor:'',chests:null,vol:null,sweep:null,boss:100,color:null,tol:null,fallen:[],
  winner:null,runner:null,outOrder:[],paused:false,pauseAt:0,t:null,due:0,fn:null,pickMs:15000,tags:true,games:CAVE_GAMES.slice(),startAlive:[],strikes:0};
function rnd(a,b){return a+Math.random()*(b-a)}
function alive(){return S.order.map(function(id){return S.P[id]}).filter(function(p){return p&&p.alive})}
function at(ms,fn){clearTimeout(S.t);S.fn=fn;S.due=Date.now()+ms;if(S.paused)return;S.t=setTimeout(function(){S.fn=null;fn()},ms)}
function pause(on){if(on===S.paused)return;S.paused=on;var now=Date.now();
  if(on){S.pauseAt=now;clearTimeout(S.t);S.rem=Math.max(0,S.due-now)}
  else{var d=now-S.pauseAt;if(S.endsAt)S.endsAt+=d;if(S.fn){var fn=S.fn;at(S.rem,fn)}}
  changed()}
var XPK='lamma-xp-'+A.channel,XP={};try{XP=JSON.parse(A.LS.get(XPK,'{}'))||{}}catch(e){}
function addXp(p,n){XP[p.id]=(XP[p.id]||0)+n;p.lv=lvOf(p.id);A.LS.set(XPK,JSON.stringify(XP))}
function lvOf(id){return 1+Math.floor(Math.sqrt((XP[id]||0)/2))}
var QS=new URLSearchParams(location.search);if(QS.get('mode')==='colors')S.mode='colors'; /* old OBS links may still carry the removed camera-spot params (cam, cs): they are ignored */
function zone(){ // where players stand in the lobby / between rounds
  return S.mode==='colors'?{x0:4,x1:96,y0:22,y1:36}:{x0:6,x1:64,y0:18,y1:92}}
function placeFree(p){var z=zone();p.tx=rnd(z.x0,z.x1);p.ty=rnd(z.y0,z.y1);if(S.mode==='colors'&&p.tx>34&&p.tx<66)p.ty=rnd(30,36)}
function join(m,mcArg){
  var id=m.user,p=S.P[id],mc=C.mcName(mcArg||'');
  if(p){if(p.hidden){p.hidden=false;placeFree(p);changed()}if(mc&&p.mc!==mc){p.mc=mc;changed()}return}
  if(S.ph!=='lobby'||S.order.length>=100)return;
  p={id:id,n:m.name,c:m.color||'',mc:mc,col:SHIRTS[Math.random()*SHIRTS.length|0],gear:Math.random()*4|0,alive:true,st:'',tx:50,ty:50,pick:-1,side:-1,shield:false,stop:false,hidden:false,vol:false,lv:lvOf(id),info:0};
  placeFree(p);S.P[id]=p;S.order.push(id);A.sfx('pop');changed();
}
function kick(id){var i=S.order.indexOf(id);if(i<0)return;S.order.splice(i,1);delete S.P[id];changed()}
function clearAll(){S.P={};S.order=[];changed()}
setInterval(function(){if(!A.runsEngine()||S.paused)return;var moved=false;
  var wander=S.ph==='lobby'||S.ph==='winner'||(S.ph==='game'&&(S.step==='intro'||S.step==='result')&&S.mode==='cave');
  if(wander)S.order.forEach(function(id){var p=S.P[id];if(!p.alive||p.stop||p.hidden||Math.random()>.3)return;var z=zone();
    if(S.ph==='game'&&(S.mg==='dodge'||S.mg==='final')&&p.side>=0){z=p.side===0?{x0:4,x1:34,y0:14,y1:92}:{x0:40,x1:64,y0:14,y1:92}}
    p.tx=Math.max(z.x0,Math.min(z.x1,p.tx+rnd(-9,9)));p.ty=Math.max(z.y0,Math.min(z.y1,p.ty+rnd(-6,6)));moved=true});
  S.order.forEach(function(id){var p=S.P[id];if(p.info&&Date.now()>p.info){p.info=0;moved=true}});
  if(moved)changed()},900);

function makePlan(){var n=alive().length,k=Math.max(1,S.rounds-1),list=S.games.length?S.games.slice():['dodge'],plan=[],last='';
  for(var i=0;i<k;i++){var bag=list.filter(function(m){return m!==last&&!(m==='vol'&&(i===0||n<4))});if(!bag.length)bag=list.filter(function(m){return m!=='vol'})||['dodge'];if(!bag.length)bag=['dodge'];var m=bag[Math.random()*bag.length|0];plan.push(m);last=m}
  plan.push('final');return plan}
function startGame(){
  if(S.order.filter(function(id){return !S.P[id].hidden}).length<2){alert(A.t('p_need2'));return}
  S.order.forEach(function(id){var p=S.P[id];p.alive=!p.hidden;p.st='';p.pick=-1;p.side=-1;p.shield=false;p.vol=false});
  S.ph='game';S.round=0;S.outOrder=[];S.winner=null;S.runner=null;S.boss=100;S.paused=false;
  S.plan=S.mode==='colors'?Array.apply(null,Array(S.rounds)).map(function(){return 'color'}):makePlan();
  A.sfx('start');nextRound();
}
function backToLobby(){clearTimeout(S.t);S.fn=null;S.paused=false;S.ph='lobby';S.mg='';S.step='';S.msg=null;S.mobs=[];S.chests=null;S.vol=null;S.sweep=null;S.color=null;S.fallen=[];S.winner=null;S.plan=[];S.round=0;
  S.order.forEach(function(id){var p=S.P[id];p.alive=true;p.st='';p.pick=-1;p.side=-1;p.shield=false;p.vol=false;placeFree(p)});changed();A.clearLater()}
function nextRound(){
  S.mobs=[];S.chests=null;S.vol=null;S.sweep=null;S.rumor='';S.fallen=[];S.strikes=0;
  var al=alive();if(al.length<=1)return finish();
  if(S.round>=S.plan.length){S.plan.push(S.mode==='colors'?'color':'final')}
  S.round++;S.mg=S.plan[S.round-1];if(S.mg==='vol'&&al.length<4)S.mg='dodge';
  S.step='intro';S.startAlive=al.map(function(p){return p.id});al.forEach(function(p){p.st='';p.pick=-1;p.vol=false;if(S.mg!=='final'&&S.mg!=='dodge')p.side=-1});
  S.msg=null;S.endsAt=Date.now()+4000;layout();A.sfx('go');changed();A.poke();at(4000,play);
}
function layout(){var al=alive();
  if(S.mode==='colors'){al.forEach(function(p){if(p.pick<0)placeFree(p)});return}
  if(S.mg==='chests')al.forEach(function(p){p.tx=rnd(8,62);p.ty=rnd(50,92)});
  else if(S.mg==='vol')al.forEach(function(p){p.tx=rnd(6,64);p.ty=rnd(18,40)});
  else if(S.mg==='dodge'||S.mg==='final')al.forEach(function(p){if(p.side<0)p.side=p.tx<37?0:1;sideSpot(p)});
  else al.forEach(function(p){p.tx=rnd(6,56);p.ty=rnd(18,92)});
}
function sideSpot(p){if(p.side===0){p.tx=rnd(5,33);}else{p.tx=rnd(41,64);}p.ty=rnd(16,92)}
function play(){
  if(S.mode==='colors')return colorPick();
  if(S.mg==='dodge'||S.mg==='final')return dodgePick();
  if(S.mg==='counters'){S.step='pick';S.endsAt=Date.now()+S.pickMs;if(Math.random()<.6)S.rumor=MOBKEYS[Math.random()*4|0];changed();A.poke();at(S.pickMs,countersReveal);return}
  if(S.mg==='chests'){S.step='pick';S.endsAt=Date.now()+S.pickMs;S.chests={x:CHESTX,y:CHESTY,traps:[],open:false};changed();A.poke();at(S.pickMs,chestsReveal);return}
  if(S.mg==='vol'){S.step='jump';S.endsAt=Date.now()+12000;S.vol={votes:{},champ:null,pit:null,res:null};changed();A.poke();at(12000,volVote);return}
}
/* dodge / final: the boss strikes one side */
function dodgePick(){S.step='pick';S.sweep=null;var ms=S.mg==='final'?Math.max(8000,S.pickMs*.6):Math.max(8000,S.pickMs*.75);S.endsAt=Date.now()+ms;S.msg={k:'b_pick'};changed();A.poke();at(ms,dodgeStrike)}
function dodgeStrike(){var al=alive(),side=Math.random()<.5?0:1;var victims=al.filter(function(p){return p.side===side});
  var fizzle=victims.length>=al.length&&al.length>0;
  S.step='strike';S.endsAt=0;S.sweep={side:side,at:Date.now(),fizzle:fizzle};S.msg={k:fizzle?'b_missed':'b_strike'};A.sfx('bad');changed();
  at(2100,function(){S.strikes++;
    if(!fizzle){var dead=victims.filter(function(p){if(p.shield){p.shield=false;return false}return true});eliminate(dead,al.filter(function(p){return dead.indexOf(p)<0}))}else S.msg={k:'b_missed'};
    S.step='result';changed();
    var left=alive().length,target=Math.max(1,Math.ceil(S.startAlive.length/2));
    at(2600,function(){if(left<=1)return finish();if(S.mg==='final'||(left>target&&S.strikes<3))return dodgePick();nextRound()})})}
/* counters: the boss summons mobs */
function countersReveal(){var al=alive(),types=MOBKEYS.filter(function(m){return m!==S.rumor});types=C.shuffle(types).slice(0,al.length>6?2:1);
  S.mobs=[];types.forEach(function(t,ti){for(var i=0;i<3;i++)S.mobs.push({t:t,x:84,y:58+i*4,tx:rnd(40,62),ty:20+ti*36+i*10})});
  S.step='reveal';S.msg={k:'b_coming',m:types};S.endsAt=0;A.sfx('bad');changed();
  at(2800,function(){var win=al.filter(function(p){return types.indexOf(GEAR[p.gear].beats)>=0});
    if(!win.length){S.msg={k:'b_none'};al.forEach(function(p){p.st='cheer'})}else eliminate(al.filter(function(p){return win.indexOf(p)<0}),win);
    S.step='result';S.boss=Math.max(10,S.boss-12);changed();at(4200,nextRound)})}
/* chests */
function chestsReveal(){var al=alive(),nT=al.length>20?2:1;S.chests.traps=C.shuffle([0,1,2]).slice(0,nT);S.chests.open=true;S.step='reveal';S.msg={k:'b_tnt'};S.endsAt=0;A.sfx('boom');
  var dead=al.filter(function(p){return p.pick<0||S.chests.traps.indexOf(p.pick)>=0}),live=al.filter(function(p){return dead.indexOf(p)<0});
  if(!live.length){var pk=al.filter(function(p){return p.pick>=0});live=pk.length?pk:al;dead=al.filter(function(p){return live.indexOf(p)<0})}
  changed();at(1300,function(){eliminate(dead,live);S.step='result';changed();at(4000,nextRound)})}
/* volunteers */
function volVote(){var v=alive().filter(function(p){return p.vol});
  if(!v.length){S.step='result';S.msg={k:'b_novol'};changed();at(2500,nextRound);return}
  S.step='vote';S.endsAt=Date.now()+12000;changed();A.poke();at(12000,volFight)}
function volFight(champId){var v=alive().filter(function(p){return p.vol});if(!v.length)return nextRound();
  var champ=champId&&S.P[champId]&&S.P[champId].vol?S.P[champId]:null;
  if(!champ){var cnt={};Object.keys(S.vol.votes).forEach(function(u){var c=S.vol.votes[u];cnt[c]=(cnt[c]||0)+1});var best=v.slice().sort(function(a,b){return (cnt[b.id]||0)-(cnt[a.id]||0)||Math.random()-.5});champ=best[0]}
  S.vol.champ=champ.id;S.step='fight';S.endsAt=0;S.msg={k:'b_fight',n:champ.n};champ.tx=62;champ.ty=56;changed();
  at(3000,function(){var win=Math.random()<.6;S.vol.res=win?'win':'lose';S.vol.pit=Math.random()<.55?'slime':'lava';
    if(win){S.boss=Math.max(5,S.boss-30);addXp(champ,3);S.msg={k:'b_win',n:champ.n};champ.st='cheer'}else{S.msg={k:'b_lose',n:champ.n}}
    var others=v.filter(function(p){return p!==champ});
    others.forEach(function(p){p.tx=40+rnd(-6,6);p.ty=58+rnd(-3,3)});
    changed();
    at(1800,function(){var dead=[];if(!win)dead.push(champ);
      if(S.vol.pit==='slime'){others.forEach(function(p){p.shield=true;p.st='cheer'});S.msg={k:'b_slime'}}else{dead=dead.concat(others);S.msg={k:'b_lava'}}
      if(dead.length>=alive().length)dead=dead.slice(0,Math.max(0,alive().length-1));
      if(dead.length)eliminate(dead,null,true);S.step='result';changed();at(3500,nextRound)})})}
/* colour floor */
function colorPick(){var tol=Math.max(0,Math.min(4,S.plan.length-S.round));S.tol=tol;S.color=Math.random()*COLN|0;S.fallen=[];
  S.step='pick';S.endsAt=Date.now()+S.pickMs;S.msg={k:'b_go'};changed();A.poke();at(S.pickMs,colorDrop)}
function colorDrop(){var al=alive(),lo=S.color-S.tol,hi=S.color+S.tol;S.fallen=[];for(var c=0;c<COLN;c++)if(c<lo||c>hi)S.fallen.push(c);
  var on=al.filter(function(p){return p.pick>=0}),safe=on.filter(function(p){return p.pick>=lo&&p.pick<=hi});
  if(!safe.length&&on.length){var md=Math.min.apply(null,on.map(function(p){return Math.abs(p.pick-S.color)}));safe=on.filter(function(p){return Math.abs(p.pick-S.color)===md})}
  if(!on.length)safe=al;
  var dead=al.filter(function(p){return safe.indexOf(p)<0});
  S.step='drop';S.endsAt=0;A.sfx('boom');eliminate(dead,safe);changed();
  at(3200,function(){S.step='result';changed();at(1200,function(){var left=alive().length;if(left<=1||S.round>=S.plan.length+3)return finish();nextRound()})})}
function eliminate(dead,live,quiet){
  dead.forEach(function(p){if(!p.alive)return;p.alive=false;p.st='out';S.outOrder.push(p.id)});
  (live||[]).forEach(function(p){p.st='cheer';addXp(p,1)});
  if(!quiet){var left=alive().length;S.msg=dead.length?{k:'b_out',n:dead.length,m:left}:{k:'b_none'}}
}
function finish(forceId){
  clearTimeout(S.t);S.fn=null;var al=alive();
  var w=forceId?S.P[forceId]:(al.length?al[Math.random()*al.length|0]:S.P[S.outOrder[S.outOrder.length-1]]);
  var ruId=S.outOrder.slice().reverse().filter(function(id){return !w||id!==w.id})[0];var ru=al.filter(function(p){return p!==w})[0]||S.P[ruId];
  S.ph='winner';S.step='';S.mg='';S.mobs=[];S.chests=null;S.vol=null;S.sweep=null;S.msg=null;S.fallen=[];S.boss=0;
  S.order.forEach(function(id){var p=S.P[id];if(p!==w){if(p.alive){p.alive=false;p.st='out'}}});
  if(w){w.alive=true;w.st='win';w.tx=S.mode==='colors'?50:36;w.ty=70;S.winner={id:w.id,n:w.n,c:w.c,mc:w.mc,col:w.col};A.award(w.id,w.n,5);addXp(w,8)}
  if(ru){S.runner={n:ru.n,c:ru.c};A.award(ru.id,ru.n,2)}
  A.sfx('win');changed();A.confetti($('stage'),110);
}

/* ---------- chat ---------- */
function onMsg(m){
  if(!A.runsEngine())return;
  var cmd=C.parseCmd(m.text),c=cmd?String(cmd.cmd).toLowerCase():'';
  if(cmd&&A.isCtrl(m)){
    if(c==='party'||c==='lobby'||c==='end'){backToLobby();return}
    if(c==='brawl'||c==='start'||c==='cave'){if(S.ph!=='game'){if(c==='cave')S.mode='cave';startGame()}return}
    if(c==='colors'||c==='colours'||c==='ألوان'){if(S.ph!=='game'){S.mode='colors';startGame()}return}
    if(c==='pause'){pause(!S.paused);return}
  }
  if(cmd&&(c==='join'||c==='play'||c==='skin'||c==='دخول')){join(m,cmd.args[0]);return}
  var p=S.P[m.user];if(!p)return;
  if(c==='hide'||c==='اختفي'){if(S.ph==='lobby'){p.hidden=!p.hidden;if(!p.hidden)placeFree(p);changed()}return}
  if(c==='stop'||c==='وقف'){p.stop=!p.stop;if(p.stop){p.tx=+p.tx;p.ty=+p.ty}changed();return}
  if(c==='getinfo'||c==='info'||c==='لفل'){p.info=Date.now()+4000;changed();return}
  if(!p.alive||S.ph!=='game'||S.paused)return;
  if(S.mode==='colors'&&S.step==='pick'){var v=C.parseVote(m.text,COLN);if(v>=0){p.pick=v;p.tx=(v+.5)*5+rnd(-1.4,1.4);p.ty=rnd(46,88);changed()}return}
  if((S.mg==='dodge'||S.mg==='final')&&S.step==='pick'){var sd=(c==='a'||c==='left'||c==='يسار')?0:(c==='d'||c==='right'||c==='يمين')?1:-1;if(sd>=0&&sd!==p.side){p.side=sd;sideSpot(p);changed()}return}
  if(S.mg==='counters'&&S.step==='pick'){var g=C.parseVote(m.text,4);if(g>=0&&g!==p.gear){p.gear=g;p.pick=g;changed()}return}
  if(S.mg==='chests'&&S.step==='pick'){var d=C.parseVote(m.text,3);if(d>=0){p.pick=d;p.tx=CHESTX[d]+rnd(-6,6);p.ty=rnd(36,56);changed()}return}
  if(S.mg==='vol'&&S.step==='jump'&&(c==='jump'||c==='قفز'||c==='تطوع')){if(!p.vol){p.vol=true;p.tx=40+rnd(-14,14);p.ty=58+rnd(-12,12);changed()}return}
  if(S.mg==='vol'&&S.step==='vote'&&(c==='vote'||c==='صوت')&&cmd.args[0]){var q=String(cmd.args.join(' ')).replace(/^@/,'').toLowerCase();var t=alive().filter(function(x){return x.vol&&(x.n.toLowerCase()===q||x.id===q)})[0]||alive().filter(function(x){return x.vol&&x.n.toLowerCase().indexOf(q)===0})[0];if(t){S.vol.votes[p.id]=t.id;changed()}return}
}
A.onChat(onMsg);

/* ---------- public state (never anything secret: traps/strike side/colour are set only when revealed) ---------- */
function pub(){
  return {mode:S.mode,ph:S.ph,round:S.round,plan:S.plan,mg:S.mg,step:S.step,endsAt:S.endsAt,msg:S.msg,rumor:S.step==='pick'?S.rumor:'',mobs:S.mobs,chests:S.chests,
    vol:S.vol?{votes:countVotes(),champ:S.vol.champ,pit:S.vol.pit,res:S.vol.res}:null,sweep:S.sweep,boss:S.boss,color:S.step==='intro'?null:S.color,tol:S.tol,fallen:S.fallen,
    winner:S.winner,runner:S.runner,tags:S.tags,paused:S.paused,total:S.order.length,
    pl:S.order.filter(function(id){return !S.P[id].hidden}).map(function(id){var p=S.P[id];return [p.id,p.n,p.c,p.mc,p.col,p.gear,p.alive?1:0,+(+p.tx).toFixed(1),+(+p.ty).toFixed(1),p.st,p.pick,p.side,p.shield?1:0,p.lv,(p.vol?1:0)|(p.info?2:0)|(p.stop?4:0)]})};
}
function countVotes(){var c={};if(S.vol)Object.keys(S.vol.votes).forEach(function(u){var v=S.vol.votes[u];c[v]=(c[v]||0)+1});return c}

/* ---------- rendering ---------- */
var R={P:null},gs=$('gs'),hud=$('bbHud');
var BGOFF=new URLSearchParams(location.search).get('bg')==='0';
var arena=new window.BBArena($('kkWorld'),{gear:GEAR,transparent:A.obs&&BGOFF});
if(A.obs&&BGOFF)document.documentElement.classList.add('bb-clear');
function fitGs(){var w=gs.getBoundingClientRect().width;if(!w)return;gs.style.fontSize=Math.max(8,w/84)+'px';gs.classList.toggle('narrow',w<640)}
if(window.ResizeObserver)new ResizeObserver(fitGs).observe(gs);fitGs();
function draw(P){R.P=P;gs.classList.toggle('mode-colors',P.mode==='colors');arena.update(P);drawHud(P);drawSide(P)}
var sideKey='';
function drawSide(P){var k=[P.mode,P.ph,P.mg,P.step,A.lang(),P.paused].join('|');if(k===sideKey)return;sideKey=k;
  var ul=$('kkCmds');A.clear(ul);var rows=[];
  var mg=P.ph==='game'?P.mg:'';
  if(mg==='dodge'||mg==='final')rows.push(['!A / !D','c_dodge',1]);if(mg==='counters')rows.push(['!1 !2 !3 !4','c_gear',1]);if(mg==='chests')rows.push(['!1 !2 !3','c_chest',1]);
  if(mg==='vol')rows.push(P.step==='vote'?['!vote name','c_vote',1]:['!jump','c_jump',1]);
  rows=rows.concat([['!join','c_spawn'],['!join MCname','c_skin'],['!jump','c_jump'],['!hide','c_hide'],['!stop','c_stop'],['!vote name','c_vote'],['!getinfo','c_info']]);
  var seen={};rows.forEach(function(r){var key=r[0]+r[1];if(seen[key])return;seen[key]=1;var li=el('li',r[2]?'hot':'');var cd=el('code',null,r[0]);cd.dir='ltr';li.appendChild(cd);li.appendChild(el('span',null,'('+A.t(r[1])+')'));ul.appendChild(li)});
  $('kkHow').textContent=A.t('h_'+(P.ph==='game'?(P.mode==='colors'?'color':P.mg):'lobby'));
  var pb=$('kkPause');if(pb){pb.textContent=P.paused?'▶':'⏸';pb.setAttribute('aria-label',A.t(P.paused?'p_resume':'p_pause'));pb.disabled=A.obs||P.ph!=='game'}
}
var hudKey='';
function drawHud(P){
  var al=P.pl.filter(function(a){return a[6]}).length;
  var k=JSON.stringify([P.mode,P.ph,P.mg,P.step,P.msg,P.rumor,P.winner,P.round,al,P.pl.length,P.total,A.lang(),P.paused,P.plan,P.vol&&P.vol.votes,P.vol&&P.vol.champ,P.pl.map(function(a){return a[5]}).join('')]);
  if(k===hudKey)return;hudKey=k;A.clear(hud);
  // progress track (cave)
  if(P.mode!=='colors'&&P.ph==='game'&&P.plan.length){var tr=el('div','kk-track');P.plan.forEach(function(m,i){if(i)tr.appendChild(el('span','kk-link'+(i<P.round?' done':'')));var b=el('span','kk-stage'+(i<P.round-1?' done':i===P.round-1?' now':'')+(m==='final'?' boss':''),ICON[m]||'?');b.title=A.t('mg_'+m);tr.appendChild(b)});hud.appendChild(tr)}
  // stat boxes
  var st=el('div','kk-stats');
  function box(ico,txt,id){var b=el('span','kk-stat');b.appendChild(el('i',null,ico));var s=el('b',null,txt);s.dir='ltr';if(id)s.id=id;b.appendChild(s);st.appendChild(b)}
  box('👤',(P.ph==='game'?al:P.pl.length)+'/'+(P.ph==='game'?P.pl.length:100));
  if(P.ph==='game'){box('🏁',P.round+'/'+Math.max(P.round,P.plan.length));if(P.endsAt)box('⏱','00:00','bbTimer')}
  hud.appendChild(st);
  var ban=el('div','bb-banner');
  if(P.paused){ban.appendChild(el('p','bb-big',A.t('kk_paused')))}
  else if(P.ph==='lobby'){ban.classList.add('lobby');ban.appendChild(A.rich('p','bb-big',A.t('b_join')));ban.appendChild(A.rich('p','bb-small',A.t('b_join2')));if(!P.pl.length)ban.appendChild(el('p','bb-small dim',A.t('b_wait')))}
  else if(P.ph==='winner'&&P.winner){ban.classList.add('win');var wb=el('div','winner-box');wb.appendChild(el('p','s-mid',A.t('b_winner')));wb.appendChild(A.nameEl(P.winner.n,null));
    if(P.runner){var ru=el('p','bb-small');ru.appendChild(document.createTextNode(A.t('b_runner')+': '));ru.appendChild(A.nameEl(P.runner.n));wb.appendChild(ru)}ban.appendChild(wb)}
  else if(P.ph==='game'){var mg=P.mode==='colors'?'color':P.mg;
    if(P.step==='intro'){ban.classList.add('intro');ban.appendChild(el('p','bb-ribbon',(A.lang()==='ar'?'جولة ':'ROUND ')+P.round));ban.appendChild(el('p','bb-big',A.t('mg_'+mg)));var cd=el('div','bb-cd');cd.id='bbCd';hud.appendChild(cd)}
    else if(mg==='counters'&&P.step==='pick'){ban.appendChild(el('p','bb-mid',A.t('mg_counters')));var gg=el('div','gearbar');var counts=[0,0,0,0];P.pl.forEach(function(a){if(a[6])counts[a[5]]++});
      GEAR.forEach(function(g,i){var c=el('div','gb');var gk=el('b','gb-k','!'+(i+1));gk.dir='ltr';c.appendChild(gk);var im=el('img');im.src=g.src;im.alt='';c.appendChild(im);c.appendChild(el('span','gb-n',A.t('g_'+g.k)));var vs=el('span','gb-vs',A.t('vs')+' ');var mi=el('img','gb-mob');mi.src=MOBS[g.beats].src;mi.alt=A.t('m_'+g.beats);vs.appendChild(mi);c.appendChild(vs);c.appendChild(el('span','gb-c',String(counts[i])));gg.appendChild(c)});
      ban.appendChild(gg);if(P.rumor)ban.appendChild(el('p','bb-small rumor',f('rumor',{m:A.t('m_'+P.rumor)})))}
    else if(mg==='vol'&&P.step==='jump'){ban.appendChild(el('p','bb-big',A.t('b_jump')))}
    else if(mg==='vol'&&P.step==='vote'){ban.appendChild(el('p','bb-mid',A.t('b_vote')));var vl=el('div','kk-votes');var vc=(P.vol&&P.vol.votes)||{};P.pl.filter(function(a){return a[6]&&(a[14]&1)}).slice(0,8).forEach(function(a){var r=el('span','kk-vote');r.appendChild(A.nameEl(a[1],a[2]));r.appendChild(el('b',null,String(vc[a[0]]||0)));vl.appendChild(r)});ban.appendChild(vl)}
    else if((mg==='dodge'||mg==='final')&&P.step==='pick'){ban.appendChild(el('p','bb-big',A.t('mg_'+mg)));var lr=el('p','bb-small');lr.dir='ltr';lr.textContent='◀ !A        !D ▶';ban.appendChild(lr)}
    else if(mg==='chests'&&P.step==='pick'){ban.appendChild(el('p','bb-mid',A.t('mg_chests')));var ch=el('p','bb-small');ch.dir='ltr';ch.textContent='!1 · !2 · !3';ban.appendChild(ch)}
    else if(mg==='color'&&P.step==='pick'){ban.classList.add('low');ban.appendChild(el('p','bb-mid',A.t('b_go')))}
    else if(P.msg){var mm=P.msg,txt=mm.k==='b_out'?f('b_out',{n:mm.n,m:mm.m}):mm.k==='b_coming'?f('b_coming',{m:mm.m.map(function(x){return A.t('m_'+x)}).join(A.t('and'))}):(mm.k==='b_fight'||mm.k==='b_win'||mm.k==='b_lose')?f(mm.k,{n:mm.n}):A.t(mm.k);
      if(mg==='color')ban.classList.add('low');ban.appendChild(el('p',mm.k==='b_coming'||mm.k==='b_strike'?'bb-big danger':'bb-mid',txt))}
  }
  hud.appendChild(ban);tickTimer();
}
function tickTimer(){if(!R.P)return;var now=R.P.paused?Date.now():Date.now();var s=Math.max(0,Math.ceil((R.P.endsAt-now)/1000));
  var cd=$('bbCd');if(cd){var v=R.P.step==='intro'&&s<=3&&s>0?String(s):'';if(cd._v!==v){cd._v=v;cd.textContent=v;cd.classList.remove('pop');void cd.offsetWidth;if(v)cd.classList.add('pop')}}
  var t=$('bbTimer');if(!t||R.P.paused)return;t.textContent='00:'+('0'+s).slice(-2);t.parentNode.classList.toggle('low',s<=5)}
setInterval(tickTimer,250);

/* ---------- control panel (streamer only, never in OBS) ---------- */
var pubT=null;
function changed(){var P=pub();draw(P);renderCtrl();if(!pubT){pubT=setTimeout(function(){pubT=null;A.publish(pub())},80)}}
function renderCtrl(){
  if(A.obs)return;
  $('bbCount').textContent=S.order.length;
  $('bbPhase').textContent=S.paused?A.t('p_paused'):A.t(S.ph==='lobby'?'p_lobby':S.ph==='game'?'p_ingame':'p_won');
  $('bbStart').disabled=S.ph==='game'||S.order.length<2;$('bbStop').disabled=S.ph==='lobby';$('bbSkip').disabled=S.ph!=='game';
  var pb=$('bbPause');pb.disabled=S.ph!=='game';pb.textContent=A.t(S.paused?'p_resume':'p_pause');
  $('bbModeCave').checked=S.mode==='cave';$('bbModeColors').checked=S.mode==='colors';$('bbModeCave').disabled=$('bbModeColors').disabled=S.ph==='game';
  // volunteers: streamer picks the champion
  var vb=$('bbVols'),vols=alive().filter(function(p){return p.vol}),showV=S.ph==='game'&&S.mg==='vol'&&(S.step==='jump'||S.step==='vote')&&vols.length;
  vb.hidden=!showV;if(showV){var vk=vols.map(function(p){return p.id}).join()+JSON.stringify(countVotes());if(vb._k!==vk){vb._k=vk;var vl=$('bbVolList');A.clear(vl);var cv=countVotes();
    vols.forEach(function(p){var li=el('li');li.appendChild(A.nameEl(p.n,p.c));li.appendChild(el('span','mcn','🗳 '+(cv[p.id]||0)));var b=el('button','btn btn-ghost btn-sm',A.t('p_choose'));b.type='button';b.addEventListener('click',function(){if(S.mg==='vol'&&(S.step==='jump'||S.step==='vote')){clearTimeout(S.t);S.fn=null;volFight(p.id)}});li.appendChild(b);vl.appendChild(li)})}}
  var ol=$('bbList'),key=S.order.map(function(id){var p=S.P[id];return id+(p.alive?1:0)+(p.hidden?1:0)+(p.mc||'')}).join()+S.ph+A.lang();
  if(ol._k!==key){ol._k=key;A.clear(ol);
    S.order.slice(0,100).forEach(function(id){var p=S.P[id];var li=el('li',p.alive&&!p.hidden?'':'dead');li.appendChild(A.nameEl(p.n,p.c));li.appendChild(el('span','mcn','Lv.'+p.lv+(p.mc?' · '+p.mc:'')));
      function btn(txt,title,fn){var x=el('button','kick',txt);x.type='button';x.title=title;x.setAttribute('aria-label',title+' '+p.n);x.addEventListener('click',fn);li.appendChild(x)}
      if(S.ph==='game'){if(p.alive)btn('☠',A.t('p_out'),function(){eliminate([p],null,true);S.msg={k:'b_out',n:1,m:alive().length};changed();if(alive().length<=1){clearTimeout(S.t);S.fn=null;finish()}});
        else btn('❤',A.t('p_in'),function(){p.alive=true;p.st='';p.hidden=false;var i=S.outOrder.indexOf(p.id);if(i>=0)S.outOrder.splice(i,1);placeFree(p);changed()});
        btn('👑',A.t('p_win'),function(){finish(p.id)})}
      btn('✕',A.t('p_kick'),function(){kick(id);if(S.ph==='game'&&alive().length<=1){clearTimeout(S.t);S.fn=null;finish()}});ol.appendChild(li)})}
}
if(!A.obs){
  var saved={};try{saved=JSON.parse(A.LS.get('lamma-party2','{}'))||{}}catch(e){}
  if(saved.pick)$('bbPickT').value=saved.pick;if(saved.rounds)$('bbRounds').value=saved.rounds;if(saved.tags===false)$('bbTags').checked=false;if(saved.mode)S.mode=saved.mode;
  if(saved.games)CAVE_GAMES.forEach(function(m){$('g_'+m).checked=saved.games.indexOf(m)>=0});
  function readSet(){S.pickMs=+$('bbPickT').value*1000;S.rounds=+$('bbRounds').value;S.tags=$('bbTags').checked;S.games=CAVE_GAMES.filter(function(m){return $('g_'+m).checked});
    if(S.ph!=='game')S.mode=$('bbModeColors').checked?'colors':'cave';
    A.LS.set('lamma-party2',JSON.stringify({pick:S.pickMs/1000,rounds:S.rounds,tags:S.tags,games:S.games,mode:S.mode}));
    if(S.ph==='lobby')S.order.forEach(function(id){placeFree(S.P[id])});setObsBg();changed()}
  $('bbModeCave').checked=S.mode==='cave';$('bbModeColors').checked=S.mode==='colors';
  ['bbPickT','bbRounds','bbTags','bbModeCave','bbModeColors'].concat(CAVE_GAMES.map(function(m){return 'g_'+m})).forEach(function(id){$(id).addEventListener('change',readSet)});readSet();
  $('bbStart').addEventListener('click',startGame);$('bbStop').addEventListener('click',backToLobby);
  $('bbSkip').addEventListener('click',function(){if(S.ph==='game'){clearTimeout(S.t);S.fn=null;S.paused=false;S.sweep=null;nextRound()}});
  $('bbPause').addEventListener('click',function(){pause(!S.paused)});
  $('kkPause').addEventListener('click',function(){if(S.ph==='game')pause(!S.paused)});
  $('bbClear').addEventListener('click',function(){backToLobby();clearAll()});
}
function setObsBg(){var cb=$('bbObsClear'),i=$('obsUrl');if(cb&&i)i.value=A.obsUrl((cb.checked?'&bg=0':'')+(S.mode==='colors'?'&mode=colors':''))}
if(!A.obs&&$('bbObsClear')){$('bbObsClear').addEventListener('change',setObsBg);setTimeout(setObsBg,50)}
A.onLang(function(){hudKey='';sideKey='';if(R.P){drawHud(R.P);drawSide(R.P)}if($('bbList'))$('bbList')._k='';renderCtrl();setObsBg()});
A.onMirror(function(P){draw(P)});
A.onMode(function(m){if(m==='mirror'){clearTimeout(S.t)}});

/* ---------- demo: fake chatters (some with real public Minecraft skins) ---------- */
A.onDemo(function(){
  A.clearLater();
  if(S.ph==='lobby'){A.BOTS.slice(0,24).forEach(function(b,i){var bt=A.bot(i);if(S.P[bt.user])return;A.later(250+i*330+Math.random()*250,function(){A.say(bt.mc?'!join '+bt.mc:'!join',bt)})});return}
  if(S.ph!=='game'||S.paused)return;
  var r=S.round,step=S.step,strikes=S.strikes;
  var bots=alive().filter(function(p){return p.id.indexOf('demo_')===0||p.id.indexOf('x')===0}).map(function(p){var i=A.BOTS.findIndex(function(b){return 'demo_'+b[0].toLowerCase()===p.id});return i>=0?A.bot(i):{user:p.id,name:p.n,color:p.c}});
  function still(){return S.ph==='game'&&S.round===r&&S.step===step&&S.strikes===strikes}
  function spread(fn,frac,win){bots.forEach(function(b){if(Math.random()<frac)A.later(600+Math.random()*(win||S.pickMs-2500),function(){if(still())fn(b)})})}
  if(S.mode==='colors'&&step==='pick')spread(function(b){var c=Math.max(0,Math.min(19,S.color+Math.round((Math.random()-.5)*(6+S.tol*2))));A.say('!'+(c+1),b)},.92);
  else if((S.mg==='dodge'||S.mg==='final')&&step==='pick')spread(function(b){A.say(Math.random()<.5?'!a':'!d',b)},.85,Math.max(4000,(S.endsAt-Date.now())-1500));
  else if(S.mg==='counters'&&step==='pick')spread(function(b){A.say('!'+(1+(Math.random()*4|0)),b)},.85);
  else if(S.mg==='chests'&&step==='pick')spread(function(b){A.say('!'+(1+(Math.random()*3|0)),b)},.92);
  else if(S.mg==='vol'&&step==='jump')spread(function(b){A.say('!jump',b)},.3,9000);
  else if(S.mg==='vol'&&step==='vote'){var vols=alive().filter(function(p){return p.vol});spread(function(b){var t=vols[Math.random()*vols.length|0];if(t)A.say('!vote '+t.n,b)},.7,9000)}
  if(step==='intro'||step==='result')bots.forEach(function(b){if(Math.random()<.04)A.later(500+Math.random()*2000,function(){A.say('!getinfo',b)})});
});
var lastStep='';setInterval(function(){var k=S.ph+S.round+S.step+S.strikes+S.paused;if(k!==lastStep){lastStep=k;A.poke()}},300);

window.__bb={S:S,next:function(mg){S.games=[mg]},finish:finish,pause:pause};
changed();
A.start();
})();
