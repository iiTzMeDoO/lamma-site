/* fast.js — أسرع واحد / Fastest Typer, three modes the streamer picks:
   أذكار — a short authentic dhikr appears; first to type it exactly (tashkeel/hamza/ى/ة/spaces/punctuation forgiven) wins. Calm card, no jokes, no silly sounds.
   أسئلة — a question; first correct answer wins (alternatives + tolerant matching). Categories pickable. Skip / reveal.
   كلمات — the classic: a word appears, first to type it wins.
   The overlay never receives a quiz answer before it is revealed. */
(function(){
'use strict';
var A=window.App,C=A.C,W=window.Words,F=window.FastData,$=A.$,el=A.el;
A.allowSolo();
A.strings({
 ar:{g_title:'أسرع واحد',g_how:'اختار النمط: أذكار (أول واحد بيكتب الذكر صح)، أسئلة (أول جواب صح)، أو كلمات. التشكيل والهمزات والمسافات ما بتفرق.',
  f_m_adhkar:'أذكار',f_m_quiz:'أسئلة',f_m_words:'كلمات',f_answer:'الجواب — إلك بس',c_hide:'إخفاء',c_show:'إظهار',f_start:'ابدأ',f_next:'الجولة الجاية',f_skip:'تخطّي',f_reveal:'اكشف الجواب',c_cmd_stop:'وقّف',
  f_cats:'الأقسام (ولا شي = مشكّل)',f_mixed:'مشكّل',w_settings:'الإعدادات',f_time:'وقت الجولة (ث)',f_rounds:'عدد الجولات',f_endless:'بلا نهاية',f_gap:'بين الجولات',f_gap_manual:'يدوي',
  f_cd:'انتظار بين المحاولات (ث)',f_pts:'نقاط الفوز',f_len:'طول الذكر',f_len_all:'الكل',f_len_short:'قصير',f_len_long:'طويل',f_hist:'آخر الفائزين',
  f_k_adhkar:'أسرع واحد يكتب الذكر',f_k_quiz:'سؤال',f_k_words:'أسرع واحد يكتب',f_idle:'أسرع واحد',f_idle_a:'أذكار — مين أسرع واحد بيكتب الذكر؟',f_idle_q:'أسئلة — أول جواب صح بيربح',f_idle_w:'كلمات — أول واحد بيكتبها بيربح',
  f_won_a:'جزاك الله خير',f_won:'أسرع واحد!',f_timeup:'خلص الوقت',f_answer_was:'الجواب:',f_skipped:'تخطّينا',f_round:'جولة {n}',f_of:'من',f_done:'خلصت الجولات',f_top:'الأوائل',
  f_st_idle:'جاهز — اختار النمط واضغط ابدأ',f_st_live:'شغال: جولة {n}',f_st_won:'ربح {x}',f_st_gap:'الجولة الجاية بعد {s} ث',f_secs:'ث',f_type_it:'اكتبو بالشات',
  f_cmd_type:'اكتب الجواب / الذكر',f_cmd_start:'ابدأ (!fast quiz / !fast adhkar)',f_cmd_skip:'تخطّي',c_cmd_stop:'وقّف'},
 en:{g_title:'Fastest Typer',g_how:'Pick a mode: Adhkar (first to type the dhikr correctly), Questions (first correct answer) or Words. Diacritics, hamza forms and spaces do not matter.',
  f_m_adhkar:'Adhkar',f_m_quiz:'Questions',f_m_words:'Words',f_answer:'Answer — only you',c_hide:'Hide',c_show:'Show',f_start:'Start',f_next:'Next round',f_skip:'Skip',f_reveal:'Reveal answer',c_cmd_stop:'Stop',
  f_cats:'Categories (none = mixed)',f_mixed:'Mixed',w_settings:'Settings',f_time:'Round time (s)',f_rounds:'Rounds',f_endless:'Endless',f_gap:'Between rounds',f_gap_manual:'Manual',
  f_cd:'Wait between attempts (s)',f_pts:'Points for a win',f_len:'Dhikr length',f_len_all:'All',f_len_short:'Short',f_len_long:'Long',f_hist:'Recent winners',
  f_k_adhkar:'First to type the dhikr',f_k_quiz:'Question',f_k_words:'First to type',f_idle:'Fastest Typer',f_idle_a:'Adhkar — who types the dhikr first?',f_idle_q:'Questions — first correct answer wins',f_idle_w:'Words — first to type it wins',
  f_won_a:'May Allah reward you',f_won:'Fastest!',f_timeup:'Time\'s up',f_answer_was:'Answer:',f_skipped:'Skipped',f_round:'Round {n}',f_of:'of',f_done:'All rounds done',f_top:'Top players',
  f_st_idle:'Ready — pick a mode and press start',f_st_live:'Live: round {n}',f_st_won:'{x} won',f_st_gap:'Next round in {s}s',f_secs:'s',f_type_it:'type it in chat',
  f_cmd_type:'type the answer / dhikr',f_cmd_start:'start (!fast quiz / !fast adhkar)',f_cmd_skip:'skip',c_cmd_stop:'stop'}
});
function fmt(s,o){return String(s).replace(/\{(\w)\}/g,function(_,k){return o[k]!=null?o[k]:''})}
/* strict-but-forgiving fold for adhkar: no tashkeel/tatweel, one alef, ى→ي, ة→ه, ؤ→و, ئ/ء dropped to base, no spaces or punctuation */
function fold(s){
  return C.normalize(s).replace(/\u0621/g,'').replace(/[^\p{L}\p{N}]/gu,'');
}
function adhkarMatch(msg,dhikr){var a=fold(msg),b=fold(dhikr);return !!a&&a===b;}
function quizMatch(msg,answers){
  var toks=C.tokens(msg);var maxT=0;answers.forEach(function(a){maxT=Math.max(maxT,C.tokens(a).length)});
  if(!toks.length||toks.length>maxT+2)return false;   // a long list of guesses in one message does not count
  return C.matches(msg,answers);
}
var S={mode:'adhkar',phase:'idle',item:null,round:0,rounds:10,time:30,gap:8,cd:2,pts:2,len:'all',cats:[],deadline:0,nextAt:0,winner:null,users:{},hist:[],used:{adhkar:[],quiz:[],words:[]},tally:{}};
var hidden=false;
function save(){if(!A.obs)A.LS.set('lamma-fast-'+A.channel,JSON.stringify({mode:S.mode,rounds:S.rounds,time:S.time,gap:S.gap,cd:S.cd,pts:S.pts,len:S.len,cats:S.cats}));}
function pick(list,usedKey){
  var used=S.used[usedKey];var idx=[];for(var i=0;i<list.length;i++)if(used.indexOf(list[i].id)<0)idx.push(i);
  if(!idx.length){S.used[usedKey]=[];used=S.used[usedKey];idx=list.map(function(_,i){return i});}
  var it=list[idx[Math.random()*idx.length|0]];used.push(it.id);return it;
}
function nextItem(){
  var L=A.lang();
  if(S.mode==='adhkar'){
    var all=F.ADHKAR.map(function(d,i){return {id:i,text:d,n:d.split(' ').length}});
    var pool=all.filter(function(d){return S.len==='all'||(S.len==='short'?d.n<=5:d.n>5)});if(!pool.length)pool=all;
    var d=pick(pool,'adhkar');return {kind:'adhkar',show:d.text,ans:[d.text]};
  }
  if(S.mode==='quiz'){
    var qs=F.QUIZ.map(function(q,i){return {id:i,q:q}}).filter(function(x){return !S.cats.length||S.cats.indexOf(x.q[0])>=0});
    var q=pick(qs,'quiz').q;var ans=(q[2]+'|'+q[4]).split('|').filter(Boolean);
    return {kind:'quiz',cat:q[0],show:L==='en'?q[3]:q[1],ans:ans,shownAns:(L==='en'?q[4]:q[2]).split('|')[0],alt:(L==='en'?q[4]:q[2]).split('|').slice(1).join(' · ')};
  }
  var words=(W.FAST[L]||W.FAST.ar).map(function(w,i){return {id:L+i,w:w}});var wd=pick(words,'words');
  return {kind:'words',show:wd.w.split('|')[0],ans:wd.w.split('|')};
}
function startRound(){
  S.item=nextItem();S.phase='live';S.round++;S.winner=null;S.users={};S.tally={};S.deadline=Date.now()+S.time*1000;S.nextAt=0;
  if(S.mode!=='adhkar')A.sfx('start');
  changed();
}
function start(mode){if(mode)S.mode=mode;S.round=0;save();startRound();}
function endRound(phase,winner){
  S.phase=phase;S.winner=winner||null;S.deadline=0;
  if(winner){S.hist.unshift({n:winner.n,c:winner.c,mode:S.mode});if(S.hist.length>12)S.hist.length=12;}
  var more=S.rounds===0||S.round<S.rounds;
  if(!more){S.phase=phase;S.finished=true;}else S.finished=false;
  if(more&&S.gap>0)S.nextAt=Date.now()+S.gap*1000;
  changed();
}
function stop(){S.phase='idle';S.item=null;S.deadline=0;S.nextAt=0;S.round=0;changed();}
function skip(){if(S.phase==='idle'&&!S.item)return;S.nextAt=0;startRound();}
function reveal(){if(S.phase!=='live')return;endRound('reveal',null);}
setInterval(function(){
  if(!A.runsEngine())return;
  if(S.phase==='live'&&S.deadline&&Date.now()>=S.deadline){endRound('timeup',null);if(S.mode!=='adhkar')A.sfx('bad');return;}
  if(S.phase!=='live'&&S.phase!=='idle'&&S.nextAt&&Date.now()>=S.nextAt){startRound();return;}
  if(S.phase==='live'||S.nextAt){var s=Math.ceil(((S.phase==='live'?S.deadline:S.nextAt)-Date.now())/1000);if(s!==S._s){S._s=s;changed();}}
},200);
A.onChat(function(m){
  if(!A.runsEngine())return;
  var cmd=C.parseCmd(m.text);
  if(cmd&&A.isCtrl(m)){
    if(cmd.cmd==='fast'||cmd.cmd==='اسرع'){var a=C.normalize(cmd.args[0]||'');var md=/^(quiz|q|اسئله|اسئلة|سؤال)$/.test(a)?'quiz':/^(adhkar|azkar|athkar|اذكار|ذكر)$/.test(a)?'adhkar':/^(words?|كلمات|كلمه)$/.test(a)?'words':'';start(md);return;}
    if(cmd.cmd==='skip'||cmd.cmd==='next'){skip();return;}if(cmd.cmd==='stop'){stop();return;}if(cmd.cmd==='reveal'){reveal();return;}
  }
  if(S.phase!=='live'||!S.item)return;
  if(cmd)return;
  var u=S.users[m.user]||(S.users[m.user]={t:0}),now=Date.now();
  if(S.cd>0&&now-u.t<S.cd*1000)return;
  u.t=now;
  var ok=S.item.kind==='adhkar'?adhkarMatch(m.text,S.item.show):(S.item.kind==='quiz'?quizMatch(m.text,S.item.ans):S.item.ans.some(function(a){return C.normalize(m.text).replace(/\s+/g,'')===C.normalize(a).replace(/\s+/g,'')}));
  if(ok){A.award(m.user,m.name,S.pts);if(S.item.kind!=='adhkar'){A.sfx('win');A.confetti($('stage'),70);}endRound('won',{n:m.name,c:m.color,ms:now-(S.deadline-S.time*1000)});}
});

/* ---------- stage ---------- */
var key='';
function pub(){
  var it=S.item;var open=S.phase!=='live';
  return {mode:S.mode,phase:S.phase,round:S.round,rounds:S.rounds,time:S.time,finished:!!S.finished,
    left:S.phase==='live'?Math.max(0,S.deadline-Date.now()):0,next:S.nextAt?Math.max(0,S.nextAt-Date.now()):0,
    item:it?{kind:it.kind,cat:it.cat||'',show:it.show,ans:open&&it.kind==='quiz'?it.shownAns:''}:null,
    winner:S.winner,hist:S.hist.slice(0,5),top:A.top(3),lang:A.lang()};
}
function catLabel(c){var x=F.CATS[c];return x?x.icon+' '+(A.lang()==='en'?x.en:x.ar):''}
function draw(P){
  var secs=Math.ceil(P.left/1000),nx=Math.ceil(P.next/1000);
  var k=JSON.stringify([P.mode,P.phase,P.round,P.item,P.winner,secs,nx,P.finished,P.top,A.lang()]);if(k===key)return;key=k;
  var gs=$('gs');A.clear(gs);gs.className='fs2 camfit m-'+P.mode+' ph-'+P.phase;
  var top=el('div','s-top');var lg=el('span','s-logo');lg.appendChild(el('b',null,'لَمّة'));lg.appendChild(el('i',null,'LAMMA'));top.appendChild(lg);
  if(P.round){top.appendChild(el('span','s-pill',fmt(A.t('f_round'),{n:P.round})+(P.rounds?' '+A.t('f_of')+' '+P.rounds:'')));}
  gs.appendChild(top);
  var c=el('div','f2-center');
  if(!P.item){
    c.appendChild(el('div','big-ico',P.mode==='adhkar'?'📿':P.mode==='quiz'?'❓':'⚡'));
    c.appendChild(el('p','s-big',A.t('f_idle')));c.appendChild(el('p','s-sub',A.t(P.mode==='adhkar'?'f_idle_a':P.mode==='quiz'?'f_idle_q':'f_idle_w')));
  }else{
    var card=el('div','f2-card k-'+P.item.kind);
    if(P.item.kind==='adhkar'){card.appendChild(el('span','f2-orn','۞'));}
    card.appendChild(el('p','f2-kicker',P.item.kind==='quiz'?catLabel(P.item.cat):A.t(P.item.kind==='adhkar'?'f_k_adhkar':'f_k_words')));
    var txt=el('p','f2-text',P.item.show);txt.dir='auto';if(P.item.show.length>60)txt.classList.add('long');else if(P.item.show.length>32)txt.classList.add('mid');card.appendChild(txt);
    if(P.phase==='live'){
      var bar=el('div','tbar f2-bar');var i=el('i');i.style.width=Math.max(0,Math.min(100,P.left/(P.time*1000)*100))+'%';if(secs<=5)i.className='low';bar.appendChild(i);card.appendChild(bar);
      card.appendChild(el('p','f2-secs',secs+' '+A.t('f_secs')+' · '+A.t('f_type_it')));
    }else{
      var res=el('div','f2-res');
      if(P.phase==='won'&&P.winner){res.appendChild(el('span','f2-res-k',P.item.kind==='adhkar'?A.t('f_won_a'):A.t('f_won')));res.appendChild(A.nameEl(P.winner.n,P.item.kind==='adhkar'?null:P.winner.c,'f2-win'));
        if(P.winner.ms)res.appendChild(el('span','f2-ms',(P.winner.ms/1000).toFixed(1)+' '+A.t('f_secs')));}
      else res.appendChild(el('span','f2-res-k',P.phase==='timeup'?A.t('f_timeup'):A.t('f_skipped')));
      if(P.item.kind==='quiz'&&P.item.ans){var an=el('p','f2-ansline');an.appendChild(document.createTextNode(A.t('f_answer_was')+' '));var b=el('b',null,P.item.ans);b.dir='auto';an.appendChild(b);res.appendChild(an);}
      if(P.next)res.appendChild(el('p','f2-next',fmt(A.t('f_st_gap'),{s:nx})));
      else if(P.finished)res.appendChild(el('p','f2-next',A.t('f_done')));
      card.appendChild(res);
    }
    c.appendChild(card);
  }
  gs.appendChild(c);
  if(P.top&&P.top.length&&(P.finished||!P.item)){var tp=el('div','f2-top');tp.appendChild(el('span','f2-top-k',A.t('f_top')));P.top.forEach(function(r,i){var s=el('span','f2-top-r');s.appendChild(el('b',null,['🥇','🥈','🥉'][i]));s.appendChild(A.nameEl(r.name));tp.appendChild(s);});gs.appendChild(tp);}
}
function changed(){var P=pub();draw(P);A.publish(P);renderCtrl();}
function renderCtrl(){
  if(A.obs)return;
  document.querySelectorAll('[data-fmode]').forEach(function(b){var on=b.getAttribute('data-fmode')===S.mode;b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on));b.setAttribute('role','radio');});
  var ctrl=$('ctrl');ctrl.setAttribute('data-fmode',S.mode);
  var it=S.item;
  $('fAns').textContent=it?(hidden?'••••':(it.kind==='quiz'?it.shownAns:it.show)):'—';
  $('fAlt').textContent=it&&it.kind==='quiz'&&!hidden?it.alt:'';
  $('fAnsCard').classList.toggle('on',S.phase==='live');
  $('fStart').textContent=S.phase==='idle'?A.t('f_start'):A.t('f_next');
  $('fSkip').disabled=!it;$('fReveal').disabled=S.phase!=='live'||S.mode!=='quiz';$('fStop').disabled=S.phase==='idle';
  var st=S.phase==='idle'?A.t('f_st_idle'):S.phase==='live'?fmt(A.t('f_st_live'),{n:S.round}):S.winner?fmt(A.t('f_st_won'),{x:S.winner.n}):A.t(S.phase==='timeup'?'f_timeup':'f_skipped');
  if(S.nextAt)st+=' · '+fmt(A.t('f_st_gap'),{s:Math.max(0,Math.ceil((S.nextAt-Date.now())/1000))});
  $('fStatus').textContent=st;
  var h=$('fHist');A.clear(h);S.hist.forEach(function(x){var li=el('li');li.appendChild(A.nameEl(x.n,x.c));li.appendChild(document.createTextNode(' · '+A.t('f_m_'+x.mode)));h.appendChild(li);});
}
function renderCats(){
  if(A.obs)return;var box=$('fCats');A.clear(box);
  Object.keys(F.CATS).forEach(function(c){
    var lb=el('label','f2-cat');var cb=el('input');cb.type='checkbox';cb.checked=S.cats.indexOf(c)>=0;
    cb.addEventListener('change',function(){S.cats=Object.keys(F.CATS).filter(function(k){return box.querySelector('input[data-c="'+k+'"]').checked});save();});
    cb.setAttribute('data-c',c);lb.appendChild(cb);var n=F.QUIZ.filter(function(q){return q[0]===c}).length;lb.appendChild(el('span',null,catLabel(c)+' ('+n+')'));box.appendChild(lb);
  });
}
if(!A.obs){
  var sv={};try{sv=JSON.parse(A.LS.get('lamma-fast-'+A.channel,'{}'))||{}}catch(e){}
  S.mode=sv.mode||'adhkar';S.rounds=sv.rounds==null?10:sv.rounds;S.time=sv.time||30;S.gap=sv.gap==null?8:sv.gap;S.cd=sv.cd==null?2:sv.cd;S.pts=sv.pts||2;S.len=sv.len||'all';S.cats=sv.cats||[];
  $('fRounds').value=String(S.rounds);$('fTime').value=String(S.time);$('fGap').value=String(S.gap);$('fCd').value=String(S.cd);$('fPts').value=String(S.pts);$('fLen').value=S.len;
  [['fRounds','rounds'],['fTime','time'],['fGap','gap'],['fCd','cd'],['fPts','pts']].forEach(function(p){$(p[0]).addEventListener('change',function(){S[p[1]]=+this.value;save();changed();});});
  $('fLen').addEventListener('change',function(){S.len=this.value;save();});
  document.querySelectorAll('[data-fmode]').forEach(function(b){b.addEventListener('click',function(){var m=b.getAttribute('data-fmode');if(m===S.mode)return;S.mode=m;S.phase='idle';S.item=null;S.deadline=0;S.nextAt=0;S.round=0;save();changed();});});
  $('fStart').addEventListener('click',function(){if(S.phase==='idle')start();else skip();});
  $('fSkip').addEventListener('click',skip);$('fReveal').addEventListener('click',reveal);$('fStop').addEventListener('click',stop);
  $('fHide').addEventListener('click',function(){hidden=!hidden;this.textContent=A.t(hidden?'c_show':'c_hide');renderCtrl();});
  renderCats();
}
A.onLang(function(){key='';renderCats();changed();});
A.onMirror(function(P){draw(P)});
/* demo: a few chatters try (some with small typos / missing hamza / no spaces, still counted) */
var dT=null;
A.onDemo(function(){
  if(S.phase==='idle')start();
  clearInterval(dT);var n=0;
  dT=setInterval(function(){
    if(!A.demo()){clearInterval(dT);return;}
    if(S.phase!=='live'||!S.item)return;n++;
    var b=A.bot(Math.random()*A.BOTS.length|0),txt;
    var el2=(Date.now()-(S.deadline-S.time*1000))/1000;
    if(el2>4+Math.random()*6&&Math.random()<.35){
      txt=S.item.kind==='quiz'?S.item.ans[0]:S.item.show;
      if(S.item.kind==='adhkar'&&Math.random()<.6)txt=txt.replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');   // typed without hamzas → still correct
    }else{
      var wrong=S.item.kind==='quiz'?['ما بعرف','؟؟','دمشق','5','argentina','ههههه'][n%6]:S.item.show.split(' ').slice(0,2).join(' ');txt=wrong;
    }
    A.say(txt,b);
  },900);
});
changed();
A.start();
})();
