/* wheelopts.js — the wheel's options that the overlay must know too, as pure functions (used by wheel.js, tested in Node).
   - Shields are OFF by default ("إضافة شيلدات / Add shields" turns them on); without them nobody starts with a shield and no shield
     wording shows anywhere.
   - Timers (seconds, 0 = no limit): pick = kick-choice time, dur = spin duration (0 = spins until the streamer stops it),
     auto = next spin starts by itself after N s (0 = manual), join = joining closes N s after it opens (0 = stays open).
   - OBS link: "&tm=p20d6a7j0" (one letter + seconds per timer), "&sh=1" (shields on, with the start count), "&pk=0" (on-screen
     kick list off). Unknown / broken values fall back to the defaults.
   - pickerModel(P): what the on-screen kick list shows for a published wheel state (open or closed, the chooser, numbered cards). */
(function(root){
'use strict';
var DEF={sh:false,shStart:1,picker:true,pick:20,dur:6,auto:0,join:0,fs:6,fin:true,finTo:3,fa:false,vip:false,fd:true,ao:false,fx:5,at:'self'};
var LIM={pick:[3,600],dur:[2,120],auto:[1,600],join:[5,3600],fs:[2,60],fx:[1,600]};
var LET={pick:'p',dur:'d',auto:'a',join:'j',fs:'f'};
function clampT(k,v){v=Math.round(+v);if(!isFinite(v)||v<=0)return 0;var l=LIM[k];return Math.max(l[0],Math.min(l[1],v));}
function norm(o){o=o||{};var r={};for(var k in DEF)r[k]=DEF[k];
  if(o.sh!=null)r.sh=!!o.sh;if(o.shStart!=null){var s=Math.round(+o.shStart);r.shStart=isFinite(s)?Math.max(1,Math.min(3,s)):1;}
  if(o.picker!=null)r.picker=!!o.picker;
  if(o.fin!=null)r.fin=!!o.fin;if(o.finTo!=null){var ft=Math.round(+o.finTo);r.finTo=isFinite(ft)?Math.max(2,Math.min(9,ft)):3;}
  if(o.fa!=null)r.fa=!!o.fa;if(o.vip!=null)r.vip=!!o.vip;if(o.fd!=null)r.fd=!!o.fd;
  for(var t in LET)if(o[t]!=null)r[t]=clampT(t,o[t]);
  /* personal wheel «عجلة تلقائية»: on/off, the final's auto-spin seconds, what a time-out does */
  if(o.ao!=null)r.ao=!!o.ao;if(o.fx!=null)r.fx=clampT('fx',o.fx);if(o.at!=null&&/^(self|streamer|random|skip)$/.test(String(o.at)))r.at=String(o.at);
  return r;}
function encodeObs(o){o=norm(o);var tm='';for(var t in LET)tm+=LET[t]+o[t];
  return '&tm='+tm+(o.sh?'&sh='+o.shStart:'')+(o.picker?'':'&pk=0')+(o.fin?(o.finTo!==3?'&fn='+o.finTo:''):'&fn=0')+(o.fa?'&fa=1':'')+(o.vip?'&vp=1':'')+(o.fd?'':'&fd=0')+(o.ao?'&ao=1&fx='+o.fx+(o.at!=='self'?'&at='+o.at:''):'');}
/* get(name) reads a URL param (URLSearchParams.get bound, or a plain object lookup) */
function decodeObs(get){var o={};if(typeof get!=='function'){var src=get||{};get=function(k){return src[k]==null?null:String(src[k])};}
  var tm=get('tm');if(tm&&/^([pdajf]\d{1,4})+$/.test(tm)){var m,re=/([pdajf])(\d{1,4})/g;while((m=re.exec(tm))){for(var t in LET)if(LET[t]===m[1])o[t]=+m[2];}}
  var sh=get('sh');if(sh&&/^[1-3]$/.test(sh)){o.sh=true;o.shStart=+sh;}
  if(get('pk')==='0')o.picker=false;
  var fn=get('fn');if(fn==='0')o.fin=false;else if(fn&&/^[2-9]$/.test(fn)){o.fin=true;o.finTo=+fn;}
  if(get('ao')==='1')o.ao=true;var fx=get('fx');if(fx!=null&&/^\d{1,4}$/.test(fx))o.fx=+fx;var at=get('at');if(at)o.at=at;
  if(get('fa')==='1')o.fa=true;if(get('vp')==='1')o.vip=true;if(get('fd')==='1')o.fd=true;else if(get('fd')==='0')o.fd=false;
  return norm(o);}
function entryShields(o){o=norm(o);return o.sh?o.shStart:0}
/* P = wheel.js pub(): entries [[name,colour,shields,login]], mode, phase, chooser {n,c,u}, spin, picker, sh */
function pickerModel(P){
  var open=!!(P&&P.mode==='elim'&&P.picker!==false&&P.phase==='choose'&&P.chooser&&!P.spin);
  if(!open)return {open:false,cards:[]};
  var cards=[];(P.entries||[]).forEach(function(e,i){if(e[0]!==P.chooser.n)cards.push({no:i+1,n:e[0],c:e[1]||'',sh:P.sh?(e[2]|0):0,u:e[3]||''});});
  return {open:true,chooser:P.chooser,cards:cards,timed:(P.pick|0)>0,streamerPicks:!!P.streamerPicks};
}
/* ---------- the FINAL: when 2 are left on the pick wheel (and "النهائي" is on) it becomes a first-to-N match (default 3 = best of 5).
   No kicks: the streamer spins each round, every landing is +1 for that player. F = {p:[{n,c,u},{n,c,u}], s:[a,b], to, w (-1 = going), last, at} */
/* started: false while nobody has been eliminated yet (2 joined ≠ a final) */
function finalOn(mode,n,o,started){o=norm(o);return mode==='elim'&&o.fin&&n===2&&started!==false}
function finalStart(entries,to){var t=Math.max(2,Math.min(9,Math.round(+to)||3));
  return {p:entries.slice(0,2).map(function(e){return {n:e.n,c:e.c||'',u:e.u||''}}),s:[0,0],to:t,w:-1,last:-1,at:0};}
function finalSame(F,entries){return !!(F&&entries&&entries.length===2&&F.p.length===2&&
  ((F.p[0].n===entries[0].n&&F.p[1].n===entries[1].n)||(F.p[0].n===entries[1].n&&F.p[1].n===entries[0].n)));}
function finalPoint(F,name,now){if(!F||F.w>=0)return F;var i=F.p[0].n===name?0:(F.p[1].n===name?1:-1);if(i<0)return F;
  var G={p:F.p,s:F.s.slice(),to:F.to,w:-1,last:i,at:now||0};G.s[i]++;if(G.s[i]>=G.to)G.w=i;return G;}
function finalRound(F){return F?Math.min(F.s[0]+F.s[1]+(F.w>=0?0:1),F.to*2-1):0}
/* what the scoreboard shows: match point = someone is one landing away (and nobody has won yet) */
function finalModel(F){if(!F)return {open:false};var mp=[F.w<0&&F.s[0]===F.to-1,F.w<0&&F.s[1]===F.to-1];
  return {open:true,p:F.p,s:F.s,to:F.to,round:finalRound(F),mp:mp,anyMp:mp[0]||mp[1],won:F.w,last:F.last,at:F.at};}
var api={DEF:DEF,finalOn:finalOn,finalStart:finalStart,finalSame:finalSame,finalPoint:finalPoint,finalRound:finalRound,finalModel:finalModel,LIM:LIM,clampT:clampT,norm:norm,encodeObs:encodeObs,decodeObs:decodeObs,entryShields:entryShields,pickerModel:pickerModel};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.LammaWheelOpts=api;
})(typeof window!=='undefined'?window:globalThis);
