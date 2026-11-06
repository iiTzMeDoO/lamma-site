/* btcore.js — «المعركة» shared logic. Pure parts work in Node for tests (module.exports); in the browser window.BT also carries
   the small DOM helpers every battle page uses (∞ / ث timers, "خيارات زيادة" memory, names in <bdi>, Twitch pictures).
   - BT.cmd(text): one chat line → {k: join|leave|jump|hide|vote|power|focus|info|start|pause|next|boss|reset, arg} (Arabic + English).
   - BT.colNum(text,n): "!7", "7", "!٧", "! 7" → 6 (0-based), else -1.
   - BT.Colors: the Colorblind engine (20 columns, target colour, 5 rounds with a narrowing gradient, wrong column falls).
   - BT.Arena: the raid engine (lobby → the streamer picks the squad → waves of mobs → boss), stepped by time, deterministic with a seed. */
(function(root){
'use strict';
function norm(s){return String(s||'').normalize('NFC').replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,'').replace(/[\u064B-\u065F\u0670\u0640]/g,'')
  .replace(/[\u0622\u0623\u0625\u0671]/g,'\u0627').replace(/\u0649/g,'\u064A').replace(/\u0629/g,'\u0647')
  .replace(/[\u0660-\u0669]/g,function(d){return String(d.charCodeAt(0)-0x0660)}).replace(/[\u06F0-\u06F9]/g,function(d){return String(d.charCodeAt(0)-0x06F0)})
  .replace(/^\uFF01/,'!').toLowerCase().replace(/\s+/g,' ').trim();}
var CMDS={
  cancel:['cancel','الغي','الغاء','ألغي','إلغاء','الغ','تراجع'],stats:['stats','احصائيات','إحصائيات','ستات','حروف'],heal:['heal','علاج','عالج','داوي'],end:['end','خلص','انهاء','إنهاء','انه'],cls:['class','صنف','كلاس'],
  join:['join','دخول','ادخل','play','انضم'],leave:['leave','خروج','اطلع','اخرج','غادر'],jump:['jump','قفز','اخترني','اختارني','pickme','تطوع'],hide:['hide','اختبي','اختبئ','اخفي'],
  vote:['vote','صوت'],power:['power','قوه','قوة','p'],focus:[],info:['info','معلومات','getinfo','معلوماتي'],
  start:['start','ابدا','ابدأ','ابدء'],pause:['pause','وقف','stop','أوقف','اوقف','ايقاف','إيقاف'],next:['next','التالي','الجاي'],boss:['boss','زعيم'],reset:['reset','جديد','newgame'],skin:['skin','سكن','سكين']
};
var CMAP={};Object.keys(CMDS).forEach(function(k){CMDS[k].forEach(function(w){CMAP[norm(w)]=k;});});
function cmd(text){var n=norm(text);if(n.charAt(0)!=='!')return null;var body=n.slice(1).trim();if(!body)return null;var sp=body.indexOf(' ');var w=sp<0?body:body.slice(0,sp);var arg=sp<0?'':body.slice(sp+1).trim();var k=CMAP[w];return k?{k:k,arg:arg}:null;}
var MODK={start:1,pause:1,next:1,boss:1,reset:1};
function colNum(text,n){var t=norm(text);var m=/^!?\s?(\d{1,2})$/.exec(t);if(!m)return -1;var v=parseInt(m[1],10);return (v>=1&&v<=(n||20))?v-1:-1;}
function rng(seed){var a=(seed>>>0)||1;return function(){a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};}
function hsl2hex(h,s,l){h=((h%360)+360)%360;s/=100;l/=100;var k=function(n){return (n+h/30)%12},a=s*Math.min(l,1-l),f=function(n){return l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)))};return '#'+[f(0),f(8),f(4)].map(function(x){return ('0'+Math.round(x*255).toString(16)).slice(-2)}).join('');}

/* ---------- لعبة الألوان: Colorblind ---------- */
var SPANS=[340,150,80,40,18,12,8]; /* hue spread across the 20 columns, round by round (round 1 = the whole rainbow) */
function palette(round,seed,n){n=n||20;var r=rng(seed*31+round*7),span=SPANS[Math.min(round-1,SPANS.length-1)],c=r()*360,out=[];
  var sat=round<=1?80:72-Math.min(round,5)*2,lit=round<=1?55:52;
  for(var i=0;i<n;i++){var h=round<=1?(i/n)*span:(c-span/2+i*span/(n-1));out.push(hsl2hex(h,sat,lit));/* one smooth strip: no alternating light/dark steps */}
  return out;}
function Colors(opt){opt=opt||{};this.n=opt.n||20;this.rounds=opt.rounds||5;this.seed=opt.seed||((Date.now()%1e9)|0);this.reset();}
Colors.prototype.reset=function(){this.players={};this.order=[];this.phase='lobby';this.round=0;this.pal=palette(1,this.seed,this.n);this.target=-1;this.winners=[];this.lastFall=[];};
Colors.prototype.join=function(user,name,color){if(!user)return false;var p=this.players[user];if(p){p.name=name||p.name;if(color)p.color=color;return false;}
  if(this.phase!=='lobby'&&!(this.phase==='pick'&&this.round===1&&this.lateJoin!==false))return false;
  this.players[user]={user:user,name:name||user,color:color||'',col:-1,alive:true,out:0};this.order.push(user);return true;};
Colors.prototype.leave=function(user){if(!this.players[user])return false;if(this.phase==='lobby'){delete this.players[user];this.order.splice(this.order.indexOf(user),1);}else this.players[user].alive=false;return true;};
Colors.prototype.alive=function(){var s=this;return this.order.filter(function(u){return s.players[u].alive});};
Colors.prototype.tol=function(){return this.round===1&&this.neighbour!==false?1:0;};
Colors.prototype.start=function(){if(this.phase!=='lobby'&&this.phase!=='end')return false;if(this.phase==='end'){var s=this;this.order.forEach(function(u){var p=s.players[u];p.alive=true;p.out=0;p.col=-1;});this.winners=[];}this.round=0;return this.nextRound();};
Colors.prototype.nextRound=function(){if(this.phase==='end')return false;this.round++;this.pal=palette(this.round,this.seed,this.n);var r=rng(this.seed+this.round*97);
  this.target=Math.floor(r()*this.n);var s=this;this.alive().forEach(function(u){s.players[u].col=-1;});this.phase='pick';this.lastFall=[];return true;};
Colors.prototype.isLast=function(){return this.round>=this.rounds;};
/* a player walks to column c (0-based); they can change their mind until the reveal. A number typed by someone new joins them in round 1. */
Colors.prototype.choose=function(user,c,name,color){if(this.phase!=='pick'||c<0||c>=this.n)return false;var p=this.players[user];if(!p){if(!this.join(user,name,color))return false;p=this.players[user];}if(!p.alive)return false;p.col=c;return true;};
Colors.prototype.reveal=function(){if(this.phase!=='pick')return null;var s=this,tol=this.tol(),al=this.alive(),fall=[],stay=[];
  al.forEach(function(u){var p=s.players[u];if(p.col>=0&&Math.abs(p.col-s.target)<=tol)stay.push(u);else fall.push(u);});
  /* nobody on the colour: the closest ones stay (the game never ends with no winner) */
  if(!stay.length&&al.length){var best=1e9;al.forEach(function(u){var p=s.players[u];var d=p.col<0?1e6:Math.abs(p.col-s.target);if(d<best)best=d;});
    if(best<1e6){stay=al.filter(function(u){var p=s.players[u];return p.col>=0&&Math.abs(p.col-s.target)===best});fall=al.filter(function(u){return stay.indexOf(u)<0});}
    else{stay=al.slice();fall=[];} /* nobody chose at all: nobody falls */}
  fall.forEach(function(u){s.players[u].alive=false;s.players[u].out=s.round;});this.lastFall=fall;this.phase='reveal';
  if(this.isLast()||stay.length<=1){this.phase='end';this.winners=stay.slice();}
  return {stay:stay,fall:fall,end:this.phase==='end'};};
Colors.prototype.pub=function(){var s=this;return {n:this.n,rounds:this.rounds,round:this.round,phase:this.phase,pal:this.pal,target:this.target,
  tc:this.target>=0?this.pal[this.target]:'',last:this.isLast(),
  pl:this.order.map(function(u){var p=s.players[u];return [u,p.name,p.color||'',p.col,p.alive?1:0,p.out|0];}),fall:this.lastFall.slice(0,600),win:this.winners.slice(0,50)};};
Colors.prototype.load=function(o){if(!o||!o.pl)return;var s=this;this.n=o.n||20;this.rounds=o.rounds||5;this.round=o.round||0;this.phase=o.phase||'lobby';this.pal=o.pal||palette(1,this.seed,this.n);this.target=o.target==null?-1:o.target;
  this.players={};this.order=[];o.pl.forEach(function(a){s.players[a[0]]={user:a[0],name:a[1],color:a[2],col:a[3],alive:!!a[4],out:a[5]|0};s.order.push(a[0]);});this.lastFall=o.fall||[];this.winners=o.win||[];};

var api={norm:norm,cmd:cmd,MODK:MODK,colNum:colNum,rng:rng,hsl2hex:hsl2hex,palette:palette,Colors:Colors,SPANS:SPANS};
root.BT=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;

/* ---------- معركة الساحة: the raid engine (Kukoro "Dungeon raid", our way) ----------
   Chat joins the waiting list (!دخول), asks to be picked with !قفز, opts out with !اختبي, crowd-votes with !صوت name. The streamer picks
   the party (click / jumpers / random). Then the dungeon: rooms (3 / 5 / 7 / ∞) with a boss in the last one (∞: every 5th). In each room
   the party STANDS still on the left and the room's enemies stand on the right. Nobody fights on their own: the streamer chooses ONE
   fighter (click, or "التالي" = top !قفز / most voted), that fighter walks to the middle and duels the front enemy 1v1, turn by turn
   (DODGE / CRIT / damage). Winner walks back to their place, loser is out. "قتال تلقائي" (off by default) picks the next fighter by
   itself. !قوة fires your power once per duel (only while you are the one fighting); !ركز picks which enemy you will face.
   Win → map level +1, lose → −1. XP per kill / win raises a viewer's level (LV10 → LV20), saved per channel.
   Positions are normalised field coordinates (nx 0 = left … 1 = right, ny 0 = back … 1 = front), so every screen size draws the same
   spread-out layout. */
