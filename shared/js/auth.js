/* auth.js — sign-in for لَمّة | Lamma (shared by every game page and the hub): Twitch, Discord, Google or Guest.
   Static site, no backend, no secrets. Client IDs live in /shared/js/auth-config.js (loaded just before this file).
   Twitch / Discord / Google use the OAuth implicit grant: the provider sends the browser back to
   /account/auth.html#access_token=…, that page checks the token once with the provider, keeps only the public
   profile (name + avatar) and drops the token from the address bar. Only Twitch's token is kept (in this tab's
   sessionStorage, as before) so it can be re-checked hourly and revoked on sign-out. Guest = a name, nothing else.
   The OBS overlay (?obs=1) never loads any of it (read-only, tokenless).

   One session object for the whole site, localStorage 'lamma-session':
     {provider:'twitch'|'discord'|'google'|'guest', id, login, display, avatar, exp}

   Who opens a game's control panel (LammaAuth.canControl → gate.js):
   • Stream mode (default; a Twitch channel is used): only that channel's Twitch owner (or a login in TWITCH_MODS),
     exactly as before. While no Twitch Client ID is set, everyone gets in, as before.
   • Without stream / with friends (?mode=friends, or the button on the lock screen): anyone signed in — any
     provider, guest included — opens the control panel of their own room (the game running in their own browser).
   Opening a link with ?channel=… switches back to stream mode. */
