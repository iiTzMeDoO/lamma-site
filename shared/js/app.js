/* app.js — shared runtime for لَمّة | Lamma: language, channel, anonymous Twitch chat,
   leaderboard, control→overlay sync, sounds. Every game page loads core.js, words.js, app.js, then its own file. */
(function(){
'use strict';
var C=window.ChatCore;
var Q=new URLSearchParams(location.search);
var LS={get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
/* one-time migration: keys were "allin1-*" before the rename to Lamma; copy them so settings/leaderboards carry over */
(function(){try{var ks=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('allin1-')===0)ks.push(k)}ks.forEach(function(k){var nk='lamma-'+k.slice(7);if(localStorage.getItem(nk)==null)localStorage.setItem(nk,localStorage.getItem(k))})}catch(e){}})();
var qCh=C.safeChannel(Q.get('channel'));
/* signed in with Twitch → your own channel is the default (set from the session, never typed). ?channel= still opens a
   channel read-only for overlays / viewer links; the control panel stays locked to that channel's owner (auth.js + gate.js). */
var sessCh=(function(){try{var s=JSON.parse(localStorage.getItem('lamma-session')||'null');if(s&&s.provider==='twitch'&&(!s.exp||Date.now()<s.exp))return C.safeChannel(s.login)}catch(e){}return ''})();
if(sessCh&&document.body&&document.body.classList.contains('hub'))qCh=''; /* the home page always shows your own channel */
if(qCh)LS.set('lamma-channel',qCh);
var CHANNEL=qCh||sessCh||C.safeChannel(LS.get('lamma-channel',''))||'iitzmedoo';
var OBS=Q.get('obs')==='1';
var GAME=document.body.getAttribute('data-game')||'';
if(OBS){document.documentElement.classList.add('obs');}

/* ---------- tiny DOM helpers ---------- */
function $(id){return document.getElementById(id)}
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function clear(e){while(e&&e.firstChild)e.removeChild(e.firstChild);return e}
function readable(c){
  if(!/^#[0-9a-f]{6}$/i.test(c||''))return '';
  var r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16),l=.299*r+.587*g+.114*b;
  if(l<120){var f=120/Math.max(l,1);r=Math.min(255,r*f+50|0);g=Math.min(255,g*f+50|0);b=Math.min(255,b*f+50|0);}
  return 'rgb('+r+','+g+','+b+')';
}
/* A username, always as text inside <bdi> so mixed Arabic/English names never jumble. */
function nameEl(name,color,cls){var s=el('span','nm'+(cls?' '+cls:''));var b=el('bdi',null,String(name||''));s.appendChild(b);var c=readable(color);if(c)s.style.color=c;return s}

/* One chat command as <bdi dir="ltr"> (isolated left-to-right, so "!join" never turns into "join!" in an RTL line); the "!" is its own
   span with a hair of space after it, so it never sits on the "j" and reads clearly as the first character. */
function cmdEl(cls,part){var b=el('bdi',cls);var s=String(part);b.dir=/^![\u0600-\u06FF]/.test(s)?'rtl':'ltr'; /* an Arabic command reads right-to-left with its "!" first (on the right); an English one left-to-right */if(s.charAt(0)==='!'){b.appendChild(el('span','bang','!'));s=s.slice(1);}b.appendChild(document.createTextNode(s));return b}
/* Text with chat commands: "!join" stays left-to-right inside Arabic sentences (textContent only, never HTML). */
function setRich(e,text){
  clear(e);String(text).split(/(![A-Za-z0-9_\u0600-\u06FF]+(?: (?:[A-Za-z]+|N|\d+))?)/).forEach(function(part,i){
    if(!part)return;if(i%2)e.appendChild(cmdEl('cmd',part));else e.appendChild(document.createTextNode(part));});
  return e;
}
function rich(tag,cls,text){return setRich(el(tag,cls),text)}
/* Site-wide: any chat command typed into a text node ("!join", "!طرد", "!1") is isolated left-to-right, so in an Arabic
   sentence (or a chat line in the RTL feed) the "!" stays in front of the word instead of jumping to its end. */
var CMD_RE=/![A-Za-z0-9_\u0600-\u06FF]+/;var CMD_SPLIT=/(![A-Za-z0-9_\u0600-\u06FF]+)/;
function skipCmd(p){return !p||!!p.closest('bdi[dir=ltr],bdi[dir=rtl].cmd,bdi[dir=rtl].cmd-i,[dir=ltr],script,style,textarea,input,select,option,canvas,svg,title')}
function fixCmdText(n){
  if(!n||n.nodeType!==3||!CMD_RE.test(n.nodeValue)||skipCmd(n.parentElement))return;
  var f=document.createDocumentFragment();n.nodeValue.split(CMD_SPLIT).forEach(function(part,i){if(!part)return;if(i%2)f.appendChild(cmdEl('cmd-i',part));else f.appendChild(document.createTextNode(part))});
  n.parentNode.replaceChild(f,n);
}
function fixCmds(root){
  if(!root)return;if(root.nodeType===3)return fixCmdText(root);if(root.nodeType!==1||skipCmd(root))return;
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),list=[],x;while((x=w.nextNode()))if(CMD_RE.test(x.nodeValue))list.push(x);list.forEach(fixCmdText);
}
function watchCmds(){
  fixCmds(document.body);if(!window.MutationObserver)return;
  new MutationObserver(function(ms){ms.forEach(function(m){if(m.type==='characterData')fixCmdText(m.target);else for(var i=0;i<m.addedNodes.length;i++)fixCmds(m.addedNodes[i]);})})
    .observe(document.body,{childList:true,subtree:true,characterData:true});
}
/* ---------- language ---------- */
var T={ar:{},en:{}};
var BASE={
 ar:{brand_sub:'كل ألعاب الشات في مكان واحد',skip:'تخطَّ إلى المحتوى',sound:'صوت',lang_btn:'EN',all_games:'كل الألعاب',all_wheels:'كل العجلات',all_battle:'كل المعركة',
  conn_connecting:'يتصل…',conn_connected:'متصل',conn_error:'انقطع، يعيد المحاولة…',conn_bad:'اسم قناة خاطئ',
  chat_feed:'الشات',feed_empty:'رسائل الشات تظهر هنا',lb:'الترتيب',lb_empty:'لم يفز أحد بعد',reset:'تصفير',reset_q:'هل تريد حقًا تصفير الترتيب لهذه القناة؟',pts:'نقطة',
  obs_title:'رابط OBS',obs_help:'ضع هذا الرابط كـ Browser Source في OBS (1920×1080). الرابط لا يعرض أي سر: لا الكلمة ولا المفتاح.',copy:'نسخ',copied:'تم النسخ ✓',
  obs_dock:'اجعل هذه الصفحة نفسها Custom Browser Dock داخل OBS (Docks ← Custom Browser Docks) حتى يعمل الأوفرلي معك خطوة بخطوة.',
  cmds:'أوامر الشات',cmds_mod:'للستريمر والمشرفين',cmds_all:'للجميع',
  waiting_ctrl:'بانتظار لوحة التحكم',footer:'للتسلية فقط — بلا مراهنات وبلا أموال حقيقية. يُقرأ الشات قراءةً فقط، دون أي تسجيل دخول.',
  winner:'الفائز',start:'ابدأ',stop:'أوقف',next:'التالي',skip_btn:'تخطّي',seconds:'ث',players:'لاعب',round:'جولة',timeup:'انتهى الوقت!',
  live:'مباشر',offline:'أوفلاين'},
 en:{brand_sub:'All your chat games in one place',skip:'Skip to content',sound:'Sound',lang_btn:'ع',all_games:'All games',all_wheels:'All wheels',all_battle:'All battle modes',
  conn_connecting:'Connecting…',conn_connected:'Connected',conn_error:'Disconnected, retrying…',conn_bad:'Invalid channel',
  chat_feed:'Chat',feed_empty:'Chat messages show up here',lb:'Leaderboard',lb_empty:'No winners yet',reset:'Reset',reset_q:'Reset the leaderboard for this channel?',pts:'pts',
  obs_title:'OBS link',obs_help:'Add this link as a Browser Source in OBS (1920×1080). It never shows a secret: not the word, not the key.',copy:'Copy',copied:'Copied ✓',
  obs_dock:'Run this control page as a Custom Browser Dock inside OBS (Docks → Custom Browser Docks) so the overlay follows you step by step.',
  cmds:'Chat commands',cmds_mod:'Streamer & mods',cmds_all:'Everyone',
  waiting_ctrl:'Waiting for the control panel',footer:'Just for fun — no betting, no real money. Chat is read-only, no login needed.',
  winner:'Winner',start:'Start',stop:'Stop',next:'Next',skip_btn:'Skip',seconds:'s',players:'players',round:'Round',timeup:'Time\'s up!',
  live:'Live',offline:'Offline'}
};
function strings(o){['ar','en'].forEach(function(l){var s=o[l]||{};for(var k in s)T[l][k]=s[k];});}
strings(BASE);
var lang=(Q.get('lang')==='en'||Q.get('lang')==='ar')?Q.get('lang'):LS.get('lamma-lang','ar');
function t(k){return (T[lang]&&T[lang][k]!=null)?T[lang][k]:(T.ar[k]!=null?T.ar[k]:k)}
var langFns=[];
function applyLang(){
  var h=document.documentElement;h.lang=lang;h.dir=lang==='ar'?'rtl':'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function(e){var k=e.getAttribute('data-i18n');if(T[lang][k]!=null)setRich(e,T[lang][k]);});
  document.querySelectorAll('[data-i18n-ph]').forEach(function(e){var k=e.getAttribute('data-i18n-ph');if(T[lang][k]!=null)e.placeholder=T[lang][k];});
  document.querySelectorAll('[data-i18n-aria]').forEach(function(e){var k=e.getAttribute('data-i18n-aria');if(T[lang][k]!=null)e.setAttribute('aria-label',T[lang][k]);});
  var tt=document.body.getAttribute('data-title-'+lang);if(tt)document.title=tt;
  var b=$('langBtn');if(b){b.textContent=t('lang_btn');b.setAttribute('aria-label',lang==='ar'?'Switch to English':'التبديل للعربية');}
  setConn(connState);renderBoard();updateObsUrl();
  langFns.forEach(function(f){try{f(lang)}catch(e){console.error(e)}});
}
function setLang(l){lang=l;LS.set('lamma-lang',l);applyLang();}

