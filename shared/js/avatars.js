/* avatars.js — viewers' Twitch profile pictures, public and cached, never blocking anything.
   LammaAvatars.get(login) → a static-cdn.jtvnw.net URL when it is known, else null (and the login is queued).
   Queued logins are looked up together (one Twitch GQL request for up to 35 logins, public Client-ID, no login / token);
   if that fails, one decapi.me lookup per login. Results are cached in localStorage for 7 days (misses for 1 day).
   LammaAvatars.onChange(fn) runs fn after new pictures arrived, so lists / the wheel can repaint.
   Anything that is not a Twitch login gets no lookup: the letter circle stays. */
(function(root){
'use strict';
var CID='kimne78kx3ncx6brgo4mv6wki5h1ko',DAY=864e5,OK=7*DAY,MISS=DAY,PFX='lamma-av-';
var mem={},queue=[],queued={},fns=[],timer=null,busy=false;
var CDN=/^https:\/\/static-cdn\.jtvnw\.net\/[^\s"'<>()]+$/;
function valid(l){return /^[a-z0-9_]{2,25}$/.test(l)}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function now(){return Date.now()}
function remember(l,url){mem[l]=url||'';lsSet(PFX+l,(url||'-')+'|'+now());}
function cached(l){
  if(l in mem)return mem[l];
  var v=lsGet(PFX+l);if(!v)return undefined;var i=v.lastIndexOf('|'),u=v.slice(0,i),t=+v.slice(i+1)||0;
  if(u==='-'){if(now()-t<MISS){mem[l]='';return ''}return undefined}
  if(CDN.test(u)&&now()-t<OK){mem[l]=u;return u}return undefined;
}
function emit(){fns.forEach(function(f){try{f()}catch(e){}})}
function flush(){
  timer=null;if(busy||!queue.length)return;if(typeof fetch!=='function')return;
  var batch=queue.splice(0,35);busy=true;
  var q='{'+batch.map(function(l,i){return 'u'+i+':user(login:"'+l+'"){profileImageURL(width:50)}'}).join(' ')+'}';
  fetch('https://gql.twitch.tv/gql',{method:'POST',headers:{'Client-ID':CID,'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({query:q})})
    .then(function(r){if(!r.ok)throw new Error('gql '+r.status);return r.json()})
    .then(function(j){var d=(j&&j.data)||{};if(!j||!j.data)throw new Error('gql shape');
      batch.forEach(function(l,i){var u=d['u'+i]&&d['u'+i].profileImageURL;remember(l,CDN.test(String(u||''))?u:'');delete queued[l];});})
    .catch(function(){return Promise.all(batch.map(function(l){
      return fetch('https://decapi.me/twitch/avatar/'+encodeURIComponent(l)).then(function(r){return r.ok?r.text():''}).then(function(u){u=String(u||'').trim();remember(l,CDN.test(u)?u:'');delete queued[l];}).catch(function(){delete queued[l];});}));})
    .then(function(){busy=false;emit();if(queue.length)timer=setTimeout(flush,400);},function(){busy=false;});
}
function get(login){
  var l=String(login||'').toLowerCase().replace(/^@/,'');if(!valid(l))return null;
  var c=cached(l);if(c!==undefined)return c||null;
  if(!queued[l]){queued[l]=1;queue.push(l);if(!timer)timer=setTimeout(flush,250);}
  return null;
}
/* a small round picture with the letter circle under it (in the viewer's colour) until / unless the picture loads */
function el(login,name,color){
  var s=document.createElement('span');s.className='av';s.setAttribute('aria-hidden','true');
  var ch=Array.from(String(name||login||'?').replace(/^[^\p{L}\p{N}]+/u,''))[0]||'?';
  s.textContent=ch.toUpperCase();if(color)s.style.setProperty('--avc',color);
  var u=get(login);if(u){var im=document.createElement('img');im.alt='';im.decoding='async';im.loading='lazy';im.referrerPolicy='no-referrer';im.src=u;
    im.addEventListener('error',function(){im.remove()});s.appendChild(im);s.classList.add('has-img');}
  return s;
}
/* decoded images for canvas drawing (the wheel): null until loaded */
var imgs={};
function image(login){
  var u=get(login);if(!u)return null;var im=imgs[u];
  if(!im){im=imgs[u]=new Image();im.referrerPolicy='no-referrer';im.onload=function(){im._ok=1};im.onerror=function(){im._bad=1};im.src=u;}
  return im._ok?im:null;
}
var api={get:get,el:el,image:image,onChange:function(f){fns.push(f)},valid:valid,_mem:mem};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.LammaAvatars=api;
})(typeof window!=='undefined'?window:globalThis);
