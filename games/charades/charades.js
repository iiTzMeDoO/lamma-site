/* charades.js — تمثيل. The secret word lives only in the control panel; the overlay gets a public state without it. */
(function(){
'use strict';
var A=window.App,C=A.C,W=window.Words,$=A.$,el=A.el;
var CATS=['all','animals','jobs','movies','games','objects','food','sports','places'];
A.strings({
 ar:{g_title:'تمثيل',g_how:'الكلمة بتبين إلك إنت بس. مثّلها قدام الكام بدون ما تحكي، وأول واحد بالشات بيكتبها صح بياخد النقاط.',
  c_secret:'الكلمة — إلك بس',c_hide:'إخفاء',c_show:'إظهار',c_cat:'الفئة',c_lang:'لغة الكلمة',ar_only:'عربي',en_only:'English',c_time:'الوقت (ثانية)',c_after:'بعد ما حدا يعرف',
  c_manual:'أنا بضغط التالي',c_autonext:'كلمة جديدة تلقائياً',c_hint:'أظهر عدد الأحرف عالستريم',c_showcat:'أظهر الفئة عالستريم',c_start:'ابدأ',c_next:'كلمة جديدة',c_reveal:'كشف الكلمة',
  c_tip:'نصيحة: إذا عم تشارك شاشتك، اضغط "إخفاء". الشات بيقدر يكتب الجواب بأي شكل: قطه، القطة، بسة… كلو مقبول.',
  cat_all:'كل الفئات',cat_animals:'حيوانات',cat_jobs:'مهن',cat_movies:'أفلام ومسلسلات',cat_games:'ألعاب',cat_objects:'أغراض',cat_food:'أكل',cat_sports:'رياضة',cat_places:'أماكن',
  c_idle_k:'تمثيل',c_idle_b:'جاهزين؟',c_idle_s:'الستريمر رح يمثّل كلمة بدون كلام… وإنتو بتخمّنو بالشات',c_live_b:'خمّنو الكلمة!',c_live_s:'اكتبو جوابكم بالشات',
  c_letters:'حرف',c_got:'عرفها!',c_was:'الكلمة كانت',c_nobody:'ما حدا عرفها',c_round:'جولة',
  c_cmd_guess:'اكتب تخمينك',c_cmd_start:'ابدأ / كلمة جديدة',c_cmd_skip:'تخطّي الكلمة',c_cmd_stop:'وقّف اللعبة'},
 en:{g_title:'Charades',g_how:'Only you see the word. Act it out on camera without talking; the first chatter to type it right gets the points.',
  c_secret:'The word — only you',c_hide:'Hide',c_show:'Show',c_cat:'Category',c_lang:'Word language',ar_only:'Arabic',en_only:'English',c_time:'Time (seconds)',c_after:'After someone gets it',
  c_manual:'I press next',c_autonext:'New word automatically',c_hint:'Show letter count on stream',c_showcat:'Show category on stream',c_start:'Start',c_next:'New word',c_reveal:'Reveal word',
  c_tip:'Tip: press "Hide" if you share your screen. Chat can type the answer loosely (plural, “the”, Arabic spelling variants): all accepted.',
  cat_all:'All categories',cat_animals:'Animals',cat_jobs:'Jobs',cat_movies:'Movies & shows',cat_games:'Games',cat_objects:'Objects',cat_food:'Food',cat_sports:'Sports',cat_places:'Places',
  c_idle_k:'Charades',c_idle_b:'Ready?',c_idle_s:'The streamer acts out a word without talking… you guess in chat',c_live_b:'Guess the word!',c_live_s:'Type your answer in chat',
  c_letters:'letters',c_got:'got it!',c_was:'The word was',c_nobody:'Nobody got it',c_round:'Round',
  c_cmd_guess:'type your guess',c_cmd_start:'start / new word',c_cmd_skip:'skip the word',c_cmd_stop:'stop the game'}
});

/* ---------- engine state (control only) ---------- */
var S={phase:'idle',round:0,cat:'all',lang:'ar',item:null,catOf:'',dur:90,startedAt:0,endsAt:0,used:{},guesses:[],winner:null,hint:false,showCat:true,auto:false,timer:null,reveal:''};
var hidden=false;
function pool(){
  var cats=S.cat==='all'?CATS.slice(1):[S.cat],out=[];
  cats.forEach(function(c){W.CHARADES[c].forEach(function(it,i){var side=S.lang==='ar'?it[0]:it[1];if(side)out.push({c:c,i:i,it:it});});});
  return out;
}
function pick(){
  var p=pool(),fresh=p.filter(function(x){return !S.used[x.c+':'+x.i]});
  if(!fresh.length){S.used={};fresh=p;}
  var x=fresh[Math.random()*fresh.length|0];S.used[x.c+':'+x.i]=1;return x;
}
function shown(){if(!S.item)return '';var side=S.lang==='ar'?S.item[0]:S.item[1];return side.split('|')[0];}
function answers(){var a=[];if(S.item){if(S.item[0])a=a.concat(S.item[0].split('|'));if(S.item[1])a=a.concat(S.item[1].split('|'));}return a;}

/* public state — NEVER contains the word while a round is live */
function pub(){
  var p={phase:S.phase,round:S.round,dur:S.dur,endsAt:S.endsAt,guesses:S.guesses.slice(-6),winner:S.winner,lang:A.lang()};
  if(S.phase==='live'){
    if(S.showCat)p.cat=S.catOf;
    if(S.hint){var w=shown();p.hint=C.letterHint(w);p.count=C.letterCount(w);}
  }
  if(S.phase==='end'){p.reveal=S.reveal;if(S.showCat)p.cat=S.catOf;}
  return p;
}

function newWord(){
  clearTimeout(S.timer);
  A.roundStart();var x=pick();S.item=x.it;S.catOf=x.c;S.phase='live';S.round++;S.guesses=[];S.winner=null;S.reveal='';
  S.startedAt=Date.now();S.endsAt=S.startedAt+S.dur*1000;
  A.sfx('start');changed();A.poke();
}
function skip(){if(S.phase!=='live')return;S.round--;newWord();}
function endRound(winner){
  if(S.phase!=='live')return;
  S.phase='end';S.reveal=shown();S.winner=winner||null;
  if(winner){A.award(winner.user,winner.n,winner.pts);A.sfx('win');}else A.sfx('bad');A.roundEnd();
  changed();if(winner)A.confetti($('stage'),80);
  if(winner&&S.auto){clearTimeout(S.timer);S.timer=setTimeout(function(){if(S.phase==='end')newWord();},5000);}
}
function stop(){clearTimeout(S.timer);S.phase='idle';S.item=null;S.winner=null;S.guesses=[];S.reveal='';changed();A.clearLater();}

A.onChat(function(m){
  if(!A.runsEngine())return;
  var cmd=C.parseCmd(m.text);
  if(cmd&&A.isCtrl(m)){
    if(cmd.cmd==='charades'||cmd.cmd==='تمثيل'||cmd.cmd==='start'){if(S.phase==='live')skip();else newWord();return;}
    if(cmd.cmd==='skip'||cmd.cmd==='تخطي'){skip();return;}
    if(cmd.cmd==='stop'||cmd.cmd==='وقف'){stop();return;}
  }
  if(S.phase!=='live'||cmd)return;
  if(m.broadcaster)return; // the actor can't win his own round
  if(C.matches(m.text,answers())){
    var left=Math.max(0,S.endsAt-Date.now())/(S.dur*1000);var pts=1+Math.ceil(left*2);
    endRound({user:m.user,n:m.name,c:m.color,pts:pts});
  }else{
    if(C.tokens(m.text).length>4||/https?:|www\./i.test(m.text))return;
    S.guesses.push({n:m.name,c:m.color,t:String(m.text).slice(0,40)});if(S.guesses.length>12)S.guesses.shift();
    changed();
  }
});

/* ---------- rendering (shared by control and overlay) ---------- */
var gs=$('gs'),cur=null,lastKey='';
function catLabel(c){return A.t('cat_'+c)}
function draw(P){
  cur=P;var key=P.phase+'|'+P.round+'|'+(P.winner?P.winner.n:'')+'|'+(P.hint||'')+'|'+(P.cat||'')+'|'+A.lang();
  if(key!==lastKey){lastKey=key;build(P);}
  ticker(P);tick();
}
function build(P){
  A.clear(gs);
  var top=el('div','s-top');var lg=el('span','s-logo');lg.appendChild(el('b',null,'لَمّة'));lg.appendChild(el('i',null,'LAMMA'));top.appendChild(lg);
  if(P.round)top.appendChild(el('span','s-pill',A.t('c_round')+' '+P.round));
  gs.appendChild(top);
  var c=el('div','s-center');gs.appendChild(c);
  if(P.phase==='idle'){
    c.appendChild(el('div','ch-masks','🎭'));
    c.appendChild(el('p','s-kicker',A.t('c_idle_k')));c.appendChild(el('p','s-big',A.t('c_idle_b')));c.appendChild(el('p','s-sub',A.t('c_idle_s')));
  }else if(P.phase==='live'){
    var row=el('div','ch-row');var ring=el('div','ring');ring.id='chRing';ring.appendChild(el('b',null,''));row.appendChild(ring);
    var col=el('div','ch-col');
    if(P.cat)col.appendChild(el('span','s-pill ch-cat',catLabel(P.cat)));
    col.appendChild(el('p','s-big',A.t('c_live_b')));
    col.appendChild(el('p','s-sub',A.t('c_live_s')));
    row.appendChild(col);c.appendChild(row);
    if(P.hint){var h=el('p','ch-hint',P.hint);h.dir='auto';c.appendChild(h);c.appendChild(el('p','s-sub',P.count+' '+A.t('c_letters')));}
  }else{
    if(P.winner){
      var wb=el('div','winner-box');wb.appendChild(el('span','crown','👑'));var n=A.nameEl(P.winner.n,null);wb.appendChild(n);
      wb.appendChild(el('p','s-mid',A.t('c_got')+' +'+P.winner.pts));c.appendChild(wb);
    }else{c.appendChild(el('p','s-big',A.t('timeup')));c.appendChild(el('p','s-sub',A.t('c_nobody')));}
    if(P.reveal){var rv=el('p','ch-reveal');rv.appendChild(el('span',null,A.t('c_was')+': '));var b=el('b',null,P.reveal);b.dir='auto';rv.appendChild(b);c.appendChild(rv);}
  }
  var tk=el('div','ticker');tk.id='chTicker';gs.appendChild(tk);
}
var tickKey='';
function ticker(P){
  var tk=$('chTicker');if(!tk)return;var k=JSON.stringify(P.guesses||[]);if(k===tickKey)return;tickKey=k;A.clear(tk);
  if(P.phase!=='live')return;
  (P.guesses||[]).slice(-6).forEach(function(g){var s=el('span');s.appendChild(A.nameEl(g.n,g.c));var t=el('bdi',null,g.t);s.appendChild(t);tk.appendChild(s);});
}
var lastSec=-1;
function tick(){
  if(!cur||cur.phase!=='live')return;
  var ring=$('chRing');if(!ring)return;
  var left=Math.max(0,cur.endsAt-Date.now()),sec=Math.ceil(left/1000);
  ring.style.setProperty('--p',(left/(cur.dur*1000)).toFixed(3));ring.classList.toggle('low',sec<=10);
  ring.querySelector('b').textContent=sec;
  if(A.runsEngine()&&sec!==lastSec){lastSec=sec;if(sec<=5&&sec>0)A.sfx('tick');}
  if(A.runsEngine()&&left<=0&&S.phase==='live')endRound(null);
}
setInterval(tick,200);

/* ---------- control panel ---------- */
function renderCtrl(){
  if(A.obs)return;
  var w=$('chWord');w.textContent=hidden?'••••••':(S.phase==='idle'?'—':(S.phase==='end'?S.reveal:shown()));
  var alt='';if(S.item&&!hidden&&S.phase!=='idle'){var other=S.lang==='ar'?S.item[1]:S.item[0];alt=(catLabel(S.catOf))+(other?' · '+other.split('|')[0]:'');}
  $('chAlt').textContent=alt;
  $('chSecret').classList.toggle('on',S.phase==='live');
  $('chStart').textContent=S.phase==='idle'?A.t('c_start'):A.t('c_next');
  $('chSkip').disabled=S.phase!=='live';$('chReveal').disabled=S.phase!=='live';$('chStop').disabled=S.phase==='idle';
}
function changed(){draw(pub());renderCtrl();A.publish(pub());}

if(!A.obs){
  var cs=$('chCat');CATS.forEach(function(c){var o=el('option',null,catLabel(c));o.value=c;cs.appendChild(o);});
  var saved=JSON.parse(A.LS.get('lamma-charades','{}')||'{}');
  if(saved.cat)cs.value=saved.cat;if(saved.lang)$('chLang').value=saved.lang;if(saved.dur)$('chDur').value=saved.dur;
  if(saved.hint)$('chHintT').checked=true;if(saved.showCat===false)$('chCatT').checked=false;if(saved.auto)$('chAuto').value='1';
  function readSettings(){S.cat=cs.value;S.lang=$('chLang').value;S.dur=+$('chDur').value;S.hint=$('chHintT').checked;S.showCat=$('chCatT').checked;S.auto=$('chAuto').value==='1';
    A.LS.set('lamma-charades',JSON.stringify({cat:S.cat,lang:S.lang,dur:S.dur,hint:S.hint,showCat:S.showCat,auto:S.auto}));}
  readSettings();
  ['chCat','chLang','chDur','chHintT','chCatT','chAuto'].forEach(function(id){$(id).addEventListener('change',function(){readSettings();if(S.phase==='live'&&(id==='chHintT'||id==='chCatT'))changed();});});
  $('chStart').addEventListener('click',function(){readSettings();if(S.phase==='live')skip();else newWord();});
  $('chSkip').addEventListener('click',skip);
  $('chReveal').addEventListener('click',function(){endRound(null)});
  $('chStop').addEventListener('click',stop);
  $('chEye').addEventListener('click',function(){hidden=!hidden;this.setAttribute('aria-pressed',String(hidden));this.textContent=A.t(hidden?'c_show':'c_hide');renderCtrl();});
  A.onLang(function(){Array.prototype.forEach.call(cs.options,function(o){o.textContent=catLabel(o.value)});$('chEye').textContent=A.t(hidden?'c_show':'c_hide');lastKey='';changed();});
}else{
  A.onLang(function(){lastKey='';if(cur)draw(cur);});
}
A.onMirror(function(P){draw(P)});

/* ---------- demo chatters guess ---------- */
A.onDemo(function(){
  if(S.phase!=='live')return;A.clearLater();
  var r=S.round,catItems=W.CHARADES[S.catOf]||[],ans=answers();
  var wrong=C.shuffle(catItems.filter(function(it){return it!==S.item&&it[0]})).slice(0,6).map(function(it){var s=Math.random()<.75?it[0]:(it[1]||it[0]);return s.split('|')[0]});
  wrong.forEach(function(w,i){A.later(1500+i*1700+Math.random()*900,function(){if(S.phase==='live'&&S.round===r)A.say(Math.random()<.2?w+'؟':w);});});
  A.later(11000+Math.random()*5000,function(){if(S.phase==='live'&&S.round===r){var a=ans[Math.random()*Math.min(ans.length,3)|0];A.say(Math.random()<.4?'ال'+a:a);}});
});

draw(pub());renderCtrl();
A.start();
})();