/* ---------- connection status ---------- */
var connState='connecting';
function setConn(s){
  connState=s;var c=$('conn');if(!c)return;c.setAttribute('data-state',s);
  var tx=$('connTxt');if(tx)tx.textContent=t('conn_'+s);
}

/* ---------- chat bus ---------- */
var chatFns=[],stats={received:0,parsed:0,last:''};
function onChat(f){chatFns.push(f)}
function dispatch(m){
  stats.parsed++;stats.last=m.name+': '+m.text;
  pushFeed(m);
  if(window.LammaLevels)try{LammaLevels.chat(m)}catch(e){}
  for(var i=0;i<chatFns.length;i++){try{chatFns[i](m)}catch(e){console.error(e)}}
}
function isCtrl(m){return !!(m&&(m.mod||m.broadcaster||m.host))}

/* ---------- anonymous read-only Twitch IRC ---------- */
var ws=null,retry=0,retryT=null;
function connect(){
  clearTimeout(retryT);setConn('connecting');
  try{ws=new WebSocket('wss://irc-ws.chat.twitch.tv:443');}catch(e){setConn('error');scheduleRetry();return;}
  var sock=ws;
  sock.onopen=function(){
    sock.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
    sock.send('PASS SCHMOOPIIE');
    sock.send('NICK justinfan'+(10000+(Math.random()*80000|0)));
    sock.send('JOIN #'+CHANNEL);
  };
  sock.onmessage=function(ev){
    if(sock!==ws)return;
    String(ev.data).split('\r\n').forEach(function(line){
      if(!line)return;
      if(line.indexOf('PING')===0){sock.send('PONG'+line.slice(4));return;}
      var p=C.parseLine(line);if(!p)return;
      if(p.command==='JOIN'||p.command==='366'||p.command==='ROOMSTATE'){if(connState!=='connected'){retry=0;setConn('connected');}return;}
      if(p.command==='RECONNECT'){try{sock.close()}catch(e){}return;}
      if(p.command==='PRIVMSG'){stats.received++;var m=C.toChat(p);if(m)dispatch(m);}
    });
  };
  sock.onclose=function(){if(sock!==ws)return;ws=null;setConn('error');scheduleRetry();};
  sock.onerror=function(){};
}
function scheduleRetry(){clearTimeout(retryT);retry=Math.min(retry+1,6);retryT=setTimeout(connect,Math.min(30000,1000*Math.pow(2,retry)));}

