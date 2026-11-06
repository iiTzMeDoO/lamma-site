/* chain.js — سلسلة كلمات / Word chain. Each word starts with the last letter of the previous one. */
(function(){
'use strict';
var A=window.App,C=A.C,W=window.Words,$=A.$,el=A.el;
A.allowSolo();
A.strings({ar:{g_title:'سلسلة كلمات',g_how:'كل كلمة لازم تبلش بآخر حرف من الكلمة اللي قبلها، وما في تكرار. أول واحد بيكمّل السلسلة بياخد نقطة.',ch_lang:'اللغة',ar_only:'عربي',en_only:'English',ch_time:'وقت كل كلمة (ث)',
  ch_start:'ابدأ السلسلة',ch_undo:'ارفض آخر كلمة',ch_tip:'الموقع ما بيعرف إذا الكلمة حقيقية، فإذا حدا كتب كلام فاضي اضغط "ارفض آخر كلمة". "ال" بالبداية ما بتنحسب، والـ ة بتمشي ت أو ه.',
  ch_idle:'سلسلة كلمات',ch_idle_s:'كل كلمة بتبلش بآخر حرف من اللي قبلها',ch_next:'الكلمة الجاية لازم تبلش بـ',ch_len:'طول السلسلة',ch_end:'انقطعت السلسلة!',ch_final:'{n} كلمة',ch_cmd_word:'اكتب كلمة',ch_cmd_start:'سلسلة جديدة',c_cmd_stop:'وقّف'},
 en:{g_title:'Word Chain',g_how:'Each word must start with the last letter of the previous one, no repeats. The first chatter to continue the chain gets a point.',ch_lang:'Language',ar_only:'Arabic',en_only:'English',ch_time:'Time per word (s)',
  ch_start:'Start the chain',ch_undo:'Reject last word',ch_tip:'The site can\'t tell if a word is real, so press "Reject last word" for nonsense. A leading "ال" is ignored in Arabic, and ة counts as ت or ه.',
  ch_idle:'Word Chain',ch_idle_s:'Each word starts with the last letter of the one before',ch_next:'Next word must start with',ch_len:'Chain length',ch_end:'The chain broke!',ch_final:'{n} words',ch_cmd_word:'type a word',ch_cmd_start:'new chain',c_cmd_stop:'stop'}});
var S={phase:'idle',chain:[],used:{},endsAt:0,dur:15,lang:'ar',t:null,lastUser:''};
function script(w){return /[\u0600-\u06FF]/.test(w)?'ar':'en'}
function start(){clearTimeout(S.t);S.lang=A.obs?'ar':$('chnLang').value;S.dur=A.obs?15:+$('chnTime').value;var l=W.FAST[S.lang];var w=l[Math.random()*l.length|0];
  S.chain=[{w:w,n:'',u:''}];S.used={};S.used[C.normalize(w)]=1;S.lastUser='';S.phase='live';A.roundStart();A.sfx('start');arm();}
function arm(){clearTimeout(S.t);S.endsAt=Date.now()+S.dur*1000;changed();S.t=setTimeout(function(){if(S.phase==='live'){S.phase='end';A.roundEnd({players:S.chain.filter(function(x){return x.u}).map(function(x){return [x.u,x.n]})});A.sfx('bad');changed();}},S.dur*1000);}
function undo(){if(S.chain.length<2)return;var x=S.chain.pop();delete S.used[C.normalize(x.w)];if(x.u)A.award(x.u,x.n,-1);S.lastUser='';if(S.phase==='end')S.phase='live';arm();}
function stop(){clearTimeout(S.t);if(S.phase==='live')A.roundEnd({players:S.chain.filter(function(x){return x.u}).map(function(x){return [x.u,x.n]})});S.phase='idle';changed();}
A.onChat(function(m){if(!A.runsEngine())return;var cmd=C.parseCmd(m.text);
  if(cmd&&A.isCtrl(m)){if(cmd.cmd==='chain'){start();return;}if(cmd.cmd==='stop'){stop();return;}if(cmd.cmd==='undo'){undo();return;}}
  if(S.phase!=='live'||cmd)return;
  var toks=C.tokens(m.text);if(toks.length!==1)return;var w=toks[0];if(Array.from(w).length<2||/\d/.test(w))return;
  if(script(w)!==S.lang||S.used[C.normalize(w)]||m.user===S.lastUser)return;
  if(!C.chainOk(S.chain[S.chain.length-1].w,w))return;
  S.chain.push({w:w,n:m.name,u:m.user,c:m.color});S.used[C.normalize(w)]=1;S.lastUser=m.user;A.award(m.user,m.name,1);A.sfx('pop');arm();});
function pub(){var last=S.chain[S.chain.length-1];return {phase:S.phase,chain:S.chain.slice(-7).map(function(x){return [x.w,x.n,x.c||'']}),len:S.chain.length,next:last?C.lastLetter(last.w):'',endsAt:S.endsAt,dur:S.dur}}
var gs=$('gs'),cur=null,key='';
function draw(P){cur=P;var k=JSON.stringify(P)+A.lang();if(k===key){tick();return;}key=k;A.clear(gs);
  var top=el('div','s-top');var lg=el('span','s-logo');lg.appendChild(el('b',null,'لَمّة'));lg.appendChild(el('i',null,'LAMMA'));top.appendChild(lg);if(P.phase!=='idle')top.appendChild(el('span','s-pill',A.t('ch_len')+': '+P.len));gs.appendChild(top);
  var c=el('div','s-center');gs.appendChild(c);
  if(P.phase==='idle'){c.appendChild(el('div','big-ico','🔗'));c.appendChild(el('p','s-big',A.t('ch_idle')));c.appendChild(el('p','s-sub',A.t('ch_idle_s')));return;}
  var row=el('div','chain-row');P.chain.forEach(function(x,i){var b=el('div','ln'+(i===P.chain.length-1?' cur':''));var w=el('b',null,x[0]);w.dir='auto';b.appendChild(w);if(x[1])b.appendChild(A.nameEl(x[1],x[2]));row.appendChild(b);});
  c.appendChild(row);
  if(P.phase==='live'){var nx=el('p','s-sub');nx.appendChild(document.createTextNode(A.t('ch_next')+' '));var L=el('b','ch-letter',P.next.replace('\u0647','ه / ة'));L.dir='auto';nx.appendChild(L);c.appendChild(nx);
    var bar=el('div','tbar');var i2=el('i');i2.id='chnBar';bar.appendChild(i2);c.appendChild(bar);}
  else{c.appendChild(el('p','s-big',A.t('ch_end')));c.appendChild(el('p','s-mid',A.t('ch_final').replace('{n}',P.len)));}
  tick();}
function tick(){var b=$('chnBar');if(!b||!cur)return;var p=Math.max(0,(cur.endsAt-Date.now())/(cur.dur*1000));b.style.width=(p*100)+'%';b.classList.toggle('low',p<.3);}
setInterval(tick,100);
function changed(){var P=pub();draw(P);A.publish(P);if(!A.obs){$('chnStop').disabled=S.phase==='idle';$('chnUndo').disabled=S.chain.length<2||S.phase==='idle';$('chnStart').textContent=A.t('ch_start');}}
if(!A.obs){$('chnStart').addEventListener('click',start);$('chnUndo').addEventListener('click',undo);$('chnStop').addEventListener('click',stop);}
A.onLang(function(){key='';if(cur)draw(cur);});A.onMirror(draw);
changed();A.start();
})();
