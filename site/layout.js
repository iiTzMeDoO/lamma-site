/* layout.js — on-stage layout editor + background toggle, reusable by any game page.
   A page marks each movable piece of its stage as <div class="lay-el" data-lay="id"><div class="lay-c">…content…</div></div>
   inside one positioned root, then calls LammaLayout.init({...}). Positions are percent of the root (x, y, w, h).
   - "scale" items keep their own aspect (height follows content / aspect-ratio) and their text grows with the width (the wheel).
   - "box" items take a free width and height: the edge grips (top / bottom / left / right) change only that side and the text
     keeps its size; the corner grips resize the whole box proportionally and the text scales with it (stored as s).
   - an item with snapCenter:true (the wheel) is a magnet: any other piece dropped over its middle lands exactly centred on it.
   While dragging, pieces snap to the stage edges and centre lines, to other pieces' edges / centres and to the wheel centre,
   with guide lines drawn on the stage (hold Alt to place freely).
   The layout is saved per channel+page in localStorage and travels to the OBS overlay as one compact URL param (&lay=…);
   the background choice travels as &bg=1 / &bg=0. The overlay (?obs=1) never builds handles, guides, bars or panels.
   A piece can be a STACK (it.sections): one panel whose sections ([data-sec] inside it) share its height; a hidden section drops
   out and the others grow to fill it, and the dividers between sections are dragged up / down to give one more room than the other.
   A fullscreen button sits at the stage's bottom-left (control page only).
   Pure helpers (encode/decode) work in Node for tests. Codec "c" = 12 chars per piece (code, v/h, x, y, w, h, text scale) plus
   4 per section (CODE, v/h, share); old "b" (12 per piece) and "a" (10 per piece) links still decode. */