/* ---------- live feed ---------- */
function pushFeed(m){
  var ul=$('feed');if(!ul)return;
  var li=el('li');li.appendChild(nameEl(m.name,m.color));
  if(m.mod||m.broadcaster){var bd=el('span','badge',m.broadcaster?'📺':'🛡️');li.insertBefore(bd,li.firstChild);}
  li.appendChild(document.createTextNode(': '));li.appendChild(el('bdi','tx',m.text));
  ul.insertBefore(li,ul.firstChild);while(ul.children.length>40)ul.removeChild(ul.lastChild);
  var fe=$('feedEmpty');if(fe)fe.hidden=true;
}

/* ---------- leaderboard (localStorage, per channel) ---------- */
var LBKEY='lamma-lb-'+CHANNEL;
function loadBoard(){try{return JSON.parse(LS.get(LBKEY,'{}'))||{}}catch(e){return {}}}
function award(user,name,pts){if(!user)return;var b=C.addPoint(loadBoard(),user,name,pts==null?1:pts);LS.set(LBKEY,JSON.stringify(b));renderBoard();xpWin(user,name,pts==null?1:pts);}
/* levels (levels.js): every game's winners already pass through award(); rounds are marked with roundStart / roundEnd */
function lv(){return window.LammaLevels||null}
function xpWin(user,name,pts){var l=lv();if(l&&pts>0)try{l.win(user,name,pts)}catch(e){console.error(e)}}
function xpPlay(user,name){var l=lv();if(l)try{l.played(user,name)}catch(e){console.error(e)}}
function roundStart(){var l=lv();if(l)try{l.roundStart()}catch(e){console.error(e)}}
function roundEnd(o){var l=lv();if(l)try{l.roundEnd(o)}catch(e){console.error(e)}}
function top(n){return C.topN(loadBoard(),n||10)}
function renderBoard(){
  var ol=$('lb');if(!ol)return;clear(ol);var rows=top(10);
  rows.forEach(function(r,i){var li=el('li');li.appendChild(el('span','rk',String(i+1)));li.appendChild(nameEl(r.name));var l=lv(),lvl=l?l.localLevel('twitch:'+r.user):0;if(lvl)li.appendChild(l.badge(lvl));li.appendChild(el('span','pt',r.pts+' '+t('pts')));ol.appendChild(li);});
  var e=$('lbEmpty');if(e)e.hidden=rows.length>0;
}
window.addEventListener('storage',function(e){if(e.key===LBKEY)renderBoard();});

