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
})();
