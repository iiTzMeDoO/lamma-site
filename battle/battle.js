/* battle.js — «المعركة» section (battle.html). The cards come from tools/battle.json (built into the page as window.LAMMA_BATTLE);
   each card carries a little live scene drawn with mc.js (original blocky art). */
(function(){
'use strict';
var A=window.App,B=window.LAMMA_BATTLE||[],MC=window.MC;
var ar={bl_title:'المعركة',bl_sub:'اختار نوع المعركة. كل وضع إلو صفحتو ورابط OBS تبعو.',bt_soon:'قريباً',tag_new:'جديد',tag_hot:'⭐ الأساسية'};
var en={bl_title:'Battle',bl_sub:'Pick a battle mode. Each one has its own page and its own OBS link.',bt_soon:'Soon',tag_new:'New',tag_hot:'⭐ Main event'};
B.forEach(function(m){ar['bl_'+m.id]=m.ar;ar['bld_'+m.id]=m.desc;en['bl_'+m.id]=m.en;en['bld_'+m.id]=m.desc_en||m.desc;});
A.strings({ar:ar,en:en});
A.start();
if(!MC||!MC.Iso)return;
var NAMES=['Medoo','Saeed','Layla','Omar','Noor','Zaid','Rami','Huda'],COLS=['#ff5a5a','#5aa8ff','#ffd23d','#5cd65c','#ff7ad9','#22e6ff','#ff9a3d','#b6ff3b'];
var scenes=[].slice.call(document.querySelectorAll('canvas.bt-art'));
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function setup(cv){
  var id=cv.getAttribute('data-art'),dpr=Math.min(2,window.devicePixelRatio||1),W=480,H=240;cv.width=W*dpr;cv.height=H*dpr;
  var ctx=cv.getContext('2d');var map={'battle-arena':'nether','battle-colors':'plains',tnt:'desert',hero:'plains',cave:'cave'}[id]||'plains';
  var cols=8,rows=8,tw=W/8.4,iso=new MC.Iso(ctx,{tw:tw,ox:W/2,oy:H-4*tw-tw*.55});iso.dpr=dpr;
  var room=id==='battle-colors'?null:MC.renderRoom(map,cols,rows,iso,W,H,7);
  var ents=[];
  if(id==='battle-arena'){for(var i=0;i<4;i++)ents.push({kind:'player',name:NAMES[i],color:COLS[i],x:1.5+i*.9,y:5.6-i*.4,face:1,anim:{}});ents.push({kind:'boss:wither',x:5.6,y:2.4,face:0,scale:1.25,anim:{}});ents.push({kind:'blaze',x:4.2,y:4.6,face:3,anim:{}});ents.push({kind:'wskel',x:6.2,y:4.8,face:3,anim:{}});}
  else if(id==='tnt'){for(var a=0;a<3;a++)ents.push({kind:'player',name:NAMES[a+2],color:COLS[a+2],x:1.6+a*.8,y:4.2,face:0,anim:{}});}
  else if(id==='hero'){ents.push({kind:'player',name:'Hero',color:'#ffd23d',x:3.6,y:3.8,face:1,scale:1.15,anim:{}});[[1.6,2.2],[5.8,2.4],[2,6],[6,5.6],[4.4,6.4]].forEach(function(p,ix){ents.push({kind:ix%2?'skeleton':'zombie',x:p[0],y:p[1],face:ix%2?3:2,anim:{}})});}
  else if(id==='cave'){ents.push({kind:'player',name:NAMES[5],color:COLS[5],x:2.4,y:4.8,face:1,anim:{}});ents.push({kind:'player',name:NAMES[6],color:COLS[6],x:3.2,y:5.5,face:1,anim:{}});ents.push({kind:'boss:king',x:5.6,y:3,face:3,scale:1.3,anim:{}});ents.push({kind:'cavespider',x:5,y:5.6,face:3,anim:{}});}
  function frame(t){
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(id==='battle-colors'){colors(ctx,W,H,t);return;}
    ctx.drawImage(room.canvas,0,0,W,H);
    if(id==='tnt'){var T=MC.tex('tnt_side');for(var y=0;y<rows;y++)for(var x=4;x<cols;x++){if((x+y)%2)continue;iso.box(x+.08,y+.08,0,.84,.84,.84,{top:MC.tex('planks'),side:T},{flash:(Math.sin(t*8)>.4)?.45:0});}}
    ents.sort(function(a,b){return (a.x+a.y)-(b.x+b.y)});
    ents.forEach(function(e,i){e.anim.walk=reduce?0:t*.35+i;e.anim.atk=reduce?0:((t*.9+i*.37)%1.6<.4?((t*.9+i*.37)%1.6)/.4:0);MC.drawEntity(iso,e,t);});
    MC.lighting(ctx,iso,room.lights,W,H,t,room.map.amb*.85);
  }
  return frame;
}
function colors(ctx,W,H,t){
  var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1a2440');g.addColorStop(1,'#07080f');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  var n=20,cw=W/n*.92,x0=W*.04;
  for(var i=0;i<n;i++){var h=i/n*330;var col='hsl('+h+',78%,55%)';var x=x0+i*cw;var top=H*.42;ctx.fillStyle=col;ctx.fillRect(x+1,top,cw-2,H*.5);ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(x+1,top,cw-2,4);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x+cw-5,top,3,H*.5);
    ctx.fillStyle='#fff';ctx.font='700 10px system-ui';ctx.textAlign='center';ctx.fillText(String(i+1),x+cw/2,H*.97);}
  var k=Math.floor(t*.5)%20;ctx.fillStyle='hsl('+(k/20*330)+',78%,55%)';ctx.fillRect(W/2-34,14,68,40);ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.strokeRect(W/2-34,14,68,40);
  for(var p=0;p<14;p++){var c=(p*7)%20;var x2=x0+c*cw+cw/2,y2=H*.42-14-((p*3)%3)*9;ctx.fillStyle=COLS[p%8];ctx.fillRect(x2-4,y2-10,8,8);ctx.fillStyle='#f0c39a';ctx.fillRect(x2-3,y2-18,6,7);}
}
var fns=scenes.map(setup),t0=performance.now();
function loop(now){var t=(now-t0)/1000;fns.forEach(function(f){try{f(t)}catch(e){}});if(!reduce)requestAnimationFrame(loop);}
requestAnimationFrame(loop);
})();
