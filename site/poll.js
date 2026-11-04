/* poll.js — shared chat-vote engine (used by Chat Vote and Most Likely). Chat votes !1..!N, one vote per user. */
(function(){
'use strict';
var A=window.App,C=A.C,$=A.$,el=A.el;
window.Poll=function(cfg){
  A.allowSolo();
  var S={phase:'idle',q:'',opts:[],votes:{},endsAt:0,dur:0,t:null,round:0};
  function topBar(gs,pill){var top=el('div','s-top');var lg=el('span','s-logo');lg.appendChild(el('b',null,'لَمّة'));lg.appendChild(el('i',null,'LAMMA'));top.appendChild(lg);if(pill)top.appendChild(el('span','s-pill',pill));gs.appendChild(top);}
  function counts(){var c=S.opts.map(function(){return 0});Object.keys(S.votes).forEach(function(u){c[S.votes[u]]++});return c}
  function start(q,opts,dur){
    clearTimeout(S.t);opts=(opts||[]).map(function(o){return String(o).trim().slice(0,60)}).filter(Boolean).slice(0,cfg.max||4);
    if(!q||opts.length<2)return false;
    S.q=String(q).slice(0,140);S.opts=opts;S.votes={};S.phase='live';S.round++;S.dur=dur||0;S.endsAt=dur?Date.now()+dur*1000:0;A.sfx('start');changed();A.poke();
    if(dur)S.t=setTimeout(end,dur*1000);return true;
  }
  function end(){if(S.phase!=='live')return;clearTimeout(S.t);S.phase='end';A.sfx('win');changed();if(cfg.onEnd)cfg.onEnd(S,counts());}
  function stop(){clearTimeout(S.t);S.phase='idle';changed();A.clearLater();}
  A.onChat(function(m){if(!A.runsEngine())return;var cmd=C.parseCmd(m.text);
    if(cmd&&A.isCtrl(m)){if(cfg.onCmd&&cfg.onCmd(cmd,api))return;if(cmd.cmd==='stop'){stop();return;}if(cmd.cmd==='end'){end();return;}}
    if(S.phase!=='live')return;var v=C.parseVote(m.text,S.opts.length);if(v<0)return;
    if(S.votes[m.user]===undefined||cfg.change){S.votes[m.user]=v;changed();}
  });
  function pub(){return {phase:S.phase,q:S.q,opts:S.opts,c:counts(),endsAt:S.endsAt,dur:S.dur,round:S.round,kind:cfg.kind}}
  var gs=$('gs'),cur=null,key='';
  function draw(P){cur=P;var k=JSON.stringify(P)+A.lang();if(k===key){tick();return;}key=k;A.clear(gs);
    var total=P.c.reduce(function(a,b){return a+b},0);topBar(gs,P.phase!=='idle'?('🗳️ '+total):'');
    var c=el('div','s-center poll');gs.appendChild(c);
    if(P.phase==='idle'){c.appendChild(el('div','big-ico',cfg.icon));c.appendChild(el('p','s-big',A.t(cfg.idle)));c.appendChild(el('p','s-sub',A.t(cfg.idleSub)));return;}
    var q=el('p','s-mid poll-q',P.q);q.dir='auto';c.appendChild(q);
    var mx=Math.max.apply(null,P.c);
    var list=el('div','bars');P.opts.forEach(function(o,i){var pct=total?Math.round(P.c[i]/total*100):0;
      var row=el('div','bar'+(P.phase==='end'&&P.c[i]===mx&&mx>0?' win':''));var k2=el('b','bar-k','!'+(i+1));k2.dir='ltr';row.appendChild(k2);
      var tr=el('div','bar-tr');var fill=el('i');fill.style.width=pct+'%';tr.appendChild(fill);var lab=el('span','bar-l',o);lab.dir='auto';tr.appendChild(lab);row.appendChild(tr);
      row.appendChild(el('span','bar-p',pct+'%'));list.appendChild(row);});
    c.appendChild(list);
    if(P.phase==='live'){var h=el('p','s-sub');h.appendChild(A.rich('span',null,A.t(cfg.how)));if(P.endsAt){var tm=el('span','poll-t');tm.id='pollT';h.appendChild(tm);}c.appendChild(h);}
    tick();}
  function tick(){var t=$('pollT');if(!t||!cur||!cur.endsAt)return;t.textContent=' · '+Math.max(0,Math.ceil((cur.endsAt-Date.now())/1000))+A.t('seconds');}
  setInterval(tick,250);
  function changed(){var P=pub();draw(P);A.publish(P);if(cfg.onChange)cfg.onChange(S);}
  A.onLang(function(){key='';if(cur)draw(cur);});A.onMirror(draw);
  A.onDemo(function(){if(S.phase!=='live')return;A.clearLater();var k=S.opts.length,r=S.round;A.BOTS.slice(0,16).forEach(function(b,i){A.later(600+i*500+Math.random()*400,function(){if(S.phase!=='live'||S.round!==r)return;var pick=Math.random()<.45?1:1+(Math.random()*k|0);A.say('!'+pick,A.bot(i));});});});
  var api={S:S,start:start,end:end,stop:stop,changed:changed,counts:counts};
  return api;
};
})();
