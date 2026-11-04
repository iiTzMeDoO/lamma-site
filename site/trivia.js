/* trivia.js — أسئلة سريعة / Quick trivia. First right answer +3, every other right answer +1. */
(function(){
'use strict';
var A=window.App,C=A.C,W=window.Words,$=A.$,el=A.el;
A.allowSolo();
A.strings({ar:{g_title:'أسئلة سريعة',g_how:'سؤال و4 أجوبة. الشات بيجاوب !1 لـ !4 (جواب واحد لكل واحد). أول جواب صح +3، وكل جواب صح +1.',t_time:'وقت السؤال (ث)',t_count:'عدد الأسئلة',t_start:'ابدأ المسابقة',
  t_tip:'الأسئلة بتنعرض بلغة الموقع (عربي/English). الجواب الصح بيبين بس بعد ما يخلص الوقت.',t_idle:'أسئلة سريعة',t_idle_s:'مين أذكى واحد بالشات؟',t_q:'سؤال {i}/{n}',t_how:'جاوبو بـ !1 !2 !3 !4',
  t_first:'أول واحد عرف:',t_right:'{n} جاوبو صح',t_done:'خلصت المسابقة!',t_top:'الأوائل',t_cmd_ans:'جاوب',t_cmd_start:'ابدأ المسابقة',c_cmd_stop:'وقّف'},
 en:{g_title:'Quick Trivia',g_how:'A question and 4 answers. Chat answers !1 to !4 (one answer each). First right answer +3, every right answer +1.',t_time:'Question time (s)',t_count:'Questions',t_start:'Start the quiz',
  t_tip:'Questions show in the site language (Arabic/English). The right answer only appears when time is up.',t_idle:'Quick Trivia',t_idle_s:'Who is the smartest in chat?',t_q:'Question {i}/{n}',t_how:'Answer with !1 !2 !3 !4',
  t_first:'First right:',t_right:'{n} got it right',t_done:'Quiz over!',t_top:'Top scores',t_cmd_ans:'answer',t_cmd_start:'start the quiz',c_cmd_stop:'stop'}});
function f(k,o){var s=A.t(k);for(var x in o)s=s.split('{'+x+'}').join(o[x]);return s}
var S={phase:'idle',order:[],i:0,n:10,dur:20,endsAt:0,ans:{},first:null,score:{},t:null};
function start(){S.n=A.obs?10:+$('tCount').value;S.dur=A.obs?20:+$('tTime').value;S.order=C.shuffle(W.TRIVIA.map(function(_,i){return i})).slice(0,S.n);S.n=S.order.length;S.i=0;S.score={};ask();}
function ask(){clearTimeout(S.t);S.phase='q';S.ans={};S.first=null;S.endsAt=Date.now()+S.dur*1000;A.sfx('start');changed();A.poke();S.t=setTimeout(reveal,S.dur*1000);}
function reveal(){if(S.phase!=='q')return;clearTimeout(S.t);S.phase='a';var q=W.TRIVIA[S.order[S.i]];
  Object.keys(S.ans).forEach(function(u){var a=S.ans[u];if(a.v===q.c){var pts=(S.first&&S.first.u===u)?3:1;A.award(u,a.n,pts);var s=S.score[u]||{n:a.n,p:0};s.p+=pts;S.score[u]=s;}});
  A.sfx('win');changed();S.t=setTimeout(next,6000);}
function next(){clearTimeout(S.t);if(S.phase==='idle')return;S.i++;if(S.i>=S.n){S.phase='done';changed();A.confetti($('stage'),70);return;}ask();}
function stop(){clearTimeout(S.t);S.phase='idle';changed();A.clearLater();}
A.onChat(function(m){if(!A.runsEngine())return;var cmd=C.parseCmd(m.text);
  if(cmd&&A.isCtrl(m)){if(cmd.cmd==='trivia'){start();return;}if(cmd.cmd==='stop'){stop();return;}if(cmd.cmd==='next'){next();return;}}
  if(S.phase!=='q')return;var v=C.parseVote(m.text,4);if(v<0||S.ans[m.user])return;
  S.ans[m.user]={v:v,n:m.name};var q=W.TRIVIA[S.order[S.i]];if(v===q.c&&!S.first)S.first={u:m.user,n:m.name,c:m.color};changed();});
function pub(){var p={phase:S.phase,i:S.i,n:S.n,endsAt:S.endsAt,dur:S.dur};
  if(S.phase==='q'||S.phase==='a'){p.qi=S.order[S.i];p.cnt=[0,0,0,0];Object.keys(S.ans).forEach(function(u){p.cnt[S.ans[u].v]++});p.total=Object.keys(S.ans).length;}
  if(S.phase==='a'){var q=W.TRIVIA[S.order[S.i]];p.correct=q.c;p.first=S.first;p.right=p.cnt[q.c];}
  if(S.phase==='done'){p.top=Object.keys(S.score).map(function(u){return S.score[u]}).sort(function(a,b){return b.p-a.p}).slice(0,5);}
  return p;}
var gs=$('gs'),cur=null,key='';
function topBar(pill){var top=el('div','s-top');var lg=el('span','s-logo');lg.appendChild(el('b',null,'لَمّة'));lg.appendChild(el('i',null,'LAMMA'));top.appendChild(lg);if(pill)top.appendChild(el('span','s-pill',pill));gs.appendChild(top);}
function draw(P){cur=P;var k=JSON.stringify(P)+A.lang();if(k===key){tick();return;}key=k;A.clear(gs);
  var c=el('div','s-center trivia');
  if(P.phase==='idle'){topBar('');gs.appendChild(c);c.appendChild(el('div','big-ico','🧠'));c.appendChild(el('p','s-big',A.t('t_idle')));c.appendChild(el('p','s-sub',A.t('t_idle_s')));return;}
  if(P.phase==='done'){topBar('');gs.appendChild(c);c.appendChild(el('p','s-big',A.t('t_done')));var ol=el('ol','tv-top');(P.top||[]).forEach(function(r){var li=el('li');li.appendChild(A.nameEl(r.n));li.appendChild(el('b',null,' +'+r.p));ol.appendChild(li);});c.appendChild(ol);return;}
  topBar(f('t_q',{i:P.i+1,n:P.n})+(P.phase==='q'?'':'')); gs.appendChild(c);
  var q=W.TRIVIA[P.qi],L=A.lang()==='en'?q.en:q.ar;
  var qq=el('p','s-mid tv-q',L[0]);qq.dir='auto';c.appendChild(qq);
  var g=el('div','tv-opts');L[1].forEach(function(o,i){var b=el('div','tv-o'+(P.phase==='a'?(i===P.correct?' ok':' no'):''));var kk=el('b','tv-k','!'+(i+1));kk.dir='ltr';b.appendChild(kk);var t=el('span','tv-t',o);t.dir='auto';b.appendChild(t);
    if(P.phase==='a')b.appendChild(el('span','tv-c',String(P.cnt[i])));g.appendChild(b);});c.appendChild(g);
  var foot=el('p','s-sub');
  if(P.phase==='q'){foot.appendChild(A.rich('span',null,A.t('t_how')));foot.appendChild(el('span',null,' · 🗳️ '+P.total));var tm=el('span','poll-t');tm.id='tvT';foot.appendChild(tm);}
  else{if(P.first){foot.appendChild(document.createTextNode(A.t('t_first')+' '));foot.appendChild(A.nameEl(P.first.n));foot.appendChild(document.createTextNode(' · '));}foot.appendChild(document.createTextNode(f('t_right',{n:P.right})));}
  c.appendChild(foot);tick();}
function tick(){var t=$('tvT');if(!t||!cur)return;t.textContent=' · '+Math.max(0,Math.ceil((cur.endsAt-Date.now())/1000))+A.t('seconds');}
setInterval(tick,250);
function changed(){var P=pub();draw(P);A.publish(P);if(!A.obs){$('tStop').disabled=S.phase==='idle';$('tNext').disabled=!(S.phase==='q'||S.phase==='a');$('tStart').disabled=S.phase==='q'||S.phase==='a';}}
if(!A.obs){$('tStart').addEventListener('click',start);$('tNext').addEventListener('click',function(){if(S.phase==='q')reveal();else next();});$('tStop').addEventListener('click',stop);}
A.onLang(function(){key='';if(cur)draw(cur);});A.onMirror(draw);
A.onDemo(function(){if(S.phase!=='q')return;A.clearLater();var q=W.TRIVIA[S.order[S.i]],i0=S.i;A.BOTS.slice(0,14).forEach(function(b,i){A.later(1200+Math.random()*(S.dur*1000-4000),function(){if(S.phase!=='q'||S.i!==i0)return;A.say('!'+(1+(Math.random()<.6?q.c:(Math.random()*4|0))),A.bot(i));});});});
changed();A.start();
})();