(function(){
'use strict';
var CFG=window.LAMMA_AUTH_CONFIG||{};
function cfgStr(k,d){var v=CFG[k];return typeof v==='string'?v.trim():d}
var TWITCH_CLIENT_ID=cfgStr('TWITCH_CLIENT_ID','PASTE_TWITCH_CLIENT_ID');
var DISCORD_CLIENT_ID=cfgStr('DISCORD_CLIENT_ID','');
var GOOGLE_CLIENT_ID=cfgStr('GOOGLE_CLIENT_ID','');
var GUEST_ON=CFG.GUEST!==false;
var MODS=(CFG.TWITCH_MODS&&typeof CFG.TWITCH_MODS==='object')?CFG.TWITCH_MODS:{};

var KEY='lamma-auth',SKEY='lamma-auth-state',RKEY='lamma-auth-return',SESS='lamma-session',MODE='lamma-mode';
var ON={
  twitch:/^[a-z0-9]{20,40}$/i.test(TWITCH_CLIENT_ID),
  discord:/^\d{15,25}$/.test(DISCORD_CLIENT_ID),
  google:/^[\w-]+\.apps\.googleusercontent\.com$/.test(GOOGLE_CLIENT_ID),
  guest:GUEST_ON
};
var enabled=ON.twitch; // kept for old callers: "is Twitch login switched on"
var anyOn=ON.twitch||ON.discord||ON.google||ON.guest;
var SS={get:function(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{sessionStorage.setItem(k,v)}catch(e){}},del:function(k){try{sessionStorage.removeItem(k)}catch(e){}}};
var LS={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},del:function(k){try{localStorage.removeItem(k)}catch(e){}}};
function redirectUri(){return location.origin+'/account/auth.html'}
function rnd(){var a=new Uint8Array(16);(window.crypto||window.msCrypto).getRandomValues(a);return Array.prototype.map.call(a,function(b){return('0'+b.toString(16)).slice(-2)}).join('')}
function safeReturn(p){return typeof p==='string'&&/^\/(?!\/)/.test(p)?p:'/'}
function safeImg(u){return typeof u==='string'&&/^https:\/\/[^\s"'<>]+$/.test(u)?u:''}
function clean(s,n){return String(s==null?'':s).replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n||40)}

/* ---------- the one session ---------- */
function twTok(){var u=null;try{u=JSON.parse(SS.get(KEY)||'null')}catch(e){}if(!u||!u.token||!u.login)return null;if(u.exp&&Date.now()>u.exp){SS.del(KEY);return null}return u}
function session(){
  var s=null;try{s=JSON.parse(LS.get(SESS)||'null')}catch(e){}
  if(!s||!s.provider||!s.id||!ON[s.provider]){
    // a Twitch sign-in from before the multi-login update (token in this tab only): carry it over
    var t=twTok();if(t&&ON.twitch){s={provider:'twitch',id:String(t.uid||t.login),login:t.login,display:t.login,avatar:'',exp:t.exp};LS.set(SESS,JSON.stringify(s));return s}
    return null;
  }
  if(s.exp&&Date.now()>s.exp){LS.del(SESS);if(s.provider==='twitch')SS.del(KEY);return null}
  return s;
}
function setSession(s){LS.set(SESS,JSON.stringify(s));changed()}
/* user(): the signed-in person (any provider) — {provider,id,login,display,avatar,exp}; null when signed out */
function user(){return session()}
function changed(){try{window.dispatchEvent(new CustomEvent('lamma-auth',{detail:session()}))}catch(e){}}

/* ---------- mode: with a stream (Twitch channel) or with friends (no stream) ---------- */
(function(){var q=new URLSearchParams(location.search),m=q.get('mode');
  if(m==='friends'||m==='stream')LS.set(MODE,m);else if(q.get('channel'))LS.set(MODE,'stream');})();
function mode(){return LS.get(MODE)==='friends'?'friends':'stream'}
function setMode(m){LS.set(MODE,m==='friends'?'friends':'stream');changed()}

/* ---------- sign-in: start (redirect to the provider) ---------- */
function begin(p,ret){
  var st=rnd();SS.set(SKEY,JSON.stringify({s:st,p:p}));SS.set(RKEY,safeReturn(ret||location.pathname+location.search));return st;
}
function authorizeUrl(p,st){
  var r=encodeURIComponent(redirectUri());
  if(p==='twitch')return 'https://id.twitch.tv/oauth2/authorize?client_id='+encodeURIComponent(TWITCH_CLIENT_ID)+'&redirect_uri='+r+'&response_type=token&scope=&state='+st;
  if(p==='discord')return 'https://discord.com/oauth2/authorize?client_id='+encodeURIComponent(DISCORD_CLIENT_ID)+'&redirect_uri='+r+'&response_type=token&scope=identify&state='+st+'&prompt=none';
  if(p==='google')return 'https://accounts.google.com/o/oauth2/v2/auth?client_id='+encodeURIComponent(GOOGLE_CLIENT_ID)+'&redirect_uri='+r+'&response_type=token&scope='+encodeURIComponent('openid profile')+'&state='+st+'&include_granted_scopes=true&prompt=select_account';
  return '';
}
function signIn(p,ret){
  if(!ON[p]||p==='guest')return;
  location.href=authorizeUrl(p,begin(p,ret));
}
/* login(): the old "Login with Twitch" call — same Twitch URL as before */
function login(ret){if(!ON.twitch)return;signIn('twitch',ret)}
function guest(name){
  name=clean(name,24);if(name.length<2||!ON.guest)return false;
  var old=session(),id=(old&&old.provider==='guest')?old.id:'g_'+rnd().slice(0,12);
  if(old&&old.provider==='twitch')revokeTwitch();
  setSession({provider:'guest',id:id,login:name,display:name,avatar:''});return true;
}

/* ---------- sign-in: finish (account/auth.html) ---------- */
function getJSON(url,headers){return fetch(url,{headers:headers||{}}).then(function(r){if(!r.ok)throw new Error('invalid');return r.json()})}
function validate(token){ // Twitch: as before, plus the public display name + avatar (best effort)
  return getJSON('https://id.twitch.tv/oauth2/validate',{Authorization:'OAuth '+token}).then(function(j){
    if(!j||!j.login||(j.client_id&&j.client_id!==TWITCH_CLIENT_ID))throw new Error('invalid');
    var u={token:token,login:String(j.login).toLowerCase(),uid:j.user_id,exp:Date.now()+Math.max(60,(j.expires_in||3600))*1000,checked:Date.now()};
    SS.set(KEY,JSON.stringify(u));
    var s=session(),base=(s&&s.provider==='twitch'&&s.login===u.login)?s:{};
    var ns={provider:'twitch',id:String(u.uid||u.login),login:u.login,display:base.display||u.login,avatar:base.avatar||'',exp:u.exp};
    LS.set(SESS,JSON.stringify(ns));
    if(base.avatar)return u;
    return getJSON('https://api.twitch.tv/helix/users',{Authorization:'Bearer '+token,'Client-Id':TWITCH_CLIENT_ID}).then(function(h){
      var d=h&&h.data&&h.data[0];if(d){ns.display=clean(d.display_name||u.login,40);ns.avatar=safeImg(d.profile_image_url);LS.set(SESS,JSON.stringify(ns))}return u;
    },function(){return u});
  });
}
function finishDiscord(tok,exp){
  var H={Authorization:'Bearer '+tok};
  var app=getJSON('https://discord.com/api/oauth2/@me',H).then(function(j){return j},function(){return null});
  return Promise.all([getJSON('https://discord.com/api/users/@me',H),app]).then(function(r){
    var d=r[0],a=r[1];
    if(!d||!d.id)throw new Error('invalid');
    if(a&&a.application&&a.application.id&&String(a.application.id)!==DISCORD_CLIENT_ID)throw new Error('invalid');
    var di=0;try{di=d.discriminator&&d.discriminator!=='0'?(+d.discriminator%5):Number((BigInt(d.id)>>BigInt(22))%BigInt(6))}catch(e){}
    var av=d.avatar?'https://cdn.discordapp.com/avatars/'+d.id+'/'+d.avatar+'.png?size=96':'https://cdn.discordapp.com/embed/avatars/'+di+'.png';
    setSession({provider:'discord',id:String(d.id),login:clean(d.username,40),display:clean(d.global_name||d.username,40),avatar:safeImg(av),exp:Date.now()+30*864e5});
  });
}
function finishGoogle(tok){
  return getJSON('https://oauth2.googleapis.com/tokeninfo?access_token='+encodeURIComponent(tok)).then(function(ti){
    if(!ti||(ti.aud!==GOOGLE_CLIENT_ID&&ti.azp!==GOOGLE_CLIENT_ID))throw new Error('invalid');
    return getJSON('https://www.googleapis.com/oauth2/v3/userinfo',{Authorization:'Bearer '+tok});
  }).then(function(g){
    if(!g||!g.sub)throw new Error('invalid');
    var nm=clean(g.name||g.given_name||'Google',40);
    setSession({provider:'google',id:String(g.sub),login:nm,display:nm,avatar:safeImg(g.picture),exp:Date.now()+30*864e5});
  });
}
/* called by auth.html after the provider redirects back with #access_token=… (cb(err, returnPath)) */
function finish(cb){
  var h=new URLSearchParams(location.hash.replace(/^#/,'')),q=new URLSearchParams(location.search);
  history.replaceState(null,'',location.pathname); // drop the token from the address bar right away
  var ret=safeReturn(SS.get(RKEY));SS.del(RKEY);
  var raw=SS.get(SKEY);SS.del(SKEY);var st=null,p='twitch';
  try{var o=JSON.parse(raw);if(o&&o.s){st=o.s;p=o.p}else st=raw}catch(e){st=raw} // an old plain state string = Twitch
  var err=q.get('error')||h.get('error');
  if(err)return cb(q.get('error_description')||h.get('error_description')||err,ret);
  var tok=h.get('access_token');
  if(!tok||!st||h.get('state')!==st||!ON[p])return cb('state',ret);
  var job=p==='twitch'?validate(tok):p==='discord'?finishDiscord(tok,h.get('expires_in')):finishGoogle(tok);
  job.then(function(){changed();cb(null,ret)},function(){cb('invalid',ret)});
}
function revokeTwitch(){
  var t=twTok();SS.del(KEY);
  if(t&&ON.twitch&&window.fetch){try{fetch('https://id.twitch.tv/oauth2/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'client_id='+encodeURIComponent(TWITCH_CLIENT_ID)+'&token='+encodeURIComponent(t.token)})}catch(e){}}
}
function logout(){revokeTwitch();LS.del(SESS);changed();location.reload()}
/* switchAccount(): sign out here and open the sign-in chooser straight away (the home page's «تبديل الحساب») */
function switchAccount(){revokeTwitch();LS.del(SESS);changed();setTimeout(openChooser,0)}
function allowed(u,ch){if(!u||u.provider!=='twitch')return false;ch=String(ch||'').toLowerCase();var l=String(u.login||'').toLowerCase();return l===ch||(MODS[ch]||[]).indexOf(l)>=0}
function canControl(ch){
  if(mode()==='friends')return !!session()||!anyOn;
  return !ON.twitch||allowed(session(),ch||(A&&A.channel));
}

/* ---------- page UI (header box, sign-in chooser, lock screen over the control panel) ---------- */
var A=window.App;
var STR={ar:{in:'سجّل الدخول بتويتش',out:'خروج',as:'داخل كـ',gate_t:'لوحة التحكم لصاحب القناة',gate_in:'سجّل الدخول بحساب تويتش الخاص بالقناة لفتح لوحة التحكم.',gate_other:'أنت مسجّل الدخول بحساب',gate_other2:'ولوحة تحكم قناة',gate_other3:'تفتح لصاحبها فقط.',mine:'افتح لقناتي',off:'تسجيل الدخول غير مفعّل بعدُ',safe:'لا نطلب أي صلاحيات، نتأكد فقط من هويتك. يبقى التوكن في متصفحك.',
  signin:'تسجيل الدخول',choose_t:'سجّل الدخول',choose_sub:'اختر الطريقة التي تناسبك. نأخذ اسمك وصورتك فقط.',
  p_twitch:'تويتش',p_discord:'ديسكورد',p_google:'جوجل',p_guest:'ضيف',
  d_twitch:'للستريمرز: لوحة تحكم قناتك',d_discord:'العب مع أصحابك بلا بث',d_google:'بحساب جوجل',d_guest:'اكتب اسمك فقط، بلا حساب',
  not_set:'غير مفعّل بعدُ (يحتاج Client ID)',guest_ph:'اسمك الظاهر',guest_go:'ادخل',guest_bad:'اكتب اسمًا من حرفين على الأقل',close:'إغلاق',
  friends:'العب مع أصحابك بلا بث',friends_t:'العب مع أصحابك',friends_in:'سجّل الدخول بأي طريقة لفتح لوحة التحكم لغرفتك.',
  friends_on:'بلا بث',stream_back:'العودة إلى وضع البث',or:'أو'},
 en:{in:'Login with Twitch',out:'Log out',as:'Signed in as',gate_t:'Control panel is for the channel owner',gate_in:'Sign in with the channel\'s Twitch account to open the control panel.',gate_other:'You are signed in as',gate_other2:'and the control panel for',gate_other3:'opens only for its owner.',mine:'Open my channel',off:'Login is not switched on yet',safe:'No permissions requested, we only check who you are. The token stays in your browser.',
  signin:'Sign in',choose_t:'Sign in',choose_sub:'Pick whichever suits you. We only take your name and picture.',
  p_twitch:'Twitch',p_discord:'Discord',p_google:'Google',p_guest:'Guest',
  d_twitch:'For streamers: your channel\'s control panel',d_discord:'Play with friends, no stream',d_google:'With your Google account',d_guest:'Just type a name, no account',
  not_set:'Not switched on yet (needs a Client ID)',guest_ph:'Your display name',guest_go:'Enter',guest_bad:'Type a name of at least 2 letters',close:'Close',
  friends:'Play with friends, no stream',friends_t:'Play with friends',friends_in:'Sign in any way you like to open the control panel for your room.',
  friends_on:'No stream',stream_back:'Back to stream mode',or:'or'}};
function L(k){var l=A&&A.lang?A.lang():'ar';return (STR[l]||STR.ar)[k]}
function svgEl(paths,fill){var NS='http://www.w3.org/2000/svg',s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');
  if(fill){s.setAttribute('fill','currentColor')}else{s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.8');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round')}
  paths.forEach(function(p){var e=document.createElementNS(NS,p[0]);for(var k in p[1])e.setAttribute(k,p[1][k]);s.appendChild(e)});return s}
function twIcon(){return svgEl([['path',{d:'M4.3 3L3 6.4v13.2h4.5V22h2.6l2.4-2.4h3.6L21 14.7V3H4.3zm15 10.8l-2.8 2.8h-4.4l-2.4 2.4v-2.4H5.9V4.7h13.4v9.1zM16.6 7.9h-1.7v5h1.7v-5zm-4.6 0h-1.7v5H12v-5z'}]],true)}
function dcIcon(){return svgEl([['path',{d:'M19.6 5.3A16.6 16.6 0 0 0 15.5 4l-.5 1.1a15.4 15.4 0 0 0-6 0L8.5 4a16.6 16.6 0 0 0-4.1 1.3C1.8 9.2 1.1 13 1.4 16.7a16.7 16.7 0 0 0 5.1 2.6l1.1-1.8c-.6-.2-1.2-.5-1.7-.9l.4-.3a11.9 11.9 0 0 0 11.4 0l.4.3c-.5.4-1.1.7-1.7.9l1.1 1.8a16.6 16.6 0 0 0 5.1-2.6c.4-4.3-.7-8-3-11.4zM8.7 14.4c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z'}]],true)}
function ggIcon(){return svgEl([['path',{d:'M21.6 10.2h-9.4v3.9h5.4c-.5 2.5-2.6 3.9-5.4 3.9a6 6 0 0 1 0-12c1.5 0 2.9.6 3.9 1.5l2.9-2.9A10 10 0 1 0 12.2 22c5 0 9.6-3.6 9.6-10 0-.6-.1-1.2-.2-1.8z'}]],true)}
function guIcon(){return svgEl([['circle',{cx:12,cy:8,r:4}],['path',{d:'M4 21c.8-4 4-6 8-6s7.2 2 8 6'}]],false)}
function lockIcon(){return svgEl([['rect',{x:5,y:11,width:14,height:10,rx:2}],['path',{d:'M8 11V8a4 4 0 0 1 8 0v3'}]],false)}
function inIcon(){return svgEl([['path',{d:'M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4'}],['path',{d:'M10 16l4-4-4-4M14 12H4'}]],false)}
function frIcon(){return svgEl([['circle',{cx:9,cy:8,r:3.2}],['circle',{cx:17,cy:9,r:2.5}],['path',{d:'M3 20c.6-3.2 3-5 6-5s5.4 1.8 6 5M15.5 14.6c2.8-.3 5 1.3 5.5 4.4'}]],false)}
var ICON={twitch:twIcon,discord:dcIcon,google:ggIcon,guest:guIcon};
function mk(tag,cls,kids){var e=document.createElement(tag);if(cls)e.className=cls;(kids||[]).forEach(function(k){e.appendChild(typeof k==='string'?document.createTextNode(k):k)});return e}
function bdi(t){return mk('bdi','',[t])}
function btn(cls,kids,fn){var b=mk('button',cls,kids);b.type='button';if(fn)b.addEventListener('click',fn);return b}
function twBtn(label,big){return btn('tw-btn'+(big?' big':''),[twIcon(),mk('span','',[label])],function(){login()})}
function outBtn(){return btn('auth-out',[L('out')],logout)}
function chanUrl(ch){var u=new URL(location.href);u.searchParams.set('channel',ch);u.searchParams.delete('mode');u.hash='';return u.pathname+u.search}
function clear(n){while(n.firstChild)n.removeChild(n.firstChild)}
function avatarEl(s){
  var w=mk('span','auth-av');
  if(s.avatar){var i=document.createElement('img');i.src=s.avatar;i.alt='';i.width=24;i.height=24;i.referrerPolicy='no-referrer';i.decoding='async';
    i.addEventListener('error',function(){if(i.parentNode)i.parentNode.removeChild(i);w.textContent=initial(s)});w.appendChild(i)}
  else w.textContent=initial(s);
  return w;
}
function initial(s){var n=String(s.display||s.login||'?').trim();return (Array.from?Array.from(n)[0]:n.charAt(0))||'?'}

/* the provider list (used by the chooser modal and the lock screen) */
function providerList(onDone){
  var list=mk('div','auth-provs');
  ['twitch','discord','google','guest'].forEach(function(p){
    if(p==='guest'&&!ON.guest)return;
    var on=ON[p];
    var b=btn('auth-prov p-'+p,[mk('span','auth-prov-ic',[ICON[p]()]),mk('span','auth-prov-tx',[mk('b','',[L('p_'+p)]),mk('small','',[on?L('d_'+p):L('not_set')])])]);
    b.setAttribute('data-provider',p);
    if(!on){b.disabled=true;b.setAttribute('aria-disabled','true')}
    else if(p==='guest')b.addEventListener('click',function(){form.hidden=false;b.hidden=true;inp.focus()});
    else b.addEventListener('click',function(){signIn(p)});
    list.appendChild(b);
  });
  var form=mk('form','auth-guest');form.hidden=true;
  var inp=document.createElement('input');inp.type='text';inp.maxLength=24;inp.autocomplete='nickname';inp.placeholder=L('guest_ph');inp.setAttribute('aria-label',L('guest_ph'));inp.id='authGuestName';
  var go=mk('button','tw-btn',[guIcon(),mk('span','',[L('guest_go')])]);go.type='submit';
  var msg=mk('small','auth-guest-err');msg.hidden=true;msg.setAttribute('role','alert');
  form.appendChild(mk('div','auth-guest-row',[inp,go]));form.appendChild(msg);
  form.addEventListener('submit',function(e){e.preventDefault();if(guest(inp.value)){if(onDone)onDone()}else{msg.textContent=L('guest_bad');msg.hidden=false;inp.focus()}});
  list.appendChild(form);
  return list;
}
/* the sign-in chooser (modal) */
var lastFocus=null;
function openChooser(){
  closeChooser();lastFocus=document.activeElement;
  var m=mk('div','auth-gate auth-modal');m.id='authChooser';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-labelledby','authChooserT');
  var x=btn('auth-x',['×'],closeChooser);x.setAttribute('aria-label',L('close'));
  var h=mk('h2','',[L('choose_t')]);h.id='authChooserT';
  var card=mk('div','auth-card',[x,mk('span','auth-lock',[inIcon()]),h,mk('p','',[L('choose_sub')]),providerList(closeChooser),mk('small','',[L('safe')])]);
  m.appendChild(card);
  m.addEventListener('click',function(e){if(e.target===m)closeChooser()});
  m.addEventListener('keydown',function(e){if(e.key==='Escape')closeChooser()});
  document.body.appendChild(m);
  var f=card.querySelector('.auth-prov:not([disabled])');if(f)f.focus();
}
function closeChooser(){var m=document.getElementById('authChooser');if(m){m.parentNode.removeChild(m);if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}}}

function render(){
  var end=document.querySelector('header.top .top-end');
  if(end){
    var box=document.getElementById('authBox');if(!box){box=mk('div','auth-box');box.id='authBox';end.insertBefore(box,end.firstChild)}
    clear(box);var u=session();
    if(!anyOn){box.hidden=true}
    else{
      box.hidden=false;
      if(isGame()&&mode()==='friends'){var fm=btn('auth-mode',[frIcon(),mk('span','',[L('friends_on')])],function(){setMode('stream');render()});fm.title=L('stream_back');fm.setAttribute('aria-label',L('friends_on')+' — '+L('stream_back'));box.appendChild(fm)}
      if(u){var w=mk('span','auth-who p-'+u.provider,[avatarEl(u),bdi(u.display||u.login),mk('span','auth-pv',[ICON[u.provider]()])]);w.title=L('as')+' '+(u.display||u.login)+' · '+L('p_'+u.provider);if(window.LammaLevels)try{LammaLevels.decorate(w,u)}catch(e){}box.appendChild(w);box.appendChild(outBtn())}
      else{var si=btn('tw-btn auth-in',[inIcon(),mk('span','',[L('signin')])],openChooser);si.setAttribute('aria-label',L('signin'));si.setAttribute('aria-haspopup','dialog');box.appendChild(si)}
    }
  }
  var c=document.getElementById('authChooser');if(c){closeChooser();if(!session())openChooser()}
  gate(session());
}
function isGame(){return document.body.classList.contains('gpage')}
function gate(u){
  var g=document.getElementById('authGate');
  var ch=A?A.channel:'';
  var ok=canControl(ch);
  if(!isGame()||ok){if(g)g.parentNode.removeChild(g);document.documentElement.classList.remove('auth-locked');return}
  if(!g){g=mk('div','auth-gate');g.id='authGate';g.setAttribute('role','dialog');g.setAttribute('aria-modal','true');document.body.appendChild(g)}
  document.documentElement.classList.add('auth-locked');clear(g);
  var card;
  if(mode()==='friends'){
    card=mk('div','auth-card',[mk('span','auth-lock',[frIcon()]),mk('h2','',[L('friends_t')]),mk('p','',[L('friends_in')]),providerList(null)]);
    var back=btn('auth-link',[L('stream_back')],function(){setMode('stream')});
    card.appendChild(mk('div','auth-acts auth-alt',[back]));
  }else{
    card=mk('div','auth-card',[mk('span','auth-lock',[lockIcon()]),mk('h2','',[L('gate_t')])]);
    if(u){
      card.appendChild(mk('p','',[L('gate_other')+' ',mk('b','',[bdi(u.display||u.login)]),' '+L('gate_other2')+' ',mk('b','',[bdi('#'+ch)]),' '+L('gate_other3')]));
      var acts=mk('div','auth-acts');
      if(u.provider==='twitch'){var mine=mk('a','tw-btn',[twIcon(),mk('span','',[L('mine')+' ',bdi('#'+u.login)])]);mine.href=chanUrl(u.login);acts.appendChild(mine)}
      else acts.appendChild(twBtn(L('in')));
      acts.appendChild(outBtn());card.appendChild(acts);
    }else{
      card.appendChild(mk('p','',[L('gate_in')]));card.appendChild(mk('div','auth-acts',[twBtn(L('in'),true)]));
    }
    card.appendChild(mk('div','auth-or',[mk('span','',[L('or')])]));
    card.appendChild(mk('div','auth-acts',[btn('auth-friends',[frIcon(),mk('span','',[L('friends')])],function(){setMode('friends')})]));
    card.appendChild(mk('small','',[L('safe')]));
  }
  g.appendChild(card);
}
function boot(){
  if(!A||A.obs)return; // overlays stay tokenless and read-only
  render();if(A.onLang)A.onLang(render);
  window.addEventListener('lamma-auth',render);
  window.addEventListener('storage',function(e){if(e.key===SESS||e.key===MODE)render()});
  var t=twTok(),s=session();
  // Twitch asks apps to re-check a token at least hourly
  if(t&&s&&s.provider==='twitch'&&ON.twitch&&Date.now()-(t.checked||0)>50*60*1000)validate(t.token).then(render,function(){SS.del(KEY);LS.del(SESS);render()});
}
window.LammaAuth={enabled:enabled,clientId:TWITCH_CLIENT_ID,providers:ON,user:user,session:session,login:login,signIn:signIn,guest:guest,logout:logout,finish:finish,allowed:allowed,
  redirectUri:redirectUri,authorizeUrl:authorizeUrl,open:openChooser,mode:mode,setMode:setMode,canControl:canControl,switchAccount:switchAccount};
if(A){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot()}
})();