var BTR=root.BTR||(typeof require!=='undefined'?require('./btrpg.js'):null);
var POWERS=['bolt','fire','shield','heal','arrows','tnt','freeze'];
var POWT={bolt:'magic',fire:'fire',tnt:'blast',arrows:'arrow',freeze:'magic'};
var MOBSTAT=BTR.MOBS,BOSSTAT=BTR.BOSSES,MAPMOBS=BTR.MAPMOBS,MAPBOSS=BTR.MAPBOSS;
var DIFF={easy:.85,normal:1.2,hard:1.38,hell:1.65};
var WALK=1.35,TURN=.85,ENDT=1.1; /* seconds: walk to the middle, one hit, after the last hit */
var DUELF=[.425,.6],DUELM=[.575,.6];
function strHash(s){s=String(s||'');var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function powerOf(user){return POWERS[strHash(user)%POWERS.length];}
function lvlOf(xp){return Math.min(20,10+Math.floor((xp||0)/120));}
/* party places: a loose staggered field on the left (16 max), front rows first; enemies: spread on the right; the boss stands alone */
function partySlot(i,n){var cols=n<=6?2:n<=12?3:4,rows=Math.ceil(n/cols);var c=i%cols,r=Math.floor(i/cols);
  var x=.33-c*(.26/Math.max(1,cols-1))-(r%2)*.03,y=rows<=1?.6:.3+r*(.6/(rows-1));if(cols===1)x=.25;
  var h=strHash('p'+i);return [Math.round((x+((h%7)-3)*.002)*1000)/1000,Math.round((y+(((h>>4)%7)-3)*.006)*1000)/1000];}
function enemySlot(i,n,boss){if(boss)return [.79,.58];var cols=n<=3?1:n<=8?2:3,rows=Math.ceil(n/cols);var c=i%cols,r=Math.floor(i/cols);
  var x=.7+c*(cols>2?.1:.15)+(r%2)*.03,y=rows<=1?.6:.3+r*(.6/Math.max(1,rows-1));return [Math.round(x*1000)/1000,Math.round(y*1000)/1000];}
function Arena(opt){opt=opt||{};this.seed=opt.seed||((Date.now()%1e9)|0);this.r=rng(this.seed);
  this.cfg={waves:5,diff:'normal',squadMax:10,map:'nether',boss:'auto',autoPower:true,pwTurns:3,autoFight:false,breakSecs:4,pickSecs:1.6,events:true,loot:true,infoSecs:7,speak:true};if(opt.cfg)for(var k in opt.cfg)this.cfg[k]=opt.cfg[k];
  this.levels={};this.xp={};this.gear={};this.cls={};this.waiting={};this.order=[];this.squad=[];this.infoQ=[];this.info=null;this.says={};this.reset();}
Arena.prototype.reset=function(){this.card=null;this.phase='lobby';this.wave=0;this.f=[];this.m=[];this.ev=[];this.evId=this.evId||0; /* event ids never restart: a view that saw id 120 last game ignored every new event below 120 → no damage numbers, no sounds (Mohammad #14) */this.feed=[];this.t=0;this.nextAt=0;this.pickAt=0;this.duel=null;this.result='';this.idN=0;this.paused=false;this.voted={};this.event='';this.rooms=[];this.bossN=0;this.roomKills={};this.roomGold=0;};
Arena.prototype.level=function(){return this.levels[this.cfg.map]||1;};
Arena.prototype.emit=function(e){e.id=++this.evId;e.t=Math.round(this.t*100)/100;this.ev.push(e);if(this.ev.length>80)this.ev.splice(0,this.ev.length-80);return e;};
Arena.prototype.join=function(user,name,color){if(!user)return false;var w=this.waiting[user];if(w){w.name=name||w.name;if(color)w.color=color;return false;}this.waiting[user]={user:user,name:name||user,color:color||'',jump:false,hide:false,votes:0,at:this.order.length};this.order.push(user);return true;};
Arena.prototype.leave=function(user){if(!this.waiting[user])return false;delete this.waiting[user];this.order.splice(this.order.indexOf(user),1);var i=this.squad.indexOf(user);if(i>=0&&this.phase==='lobby')this.squad.splice(i,1);return true;};
Arena.prototype.fOf=function(user){for(var i=0;i<this.f.length;i++)if(this.f[i].u===user)return this.f[i];return null;};
Arena.prototype.jump=function(user,name,color){this.join(user,name,color);var w=this.waiting[user];w.jump=true;w.hide=false;var f=this.fOf(user);if(f){f.jump=1;f.hide=0;}return true;};
/* Kukoro !stop: a candidate takes back their !jump */
Arena.prototype.cancel=function(user){var w=this.waiting[user];if(!w||!w.jump)return false;w.jump=false;var f=this.fOf(user);if(f)f.jump=0;return true;};
Arena.prototype.hide=function(user){var w=this.waiting[user];if(!w)return false;w.hide=true;w.jump=false;var f=this.fOf(user);if(f){f.hide=1;f.jump=0;}var i=this.squad.indexOf(user);if(i>=0&&this.phase==='lobby')this.squad.splice(i,1);return true;};
Arena.prototype.vote=function(from,arg){var a=norm(arg).replace(/^@/,'');if(!a)return false;var self=this,hit=null;this.order.forEach(function(u){var w=self.waiting[u];if(norm(w.name)===a||u===a)hit=w;});if(!hit)return false;if(this.voted[from]===hit.user)return false;var prev=this.voted[from]&&this.waiting[this.voted[from]];if(prev){prev.votes=Math.max(0,prev.votes-1);var pf=this.fOf(prev.user);if(pf)pf.votes=prev.votes;}this.voted[from]=hit.user;hit.votes++;var hf=this.fOf(hit.user);if(hf)hf.votes=hit.votes;return true;};
/* the waiting list in the order the streamer sees it: jumpers first, then most votes, then who joined first; hidden ones last */
Arena.prototype.queue=function(){var s=this;return this.order.filter(function(u){return s.squad.indexOf(u)<0}).sort(function(a,b){var A=s.waiting[a],B=s.waiting[b];return (A.hide-B.hide)||(B.jump-A.jump)||(B.votes-A.votes)||(A.at-B.at);});};
Arena.prototype.inRaid=function(){return this.phase==='pick'||this.phase==='duel'||this.phase==='break';};
Arena.prototype.pick=function(user){if(!this.waiting[user]||this.squad.indexOf(user)>=0||this.squad.length>=this.cfg.squadMax)return false;
  if(this.inRaid()){/* a reinforcement joins the party mid-raid at the next free place */this.squad.push(user);this.addF(user,this.squad.length-1);this.relayout();return true;}
  this.squad.push(user);return true;};
Arena.prototype.unpick=function(user){var i=this.squad.indexOf(user);if(i<0||this.inRaid())return false;this.squad.splice(i,1);return true;};
Arena.prototype.addJumpers=function(){var s=this,n=0;this.queue().forEach(function(u){if(s.waiting[u].jump&&s.pick(u))n++;});return n;};
Arena.prototype.addRandom=function(k){var s=this,pool=this.queue().filter(function(u){return !s.waiting[u].hide}),n=0;k=k||1;
  for(var i=pool.length-1;i>0;i--){var j=Math.floor(this.r()*(i+1));var t=pool[i];pool[i]=pool[j];pool[j]=t;}
  pool.forEach(function(u){if(n<k&&s.pick(u))n++;});return n;};
Arena.prototype.autoFill=function(){if(!this.squad.length){this.addJumpers();if(this.squad.length<this.cfg.squadMax)this.addRandom(this.cfg.squadMax-this.squad.length);}return this.squad.length;};
/* a viewer's class: their own pick (!صنف) or one from their name */
Arena.prototype.setClass=function(user,word){var k=BTR.classFromWord(word);if(!k)return false;var f=this.fOf(user);if(f&&this.inRaid())return false;this.cls[user]=k;return true;};
Arena.prototype.sheetOf=function(u){var lv=lvlOf(this.xp[u]);return BTR.sheet(u,lv,{cls:this.cls[u],gear:this.gear[u]});};
Arena.prototype.applySheet=function(f){var S=this.sheetOf(f.u),ratio=f.max?f.hp/f.max:1;f.lv=lvlOf(this.xp[f.u]);f.cls=S.cls;f.atkT=S.atkT;f.atk=S.atk;f.def=S.def;f.agi=S.agi;f.crit=S.crit;f.spd=S.spd;f.res=S.res;f.perks=S.perks;f.gear=S.gear;f.thorns=S.thorns;
  var mx=Math.round(S.hp*(1+(f.lv-10)*.01));f.max=mx;f.hp=f.alive===0?0:Math.max(1,Math.round(mx*ratio));};
Arena.prototype.addF=function(u,i){var w=this.waiting[u]||{name:u};
  var f={id:++this.idN,u:u,name:w.name,color:w.color||'',slot:i,nx:0,ny:0,hp:1,max:0,lv:10,pw:POWERS.indexOf(powerOf(u)),kills:0,alive:1,st:'idle',jump:w.jump?1:0,hide:w.hide?1:0,votes:w.votes||0,focus:'',pwUsed:0,shield:0,
    fam:'',dot:null,stun:0,slowed:0,noDodge:0,weak:1,hard:0,saves:0,buffNext:0,wins:0};
  this.applySheet(f);f.hp=f.max;this.f.push(f);return f;};
Arena.prototype.relayout=function(){var n=this.f.length;this.f.forEach(function(f){var p=partySlot(f.slot,n);f.hx=p[0];f.hy=p[1];if(f.st==='idle'||f.st==='dead'){f.nx=p[0];f.ny=p[1];}});
  var ms=this.m;ms.forEach(function(m){var p=enemySlot(m.slot,ms.length,m.boss);m.hx=p[0];m.hy=p[1];if(m.st==='idle'){m.nx=p[0];m.ny=p[1];}});};
Arena.prototype.start=function(){if(this.inRaid())return false;if(!this.autoFill())return false;var s=this,keep=this.squad.slice();this.reset();this.squad=keep;this.startLv=this.level();
  this.squad.forEach(function(u,i){s.addF(u,i);});this.relayout();this.phase='break';this.nextAt=this.t+1.2;this.emit({k:'start'});return true;};
Arena.prototype.bossKind=function(){if(this.cfg.boss&&this.cfg.boss!=='auto'&&BOSSTAT[this.cfg.boss])return this.cfg.boss;var L=MAPBOSS[this.cfg.map]||MAPBOSS.plains;return L[(this.level()-1+this.bossN)%L.length];};
Arena.prototype.isBossWave=function(w){return this.cfg.waves>0?w===this.cfg.waves:(w%5===0);};
/* Mohammad #20: the same difficulty should feel the same with 3 players or 16. Measured in Node (120 raids per point, 5 waves, auto fight):
   before this, «عادي» won 3% of raids with 3 players, 27% with 4, 80% with 6 and 100% with 16. These multipliers (enemy HP ×k, damage ×√k)
   were fitted so «عادي» wins ≈65% at every party size; the other levels keep their gap. */
var PARTYK=[[1,.5],[2,.58],[3,.58],[4,.8],[5,.97],[6,1.03],[8,1.03],[10,1],[12,1.1],[16,1.17],[24,1.3]];
function partyK(n){n=Math.max(1,n||1);for(var i=1;i<PARTYK.length;i++){var a=PARTYK[i-1],b=PARTYK[i];if(n<=b[0])return a[1]+(b[1]-a[1])*(n-a[0])/(b[0]-a[0]);}return PARTYK[PARTYK.length-1][1];}
var DIFFK={hard:[[1,1],[3,1],[4,1.04],[6,.98],[8,.96],[10,.92],[12,.9],[16,.88],[24,.85]],hell:[[1,.96],[3,.96],[4,.97],[6,.83],[8,.845],[10,.84],[12,.8],[16,.73],[24,.68]]};
function lerpT(T,n){n=Math.max(1,n||1);for(var i=1;i<T.length;i++){var a=T[i-1],b=T[i];if(n<=b[0])return a[1]+(b[1]-a[1])*(n-a[0])/(b[0]-a[0]);}return T[T.length-1][1];}
function partyKD(n,diff){var k=partyK(n);if(DIFFK[diff])k*=lerpT(DIFFK[diff],n);return k;}
api.partyK=partyKD;
Arena.prototype.spawnMob=function(kind,boss,slot){var st=boss?BOSSTAT[kind]:MOBSTAT[kind];if(!st)return null;var d=DIFF[this.cfg.diff]||1,L=this.level(),w=this.wave,n=this.f.length,pk=this.cfg.partyScale===false?1:partyKD(n,this.cfg.diff);
  var hp=boss?st.hp*.2*(1+n*.32)*(1+(L-1)*.045)*d:st.hp*1.9*(1+(L-1)*.045+(w-1)*.06)*d;
  var dmg=boss?(9+st.dmg*.75)*(1+(L-1)*.03)*d:(6+st.dmg*.8)*(1+(L-1)*.03+(w-1)*.04)*d;hp*=pk;dmg*=Math.sqrt(pk);
  var m={id:++this.idN,k:boss?'boss:'+kind:kind,kind:kind,boss:boss?1:0,slot:slot||0,nx:0,ny:0,hp:Math.round(hp),max:Math.round(hp),dmg:Math.round(dmg*10)/10,agi:st.agi,lv:9+L+w+(boss?5:0),scale:st.scale||1,st:'idle',frozen:0,
    fam:st.fam,atkT:st.atk,atk2:st.atk2||'',def:st.def||0,crit:st.crit||0,res:st.res,trait:st.trait||'',p2:st.p2||'',phase2:0,turns:0,dot:null,stun:0,anger:0,splitUsed:0,healed:0,totemUsed:0,killedMate:0};
  this.m.push(m);if(boss)this.emit({k:'boss',kind:kind});return m;};
Arena.prototype.startWave=function(){this.wave++;var kinds=MAPMOBS[this.cfg.map]||MAPMOBS.plains,n=this.alive().length||1,s=this;this.m=[];this.roomKills={};this.roomGold=0;
  var boss=this.isBossWave(this.wave);this.event='';
  if(boss){this.spawnMob(this.bossKind(),true,0);this.bossN++;}
  else{var count=Math.max(2,Math.min(7,Math.round(1.4+this.wave*.6+n*.2)));var used={};
    for(var i=0;i<count;i++){var k,tries=0;do{k=kinds[Math.floor(this.r()*kinds.length)];tries++;}while((used[k]||0)>=2&&tries<20);used[k]=(used[k]||0)+1;this.spawnMob(k,false,i);if(k==='piglin')this.roomGold++;}
    /* Kukoro's rule: a mid-boss in the middle room when the party has 8+ */
    if(n>=8&&this.cfg.waves>=5&&this.wave===Math.ceil(this.cfg.waves/2)){var mb=this.m[this.m.length-1];mb.hp=mb.max=Math.round(mb.max*2.4);mb.scale=1.4;mb.mid=1;mb.dmg*=1.4;mb.lv+=3;}
    if(this.cfg.events&&this.wave>1&&this.r()<.35)this.event=BTR.EVENTK[Math.floor(this.r()*BTR.EVENTK.length)];}
  this.rooms[this.wave-1]=this.event;
  if(this.event==='spring')this.alive().forEach(function(x){x.hp=Math.min(x.max,x.hp+Math.round(x.max*.25));});
  this.relayout();this.toPick(); /* Nov 4: the power keeps charging across waves (no free refill) */this.card={w:this.wave,boss:boss?1:0,e:this.event,at:this.t};this.emit({k:'wave',w:this.wave,boss:boss?1:0,n:this.m.length,e:this.event});};
/* the wave screen (name + what is coming) stays until the streamer / a mod skips it, or after cfg.cardSecs when that is set */
Arena.prototype.skipCard=function(){if(!this.card)return false;this.card=null;if(this.phase==='pick')this.toPick();return true;};
Arena.prototype.toPick=function(){this.phase='pick';this.duel=null;this.pickAt=this.cfg.autoFight?this.t+(this.cfg.pickSecs||1.6):0;
  /* the next enemy walks to the middle as soon as the turn starts, so the streamer sees who is coming before choosing a fighter (Mohammad, Nov 4) */
  var nm=this.frontEnemy(null);this.m.forEach(function(m){if(m.st==='ready'&&m!==nm){m.st='back';m.nx=m.hx;m.ny=m.hy;m.backT=0;}});
  if(nm&&nm.hp>0){nm.st='ready';nm.nx=DUELM[0]+(nm.boss?.03:0);nm.ny=DUELM[1];}};
Arena.prototype.alive=function(){return this.f.filter(function(f){return f.alive});};
/* who "التالي" sends: !قفز first, then most votes, then the healthiest; never someone who typed !اختبي unless nobody else is left */
Arena.prototype.nextFighter=function(){var c=this.alive().slice().sort(function(a,b){return (a.hide-b.hide)||(b.jump-a.jump)||(b.votes-a.votes)||((b.hp/b.max)-(a.hp/a.max))||(a.slot-b.slot);});return c.length?c[0].u:null;};
Arena.prototype.frontEnemy=function(f){var ms=this.m.filter(function(m){return m.hp>0});if(!ms.length)return null;
  if(f&&f.focus==='boss'){var b=ms.find(function(m){return m.boss});if(b)return b;}
  if(f&&f.focus&&f.focus!=='boss'){var k=ms.find(function(m){return m.kind===f.focus});if(k)return k;}
  return ms.slice().sort(function(a,b){return a.slot-b.slot;})[0];};
function hasPerk(f,t,fam){return (f.perks||[]).some(function(p){return p.t===t&&p.f===fam});}
function perkV(f,t,fam){var v=0;(f.perks||[]).forEach(function(p){if(p.t===t&&p.f===fam)v=BTR.perkVal(p);});return v;}
/* the streamer sends ONE fighter into the middle: a 1v1 duel with the front enemy */
Arena.prototype.send=function(user){if(this.phase!=='pick'||this.paused)return false;this.card=null;user=user||this.nextFighter();var f=this.fOf(user);if(!f||!f.alive)return false;var m=this.frontEnemy(f);if(!m)return false;
  this.m.forEach(function(o){if(o!==m&&o.st==='ready'){o.st='back';o.nx=o.hx;o.ny=o.hy;o.backT=0;}});f.st='out';f.nx=DUELF[0];f.ny=DUELF[1];m.st='out';m.nx=DUELM[0]+(m.boss?.03:0);m.ny=DUELM[1];f.pwAuto=0; /* Nov 4: no refill at duel start — the heart fills slowly over the fighter's turns */f.shield=0;m.frozen=0;f.dot=null;f.stun=0;f.slowed=0;f.noDodge=0;f.weak=1;f.buffNext=0;
  var w=this.waiting[user];if(w){w.jump=false;w.votes=0;}f.jump=0;f.votes=0;var s=this;Object.keys(this.voted).forEach(function(k){if(s.voted[k]===user)delete s.voted[k];});
  var first;if(hasPerk(f,'first',m.fam))first='f';else if(m.trait==='swoop')first='m';else first=this.r()<(.55+(f.agi-m.agi)+(f.spd-5)*.02)?'f':'m';
  this.duel={f:f.id,m:m.id,turn:first,next:this.t+WALK,hits:0,end:0};this.phase='duel';this.emit({k:'send',fid:f.id,mid:m.id,name:f.name,c:f.color,u:f.u});
  if(this.event==='hot'){var hn=Math.round(5*(f.res.fire!=null?f.res.fire:1));if(hn>0){f.hp=Math.max(1,f.hp-hn);this.emit({k:'hit',a:'m',from:m.id,to:f.id,n:hn,how:'fire',env:1});}}
  return true;};
Arena.prototype.byId=function(id){for(var i=0;i<this.f.length;i++)if(this.f[i].id===id)return this.f[i];for(var j=0;j<this.m.length;j++)if(this.m[j].id===id)return this.m[j];return null;};
function regenRest(s){if(s.duel)s.f.forEach(function(x){if(x.alive&&x.id!==s.duel.f&&x.hp<x.max)x.hp=Math.min(x.max,x.hp+Math.max(1,Math.round(x.max*.005)));});}
/* one blow with every multiplier (types, perks, gear, events) — opt: {mult, type, how, noDodge, ignoreDef} */
Arena.prototype.strike=function(att,def,mult,how,opt){opt=opt||{};var s=this,isF=!!att.u;
  if(!isF&&def.shield>0&&!opt.noDodge){def.shield--;this.emit({k:'hit',a:'m',from:att.id,to:def.id,n:0,block:1});return null;}
  var type=opt.type||(how&&POWT[how])||att.atkT||'melee';
  var A=isF?{u:att.u,atk:att.atk*(att.weak||1)*(att.strength||1),atkT:att.atkT,crit:att.crit,perks:att.perks,gear:att.gear,hpNow:att.hp,buffNext:att.buffNext,fam:''}
           :{dmg:att.dmg*(1+att.anger*.1)*(att.phase2&&(att.p2==='rage'||att.p2==='crystal')?(att.p2==='rage'?1.4:1.2):1),atkT:att.atkT,crit:att.crit,fam:att.fam};
  var D=isF?{agi:def.agi*(def.frozen?0:1),def:def.def,res:def.res,fam:def.fam,trait:def.trait,phase2:def.phase2?def.p2:''}
           :{agi:def.agi,def:def.def,hard:def.hard,res:def.res,perks:def.perks,slowed:def.slowed,noDodge:def.noDodge,fam:''};
  var dodgeOk=!(how==='bolt'||how==='tnt'||how==='fire'||opt.noDodge);if(!dodgeOk)D.agi=0;
  if(isF&&def.fam==='')D.fam='';
  var r=BTR.hit(A,D,{r:this.r,type:type,mult:mult||1,ignoreDef:opt.ignoreDef,event:this.event,avenged:isF&&def.killedMate});
  if(isF&&att.buffNext)att.buffNext=0;if(!isF&&def.noDodge)def.noDodge=0;
  if(r.dodge){this.emit({k:'hit',a:isF?'f':'m',from:att.id,to:def.id,n:0,dodge:1,how:how||''});
    if(!isF){var cv=perkV(def,'counter',att.fam);if(cv)def.buffNext=cv;}return r;}
  /* !isF: Kukoro lastStand / totem on a deadly hit */
  def.hp=Math.max(0,def.hp-r.n);
  this.emit({k:'hit',a:isF?'f':'m',from:att.id,to:def.id,n:r.n,c:r.crit?1:0,how:how||type,eff:r.eff});
  if(isF&&def.trait==='anger')def.anger=Math.min(6,def.anger+1);
  if(isF&&r.n>0&&type==='melee'&&(def.trait==='thorns')){var tn=Math.max(1,Math.round(r.n*.2));att.hp=Math.max(1,att.hp-tn);this.emit({k:'hit',a:'m',from:def.id,to:att.id,n:tn,how:'thorns'});}
  if(!isF&&r.n>0&&def.thorns&&att.atkT==='melee'){var tn2=Math.max(1,Math.round(r.n*def.thorns));att.hp=Math.max(0,att.hp-tn2);this.emit({k:'hit',a:'f',from:def.id,to:att.id,n:tn2,how:'thorns'});}
  regenRest(this);return r;};
/* damage over time / statuses */
function applyDot(s,to,k,d){var t=k==='burn'?'fire':k==='poison'?'poison':'magic';var rm=to.res&&to.res[t]!=null?to.res[t]:1;if(rm===0){s.emit({k:'immune',to:to.id,how:k});return;}to.dot={k:k,n:3,d:Math.max(1,Math.round(d*rm))};s.emit({k:'status',to:to.id,st:k});}
function tickDot(s,x){if(!x.dot||x.hp<=0)return;x.hp=Math.max(0,x.hp-x.dot.d);s.emit({k:'hit',a:x.u?'m':'f',from:x.id,to:x.id,n:x.dot.d,how:x.dot.k,dot:1});if(--x.dot.n<=0)x.dot=null;}
Arena.prototype.firePower=function(f){var d=this.duel;if(!d||d.f!==f.id||f.pwUsed||d.end)return false;var m=this.byId(d.m);if(!m)return false;var p=POWERS[f.pw],pow=1+(f.lv-10)*.06;f.pwUsed=1;f.pwc=0;
  this.emit({k:'power',p:p,fid:f.id,mid:m.id,name:f.name,c:f.color,u:f.u});
  if(p==='bolt')this.strike(f,m,2.3*pow,'bolt');else if(p==='fire'){this.strike(f,m,2*pow,'fire');if(m.hp>0)applyDot(this,m,'burn',4+f.lv*.3);}else if(p==='tnt'){this.strike(f,m,2.7*pow,'tnt');f.hp=Math.max(1,f.hp-Math.round(f.max*.08));}
  else if(p==='arrows'){for(var i=0;i<3;i++)this.strike(f,m,.75*pow,'arrows');}else if(p==='shield')f.shield=2;else if(p==='heal'){f.hp=Math.min(f.max,f.hp+Math.round(f.max*.4));f.dot=null;}else if(p==='freeze')m.frozen=2;
  this.checkEnd();return true;};
Arena.prototype.power=function(user){var f=this.fOf(user);if(!f||!f.alive||this.phase!=='duel')return false;return this.firePower(f);};
var MOB_WORDS=null;function mobWords(){if(MOB_WORDS)return MOB_WORDS;MOB_WORDS=[];Object.keys(MOBSTAT).forEach(function(k){MOB_WORDS.push([k,k]);MOB_WORDS.push([norm(MOBSTAT[k].ar),k]);MOB_WORDS.push([norm(MOBSTAT[k].en),k]);});
  [['هيكل','skeleton'],['عنكبوت','spider'],['خنزير','piglin'],['اندرمان','enderman'],['زومبي','zombie'],['كريبر','creeper'],['سلايم','slime'],['ساحره','witch'],['بليز','blaze']].forEach(function(x){MOB_WORDS.push([norm(x[0]),x[1]]);});return MOB_WORDS;}
function mobFromWord(a){if(!a)return '';var hit='';mobWords().forEach(function(x){if(!hit&&(a===x[0]||(x[0].length>2&&a.indexOf(x[0])===0)))hit=x[1];});return hit;}
function bossFromWord(a){var hit='';Object.keys(BOSSTAT).forEach(function(k){if(!hit&&(a===k||a===norm(BOSSTAT[k].ar)||a===norm(BOSSTAT[k].en)))hit=k;});return hit;}
Arena.prototype.focus=function(user,arg){var f=this.fOf(user);if(!f||!f.alive)return false;var a=norm(arg);
  if(/^(زعيم|boss|b)$/.test(a)){f.focus='boss';return true;}var k=mobFromWord(a);
  if(!k){var self=this;this.m.forEach(function(m){if(!k&&norm(BTR.MOBS[m.kind]?BTR.MOBS[m.kind].ar:'').indexOf(a)===0)k=m.kind;});}
  f.focus=k||'';return true;};
Arena.prototype.checkEnd=function(){var d=this.duel;if(!d||d.end)return;var f=this.byId(d.f),m=this.byId(d.m);if(!f||!m)return;var s=this;
  /* second lives: slime / magma split, the Evoker Lord's totem; the fighter's totem and Kukoro's "survive a deadly hit" perk */
  if(m.hp<=0&&m.trait==='split'&&!m.splitUsed){m.splitUsed=1;m.hp=Math.round(m.max*.5);this.emit({k:'split',to:m.id});}
  if(m.hp<=0&&m.phase2&&m.p2==='totem'&&!m.totemUsed){m.totemUsed=1;m.hp=Math.round(m.max*.3);this.emit({k:'totem',to:m.id});}
  if(f.hp<=0){var ls=perkV(f,'laststand',m.fam);if(ls&&f.saves<ls){f.saves++;f.hp=1;this.emit({k:'save',to:f.id,why:'perk'});}
    else{var ti=f.gear.items.indexOf('totem');if(ti>=0){this.useItem(f,'totem');f.hp=Math.round(f.max*.3);f.dot=null;this.emit({k:'totem',to:f.id});}}}
  if(m.boss&&!m.phase2&&m.hp>0&&m.hp<=m.max*.5){m.phase2=1;if(m.p2==='crystal')m.hp=Math.min(m.max,m.hp+Math.round(m.max*.15));this.emit({k:'phase',to:m.id,p:m.p2,kind:m.kind});}
  if(m.hp<=0||f.hp<=0){d.end=this.t+ENDT;d.win=m.hp<=0?'f':'m';
    if(d.win==='f'){f.kills++;f.wins++;var xp=Math.round((m.boss?60:15)*(this.event==='blood'?1.5:1));this.xp[f.u]=(this.xp[f.u]||0)+xp;this.roomKills[f.u]=(this.roomKills[f.u]||0)+1;
      var fv=perkV(f,'feast',m.fam);if(fv)f.hp=Math.min(f.max,f.hp+Math.round(f.max*fv));var hv=perkV(f,'harden',m.fam);if(hv)f.hard=Math.min(.3,f.hard+hv);
      this.emit({k:'kill',fid:f.id,mid:m.id,mk:m.kind,boss:m.boss,by:f.name,bc:f.color,bu:f.u,xp:xp});this.feed.push({by:f.name,bc:f.color,mk:m.kind,boss:m.boss,t:this.t});}
    else{f.alive=0;m.killedMate=1;this.emit({k:'die',fid:f.id,mid:m.id,name:f.name,c:f.color,src:m.kind});this.feed.push({dead:f.name,dc:f.color,mk:m.kind,t:this.t});}
    if(this.feed.length>8)this.feed.shift();}};
Arena.prototype.useItem=function(f,it){var i=f.gear.items.indexOf(it);if(i<0)return false;f.gear.items.splice(i,1);var g=this.gear[f.u]||(this.gear[f.u]={a:f.gear.a,ae:f.gear.ae,w:f.gear.w,we:f.gear.we,items:[]});g.items=f.gear.items.slice();this.emit({k:'item',to:f.id,it:it});return true;};
/* loot after a cleared room: weapon / armour tier, an enchant or an item for one fighter (more kills in the room = better odds) */
var LOOT_AE=['fireprot','blastprot','projprot','antidote','magicprot','thorns'],LOOT_WE=['smite','bane','sharp','fireasp','knock','looting','ender','raid'],LOOT_IT=['heal','heal','strength','totem','apple','fireres'];
Arena.prototype.rollLoot=function(f,boss){var g=this.gear[f.u]||{a:f.gear.a,ae:f.gear.ae,w:f.gear.w,we:f.gear.we,items:f.gear.items.slice()};var r=this.r(),it;
  if(r<.3&&g.w<5){g.w++;it={t:'w',v:g.w};}else if(r<.52&&g.a<5){g.a++;it={t:'a',v:g.a};}
  else if(r<.67){var ae=LOOT_AE[Math.floor(this.r()*LOOT_AE.length)];g.ae=ae;it={t:'ae',v:ae};}
  else if(r<.82){var we=LOOT_WE[Math.floor(this.r()*LOOT_WE.length)];g.we=we;it={t:'we',v:we};}
  else{var ii=boss&&this.r()<.5?'totem':LOOT_IT[Math.floor(this.r()*LOOT_IT.length)];if(g.items.length>=3)g.items.shift();g.items.push(ii);it={t:'i',v:ii};}
  this.gear[f.u]=g;this.applySheet(f);return it;};
Arena.prototype.dropLoot=function(boss){if(!this.cfg.loot)return;var al=this.alive();if(!al.length)return;var n=(boss?2:1)*(this.event==='treasure'?2:1)+(this.roomGold?1:0),s=this;
  for(var i=0;i<n;i++){var tot=0;al.forEach(function(x){tot+=1+(s.roomKills[x.u]||0)*2+(x.gear.we==='looting'?2:0);});var pick=this.r()*tot,f=al[0];
    for(var j=0;j<al.length;j++){pick-=1+(this.roomKills[al[j].u]||0)*2+(al[j].gear.we==='looting'?2:0);if(pick<=0){f=al[j];break;}}
    var it=this.rollLoot(f,boss);this.emit({k:'loot',fid:f.id,u:f.u,name:f.name,c:f.color,it:it,cls:f.cls});}};
Arena.prototype.endDuel=function(){var d=this.duel,f=this.byId(d.f),m=this.byId(d.m);
  if(d.win==='f'){this.m=this.m.filter(function(x){return x!==m});f.st='back';f.nx=f.hx;f.ny=f.hy;}else{f.st='dead';f.nx=f.hx;f.ny=f.hy;m.st='back';m.nx=m.hx;m.ny=m.hy;}
  f.dot=null;f.stun=0;this.duel=null;
  if(!this.alive().length){this.phase='lost';this.levels[this.cfg.map]=Math.max(1,this.level()-1);this.result='lost';this.emit({k:'lost'});return;}
  if(!this.m.length){var wasBoss=this.isBossWave(this.wave);this.dropLoot(wasBoss);
    if(this.cfg.waves>0&&this.wave>=this.cfg.waves){this.phase='won';this.levels[this.cfg.map]=this.level()+1;this.result='won';var s2=this;this.alive().forEach(function(x){s2.xp[x.u]=(s2.xp[x.u]||0)+40;});this.emit({k:'won'});}
    else{this.phase='break';this.nextAt=this.cfg.breakSecs>0?this.t+this.cfg.breakSecs:0;this.alive().forEach(function(x){x.hp=Math.min(x.max,x.hp+Math.round(x.max*.3));});this.emit({k:'cleared',w:this.wave});}return;}
  this.toPick();};
Arena.prototype.summonBoss=function(){if(!this.inRaid()||this.phase==='duel')return false;if(this.m.some(function(m){return m.boss}))return false;
  var target=this.cfg.waves>0?this.cfg.waves:Math.ceil((this.wave+1)/5)*5;this.wave=target-1;this.startWave();return true;};
/* Mohammad #13: at the end of a level — «إعادة المرحلة» replays the same level, «المستوى التالي» goes one level up (after a win) */
Arena.prototype.again=function(next){if(this.phase!=='won'&&this.phase!=='lost')return false;var lv=this.startLv||this.level();if(next&&this.phase!=='won')return false;
  this.levels[this.cfg.map]=Math.max(1,next?lv+1:lv);this.phase='lobby';return this.start();};
Arena.prototype.next=function(){if(this.phase==='won')return this.again(true);if(this.phase==='lost')return this.again(false);if(this.card)return this.skipCard();if(this.phase==='break'){this.nextAt=this.t;return true;}if(this.phase==='pick')return this.send(this.nextFighter());return false;};
/* the fighter's turn */
Arena.prototype.fTurn=function(f,m){/* Mohammad #12: after use the power recharges over N of the fighter's turns, then is ready again */
  if(f.pwUsed){f.pwc=(f.pwc||0)+1;if(f.pwc>=(+this.cfg.pwTurns||3)){f.pwUsed=0;f.pwc=0;this.emit({k:'pwready',fid:f.id,u:f.u});}}
  if(f.dot){tickDot(this,f);this.checkEnd();if(this.duel.end)return;}
  if(f.hp<f.max*.35&&f.gear.items.indexOf('heal')>=0){this.useItem(f,'heal');f.hp=Math.min(f.max,f.hp+Math.round(f.max*.4));}
  if(f.stun>0){f.stun--;this.emit({k:'stun',to:f.id});return;}
  f.strength=m.boss&&f.gear.items.indexOf('strength')>=0&&this.useItem(f,'strength')?1.3:(f.strength||1);
  var r=this.strike(f,m,1);
  if(r&&!r.dodge&&r.n>0&&m.hp>0){if(f.atkT==='poison')applyDot(this,m,'poison',2+f.atk*.25);if(f.gear.we==='fireasp')applyDot(this,m,'burn',2+f.atk*.2);if(f.gear.we==='knock'&&this.r()<.15){m.stun=1;}}
  if(this.cfg.autoPower&&!f.pwUsed&&!f.pwAuto&&!this.duel.end&&(f.hp<f.max*.4||this.duel.hits>=5)&&f.u.indexOf('demo_')!==0){f.pwAuto=1;this.firePower(f);}};
/* the enemy's turn: traits and boss phases */
Arena.prototype.mTurn=function(m,f){if(m.dot){tickDot(this,m);this.checkEnd();if(this.duel.end)return;}
  if(m.frozen>0){m.frozen--;this.emit({k:'frozen',to:m.id});return;}if(m.stun>0){m.stun--;this.emit({k:'stun',to:m.id});return;}
  m.turns++;var tr=m.trait,p2=m.phase2?m.p2:'',s=this;
  if(tr==='potion'&&!m.healed&&m.hp<m.max*.5){m.healed=1;m.hp=Math.min(m.max,m.hp+Math.round(m.max*.35));this.emit({k:'mheal',to:m.id});return;}
  if(tr==='explode'&&m.turns>=3){this.strike(m,f,2.5,'',{type:'blast'});m.hp=0;this.emit({k:'boom',to:m.id});return;}
  var opt={},mult=1;
  if(tr==='fangs')opt.ignoreDef=true;
  if(tr==='sonic'&&m.turns%3===0){opt={type:'magic',noDodge:true,ignoreDef:true};mult=1.6;this.emit({k:'special',to:m.id,sp:'sonic'});}
  if(p2==='charge'&&m.turns%3===0){mult*=2;this.emit({k:'special',to:m.id,sp:'charge'});}
  var type=m.atk2&&m.turns%2===0?m.atk2:m.atkT;if(!opt.type)opt.type=type;
  var r=this.strike(m,f,mult,'',opt),hitOk=r&&!r.dodge&&r.n>0;
  if(hitOk){if(tr==='poison')applyDot(this,f,'poison',2+m.dmg*.3);if(tr==='burn')applyDot(this,f,'burn',2+m.dmg*.3);if(tr==='wither')applyDot(this,f,'wither',2+m.dmg*.3);
    if(tr==='knock'&&this.r()<.25)f.stun=1;if(tr==='slow'||tr==='web')f.slowed=1;if(tr==='hunger')f.weak=Math.max(.7,f.weak*.9);if(tr==='levitate')f.noDodge=1;
    if(tr==='lifesteal')m.hp=Math.min(m.max,m.hp+Math.round(r.n*.3));}
  if(tr==='roar'&&m.turns%3===0){f.stun=1;this.emit({k:'special',to:m.id,sp:'roar'});}
  if(p2==='fatigue'&&!f.fatigued){f.fatigued=1;f.weak=Math.max(.6,f.weak*.75);}
  /* Mohammad #19: a second hit never lands on top of the first — it is queued and lands a beat later (the summoned zombie strikes AFTER the king) */
  if((tr==='swarm'||p2==='armour'||p2==='storm'||p2==='summon')&&f.hp>0&&this.duel){var ex={at:this.t+.6,mult:tr==='swarm'?.6:p2==='summon'?.45:.7,type:p2==='armour'?'blast':type,src:p2==='summon'?'minion':tr==='swarm'?'swarm':p2||'second'};
    this.duel.extra=ex;this.duel.next=Math.max(this.duel.next,ex.at+.55);}};
Arena.prototype.step=function(dt){dt=Math.min(dt,.1);if(this.paused)return;this.tickSide(dt);if(!this.inRaid())return;this.t+=dt;var s=this;
  this.f.forEach(function(f){if(f.st==='back'&&Math.abs(f.nx-f.hx)<1e-6)f.backT=(f.backT||0)+dt;if(f.backT>WALK){f.st='idle';f.backT=0;}});
  this.m.forEach(function(m){if(m.st==='back'){m.backT=(m.backT||0)+dt;if(m.backT>WALK){m.st='idle';m.backT=0;}}});
  if(this.phase==='break'){if(this.nextAt&&this.t>=this.nextAt){this.nextAt=0;this.startWave();}return;}
  if(this.phase==='pick'){if(this.card){var cs=+this.cfg.cardSecs>0?+this.cfg.cardSecs:(this.cfg.autoFight?4:0);if(cs>0&&this.t>=this.card.at+cs)this.skipCard();return;}if(this.cfg.autoFight&&this.pickAt&&this.t>=this.pickAt)this.send(this.nextFighter());return;}
  var d=this.duel;if(!d)return;
  if(d.end){if(this.t>=d.end)this.endDuel();return;}
  if(d.extra&&this.t>=d.extra.at){var ex=d.extra;d.extra=null;var fx=this.byId(d.f),mx=this.byId(d.m);if(fx&&mx&&fx.hp>0&&mx.hp>0){this.emit({k:'extra',from:mx.id,to:fx.id,src:ex.src});this.strike(mx,fx,ex.mult,'',{type:ex.type});this.checkEnd();}return;}
  if(this.t<d.next)return;d.next=this.t+TURN;d.hits++;var f=this.byId(d.f),m=this.byId(d.m);if(!f||!m){this.duel=null;this.toPick();return;}
  if(d.hits===1){f.st='duel';m.st='duel';}
  if(d.turn==='f'){this.fTurn(f,m);d.turn='m';}else{this.mTurn(m,f);d.turn='f';}
  this.checkEnd();};
/* ---------- !معلومات / !getinfo cards (shown on stream, one at a time) and "candidates can speak" ---------- */
Arena.prototype.tickSide=function(dt){this.ct=(this.ct||0)+dt;if(this.info&&this.ct>=this.info.until)this.info=null;if(!this.info&&this.infoQ.length){var c=this.infoQ.shift();c.until=this.ct+(this.cfg.infoSecs||7);this.info=c;}
  var s=this;Object.keys(this.says).forEach(function(u){if(s.ct>=s.says[u].until)delete s.says[u];});};
Arena.prototype.cardFor=function(u){var w=this.waiting[u],f=this.fOf(u);if(!w&&!f)return null;var S=f||this.sheetOf(u),lv=lvlOf(this.xp[u]),xp=this.xp[u]||0;
  return {t:'p',u:u,name:(f||w).name,c:(f||w).color||'',lv:lv,xp:xp%120,xpN:lv>=20?0:120,cls:S.cls,atkT:S.atkT,hp:f?f.hp:S.hp,max:f?f.max:S.hp,atk:Math.round(S.atk),def:Math.round(((S.def||0)+(f?f.hard:0))*100),agi:Math.round(S.agi*100),crit:Math.round(S.crit*100),spd:S.spd,
    res:S.res,perks:S.perks,gear:{a:S.gear.a,ae:S.gear.ae,w:S.gear.w,we:S.gear.we,items:S.gear.items.slice()},pw:f?f.pw:POWERS.indexOf(powerOf(u)),pwUsed:f?f.pwUsed:0,kills:f?f.kills:0,alive:f?f.alive:1,inSquad:f?1:this.squad.indexOf(u)>=0?1:0,id:f?f.id:0};};
Arena.prototype.mobCard=function(m,kind,boss){var S=boss?BOSSTAT[kind]:MOBSTAT[kind];if(!S)return null;
  var d0=DIFF[this.cfg.diff]||1,L0=this.level(),bhp=Math.round(boss?S.hp*.2*(1+Math.max(1,this.f.length||this.squad.length)*.32)*(1+(L0-1)*.045)*d0:S.hp*1.9*(1+(L0-1)*.045)*d0);
  return {t:'m',kind:kind,boss:boss?1:0,id:m?m.id:0,lv:m?m.lv:9+L0+(boss?5:0),hp:m?m.hp:bhp,max:m?m.max:bhp,dmg:m?Math.round(m.dmg):Math.round(boss?(9+S.dmg*.75)*d0:(6+S.dmg*.8)*d0),def:Math.round(S.def*100),agi:Math.round(S.agi*100),crit:Math.round(S.crit*100),fam:S.fam,atkT:S.atk,atk2:S.atk2||'',res:S.res,trait:S.trait||'',p2:S.p2||'',phase2:m?m.phase2:0};};
/* !getinfo [name]: the asker, a candidate / fighter by name, or an enemy (in this room, else from the bestiary) */
Arena.prototype.closeInfo=function(){if(!this.info)return false;this.info=null;return true;};
Arena.prototype.askInfo=function(user,arg,name,color){var a=norm(arg).replace(/^@/,''),c=null,self=this;
  if(a){var tu=null;this.order.forEach(function(u){var w=self.waiting[u];if(!tu&&(norm(w.name)===a||u===a))tu=u;});if(tu)c=this.cardFor(tu);
    if(!c){var bk=/^(زعيم|boss)$/.test(a)?(this.m.find(function(m){return m.boss})||{}).kind||'':bossFromWord(a);if(bk){var bm=this.m.find(function(m){return m.boss&&m.kind===bk});c=this.mobCard(bm,bk,true);}}
    if(!c){var mk=mobFromWord(a);if(mk){var mm=this.m.find(function(m){return m.kind===mk&&!m.boss});c=this.mobCard(mm,mk,false);}}}
  else{this.join(user,name,color);c=this.cardFor(user);}
  if(!c)return false;var key=c.t+(c.u||c.kind);if(this.info&&this.info.key===key)return false;if(this.infoQ.some(function(q){return q.key===key}))return false;if(this.infoQ.length>=6)return false;
  c.key=key;c.by=user;this.infoQ.push(c);if(!this.info)this.tickSide(0);return true;};
Arena.prototype.enemyInfo=function(id){var m=this.byId(id);if(!m||m.u)return false;this.info=null;var c=this.mobCard(m,m.kind,m.boss);c.key='m'+m.id;this.infoQ.unshift(c);this.tickSide(0);return true;};
Arena.prototype.say=function(user,text){if(!this.cfg.speak||!this.waiting[user])return false;var t=String(text||'').replace(/\s+/g,' ').trim();if(!t||t.charAt(0)==='!')return false;if(t.length>40)t=t.slice(0,39)+'…';this.says[user]={txt:t,until:(this.ct||0)+4};return true;};
Arena.prototype.pub=function(){var s=this,r3=function(v){return Math.round(v*1000)/1000},d=this.duel;
  return {ph:this.phase,w:this.wave,ws:this.cfg.waves,map:this.cfg.map,lv:this.level(),pa:this.paused?1:0,af:this.cfg.autoFight?1:0,ev2:this.event,rooms:this.rooms.slice(),
  f:this.f.map(function(f){return [f.id,f.u,f.name,f.color,r3(f.nx),r3(f.ny),f.hp,f.max,f.lv,f.pw,f.alive,f.kills,f.st,f.jump,f.votes,f.hide,f.pwUsed,f.shield,f.cls,f.atkT,f.gear.a,f.gear.w,f.dot?f.dot.k:'',f.stun,f.gear.ae,f.gear.we,f.pwUsed?Math.max(1,(+s.cfg.pwTurns||3)-(f.pwc||0)):0,(+s.cfg.pwTurns||3)];}),
  m:this.m.map(function(m){return [m.id,m.k,r3(m.nx),r3(m.ny),m.hp,m.max,m.lv,m.boss,m.scale,m.mid?1:0,m.st,m.frozen,m.fam,m.phase2,m.trait,m.dot?m.dot.k:''];}),
  d:d?[d.f,d.m,d.end?1:0]:null,wc:this.card&&this.phase==='pick'?[this.card.w,this.card.boss,this.card.e,(+this.cfg.cardSecs>0||this.cfg.autoFight)?Math.max(0,Math.ceil(this.card.at+(+this.cfg.cardSecs>0?+this.cfg.cardSecs:4)-this.t)):-1]:null,ev:this.ev.slice(-40),feed:this.feed.slice(-6),gi:this.info,say:Object.keys(this.says).map(function(u){return [u,s.says[u].txt];}),
  q:this.queue().slice(0,60).map(function(u){var w=s.waiting[u];return [u,w.name,w.color,w.jump?1:0,w.hide?1:0,w.votes];}),sq:this.squad.map(function(u){var w=s.waiting[u]||{name:u};return [u,w.name,w.color||'',lvlOf(s.xp[u]),POWERS.indexOf(powerOf(u)),BTR.classOf(u,s.cls[u])];}),nq:this.order.length};};
api.partySlot=partySlot;api.enemySlot=enemySlot;api.DUELF=DUELF;api.DUELM=DUELM;api.Arena=Arena;api.POWERS=POWERS;api.MOBSTAT=MOBSTAT;api.BOSSTAT=BOSSTAT;api.MAPMOBS=MAPMOBS;api.MAPBOSS=MAPBOSS;api.powerOf=powerOf;api.lvlOf=lvlOf;api.BTR=BTR;api.mobFromWord=mobFromWord;

/* ---------- اهرب من الـTNT: Kukoro "Blade" — the MOST CROWDED side blows up when the fuse runs out ---------- */
var ZW={0:['l','left','يسار','شمال','ي س'],1:['r','right','يمين'],2:['m','mid','middle','نص','وسط']};
var ZMAP={};Object.keys(ZW).forEach(function(z){ZW[z].forEach(function(w){ZMAP[norm(w)]=+z;});});
/* "!يمين" → 1, "!l" → 0, "!نص" → 2 (only when there are 3 zones) */
function zoneCmd(text,zones){var n=norm(text);if(n.charAt(0)!=='!')return -1;var w=n.slice(1).trim().split(' ')[0];var z=ZMAP[w];if(z==null)return -1;if(z===2&&zones<3)return -1;return z;}
function Tnt(opt){opt=opt||{};this.seed=opt.seed||((Date.now()%1e9)|0);this.r=rng(this.seed);this.cfg={zones:2,secs:25,jitter:true,speed:.9,minSecs:8,boomSecs:2.6,autoNext:true};if(opt.cfg)for(var k in opt.cfg)this.cfg[k]=opt.cfg[k];this.wins={};this.reset();}
Tnt.prototype.reset=function(){this.players={};this.order=[];this.phase='lobby';this.round=0;this.winners=[];this.last=null;this.t=0;this.end=0;this.nextAt=0;this.len=0;this.paused=false;this.ev=[];this.evId=this.evId||0; /* event ids never restart: a view that saw id 120 last game ignored every new event below 120 → no damage numbers, no sounds (Mohammad #14) */this.info=null;this.infoQ=[];};
Tnt.prototype.emit=function(e){e.id=++this.evId;this.ev.push(e);if(this.ev.length>30)this.ev.shift();return e;};
Tnt.prototype.join=function(user,name,color){if(!user)return false;var p=this.players[user];if(p){p.name=name||p.name;if(color)p.color=color;return false;}if(this.phase!=='lobby')return false;
  this.players[user]={user:user,name:name||user,color:color||'',zone:strHashT(user)%this.cfg.zones,alive:true,out:0,moved:0};this.order.push(user);return true;};
function strHashT(s){s=String(s||'');var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
Tnt.prototype.leave=function(user){var p=this.players[user];if(!p)return false;if(this.phase==='lobby'){delete this.players[user];this.order.splice(this.order.indexOf(user),1);}else{p.alive=false;p.out=p.out||this.round;}return true;};
Tnt.prototype.alive=function(){var s=this;return this.order.filter(function(u){return s.players[u].alive});};
Tnt.prototype.move=function(user,zone,name,color){if(zone<0||zone>=this.cfg.zones)return false;var p=this.players[user];if(!p){if(this.phase!=='lobby')return false;this.join(user,name,color);p=this.players[user];}
  if(!p.alive||(this.phase!=='lobby'&&this.phase!=='fuse'))return false;if(p.zone===zone)return false;p.zone=zone;p.moved=this.t;return true;};
Tnt.prototype.counts=function(){var c=[];for(var z=0;z<this.cfg.zones;z++)c.push(0);var s=this;this.alive().forEach(function(u){c[s.players[u].zone]++;});return c;};
/* which side blows right now: the most crowded; a tie is settled by this round's own coin (same answer all round long) */
Tnt.prototype.target=function(){var c=this.counts(),mx=Math.max.apply(null,c),tied=[];c.forEach(function(v,i){if(v===mx)tied.push(i);});if(tied.length===1)return tied[0];var r=rng(this.seed+this.round*131)();return tied[Math.floor(r*tied.length)];};
Tnt.prototype.roundLen=function(){var b=this.cfg.secs;if(!(b>0))return 0;var f=Math.pow(this.cfg.speed||1,Math.max(0,this.round-1));var s=Math.max(Math.min(b,this.cfg.minSecs),b*f);if(this.cfg.jitter)s+=(this.r()-.5)*10*Math.min(1,s/20);return Math.max(3,Math.round(s*10)/10);};
Tnt.prototype.start=function(){if(this.phase!=='lobby'&&this.phase!=='end')return false;if(this.order.length<1)return false;var s=this;
  if(this.phase==='end')this.order.forEach(function(u){var p=s.players[u];p.alive=true;p.out=0;});this.winners=[];this.round=0;this.last=null;this.emit({k:'start'});return this.nextRound();};
Tnt.prototype.nextRound=function(){if(this.phase==='end')return false;this.round++;this.phase='fuse';this.len=this.roundLen();this.end=this.len>0?this.t+this.len:0;this.emit({k:'round',r:this.round});return true;};
Tnt.prototype.blast=function(){if(this.phase!=='fuse')return null;var z=this.target(),s=this,al=this.alive(),vic=al.filter(function(u){return s.players[u].zone===z;});
  var all=vic.length===al.length;vic.forEach(function(u){var p=s.players[u];if(!all){p.alive=false;p.out=s.round;}});
  this.last={zone:z,victims:vic.slice(),round:this.round,all:all};this.phase='boom';this.end=0;this.nextAt=this.t+this.cfg.boomSecs;this.emit({k:'boom',zone:z,n:vic.length,all:all?1:0});
  if(all){this.winners=vic.slice();this.finish();}else if(this.alive().length<=1){this.winners=this.alive();this.finish();}
  return this.last;};
Tnt.prototype.finish=function(){var s=this;this.phase='end';this.nextAt=0;this.winners.forEach(function(u){s.wins[u]=(s.wins[u]||0)+1;});this.emit({k:'end',n:this.winners.length});};
/* everyone in the order they went out: winners first, then the last ones to blow up */
Tnt.prototype.ranking=function(){var s=this;return this.order.slice().sort(function(a,b){var A=s.players[a],B=s.players[b];var ra=s.winners.indexOf(a)>=0?1e6:A.out,rb=s.winners.indexOf(b)>=0?1e6:B.out;return rb-ra;});};
Tnt.prototype.step=function(dt){if(this.paused)return;dt=Math.min(dt,.25);this.t+=dt;this.ct=(this.ct||0)+dt;if(this.info&&this.ct>=this.info.until)this.info=null;if(!this.info&&this.infoQ.length){var c=this.infoQ.shift();c.until=this.ct+6;this.info=c;}
  if(this.phase==='fuse'&&this.end&&this.t>=this.end)this.blast();else if(this.phase==='boom'&&this.nextAt&&this.t>=this.nextAt&&this.cfg.autoNext){this.nextAt=0;this.nextRound();}};
Tnt.prototype.next=function(){if(this.phase==='fuse')return !!this.blast();if(this.phase==='boom'){this.nextAt=0;return this.nextRound();}return false;};
Tnt.prototype.askInfo=function(user){var p=this.players[user];if(!p)return false;if((this.info&&this.info.u===user)||this.infoQ.some(function(q){return q.u===user}))return false;if(this.infoQ.length>=5)return false;
  this.infoQ.push({u:user,name:p.name,c:p.color,alive:p.alive?1:0,out:p.out,round:this.round,zone:p.zone,wins:this.wins[user]||0});if(!this.info)this.step(0);return true;};
Tnt.prototype.pub=function(){var s=this;return {ph:this.phase,r:this.round,z:this.cfg.zones,len:this.len,left:this.end?Math.max(0,Math.round((this.end-this.t)*10)/10):0,pa:this.paused?1:0,
  p:this.order.map(function(u){var p=s.players[u];return [u,p.name,p.color,p.zone,p.alive?1:0,p.out];}),tg:this.phase==='fuse'?this.target():-1,c:this.counts(),last:this.last,win:this.winners.slice(),ev:this.ev.slice(-12),gi:this.info};};
api.Tnt=Tnt;api.zoneCmd=zoneCmd;

/* ---------- المحارب / The Perfect Warrior (Kukoro "Perfect Warrior", watched in a real stream, Nov 2026):
   a square arena; the reigning warrior (champion) stands in it with a kill counter; challengers wait on the stands (FIFO) and
   come in one at a time for an automatic TURN-BASED duel (speed decides who strikes first, dodge, crit, damage numbers).
   The winner stays (keeps his HP, +1 kill), the loser goes back to the end of the queue at full HP. Infinite.
   Each viewer finds "the perfect combination": one letter A–Z per stat (attack, defence, speed, life) with `!stats ABCD`;
   what a letter is worth depends on the username and the month (same on every stream, new every month). `!heal` between
   duels heals the champion. Ours adds: the streamer can start as the first champion, mobs can challenge when the queue is empty. */
var HSTATS=['at','df','sp','hp'];
function monthKey(d){d=d||new Date();return d.getUTCFullYear()+'-'+(d.getUTCMonth()+1);}
function heroVal(user,si,letter,month){return 20+strHashH(String(user||'').toLowerCase()+'|'+si+'|'+String(letter||'A').toUpperCase()+'|'+month)%81;}
function strHashH(s){s=String(s||'');var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function heroLetters(user){var h=strHashH('L|'+String(user||'').toLowerCase()),s='';for(var i=0;i<4;i++){s+=String.fromCharCode(65+(h%26));h=Math.floor(h/26)+i*7919;}return s;}
function heroParse(arg){var a=String(arg||'').toUpperCase().replace(/[^A-Z]/g,'');return a.length===4?a:'';}
var HBOTS=['zombie','skeleton','husk','spider','creeper','piglin','wskel','enderman'];
function Hero(opt){opt=opt||{};this.seed=opt.seed||((Date.now()%1e9)|0);this.r=rng(this.seed);
  this.cfg={turn:.7,brk:4,respawn:true,heal:.5,bots:false,streamer:'',boss:1,month:''};if(opt.cfg)for(var k in opt.cfg)this.cfg[k]=opt.cfg[k];this.reset();}
Hero.prototype.reset=function(){this.players={};this.queue=[];this.champ=null;this.foe=null;this.phase='lobby';this.t=0;this.nextAt=0;this.duel=null;this.ev=[];this.evId=this.evId||0; /* event ids never restart: a view that saw id 120 last game ignored every new event below 120 → no damage numbers, no sounds (Mohammad #14) */this.info=null;this.infoQ=[];this.rec=null;this.round=0;this.paused=false;this.botN=0;this.atk=null;};
Hero.prototype.emit=Tnt.prototype.emit;
Hero.prototype.month=function(){return this.cfg.month||monthKey();};
Hero.prototype.stats=function(p){var m=this.month(),s={};HSTATS.forEach(function(k,i){s[k]=p.fixed?p.fixed[i]:heroVal(p.user,i,p.letters.charAt(i),m);});return s;};
Hero.prototype.derive=function(p){var s=this.stats(p),boss=(this.cfg.streamer&&p.user===this.cfg.streamer)?Math.max(1,+this.cfg.boss||1):1;
  p.st=s;p.max=Math.round((60+s.hp*1.4)*boss);p.atk=8+s.at*.22;p.def=s.df*.1;p.dodge=Math.min(.3,s.sp*.0028);p.crit=.06+s.sp*.0012;if(p.hp==null||p.hp>p.max)p.hp=p.max;return p;};
Hero.prototype.join=function(user,name,color,bot){if(!user)return false;var p=this.players[user];if(p){p.name=name||p.name;if(color)p.color=color;return false;}
  p=this.players[user]={user:user,name:name||user,color:color||'',letters:heroLetters(user),kills:0,best:0,wins:0,state:'queue',bot:bot||'',hp:null,healed:false};this.derive(p);p.hp=p.max;this.queue.push(user);return true;};
Hero.prototype.inDuel=function(u){return (u===this.champ||u===this.foe)&&(this.phase==='intro'||this.phase==='duel');};
Hero.prototype.leave=function(user){var p=this.players[user];if(!p)return false;var qi=this.queue.indexOf(user);if(qi>=0)this.queue.splice(qi,1);
  if(this.inDuel(user)){var other=this.players[user===this.champ?this.foe:this.champ];if(other){this.finish(other,p,true);}}
  if(this.champ===user){this.champ=null;}if(this.foe===user)this.foe=null;delete this.players[user];return true;};
Hero.prototype.setStats=function(user,arg){var p=this.players[user];var L=heroParse(arg);if(!p||!L||p.bot)return false;if(this.inDuel(user))return false;var ratio=p.max?p.hp/p.max:1;p.letters=L;this.derive(p);p.hp=Math.max(1,Math.round(p.max*ratio));if(p.state==='queue')p.hp=p.max;this.emit({k:'stats',u:user,l:L});return true;};
Hero.prototype.heal=function(user){var p=this.players[user];if(!p||p.bot||this.inDuel(user)||p.healed||p.hp>=p.max)return false;var add=Math.round(p.max*(+this.cfg.heal||.5));p.hp=Math.min(p.max,p.hp+add);p.healed=true;this.emit({k:'heal',u:user,v:add});return true;};
Hero.prototype.spawnBot=function(){var kind=HBOTS[this.botN%HBOTS.length];this.botN++;var u='mob#'+this.botN;var lv=Math.min(60,this.round*2);
  this.players[u]={user:u,name:kind,color:'',letters:'AAAA',kills:0,best:0,wins:0,state:'queue',bot:kind,hp:null,fixed:[30+this.r()*40+lv,25+this.r()*35+lv,25+this.r()*40,30+this.r()*40+lv].map(Math.round)};this.derive(this.players[u]);this.players[u].hp=this.players[u].max;return u;};
Hero.prototype.start=function(){if(this.phase!=='lobby'&&this.phase!=='end')return false;var n=this.queue.length+(this.champ?1:0);if(n<2&&!(n>=1&&this.cfg.bots))return false;
  var su=this.cfg.streamer,qi=su?this.queue.indexOf(su):-1;if(qi>=0){this.queue.splice(qi,1);this.champ=su;this.players[su].state='champ';}
  this.phase='after';this.nextAt=this.t+.8;this.emit({k:'start'});return true;};
Hero.prototype.nextDuel=function(){var s=this;if(!this.champ||!this.players[this.champ]){this.champ=null;var c=this.queue.shift();if(c){this.champ=c;this.players[c].state='champ';}}
  var f=this.queue.shift();if(!f&&this.cfg.bots&&this.champ)f=this.spawnBot();
  if(!this.champ||!f){if(f)this.queue.unshift(f);this.phase='wait';this.nextAt=0;return false;}
  this.foe=f;this.players[f].state='fight';Object.keys(this.players).forEach(function(u){s.players[u].healed=s.players[u].healed&&u===s.champ;});
  this.round++;this.phase='intro';this.nextAt=this.t+1.8;this.atk=null;this.emit({k:'intro',a:this.champ,b:f,r:this.round});return true;};
Hero.prototype.blow=function(){var a=this.players[this.atk],b=this.players[this.atk===this.champ?this.foe:this.champ];if(!a||!b)return;var r=this.r;
  if(r()<b.dodge){this.emit({k:'hit',a:a.user,b:b.user,dodge:1});}
  else{var crit=r()<a.crit;var d=Math.max(1,Math.round(a.atk*(.8+r()*.4)*(crit?1.6:1)-(crit?0:b.def)));b.hp=Math.max(0,b.hp-d);this.emit({k:'hit',a:a.user,b:b.user,d:d,crit:crit?1:0});
    if(b.hp<=0){this.finish(a,b);return;}}
  this.atk=b.user;this.nextAt=this.t+(+this.cfg.turn||.7);};
Hero.prototype.finish=function(w,l,forfeit){var newChamp=w.user!==this.champ;w.state='champ';w.kills=newChamp?1:w.kills+1;w.best=Math.max(w.best,w.kills);w.wins++;w.healed=false;
  if(!this.rec||w.kills>this.rec.k)this.rec={u:w.user,n:w.name,c:w.color,k:w.kills};
  this.champ=w.user;this.foe=null;this.atk=null;var lb=l.bot;l.kills=0;
  if(lb){delete this.players[l.user];}else if(this.cfg.respawn&&this.players[l.user]){l.state='queue';l.hp=l.max;this.queue.push(l.user);}else if(this.players[l.user]){l.state='out';}
  this.emit({k:'ko',w:w.user,l:l.user,lbot:lb||'',ln:l.name,k2:w.kills,nc:newChamp?1:0,ff:forfeit?1:0});
  this.phase='after';this.nextAt=this.cfg.brk>0?this.t+(+this.cfg.brk):0;};
Hero.prototype.next=function(){if(this.phase==='lobby'||this.phase==='end')return this.start();if(this.phase==='intro'){this.nextAt=this.t;return true;}
  if(this.phase==='duel'){var g=0;while(this.phase==='duel'&&g++<400)this.blow();return true;}if(this.phase==='after'||this.phase==='wait')return this.nextDuel();return false;};
Hero.prototype.stop=function(){if(this.phase==='lobby'||this.phase==='end')return false;if(this.phase==='intro'||this.phase==='duel'){var f=this.players[this.foe];if(f){f.state='queue';this.queue.unshift(f.user);if(f.bot)delete this.players[f.user];}this.foe=null;}
  this.phase='end';this.nextAt=0;this.emit({k:'end',w:this.champ});return true;};
Hero.prototype.step=function(dt){if(this.info&&this.t>=this.info.until){this.info=null;}if(!this.info&&this.infoQ.length){var q=this.infoQ.shift();q.until=this.t+6.5;this.info=q;}
  if(this.paused)return;this.t+=dt;
  if(this.phase==='wait'){if(this.queue.length||(this.cfg.bots&&this.champ))this.nextDuel();return;}
  if(!this.nextAt||this.t<this.nextAt)return;
  if(this.phase==='intro'){var a=this.players[this.champ],b=this.players[this.foe];if(!a||!b){this.phase='after';this.nextAt=this.t+.5;return;}
    this.phase='duel';this.atk=(a.st.sp>b.st.sp||(a.st.sp===b.st.sp&&this.r()<.5))?a.user:b.user;this.nextAt=this.t+.6;this.emit({k:'fight',first:this.atk});return;}
  if(this.phase==='duel'){this.blow();return;}
  if(this.phase==='after'){this.nextDuel();return;}};
Hero.prototype.card=function(u){var p=this.players[u];if(!p)return null;var qi=this.queue.indexOf(u);return {u:u,name:p.name,c:p.color,bot:p.bot||'',l:p.letters,st:p.st,max:p.max,hp:p.hp,kills:p.kills,best:p.best,wins:p.wins,state:p.state,pos:qi>=0?qi+1:0,dodge:Math.round(p.dodge*100),crit:Math.round(p.crit*100)};};
Hero.prototype.askInfo=function(user,target){var s=this,u=user;if(target){var t=String(target).toLowerCase().replace(/^@/,'');var hit=Object.keys(this.players).filter(function(k){return k.toLowerCase()===t||String(s.players[k].name).toLowerCase()===t;});if(hit.length)u=hit[0];}
  if(!this.players[u])return false;if((this.info&&this.info.u===u)||this.infoQ.some(function(q){return q.u===u}))return false;if(this.infoQ.length>=5)return false;this.infoQ.push(this.card(u));if(!this.info)this.step(0);return true;};
Hero.prototype.pub=function(){var s=this,ids=[];if(this.champ)ids.push(this.champ);if(this.foe)ids.push(this.foe);this.queue.slice(0,48).forEach(function(u){ids.push(u);});
  return {ph:this.phase,pa:this.paused?1:0,r:this.round,ch:this.champ,fo:this.foe,at:this.atk,qn:this.queue.length,
    p:ids.map(function(u){var p=s.players[u];return [u,p.name,p.color,Math.round(p.hp),p.max,p.kills,p.state,p.letters,p.bot||''];}),
    rec:this.rec?[this.rec.u,this.rec.n,this.rec.c,this.rec.k]:null,left:this.nextAt?Math.max(0,Math.round((this.nextAt-this.t)*10)/10):0,ev:this.ev.slice(-14),gi:this.info};};
api.Hero=Hero;api.heroVal=heroVal;api.heroLetters=heroLetters;api.heroParse=heroParse;api.monthKey=monthKey;

/* ---------- الكهف / Cave Raid: the old Block Brawl cave mode, rebuilt (party.js → its own page). Rounds against the cave boss:
   dodge (the boss swings a giant blade at one side: !يسار / !يمين), counters (he summons mobs: pick the right gear !1 sword vs
   zombies, !2 bow vs skeletons, !3 shield vs creepers, !4 water bucket vs endermen — a rumour tells you one that is NOT coming),
   chests (3 chests, one is TNT: !1 !2 !3), and the final (he swings until one is left). Players who do nothing keep their spot /
   a default from their name. Nobody is ever wiped out by one move: if everyone would fall, the boss misses. ---------- */
var CKINDS=['dodge','counters','chests'],CGEAR=['sword','bow','shield','bucket'],CMOB=['zombie','skeleton','creeper','enderman'];
function Cave(opt){opt=opt||{};this.seed=opt.seed||((Date.now()%1e9)|0);this.r=rng(this.seed);this.cfg={secs:15,rounds:0,finalAt:3,showSecs:3.4,autoNext:true};if(opt.cfg)for(var k in opt.cfg)this.cfg[k]=opt.cfg[k];this.wins={};this.reset();}
Cave.prototype.reset=function(){this.players={};this.order=[];this.phase='lobby';this.round=0;this.kind='';this.t=0;this.end=0;this.len=0;this.nextAt=0;this.paused=false;this.winners=[];this.last=null;this.ev=[];this.evId=this.evId||0; /* event ids never restart: a view that saw id 120 last game ignored every new event below 120 → no damage numbers, no sounds (Mohammad #14) */this.info=null;this.infoQ=[];this.rumor=-1;this.secret=null;};
Cave.prototype.emit=Tnt.prototype.emit;
Cave.prototype.def=function(u,kind){var h=strHashT(u+'#'+kind+'#'+this.round);return kind==='dodge'||kind==='final'?h%2:kind==='chests'?h%3:h%4;};
Cave.prototype.join=function(user,name,color){if(!user)return false;var p=this.players[user];if(p){p.name=name||p.name;if(color)p.color=color;return false;}if(this.phase!=='lobby')return false;
  this.players[user]={user:user,name:name||user,color:color||'',alive:true,out:0,pick:-1,side:strHashT(user)%2};this.order.push(user);return true;};
Cave.prototype.leave=function(user){var p=this.players[user];if(!p)return false;if(this.phase==='lobby'){delete this.players[user];this.order.splice(this.order.indexOf(user),1);}else{p.alive=false;p.out=p.out||this.round;}return true;};
Cave.prototype.alive=function(){var s=this;return this.order.filter(function(u){return s.players[u].alive});};
Cave.prototype.kindOf=function(r){var al=this.alive().length;if(al<=this.cfg.finalAt||(this.cfg.rounds>0&&r>=this.cfg.rounds))return 'final';return CKINDS[(r-1)%CKINDS.length];};
Cave.prototype.start=function(){if(this.phase!=='lobby'&&this.phase!=='end')return false;if(this.order.length<2)return false;var s=this;this.order.forEach(function(u){var p=s.players[u];p.alive=true;p.out=0;});this.winners=[];this.round=0;this.emit({k:'start'});this.nextRound();return true;};
Cave.prototype.nextRound=function(){var s=this;this.round++;this.kind=this.kindOf(this.round);this.alive().forEach(function(u){var p=s.players[u];p.pick=(s.kind==='dodge'||s.kind==='final')?p.side:-1;});
  this.secret=this.kind==='counters'?(function(){var a=[0,1,2,3],out=[];for(var i=0;i<2;i++){out.push(a.splice(Math.floor(s.r()*a.length),1)[0]);}return out;})():this.kind==='chests'?Math.floor(this.r()*3):(this.kind==='dodge'||this.kind==='final')?Math.floor(this.r()*2):null;
  this.rumor=-1;if(this.kind==='counters'){var no=[0,1,2,3].filter(function(i){return s.secret.indexOf(i)<0});this.rumor=no[Math.floor(this.r()*no.length)];}
  var b=+this.cfg.secs;this.len=b>0?Math.max(5,b-(this.kind==='final'?Math.min(5,this.round):0)):0;this.end=this.len?this.t+this.len:0;this.phase='pick';this.nextAt=0;this.emit({k:'round',r:this.round,kind:this.kind,rumor:this.rumor});};
Cave.prototype.choose=function(user,v){var p=this.players[user];if(!p||!p.alive||this.phase!=='pick')return false;var k=this.kind,n=(k==='dodge'||k==='final')?2:k==='chests'?3:4;if(!(v>=0&&v<n))return false;
  p.pick=v;if(k==='dodge'||k==='final')p.side=v;return true;};
Cave.prototype.resolve=function(){if(this.phase!=='pick')return false;var s=this,k=this.kind,al=this.alive(),hit=[];
  al.forEach(function(u){var p=s.players[u];var v=p.pick>=0?p.pick:s.def(u,k);p.pick=v;
    var dies=(k==='dodge'||k==='final')?v===s.secret:k==='chests'?v===s.secret:s.secret.indexOf(v===0?0:v===1?1:v===2?2:3)<0;
    if(dies)hit.push(u);});
  var missed=false;
  if(k==='final'){ /* the final blade hits the MORE crowded side (Kukoro's blade rule); everyone on one side → it catches half of them */
    var c=[0,0];al.forEach(function(u){c[s.players[u].pick]++;});var side=c[0]===c[1]?this.secret:(c[0]>c[1]?0:1);this.secret=side;
    hit=al.filter(function(u){return s.players[u].pick===side;});
    if(hit.length===al.length){var sh=hit.slice(),keep=[];for(var i=0;i<Math.floor(sh.length/2);i++)keep.push(sh.splice(Math.floor(s.r()*sh.length),1)[0]);if(!keep.length&&sh.length)keep.push(sh.pop());hit=sh;}}
  else if(hit.length===al.length&&al.length>0){missed=true;hit=[];}
  hit.forEach(function(u){var p=s.players[u];p.alive=false;p.out=s.round;});
  this.last={r:this.round,kind:k,secret:this.secret,out:hit.slice(0,60),n:hit.length,missed:missed};this.emit({k:'resolve',r:this.round,kind:k,secret:this.secret,n:hit.length,out:hit.slice(0,60),missed:missed?1:0});
  this.phase='show';this.end=0;this.nextAt=this.t+(+this.cfg.showSecs||3.4);var left=this.alive();
  if(left.length<=1||(this.cfg.rounds>0&&this.round>=this.cfg.rounds&&k==='final'&&false)){this.finish();}return true;};
Cave.prototype.finish=function(){var s=this;this.winners=this.alive();this.winners.forEach(function(u){s.wins[u]=(s.wins[u]||0)+1;});this.phase='end';this.nextAt=0;this.emit({k:'end',w:this.winners.slice()});};
Cave.prototype.next=function(){if(this.phase==='lobby'||this.phase==='end')return this.start();if(this.phase==='pick')return this.resolve();if(this.phase==='show'){this.nextAt=0;this.nextRound();return true;}return false;};
Cave.prototype.step=function(dt){if(this.info&&this.t>=this.info.until)this.info=null;if(!this.info&&this.infoQ.length){var q=this.infoQ.shift();q.until=this.t+6;this.info=q;}
  if(this.paused)return;this.t+=dt;if(this.phase==='pick'&&this.end&&this.t>=this.end)this.resolve();
  else if(this.phase==='show'&&this.nextAt&&this.t>=this.nextAt&&this.cfg.autoNext){this.nextAt=0;this.nextRound();}};
Cave.prototype.askInfo=function(user){var p=this.players[user];if(!p)return false;if((this.info&&this.info.u===user)||this.infoQ.some(function(q){return q.u===user}))return false;if(this.infoQ.length>=5)return false;
  this.infoQ.push({u:user,name:p.name,c:p.color,alive:p.alive?1:0,out:p.out,round:this.round,wins:this.wins[user]||0});if(!this.info)this.step(0);return true;};
Cave.prototype.counts=function(){var k=this.kind,n=(k==='dodge'||k==='final')?2:k==='chests'?3:k==='counters'?4:2,c=[];for(var i=0;i<n;i++)c.push(0);var s=this;this.alive().forEach(function(u){var v=s.players[u].pick;if(v>=0&&v<n)c[v]++;});return c;};
Cave.prototype.pub=function(){var s=this;return {ph:this.phase,r:this.round,kind:this.kind,left:this.end?Math.max(0,Math.round((this.end-this.t)*10)/10):0,len:this.len,pa:this.paused?1:0,rumor:this.rumor,
  sec:this.phase==='show'||this.phase==='end'?this.secret:null,c:this.counts(),
  p:this.order.slice(0,400).map(function(u){var p=s.players[u];return [u,p.name,p.color,p.pick,p.alive?1:0,p.out,p.side];}),last:this.last,win:this.winners.slice(0,30),ev:this.ev.slice(-12),gi:this.info};};
function caveCmd(text,kind){var n=norm(text);if(n.charAt(0)!=='!')return -1;var w=n.slice(1).trim().split(' ')[0];
  if(kind==='dodge'||kind==='final'){if(/^(a|l|left|يسار|شمال|يسار)$/.test(w))return 0;if(/^(d|r|right|يمين)$/.test(w))return 1;return -1;}
  if(kind==='counters'){var g={'1':0,'sword':0,'سيف':0,'2':1,'bow':1,'قوس':1,'3':2,'shield':2,'درع':2,'4':3,'bucket':3,'water':3,'سطل':3,'مي':3,'ماء':3};return g[w]!=null?g[w]:-1;}
  if(kind==='chests'){var c={'1':0,'2':1,'3':2};return c[w]!=null?c[w]:-1;}return -1;}
api.Cave=Cave;api.caveCmd=caveCmd;api.CGEAR=CGEAR;api.CMOB=CMOB;
if(typeof document==='undefined')return;
/* ---------- the LEFT SIDE PANEL (Kukoro's, in Lamma's design): chat commands + how to play + CAM HERE frame + buttons.
   One layout "stack" piece (movable / resizable / hideable, sections hideable); the OBS overlay shows the commands and the cam
   frame only (no buttons, no popups). It is a commands card, not a chat feed. ---------- */
function panel(o){var A=root.App,$=A.$;var gs=o.root;var EN=function(){return A.lang()==='en'};function L(x){return x?(EN()?x[1]:x[0]):''}
  /* the streamer's own panel: texts, command list, colour, opacity, cam frame — saved per channel + page, carried to OBS as &pn= */
  var PKEY='lamma-btp-'+(o.key||'bt')+'-'+A.channel,PD={t1:'',t2:'',sh:'',hw:'',cm:null,ac:'#868CBC',op:94,cs:'r',ca:'f'},PC={};
  function pcLoad(){var v=null;try{if(A.obs){var q=A.Q.get('pn');if(q)v=JSON.parse(decodeURIComponent(escape(atob(q.replace(/-/g,'+').replace(/_/g,'/')))));}else v=JSON.parse(localStorage.getItem(PKEY)||'null');}catch(e){v=null;}
    PC={};Object.keys(PD).forEach(function(k){PC[k]=v&&v[k]!=null?v[k]:PD[k];});PC.cs='r';PC.ca='f';/* the cam frame's shape and size options were removed (Mohammad, Nov 4) */}
  function pcDiff(){var d={};Object.keys(PD).forEach(function(k){if(JSON.stringify(PC[k])!==JSON.stringify(PD[k]))d[k]=PC[k];});return d;}
  function pcSave(){if(A.obs)return;var d=pcDiff();try{if(Object.keys(d).length)localStorage.setItem(PKEY,JSON.stringify(d));else localStorage.removeItem(PKEY);}catch(e){}A.updateObsUrl&&A.updateObsUrl();}
  A.obsExtra&&A.obsExtra(function(){var d=pcDiff();if(!Object.keys(d).length)return '';return '&pn='+btoa(unescape(encodeURIComponent(JSON.stringify(d)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');});
  pcLoad();
  function hex2(h){h=String(h||'#868CBC').replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c}).join('');var n=parseInt(h,16);if(isNaN(n))n=0x868CBC;return [(n>>16)&255,(n>>8)&255,n&255];}
  function pcStyle(){var st=o.stage||gs,c=hex2(PC.ac),op=Math.max(0,Math.min(100,+PC.op))/100;function a(x){return 'rgba('+c[0]+','+c[1]+','+c[2]+','+x+')';}
    var li=c.map(function(v){return Math.round(v+(255-v)*.55)});st.style.setProperty('--pac','rgb('+c.join(',')+')');st.style.setProperty('--pal','rgb('+li.join(',')+')');
    st.style.setProperty('--pa1',a(.16));st.style.setProperty('--pa2',a(.4));st.style.setProperty('--pa3',a(.62));st.style.setProperty('--pb1','rgba(22,22,28,'+op+')');st.style.setProperty('--pb2','rgba(11,11,15,'+op+')');}
  /* the panel lists only the game's REAL commands: the streamer can reorder them, hide one, or reword its short hint — never add or rename (a typed-in command did nothing) */
  function cmdIdx(w){w=String(w||'').trim();for(var i=0;i<o.cmds.length;i++){if(o.cmds[i][0]===w||o.cmds[i][1]===w)return i;}return -1;}
  function cmState(){var out=[],seen={};(PC.cm||[]).forEach(function(c){var i=typeof c[0]==='number'?c[0]:cmdIdx(c[0]);if(i<0||i>=o.cmds.length||seen[i])return;seen[i]=1;var dh=[o.cmds[i][2],o.cmds[i][3]];var hn=c[1]&&dh.indexOf(c[1])<0?c[1]:'';out.push([i,hn,c[2]?1:0]);});
    o.cmds.forEach(function(c,i){if(!seen[i])out.push([i,'',0]);});return out;}
  function cmdsList(){if(!PC.cm)return o.cmds;return cmState().filter(function(s){return !s[2]}).map(function(s){var c=o.cmds[s[0]];return [c[0],c[1],s[1]||c[2],s[1]||c[3]];});}
  var wrap=document.createElement('div');wrap.className='lay-el';wrap.setAttribute('data-lay','panel');var lc=document.createElement('div');lc.className='lay-c';wrap.appendChild(lc);
  var box=document.createElement('div');box.className='btp';lc.appendChild(box);
  function sec(id){var s=document.createElement('section');s.className='btp-sec btp-'+id;s.setAttribute('data-sec',id);box.appendChild(s);return s;}
  var sC=sec('cmds'),sH=sec('how'),sK=sec('cam'),sB=sec('btns');
  gs.appendChild(wrap);
  var modal=null;
  function closeModal(){if(modal){modal.remove();modal=null;}}
  function openModal(title,build){closeModal();if(A.obs)return;modal=document.createElement('div');modal.className='btp-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
    var card=document.createElement('div');card.className='btp-mc';var h=document.createElement('h3');h.textContent=title;card.appendChild(h);var x=document.createElement('button');x.type='button';x.className='btp-x';x.textContent='×';x.setAttribute('aria-label',EN()?'Close':'سكّر');x.addEventListener('click',closeModal);card.appendChild(x);
    build(card);modal.appendChild(card);modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});(o.stage||gs).appendChild(modal);x.focus();}
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeModal();return;}if(A.obs)return;var tg=e.target,tn=tg&&tg.tagName;if(tn==='INPUT'||tn==='TEXTAREA'||tn==='SELECT'||(tg&&tg.isContentEditable)||e.ctrlKey||e.metaKey||e.altKey)return;
    var k=(e.key||'').toLowerCase();if(k===' '&&o.onPause){if(tn==='BUTTON')return;e.preventDefault();o.onPause();setTimeout(sync,30);}else if((k==='n'||k==='ن')&&o.onNext){o.onNext();}else if(k==='f'||k==='ب'){var f=(o.stage||gs).parentNode.querySelector('.lay-fs')||document.querySelector('.lay-fs');if(f)f.click();}});
  function cmdRow(c,ul,one){var li=document.createElement('li');var k=document.createElement('span');k.className='btp-k';var ar=document.createElement('span');ar.className='bt-cmd';ar.textContent=c[0];var en=document.createElement('span');en.className='bt-cmd btp-en';en.textContent=c[1];
    if(one){k.appendChild(EN()?(c[1]?en:ar):(c[0]?ar:en));}else if(EN()){k.appendChild(en);if(c[0]){k.appendChild(document.createTextNode(' '));k.appendChild(ar);}}else{k.appendChild(ar);if(c[1]){k.appendChild(document.createTextNode(' '));k.appendChild(en);}}
    li.appendChild(k);var hn=document.createElement('span');hn.className='btp-h';hn.textContent=EN()?c[3]:c[2];li.appendChild(hn);ul.appendChild(li);}
  function head(sx,ic,ar,en,btn){var h=document.createElement('div');h.className='btp-t';var t=document.createElement('b');t.textContent=ic+' '+(EN()?en:ar);h.appendChild(t);if(btn&&!A.obs){var q=document.createElement('button');q.type='button';q.className='btp-q';q.textContent=btn.t;q.setAttribute('aria-label',btn.a);q.addEventListener('click',btn.f);h.appendChild(q);}sx.appendChild(h);return h;}
  /* fullscreen settings: the page's settings card moves into a small floating box on the stage while fullscreen; back on close / exit */
  var fsBox=null,fsHome=null;
  function fsClose(){if(!fsBox||fsBox.hidden)return;fsBox.hidden=true;var d=document.querySelector('.w2-set');if(d&&fsHome&&d.parentNode===fsBox)fsHome.parentNode.insertBefore(d,fsHome);}
  function fsSet(){var d=document.querySelector('.w2-set'),st=o.stage||gs;if(!d)return;
    if(!fsBox){fsBox=document.createElement('div');fsBox.className='w-fs-set bt-fs-set';fsBox.hidden=true;fsBox.addEventListener('click',function(e){e.stopPropagation();});st.appendChild(fsBox);
      var x=document.createElement('button');x.type='button';x.className='btp-x';x.textContent='×';x.addEventListener('click',fsClose);fsBox.appendChild(x);
      document.addEventListener('fullscreenchange',function(){if(!(document.fullscreenElement||document.webkitFullscreenElement))fsClose();});document.addEventListener('webkitfullscreenchange',function(){if(!(document.fullscreenElement||document.webkitFullscreenElement))fsClose();});}
    if(!fsBox.hidden){fsClose();return;}
    if(!fsHome){fsHome=document.createComment('w2-set');d.parentNode.insertBefore(fsHome,d);}
    fsBox.appendChild(d);d.open=true;fsBox.hidden=false;}
  var pBtn=null;
  function render(){A.clear(sC);A.clear(sH);A.clear(sK);A.clear(sB);
    head(sC,'⌨️',PC.t1||'أوامر الشات',PC.t1||'CHAT COMMANDS',{t:'?',a:EN()?'All commands':'كل الأوامر',f:function(){openModal(EN()?'Chat commands':'أوامر الشات',function(c){var ul=document.createElement('ul');ul.className='btp-list big';(PC.cm?cmdsList():o.cmds).forEach(function(x){cmdRow(x,ul)});c.appendChild(ul);if(o.more&&!PC.cm){var p=document.createElement('p');p.textContent=L(o.more);c.appendChild(p);}});}});
    var ul=document.createElement('ul');ul.className='btp-list';cmdsList().forEach(function(x){cmdRow(x,ul,true)});sC.appendChild(ul);
    head(sH,'🎮',PC.t2||'طريقة اللعب',PC.t2||'HOW TO PLAY');var p=document.createElement('p');p.className='btp-how';p.textContent=PC.sh||L(o.short);sH.appendChild(p);
    if(!A.obs){var row=document.createElement('div');row.className='btp-row';
      var b1=document.createElement('button');b1.type='button';b1.className='btp-b';b1.textContent=EN()?'Read more':'اقرأ المزيد';b1.addEventListener('click',function(){openModal(EN()?'How to play':'طريقة اللعب',function(c){(PC.hw?PC.hw.split(/\n+/).filter(Boolean):(EN()?o.how[1]:o.how[0])).forEach(function(s){var pp=document.createElement('p');pp.textContent=s;c.appendChild(pp);});});});
      var b2=document.createElement('button');b2.type='button';b2.className='btp-b';b2.textContent='🎛 '+(EN()?'CONTROLS':'التحكم');b2.addEventListener('click',function(){openModal(EN()?'Controls (streamer & mods)':'التحكم (الستريمر والمشرفين)',function(c){var u2=document.createElement('ul');u2.className='btp-list big';o.ctrl.forEach(function(x){cmdRow(x,u2)});c.appendChild(u2);});});
      row.appendChild(b1);row.appendChild(b2);sH.appendChild(row);}
    var cw=document.createElement('div');cw.className='btp-camw ar-'+PC.ca;var cam=document.createElement('div');cam.className='btp-cam sh-'+PC.cs;var cl=document.createElement('span');cl.textContent='📷 '+(EN()?'CAM HERE':'مكان الكاميرا');cam.appendChild(cl);cw.appendChild(cam);sK.appendChild(cw);
    if(!A.obs){var br=document.createElement('div');br.className='btp-bar';
      function ib(txt,aria,f,cls){var b=document.createElement('button');b.type='button';b.className='btp-ib'+(cls?' '+cls:'');b.textContent=txt;b.setAttribute('aria-label',aria);b.title=aria;b.addEventListener('click',function(e){e.stopPropagation();f(b);});br.appendChild(b);return b;}
      ib('⚙',EN()?'Settings':'الإعدادات',function(){var fs=document.fullscreenElement||document.webkitFullscreenElement;var d=document.querySelector('.w2-set');if(!d)return;
        if(fs){fsSet();return;} /* Nov 4: in fullscreen ⚙ opens ONLY the settings card over the game (like the wheels) — no leaving fullscreen */
        d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'});});
      ib('⛶',EN()?'Fullscreen':'شاشة كاملة',function(){var f=(o.stage||gs).parentNode.querySelector('.lay-fs')||document.querySelector('.lay-fs');if(f)f.click();});
      pBtn=ib('',EN()?'Pause':'إيقاف مؤقت',function(){o.onPause&&o.onPause();setTimeout(sync,30);},'btp-pause');
      var sb=ib('',EN()?'Sound':'الصوت',function(){var s=$('soundBtn');if(s)s.click();setTimeout(sync,30);},'btp-snd');
      sB.appendChild(br);}
    sync();}
  function sync(){if(pBtn){var pd=o.isPaused&&o.isPaused();pBtn.textContent=pd?('▶ '+(EN()?'RESUME':'استئناف')):(EN()?'⏸ PAUSE':'إيقاف مؤقت');pBtn.classList.toggle('on',!!pd);pBtn.disabled=!!(o.canPause&&!o.canPause());}
    var sb=box.querySelector('.btp-snd'),s=$('soundBtn');if(sb)sb.textContent=s?s.textContent:'🔊';}
  /* "the player can speak" toggle at the bottom of the map (control page only) */
  if(o.speak&&!A.obs){var sp=document.createElement('label');sp.className='btp-speak';var ic=document.createElement('span');var cb=document.createElement('input');cb.type='checkbox';cb.setAttribute('role','switch');cb.checked=!!o.speak.get();
    cb.addEventListener('change',function(){o.speak.set(cb.checked);});sp.appendChild(ic);sp.appendChild(cb);gs.appendChild(sp);
    /* Nov 4 (Mohammad): the chip can be hidden — ✕ on it in «تعديل الشكل», and the setting «زر تحدث اللاعبين على الخريطة» brings it back */
    var SPK='lamma-spchip-'+(A.game||'bt');var spx=document.createElement('button');spx.type='button';spx.className='btp-spx';spx.textContent='✕';spx.title=EN()?'Hide':'إخفاء';
    spx.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();spHide(true);});sp.appendChild(spx);
    function spHide(h){try{localStorage.setItem(SPK,h?'1':'0')}catch(_){}sp.hidden=!!h;var t=document.getElementById('btSpChip');if(t)t.checked=!h;}
    try{sp.hidden=localStorage.getItem(SPK)==='1'}catch(_){}
    setTimeout(function(){var host=document.querySelector('.w2-set .srow.sw')||null;if(!host||document.getElementById('btSpChip'))return;var lb=document.createElement('label');lb.className='srow sw';var s1=document.createElement('span');s1.className='srow-l';s1.textContent=EN()?'“Players can speak” switch on the map':'زر «اللاعب يستطيع التحدث» على الخريطة';var i1=document.createElement('input');i1.type='checkbox';i1.setAttribute('role','switch');i1.id='btSpChip';i1.checked=!sp.hidden;i1.addEventListener('change',function(){spHide(!i1.checked);});lb.appendChild(s1);lb.appendChild(i1);host.parentNode.insertBefore(lb,host);},0);o._sp=function(){ic.textContent='🗨️ '+(EN()?'Players can speak':'اللاعب يستطيع التحدث');cb.checked=!!o.speak.get();};o._sp();}
  /* the streamer's editor (control page): essentials first, texts and the command list under "خيارات زيادة" */
  function editor(){var set=document.querySelector('.w2-set');if(!set||A.obs)return;var xOpen=false;var d=document.createElement('details');d.className='w2-xtra btp-edit';
    var sm=document.createElement('summary');var sms=document.createElement('span');sm.appendChild(sms);d.appendChild(sm);var body=document.createElement('div');d.appendChild(body);set.appendChild(d);
    function row(lbl,el,sw){var l=document.createElement('label');l.className='srow'+(sw?' sw':'');var t=document.createElement('span');t.className='srow-l';t.textContent=lbl;l.appendChild(t);l.appendChild(el);return l;}
    function sel(opts,k){var e=document.createElement('select');e.className='ssel';opts.forEach(function(x){var op=document.createElement('option');op.value=x[0];op.textContent=EN()?x[2]:x[1];e.appendChild(op);});e.value=PC[k];e.addEventListener('change',function(){PC[k]=e.value;changed();});return e;}
    function txt(k,ph,area){var e=document.createElement(area?'textarea':'input');if(!area)e.type='text';else e.rows=4;e.className='btp-tin';e.value=PC[k]||'';e.placeholder=ph;e.maxLength=area?1200:120;e.addEventListener('input',function(){PC[k]=e.value.trim();changed(true);});return e;}
    function changed(soft){pcStyle();pcSave();if(soft){clearTimeout(changed._t);changed._t=setTimeout(render,250);}else render();}
    function build(){A.clear(body);sms.textContent='🧩 '+(EN()?'Side panel (colours, cam, texts)':'لوحة الأوامر (ألوان، كاميرا، نصوص)');
      var g=document.createElement('div');g.className='sgrp';
      var col=document.createElement('input');col.type='color';col.value=PC.ac;col.addEventListener('input',function(){PC.ac=col.value;changed(true);});g.appendChild(row(EN()?'Panel colour':'لون اللوحة',col));
      var rg=document.createElement('input');rg.type='range';rg.min=0;rg.max=100;rg.step=2;rg.value=PC.op;rg.addEventListener('input',function(){PC.op=+rg.value;pcStyle();pcSave();});g.appendChild(row(EN()?'Background opacity':'شفافية الخلفية',rg));
      body.appendChild(g);
      var x=document.createElement('details');x.className='w2-xtra';if(xOpen)x.open=true;x.addEventListener('toggle',function(){xOpen=x.open;});var xs=document.createElement('summary');xs.textContent=EN()?'More options':'خيارات إضافية';x.appendChild(xs);var g2=document.createElement('div');g2.className='sgrp btp-ed';
      g2.appendChild(row(EN()?'Commands title':'عنوان الأوامر',txt('t1',EN()?'CHAT COMMANDS':'أوامر الشات')));
      g2.appendChild(row(EN()?'How-to-play title':'عنوان طريقة اللعب',txt('t2',EN()?'HOW TO PLAY':'طريقة اللعب')));
      g2.appendChild(row(EN()?'Short explanation':'الشرح القصير',txt('sh',L(o.short),true)));
      g2.appendChild(row(EN()?'Full explanation (one paragraph per line)':'الشرح الكامل (كل سطر فقرة)',txt('hw',(EN()?o.how[1]:o.how[0]).join('\n'),true)));
      var lt=document.createElement('div');lt.className='srow-l';lt.textContent=EN()?'Commands in the panel — the short hint shows on stream; the full explanation is for you':'الأوامر في اللوحة — الشرح المختصر يظهر في البث، والشرح الكامل لك هنا';g2.appendChild(lt);
      var list=cmState();
      function setList(nl){PC.cm=nl;changed();xOpen=true;build();d.open=true;}
      list.forEach(function(s,i){var c=o.cmds[s[0]];var r=document.createElement('div');r.className='btp-er'+(s[2]?' off':'');var a=document.createElement('b');a.className='c1';a.dir='auto';a.textContent=EN()?(c[1]||c[0]):(c[0]||c[1]);
        var b=document.createElement('input');b.type='text';b.value=s[1];b.placeholder=EN()?c[3]:c[2];b.maxLength=60;b.setAttribute('aria-label',EN()?'Short hint on stream':'الشرح المختصر في البث');
        function up(){var nl=list.map(function(z){return z.slice()});nl[i][1]=b.value.trim();PC.cm=nl;list=nl;changed(true);}b.addEventListener('input',up);
        function mb(t,lab,f){var bb=document.createElement('button');bb.type='button';bb.className='btn btn-ghost btn-sm';bb.textContent=t;bb.setAttribute('aria-label',lab);bb.title=lab;bb.addEventListener('click',f);return bb;}
        r.appendChild(a);r.appendChild(b);
        r.appendChild(mb('↑',EN()?'Up':'للأعلى',function(){if(!i)return;var nl=list.map(function(z){return z.slice()});var t=nl[i-1];nl[i-1]=nl[i];nl[i]=t;setList(nl);}));
        r.appendChild(mb('↓',EN()?'Down':'للأسفل',function(){if(i>=list.length-1)return;var nl=list.map(function(z){return z.slice()});var t=nl[i+1];nl[i+1]=nl[i];nl[i]=t;setList(nl);}));
        r.appendChild(mb(s[2]?'👁‍🗨':'👁',s[2]?(EN()?'Show on stream':'أظهره في البث'):(EN()?'Hide from stream':'أخفه من البث'),function(){var nl=list.map(function(z){return z.slice()});nl[i][2]=nl[i][2]?0:1;setList(nl);}));
        if(c[4]){var lg=document.createElement('p');lg.className='btp-long';lg.textContent=EN()?(c[5]||c[4]):c[4];r.appendChild(lg);}
        g2.appendChild(r);});
      var br=document.createElement('div');br.className='btn-row';
      var rs=document.createElement('button');rs.type='button';rs.className='btn btn-ghost btn-sm';rs.textContent=EN()?'Reset the panel':'أعد اللوحة إلى الأصل';rs.addEventListener('click',function(){Object.keys(PD).forEach(function(k){PC[k]=PD[k];});changed();build();});
      br.appendChild(rs);g2.appendChild(br);x.appendChild(g2);body.appendChild(x);}
    build();A.onLang&&A.onLang(build);}
  A.onLang&&A.onLang(function(){render();o._sp&&o._sp();});
  pcStyle();render();editor();setInterval(sync,500);
  return {el:wrap,sync:sync,render:render,item:{id:'panel',z:6,code:'p',kind:'box',ar:'لوحة الأوامر',en:'Side panel',def:o.def||{x:.8,y:2,w:20.5,h:96,s:1},minW:10,minH:24,sections:[
    {id:'cmds',code:'c',ar:'أوامر الشات',en:'Chat commands',def:{f:o.fc||6.2}},{id:'how',code:'h',ar:'طريقة اللعب',en:'How to play',def:{f:2.3}},{id:'cam',code:'k',ar:'مكان الكاميرا',en:'Cam here',def:{f:2.6}},{id:'btns',code:'t',ar:'الأزرار',en:'Buttons',def:{f:.95}}]}};}
api.panel=panel;

/* ---------- Minecraft skins (Mohammad #2/#3): a viewer picks their own skin with !سكن <MinecraftName> once they reach the
   streamer's minimum level (Kukoro-style); no skin / not written / level too low → Steve. The control page sends the chosen
   names with every publish so the OBS overlay draws the same skins. ---------- */
var STEVE={skin:'#b98a68',hair:'#3b2416',pants:'#3a37a0',shirt:'#12a3a3',style:0,steve:1};
var SKN={map:null,remote:null,cache:{}};
function chan(){return (typeof window!=='undefined'&&window.App&&window.App.channel)||'';}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function skMap(){if(!SKN.map)SKN.map=lsGet('lamma-skins-'+chan(),{})||{};return SKN.map;}
function xpLevel(u){var s=lsGet('lamma-ba-'+chan(),{})||{};var xp=(s.xp||{})[u];return lvlOf(xp);}
api.skinMinLv=function(v){var k='lamma-skinlv-'+chan();if(v!=null){lsSet(k,+v);return +v;}var x=lsGet(k,12);return x==null?12:+x;};
api.skinLevel=xpLevel;
api.setSkin=function(user,name){name=String(name||'').trim().replace(/^@/,'');var m=skMap();
  if(!name){if(m[user]){delete m[user];lsSet('lamma-skins-'+chan(),m);}return 'cleared';}
  if(!/^[A-Za-z0-9_]{3,16}$/.test(name))return 'bad';if(xpLevel(user)<api.skinMinLv())return 'level';
  m[user]=name;lsSet('lamma-skins-'+chan(),m);return 'ok';};
api.skinMap=function(){var m=skMap(),out={},min=api.skinMinLv(),n=0;Object.keys(m).forEach(function(u){if(n<400&&xpLevel(u)>=min){out[u]=m[u];n++;}});return out;};
function avg(d,x,y,w,h){var r=0,g=0,b=0,n=0;for(var j=y;j<y+h;j++)for(var i=x;i<x+w;i++){var k=(j*64+i)*4;if(d[k+3]<128)continue;r+=d[k];g+=d[k+1];b+=d[k+2];n++;}if(!n)return null;var t=function(v){var s=Math.round(v/n).toString(16);return s.length<2?'0'+s:s;};return '#'+t(r)+t(g)+t(b);}
function loadSkin(name){var c=SKN.cache[name];if(c)return c;c=SKN.cache[name]={look:null,face:null};if(typeof Image==='undefined')return c;
  var img=new Image();img.crossOrigin='anonymous';img.onload=function(){try{var cv=document.createElement('canvas');cv.width=64;cv.height=64;var g=cv.getContext('2d');g.drawImage(img,0,0);var d=g.getImageData(0,0,64,64).data;
    var f=document.createElement('canvas');f.width=8;f.height=8;var fg=f.getContext('2d');fg.imageSmoothingEnabled=false;fg.drawImage(img,8,8,8,8,0,0,8,8);fg.drawImage(img,40,8,8,8,0,0,8,8);
    var legY=img.height===32?20:20;c.look={skin:avg(d,9,13,6,2)||STEVE.skin,hair:avg(d,8,0,8,8)||STEVE.hair,shirt:avg(d,20,20,8,6)||STEVE.shirt,pants:avg(d,4,legY+4,4,8)||STEVE.pants,style:0};c.face=f;}catch(e){c.look=null;}};
  img.onerror=function(){c.look=null;};img.src='https://mc-heads.net/skin/'+encodeURIComponent(name);return c;}
function skinNameOf(u){var m=SKN.remote||api.skinMap();return m[u]||'';}
api.lookOf=function(u,color){var n=skinNameOf(u);if(!n)return STEVE;var c=loadSkin(n);return c.look||STEVE;};
api.skinFace=function(u){var n=skinNameOf(u);if(!n)return null;var c=loadSkin(n);return c.face||null;};
api.STEVE=STEVE;
(function wire(){if(typeof window==='undefined')return;function go(){var A=window.App;if(!A||A._skWired)return;A._skWired=1;
    if(A.strings)A.strings({ar:{bt_c_skin:'اختر سكن ماينكرافت الخاص بك، مثل !سكن Dream. يعمل بعد الوصول إلى المستوى الذي يحدده الستريمر، وإلا تبقى شخصيتك ستيف. !سكن وحدها تعيدك إلى ستيف.'},en:{bt_c_skin:'Use your own Minecraft skin, e.g. !skin Dream. Works once you reach the level the streamer set; until then you are Steve. !skin alone goes back to Steve.'}});
    var pub=A.publish;if(pub)A.publish=function(o){if(o&&typeof o==='object'&&!Array.isArray(o)&&!A.obs){try{o.sk=api.skinMap();}catch(e){}}return pub.apply(A,arguments);};
    if(A.onMirror)A.onMirror(function(s){if(s&&s.sk&&typeof s.sk==='object')SKN.remote=s.sk;});
    if(A.onChat)A.onChat(function(m){if(A.runsEngine&&!A.runsEngine())return;var c=cmd(m.text);if(c&&c.k==='skin'){api.setSkin(m.user,c.arg);}});}
  if(window.App)go();else document.addEventListener('DOMContentLoaded',go);})();
/* the setting row, added to every battle game's «خيارات إضافية» */
api.skinRow=function(host){if(!host||host.querySelector('.bt-skinlv'))return;var lab=document.createElement('label');lab.className='srow bt-skinlv';var sp=document.createElement('span');sp.className='srow-l';
  var en=window.App&&App.lang&&App.lang()==='en';sp.textContent=en?'Minimum level to use your own Minecraft skin (!skin name)':'أقل مستوى لاستخدام سكن ماينكرافت الخاص (!سكن الاسم)';
  var sel=document.createElement('select');sel.className='ssel';[[10,en?'Everyone':'الجميع'],[11,'11'],[12,'12'],[13,'13'],[15,'15'],[18,'18'],[20,'20']].forEach(function(o){var op=document.createElement('option');op.value=o[0];op.textContent=o[1];sel.appendChild(op);});
  sel.value=String(api.skinMinLv());sel.addEventListener('change',function(){api.skinMinLv(+sel.value);window.App&&App.updateObsUrl&&App.updateObsUrl();});lab.appendChild(sp);lab.appendChild(sel);
  var p=document.createElement('p');p.className='small muted';p.textContent=en?'Below that level, or with no skin written, the player is Steve.':'تحت هذا المستوى، أو إن لم يكتب سكنًا، تكون شخصيته ستيف.';
  var g=host.querySelector('.sgrp')||host;g.appendChild(lab);g.appendChild(p);};

/* writing in Twitch chat needs a bot account's OAuth token (chat:edit). None is linked yet, so ready() is false and every game keeps its on-screen card. */
api.bot={token:null,ready:function(){return !!this.token&&typeof this.send==='function';},say:function(t){if(!this.ready()||!t)return false;try{this.send(String(t).slice(0,480));return true;}catch(e){return false;}}};


/* ---------- DOM helpers ---------- */
function $(id){return document.getElementById(id)}
/* one "∞ / ث" timer row: <div class="srow tmr" data-tmr="key"> … .tsb[data-v=0|1] … <input type=number> */
api.tmr=function(row,get,set,def){if(!row)return;var inp=row.querySelector('input'),sb=[].slice.call(row.querySelectorAll('.tsb'));
  function show(){var v=get();if(v>0)inp.value=String(v);else if(!inp.value)inp.value=String(def);inp.hidden=!(v>0);sb.forEach(function(b){var on=(b.getAttribute('data-v')==='1')===(v>0);b.classList.toggle('on',on);b.setAttribute('role','radio');b.setAttribute('aria-checked',String(on));});}
  sb.forEach(function(b){b.addEventListener('click',function(){var want=b.getAttribute('data-v')==='1';if(want===(get()>0))return;set(want?Math.max(1,+inp.value||def):0);show();if(want)inp.focus();});});
  inp.addEventListener('change',function(){if(get()>0){set(Math.max(1,Math.min(3600,Math.round(+inp.value||def))));show();}});
  show();return show;};
api.xtra=function(d,key){if(!d)return;try{api.skinRow(d);}catch(e){}try{d.open=localStorage.getItem(key)==='1';}catch(e){}d.addEventListener('toggle',function(){try{localStorage.setItem(key,d.open?'1':'0');}catch(e){}});};
api.logo=function(host){if(host&&!host.firstChild){var s=document.createElement('span');s.className='s-logo';var b=document.createElement('b');b.textContent='لَمّة';var i=document.createElement('i');i.textContent='LAMMA';s.appendChild(b);s.appendChild(i);host.appendChild(s);}};
api.name=function(name,color,cls){var b=document.createElement('bdi');b.className=cls||'bt-nm';b.textContent=String(name||'');if(color&&window.MC)b.style.color=window.MC.readableColor(color);return b;};
/* a chat command as the site shows it: isolated direction, the "!" in the accent colour */
api.cmdEl=function(c){var b=document.createElement('bdi');b.className='cmd';var ar=/^![\u0600-\u06FF]/.test(c);b.dir=ar?'rtl':'ltr';var s=document.createElement('span');s.className='bang';s.textContent='!';b.appendChild(s);b.appendChild(document.createTextNode(c.replace(/^!/,'')));return b;};
api.ltr=function(nodes){var b=document.createElement('bdi');b.dir='ltr';nodes.forEach(function(n){b.appendChild(typeof n==='string'?document.createTextNode(n):n)});return b;};
/* fill an element from a translated string with \u0001 where the nodes go */
api.fill=function(el,str,nodes){var p=String(str).split('\u0001');el.appendChild(document.createTextNode(p[0]));(nodes||[]).forEach(function(n){el.appendChild(typeof n==='string'?document.createTextNode(n):n);});if(p[1])el.appendChild(document.createTextNode(p[1]));};
api.avatar=function(user){var L=window.LammaAvatars;return L&&L.get?L.get(user):null;};
var IMG={};api.img=function(url){if(!url)return null;if(IMG[url])return IMG[url];var im=new Image();im.crossOrigin='anonymous';im.referrerPolicy='no-referrer';im.src=url;return IMG[url]=im;};
api.store=function(key){return {get:function(){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}},set:function(v){try{localStorage.setItem(key,JSON.stringify(v))}catch(e){}}};};
})(typeof window!=='undefined'?window:globalThis);
