/* theme.js — theme picker for لَمّة. Runs in <head> so the theme is set before first paint.
   ?theme=<name> wins (OBS overlays use it), then the saved choice, then "channel".
   "custom" (ألوانك) = the streamer's own four colours (main, second, background, text) picked in the menu; saved in
   localStorage (lamma-theme-custom) and carried in OBS links as &theme=custom&tc=<24 hex digits>. The colours drive the
   site chrome (the same variables the preset themes set) and the wheel slices (--wh-*). */
(function(){
'use strict';
var T=[{id:'channel',ar:'قناتي',en:'Channel',sw:'linear-gradient(135deg,#c9ccf0,#868CBC 55%,#16161c)'},
       {id:'neon',ar:'نيون',en:'Neon',sw:'linear-gradient(135deg,#ff3dac,#8205B3 55%,#22e6ff)'},
       {id:'gold',ar:'ذهبي',en:'Gold',sw:'linear-gradient(135deg,#fbe7a6,#d4a64a 55%,#0a0907)'},
       {id:'minecraft',ar:'أخضر ماين',en:'Minecraft',sw:'linear-gradient(135deg,#b8f0a8,#5cc64a 55%,#3a2a1a)'},
       {id:'fire',ar:'نار',en:'Fire',sw:'linear-gradient(135deg,#ffd08a,#ff6a2b 55%,#b8281a)'},
       {id:'custom',ar:'ألوانك',en:'Custom',sw:''}];
var IDS=T.map(function(t){return t.id});
var DEF_CUSTOM=['3dd6c3','15151c','0b0b10','f1f1f4'];
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
var Q=null;try{Q=new URLSearchParams(location.search)}catch(e){}
var q=Q&&Q.get('theme');
var cur=IDS.indexOf(q)>=0?q:(IDS.indexOf(ls('lamma-theme'))>=0?ls('lamma-theme'):'channel');
function parseTc(v){v=String(v||'').toLowerCase().replace(/[^0-9a-f]/g,'');if(v.length!==24)return null;return [v.slice(0,6),v.slice(6,12),v.slice(12,18),v.slice(18,24)]}
var custom=(q==='custom'&&Q&&parseTc(Q.get('tc')))||parseTc(ls('lamma-theme-custom'))||DEF_CUSTOM.slice();
var root=document.documentElement;root.setAttribute('data-theme',cur);

/* ---------- colour helpers ---------- */
function rgb(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function hx(c){return '#'+c.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16)}).join('')}
function mix(a,b,t){var x=rgb(a),y=rgb(b);return hx([0,1,2].map(function(i){return x[i]+(y[i]-x[i])*t}))}
function lum(h){var c=rgb(h).map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function contrast(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function ink(h){return contrast(h,'#0c0c10')>=contrast(h,'#ffffff')?'#0c0c10':'#ffffff'}
/* text on a slice: the other main colour when it reads well (gold on black, black on gold), else black / white */
function on(bgc,other){return contrast(bgc,other)>=3?other:ink(bgc)}
function customVars(c){
  var m='#'+c[0],s='#'+c[1],bg='#'+c[2],tx='#'+c[3],g=rgb(m),mid=mix(m,s,.5);
  return {'--bg':bg,'--bg2':mix(bg,'#ffffff',.05),'--card':mix(bg,'#ffffff',.05),'--card2':mix(bg,'#ffffff',.08),'--line':mix(bg,m,.22),'--line2':mix(bg,m,.35),
    '--tx':tx,'--mut':mix(tx,bg,.35),'--dim':mix(tx,bg,.55),'--pur':mix(m,'#000000',.25),'--lav':mix(m,'#ffffff',.6),'--vio':m,'--pk':m,'--cy':mix(m,'#ffffff',.2),'--blue':m,
    '--ta':m,'--ta2':mix(m,'#ffffff',.2),'--ta3':mix(m,'#000000',.25),'--glow':g.join(','),'--thi':mix(m,'#ffffff',.6),'--tink':ink(m),'--tp1':mix(m,'#ffffff',.45),'--tp3':mix(m,'#000000',.4),
    '--wh-multi':'0','--wh-a':m,'--wh-b':s,'--wh-c':mid,'--wh-ta':on(m,s),'--wh-tb':on(s,m),'--wh-tc':ink(mid),
    '--wh-rim':m,'--wh-l1':mix(m,'#ffffff',.55),'--wh-l2':mix(m,'#000000',.35),'--wh-base':mix(bg,'#000000',.2),'--wh-empty':mix(bg,'#ffffff',.05),
    '--wh-ptr':mix(m,'#ffffff',.25),'--wh-ptr-glow':'rgba('+g.join(',')+',.6)','--wh-hubring':m,'--wh-hubtx':on(mix(s,'#ffffff',.05),m),'--wh-hub1':mix(s,'#ffffff',.1),'--wh-hub2':mix(s,'#000000',.3)};
}
var applied=[];
function applyCustom(){
  applied.forEach(function(k){root.style.removeProperty(k)});applied=[];
  if(cur!=='custom')return;var v=customVars(custom);for(var k in v){root.style.setProperty(k,v[k]);applied.push(k)}
}
applyCustom();
function swCustom(){return 'linear-gradient(135deg,#'+custom[0]+' 0 50%,#'+custom[1]+' 50% 100%)'}

function syncObs(){var i=document.getElementById('obsUrl');if(!i||!i.value)return;try{var u=new URL(i.value);
  if(cur==='channel')u.searchParams.delete('theme');else u.searchParams.set('theme',cur);
  if(cur==='custom')u.searchParams.set('tc',custom.join(''));else u.searchParams.delete('tc');
  var nv=u.toString();if(nv!==i.value)i.value=nv}catch(e){}}
function set(id){if(IDS.indexOf(id)<0)return;cur=id;root.setAttribute('data-theme',id);ls('lamma-theme',id);applyCustom();syncObs();paint()}
function setCustom(i,hex){custom[i]=hex.replace('#','').toLowerCase();ls('lamma-theme-custom',custom.join(''));if(cur!=='custom'){cur='custom';root.setAttribute('data-theme','custom');ls('lamma-theme','custom')}applyCustom();syncObs();
  var sw=menu&&menu.querySelector('.theme-opt[data-id=custom] .theme-sw');if(sw)sw.style.background=swCustom();}
var btn,menu;
function lang(){return window.App&&App.lang?App.lang():(root.lang==='en'?'en':'ar')}
function L(ar,en){return lang()==='en'?en:ar}
function paint(){
  if(!menu)return;while(menu.firstChild)menu.removeChild(menu.firstChild);
  T.forEach(function(t){var b=document.createElement('button');b.type='button';b.className='theme-opt';b.setAttribute('data-id',t.id);b.setAttribute('role','menuitemradio');b.setAttribute('aria-checked',String(t.id===cur));
    var s=document.createElement('span');s.className='theme-sw';s.style.background=t.id==='custom'?swCustom():t.sw;b.appendChild(s);b.appendChild(document.createTextNode(lang()==='en'?t.en:t.ar));
    if(t.id==='custom'){var pen=document.createElement('span');pen.className='theme-pen';pen.textContent='🎨';b.appendChild(pen);}
    b.addEventListener('click',function(){set(t.id);if(t.id!=='custom'){menu.hidden=true;btn.setAttribute('aria-expanded','false')}});menu.appendChild(b)});
  if(cur==='custom'){ /* the four colour pickers live right under the option */
    var box=document.createElement('div');box.className='theme-custom';
    [[0,L('اللون الأساسي','Main colour')],[1,L('اللون الثاني','Second colour')],[2,L('الخلفية','Background')],[3,L('الكتابة','Text')]].forEach(function(r){
      var lab=document.createElement('label');lab.className='tc-row';var sp=document.createElement('span');sp.textContent=r[1];
      var inp=document.createElement('input');inp.type='color';inp.value='#'+custom[r[0]];inp.setAttribute('data-tc',String(r[0]));inp.setAttribute('aria-label',r[1]);
      inp.addEventListener('input',function(){setCustom(r[0],inp.value)});inp.addEventListener('change',function(){setCustom(r[0],inp.value)});
      lab.appendChild(sp);lab.appendChild(inp);box.appendChild(lab)});
    var rs=document.createElement('button');rs.type='button';rs.className='tc-reset';rs.textContent='↺ '+L('أعِد الألوان','Reset colours');
    rs.addEventListener('click',function(){custom=DEF_CUSTOM.slice();ls('lamma-theme-custom',custom.join(''));applyCustom();syncObs();paint()});box.appendChild(rs);
    var note=document.createElement('p');note.className='tc-note';note.textContent=L('تُطبَّق على الموقع وعلى العجلة، وتُحفظ برابط OBS.','Applies to the site and the wheel, and is saved in the OBS link.');box.appendChild(note);
    menu.appendChild(box);
  }
  btn.setAttribute('aria-label',lang()==='en'?'Theme':'الثيم');btn.title=btn.getAttribute('aria-label');
}
function mount(){
  var obs=false;try{obs=new URLSearchParams(location.search).get('obs')==='1'}catch(e){}
  var end=document.querySelector('header.top .top-end');if(obs||!end)return;
  var w=document.createElement('div');w.className='theme-wrap';
  btn=document.createElement('button');btn.type='button';btn.className='theme-btn';btn.setAttribute('aria-haspopup','menu');btn.setAttribute('aria-expanded','false');
  var NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('aria-hidden','true');
  var p=document.createElementNS(NS,'path');p.setAttribute('d','M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z');svg.appendChild(p);
  [[7.5,11],[10,7.5],[14.5,7.5]].forEach(function(c){var e=document.createElementNS(NS,'circle');e.setAttribute('cx',c[0]);e.setAttribute('cy',c[1]);e.setAttribute('r','1.2');e.setAttribute('fill','currentColor');svg.appendChild(e)});
  btn.appendChild(svg);
  menu=document.createElement('div');menu.className='theme-menu';menu.setAttribute('role','menu');menu.hidden=true;
  btn.addEventListener('click',function(e){e.stopPropagation();menu.hidden=!menu.hidden;btn.setAttribute('aria-expanded',String(!menu.hidden))});
  document.addEventListener('click',function(e){if(!w.contains(e.target)){menu.hidden=true;btn.setAttribute('aria-expanded','false')}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!menu.hidden){menu.hidden=true;btn.focus()}});
  w.appendChild(btn);w.appendChild(menu);var lb=document.getElementById('langBtn');end.insertBefore(w,lb||null);
  paint();if(window.App&&App.onLang)App.onLang(paint);
  syncObs();var i=document.getElementById('obsUrl');if(i){/* keep the theme in the OBS link when a game rewrites it */
    var last='';setInterval(function(){if(i.value!==last){syncObs();last=i.value}},700)}
}
window.LammaTheme={list:IDS,get:function(){return cur},set:set,custom:function(){return custom.slice()},setCustom:function(arr){arr.forEach(function(h,i){setCustom(i,h)});paint()},vars:customVars};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
