/* arena.js — Block Brawl renderer for لَمّة. Crisp top-down pixel art drawn in code (original art, Minecraft theme):
   the cave arena with a mob boss, and the colour-floor mode. The world renders at a low logical resolution and is
   scaled by a whole number (no smoothing); names, levels and numbers are drawn crisp on top.
   It only draws the public state party.js hands it. */
(function(){
'use strict';
function cv(w,h){var c=document.createElement('canvas');c.width=Math.max(1,w|0);c.height=Math.max(1,h|0);return c}
function cx2(c){var g=c.getContext('2d');g.imageSmoothingEnabled=false;return g}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function lerp(a,b,t){return a+(b-a)*t}
function rng(seed){var s=(seed>>>0)||1;return function(){s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return (s%100000)/100000}}
function hashStr(t){var h=2166136261;t=String(t);for(var i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rgb(h){var n=parseInt(String(h).replace('#',''),16);return [n>>16,n>>8&255,n&255]}
function fromMap(map,pal){var h=map.length,w=map[0].length,c=cv(w,h),g=cx2(c);for(var y=0;y<h;y++)for(var x=0;x<w;x++){var k=map[y][x];if(pal[k]){g.fillStyle=pal[k];g.fillRect(x,y,1,1)}}return c}
function flip(c){var o=cv(c.width,c.height),g=cx2(o);g.translate(c.width,0);g.scale(-1,1);g.drawImage(c,0,0);return o}
function red(c){var o=cv(c.width,c.height),g=o.getContext('2d');g.drawImage(c,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(255,40,40,.8)';g.fillRect(0,0,o.width,o.height);return o}
var PIX='"PressStart","Cairo",system-ui,sans-serif';
var COLN=20;
function colColor(i){var h=(i/COLN)*320;return 'hsl('+h.toFixed(0)+',92%,'+(i%2?52:46)+'%)'}

/* ---------- 16x16 tiles ---------- */
function tile(base,amt,seed,fn){var c=cv(16,16),g=cx2(c),r=rng(seed),B=rgb(base);
  for(var y=0;y<16;y++)for(var x=0;x<16;x++){var col=fn?fn(x,y,r):null;var b=col?rgb(col):B,k=(r()-.5)*amt*255;g.fillStyle='rgb('+clamp(b[0]+k,0,255)+','+clamp(b[1]+k,0,255)+','+clamp(b[2]+k,0,255)+')';g.fillRect(x,y,1,1)}return c}
var T={};
function buildTiles(){
  T.dirt=[0,1,2,3].map(function(i){return tile('#a3683c',.07,10+i,function(x,y,r){var v=r();return v<.05?'#7d4e2c':v<.08?'#b97b4a':(i===2&&v<.11)?'#8f8f8f':null})});
  T.dark=[0,1].map(function(i){return tile('#3d3a3f',.06,30+i,function(x,y){if(y%8===0||x%8===((y>>3)%2?4:0))return '#2c2a2e';return null})});
  T.brick=tile('#6f6a72',.06,40,function(x,y,r){if(y%4===0||x%8===((y>>2)%2?4:0))return '#4b474e';return r()<.05?'#86808a':null});
  T.wall=tile('#4a3424',.08,41,function(x,y,r){if(y%5===0||x%7===((y/5|0)%2?3:0))return '#2e1f14';return r()<.06?'#5e4430':null});
}
/* ---------- chibi characters (12x17) from a Minecraft skin ---------- */
function atlasPixels(img){var c=cv(64,64),g=c.getContext('2d');g.drawImage(img,0,0);return {d:g.getImageData(0,0,64,64).data}}
function charFrames(A,legacy){
  function px(x,y){var i=(y*64+x)*4;return [A.d[i],A.d[i+1],A.d[i+2],A.d[i+3]]}
  var hatOk=true;if(legacy){var first=null,solid=true,any=false;for(var y=8;y<16;y++)for(var x=40;x<48;x++){var p=px(x,y);if(p[3]<200)any=true;else{var k=p.join();if(first==null)first=k;else if(k!==first)solid=false}}hatOk=any||!solid}
  function put(g,x,y,p,dark){if(!p||p[3]<128)return;var k=dark?.78:1;g.fillStyle='rgb('+(p[0]*k|0)+','+(p[1]*k|0)+','+(p[2]*k|0)+')';g.fillRect(x,y,1,1)}
  var BR=[0,2,4,7,10],LR=[3,8,11],LA=legacy?[44,20]:[36,52],LL=legacy?[4,20]:[20,52],LC=[0,1,3];
  function frame(kind){var c=cv(12,17),g=cx2(c),lu=kind==='a'?1:0,ru=kind==='b'?1:0,ch=kind==='cheer';
    for(var j=0;j<3;j++)for(var i=0;i<3;i++){put(g,3+i,14+j-lu,px(LL[0]+LC[i],LL[1]+LR[j]),j===2);put(g,6+i,14+j-ru,px(4+LC[i],20+LR[j]),j===2)}
    for(var j2=0;j2<5;j2++)for(var i2=0;i2<8;i2++){put(g,2+i2,9+j2,px(20+i2,20+BR[j2]));if(!legacy)put(g,2+i2,9+j2,px(20+i2,36+BR[j2]))}
    for(var j3=0;j3<5;j3++)for(var i3=0;i3<2;i3++){
      put(g,i3,ch?3+j3:9+j3+(kind==='a'?1:0),px(45+i3,20+BR[j3]),true);
      put(g,10+i3,ch?3+j3:9+j3+(kind==='b'?1:0),px(LA[0]+1+i3,LA[1]+BR[j3]),true)}
    for(var y2=0;y2<8;y2++)for(var x2=0;x2<8;x2++){put(g,2+x2,1+y2,px(8+x2,8+y2));if(hatOk)put(g,2+x2,1+y2,px(40+x2,8+y2))}
    return c}
  var f={idle:frame('i'),a:frame('a'),b:frame('b'),cheer:frame('cheer')};
  ['idle','a','b','cheer'].forEach(function(k){f[k+'F']=flip(f[k])});return f}
function paintSkin(o){
  var c=cv(64,64),g=cx2(c),r=rng(o.seed||5);
  function fill(x,y,w,h,col,amt){var B=rgb(col);for(var j=0;j<h;j++)for(var i=0;i<w;i++){var k=(r()-.5)*(amt||.1)*255;g.fillStyle='rgb('+clamp(B[0]+k,0,255)+','+clamp(B[1]+k,0,255)+','+clamp(B[2]+k,0,255)+')';g.fillRect(x+i,y+j,1,1)}}
  function px(x,y,col){g.fillStyle=col;g.fillRect(x,y,1,1)}
  fill(8,8,8,8,o.skin,.06);fill(8,8,8,o.fringe||2,o.hair,.12);fill(8,8,1,4,o.hair,.12);fill(15,8,1,4,o.hair,.12);
  px(9,12,o.eyeW||'#fff');px(10,12,o.eye||'#3d38a8');px(13,12,o.eye||'#3d38a8');px(14,12,o.eyeW||'#fff');if(o.mouth){px(11,14,o.mouth);px(12,14,o.mouth)}
  fill(20,20,8,12,o.shirt,.1);if(o.belt)fill(20,30,8,1,o.belt,.06);
  fill(44,20,4,12,o.arm||o.skin,.06);fill(44,20,4,o.sleeve==null?4:o.sleeve,o.shirt,.1);
  fill(4,20,4,12,o.pants,.08);fill(4,30,4,2,o.shoes||'#3a3a40',.06);
  g.drawImage(c,44,20,4,12,36,52,4,12);g.drawImage(c,4,20,4,12,20,52,4,12);return c}
var SHIRT=['#e94b4b','#3b82f6','#22c55e','#f59e0b','#a855f7','#ec4899','#14b8a6','#f97316','#eab308','#6366f1'];
var HAIR=['#3b2a1a','#1b1b1b','#6b3e1f','#c9a24a','#7a2a1a'];
function heroAtlas(col,seed){var r=rng(seed+3);return paintSkin({seed:seed,skin:['#c99470','#a8724c','#e0b48c','#7a4e30'][r()*4|0],hair:HAIR[r()*5|0],shirt:col||SHIRT[r()*10|0],pants:['#2c3e8c','#3a3a44','#4a3a2a'][r()*3|0],mouth:'#7a4a32',belt:'#4a3020',fringe:2+(r()*2|0)})}
var MOBF={},GEARC=[];
function buildMobs(){
  MOBF.zombie=charFrames(atlasPixels(paintSkin({seed:31,skin:'#4f9a3c',hair:'#3a7a2b',fringe:1,shirt:'#2aa6a6',pants:'#3b3f9e',shoes:'#2d3080',eye:'#111',eyeW:'#1d3d14',mouth:'#2f5f24',sleeve:3})),false);
  MOBF.skeleton=charFrames(atlasPixels(paintSkin({seed:32,skin:'#d6d6d6',hair:'#bdbdbd',fringe:1,shirt:'#c8c8c8',pants:'#bdbdbd',shoes:'#9a9a9a',eye:'#1d1d1d',eyeW:'#1d1d1d',mouth:'#555',arm:'#d6d6d6',sleeve:0})),false);
  var cp={a:'#5cbf4a',b:'#3e8f31',c:'#8be07a',k:'#141414'};
  var crA=['.abacaba.','.bacabac.','.akkbkka.','.akkbkka.','.baakkab.','.abkkkkb.','.bkkabkk.','..baba...','..abab...','..baba...','..abab...','.ab...ab.','.ba...ba.'],crB=crA.slice(0,11).concat(['..ab.ab..','..ba.ba..']);
  MOBF.creeper={idle:fromMap(crA,cp),a:fromMap(crB,cp),b:fromMap(crA,cp)};
  var ep={k:'#16121c',p:'#e9a3ff',P:'#b23df0'};
  var en=['..kkkkkk..','..kkkkkk..','..pPkkPp..','..kkkkkk..','...kkkk...','..kkkkkk..','.k.kkkk.k.','.k.kkkk.k.','.k.kkkk.k.','.k.kkkk.k.','.k.kkkk.k.','.k..kk..k.','.k.k..k.k.','...k..k...','...k..k...','...k..k...','...k..k...','...k..k...','...k..k...','...k..k...','...k..k...'];
  var en2=en.slice();en2[15]='...k...k..';en2[16]='..k....k..';en2[17]='..k....k..';
  MOBF.enderman={idle:fromMap(en,ep),a:fromMap(en2,ep),b:fromMap(en,ep)};
  ['creeper','enderman'].forEach(function(k){var f=MOBF[k];['idle','a','b'].forEach(function(n){f[n+'F']=flip(f[n])})});
  // the boss: a giant crowned creeper king (each skin pixel = 4 world pixels, with grain)
  var B=cv(44,66),g=cx2(B),r=rng(77),F=['........','........','.kk..kk.','.kk..kk.','...kk...','..kkkk..','..kkkk..','..k..k..'];
  function blk(x0,y0,w,h,face){for(var y=0;y<h;y++)for(var x=0;x<w;x++){var v=r(),col=v<.3?'#3e8f31':v<.45?'#8be07a':'#5cbf4a';if(face){var fy=y>>2,fx=x>>2;if(F[fy][fx]==='k')col=fy<4?'#1a0606':'#141414'}g.fillStyle=col;g.fillRect(x0+x,y0+y,1,1)}}
  blk(6,4,32,32,true);blk(10,36,24,18);blk(6,54,12,12);blk(26,54,12,12);
  g.fillStyle='rgba(0,0,0,.25)';g.fillRect(10,36,24,2);g.fillRect(6,54,12,1);g.fillRect(26,54,12,1);
  g.fillStyle='#ffd23d';g.fillRect(6,2,32,3);[[8,0],[16,0],[24,0],[32,0]].forEach(function(q){g.fillRect(q[0],q[1],4,2)});g.fillStyle='#e94b4b';g.fillRect(19,2,3,2);g.fillStyle='#3b82f6';g.fillRect(10,2,2,2);g.fillRect(31,2,2,2);
  MOBF.boss=B;MOBF.bossRed=red(B);var E=cv(44,66),ge=cx2(E);ge.drawImage(B,0,0);ge.fillStyle='#ff2a2a';ge.fillRect(10,12,8,6);ge.fillRect(26,12,8,6);ge.fillStyle='#ffd0d0';ge.fillRect(12,14,2,2);ge.fillRect(28,14,2,2);MOBF.bossEyes=E;
  // props
  T.barrel=fromMap(['..kkkkkk..','.kwwwwwwk.','kwbbbbbbwk','kwwwwwwwwk','kwbbbbbbwk','kwwwwwwwwk','kwbbbbbbwk','.kwwwwwwk.','..kkkkkk..'],{k:'#3a2410',w:'#9a6a35',b:'#5a5a5a'});
  T.crate=fromMap(['kkkkkkkkkk','kwwwwwwwwk','kwkwwwwkwk','kwwkwwkwwk','kwwwkkwwwk','kwwwkkwwwk','kwwkwwkwwk','kwkwwwwkwk','kwwwwwwwwk','kkkkkkkkkk'],{k:'#5a3a18',w:'#b8873f'});
  T.rock=fromMap(['...kkkk...','..kgglgk..','.kgglllgk.','kggglllggk','kgggggllgk','kgdgggggdk','.kddggddk.','..kkkkkk..'],{k:'#3a3530',g:'#8a7f72',l:'#b0a596',d:'#6a6056'});
  T.ore=fromMap(['...kkkk...','..kggygk..','.kgyggggk.','kgggggcggk','kgcggggygk','kggggcgggk','.kdggddgk.','..kkkkkk..'],{k:'#3a3530',g:'#8a8a8a',y:'#f5cf3d',c:'#5ad8e6',d:'#6a6a6a'});
  T.chest=fromMap(['.kkkkkkkkkk.','kbwwwwwwwwbk','kwwwwwwwwwwk','kbbbbggbbbbk','kwwwwggwwwwk','kwwwwwwwwwwk','kbwwwwwwwwbk','.kkkkkkkkkk.'],{k:'#2a1808',w:'#a8742f',b:'#6b4518',g:'#e8c84a'});
  T.chestOpen=fromMap(['.kkkkkkkkkk.','kddddddddddk','kdyyyydyyydk','kbbbbggbbbbk','kwwwwggwwwwk','kwwwwwwwwwwk','kbwwwwwwwwbk','.kkkkkkkkkk.'],{k:'#2a1808',w:'#a8742f',b:'#6b4518',g:'#e8c84a',d:'#1a0f05',y:'#ffe066'});
  T.tnt=fromMap(['kkkkkkkkkk','krRrRrRrRk','kwwwwwwwwk','kwkkwkkwwk','kwwwwwwwwk','kRrRrRrRrk','kkkkkkkkkk'],{k:'#2a0a08',r:'#d8352a',R:'#a8241c',w:'#f2f2f2'});
  T.bones=fromMap(['w....w','.w..w.','..ww..','..ww..','.w..w.','w....w'],{w:'#e8e2d0'});
  T.mush=fromMap(['.rrrr.','rwrrwr','rrrrrr','..ss..','..ss..'],{r:'#d83a2a',w:'#fff',s:'#e8dcc0'});
  T.tree=fromMap(['....kkk.....','...kbbbk....','..kbbkbbk.k.','.k.kbbk.kbk.','kbk.kbk.kbbk','.kbkbbkkbk..','..kbbbbbk...','....kbbk....','....kbbk....','....kbbk....','...kbbbbk...','..kk....kk..'],{k:'#2a1a10',b:'#5a3a22'});
  T.torch=fromMap(['.y.','yoy','.w.','.w.','.w.'],{y:'#ffd23d',o:'#ff7a1a',w:'#7a5428'});
  T.banner=fromMap(['kkkkkkkk','kpppppPk','kpwwwwPk','kpwppwPk','kpwwwwPk','kpppppPk','kppppPPk','.kppPPk.','..kpPk..','...kk...'],{k:'#1a0f2e',p:'#8205B3',P:'#5a0480',w:'#ffd23d'});
  T.sword=fromMap(['......................................ww..','.................................wwwwwlwk.','kkk..hhhhh.ggg.wwwwwwwwwwwwwwwwwwwwwwlllwk','kHk.hHHHHHgGGGgwlllllllllllllllllllllllwk.','kkk..hhhhh.ggg.wwwwwwwwwwwwwwwwwwwwwwwk..','.................................wwwwwk...'],{k:'#2a1a10',h:'#7a4a1f',H:'#a8742f',g:'#e6c14a',G:'#fff1a0',w:'#9fb6c8',l:'#eaf6ff'});
  T.crown=fromMap(['y.y.y','yyyyy','yryby'],{y:'#ffd23d',r:'#e94b4b',b:'#3b82f6'});
}
function buildGear(G){GEARC=G.map(function(g){return fromMap(g.map,g.pal)})}

/* ---------- arena ---------- */
function Arena(host,opt){
  this.host=host;this.opt=opt||{};this.transparent=!!this.opt.transparent;
  this.c=document.createElement('canvas');this.c.className='bb-cv';this.c.setAttribute('aria-hidden','true');host.insertBefore(this.c,host.firstChild);
  this.g=this.c.getContext('2d');this.L=cv(10,10);this.lg=cx2(this.L);
  this.E={};this.mobs=[];this.fx=[];this.floats=[];this.arrows=[];this.t=0;this.P=null;this.skins={};this.tagC={};this.shake=0;this.flash=0;this.bossHit=0;this.fw=0;this.sweepFx=null;this.fallT={};
  if(!T.dirt){buildTiles();buildMobs()}
  if(this.opt.gear)buildGear(this.opt.gear);
  var self=this;if(window.ResizeObserver)new ResizeObserver(function(){self.resize()}).observe(host);else addEventListener('resize',function(){self.resize()});
  this.resize();this.last=performance.now();
  requestAnimationFrame(function loop(n){try{self.frame(n)}catch(e){if(!self._err){self._err=1;console.error(e)}}requestAnimationFrame(loop)});
}
var AP=Arena.prototype;
AP.resize=function(){var r=this.host.getBoundingClientRect(),d=window.devicePixelRatio||1;if(!r.width||!r.height)return;
  var Wd=Math.round(r.width*d),Hd=Math.round(r.height*d),key=Wd+'x'+Hd;if(key===this.key)return;this.key=key;
  var s=Math.max(1,Math.round(Hd/265));this.s=s;this.dpr=d;this.LW=Math.ceil(Wd/s);this.LH=Math.ceil(Hd/s);
  this.L.width=this.LW;this.L.height=this.LH;this.lg=cx2(this.L);
  this.c.width=this.LW*s;this.c.height=this.LH*s;this.c.style.width=(this.LW*s/d)+'px';this.c.style.height=(this.LH*s/d)+'px';this.mapKey='';this.tagC={}};
AP.X=function(x){return Math.round(x/100*this.LW)};AP.Y=function(y){return Math.round(y/100*this.LH)};
AP.skin=function(mc,col,id){var key=mc?'mc|'+mc.toLowerCase():'d|'+id;var s=this.skins[key];if(s)return s;
  s=this.skins[key]={f:charFrames(atlasPixels(heroAtlas(col,hashStr(id||mc)%997)),false)};
  if(mc){var img=new Image();img.crossOrigin='anonymous';img.onload=function(){try{s.f=charFrames(atlasPixels(img),img.height===32)}catch(e){}};img.src='https://mc-heads.net/skin/'+encodeURIComponent(mc)}
  return s};
/* ---------- maps ---------- */
AP.buildMap=function(mode){
  var W=this.LW,H=this.LH,c=cv(W,H),g=cx2(c),r=rng(mode==='colors'?5:9),self=this;this.torches=[];
  function put(sp,x,y){g.drawImage(sp,Math.round(x),Math.round(y))}
  if(mode==='colors'){
    var wallH=Math.round(H*.17),floorB=Math.round(H*.38),colTop=Math.round(H*.41),colBot=Math.round(H*.925);
    for(var y=0;y<wallH;y+=16)for(var x=0;x<W;x+=16)g.drawImage(T.brick,x,y);
    g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,wallH-2,W,2);
    for(var y2=wallH;y2<floorB;y2+=16)for(var x2=0;x2<W;x2+=16)g.drawImage(T.dark[((x2+y2)/16)%2|0],x2,y2);
    [.05,.25,.75,.95].forEach(function(f){put(T.banner,W*f-4,wallH*.18)});
    [.15,.36,.64,.85].forEach(function(f){self.torches.push([Math.round(W*f),Math.round(wallH*.5)])});
    put(T.barrel,W*.015,floorB-11);put(T.barrel,W*.955,floorB-11);put(T.crate,W*.925,floorB-12);put(T.crate,W*.035,floorB-22);
    g.fillStyle='#2b282e';g.fillRect(0,floorB,W,colTop-floorB);g.fillStyle='#5b5760';g.fillRect(0,floorB,W,1);g.fillStyle='#141216';g.fillRect(0,colTop-1,W,1);
    g.fillStyle='#1f1d22';g.fillRect(0,colBot,W,H-colBot);g.fillStyle='#0e0d10';g.fillRect(0,colBot,W,1);
    this.cols={top:colTop,bot:colBot,floorB:floorB,wallH:wallH};
  }else{
    for(var ty=0;ty<H;ty+=16)for(var tx=0;tx<W;tx+=16)g.drawImage(T.dirt[(r()*4)|0],tx,ty);
    var wh=Math.max(12,Math.round(H*.075));for(var x3=0;x3<W;x3+=16)for(var y3=0;y3<wh;y3+=16)g.drawImage(T.wall,x3,y3);
    g.fillStyle='#24170e';g.fillRect(0,wh,W,2);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,wh+2,W,3);
    // chasm between the players' floor and the boss
    var cx=Math.round(W*.71),wid=Math.max(10,Math.round(W*.04)),gapA=Math.round(H*.34),gapB=Math.round(H*.72);
    for(var y4=wh+2;y4<H;y4+=3){cx=clamp(cx+Math.round((r()-.5)*3),Math.round(W*.68),Math.round(W*.74));if(Math.abs(y4-gapA)<7||Math.abs(y4-gapB)<7)continue;var w=wid+((y4*7)%4);
      g.fillStyle='#160b05';g.fillRect(cx-w/2,y4,w,3);g.fillStyle='#4a2e1a';g.fillRect(cx-w/2-1,y4,1,3);g.fillStyle='#2a1a0e';g.fillRect(cx+w/2,y4,1,3)}
    [gapA,gapB].forEach(function(by){for(var i=0;i<wid+6;i+=3){g.fillStyle=i%2?'#8a6030':'#7a5428';g.fillRect(cx-wid/2-3+i,by-6,2,12)}g.fillStyle='#3a2410';g.fillRect(cx-wid/2-3,by-7,wid+6,1);g.fillRect(cx-wid/2-3,by+6,wid+6,1)});
    // scenery, kept off the players' floor
    var n=Math.round(W*H/2600);for(var i=0;i<n;i++){var px=r()*W,py=wh+4+r()*(H-wh-12),k=r();
      var onFloor=px>W*.05&&px<W*.66&&py>H*.16&&py<H*.93;if(onFloor&&k<.85)continue;if(px>W*.66&&px<W*.77)continue;
      put(k<.3?T.rock:k<.42?T.ore:k<.56?T.barrel:k<.66?T.crate:k<.82?T.bones:T.mush,px,py)}
    put(T.barrel,W*.02,wh+4);put(T.barrel,W*.055,wh+6);put(T.crate,W*.09,wh+4);put(T.chest,W*.5,wh+3);put(T.tree,W*.79,wh+2);put(T.tree,W*.95,H*.86);put(T.rock,W*.6,H*.92);put(T.ore,W*.015,H*.88);
    [.18,.36,.58,.84].forEach(function(f){self.torches.push([Math.round(W*f),Math.round(wh*.45)])});
  }
  this.map=c;this.mapKey=mode+W+'x'+H;
};
/* ---------- state in ---------- */
AP.update=function(P){
  var prev=this.P;this.P=P;var self=this,seen={};
  P.pl.forEach(function(a){var id=a[0];seen[id]=1;var e=self.E[id];
    if(!e){e=self.E[id]={id:id,x:a[7]<50?-3:103,y:a[8],ph:Math.random()*6,face:1,hp:1,flash:0,knock:null,gone:false,cheer:0,seed:hashStr(id)%100};if(prev)self.burst(clamp(a[7],3,97),a[8],'spawn',10)}
    e.n=a[1];e.c=a[2];e.mc=a[3];e.col=a[4];e.gear=a[5];e.tx=a[7];e.ty=a[8];var st=a[9]||'',was=e.st;e.st=st;e.pick=a[10];e.side=a[11];e.shield=a[12];e.lv=a[13];e.flags=a[14]||0;
    var alive=!!a[6];
    if(!alive&&e.alive&&!e.pre)self.hit(e,P);
    if(alive&&!e.alive){e.knock=null;e.gone=false;e.hp=1;e.flash=0;e.fall=null;e.pre=false}
    if(st==='cheer'&&was!=='cheer')e.cheer=1.4;
    if((e.flags&2)&&!(e._f&2))self.float(e.x,e.y-12,'Lv.'+e.lv,'#ffd23d');e._f=e.flags;
    e.alive=alive});
  Object.keys(this.E).forEach(function(id){if(!seen[id])delete self.E[id]});
  var mk=JSON.stringify((P.mobs||[]).map(function(m){return m.t+m.tx+m.ty}));
  if(mk!==this.mobKey){this.mobKey=mk;this.mobs=(P.mobs||[]).map(function(m,i){return {t:m.t,x:m.x,y:m.y,tx:m.tx,ty:m.ty,ph:i,dead:0,flash:0}})}
  if(prev){
    if(P.mg==='counters'&&P.step==='result'&&prev.step!=='result')this.countersResult(P);
    if(P.mg==='chests'&&P.chests&&P.chests.open&&!(prev.chests&&prev.chests.open))(P.chests.traps||[]).forEach(function(i){self.boom(P.chests.x[i],P.chests.y,1.3)});
    if(P.sweep&&(!prev.sweep||prev.sweep.at!==P.sweep.at))this.sweepFx={side:P.sweep.side,t:0,fizzle:P.sweep.fizzle,done:{}};
    if(P.mode==='colors'&&P.step==='drop'&&prev.step!=='drop'){(P.fallen||[]).forEach(function(i){self.fallT[i]=0});this.shake=.35}
    if(P.mode==='colors'&&P.step!=='drop'&&P.step!=='result')this.fallT={};
    if(P.vol&&P.vol.res&&!(prev.vol&&prev.vol.res)){if(P.vol.res==='win'){this.bossHit=.6;this.shake=.5;this.float(86,30,'-30','#ff5a5a')}if(P.vol.pit==='slime')this.burst(40,58,'slime',30);if(P.vol.pit==='lava')this.burst(40,58,'fire',30)}
    if(P.ph==='winner'&&prev.ph!=='winner'){this.fw=10;this.flash=.4;if(P.mode!=='colors')this.boom(86,45,2)}
    else if((P.boss||0)<(prev.boss||0))this.bossHit=Math.max(this.bossHit,.35);
  }
};
AP.hit=function(e,P){var self=this;e.flash=.3;e.hp=0;
  if(P.mode==='colors'){e.fall={t:0};return}
  var d=60;
  if(P.mg==='counters'&&this.mobs.length){var sk=this.mobs.filter(function(m){return m.t==='skeleton'})[0];if(sk)this.arrows.push({x0:sk.x,y0:sk.y-6,x1:e.x,y1:e.y-5,t:0,d:.3});if(this.mobs.some(function(m){return m.t==='creeper'}))this.boom(e.x+2,e.y-3,.5);d=320}
  if(P.mg==='vol')this.burst(e.x,e.y-4,'fire',14);
  setTimeout(function(){self.knock(e)},d)};
AP.knock=function(e){if(e.knock)return;var dir=e.x>40?1:-1;e.knock={t:0,vx:dir*(12+Math.random()*12),vy:-(45+Math.random()*20),x:e.x,y:e.y};this.burst(e.x,e.y-6,'spark',8)};
AP.countersResult=function(P){var self=this,live=P.pl.filter(function(a){return a[6]}),beats={zombie:0,skeleton:1,creeper:2,enderman:3};
  this.mobs.forEach(function(m,i){var hs=live.filter(function(a){return a[5]===beats[m.t]});if(!hs.length)return;var h=hs[i%hs.length];
    setTimeout(function(){if(m.t==='skeleton')self.arrows.push({x0:h[7],y0:h[8]-6,x1:m.x,y1:m.y-6,t:0,d:.3});
      setTimeout(function(){m.flash=.3;if(m.t==='creeper')self.boom(m.x,m.y-3,.8);else if(m.t==='enderman'){self.burst(m.x,m.y-12,'splash',18);self.burst(m.x,m.y-12,'ender',14)}else{self.burst(m.x,m.y-6,'spark',10);self.float(m.x,m.y-12,'HIT','#ffffff')}
        setTimeout(function(){m.dead=1;self.burst(m.x,m.y-4,'poof',12)},260)},m.t==='skeleton'?300:0)},200+i*130)})};
AP.boom=function(x,y,k){this.shake=Math.max(this.shake,.45*k);this.burst(x,y,'fire',Math.round(24*k));this.burst(x,y,'smoke',Math.round(12*k));this.flash=Math.max(this.flash,.1*k)};
AP.float=function(x,y,txt,col){this.floats.push({x:x,y:y,t:0,txt:txt,col:col||'#5ff0ff'})};
AP.burst=function(x,y,type,n){if(this.fx.length>900)return;
  for(var i=0;i<n;i++){var a=Math.random()*Math.PI*2,s=Math.random(),p={x:x,y:y,t:0,type:type,sz:1,g:0};
    if(type==='fire'){p.vx=Math.cos(a)*s*30;p.vy=Math.sin(a)*s*30;p.life=.4+s*.4;p.col=['#ffffff','#ffe066','#ff9a1a','#ff3b1a'][i%4];p.sz=s<.5?2:1;p.g=-8}
    else if(type==='smoke'){p.vx=Math.cos(a)*s*12;p.vy=Math.sin(a)*s*8-6;p.life=.7+s*.5;p.col=['#555','#777','#444'][i%3];p.sz=2;p.g=-4}
    else if(type==='poof'||type==='spawn'){p.vx=Math.cos(a)*s*16;p.vy=Math.sin(a)*s*10-5;p.life=.45+s*.4;p.col=type==='spawn'?['#c9b6ff','#ffffff'][i%2]:['#ffffff','#dddddd','#bbbbbb'][i%3];p.sz=s<.4?2:1;p.g=-2}
    else if(type==='spark'){p.vx=Math.cos(a)*(20+s*30);p.vy=Math.sin(a)*(20+s*30);p.life=.25+s*.25;p.col=['#ffffff','#ffe066'][i%2]}
    else if(type==='splash'){p.vx=(Math.random()-.5)*40;p.vy=-30-s*30;p.life=.7+s*.3;p.col=['#3b82f6','#8cc0ff','#ffffff'][i%3];p.g=120}
    else if(type==='ender'){p.vx=Math.cos(a)*s*14;p.vy=Math.sin(a)*s*18;p.life=.8+s*.5;p.col=['#e9a3ff','#b23df0'][i%2]}
    else if(type==='slime'){p.vx=(Math.random()-.5)*40;p.vy=-30-s*40;p.life=.9;p.col=['#7dff6a','#3fcf3a','#c8ffb8'][i%3];p.sz=2;p.g=120}
    else if(type==='confetti'){p.vx=(Math.random()-.5)*30;p.vy=-5-s*15;p.life=2.5+s;p.col=['#ff3dac','#22e6ff','#b6ff3b','#ffd23d','#a970ff'][i%5];p.sz=s<.5?2:1;p.g=22}
    else if(type==='fw'){var sp=20+s*22;p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp;p.life=1+s*.5;p.col=this._fwc;p.g=20}
    this.fx.push(p)}};

/* ---------- frame ---------- */
AP.frame=function(now){
  var dt=Math.min(.05,(now-this.last)/1000);this.last=now;this.t+=dt;
  if(!this.LW||!this.P)return;var P=this.P,g=this.lg,W=this.LW,H=this.LH,t=this.t,self=this,s=this.s;
  var mode=P.mode==='colors'?'colors':'cave';if(this.mapKey!==mode+W+'x'+H)this.buildMap(mode);
  g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.clearRect(0,0,W,H);
  if(!this.transparent)g.drawImage(this.map,0,0);
  if(mode==='colors')this.drawColors(g,P,dt);else this.drawCave(g,P,dt);
  var list=[];
  for(var id in this.E){var e=this.E[id],dx=e.tx-e.x,dy=e.ty-e.y,k=Math.min(1,dt*3);e.x+=dx*k;e.y+=dy*k;var mv=Math.abs(dx)+Math.abs(dy);e.mv=mv>.35;e.ph+=dt*(7+Math.min(8,mv));if(Math.abs(dx)>.3)e.face=dx<0?-1:1;
    if(e.gone||(!e.alive&&!e.knock&&!e.fall))continue;if(P.ph==='winner'&&e.alive&&e.st==='win')continue;list.push({y:e.y,e:e})}
  this.mobs.forEach(function(m){m.x+=(m.tx-m.x)*Math.min(1,dt*1.4);m.y+=(m.ty-m.y)*Math.min(1,dt*1.4);m.ph+=dt*7;if(!m.dead)list.push({y:m.y,m:m})});
  list.sort(function(a,b){return a.y-b.y});
  this.tagsOn=P.tags&&P.pl.length<=70;this.tagQ=[];
  list.forEach(function(it){if(it.e)self.drawChar(g,it.e,dt);else self.drawMob(g,it.m,dt)});
  if(mode==='cave')this.drawBoss(g,P,dt);
  if(this.sweepFx)this.drawSweep(g,P,dt);
  if(P.ph==='winner')this.drawWinner(g,P);
  this.arrows=this.arrows.filter(function(a){a.t+=dt;var k=Math.min(1,a.t/a.d),x0=self.X(a.x0),y0=self.Y(a.y0),x1=self.X(a.x1),y1=self.Y(a.y1),x=lerp(x0,x1,k),y=lerp(y0,y1,k)-Math.sin(k*Math.PI)*8,an=Math.atan2(y1-y0,x1-x0),c=Math.cos(an),sn=Math.sin(an);
    g.fillStyle='#d8c08a';for(var i=0;i<6;i++)g.fillRect(Math.round(x-c*i),Math.round(y-sn*i),1,1);g.fillStyle='#fff';g.fillRect(Math.round(x-c*6),Math.round(y-sn*6),1,1);g.fillStyle='#ccc';g.fillRect(Math.round(x),Math.round(y),1,1);return a.t<a.d});
  (this.torches||[]).forEach(function(tp,i){g.drawImage(T.torch,tp[0]-1,tp[1]-2);g.fillStyle=((t*8+i)|0)%2?'#fff3b0':'#ff7a1a';g.fillRect(tp[0],tp[1]-2,1,1)});
  this.fx=this.fx.filter(function(p){p.t+=dt;if(p.t>=p.life)return false;p.vy+=p.g*dt;p.x+=p.vx*dt*.35;p.y+=p.vy*dt*.35*(W/H);
    g.globalAlpha=p.type==='confetti'?1:clamp(1.6*(1-p.t/p.life),0,1);g.fillStyle=p.col;g.fillRect(Math.round(p.x/100*W),Math.round(p.y/100*H),p.sz,p.sz);return true});g.globalAlpha=1;
  if(this.fw>0){this.fw-=dt;if(Math.random()<dt*3){this._fwc=['#ff3dac','#22e6ff','#b6ff3b','#ffd23d','#ffffff'][Math.random()*5|0];this.burst(10+Math.random()*80,8+Math.random()*30,'fw',30)}if(Math.random()<dt*8)this.burst(Math.random()*100,-2,'confetti',3)}
  // whole-number blit
  var G=this.g;G.setTransform(1,0,0,1,0,0);G.imageSmoothingEnabled=false;G.clearRect(0,0,this.c.width,this.c.height);
  var sx=0,sy=0;if(this.shake>0){sx=Math.round((Math.random()-.5)*4*this.shake)*s;sy=Math.round((Math.random()-.5)*4*this.shake)*s;this.shake=Math.max(0,this.shake-dt*1.3)}
  G.drawImage(this.L,sx,sy,W*s,H*s);
  if(!this.transparent){G.save();G.globalCompositeOperation='lighter';(this.torches||[]).forEach(function(tp,i){var x=tp[0]*s+sx,y=(tp[1]-1)*s+sy,rad=s*(20+Math.sin(t*9+i)*2),gr=G.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(255,170,70,.3)');gr.addColorStop(1,'rgba(255,120,30,0)');G.fillStyle=gr;G.fillRect(x-rad,y-rad,rad*2,rad*2)});G.restore()}
  this.drawTexts(G,P,sx,sy,dt);

  if(this.flash>0){G.fillStyle='rgba(255,255,255,'+Math.min(.5,this.flash)+')';G.fillRect(0,0,this.c.width,this.c.height);this.flash=Math.max(0,this.flash-dt*2)}
};
AP.drawChar=function(g,e,dt){
  var P=this.P,X=this.X(e.x),Y=this.Y(e.y),sk=this.skin(e.mc,e.col,e.id).f,fl=e.face<0?'F':'';
  var fr=(e.cheer>0||e.st==='safe'||e.st==='win')?'cheer':e.mv?(((e.ph*1.4)|0)%2?'a':'b'):'idle',key=fr+fl;
  var hop=0;if(e.cheer>0){e.cheer-=dt;hop=Math.round(Math.abs(Math.sin(e.cheer*9))*4)}
  var bob=(!e.mv&&((this.t*2+e.seed)|0)%2)?1:0;
  function redOf(k){e._r=e._r||{};if(e._rf!==sk){e._r={};e._rf=sk}return e._r[k]||(e._r[k]=red(sk[k]))}
  if(e.knock){var k=e.knock;k.t+=dt;k.vy+=150*dt;k.x+=k.vx*dt*.4;k.y+=k.vy*dt*.4;if(k.t>.8){e.gone=true;this.burst(k.x,k.y-3,'poof',14);return}
    g.save();g.translate(this.X(k.x),this.Y(k.y)-8);g.rotate(Math.round(k.t*12)*Math.PI/4*(k.vx>0?1:-1));g.drawImage(k.t<.3?redOf(key):sk[key],-6,-8);g.restore();return}
  if(e.fall){var f=e.fall;f.t+=dt;if(f.t>.9){e.gone=true;this.burst(e.x,e.y+2,'poof',8);return}var sc=Math.max(.25,1-f.t*.8);g.save();g.globalAlpha=Math.max(0,1-f.t);g.translate(X,Y+Math.round(f.t*16));g.scale(sc,sc);g.drawImage(sk['idle'+fl],-6,-17);g.restore();return}
  g.fillStyle='rgba(0,0,0,.3)';g.fillRect(X-4,Y-1,8,2);g.fillRect(X-3,Y+1,6,1);
  var img=sk[key];if(e.flash>0){e.flash-=dt;img=redOf(key)}
  g.drawImage(img,X-6,Y-17-hop-bob);
  if(P.mg==='counters'&&GEARC[e.gear]&&P.step!=='intro')g.drawImage(GEARC[e.gear],e.face<0?X-11:X+4,Y-12-hop-bob,7,7);
  if(e.shield){g.fillStyle='rgba(120,220,255,'+(.35+.2*Math.sin(this.t*6))+')';g.fillRect(X-8,Y-21-hop,1,22);g.fillRect(X+7,Y-21-hop,1,22);g.fillRect(X-7,Y-21-hop,14,1)}
  if(e.flags&1){g.fillStyle='#ffd23d';g.fillRect(X-1,Y-31-hop,2,5);g.fillRect(X-1,Y-25-hop,2,1)}
  if(this.tagsOn){var by=Y-20-hop-bob;g.fillStyle='#111';g.fillRect(X-6,by,12,3);g.fillStyle=e.hp>0?'#3ddc4a':'#c62828';g.fillRect(X-5,by+1,Math.round(10*e.hp),1);this.tagQ.push([e,X,by-1])}
};
AP.drawMob=function(g,m,dt){var X=this.X(m.x),Y=this.Y(m.y),f=MOBF[m.t];if(!f)return;var moving=Math.abs(m.tx-m.x)+Math.abs(m.ty-m.y)>.4,fr=moving?((m.ph|0)%2?'a':'b'):'idle';
  var img=f[fr+'F']||f[fr];if(m.flash>0){m.flash-=dt;img=red(img)}g.fillStyle='rgba(0,0,0,.3)';g.fillRect(X-4,Y-1,8,2);g.drawImage(img,X-(img.width>>1),Y-img.height)};
AP.drawBoss=function(g,P,dt){if(P.ph==='winner')return;var W=this.LW,H=this.LH,X=Math.round(W*.87),Y=Math.round(H*.64);
  var b=MOBF.boss;if(this.bossHit>0){this.bossHit-=dt;if(((this.bossHit*20)|0)%2)b=MOBF.bossRed}else if(this.sweepFx&&this.sweepFx.t<1.4)b=MOBF.bossEyes;
  var bob=((this.t*2)|0)%2;g.fillStyle='rgba(0,0,0,.3)';g.fillRect(X-20,Y-2,40,4);g.drawImage(b,X-22,Y-66+bob);
  var hp=clamp((P.boss==null?100:P.boss)/100,0,1),bw=44;g.fillStyle='#111';g.fillRect(X-bw/2-1,Y-75,bw+2,5);g.fillStyle='#4a0e0e';g.fillRect(X-bw/2,Y-74,bw,3);g.fillStyle='#e23b3b';g.fillRect(X-bw/2,Y-74,Math.round(bw*hp),3);g.fillStyle='#ff9a9a';g.fillRect(X-bw/2,Y-74,Math.round(bw*hp),1);
  this.bossAt=[X,Y-76]};
AP.drawCave=function(g,P,dt){var H=this.LH,t=this.t,self=this;
  if((P.mg==='dodge'||P.mg==='final')&&P.ph==='game'){var mid=this.X(37);for(var y=Math.round(H*.1);y<H;y+=4){g.fillStyle=(y/4)%2?'#ffd23d':'#2a1a10';g.fillRect(mid,y,1,2)}}
  if(P.mg==='chests'&&P.chests){var open=P.chests.open;P.chests.x.forEach(function(x,i){var X=self.X(x),Y=self.Y(P.chests.y),trap=open&&P.chests.traps.indexOf(i)>=0;g.fillStyle='rgba(0,0,0,.3)';g.fillRect(X-12,Y+7,24,3);
    if(trap)g.drawImage(T.tnt,X-10,Y-4,20,14);else{g.drawImage(open?T.chestOpen:T.chest,X-12,Y-8,24,16);if(open&&((t*6)|0)%2){g.fillStyle='#fff8b0';g.fillRect(X-6+(((t*20)|0)%12),Y-11,1,1)}}})}
  if(P.mg==='vol'){var X=this.X(40),Y=this.Y(58),r=16,pit=P.vol&&P.vol.pit;g.fillStyle='#0e0603';g.fillRect(X-r-2,Y-10,r*2+4,20);g.fillStyle='#4a2e1a';g.fillRect(X-r-2,Y-10,r*2+4,2);
    g.fillStyle=pit==='slime'?'#4fd84a':pit==='lava'?(((t*4)|0)%2?'#ff7a1a':'#ffa526'):'#1a0f2a';g.fillRect(X-r,Y-7,r*2,15);
    if(pit){g.fillStyle=pit==='lava'?'#ffe066':'#c8ffb8';for(var i=0;i<8;i++)g.fillRect(X-r+2+(((i*9+t*12)|0)%(2*r-4)),Y-4+((i*5)%9),1,1)}
    else{var q=((t*3)|0)%2;g.fillStyle='#b23df0';g.fillRect(X-2,Y-5+q,5,1);g.fillRect(X+2,Y-4+q,1,2);g.fillRect(X,Y-2+q,2,1);g.fillRect(X,Y+1+q,2,1)}}
};
AP.drawSweep=function(g,P,dt){var f=this.sweepFx;f.t+=dt;var H=this.LH,x0=f.side===0?this.X(1):this.X(38),x1=f.side===0?this.X(36):this.X(67),top=Math.round(H*.09),warn=.6,dur=1.2;
  if(f.t<warn){if(((f.t*10)|0)%2){g.fillStyle='rgba(255,40,40,.25)';g.fillRect(x0,top,x1-x0,H-top)}return}
  var k=(f.t-warn)/dur;if(f.fizzle&&k>.5)k=1-k;if(f.t>warn+dur+.5){this.sweepFx=null;return}if(k<0||k>1)return;
  var y=Math.round(top+k*(H-top));g.fillStyle='rgba(255,255,255,.16)';g.fillRect(x0,Math.max(top,y-24),x1-x0,Math.min(24,y-top));g.fillStyle='rgba(255,255,255,.32)';g.fillRect(x0,Math.max(top,y-7),x1-x0,Math.min(7,y-top));
  var sw=T.sword,len=x1-x0+14;g.drawImage(sw,x0-7,y-5,len,Math.max(6,Math.round(len*sw.height/sw.width)));
  if(f.fizzle&&k>.46&&!f.clang){f.clang=1;var mx=f.side===0?18:52;this.burst(mx,y/H*100,'spark',22);this.float(mx,y/H*100-4,'MISS!','#ffd23d');this.shake=.4}
  for(var id in this.E){var e=this.E[id];if(!e.alive||f.done[id])continue;var ey=this.Y(e.y);if(!(ey<=y&&ey>y-12))continue;f.done[id]=1;
    if(e.side===f.side){if(f.fizzle)continue;if(e.shield){this.float(e.x,e.y-9,'BLOCK','#7fe8ff');this.burst(e.x,e.y-6,'spark',8);continue}e.pre=true;e.flash=.3;e.hp=0;this.knock(e)}
    else if(Math.random()<.3)this.float(e.x,e.y-9,'DODGE','#5ff0ff')}};
AP.drawColors=function(g,P,dt){var W=this.LW,H=this.LH,C=this.cols,t=this.t,cw=W/COLN;
  var sw=Math.round(W*.28),sh=Math.round(H*.25),sx=Math.round(W/2-sw/2),sy=Math.round(H*.015);
  g.fillStyle='#0c0b0e';g.fillRect(sx-4,sy-3,sw+8,sh+7);g.fillStyle='#4a4650';g.fillRect(sx-3,sy-2,sw+6,sh+5);g.fillStyle='#0b0b10';g.fillRect(sx,sy,sw,sh);
  var show=P.color!=null&&(P.step==='pick'||P.step==='drop'||P.step==='result');
  if(show){g.fillStyle=colColor(P.color);g.fillRect(sx+2,sy+2,sw-4,sh-4);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(sx+2,sy+2,sw-4,2);for(var yy=sy+4;yy<sy+sh-2;yy+=3){g.fillStyle='rgba(0,0,0,.06)';g.fillRect(sx+2,yy,sw-4,1)}}
  else{for(var i=0;i<14;i++){g.fillStyle=['#1d1b26','#26233a'][i%2];g.fillRect(sx+2+((i*13+(t*30|0))%(sw-6)),sy+2+((i*7)%(sh-6)),2,2)}}
  this.screen=[sx,sy,sw,sh,show];
  for(var c=0;c<COLN;c++){var x0=Math.round(c*cw),x1=Math.round((c+1)*cw),top=C.top,bot=C.bot,ft=this.fallT[c];
    if(ft!=null){this.fallT[c]=ft+dt;var k=Math.min(1,ft/.7);g.fillStyle='#07060a';g.fillRect(x0,top,x1-x0,bot-top);if(k<1){g.globalAlpha=1-k;g.fillStyle=colColor(c);g.fillRect(x0+Math.round(k*3),top+Math.round(k*30),x1-x0-Math.round(k*6),bot-top-Math.round(k*30));g.globalAlpha=1}
      g.fillStyle='#000';g.fillRect(x0,top,1,bot-top);continue}
    var hi=P.mode==='colors'&&P.step==='pick'&&P.color!=null&&false;
    g.fillStyle=colColor(c);g.fillRect(x0,top,x1-x0,bot-top);
    for(var yy2=top+8;yy2<bot;yy2+=8){g.fillStyle='rgba(0,0,0,.08)';g.fillRect(x0,yy2,x1-x0,1)}
    g.fillStyle='rgba(255,255,255,.22)';g.fillRect(x0,top,1,bot-top);g.fillStyle='rgba(0,0,0,.28)';g.fillRect(x1-1,top,1,bot-top)}
};
AP.drawWinner=function(g,P){var W=this.LW,H=this.LH,w=P.winner;if(!w)return;var X=Math.round(W*(P.mode==='colors'?.5:.36)),Y=Math.round(H*.7),t=this.t;
  for(var i=-1;i<=1;i++){g.fillStyle='#f5cf3d';g.fillRect(X+i*14-7,Y,14,14);g.fillStyle='#fff2a8';g.fillRect(X+i*14-7,Y,14,1);g.fillRect(X+i*14-7,Y,1,14);g.fillStyle='#b8901c';g.fillRect(X+i*14-7,Y+13,14,1);g.fillRect(X+i*14+6,Y,1,14)}
  var sk=this.skin(w.mc,w.col,w.id||w.n).f,hop=Math.round(Math.abs(Math.sin(t*4))*4);g.save();g.translate(X,Y-hop);g.scale(2,2);g.drawImage(sk.cheer,-6,-17);g.restore();
  g.drawImage(T.crown,X-5,Y-hop-40,10,6);this.winAt=[X,Y-hop-44]};
AP.tag=function(e,fs){var key=e.n+'|'+fs+'|'+e.lv+'|'+(e.c||'');var t=this.tagC[key];if(t)return t;
  var c0=cv(4,4).getContext('2d'),f1=fs+'px '+PIX,f2=Math.round(fs*.8)+'px '+PIX;c0.font=f1;var nm=e.n;while(c0.measureText(nm).width>fs*14&&nm.length>3)nm=nm.slice(0,-1);if(nm!==e.n)nm+='…';
  var lv=e.lv?'Lv.'+e.lv:'';var w1=c0.measureText(nm).width;c0.font=f2;var w2=lv?c0.measureText(lv).width+fs*.5:0;var w=Math.ceil(w1+w2+4),h=Math.ceil(fs*1.5);
  var c=cv(w,h),g=c.getContext('2d');g.textBaseline='middle';g.direction='ltr';var col=e.c&&/^#[0-9a-f]{6}$/i.test(e.c)?e.c:'#ffffff';
  function out(txt,x,font,fill){g.font=font;g.fillStyle='#000';for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++)if(dx||dy)g.fillText(txt,x+dx,h/2+dy);g.fillStyle=fill;g.fillText(txt,x,h/2)}
  out(nm,2,f1,brighten(col));if(lv)out(lv,2+w1+fs*.5,f2,'#ffd23d');t={c:c,w:w,h:h};this.tagC[key]=t;return t};
function brighten(h){var c=rgb(h),l=(c[0]*299+c[1]*587+c[2]*114)/1000;if(l>110)return h;var k=(110-l)/255+.25;return 'rgb('+c.map(function(v){return Math.round(v+(255-v)*k)}).join(',')+')'}
AP.drawTexts=function(G,P,sx,sy,dt){G.direction='ltr';var s=this.s,fs=Math.max(7,Math.round(s*3.6)),self=this,W=this.LW,H=this.LH;
  (this.tagQ||[]).forEach(function(q){var tg=self.tag(q[0],fs);G.drawImage(tg.c,Math.round(q[1]*s-tg.w/2)+sx,Math.round(q[2]*s-tg.h)+sy)});
  if(P.mode==='colors'&&this.cols){var C=this.cols,cw=W/COLN,nf=Math.max(7,Math.round(s*3.2));G.font=nf+'px '+PIX;G.textAlign='center';G.textBaseline='middle';
    for(var c=0;c<COLN;c++){var x=(c+.5)*cw*s+sx,y=((C.bot+H)/2)*s+sy;G.fillStyle=(c+1)%5===0?'#ffd23d':'#cfcfd8';G.fillText('!'+(c+1),x,y)}
    if(this.screen){var sc=this.screen,cxs=(sc[0]+sc[2]/2)*s+sx,cys=(sc[1]+sc[3]/2)*s+sy;var big=Math.round(sc[3]*s*.34);G.font=big+'px '+PIX;
      var txt=null;if(!sc[4]){var left=Math.max(0,Math.ceil((P.endsAt-Date.now())/1000));txt=P.ph==='lobby'?'?':P.step==='intro'&&left?String(left):'?'}
      if(txt){G.fillStyle='#000';G.fillText(txt,cxs+s,cys+s);G.fillStyle='#ffffff';G.fillText(txt,cxs,cys)}
      else if(P.tol!=null){G.font=Math.round(big*.42)+'px '+PIX;G.fillStyle='rgba(0,0,0,.55)';G.fillText('\u00B1'+P.tol,cxs+s,cys+big*.75+s);G.fillStyle='#fff';G.fillText('\u00B1'+P.tol,cxs,cys+big*.75)}}}
  if(this.bossAt&&P.mode!=='colors'&&P.ph!=='winner'){var bf=Math.max(7,Math.round(s*3.4));G.font=bf+'px '+PIX;G.textAlign='center';G.textBaseline='bottom';var bx=this.bossAt[0]*s+sx,by=this.bossAt[1]*s+sy;G.fillStyle='#000';G.fillText('CREEPER KING  Lv.99',bx+1,by+1);G.fillStyle='#ff6b6b';G.fillText('CREEPER KING  Lv.99',bx,by)}
  this.floats=this.floats.filter(function(f){f.t+=dt;if(f.t>1.2)return false;var ff=Math.max(8,Math.round(s*4.4));G.font=ff+'px '+PIX;G.textAlign='center';G.textBaseline='middle';var x=f.x/100*W*s+sx,y=(f.y/100*H-f.t*10)*s+sy;G.globalAlpha=clamp(2.2-f.t*2,0,1);
    G.fillStyle='#000';G.fillText(f.txt,x+Math.max(1,s/2),y+Math.max(1,s/2));G.fillStyle=f.col;G.fillText(f.txt,x,y);G.globalAlpha=1;return true});
};
window.BBArena=Arena;window.BBArena.colColor=colColor;window.BBArena.COLN=COLN;
})();