/* ---------- control → overlay sync (same browser profile: OBS dock + browser source, or two tabs) ---------- */
var BC=null;try{BC=new BroadcastChannel('lamma-'+CHANNEL+'-'+GAME)}catch(e){}
var SKEY='lamma-sync-'+CHANNEL+'-'+GAME;
var lastPub=null,pubT=0,lsT=null,mirrorFns=[],modeFns=[],lastMirrorAt=0,mode=OBS?'waiting':'control',soloOk=false;
function publish(state){
  if(OBS)return; // an overlay never publishes
  lastPub={g:GAME,s:state,t:Date.now()};
  try{BC&&BC.postMessage(lastPub)}catch(e){}
  if(!lsT){lsT=setTimeout(function(){lsT=null;LS.set(SKEY,JSON.stringify(lastPub));},250);}
}
function onMirror(f){mirrorFns.push(f)}
function onMode(f){modeFns.push(f)}
function setMode(m){if(m===mode)return;mode=m;document.documentElement.setAttribute('data-mode',m);modeFns.forEach(function(f){try{f(m)}catch(e){console.error(e)}});var w=$('waitCtrl');if(w)w.hidden=(m!=='waiting');}
function gotMirror(msg){
  if(!OBS||!msg||msg.g!==GAME)return;
  lastMirrorAt=Date.now();if(mode!=='mirror')setMode('mirror');
  mirrorFns.forEach(function(f){try{f(msg.s)}catch(e){console.error(e)}});
}
if(OBS){
  if(BC)BC.onmessage=function(e){gotMirror(e.data)};
  window.addEventListener('storage',function(e){if(e.key===SKEY&&e.newValue){try{var m=JSON.parse(e.newValue);if(Date.now()-m.t<5000)gotMirror(m)}catch(x){}}});
  setInterval(function(){
    if(mode==='mirror'&&Date.now()-lastMirrorAt>6000)setMode(soloOk?'solo':'waiting');
    if(mode==='waiting'&&soloOk&&Date.now()-bootAt>3000)setMode('solo');
  },1000);
}else{
  setInterval(function(){if(lastPub){lastPub.t=Date.now();try{BC&&BC.postMessage(lastPub)}catch(e){}LS.set(SKEY,JSON.stringify(lastPub));}},1500);
}
var bootAt=Date.now();
/* games that can run on their own inside OBS (driven by mod chat commands) call allowSolo() */
function allowSolo(){soloOk=true;}
function runsEngine(){return mode==='control'||mode==='solo'}

