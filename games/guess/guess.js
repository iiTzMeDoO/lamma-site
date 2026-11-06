/* guess.js — خمّن الرقم / Guess the number (default 1–1000).
   Anti-spam: per-user cooldown, optional max guesses per user per round, the same number twice is ignored, numbers outside
   the range that is already known are ignored. The secret lives only in this page's memory and in the control card;
   the overlay state (publish) never carries it until the round is over. */
(function(){
'use strict';
var A=window.App,C=A.C,$=A.$,el=A.el;
A.allowSolo();
A.strings({
 ar:{g_title:'خمّن الرقم',g_how:'في رقم سري (من 1 لـ 1000 أو قد ما بدك)، والشات بيكتب أرقام. كل تخمين بيضيّق المجال: بين كذا وكذا. كل واحد بيخمن مرة كل كم ثانية، فالسبام ما بيفيد.',
  g_secret:'الرقم السري — إلك بس',c_hide:'إخفاء',c_show:'إظهار',g_max:'أكبر رقم',g_cd:'انتظار بين التخمينات (ث)',g_maxper:'محاولات لكل شخص (0 = بلا حد)',g_pts:'نقاط الفوز',
  g_outside:'تجاهل الأرقام برا المجال المعروف',g_new:'رقم جديد',g_reveal:'اكشف الرقم وخلّص',c_cmd_stop:'وقّف',g_ignored:'التخمينات المتجاهلة (سبام)',
  g_idle:'خمّن الرقم',g_idle_s:'بانتظار رقم جديد…',g_live:'الرقم بين',g_and:'و',g_higher:'أكبر',g_lower:'أصغر',
  g_won:'عرف الرقم!',g_won_s:'{x} بعد {n} تخمين',g_revealed:'الرقم كان',g_guesses:'تخمين',g_players:'لاعب',g_rule:'كل واحد مرة كل {s} ث',g_rule_max:' · {m} محاولات لكل واحد',
  g_type:'اكتب رقم بين {a} و {b}',g_st_idle:'ما في جولة',g_st_live:'جولة شغالة: {n} تخمين من {p} لاعب، {i} متجاهل',
  ig_cd:'استنى',ig_same:'نفس الرقم',ig_max:'خلصو محاولاتو',ig_out:'برا المجال',g_cmd_num:'اكتب رقم',g_cmd_start:'رقم جديد (وبتقدر تحدد الأكبر: !guess 500)',g_cmd_reveal:'اكشف الرقم'},
 en:{g_title:'Guess the Number',g_how:'There is a secret number (1–1000, or whatever you set) and chat types numbers. Each guess narrows the range: between X and Y. Everyone can guess once every few seconds, so spamming does not help.',
  g_secret:'Secret number — only you',c_hide:'Hide',c_show:'Show',g_max:'Highest number',g_cd:'Wait between guesses (s)',g_maxper:'Guesses per person (0 = no limit)',g_pts:'Points for the win',
  g_outside:'Ignore numbers outside the known range',g_new:'New number',g_reveal:'Reveal and end',c_cmd_stop:'Stop',g_ignored:'Ignored guesses (spam)',
  g_idle:'Guess the Number',g_idle_s:'Waiting for a new number…',g_live:'The number is between',g_and:'and',g_higher:'higher',g_lower:'lower',
  g_won:'Got it!',g_won_s:'{x} after {n} guesses',g_revealed:'The number was',g_guesses:'guesses',g_players:'players',g_rule:'one guess every {s}s each',g_rule_max:' · {m} guesses each',
  g_type:'Type a number between {a} and {b}',g_st_idle:'No round running',g_st_live:'Round live: {n} guesses from {p} players, {i} ignored',
  ig_cd:'cooldown',ig_same:'same number',ig_max:'out of guesses',ig_out:'outside range',g_cmd_num:'type a number',g_cmd_start:'new number (set the top: !guess 500)',g_cmd_reveal:'reveal the number'}
});
function fmt(s,o){return String(s).replace(/\{(\w)\}/g,function(_,k){return o[k]!=null?o[k]:''})}
function fmtN(n){return String(n)}
/* a guess is a message that is only a whole number (Arabic/Persian digits fine, thousands separators fine) */
function parseNum(text,max){
  var n=C.normalize(text).replace(/[,\u066C\u060C.\s]/g,'');
  if(!/^\d{1,7}$/.test(n))return null;var v=parseInt(n,10);
  return (v>=1&&v<=max)?v:null;
}
var S={on:false,secret:0,max:1000,lo:1,hi:1000,cd:5,per:0,pts:3,outside:true,count:0,users:{},last:[],winner:null,revealed:null,ignored:0,startedAt:0};
var hidden=false;
function save(){if(!A.obs)A.LS.set('lamma-guess-'+A.channel,JSON.stringify({max:S.max,cd:S.cd,per:S.per,pts:S.pts,outside:S.outside}));}
function start(max){
  if(max)S.max=Math.max(10,Math.min(1000000,max|0));
  A.roundStart();S.on=true;S.secret=1+Math.floor(Math.random()*S.max);S.lo=1;S.hi=S.max;S.count=0;S.users={};S.last=[];S.winner=null;S.revealed=null;S.ignored=0;S.startedAt=Date.now();
  if(!A.obs)A.clear($('gIgnored'));
  A.sfx('start');save();changed();
}
function stop(){S.on=false;A.roundEnd({players:Object.keys(S.users||{}).map(function(u){return [u]})});changed();}
function reveal(){if(!S.secret)return;S.revealed=S.secret;S.on=false;A.roundEnd({players:Object.keys(S.users||{}).map(function(u){return [u]})});A.sfx('bad');changed();}
function ignore(m,v,why){S.ignored++;if(A.obs)return;var ul=$('gIgnored');var li=el('li');li.appendChild(A.nameEl(m.name,m.color));li.appendChild(document.createTextNode(': '+v+' — '+A.t('ig_'+why)));ul.insertBefore(li,ul.firstChild);while(ul.children.length>30)ul.removeChild(ul.lastChild);}
A.onChat(function(m){
  if(!A.runsEngine())return;
  var cmd=C.parseCmd(m.text);
  if(cmd&&A.isCtrl(m)){
    if(cmd.cmd==='guess'||cmd.cmd==='خمن'||cmd.cmd==='رقم'){var mx=cmd.args[0]?parseInt(C.normalize(cmd.args[0]),10):0;start(mx>=10?mx:0);return;}
    if(cmd.cmd==='stop'){stop();return;}if(cmd.cmd==='reveal'||cmd.cmd==='اكشف'){reveal();return;}
  }
  if(!S.on)return;
  var v=parseNum(m.text,S.max);if(v==null)return;
  var u=S.users[m.user]||(S.users[m.user]={n:0,t:0,last:null}),now=Date.now();
  if(S.cd>0&&now-u.t<S.cd*1000){ignore(m,v,'cd');return;}
  if(u.last===v){ignore(m,v,'same');return;}
  if(S.per>0&&u.n>=S.per){ignore(m,v,'max');return;}
  if(S.outside&&(v<S.lo||v>S.hi)){ignore(m,v,'out');return;}
  u.n++;u.t=now;u.last=v;S.count++;
  var h=C.hint(v,S.secret);
  if(h==='win'){S.on=false;S.winner={n:m.name,c:m.color,v:v,count:S.count};S.revealed=v;S.lo=S.hi=v;A.award(m.user,m.name,S.pts);A.roundEnd({players:Object.keys(S.users||{}).map(function(u){return [u]})});A.sfx('win');changed();A.confetti($('stage'),120);return;}
  if(h==='higher')S.lo=Math.max(S.lo,v+1);else S.hi=Math.min(S.hi,v-1);
  S.last.unshift({n:m.name,c:m.color,v:v,h:h});if(S.last.length>8)S.last.length=8;
  A.sfx('pop');changed();
});

/* ---------- stage ---------- */
function pub(){return {on:S.on,max:S.max,lo:S.lo,hi:S.hi,count:S.count,players:Object.keys(S.users).length,last:S.last.slice(0,8),cd:S.cd,per:S.per,
  winner:S.winner,revealed:S.revealed,lang:A.lang()}}  /* public: range, guesses, winner; the hidden number stays out */
var key='';
function draw(P){
  var k=JSON.stringify(P);if(k===key)return;key=k;
  var gs=$('gs');A.clear(gs);
  var top=el('div','s-top');var lg=el('span','s-logo');lg.appendChild(el('b',null,'لَمّة'));lg.appendChild(el('i',null,'LAMMA'));top.appendChild(lg);
  var pills=el('div','g2-pills');
  if(P.on||P.count){pills.appendChild(el('span','s-pill','🎯 '+P.count+' '+A.t('g_guesses')));pills.appendChild(el('span','s-pill','👥 '+P.players+' '+A.t('g_players')));}
  top.appendChild(pills);gs.appendChild(top);
  var c=el('div','g2-center');
  if(P.winner){
    c.appendChild(el('p','s-kicker',A.t('g_won')));
    c.appendChild(el('p','g2-num win',fmtN(P.winner.v)));
    var wb=el('div','winner-box');wb.appendChild(el('span','crown','🏆'));wb.appendChild(A.nameEl(P.winner.n,null));c.appendChild(wb);
    c.appendChild(el('p','s-sub',fmt(A.t('g_won_s'),{x:'',n:P.winner.count}).trim()));
  }else if(P.revealed!=null&&!P.on){
    c.appendChild(el('p','s-kicker',A.t('g_revealed')));c.appendChild(el('p','g2-num',fmtN(P.revealed)));
  }else if(!P.on){
    c.appendChild(el('div','big-ico','🎯'));c.appendChild(el('p','s-big',A.t('g_idle')));c.appendChild(el('p','s-sub',A.t('g_idle_s')));
  }else{
    c.appendChild(el('p','s-kicker',A.t('g_live')));
    var rg=el('p','g2-range');var a=el('span','g2-lo',fmtN(P.lo)),b=el('span','g2-hi',fmtN(P.hi));
    rg.appendChild(a);rg.appendChild(el('span','g2-and',A.t('g_and')));rg.appendChild(b);rg.dir=A.lang()==='ar'?'rtl':'ltr';c.appendChild(rg);
    // narrowing bar on the full 1..max line (always left→right like a number line)
    var bar=el('div','g2-bar');bar.dir='ltr';var fill=el('i');var L=(P.lo-1)/P.max*100,Wd=Math.max(.6,(P.hi-P.lo+1)/P.max*100);
    fill.style.left=L+'%';fill.style.width=Wd+'%';bar.appendChild(fill);
    var e1=el('span','g2-end s',"1"),e2=el('span','g2-end e',fmtN(P.max));bar.appendChild(e1);bar.appendChild(e2);c.appendChild(bar);
    var rule=fmt(A.t('g_type'),{a:P.lo,b:P.hi});c.appendChild(el('p','s-sub g2-rule',rule));
    var r2=P.cd>0?fmt(A.t('g_rule'),{s:P.cd}):'';if(P.per>0)r2+=fmt(A.t('g_rule_max'),{m:P.per});if(r2)c.appendChild(el('p','g2-note',r2.replace(/^ · /,'')));
  }
  gs.appendChild(c);
  if(P.last&&P.last.length&&!P.winner){
    var tk=el('div','g2-last');
    P.last.forEach(function(g,i){var s=el('span','g2-g '+(g.h==='higher'?'up':'down')+(i===0?' fresh':''));s.appendChild(A.nameEl(g.n,g.c));s.appendChild(el('b',null,String(g.v)));s.appendChild(el('em',null,g.h==='higher'?'⬆ '+A.t('g_higher'):'⬇ '+A.t('g_lower')));tk.appendChild(s);});
    gs.appendChild(tk);
  }
}
function changed(){var P=pub();draw(P);A.publish(P);renderCtrl();}
function renderCtrl(){
  if(A.obs)return;
  $('gSecret').textContent=S.secret&&(S.on||S.revealed!=null)?(hidden?'••••':String(S.secret)):'—';
  $('gSecretCard').classList.toggle('on',S.on);$('gReveal').disabled=!S.on;$('gStop').disabled=!S.on;
  $('gStats').textContent=S.on?fmt(A.t('g_st_live'),{n:S.count,p:Object.keys(S.users).length,i:S.ignored}):A.t('g_st_idle');
}
if(!A.obs){
  var sv={};try{sv=JSON.parse(A.LS.get('lamma-guess-'+A.channel,'{}'))||{}}catch(e){}
  S.max=sv.max||1000;S.cd=sv.cd==null?5:sv.cd;S.per=sv.per||0;S.pts=sv.pts||3;S.outside=sv.outside!==false;S.hi=S.max;
  $('gMax').value=S.max;$('gCd').value=S.cd;$('gPer').value=S.per;$('gPts').value=String(S.pts);$('gOutside').checked=S.outside;
  function num(id,lo,hi,dflt){var v=parseInt($(id).value,10);if(isNaN(v))v=dflt;v=Math.max(lo,Math.min(hi,v));$(id).value=v;return v}
  $('gMax').addEventListener('change',function(){S.max=num('gMax',10,1000000,1000);save();if(!S.on){S.hi=S.max;changed();}});
  $('gCd').addEventListener('change',function(){S.cd=num('gCd',0,30,5);save();changed();});
  $('gPer').addEventListener('change',function(){S.per=num('gPer',0,100,0);save();changed();});
  $('gPts').addEventListener('change',function(){S.pts=+this.value;save();});
  $('gOutside').addEventListener('change',function(){S.outside=this.checked;save();});
  $('gStart').addEventListener('click',function(){start();});
  $('gReveal').addEventListener('click',reveal);
  $('gStop').addEventListener('click',stop);
  $('gHide').addEventListener('click',function(){hidden=!hidden;this.textContent=A.t(hidden?'c_show':'c_hide');renderCtrl();});
}
A.onLang(function(){key='';changed();});
A.onMirror(function(P){draw(P)});
/* demo: chatters narrow the range (some spam the same number to show it gets ignored) */
var dT=null;
A.onDemo(function(){
  if(!S.on&&!S.winner)start();
  clearInterval(dT);var i=0;
  dT=setInterval(function(){
    if(!A.demo()){clearInterval(dT);return;}
    if(!S.on)return;
    var b=A.bot(i++%A.BOTS.length);
    var span=S.hi-S.lo;var v=span<=0?S.lo:S.lo+Math.round(span*(.08+Math.random()*.84));
    if(Math.random()<.18)v=S.last.length?S.last[0].v:v;          // spam
    if(Math.random()<.08&&span>3)v=S.lo+Math.floor(Math.random()*(span+1));
    A.say(String(v),b);
  },1300);
});
changed();
A.start();
})();
