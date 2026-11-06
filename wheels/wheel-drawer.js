/* درج الإعدادات لعجلة الشخصنة (مش شغّال بوضع OBS) */
(function(){
  if(/[?&]obs=1/.test(location.search))return;
  var b=document.body,btn=document.getElementById('drawerBtn'),side=document.getElementById('side'),x=document.getElementById('drawerClose');
  if(!btn||!side)return;
  var top=document.querySelector('header.top');
  function hdr(){if(top)document.documentElement.style.setProperty('--hdr',top.offsetHeight+'px');}
  hdr();window.addEventListener('resize',hdr);if(window.ResizeObserver&&top)new ResizeObserver(hdr).observe(top);
  function set(on){b.classList.toggle('drawer-open',on);btn.setAttribute('aria-expanded',String(on));}
  btn.addEventListener('click',function(){set(!b.classList.contains('drawer-open'));});
  if(x)x.addEventListener('click',function(){set(false);btn.focus();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&b.classList.contains('drawer-open'))set(false);});
  /* شريط "تعديل الشكل / الخلفية" بيتعمل بـ layout.js فوق الستيج: منحطو بأول الدرج */
  var wrap=document.querySelector('.stage-wrap'),head=side.querySelector('.drawer-head');
  function grab(){var bar=wrap&&wrap.querySelector(':scope>.lay-bar');if(!bar)return false;side.insertBefore(bar,head?head.nextSibling:side.firstChild);return true;}
  if(!grab()&&wrap&&window.MutationObserver){var mo=new MutationObserver(function(){if(grab())mo.disconnect();});mo.observe(wrap,{childList:true});setTimeout(function(){mo.disconnect();},10000);}

  /* أزرار التحكم السريع: الستريمر بيلعب من الصفحة بدون ما يفتح الدرج */
  var q=document.getElementById('dockQuick'),st=document.getElementById('dockStatus'),src=document.getElementById('wStatus'),mir=[];
  if(q){
    [['wUndo',0],['wSkip',0],['wPause',0],['wRand',0],['wRespin',0],['whSpin',1]].forEach(function(d){
      var o=document.getElementById(d[0]);if(!o)return;
      var m=document.createElement('button');m.type='button';m.className='dock-btn'+(d[1]?' dock-main':'');
      m.addEventListener('click',function(){o.click();sync();});
      q.appendChild(m);mir.push([o,m]);
    });
    function sync(){
      mir.forEach(function(p){var o=p[0],m=p[1];
        if(m.textContent!==o.textContent.trim())m.textContent=o.textContent.trim();
        m.disabled=!!o.disabled;m.hidden=(o.offsetParent===null||o.hidden);});
      if(st&&src){var t=src.textContent.trim();if(st.textContent!==t){st.textContent=t;st.title=t;}}
    }
    sync();setInterval(sync,250);
  }

  /* حجم الخط بيتحسب من عرض منطقة الـ16:9 (مش من الستيج الكامل) */
  var gs=document.getElementById('gs');
  function fitGs(){if(gs&&gs.clientWidth)gs.style.fontSize=Math.max(6.5,gs.clientWidth/60)+'px';}
  if(gs){fitGs();if(window.ResizeObserver)new ResizeObserver(fitGs).observe(gs);else window.addEventListener('resize',fitGs);}
  /* شاشة كاملة للصفحة كلها (الهيدر والشريط والدرج بيضلوا شغّالين) */
  var fb=document.getElementById('dockFs'),de=document.documentElement;
  function fsEl(){return document.fullscreenElement||document.webkitFullscreenElement||null;}
  if(fb){
    if(!(de.requestFullscreen||de.webkitRequestFullscreen))fb.hidden=true;
    var lbl=function(){var ar=de.lang!=='en',on=!!fsEl(),t=on?(ar?'اطلع من الشاشة الكاملة':'Exit fullscreen'):(ar?'شاشة كاملة':'Fullscreen');
      fb.title=t;fb.setAttribute('aria-label',t);fb.setAttribute('aria-pressed',String(on));};
    fb.addEventListener('click',function(){
      if(fsEl()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}
      var r=de.requestFullscreen||de.webkitRequestFullscreen,pr=r&&r.call(de);if(pr&&pr.catch)pr.catch(function(){});});
    document.addEventListener('fullscreenchange',lbl);document.addEventListener('webkitfullscreenchange',lbl);
    if(window.MutationObserver)new MutationObserver(lbl).observe(de,{attributes:true,attributeFilter:['lang']});
    lbl();
  }
  /* الواجهة بتختفي بعد 3 ثواني بلا حركة وبترجع بأي حركة أو لمسة */
  var idleT=null;
  function arm(){clearTimeout(idleT);idleT=setTimeout(function(){
    if(b.classList.contains('drawer-open')){arm();return;}
    b.classList.add('ui-idle');},3000);}
  function wake(){b.classList.remove('ui-idle');arm();}
  ['mousemove','mousedown','touchstart','keydown','wheel'].forEach(function(ev){document.addEventListener(ev,wake,{passive:true});});
  document.addEventListener('focusin',wake);
  arm();

  /* كل عنصر بيلزق بالحافة الأقرب: يسار أو يمين (حسب مكانو بالتوزيع). العجلة بتضل بالنص */
  function anchorAll(){
    if(!gs)return;
    gs.querySelectorAll('.lay-el').forEach(function(n){
      if(n.getAttribute('data-lay')==='wheel'){n.removeAttribute('data-anchor');return;}
      var l=parseFloat(n.style.left),w=parseFloat(n.style.width);if(isNaN(l)||isNaN(w))return;
      var c=l+w/2,a=c<38?'l':(c>62?'r':'');
      if(a){if(n.getAttribute('data-anchor')!==a)n.setAttribute('data-anchor',a);}else if(n.hasAttribute('data-anchor'))n.removeAttribute('data-anchor');
    });
  }
  if(gs){
    var logo=document.getElementById('whLogo');if(logo)logo.setAttribute('data-anchor','r');
    anchorAll();
    if(window.MutationObserver)new MutationObserver(function(ms){
      for(var i=0;i<ms.length;i++){var t=ms[i].target;if(t.classList&&t.classList.contains('lay-el')){anchorAll();return;}}
    }).observe(gs,{subtree:true,attributes:true,attributeFilter:['style']});
  }

  /* أقسام الإعدادات: بتتذكر شو كان مفتوح */
  (function(){
    var K='lamma-wgrp',gr=document.querySelectorAll('.w2-set>.w2-grp'),st={};
    try{st=JSON.parse(localStorage.getItem(K)||'{}')||{};}catch(e){}
    gr.forEach(function(d,i){
      if(st[i]!=null)d.open=!!st[i];
      d.addEventListener('toggle',function(){st[i]=d.open?1:0;try{localStorage.setItem(K,JSON.stringify(st));}catch(e){}});
    });
  })();
})();