/* ---------- sounds (WebAudio, no files) ---------- */
var AC=null,soundOn=OBS?Q.get('sound')==='1':LS.get('lamma-sound','1')==='1';
/* Nov 4 (Mohammad #14): fuller sounds — a master bus with a compressor (no clipping when hits stack), noise for hits and
   explosions, a resume of the audio engine after the browser suspends it (that was "sounds sometimes disappear"), and a short
   per-sound spacing so a burst of events doesn't turn into one loud click. */
var BUS=null,NOISE=null,lastSfx={};
function ac(){if(!soundOn)return null;try{if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();var comp=AC.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.2;
    BUS=AC.createGain();BUS.gain.value=.9;BUS.connect(comp);comp.connect(AC.destination);
    var len=AC.sampleRate*1,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);for(var i=0;i<len;i++)d[i]=Math.random()*2-1;NOISE=buf;}
  if(AC.state==='suspended'&&AC.resume)AC.resume();return AC;}catch(e){return null;}}
['pointerdown','keydown'].forEach(function(ev){document.addEventListener(ev,function(){if(AC&&AC.state==='suspended')AC.resume();},true);});
document.addEventListener('visibilitychange',function(){if(!document.hidden&&AC&&AC.state==='suspended')AC.resume();});
function tone(f,d,type,vol,when,f2){var a=ac();if(!a)return;try{var o=a.createOscillator(),g=a.createGain();o.type=type||'square';var t0=a.currentTime+(when||0);o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t0+d);
  g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol||.05,t0+.008);g.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(g);g.connect(BUS);o.start(t0);o.stop(t0+d+.03);}catch(e){}}
