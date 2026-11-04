/* gate.js — one switch for "only the streamer opens the control panel".
   Uses window.requireStreamer(channel) → Promise<boolean> if a page defines one, else the shared Twitch login
   (auth.js: LammaAuth.canControl(channel), which also draws its own lock screen), else lets everyone in. Until then this fallback lets everyone in. Overlays (?obs=1) are never gated: they carry no
   controls and no secrets. When the promise resolves false the page gets html.ctrl-locked (games2.css hides every .ctrl-only
   element and every .secret), and the login module can show its own sign-in prompt. Elements stay in the DOM so the game
   scripts never meet a missing element; a locked visitor's page only ever holds its own local game, never the streamer's. */
(function(){
'use strict';
var A=window.App;if(!A||A.obs)return;
function run(){
var req=typeof window.requireStreamer==='function'?window.requireStreamer:
  (window.LammaAuth&&typeof LammaAuth.canControl==='function')?function(ch){return Promise.resolve(LammaAuth.canControl(ch))}:
  function(){return Promise.resolve(true)};
var res;try{res=req(A.channel)}catch(e){res=Promise.resolve(false)}
Promise.resolve(res).then(function(ok){
  if(ok)return;
  document.documentElement.classList.add('ctrl-locked');
},function(){document.documentElement.classList.add('ctrl-locked');});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else setTimeout(run,0);
})();
