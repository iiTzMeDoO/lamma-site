/* spymaster.js — private key view for one Secret Words board. Everything comes from the URL hash (never sent to any server):
   words, key, captains. It reads the channel's chat anonymously (read-only) to mark cards the captains pick. */
(function(){
'use strict';
var C=window.ChatCore;
function $(i){return document.getElementById(i)}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
var L={ar:{title:'سباي ماستر',warn:'هالصفحة إلك بس. لا تشاركها ولا تفتحها عالستريم.',help:'الكروت المكشوفة بتتعلّم لحالها لما الكابتن يكتب !pick بالشات. وإذا بدك، اضغط عكرت لتعلّمو بإيدك.',
  clue:'التلميح',clueHelp:'قول التلميح بالصوت للستريمر، أو اكتبو بشات تويتش هيك:',copy:'نسخ',copied:'انتسخ ✓',bad:'الرابط ناقص أو قديم. اطلب رابط جديد من الستريمر.',
  red:'الأحمر',blue:'الأزرق',you:'إنت سباي ماستر الفريق {t}',first:'الفريق {t} بيبلّش (9 كروت)',left:'باقي: أحمر {r} · أزرق {b}',last:'آخر تلميح بالشات: {x}',conn:'متصل بالشات',connecting:'عم يتصل…',lang:'EN',x:'القاتل'},
 en:{title:'Spymaster',warn:'This page is for you only. Do not share it or open it on stream.',help:'Revealed cards get marked automatically when a captain types !pick in chat. You can also tap a card to mark it.',
  clue:'Your clue',clueHelp:'Say it to the streamer, or type it in Twitch chat like this:',copy:'Copy',copied:'Copied ✓',bad:'This link is incomplete or old. Ask the streamer for a new one.',
  red:'Red',blue:'Blue',you:'You are the {t} spymaster',first:'{t} goes first (9 cards)',left:'Left: red {r} · blue {b}',last:'Last clue in chat: {x}',conn:'Connected to chat',connecting:'Connecting…',lang:'ع',x:'Assassin'}};
var lang=(localStorage.getItem('lamma-lang')||'ar')==='en'?'en':'ar';
function t(k,o){var s=L[lang][k]||k;if(o)s=s.replace(/\{(\w)\}/g,function(_,x){return o[x]!=null?o[x]:''});return s}
var D=null;
try{var h=location.hash.slice(1);var json=decodeURIComponent(escape(atob(h.replace(/-/g,'+').replace(/_/g,'/'))));D=JSON.parse(json);
  if(!D||D.v!==1||!Array.isArray(D.w)||D.w.length!==25||!/^[rbnx]{25}$/.test(D.k||'')||!D.tok)D=null;}catch(e){D=null}
var rev=[];var RK=D?'lamma-spy-'+D.id+'-'+D.tok:'';
try{rev=JSON.parse(sessionStorage.getItem(RK)||'[]')}catch(e){rev=[]}
if(!Array.isArray(rev)||rev.length!==25)rev=new Array(25).fill(false);
function saveRev(){try{sessionStorage.setItem(RK,JSON.stringify(rev))}catch(e){}}
var lastClue='';
function setCmdText(e,s){while(e.firstChild)e.removeChild(e.firstChild);String(s).split(/(![A-Za-z\u0600-\u06FF]+)/).forEach(function(p,i){if(!p)return;if(i%2){var b=el('bdi',null,p);b.dir='ltr';e.appendChild(b)}else e.appendChild(document.createTextNode(p))});}
function render(){
  document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  $('langBtn').textContent=t('lang');$('spyTitle').textContent=t('title');$('spyWarn').textContent=t('warn');setCmdText($('spyHelp'),t('help'));
  $('spyClueT').textContent=t('clue');$('spyClueHelp').textContent=t('clueHelp');$('spyCopy').textContent=t('copy');
  if(!D){$('spyBad').hidden=false;$('spyBad').textContent=t('bad');$('spyBoard').hidden=true;return;}
  var tm=D.team==='blue'?'blue':'red';document.body.setAttribute('data-team',tm);
  $('spyBadge').textContent='🕵️ '+t('you',{t:t(tm)});
  var b=$('spyBoard');while(b.firstChild)b.removeChild(b.firstChild);
  var info=el('p','spy-info');info.dir=lang==='ar'?'rtl':'ltr';
  var rr=0,bb=0;for(var i=0;i<25;i++){if(!rev[i]){if(D.k[i]==='r')rr++;if(D.k[i]==='b')bb++;}}
  info.textContent=t('first',{t:t(D.first==='blue'?'blue':'red')})+' · '+t('left',{r:rr,b:bb});b.appendChild(info);
  var g=el('div','spy-grid');
  D.w.forEach(function(w,i){var c=D.k[i];var cd=el('button','spy-card c-'+c+(rev[i]?' done':''));cd.type='button';
    cd.appendChild(el('span','kc-n',String(i+1)));var s=el('span','spy-w',w);s.dir='auto';cd.appendChild(s);if(c==='x')cd.appendChild(el('span','spy-x','☠️'));
    cd.setAttribute('aria-label',(i+1)+' '+w+' '+(c==='r'?t('red'):c==='b'?t('blue'):c==='x'?t('x'):'—'));cd.setAttribute('aria-pressed',String(!!rev[i]));
    cd.addEventListener('click',function(){rev[i]=!rev[i];saveRev();render();});g.appendChild(cd);});
  b.appendChild(g);
  $('spyLast').textContent=lastClue?t('last',{x:lastClue}):'';
  $('spyChan').textContent='#'+D.ch;
  updCmd();
}
function updCmd(){var w=$('spyWord').value.trim()||'…';$('spyCmd').textContent='!clue '+w+' '+$('spyNum').value;}
$('spyWord').addEventListener('input',updCmd);$('spyNum').addEventListener('change',updCmd);
$('spyCopy').addEventListener('click',function(){var s=$('spyCmd').textContent;var b=this;function ok(){b.textContent=t('copied');setTimeout(function(){b.textContent=t('copy')},1300)}
  if(navigator.clipboard)navigator.clipboard.writeText(s).then(ok,function(){});});
$('langBtn').addEventListener('click',function(){lang=lang==='ar'?'en':'ar';try{localStorage.setItem('lamma-lang',lang)}catch(e){}render();});
render();
/* anonymous read-only chat: mark captain picks, show the last clue */
if(D&&C.safeChannel(D.ch)){
  var ws,retry=0;
  var caps=[D.cap&&D.cap.red,D.cap&&D.cap.blue].filter(Boolean),spies=[D.spy&&D.spy.red,D.spy&&D.spy.blue].filter(Boolean);
  function connect(){
    $('spyConn').textContent=t('connecting');
    try{ws=new WebSocket('wss://irc-ws.chat.twitch.tv:443')}catch(e){return setTimeout(connect,3000)}
    ws.onopen=function(){ws.send('CAP REQ :twitch.tv/tags');ws.send('PASS SCHMOOPIIE');ws.send('NICK justinfan'+(10000+(Math.random()*80000|0)));ws.send('JOIN #'+D.ch);};
    ws.onmessage=function(ev){String(ev.data).split('\r\n').forEach(function(line){
      if(!line)return;if(line.indexOf('PING')===0){ws.send('PONG'+line.slice(4));return;}
      var p=C.parseLine(line);if(!p)return;if(p.command==='JOIN'){retry=0;$('spyConn').textContent=t('conn');return;}
      var m=C.toChat(p);if(!m)return;var cmd=C.parseCmd(m.text);if(!cmd)return;
      if((cmd.cmd==='pick'||cmd.cmd==='اختار'||cmd.cmd==='اختر')&&caps.indexOf(m.user)>=0){var n=parseInt(C.normalize(cmd.rest),10);if(n>=1&&n<=25&&!rev[n-1]){rev[n-1]=true;saveRev();render();}}
      if((cmd.cmd==='clue'||cmd.cmd==='تلميح')&&spies.indexOf(m.user)>=0){lastClue=cmd.rest.slice(0,40);render();}
    });};
    ws.onclose=function(){setTimeout(connect,Math.min(30000,2000*Math.pow(2,retry++)))};
  }
  connect();
}
})();