function noise(d,vol,when,lp,hp){var a=ac();if(!a||!NOISE)return;try{var s=a.createBufferSource();s.buffer=NOISE;var f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=lp||1800;var g=a.createGain();var t0=a.currentTime+(when||0);
  g.gain.setValueAtTime(vol||.1,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);var last=f;if(hp){var h=a.createBiquadFilter();h.type='highpass';h.frequency.value=hp;f.connect(h);last=h;}s.connect(f);last.connect(g);g.connect(BUS);s.start(t0,Math.random()*.5);s.stop(t0+d+.05);}catch(e){}}
var SFX={
 tick:function(){tone(1500,.035,'square',.025)},
 pop:function(){noise(.07,.16,0,2600,400);tone(220,.09,'triangle',.09,0,110)},
 start:function(){tone(523,.12,'square',.05);tone(659,.12,'square',.05,.1);tone(784,.2,'square',.055,.2)},
 win:function(){[523,659,784,1046].forEach(function(f,i){tone(f,.22,'square',.05,i*.12);tone(f/2,.22,'triangle',.05,i*.12)});tone(1318,.5,'triangle',.05,.5)},
 boom:function(){noise(.7,.32,0,900);tone(110,.55,'sine',.22,0,38);noise(.25,.12,.02,4000,1200)},
 bad:function(){tone(330,.16,'sawtooth',.05,0,220);tone(196,.32,'sawtooth',.05,.15,110)},
 go:function(){noise(.18,.08,0,3000,700);tone(660,.1,'square',.04,.02,990)},
 crit:function(){noise(.09,.2,0,5000,900);tone(1200,.12,'square',.05,0,600);tone(160,.16,'triangle',.12,0,70)},
 heal:function(){[784,988,1175].forEach(function(f,i){tone(f,.14,'sine',.05,i*.07)})},
 power:function(){tone(300,.35,'sawtooth',.05,0,1200);noise(.3,.08,.05,6000,2000)}
};
function sfx(n){var now=Date.now();if(lastSfx[n]&&now-lastSfx[n]<45)return;lastSfx[n]=now;if(SFX[n])SFX[n]()}
function setSound(on){soundOn=!!on;if(!OBS)LS.set('lamma-sound',on?'1':'0');var b=$('soundBtn');if(b){b.setAttribute('aria-pressed',String(soundOn));b.textContent=soundOn?'🔊':'🔇';}}

/* ---------- confetti ---------- */
function confetti(host,n){
  host=host||$('stage');if(!host)return;var box=el('div','confetti');var cols=['#b98aff','#22e6ff','#ff3dac','#b6ff3b','#ffd23d','#ffffff'];
  for(var i=0;i<(n||70);i++){var p=el('i');p.style.left=(Math.random()*100)+'%';p.style.background=cols[i%cols.length];p.style.animationDelay=(Math.random()*.6)+'s';p.style.animationDuration=(1.6+Math.random()*1.4)+'s';p.style.transform='rotate('+(Math.random()*360)+'deg)';box.appendChild(p);}
  host.appendChild(box);setTimeout(function(){if(box.parentNode)box.parentNode.removeChild(box)},3500);
}

/* ---------- OBS link card ---------- */
function obsUrl(extra){var u=location.origin+location.pathname+'?obs=1&channel='+encodeURIComponent(CHANNEL)+(lang==='en'?'&lang=en':'')+(extra||'');return u}
/* modules add their own OBS params (layout, background…) with A.obsExtra(fn); fn returns e.g. '&bg=0' */
var obsExtras=[];
function obsExtrasStr(){return obsExtras.map(function(f){try{return f()||''}catch(e){return ''}}).join('')}
function updateObsUrl(){var i=$('obsUrl');if(i&&!OBS)i.value=obsUrl(obsExtrasStr());}
function obsExtra(fn){obsExtras.push(fn);updateObsUrl()}
function copyText(s,btn){
  function ok(){if(btn){var o=btn.textContent;btn.textContent=t('copied');setTimeout(function(){btn.textContent=t('copy')},1400);}}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).then(ok,function(){fallback()});else fallback();
  function fallback(){var ta=el('textarea');ta.value=s;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(e){}document.body.removeChild(ta);}
}

