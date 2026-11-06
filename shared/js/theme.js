/* theme.js — theme picker for لَمّة. Runs in <head> so the theme is set before first paint.
   ?theme=<name> wins (OBS overlays use it), then the saved choice, then "channel" (shown as «الافتراضي / Default»;
   the id stays "channel" so saved choices and OBS links keep working).
   It also builds the header ☰ menu (window.LammaMenu): a drawer that slides in from the left and holds
   the language switch, the colours picker and the leaderboard link.
   "custom" (ألوانك) = the streamer's own four colours (main, second, background, text) picked in the menu; saved in
   localStorage (lamma-theme-custom) and carried in OBS links as &theme=custom&tc=<24 hex digits>. The colours drive the
   site chrome (the same variables the preset themes set) and the wheel slices (--wh-*). */
(function(){
'use strict';
var T=[{id:'channel',ar:'الافتراضي',en:'Default',sw:'linear-gradient(135deg,#c9ccf0,#868CBC 55%,#16161c)'},
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
    b.addEventListener('click',function(){set(t.id);if(t.id!=='custom'){menu.hidden=true;btn.setAttribute('aria-expanded','false');if(MN)MN.close()}});menu.appendChild(b)});
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
  var lab=btn.querySelector('.lmn-lab');if(lab){lab.textContent=L('الألوان','Colours');btn.querySelector('.lmn-sub').textContent=curName();btn.setAttribute('aria-label',L('الألوان','Colours')+': '+curName());btn.removeAttribute('title')}
}
/* ---------- ☰ header menu: drawer from the LEFT (both ar and en) ---------- */
var MN=null;
function svgIcon(paths,extra){var NS='http://www.w3.org/2000/svg',v=document.createElementNS(NS,'svg');v.setAttribute('viewBox','0 0 24 24');v.setAttribute('fill','none');v.setAttribute('stroke','currentColor');v.setAttribute('stroke-width','1.8');v.setAttribute('stroke-linecap','round');v.setAttribute('stroke-linejoin','round');v.setAttribute('aria-hidden','true');
  paths.forEach(function(d){var p=document.createElementNS(NS,'path');p.setAttribute('d',d);v.appendChild(p)});if(extra)extra(v,NS);return v}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function menuEnsure(){
  if(MN)return MN;
  var obs=false;try{obs=new URLSearchParams(location.search).get('obs')==='1'}catch(e){}
  var top=document.querySelector('header.top'),end=top&&top.querySelector('.top-end');if(obs||!end)return null;
  var b=el('button','lmn-btn');b.type='button';b.id='lmnBtn';b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','lmnDrawer');
  b.appendChild(svgIcon(['M4 6.5h16','M4 12h16','M4 17.5h16']));
  top.appendChild(b);
  var back=el('div','lmn-back');back.hidden=true;
  var d=el('aside','lmn-drawer');d.id='lmnDrawer';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-hidden','true');d.tabIndex=-1;
  var hd=el('div','lmn-head'),ttl=el('span','lmn-title'),x=el('button','lmn-x');x.type='button';x.appendChild(svgIcon(['M6 6l12 12','M18 6L6 18']));
  hd.appendChild(ttl);hd.appendChild(x);d.appendChild(hd);
  var list=el('div','lmn-list');d.appendChild(list);
  document.body.appendChild(back);document.body.appendChild(d);
  var timer=0;
  function isOpen(){return root.classList.contains('lmn-open')}
  function open(){if(isOpen())return;clearTimeout(timer);back.hidden=false;d.style.visibility='visible';
    void d.offsetWidth;root.classList.add('lmn-open');b.setAttribute('aria-expanded','true');d.setAttribute('aria-hidden','false');
    setTimeout(function(){var f=list.querySelector('button:not([hidden]),a:not([hidden])');try{(f||x).focus({preventScroll:true})}catch(e){}},60)}
  function close(noFocus){if(!isOpen())return;root.classList.remove('lmn-open');b.setAttribute('aria-expanded','false');d.setAttribute('aria-hidden','true');
    if(menu&&!menu.hidden){menu.hidden=true;if(btn)btn.setAttribute('aria-expanded','false')}
    clearTimeout(timer);timer=setTimeout(function(){if(!isOpen()){back.hidden=true;d.style.visibility=''}},300);
    if(!noFocus)try{b.focus({preventScroll:true})}catch(e){}}
  b.addEventListener('click',function(e){e.stopPropagation();isOpen()?close():open()});
  x.addEventListener('click',function(){close()});
  back.addEventListener('click',function(){close()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&isOpen()){e.preventDefault();close()}});
  /* keep Tab focus inside the open drawer */
  d.addEventListener('keydown',function(e){if(e.key!=='Tab')return;var f=[].filter.call(d.querySelectorAll('button,a[href],input'),function(n){return n.offsetParent!==null&&!n.disabled});if(!f.length)return;
    var a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}});
  function add(key,node,order){node.setAttribute('data-lmn',key);node.setAttribute('data-order',String(order||9));
    var kids=[].slice.call(list.children),at=null;for(var i=0;i<kids.length;i++){if(+kids[i].getAttribute('data-order')>(order||9)){at=kids[i];break}}
    list.insertBefore(node,at);return node}
  /* language row: proxies the page's own #langBtn (app.js keeps owning it), which leaves the header */
  var lb=document.getElementById('langBtn'),lrow=null,lval=null,lsub=null;
  if(lb){
    var hold=el('div','lmn-hold');hold.hidden=true;hold.appendChild(lb);d.appendChild(hold);
    lrow=el('button','lmn-row lmn-lang');lrow.type='button';
    lrow.appendChild(el('span','lmn-ico')).appendChild(svgIcon(['M3 12h18','M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z'],function(v,NS){var c=document.createElementNS(NS,'circle');c.setAttribute('cx','12');c.setAttribute('cy','12');c.setAttribute('r','9');v.insertBefore(c,v.firstChild)}));
    var lt=el('span','lmn-txt');lt.appendChild(el('span','lmn-lab'));lsub=lt.appendChild(el('small','lmn-sub'));lrow.appendChild(lt);
    lval=lrow.appendChild(el('span','lmn-pill'));lval.setAttribute('dir','auto');
    lrow.addEventListener('click',function(){lb.click()});
    add('lang',lrow,1);
  }
  function relabel(){
    ttl.textContent=L('القائمة','Menu');x.setAttribute('aria-label',L('إغلاق القائمة','Close menu'));
    b.setAttribute('aria-label',L('القائمة','Menu'));b.title=b.getAttribute('aria-label');d.setAttribute('aria-label',L('القائمة','Menu'));
    if(lrow){lrow.querySelector('.lmn-lab').textContent=L('اللغة','Language');lsub.textContent=L('العربية','English');
      lval.textContent=lb.textContent||(lang()==='en'?'ع':'EN');lrow.setAttribute('aria-label',L('اللغة: العربية — التبديل إلى English','Language: English — switch to العربية'))}
  }
  relabel();if(window.App&&App.onLang)App.onLang(relabel);
  MN={add:add,open:open,close:close,isOpen:isOpen,relabel:relabel,drawer:d,button:b};
  window.LammaMenu=MN;
  return MN;
}
function curName(){for(var i=0;i<T.length;i++)if(T[i].id===cur)return lang()==='en'?T[i].en:T[i].ar;return ''}
function mount(){
  var obs=false;try{obs=new URLSearchParams(location.search).get('obs')==='1'}catch(e){}
  var end=document.querySelector('header.top .top-end');if(obs||!end)return;
  var M=menuEnsure();
  var w=document.createElement('div');w.className='theme-wrap'+(M?' lmn-theme':'');
  btn=document.createElement('button');btn.type='button';btn.className=M?'lmn-row theme-btn':'theme-btn';btn.setAttribute('aria-haspopup','menu');btn.setAttribute('aria-expanded','false');
  var NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('aria-hidden','true');
  var p=document.createElementNS(NS,'path');p.setAttribute('d','M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z');svg.appendChild(p);
  [[7.5,11],[10,7.5],[14.5,7.5]].forEach(function(c){var e=document.createElementNS(NS,'circle');e.setAttribute('cx',c[0]);e.setAttribute('cy',c[1]);e.setAttribute('r','1.2');e.setAttribute('fill','currentColor');svg.appendChild(e)});
  if(M){var ic=el('span','lmn-ico');ic.appendChild(svg);btn.appendChild(ic);var tx=el('span','lmn-txt');tx.appendChild(el('span','lmn-lab'));tx.appendChild(el('small','lmn-sub'));btn.appendChild(tx);
    var chev=el('span','lmn-chev');chev.appendChild(svgIcon(['M6 9l6 6 6-6']));btn.appendChild(chev)}
  else btn.appendChild(svg);
  menu=document.createElement('div');menu.className='theme-menu';menu.setAttribute('role','menu');menu.hidden=true;
  btn.addEventListener('click',function(e){e.stopPropagation();menu.hidden=!menu.hidden;btn.setAttribute('aria-expanded',String(!menu.hidden))});
  document.addEventListener('click',function(e){if(!w.contains(e.target)){menu.hidden=true;btn.setAttribute('aria-expanded','false')}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!menu.hidden){menu.hidden=true;if(!M)btn.focus()}});
  w.appendChild(btn);w.appendChild(menu);
  if(M)M.add('theme',w,2);else{var lb=document.getElementById('langBtn');end.insertBefore(w,lb&&lb.parentNode===end?lb:null)}
  paint();if(window.App&&App.onLang)App.onLang(paint);
  syncObs();var i=document.getElementById('obsUrl');if(i){/* keep the theme in the OBS link when a game rewrites it */
    var last='';setInterval(function(){if(i.value!==last){syncObs();last=i.value}},700)}
}
window.LammaMenuEnsure=menuEnsure; /* levels.js may need the menu before DOMContentLoaded (App.boot runs early) */
window.LammaTheme={list:IDS,get:function(){return cur},set:set,custom:function(){return custom.slice()},setCustom:function(arr){arr.forEach(function(h,i){setCustom(i,h)});paint()},vars:customVars};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
