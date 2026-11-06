/* auth.js — Login with Twitch for لَمّة | Lamma (shared by every game page and the hub).
   Static site, no backend: Twitch OAuth implicit grant. The token lives only in this tab's sessionStorage;
   it is never put in a URL, never sent anywhere except Twitch's own validate/revoke endpoints, and the
   OBS overlay (?obs=1) never loads it (read-only, tokenless).
   The control panel for a channel opens only for the Twitch account with that login (or a login in MODS).

   SETUP: create an app at https://dev.twitch.tv/console/apps, OAuth Redirect URL:
     https://lamma.sites.tab.bot/auth.html   (and https://lamma-preview.sites.tab.bot/auth.html for the preview)
   then paste its Client ID below. Until a Client ID is set, login is OFF and every page works as before. */
(function(){
'use strict';
var TWITCH_CLIENT_ID='PASTE_TWITCH_CLIENT_ID';
/* optional: logins (lower case) allowed to run another channel's panel, e.g. {'iitzmedoo':['some_mod']} */
var MODS={};

var KEY='lamma-auth',SKEY='lamma-auth-state',RKEY='lamma-auth-return';
var enabled=/^[a-z0-9]{20,40}$/i.test(TWITCH_CLIENT_ID);
var SS={get:function(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{sessionStorage.setItem(k,v)}catch(e){}},del:function(k){try{sessionStorage.removeItem(k)}catch(e){}}};
function redirectUri(){return location.origin+'/account/auth.html'}
function rnd(){var a=new Uint8Array(16);(window.crypto||window.msCrypto).getRandomValues(a);return Array.prototype.map.call(a,function(b){return('0'+b.toString(16)).slice(-2)}).join('')}
function user(){var u=null;try{u=JSON.parse(SS.get(KEY)||'null')}catch(e){}if(!u||!u.token||!u.login)return null;if(u.exp&&Date.now()>u.exp){SS.del(KEY);return null}return u}
function safeReturn(p){return typeof p==='string'&&/^\/(?!\/)/.test(p)?p:'/'}
function login(ret){
  if(!enabled)return;
  var st=rnd();SS.set(SKEY,st);SS.set(RKEY,safeReturn(ret||location.pathname+location.search));
  location.href='https://id.twitch.tv/oauth2/authorize?client_id='+encodeURIComponent(TWITCH_CLIENT_ID)+'&redirect_uri='+encodeURIComponent(redirectUri())+'&response_type=token&scope=&state='+st;
}
function validate(token){
  return fetch('https://id.twitch.tv/oauth2/validate',{headers:{Authorization:'OAuth '+token}}).then(function(r){if(!r.ok)throw new Error('invalid');return r.json()}).then(function(j){
    if(!j||!j.login||(j.client_id&&j.client_id!==TWITCH_CLIENT_ID))throw new Error('invalid');
    var u={token:token,login:String(j.login).toLowerCase(),uid:j.user_id,exp:Date.now()+Math.max(60,(j.expires_in||3600))*1000,checked:Date.now()};
    SS.set(KEY,JSON.stringify(u));return u});
}
function logout(){
  var u=user();SS.del(KEY);
  if(u&&enabled&&window.fetch){try{fetch('https://id.twitch.tv/oauth2/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'client_id='+encodeURIComponent(TWITCH_CLIENT_ID)+'&token='+encodeURIComponent(u.token)})}catch(e){}}
  location.reload();
}
/* called by auth.html after Twitch redirects back with #access_token=… */
function finish(cb){
  var h=new URLSearchParams(location.hash.replace(/^#/,'')),q=new URLSearchParams(location.search);
  history.replaceState(null,'',location.pathname); // drop the token from the address bar right away
  var ret=safeReturn(SS.get(RKEY));SS.del(RKEY);var st=SS.get(SKEY);SS.del(SKEY);
  if(q.get('error'))return cb(q.get('error_description')||q.get('error'),ret);
  var tok=h.get('access_token');
  if(!tok||!st||h.get('state')!==st)return cb('state',ret);
  validate(tok).then(function(){cb(null,ret)},function(){cb('invalid',ret)});
}
function allowed(u,ch){if(!u)return false;ch=String(ch||'').toLowerCase();return u.login===ch||(MODS[ch]||[]).indexOf(u.login)>=0}

/* ---------- page UI (header button + gate over the control panel) ---------- */
var A=window.App;
var STR={ar:{in:'سجّل الدخول بتويتش',out:'خروج',as:'داخل كـ',gate_t:'لوحة التحكم لصاحب القناة',gate_in:'سجّل الدخول بحساب تويتش الخاص بالقناة لفتح لوحة التحكم.',gate_other:'أنت مسجّل الدخول بحساب',gate_other2:'ولوحة تحكم قناة',gate_other3:'تفتح لصاحبها فقط.',mine:'افتح لقناتي',off:'تسجيل الدخول غير مفعّل بعدُ',safe:'لا نطلب أي صلاحيات، نتأكد فقط من هويتك. يبقى التوكن في متصفحك.'},
         en:{in:'Login with Twitch',out:'Log out',as:'Signed in as',gate_t:'Control panel is for the channel owner',gate_in:'Sign in with the channel\'s Twitch account to open the control panel.',gate_other:'You are signed in as',gate_other2:'and the control panel for',gate_other3:'opens only for its owner.',mine:'Open my channel',off:'Login is not switched on yet',safe:'No permissions requested, we only check who you are. The token stays in your browser.'}};
function L(k){var l=A&&A.lang?A.lang():'ar';return (STR[l]||STR.ar)[k]}
function svgEl(paths,fill){var NS='http://www.w3.org/2000/svg',s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');
  if(fill){s.setAttribute('fill','currentColor')}else{s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.8');s.setAttribute('stroke-linecap','round')}
  paths.forEach(function(p){var e=document.createElementNS(NS,p[0]);for(var k in p[1])e.setAttribute(k,p[1][k]);s.appendChild(e)});return s}
function twIcon(){return svgEl([['path',{d:'M4.3 3L3 6.4v13.2h4.5V22h2.6l2.4-2.4h3.6L21 14.7V3H4.3zm15 10.8l-2.8 2.8h-4.4l-2.4 2.4v-2.4H5.9V4.7h13.4v9.1zM16.6 7.9h-1.7v5h1.7v-5zm-4.6 0h-1.7v5H12v-5z'}]],true)}
function lockIcon(){return svgEl([['rect',{x:5,y:11,width:14,height:10,rx:2}],['path',{d:'M8 11V8a4 4 0 0 1 8 0v3'}]],false)}
function mk(tag,cls,kids){var e=document.createElement(tag);if(cls)e.className=cls;(kids||[]).forEach(function(k){e.appendChild(typeof k==='string'?document.createTextNode(k):k)});return e}
function bdi(t){return mk('bdi','',[t])}
function twBtn(label,big){var b=mk('button','tw-btn'+(big?' big':''),[twIcon(),mk('span','',[label])]);b.type='button';b.addEventListener('click',function(){login()});return b}
function outBtn(){var b=mk('button','auth-out',[L('out')]);b.type='button';b.addEventListener('click',logout);return b}
function chanUrl(ch){var u=new URL(location.href);u.searchParams.set('channel',ch);u.hash='';return u.pathname+u.search}
function clear(n){while(n.firstChild)n.removeChild(n.firstChild)}
function render(){
  var end=document.querySelector('header.top .top-end');if(!end)return;
  var box=document.getElementById('authBox');if(!box){box=mk('div','auth-box');box.id='authBox';end.insertBefore(box,end.firstChild)}
  clear(box);var u=user();
  if(!enabled){box.hidden=true;return}
  box.hidden=false;
  if(u){var w=mk('span','auth-who',[twIcon(),bdi(u.login)]);w.title=L('as')+' '+u.login;box.appendChild(w);box.appendChild(outBtn())}
  else box.appendChild(twBtn(L('in')));
  gate(u);
}
function gate(u){
  var isGame=document.body.classList.contains('gpage');var g=document.getElementById('authGate');
  var ch=A?A.channel:'';
  if(!enabled||!isGame||allowed(u,ch)){if(g)g.parentNode.removeChild(g);document.documentElement.classList.remove('auth-locked');return}
  if(!g){g=mk('div','auth-gate');g.id='authGate';g.setAttribute('role','dialog');g.setAttribute('aria-modal','true');document.body.appendChild(g)}
  document.documentElement.classList.add('auth-locked');clear(g);
  var card=mk('div','auth-card',[mk('span','auth-lock',[lockIcon()]),mk('h2','',[L('gate_t')])]);
  if(u){
    card.appendChild(mk('p','',[L('gate_other')+' ',mk('b','',[bdi(u.login)]),' '+L('gate_other2')+' ',mk('b','',[bdi('#'+ch)]),' '+L('gate_other3')]));
    var mine=mk('a','tw-btn',[twIcon(),mk('span','',[L('mine')+' ',bdi('#'+u.login)])]);mine.href=chanUrl(u.login);
    card.appendChild(mk('div','auth-acts',[mine,outBtn()]));
  }else{
    card.appendChild(mk('p','',[L('gate_in')]));card.appendChild(mk('div','auth-acts',[twBtn(L('in'),true)]));card.appendChild(mk('small','',[L('safe')]));
  }
  g.appendChild(card);
}
function boot(){
  if(!A||A.obs)return; // overlays stay tokenless and read-only
  render();if(A.onLang)A.onLang(render);
  var u=user();
  // Twitch asks apps to re-check a token at least hourly
  if(u&&enabled&&Date.now()-(u.checked||0)>50*60*1000)validate(u.token).then(render,function(){SS.del(KEY);render()});
}
window.LammaAuth={enabled:enabled,clientId:TWITCH_CLIENT_ID,user:user,login:login,logout:logout,finish:finish,allowed:allowed,redirectUri:redirectUri,
  canControl:function(ch){return !enabled||allowed(user(),ch||(A&&A.channel))}};
if(A){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot()}
})();