/* ---------- live pill on the hub ---------- */
var CID='kimne78kx3ncx6brgo4mv6wki5h1ko';
function channelInfo(ch,cb){
  if(!window.fetch)return cb(null);
  fetch('https://gql.twitch.tv/gql',{method:'POST',headers:{'Client-ID':CID,'Content-Type':'text/plain;charset=UTF-8'},
    body:JSON.stringify({query:'query{user(login:"'+ch+'"){displayName profileImageURL(width:70) stream{id viewersCount game{displayName}}}}'})})
  .then(function(r){return r.json()}).then(function(j){cb(j&&j.data?j.data.user:null)}).catch(function(){cb(null)});
}

/* ---------- boot ---------- */
function fitStage(){
  var st=$('stage');if(!st)return;
  function fit(){var w=st.clientWidth||960;st.style.fontSize=Math.max(6.5,w/60)+'px';}
  fit();if(window.ResizeObserver)new ResizeObserver(fit).observe(st);else window.addEventListener('resize',fit);
}
function boot(){
  if(OBS){
    // An overlay never carries control panels or secret elements: remove them from the DOM entirely.
    document.querySelectorAll('.ctrl-only,.secret,#side,header.top,.gp-head,footer,.skip').forEach(function(n){if(n.parentNode)n.parentNode.removeChild(n)});
  }
  var lb=$('langBtn');if(lb)lb.addEventListener('click',function(){setLang(lang==='ar'?'en':'ar')});
  var sb=$('soundBtn');if(sb)sb.addEventListener('click',function(){setSound(!soundOn)});setSound(soundOn);
  var rs=$('lbReset');if(rs)rs.addEventListener('click',function(){if(confirm(t('reset_q'))){LS.set(LBKEY,'{}');renderBoard();}});
  var cb=$('obsCopy');if(cb)cb.addEventListener('click',function(){copyText($('obsUrl').value,cb)});
  document.querySelectorAll('[data-chan]').forEach(function(n){n.textContent='#'+CHANNEL});
  document.querySelectorAll('a[data-keep]').forEach(function(a){if(qCh){a.href=a.getAttribute('href')+(a.getAttribute('href').indexOf('?')<0?'?':'&')+'channel='+CHANNEL;}});
  var y=$('year');if(y)y.textContent=new Date().getFullYear();
  document.documentElement.setAttribute('data-mode',mode);
  fitStage();
  applyLang();
  watchCmds();
}

window.App={C:C,Q:Q,$:$,el:el,rich:rich,setRich:setRich,clear:clear,nameEl:nameEl,readable:readable,strings:strings,t:t,lang:function(){return lang},onLang:function(f){langFns.push(f)},setLang:setLang,
  channel:CHANNEL,obs:OBS,game:GAME,onChat:onChat,dispatch:dispatch,isCtrl:isCtrl,stats:stats,
  award:award,top:top,xpWin:xpWin,xpPlay:xpPlay,roundStart:roundStart,roundEnd:roundEnd,renderBoard:renderBoard,publish:publish,onMirror:onMirror,onMode:onMode,mode:function(){return mode},allowSolo:allowSolo,runsEngine:runsEngine,
  sfx:sfx,confetti:confetti,obsUrl:obsUrl,obsExtra:obsExtra,updateObsUrl:updateObsUrl,fixCmds:fixCmds,copyText:copyText,channelInfo:channelInfo,LS:LS,boot:boot,
  start:function(){ // called by each page after it registered its handlers
    boot();
    connect();
  }};
})();