(function(root){
'use strict';
var VER='c';
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function b36(v){var n=clamp(Math.round(v*10),0,1295);var s=n.toString(36);return s.length<2?'0'+s:s}
function s36(v){var n=clamp(Math.round(v*100),0,1295);var s=n.toString(36);return s.length<2?'0'+s:s}
var SMIN=.4,SMAX=3,FMIN=.3,FMAX=100;
/* a "stack" piece (it.sections) is one panel holding several sections one under the other; each section has a share f of the
   panel's height (flex-grow) and can be hidden (v:0) — the visible ones always fill the panel. */
function secDefaults(it){var o={};(it.sections||[]).forEach(function(s){var d=s.def||{};o[s.id]={f:d.f||1,v:d.v===false?0:1}});return o}
function defaults(items){var o={};items.forEach(function(it){var d=it.def;o[it.id]={x:d.x,y:d.y,w:d.w,h:it.kind==='box'?(d.h||0):0,s:it.kind==='box'?(d.s||1):1,v:d.v===false?0:1};if(it.sections)o[it.id].sec=secDefaults(it)});return o}
function encodeRaw(lay,items){
  return VER+items.map(function(it){var p=lay[it.id]||{},box=it.kind==='box';
    var s=it.code+(p.v===0?'h':'v')+b36(p.x||0)+b36(p.y||0)+b36(p.w||0)+b36(box?(p.h||0):0)+s36(box?(p.s||1):1);
    /* sections: 4 chars each, the code in CAPITALS so a reader can always tell a section from a piece */
    (it.sections||[]).forEach(function(sc){var q=(p.sec&&p.sec[sc.id])||{f:1,v:1};s+=sc.code.toUpperCase()+(q.v===0?'h':'v')+b36(clamp(q.f,FMIN,FMAX))});
    return s}).join('');
}
/* '' means "the default layout", so a default never adds a param to the OBS link */
function encode(lay,items){var e=encodeRaw(lay,items);return e===encodeRaw(defaults(items),items)?'':e}
function parsePiece(str,i,ver,it){
  var n=[0,1,2,3].map(function(k){return parseInt(str.substr(i+2+k*2,2),36)/10});
  if(n.some(function(v){return !isFinite(v)||v<0||v>100}))return null;
  var d=it.def,minW=it.minW||6,minH=it.minH||4,box=it.kind==='box',s=1,fl=str.charAt(i+1);
  var w=clamp(n[2],minW,100),h=0;
  if(box){
    if(ver!=='a'){s=parseInt(str.substr(i+10,2),36)/100;if(!isFinite(s)||s<SMIN||s>SMAX)return null;h=n[3];}
    else if(n[3]>0){h=n[3];s=clamp(Math.sqrt((w*h)/(d.w*(d.h||1))),.6,1.45);}   /* "a": text followed the area */
    else{s=clamp(w/d.w,.35,2.6);h=(d.h||10)*s;}                                  /* "a" when this piece was still a scale piece */
    h=clamp(h,minH,100);
  }
  return {x:clamp(n[0],0,100-Math.min(w,100)),y:clamp(n[1],0,99),w:w,h:h,s:Math.round(s*100)/100,v:fl==='h'?0:1};
}
function decode(str,items){
  var out=defaults(items);str=String(str==null?'':str);var ver=str.charAt(0);
  if(!((ver==='a'||ver==='b')&&/^[a-z0-9]+$/.test(str))&&!(ver==='c'&&/^[a-zA-Z0-9]+$/.test(str)))return out;
  var byCode={},secBy={},oldBy={};
  items.forEach(function(it){byCode[it.code]=it;(it.sections||[]).forEach(function(sc){secBy[sc.code.toUpperCase()]={it:it,sc:sc};if(sc.old)oldBy[sc.old]={it:it,sc:sc};})});
  function keepSec(it,p){if(it.sections){p.sec=out[it.id].sec;}return p}
  if(ver!=='c'){
    /* "a" / "b": fixed-size pieces. Pieces that became sections of a stack (the old separate boxes) keep their shown / hidden state */
    var step=ver==='a'?10:12;
    for(var i=1;i+step<=str.length;i+=step){
      var code=str.charAt(i),it=byCode[code],fl=str.charAt(i+1);if(fl!=='v'&&fl!=='h')continue;
      if(!it){var o=oldBy[code];if(o)out[o.it.id].sec[o.sc.id].v=fl==='h'?0:1;continue;}
      var p=parsePiece(str,i,ver,it);if(p)out[it.id]=keepSec(it,p);
    }
    return out;
  }
  var j=1;
  while(j<str.length){
    var ch=str.charAt(j);
    if(ch>='A'&&ch<='Z'){
      if(j+4>str.length)break;var hit=secBy[ch],f2=str.charAt(j+1),f=parseInt(str.substr(j+2,2),36)/10;
      if(hit&&(f2==='v'||f2==='h')&&isFinite(f)&&f>=FMIN&&f<=FMAX)out[hit.it.id].sec[hit.sc.id]={f:f,v:f2==='h'?0:1};
      j+=4;continue;
    }
    if(j+12>str.length)break;
    var it2=byCode[ch],fl2=str.charAt(j+1);
    if(it2&&(fl2==='v'||fl2==='h')){var p2=parsePiece(str,j,'c',it2);if(p2)out[it2.id]=keepSec(it2,p2);}
    j+=12;
  }
  return out;
}
var api={encode:encode,decode:decode,defaults:defaults,version:VER};
if(typeof module!=='undefined'&&module.exports){module.exports=api;return}

var A=root.App;
api.init=function(cfg){
  var R=cfg.root,stage=cfg.stage||document.getElementById('stage'),items=cfg.items,page=cfg.key||(A&&A.game)||'page';
  if(!R||!items||!items.length)return null;
  var OBS=A?A.obs:/[?&]obs=1/.test(location.search),ch=A?A.channel:'';
  var KEY='lamma-lay-'+ch+'-'+page,BGKEY='lamma-bg-'+ch+'-'+page;
  var LS=A?A.LS:{get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  var Q=new URLSearchParams(location.search);
  function t(ar,en){return A&&A.lang()==='en'?en:ar}
  var lay,bg;
  function loadLay(){var q=Q.get('lay');lay=decode(OBS&&q!=null?q:LS.get(KEY,''),items);}
  function loadBg(){var q=Q.get('bg');bg=OBS?(q==='1'):(LS.get(BGKEY,'1')!=='0');}
  loadLay();loadBg();
  var byId={};items.forEach(function(it){byId[it.id]=it;it.node=R.querySelector('[data-lay="'+it.id+'"]');if(it.node&&it.kind==='box')it.node.classList.add('lay-box');
    if(it.sections&&it.node){it.node.classList.add('lay-stack');(it.sections).forEach(function(sc){sc.node=it.node.querySelector('[data-sec="'+sc.id+'"]');if(sc.node)sc.node.classList.add('lay-sec');});}});
  R.classList.add('lay-root');
  function secLabel(sc){return typeof sc.label==='function'?sc.label():t(sc.ar,sc.en)}

  function scaleOf(it,p){if(it.kind==='box')return clamp(p.s||1,SMIN,SMAX);return clamp(p.w/it.def.w,.35,2.6)}
  function place(it){
    var n=it.node,p=lay[it.id];if(!n||!p)return;
    n.style.left=p.x+'%';n.style.top=p.y+'%';n.style.width=p.w+'%';n.style.height=it.kind==='box'?p.h+'%':'';
    n.style.setProperty('--ls',String(Math.round(scaleOf(it,p)*1000)/1000));
    n.classList.toggle('lay-off',p.v===0);n.style.zIndex=String(it.z||1);
    if(it.sections)placeSecs(it);
  }
  /* stack: each visible section takes its share of the panel height; a divider sits between every two visible sections */
  function placeSecs(it){
    var p=lay[it.id],vis=[];
    it.sections.forEach(function(sc){if(!sc.node)return;var q=p.sec[sc.id];sc.node.style.flex=(Math.round(q.f*10)/10)+' 1 0px';
      sc.node.classList.toggle('sec-off',q.v===0);if(q.v!==0)vis.push(sc);});
    it.node.classList.toggle('lay-empty',!vis.length);
    var box=it.sections[0]&&it.sections[0].node&&it.sections[0].node.parentNode;if(!box)return;
    box.querySelectorAll(':scope>.lay-div').forEach(function(d){d.parentNode.removeChild(d)});
    for(var i=1;i<vis.length;i++)box.insertBefore(divider(it,vis[i-1],vis[i]),vis[i].node);
  }
  function divider(it,a,b){
    var d=document.createElement('div');d.className='lay-div';d.setAttribute('role','separator');d.setAttribute('aria-orientation','horizontal');
    if(OBS)return d;
    d.title=t('اسحب لفوق أو لتحت: قسم بيكبر والتاني بيصغر','Drag up or down: one section grows, the other shrinks');
    d.appendChild(document.createElement('i'));
    d.addEventListener('pointerdown',function(e){
      if(e.button>0)return;e.preventDefault();e.stopPropagation();
      var p=lay[it.id],qa=p.sec[a.id],qb=p.sec[b.id],ha=a.node.getBoundingClientRect().height,hb=b.node.getBoundingClientRect().height,tot=qa.f+qb.f,sy=e.clientY,pid=e.pointerId;
      var mn=Math.min(26,(ha+hb)/3);try{d.setPointerCapture(pid)}catch(_){}d.classList.add('on');
      function mv(ev){if(ev.pointerId!==pid)return;var na=clamp(ha+(ev.clientY-sy),mn,ha+hb-mn),fa=Math.round(tot*na/Math.max(1,ha+hb)*10)/10;
        fa=clamp(fa,FMIN,tot-FMIN);qa.f=fa;qb.f=Math.round((tot-fa)*10)/10;a.node.style.flex=qa.f+' 1 0px';b.node.style.flex=qb.f+' 1 0px';}
      function up(ev){if(ev.pointerId!==pid)return;d.removeEventListener('pointermove',mv);d.removeEventListener('pointerup',up);d.removeEventListener('pointercancel',up);d.classList.remove('on');save();}
      d.addEventListener('pointermove',mv);d.addEventListener('pointerup',up);d.addEventListener('pointercancel',up);
    });
    return d;
  }
  function setSecVis(it,sid,v){lay[it.id].sec[sid].v=v?1:0;if(v&&lay[it.id].v===0)lay[it.id].v=1;place(it);save();renderBar();}
  function applyAll(){items.forEach(place);if(stage){stage.classList.toggle('lay-nobg',!bg);stage.classList.toggle('lay-bg',bg);}renderBar();}
  function save(){LS.set(KEY,encode(lay,items));if(A&&A.updateObsUrl)A.updateObsUrl();}
  function saveBg(){LS.set(BGKEY,bg?'1':'0');if(A&&A.updateObsUrl)A.updateObsUrl();}
  if(A&&A.obsExtra)A.obsExtra(function(){var e=encode(lay,items);return (e?'&lay='+e:'')+'&bg='+(bg?'1':'0')});
  /* a live edit in the same browser (control page as an OBS dock) is newer than the link: follow it */
  window.addEventListener('storage',function(e){if(e.key===KEY){lay=decode(e.newValue||'',items);applyAll();}else if(e.key===BGKEY){bg=e.newValue!=='0';applyAll();}});

  var editing=false,sel=null,bar=null,guides=null,h0={};
  function label(it){return typeof it.label==='function'?it.label():t(it.ar,it.en)}

  /* ---------- geometry + snapping (editor only) ---------- */
  function rel(r,rr){return {l:(r.left-rr.left)/rr.width*100,t:(r.top-rr.top)/rr.height*100,r:(r.right-rr.left)/rr.width*100,b:(r.bottom-rr.top)/rr.height*100}}
  function magnet(rr){ /* the wheel's own circle (its canvas), in percent of the root plus its radius in px */
    var m=items.filter(function(o){return o.snapCenter&&o.node&&lay[o.id].v!==0})[0];if(!m)return null;
    var c=m.node.querySelector(m.snapEl||'canvas')||m.node,r=c.getBoundingClientRect();if(!r.width)return null;
    return {it:m,x:(r.left+r.width/2-rr.left)/rr.width*100,y:(r.top+r.height/2-rr.top)/rr.height*100,rpx:r.width/2};
  }
  function targets(self,rr,mg){
    var X=[{v:0,k:'edge'},{v:50,k:'mid'},{v:100,k:'edge'}],Y=[{v:0,k:'edge'},{v:50,k:'mid'},{v:100,k:'edge'}];
    items.forEach(function(o){if(o===self||!o.node||lay[o.id].v===0)return;var q=rel(o.node.getBoundingClientRect(),rr);
      X.push({v:q.l,k:'el'},{v:(q.l+q.r)/2,k:'el'},{v:q.r,k:'el'});Y.push({v:q.t,k:'el'},{v:(q.t+q.b)/2,k:'el'},{v:q.b,k:'el'});});
    if(mg&&mg.it!==self){X.push({v:mg.x,k:'wheel'});Y.push({v:mg.y,k:'wheel'});}
    return {X:X,Y:Y};
  }
  /* best (smallest) offset that puts one of the anchors on one of the lines, within thr */
  function best(anchors,lines,thr){var b=null;anchors.forEach(function(a){lines.forEach(function(l){var d=l.v-a;if(Math.abs(d)<=thr&&(!b||Math.abs(d)<Math.abs(b.d)))b={d:d,line:l}})});return b}
  function showGuides(list,ring){
    if(!guides){guides=document.createElement('div');guides.className='lay-guides';guides.setAttribute('aria-hidden','true');R.appendChild(guides);}
    while(guides.firstChild)guides.removeChild(guides.firstChild);
    list.forEach(function(g){var e=document.createElement('i');e.className='lay-gl '+(g.dir==='v'?'v':'h')+' k-'+g.k;if(g.dir==='v')e.style.left=g.v+'%';else e.style.top=g.v+'%';guides.appendChild(e)});
    if(ring){var r=document.createElement('i');r.className='lay-ring';r.style.left=ring.x+'%';r.style.top=ring.y+'%';r.style.width=r.style.height=(ring.rpx*2)+'px';guides.appendChild(r);
      var dot=document.createElement('i');dot.className='lay-dot';dot.style.left=ring.x+'%';dot.style.top=ring.y+'%';guides.appendChild(dot);}
    guides.style.display=list.length||ring?'block':'none';
  }
  function hideGuides(){if(guides)guides.style.display='none'}

  /* ---------- editor (control page only) ---------- */
  function mkBtn(cls,txt,fn,title){var b=document.createElement('button');b.type='button';b.className=cls;b.textContent=txt;if(title){b.title=title;b.setAttribute('aria-label',title)}b.addEventListener('click',fn);return b}
  function handles(it){
    var n=it.node;if(!n||n.querySelector(':scope>.lay-h'))return;
    var h=document.createElement('div');h.className='lay-h';h.setAttribute('aria-hidden','true');
    var tb=document.createElement('div');tb.className='lay-tb';var tag=document.createElement('span');tag.className='lay-tag';tb.appendChild(tag);
    var x=mkBtn('lay-x','×',function(e){e.stopPropagation();setVis(it.id,0)});x.tabIndex=-1;tb.appendChild(x);h.appendChild(tb);
    (it.kind==='box'?['nw','ne','sw','se','n','s','e','w']:['nw','ne','sw','se']).forEach(function(c){var g=document.createElement('i');g.className='lay-g g-'+c+(c.length===1?' lay-edge':'');g.setAttribute('data-g',c);h.appendChild(g)});
    n.appendChild(h);n.tabIndex=0;
    if(it.sections)it.sections.forEach(function(sc){if(!sc.node||sc.node.querySelector(':scope>.lay-sx'))return;
      var sx=mkBtn('lay-sx','×',function(e){e.stopPropagation();setSecVis(it,sc.id,0)});sx.tabIndex=-1;sx.setAttribute('data-sec-x',sc.id);
      sx.addEventListener('pointerdown',function(e){e.stopPropagation()});sc.node.appendChild(sx);});
    n.addEventListener('pointerdown',function(e){if(!editing||e.button>0||e.target.closest('.lay-x,.lay-sx,.lay-div'))return;startDrag(e,it,e.target.getAttribute('data-g'))});
    n.addEventListener('focus',function(){if(editing)select(it)});
  }
  function select(it){sel=it;items.forEach(function(o){if(o.node)o.node.classList.toggle('lay-sel',o===it)})}
  function startDrag(e,it,grip){
    e.preventDefault();select(it);var rr=R.getBoundingClientRect(),p=lay[it.id],o={x:p.x,y:p.y,w:p.w,h:p.h,s:p.s||1},nr=it.node.getBoundingClientRect();
    var hPct=nr.height/rr.height*100,aspect=nr.height/Math.max(1,nr.width),sx=e.clientX,sy=e.clientY,pid=e.pointerId;
    var mg=magnet(rr),T=targets(it,rr,mg),thrX=8/rr.width*100,thrY=8/rr.height*100;
    try{it.node.setPointerCapture(pid)}catch(_){}
    it.node.classList.add('lay-moving');
    function snap(v){return Math.round(v*10)/10}
    function mv(ev){if(ev.pointerId!==pid)return;
      var free=ev.altKey,dx=(ev.clientX-sx)/rr.width*100,dy=(ev.clientY-sy)/rr.height*100,q=lay[it.id],minW=it.minW||6,minH=it.minH||4,G=[],ring=null;
      if(!grip){
        var hh=it.kind==='box'?o.h:hPct,nx=clamp(o.x+dx,0,100-o.w),ny=clamp(o.y+dy,0,Math.max(0,100-hh));
        if(!free){
          var cxp=nx+o.w/2,cyp=ny+hh/2,dpx=mg&&mg.it!==it?Math.hypot((cxp-mg.x)*rr.width/100,(cyp-mg.y)*rr.height/100):1e9;
          if(mg&&dpx<mg.rpx*.5){ /* dropped over the wheel: centre it exactly on the wheel */
            nx=mg.x-o.w/2;ny=mg.y-hh/2;ring=mg;G.push({dir:'v',v:mg.x,k:'wheel'},{dir:'h',v:mg.y,k:'wheel'});
          }else{
            var bx=best([nx,nx+o.w/2,nx+o.w],T.X,thrX),by=best([ny,ny+hh/2,ny+hh],T.Y,thrY);
            if(bx){nx+=bx.d;G.push({dir:'v',v:bx.line.v,k:bx.line.k});}
            if(by){ny+=by.d;G.push({dir:'h',v:by.line.v,k:by.line.k});}
          }
        }
        q.x=snap(clamp(nx,-o.w*.5,100-o.w*.5));q.y=snap(clamp(ny,-hh*.5,100-hh*.5));
        q.x=clamp(q.x,0,Math.max(0,100-o.w));q.y=clamp(q.y,0,Math.max(0,100-Math.min(hh,100)));
      }
      else if(it.kind==='box'&&grip.length===1){ /* edge grip: that side only, the text keeps its size */
        var x0=o.x,y0=o.y,x1=o.x+o.w,y1=o.y+o.h,bb;
        if(grip==='w'){x0=clamp(o.x+dx,0,x1-minW);if(!free&&(bb=best([x0],T.X,thrX))){x0=clamp(x0+bb.d,0,x1-minW);G.push({dir:'v',v:x0,k:bb.line.k})}}
        if(grip==='e'){x1=clamp(x1+dx,x0+minW,100);if(!free&&(bb=best([x1],T.X,thrX))){x1=clamp(x1+bb.d,x0+minW,100);G.push({dir:'v',v:x1,k:bb.line.k})}}
        if(grip==='n'){y0=clamp(o.y+dy,0,y1-minH);if(!free&&(bb=best([y0],T.Y,thrY))){y0=clamp(y0+bb.d,0,y1-minH);G.push({dir:'h',v:y0,k:bb.line.k})}}
        if(grip==='s'){y1=clamp(y1+dy,y0+minH,100);if(!free&&(bb=best([y1],T.Y,thrY))){y1=clamp(y1+bb.d,y0+minH,100);G.push({dir:'h',v:y1,k:bb.line.k})}}
        q.x=snap(x0);q.y=snap(y0);q.w=snap(x1-x0);q.h=snap(y1-y0);q.s=o.s;
      }
      else if(it.kind==='box'){ /* corner grip on a box: proportional, text scales with it */
        var gx=/e/.test(grip)?1:-1,gy=/s/.test(grip)?1:-1,fx=(o.w+dx*gx)/o.w,fy=(o.h+dy*gy)/o.h,f=Math.abs(fx-1)>Math.abs(fy-1)?fx:fy;
        var fmax=Math.min(gx>0?(100-o.x)/o.w:(o.x+o.w)/o.w,gy>0?(100-o.y)/o.h:(o.y+o.h)/o.h,SMAX/o.s),fmin=Math.max(minW/o.w,minH/o.h,SMIN/o.s);
        f=clamp(f,fmin,Math.max(fmin,fmax));var w2=o.w*f,h2=o.h*f;
        q.w=snap(w2);q.h=snap(h2);q.x=snap(gx>0?o.x:o.x+o.w-w2);q.y=snap(gy>0?o.y:o.y+o.h-h2);q.s=Math.round(o.s*f*100)/100;
      }
      else{ /* uniform scale from the opposite corner: the larger of the two pointer moves wins */
        var sgx=/e/.test(grip)?1:-1,sgy=/s/.test(grip)?1:-1,dwx=dx*sgx,dwy=dy*sgy*rr.height/rr.width/aspect,dw=Math.abs(dwx)>Math.abs(dwy)?dwx:dwy;
        var maxW=sgx>0?100-o.x:o.x+o.w;var hmax=sgy>0?100-o.y:o.y+hPct;maxW=Math.min(maxW,hmax/aspect*rr.height/rr.width);
        var w=snap(clamp(o.w+dw,minW,Math.max(minW,maxW)));var nh=w*aspect*rr.width/rr.height;
        q.w=w;q.x=snap(sgx>0?o.x:o.x+o.w-w);q.y=snap(sgy>0?o.y:o.y+hPct-nh);q.x=clamp(q.x,0,100-w);q.y=clamp(q.y,0,100);
      }
      place(it);showGuides(G,ring);}
    function up(ev){if(ev.pointerId!==pid)return;it.node.removeEventListener('pointermove',mv);it.node.removeEventListener('pointerup',up);it.node.removeEventListener('pointercancel',up);it.node.classList.remove('lay-moving');hideGuides();save();}
    it.node.addEventListener('pointermove',mv);it.node.addEventListener('pointerup',up);it.node.addEventListener('pointercancel',up);
  }
  function setVis(id,v){lay[id].v=v?1:0;if(!v&&sel&&sel.id===id)sel=null;place(byId[id]);save();renderBar();}
  function reset(){lay=defaults(items);applyAll();save();}
  function setEdit(on){
    editing=!!on;R.classList.toggle('lay-editing',editing);if(stage)stage.classList.toggle('lay-editing',editing);
    if(editing){items.forEach(handles);if(stage)stage.classList.toggle('lay-small',stage.clientWidth<700);if(!sel){var f=items.filter(function(o){return lay[o.id].v!==0&&o.node})[0];if(f)select(f);}if(stage&&stage.scrollIntoView&&window.innerWidth<1100)stage.scrollIntoView({block:'center',behavior:'smooth'});}
    else{select(null);hideGuides();}
    renderBar();
  }
  R.addEventListener('keydown',function(e){if(!editing||!sel)return;var p=lay[sel.id],st=e.shiftKey?2:.5,k=e.key,done=true;
    if(k==='ArrowLeft')p.x=clamp(p.x-st,0,100-p.w);else if(k==='ArrowRight')p.x=clamp(p.x+st,0,100-p.w);else if(k==='ArrowUp')p.y=clamp(p.y-st,0,100);else if(k==='ArrowDown')p.y=clamp(p.y+st,0,100);
    else if(k==='Delete'||k==='Backspace'){setVis(sel.id,0);e.preventDefault();return}else done=false;
    if(done){e.preventDefault();place(sel);save();}});
  document.addEventListener('pointerdown',function(e){if(editing&&!e.target.closest('.lay-el,.lay-bar'))select(null)});

  function renderBar(){
    items.forEach(function(it){var tg=it.node&&it.node.querySelector(':scope>.lay-h .lay-tag');if(tg)tg.textContent=label(it);var x=it.node&&it.node.querySelector(':scope>.lay-h .lay-x');if(x)x.title=t('شيل','Hide');
      if(it.node)it.node.querySelectorAll(':scope>.lay-h .lay-edge').forEach(function(g){g.title=t('اسحب لتطوّل أو تعرّض (الكلام بيضل نفس الحجم)','Drag to make it taller / wider (text keeps its size)')});
      (it.sections||[]).forEach(function(sc){var sx=sc.node&&sc.node.querySelector(':scope>.lay-sx');if(sx){sx.title=t('شيل','Hide')+' '+secLabel(sc);sx.setAttribute('aria-label',sx.title)}if(sc.node)sc.node.setAttribute('data-sec-name',secLabel(sc));});
      if(it.node)it.node.querySelectorAll('.lay-div').forEach(function(d){if(d.firstChild)d.title=t('اسحب لفوق أو لتحت: قسم بيكبر والتاني بيصغر','Drag up or down: one section grows, the other shrinks')});});
    if(!bar)return;while(bar.firstChild)bar.removeChild(bar.firstChild);
    var row=document.createElement('div');row.className='lay-row';
    var seg=document.createElement('div');seg.className='lay-seg';seg.setAttribute('role','radiogroup');seg.setAttribute('aria-label',t('الخلفية','Background'));
    [[1,t('مع خلفية','With background')],[0,t('بلا خلفية','No background')]].forEach(function(o){var b=mkBtn('seg'+((bg?1:0)===o[0]?' on':''),o[1],function(){bg=!!o[0];saveBg();applyAll()});b.setAttribute('role','radio');b.setAttribute('aria-checked',String((bg?1:0)===o[0]));seg.appendChild(b)});
    row.appendChild(seg);
    var eb=mkBtn('btn btn-sm '+(editing?'btn-main':'btn-ghost')+' lay-editbtn',editing?t('تم ✓','Done ✓'):t('✏️ تعديل الشكل','✏️ Edit layout'),function(){setEdit(!editing)});eb.setAttribute('aria-pressed',String(editing));row.appendChild(eb);
    bar.appendChild(row);
    if(editing){
      var r2=document.createElement('div');r2.className='lay-row lay-items';
      items.forEach(function(it){var on=lay[it.id].v!==0;var b=mkBtn('lay-chip'+(on?' on':''),(on?'✓ ':'+ ')+label(it),function(){setVis(it.id,!on)},on?t('شيل','Hide')+' '+label(it):t('رجّع','Add back')+' '+label(it));b.setAttribute('aria-pressed',String(on));r2.appendChild(b);
        (it.sections||[]).forEach(function(sc){if(!sc.node)return;var so=lay[it.id].sec[sc.id].v!==0;var sb=mkBtn('lay-chip lay-chip-sec'+(so?' on':''),(so?'✓ ':'+ ')+secLabel(sc),function(){setSecVis(it,sc.id,!so)},so?t('شيل','Hide')+' '+secLabel(sc):t('رجّع','Add back')+' '+secLabel(sc));sb.setAttribute('aria-pressed',String(so));r2.appendChild(sb)});});
      r2.appendChild(mkBtn('lay-chip lay-reset','↺ '+t('رجّع الأصلي','Reset'),reset));
      bar.appendChild(r2);
      var hp=document.createElement('p');hp.className='lay-help';hp.textContent=t('اسحب أي شي لتحرّكو: بيلزق بنص العجلة وبالخطوط. أطراف البوكس (فوق، تحت، يمين، يسار) بتطوّلو أو بتعرّضو والكلام بيضل نفس الحجم، والزوايا بتكبّر كلو. الخطوط بين أقسام القائمة بتنسحب لفوق ولتحت، و× عالقسم بتشيلو والباقي بيكبر لحالو. Alt = بلا لزق. بعد ما تخلص انسخ رابط OBS من جديد.','Drag anything to move it: it snaps to the wheel centre and the guide lines. A box\'s edges (top, bottom, left, right) make it taller or wider and the text keeps its size; the corners resize all of it. Drag the lines between the list sections up or down; × on a section hides it and the rest grow to fill. Hold Alt to place freely. When you are done, copy the OBS link again.');bar.appendChild(hp);
    }
  }
  if(!OBS){
    var wrap=stage&&stage.parentNode;
    if(wrap){bar=document.createElement('div');bar.className='lay-bar ctrl-only';wrap.insertBefore(bar,stage);}
    /* fullscreen (bottom-left of the stage): the stage fills the screen, kept 16:9; Esc or the same button leaves */
    if(stage&&wrap&&cfg.fullscreen!==false){
      var fsEl=function(){return document.fullscreenElement||document.webkitFullscreenElement||null};
      var can=!!(wrap.requestFullscreen||wrap.webkitRequestFullscreen);
      var fb=mkBtn('lay-fs','',function(e){e.stopPropagation();
        if(fsEl()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}
        var rq=wrap.requestFullscreen||wrap.webkitRequestFullscreen;if(!rq)return;var pr=rq.call(wrap);if(pr&&pr.catch)pr.catch(function(){});});
      [['fs-in','M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'],['fs-out','M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5']].forEach(function(s){var NS='http://www.w3.org/2000/svg',sv=document.createElementNS(NS,'svg'),pa=document.createElementNS(NS,'path');
        sv.setAttribute('class',s[0]);sv.setAttribute('viewBox','0 0 24 24');sv.setAttribute('aria-hidden','true');pa.setAttribute('d',s[1]);sv.appendChild(pa);fb.appendChild(sv);});
      if(!can)fb.hidden=true;
      var fsSync=function(){var on=fsEl()===wrap;wrap.classList.toggle('lay-fson',on);fb.classList.toggle('on',on);var tt=on?t('اطلع من الشاشة الكاملة','Exit fullscreen'):t('شاشة كاملة','Fullscreen');fb.title=tt;fb.setAttribute('aria-label',tt);fb.setAttribute('aria-pressed',String(on));};
      document.addEventListener('fullscreenchange',fsSync);document.addEventListener('webkitfullscreenchange',fsSync);
      fb.classList.add('ctrl-only');stage.appendChild(fb);fsSync();if(A&&A.onLang)A.onLang(fsSync);
      h0.fullscreen=fsSync;
    }
    if(A&&A.onLang)A.onLang(renderBar);
  }
  applyAll();
  var h={get:function(){return JSON.parse(JSON.stringify(lay))},code:function(){return encode(lay,items)},bg:function(){return bg},setBg:function(v){bg=!!v;saveBg();applyAll()},
    edit:setEdit,editing:function(){return editing},reset:reset,set:function(id,p){for(var k in p)lay[id][k]=p[k];place(byId[id]);save();renderBar()},refresh:applyAll,
    magnet:function(){return magnet(R.getBoundingClientRect())},
    sec:function(id,sid,q){var p=lay[id]&&lay[id].sec&&lay[id].sec[sid];if(!p)return null;if(q){for(var k in q)p[k]=q[k];place(byId[id]);save();renderBar();}return JSON.parse(JSON.stringify(p))},
    fullscreenSync:function(){if(h0.fullscreen)h0.fullscreen()}};
  api.current=h;return h;
};
root.LammaLayout=api;
})(typeof window!=='undefined'?window:this);
