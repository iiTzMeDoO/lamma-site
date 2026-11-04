/* mc.js — original blocky "Minecraft-Dungeons-like" art, drawn in code (no image files, no copied assets).
   window.MC (browser) / module.exports (Node, pure parts only).
   - MC.tex(name): a 16x16 procedural block texture (grass, dirt, stone, cobble, sand, sandstone, netherrack, lava, soul, endstone,
     obsidian, purpur, deepslate, ore, planks, wool_<hex>…), cached.
   - MC.Iso(ctx,{tw,ox,oy}): isometric projector; iso.box(x,y,z,w,d,h,faces) draws one textured voxel box with shaded faces
     (top / +y face / +x face are the visible ones) and a thin dark outline — the chunky Dungeons look.
   - MC.drawEntity(iso,ent,t): players (shirt = Twitch colour, skin/hair from a hash of the login, optional Twitch picture as the face),
     mobs (zombie, husk, skeleton, creeper, spider, cave spider, blaze, piglin, wither skeleton, enderman, endermite) and the four bosses
     (wither, dragon, golem, zombie king). Walk / attack / hit-flash / death animations come from ent.anim.
   - MC.MAPS: the five maps (plains, desert, nether, end, cave) with floor / wall blocks, decorations, lights and mob sets. */
(function(root){
'use strict';
function hash(s){s=String(s||'');var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){var a=(seed>>>0)||1;return function(){a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};}
function hx(h){h=String(h||'#888').replace('#','');if(h.length===3)h=h.replace(/(.)/g,'$1$1');var n=parseInt(h,16);if(isNaN(n))n=0x888888;return [(n>>16)&255,(n>>8)&255,n&255];}
function rgb(c){return 'rgb('+c[0]+','+c[1]+','+c[2]+')'}
function shade(h,k){var c=hx(h);return rgb(c.map(function(v){return Math.max(0,Math.min(255,Math.round(v*k)))}));}
function mix(a,b,t){var A=hx(a),B=hx(b);return rgb([0,1,2].map(function(i){return Math.round(A[i]+(B[i]-A[i])*t)}));}
function toHex(c){return '#'+c.map(function(v){return ('0'+Math.max(0,Math.min(255,Math.round(v))).toString(16)).slice(-2)}).join('')}
/* a Twitch colour that reads on dark stages (very dark names get lifted) */
function readableColor(c){var a=hx(c||'#8fa0ff');var l=.299*a[0]+.587*a[1]+.114*a[2];if(l<70){var k=70/Math.max(l,1);a=a.map(function(v){return Math.min(255,v*k+40)})}return toHex(a);}
var SKINS=['#f0c39a','#d9a074','#b47a52','#8a5636','#f5d2b0','#c68a5e'];
var HAIRS=['#2b1a10','#5a3a1a','#141414','#c98a2b','#7a2a12','#e8e0d0','#3a2a6a'];
var PANTS=['#2c3a7a','#3a2a1a','#2b2b30','#4a4a6a','#1f4a3a','#5a2a2a'];
function look(login,color){var r=rng(hash(login)*7+11);return {skin:SKINS[Math.floor(r()*SKINS.length)],hair:HAIRS[Math.floor(r()*HAIRS.length)],pants:PANTS[Math.floor(r()*PANTS.length)],shirt:readableColor(color||['#e34c4c','#4c8be3','#4ce37a','#e3c84c','#b04ce3','#4ce3d8'][Math.floor(r()*6)]),style:Math.floor(r()*4)};}

var api={hash:hash,rng:rng,hx:hx,shade:shade,mix:mix,toHex:toHex,readableColor:readableColor,look:look};
if(typeof document==='undefined'){if(typeof module!=='undefined')module.exports=api;root.MC=api;return;}

/* ---------- textures ---------- */
var TEX={};
function mk(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function noise(base,amt,seed,over){var c=mk(16,16),x=c.getContext('2d'),r=rng(seed);for(var j=0;j<16;j++)for(var i=0;i<16;i++){var o=over?over(i,j,r):null;x.fillStyle=o||shade(base,1+(r()-.5)*amt);x.fillRect(i,j,1,1);}return c;}
var GEN={
  grass:function(s){return noise('#5fae3c',.26,s,function(i,j,r){return r()<.07?'#4a8f2c':r()<.04?'#7fcb52':null})},
  grass_side:function(s){return noise('#86573a',.25,s,function(i,j,r){return j<3+((i*7+s)%3===0?2:0)?shade('#5fae3c',1+(r()-.5)*.3):null})},
  dirt:function(s){return noise('#86573a',.3,s,function(i,j,r){return r()<.05?'#6b4329':null})},
  path:function(s){return noise('#9a7a4a',.2,s,function(i,j,r){return r()<.08?'#7f6236':null})},
  stone:function(s){return noise('#7f7f84',.2,s,function(i,j,r){return r()<.06?'#606066':null})},
  cobble:function(s){var c=noise('#77777c',.25,s);var x=c.getContext('2d'),r=rng(s+3);x.fillStyle='rgba(30,30,36,.55)';for(var k=0;k<7;k++){var px=Math.floor(r()*16),py=Math.floor(r()*16);x.fillRect(px,py,Math.floor(r()*5)+2,1);x.fillRect(px,py,1,Math.floor(r()*4)+2);}return c},
  bricks:function(s){var c=noise('#7c7c82',.15,s);var x=c.getContext('2d');x.fillStyle='rgba(30,30,38,.7)';for(var j=0;j<16;j+=4){x.fillRect(0,j,16,1);for(var i=(j/4%2)*4;i<16;i+=8)x.fillRect(i,j,1,4);}return c},
  sand:function(s){return noise('#dbc98f',.12,s,function(i,j,r){return r()<.05?'#c7b47a':null})},
  sandstone:function(s){var c=noise('#d6c189',.08,s);var x=c.getContext('2d');x.fillStyle='rgba(150,120,60,.45)';x.fillRect(0,4,16,1);x.fillRect(0,11,16,1);x.fillStyle='rgba(255,240,200,.35)';x.fillRect(0,5,16,1);return c},
  netherrack:function(s){return noise('#7a2b2b',.42,s,function(i,j,r){return r()<.09?'#561a1c':r()<.04?'#a5463d':null})},
  nether_bricks:function(s){var c=noise('#3a1418',.3,s);var x=c.getContext('2d');x.fillStyle='rgba(10,0,4,.8)';for(var j=0;j<16;j+=4){x.fillRect(0,j,16,1);for(var i=(j/4%2)*4;i<16;i+=8)x.fillRect(i,j,1,4);}return c},
  water:function(s){return noise('#2f6fd6',.16,s,function(i,j,r){return r()<.08?'#7fb2ff':r()<.06?'#2456b0':null})},
  cactus:function(s){var c=noise('#4f8f2f',.14,s);var x=c.getContext('2d');x.fillStyle='rgba(20,50,10,.5)';for(var i=1;i<16;i+=4)x.fillRect(i,0,1,16);x.fillStyle='#e8f0c0';x.fillRect(3,5,1,1);x.fillRect(10,11,1,1);return c},
  lava:function(s){return noise('#f2701a',.22,s,function(i,j,r){return r()<.14?'#ffc63d':r()<.07?'#c9420c':null})},
  soul:function(s){return noise('#4a3a2c',.3,s,function(i,j,r){return r()<.05?'#2c2219':null})},
  endstone:function(s){return noise('#e3e0a4',.13,s,function(i,j,r){return r()<.07?'#c6c387':null})},
  purpur:function(s){var c=noise('#a77aa8',.12,s);var x=c.getContext('2d');x.fillStyle='rgba(70,40,80,.55)';x.fillRect(0,0,16,1);x.fillRect(0,8,16,1);x.fillRect(0,0,1,16);x.fillRect(8,8,1,8);x.fillRect(8,0,1,8);return c},
  obsidian:function(s){return noise('#1c1428',.5,s,function(i,j,r){return r()<.06?'#4b2f72':null})},
  deepslate:function(s){return noise('#45454d',.22,s,function(i,j,r){return (j%4===0&&r()<.6)?'#36363d':null})},
  ore:function(s){var c=noise('#6e6e74',.2,s);var x=c.getContext('2d'),r=rng(s*3+1);var cols=['#58e0f0','#f0c040','#e04040','#40e080'];var col=cols[s%4];for(var k=0;k<5;k++){var px=Math.floor(r()*13),py=Math.floor(r()*13);x.fillStyle=col;x.fillRect(px,py,2,2);x.fillStyle='rgba(255,255,255,.7)';x.fillRect(px,py,1,1);}return c},
  planks:function(s){var c=noise('#a8803f',.1,s);var x=c.getContext('2d');x.fillStyle='rgba(80,50,20,.6)';for(var j=3;j<16;j+=4)x.fillRect(0,j,16,1);x.fillRect(5,0,1,4);x.fillRect(11,4,1,4);x.fillRect(3,8,1,4);x.fillRect(9,12,1,4);return c},
  log:function(s){var c=noise('#6b4a26',.2,s);var x=c.getContext('2d');x.fillStyle='rgba(40,25,10,.5)';for(var i=1;i<16;i+=3)x.fillRect(i,0,1,16);return c},
  leaves:function(s){return noise('#3f8a2a',.5,s,function(i,j,r){return r()<.16?'#2a6a1c':r()<.05?'#62b043':null})},
  tnt_side:function(){var c=mk(16,16),x=c.getContext('2d');x.fillStyle='#d83a2a';x.fillRect(0,0,16,16);x.fillStyle='#b52a1e';for(var i=0;i<16;i+=4)x.fillRect(i,0,2,16);x.fillStyle='#eee';x.fillRect(0,6,16,4);x.fillStyle='#222';x.fillRect(2,7,2,2);x.fillRect(6,7,1,2);x.fillRect(9,7,2,2);x.fillRect(12,7,2,2);return c},
  chest:function(){var c=mk(16,16),x=c.getContext('2d');x.fillStyle='#a5712c';x.fillRect(0,0,16,16);x.fillStyle='#7a4f1a';x.fillRect(0,0,16,1);x.fillRect(0,6,16,1);x.fillRect(0,15,16,1);x.fillRect(0,0,1,16);x.fillRect(15,0,1,16);x.fillStyle='#d8d8d8';x.fillRect(7,5,2,3);return c},
  crate:function(s){var c=noise('#9a7034',.1,s);var x=c.getContext('2d');x.fillStyle='#5c3e18';x.fillRect(0,0,16,2);x.fillRect(0,14,16,2);x.fillRect(0,0,2,16);x.fillRect(14,0,2,16);for(var k=0;k<14;k++)x.fillRect(1+k,1+k,2,1);return c},
  glow:function(s){return noise('#e8c060',.25,s,function(i,j,r){return r()<.2?'#fff2b0':null})}
};
function tex(name,seed){
  seed=seed||1;var k=name+':'+seed;if(TEX[k])return TEX[k];
  var c;
  if(name.indexOf('wool_')===0){var base='#'+name.slice(5);c=noise(base,.07,seed,function(i,j,r){return ((i+j*3)%5===0&&r()<.5)?shade(base,.9):null});}
  else c=(GEN[name]||GEN.stone)(seed);
  return TEX[k]=c;
}
/* a solid colour texture (for entity faces without a pattern) */
function solid(col){var k='#'+col;if(TEX[k])return TEX[k];var c=mk(1,1),x=c.getContext('2d');x.fillStyle=col;x.fillRect(0,0,1,1);return TEX[k]=c;}

/* pixel-face textures for entities: 8x8 from a little string map */
function pix(rows,pal){var h=rows.length,w=rows[0].length,c=mk(w,h),x=c.getContext('2d');for(var j=0;j<h;j++)for(var i=0;i<w;i++){var ch=rows[j][i];if(ch==='.'||!pal[ch])continue;x.fillStyle=pal[ch];x.fillRect(i,j,1,1);}return c;}
var FACE_CACHE={};
function face(kind,a,b,c2){var k=kind+a+b+c2;if(FACE_CACHE[k])return FACE_CACHE[k];var t;
  if(kind==='player'){ /* a: skin, b: hair, c2: style */
    var st=+c2||0;var rows=[
      'hhhhhhhh',
      st===1?'hhhhhhhh':'hhhhhhhh',
      st===2?'hssssssh':'hhssssss',
      'ssssssss',
      'swessews',
      'ssssssss',
      st===3?'shmmmmhs':'ssmmmmss',
      'ssssssss'];
    t=pix(rows,{h:b,s:a,w:'#ffffff',e:['#2a4aa8','#3a7a2a','#6a3a1a','#2a2a2a'][(hash(a+b)%4)],m:shade(a,.68)});}
  else if(kind==='zombie'){t=pix(['gggggggg','gggggggg','gggggggg','gGggggGg','gkkggkkg','ggg..ggg'.replace(/\./g,'G'),'ggGGGGgg','gggggggg'],{g:a,G:shade(a,.78),k:'#101010'});}
  else if(kind==='skel'){t=pix(['bbbbbbbb','bbbbbbbb','bbbbbbbb','bkkbbkkb','bkkbbkkb','bbbkkbbb','bkkkkkkb','bbbbbbbb'],{b:a,k:'#1e1e1e'});}
  else if(kind==='creeper'){t=pix(['gGggggGg','gggGgggg','gkkggkkg','gkkggkkg','gggkkggg','ggkkkkgg','ggkggkgg','gGggggGg'],{g:'#4fbf3a',G:'#3a9a2c',k:'#0f1a0f'});}
  else if(kind==='spider'){t=pix(['kkkkkkkk','kkkkkkkk','kRkkkkRk','kkRkkRkk','kkkkkkkk','kRkkkkRk','kkkkkkkk','kkkkkkkk'],{k:a,R:'#e02020'});}
  else if(kind==='blaze'){t=pix(['yyyyyyyy','yYyyyyYy','yyyyyyyy','ykkyykky','yyyyyyyy','yyYYYYyy','yyyyyyyy','yYyyyyYy'],{y:'#f6c43a',Y:'#d88a1a',k:'#3a1a0a'});}
  else if(kind==='piglin'){t=pix(['pppppppp','pppppppp','pkwppwkp','pppppppp','ppPPPPpp','pPnPPnPp','ppPPPPpp','pwppppwp'],{p:'#e8a0a0',P:'#d07c7c',k:'#2a1a1a',w:'#f5f0d8',n:'#6a2a2a'});}
  else if(kind==='ender'){t=pix(['kkkkkkkk','kkkkkkkk','kkkkkkkk','kkkkkkkk','pPPkkPPp','kkkkkkkk','kkkkkkkk','kkkkkkkk'],{k:'#141018',p:'#d070ff',P:'#f0b0ff'});}
  else if(kind==='golem'){t=pix(['gggggggg','gggggggg','gGGggGGg','grrggrrg','gggnnggg','gggnnggg','gvggggvg','gggggggg'],{g:'#d6cfc0',G:'#b4ab9a',r:'#a01c1c',n:'#a89a86',v:'#5f9a3a'});}
  else if(kind==='wither'){t=pix(['kkkkkkkk','kKkkkkKk','kkkkkkkk','kwwkkwwk','kkkkkkkk','kkkkkkkk','kKKKKKKk','kkkkkkkk'],{k:'#45454e',K:'#5c5c66',w:'#aaf6ff'});}
  else if(kind==='dragon'){t=pix(['kkkkkkkk','kKkkkkKk','kppkkppk','kkkkkkkk','kKKKKKKk','kkkkkkkk','kkkkkkkk','kKkkkkKk'],{k:'#18161e',K:'#2a2632',p:'#d070ff'});}
  else if(kind==='illager'){t=pix(['ssssssss','ssssssss','sbbbbbbs','swgsswgs','sssnnsss','sssnnsss','sssnnsss','ssssssss'],{s:a||'#9aa3a3',b:'#2a2a2a',w:'#e8e8e8',g:'#2a7a4a',n:shade(a||'#9aa3a3',.82)});}
  else if(kind==='witch'){t=pix(['pppppppp','ssssssss','sbbssbbs','swgsswgs','sssnnsss','sssnnsss','ssknnsss','ssssssss'],{p:'#3a1a4a',s:'#c4a07a',b:'#4a3020',w:'#e8e8e8',g:'#4ab04a',n:'#a8805a',k:'#5aa03a'});}
  else if(kind==='drowned'){t=pix(['gggggggg','gGgggggg','gggggGgg','gccggccg','gggggggg','ggGGGGgg','gGggggGg','gggggggg'],{g:'#5aa29a',G:'#3f7f78',c:'#7ff0ff'});}
  else if(kind==='stray'){t=pix(['bbbbbbbb','bBbbbbBb','bbbbbbbb','bkkbbkkb','bkkbbkkb','bbbkkbbb','bkkkkkkb','bBbbbbBb'],{b:'#c4d0d0',B:'#9aa8a8',k:'#1e2626'});}
  else if(kind==='zpiglin'){t=pix(['pppppppp','pGpppGGp','pkwppwkp','pppGpppp','ppPPPPpp','pPnPPnPp','ppPPPPGp','pwppppwp'],{p:'#e8a0a0',P:'#d07c7c',G:'#6aa04a',k:'#2a1a1a',w:'#f5f0d8',n:'#6a2a2a'});}
  else if(kind==='vex'){t=pix(['bbbbbbbb','bbbbbbbb','bkkbbkkb','bwkbbkwb','bbbbbbbb','bbkkkkbb','bbbbbbbb','bbbbbbbb'],{b:'#b8c8dc',k:'#2a2a3a',w:'#ffffff'});}
  else if(kind==='hoglin'){t=pix(['bbbbbbbb','bkbbbbkb','bbbbbbbb','bpppppbb'.slice(0,8),'pnppppnp','pppppppp','wbbbbbbw','wbbbbbbw'],{b:'#a8705a',k:'#1a1010',p:'#e8a8a0',n:'#6a3a3a',w:'#f5f0d8'});}
  else if(kind==='slime'){t=pix(['gggggggg','gGggggGg','gkkggkkg','gkkggkkg','gggggggg','ggggkggg','gggggggg','gGggggGg'],{g:'#7ad65c',G:'#5cb848',k:'#2a5a1a'});}
  else if(kind==='magma'){t=pix(['kkkkkkkk','kokkkkok','kkkkkkkk','kyykkyyk','kkkkkkkk','koooooook'.slice(0,8),'kkkkkkkk','kokkkkok'],{k:'#3a1410',o:'#c84a1a',y:'#ffd040'});}
  else if(kind==='ghast'){t=pix(['wwwwwwww','wwwwwwww','wkkwwkkw','wggwwggw','wwwwwwww','wwkkkkww','wwkkkkww','wwwwwwww'],{w:'#f2f2f2',k:'#4a4a4a',g:'#c8c8c8'});}
  else if(kind==='guardian'){t=pix(['tttttttt','tTttttTt','ttwwwwtt','twwkkwwt','twwkkwwt','ttwwwwtt','tTttttTt','tttttttt'],{t:a||'#4aa098',T:shade(a||'#4aa098',.8),w:'#f0e8d0',k:'#c84a1a'});}
  else if(kind==='warden'){t=pix(['tttttttt','tTttttTt','tttttttt','tttttttt','tccttcct','tttttttt','tkkkkkkt','tttttttt'],{t:'#0f3a44',T:'#1a5560',c:'#5ff0ff',k:'#051418'});}
  else if(kind==='shulker'){t=pix(['pppppppp','pPppppPp','pppppppp','yyyyyyyy','ykyyyyky','yyyyyyyy','pppppppp','pPppppPp'],{p:'#9a6a9a',P:'#7a4a7a',y:'#e8d870',k:'#2a2a2a'});}
  else if(kind==='phantom'){t=pix(['bbbbbbbb','bBbbbbBb','bggbbggb','bbbbbbbb','bbbbbbbb','bBBBBBBb','bbbbbbbb','bbbbbbbb'],{b:'#3a4a7a',B:'#2a3460',g:'#7aff6a'});}
  else if(kind==='silver'){t=pix(['gggggggg','gGggggGg','gkggggkg','gggggggg','gGGGGGGg','gggggggg','gGggggGg','gggggggg'],{g:'#9a9aa4',G:'#7a7a84',k:'#1a1a1a'});}
  else t=solid(a);
  return FACE_CACHE[k]=t;}

/* ---------- isometric projector ---------- */
function Iso(ctx,o){this.ctx=ctx;this.set(o||{});}
Iso.prototype.set=function(o){this.tw=o.tw||64;this.th=this.tw/2;this.zh=o.zh||this.tw*.62;this.ox=o.ox||0;this.oy=o.oy||0;};
Iso.prototype.p=function(x,y,z){return [this.ox+(x-y)*this.tw/2,this.oy+(x+y)*this.th/2-(z||0)*this.zh];};
/* draw a texture onto a parallelogram (origin o, edge vectors u and v), shaded k (0 = as is, >0 darker) and optional tint */
Iso.prototype.quad=function(img,o,u,v,dark,flash,outline){
  var c=this.ctx;c.save();c.setTransform(u[0]/img.width*this.dpr,u[1]/img.width*this.dpr,v[0]/img.height*this.dpr,v[1]/img.height*this.dpr,o[0]*this.dpr,o[1]*this.dpr);
  c.imageSmoothingEnabled=false;c.drawImage(img,0,0);
  if(dark>0||flash){c.fillStyle=flash?'rgba(255,255,255,'+flash+')':'rgba(8,6,18,'+dark+')';c.fillRect(0,0,img.width,img.height);if(flash&&dark>0){c.fillStyle='rgba(8,6,18,'+dark*.5+')';c.fillRect(0,0,img.width,img.height);}}
  c.restore();
  if(outline){c.beginPath();c.moveTo(o[0],o[1]);c.lineTo(o[0]+u[0],o[1]+u[1]);c.lineTo(o[0]+u[0]+v[0],o[1]+u[1]+v[1]);c.lineTo(o[0]+v[0],o[1]+v[1]);c.closePath();c.strokeStyle=outline;c.lineWidth=Math.max(1,this.tw/70);c.stroke();}
};
Iso.prototype.dpr=1;
/* faces: {top,fy,fx} textures (or one texture for all), opts: {flash, outline, light} */
Iso.prototype.box=function(x,y,z,w,d,h,f,opt){
  opt=opt||{};var T=f.top||f,FY=f.fy||f.side||f,FX=f.fx||f.side||f;var ol=opt.outline===undefined?'rgba(10,8,20,.55)':opt.outline;var fl=opt.flash||0,dk=opt.dark||0;
  var tw2=this.tw/2,th2=this.th/2,zh=this.zh;
  /* +y face (lower-left) */
  this.quad(FY,this.p(x,y+d,z+h),[w*tw2,w*th2],[0,h*zh],.16+dk,fl,ol);
  /* +x face (lower-right) */
  this.quad(FX,this.p(x+w,y+d,z+h),[d*tw2,-d*th2],[0,h*zh],.36+dk,fl,ol);
  /* top */
  this.quad(T,this.p(x,y,z+h),[w*tw2,w*th2],[-d*tw2,d*th2],dk*.6,fl,ol);
};
/* a flat textured tile (floor) */
Iso.prototype.tile=function(x,y,z,img,dark){this.quad(img,this.p(x,y,z),[this.tw/2,this.th/2],[-this.tw/2,this.th/2],dark||0,0,null);};

/* ---------- a 3/4 "front-angled" voxel projector (same API as Iso): x → right, y → toward the camera, z → up.
   Used by the crowd modes (TNT, cave, warrior) whose left / right halves must read as left / right on screen.
   sk = how much depth leans to the right (shows the right-hand faces), v = depth squash, zh = block height. ---------- */
function OIso(ctx,o){this.ctx=ctx;this.set(o||{});}
OIso.prototype=Object.create(Iso.prototype);
OIso.prototype.set=function(o){this.tw=o.tw||48;this.u=this.tw;this.v=o.v||this.tw*.6;this.sk=o.sk!=null?o.sk:.32;this.zh=o.zh||this.tw*.78;this.th=this.v;this.ox=o.ox||0;this.oy=o.oy||0;};
OIso.prototype.p=function(x,y,z){return [this.ox+(x+y*this.sk)*this.u,this.oy+y*this.v-(z||0)*this.zh];};
OIso.prototype.box=function(x,y,z,w,d,h,f,opt){opt=opt||{};var T=f.top||f,FY=f.fy||f.side||f,FX=f.fx||f.side||f;var ol=opt.outline===undefined?'rgba(10,8,20,.55)':opt.outline;var fl=opt.flash||0,dk=opt.dark||0;var u=this.u,v=this.v,sk=this.sk,zh=this.zh;
  this.quad(FX,this.p(x+w,y,z+h),[d*sk*u,d*v],[0,h*zh],.34+dk,fl,ol);
  this.quad(FY,this.p(x,y+d,z+h),[w*u,0],[0,h*zh],.14+dk,fl,ol);
  this.quad(T,this.p(x,y,z+h),[w*u,0],[d*sk*u,d*v],dk*.6,fl,ol);};
OIso.prototype.tile=function(x,y,z,img,dark){this.quad(img,this.p(x,y,z),[this.u,0],[this.sk*this.u,this.v],dark||0,0,null);};

/* ---------- maps ---------- */
var MAPS={
  plains:{ar:'سهول',en:'Plains',floor:['grass','grass','grass','path'],wall:'cobble',wall2:'log',deco:['leaves','crate','planks'],sky:['#2b4a6a','#0e1a2a'],light:'#ffd27a',amb:.34,mobs:['zombie','skeleton','creeper','spider'],boss:'golem',fog:'rgba(20,40,30,.0)'},
  desert:{ar:'صحراء',en:'Desert',floor:['sand','sand','sandstone','sand'],wall:'sandstone',wall2:'sandstone',deco:['crate','tnt_side','sandstone'],sky:['#7a5a3a','#2a1a10'],light:'#ffd890',amb:.26,mobs:['husk','skeleton','creeper','spider'],boss:'king'},
  nether:{ar:'النذر',en:'Nether',floor:['netherrack','netherrack','soul','netherrack'],wall:'nether_bricks',wall2:'nether_bricks',deco:['glow','nether_bricks','obsidian'],sky:['#3a0c0c','#120404'],light:'#ff8a3a',amb:.5,lava:true,mobs:['blaze','piglin','wskel','skeleton'],boss:'wither'},
  end:{ar:'النهاية',en:'The End',floor:['endstone','endstone','endstone','purpur'],wall:'obsidian',wall2:'purpur',deco:['obsidian','purpur'],sky:['#140c22','#05030a'],light:'#c78aff',amb:.46,void:true,mobs:['enderman','endermite','enderman','skeleton'],boss:'dragon'},
  cave:{ar:'الكهف',en:'Cave',floor:['stone','cobble','deepslate','stone'],wall:'deepslate',wall2:'ore',deco:['ore','crate','chest'],sky:['#14161c','#050608'],light:'#ffb35a',amb:.56,lava:true,mobs:['zombie','cavespider','skeleton','creeper'],boss:'king'}
};
var BOSSES={wither:{ar:'الذابل',en:'The Wither',map:'nether'},dragon:{ar:'تنين النهاية',en:'Ender Dragon',map:'end'},golem:{ar:'الحارس الحديدي',en:'Iron Guardian',map:'plains'},king:{ar:'ملك الزومبي',en:'Zombie King',map:'cave'}};
var MOBS={zombie:{ar:'زومبي',en:'Zombie'},husk:{ar:'زومبي الصحرا',en:'Husk'},skeleton:{ar:'هيكل',en:'Skeleton'},creeper:{ar:'كريبر',en:'Creeper'},spider:{ar:'عنكبوت',en:'Spider'},cavespider:{ar:'عنكبوت الكهف',en:'Cave spider'},blaze:{ar:'بليز',en:'Blaze'},piglin:{ar:'خنزير النذر',en:'Piglin'},wskel:{ar:'هيكل الذابل',en:'Wither skeleton'},enderman:{ar:'إندرمان',en:'Enderman'},endermite:{ar:'إندرمايت',en:'Endermite'}};

if(root.BTR){Object.keys(root.BTR.MOBS).forEach(function(k){MOBS[k]={ar:root.BTR.MOBS[k].ar,en:root.BTR.MOBS[k].en};});Object.keys(root.BTR.BOSSES).forEach(function(k){BOSSES[k]=Object.assign({},BOSSES[k]||{},{ar:root.BTR.BOSSES[k].ar,en:root.BTR.BOSSES[k].en});});}
/* how tall each one stands (blocks, before scale) — where names / HP bars go */
var MOBH={spider:.9,cavespider:.8,endermite:.6,silverfish:.6,slime:1.1,magma:1.2,shulker:1.2,creeper:1.8,enderman:2.7,wskel:2.6,phantom:2.1,vex:2.4,ghast:2.6,hoglin:1.5,ravager:1.8,guardian:1.4,blaze:2.3,
  'boss:ravagerk':2.6,'boss:elder':1.7,'boss:warden':2.2,'boss:blazek':2.6,'boss:evokerm':2.1,'boss:wither':2.2,'boss:dragon':1.9,'boss:golem':2.5,'boss:king':2.2};

/* ---------- entities ----------
   ent: {kind:'player'|mob kind|'boss:<id>', x,y (world, feet centre), z, face:0..3 (0=+y toward lower-left, 1=+x toward lower-right, 2=-y, 3=-x),
         look:{skin,hair,pants,shirt,style}, avatar:Image|null, anim:{walk,atk,flash,dead,t}, scale} */
function faceTex(f,front,back,side){return f;}
/* draw one body part as a box in the entity's local frame: (fw = along facing, rt = to the right, up) */
function part(iso,e,lx,ly,lz,lw,ld,lh,T,opt){
  /* local: lx = forward offset, ly = sideways offset (centre), size lw (forward depth), ld (width), lh (height) */
  var s=e.scale||1,fx=e.face||0,x,y,w,d;
  lx*=s;ly*=s;lz*=s;lw*=s;ld*=s;lh*=s;
  /* facing +y: forward = +y, right = -x ; +x: forward=+x, right=+y; -y: forward=-y, right=+x; -x: forward=-x, right=-y */
  if(fx===0){x=e.x-ly-ld/2;y=e.y+lx-lw/2;w=ld;d=lw;}
  else if(fx===1){x=e.x+lx-lw/2;y=e.y+ly-ld/2;w=lw;d=ld;}
  else if(fx===2){x=e.x+ly-ld/2;y=e.y-lx-lw/2;w=ld;d=lw;}
  else {x=e.x-lx-lw/2;y=e.y-ly-ld/2;w=lw;d=ld;}
  /* which texture goes on each visible face: T = {front, back, side, top} */
  var fy=fx===0?T.front:fx===2?T.back:T.side, fxx=fx===1?T.front:fx===3?T.back:T.side;
  iso.box(x,y,(e.z||0)+lz,w,d,lh,{top:T.top||T.side,fy:fy||T.side,fx:fxx||T.side},opt);
}
function S(c){return solid(c);}
function boxT(col,frontTex,topCol){var s=S(col);return {front:frontTex||s,back:s,side:s,top:topCol?S(topCol):S(shade(col,1.12))};}
function humanoid(iso,e,o,t){
  /* o: {head:T, body:T, arm:T, leg:T, armsForward, thin, tall, weapon} ; heights in blocks, 1 block = 1 unit */
  var a=e.anim||{},walk=a.walk||0,sw=Math.sin(walk*9)*.11,atk=a.atk||0,fl=a.flash||0,opt={flash:fl};
  var L=o.tall?1.05:.75,B=o.tall?.9:.75,H=.5,lw=o.thin?.14:.25,bw=o.thin?.36:.5,bd=o.thin?.18:.25,aw=o.thin?.12:.22;
  var bob=Math.abs(Math.sin(walk*9))*.03;
  /* legs (behind first: the one further from camera first is approximated by drawing order left→right) */
  part(iso,e, sw,-bw/4,0, lw,lw,L, o.leg,opt);
  part(iso,e,-sw, bw/4,0, lw,lw,L, o.leg,opt);
  /* body */
  part(iso,e,0,0,L+bob, bd,bw,B, o.body,opt);
  /* arms */
  var fwd=o.armsForward?.3:0, ab=atk>0?Math.sin(atk*Math.PI)*.35:0;
  var armZ=L+bob+(o.armsForward?B-aw:0), armH=o.armsForward?aw:B;
  if(o.armsForward){part(iso,e,bd/2+.25+ab,-bw/2-aw/2,armZ,.55,aw,aw,o.arm,opt);part(iso,e,bd/2+.25+ab*.6,bw/2+aw/2,armZ,.55,aw,aw,o.arm,opt);}
  else{part(iso,e,-sw*1.2,-bw/2-aw/2,armZ,aw,aw,armH,o.arm,opt);part(iso,e,sw*1.2+ab,bw/2+aw/2,armZ,aw,aw,armH,o.arm,opt);}
  if(o.weapon){var wz=L+bob+B*.45;var ws=o.weapon,wc=o.wcol||(ws==='gold'?'#ffd84a':ws==='stone'?'#9a9aa0':ws==='trident'?'#4fc8c0':'#d6f2fa'),hx2=.18+ab*1.2,hy2=bw/2+aw/2;
    if(ws!=='tnt'&&ws!=='flask')part(iso,e,hx2,hy2,wz-.05,.1,.1,.16,{side:S('#6a4a20')},opt);
    if(ws==='bow'||ws==='crossbow')part(iso,e,.22+ab,hy2,wz-.15,.06,.1,.7,{side:S(o.wcol&&o.wcol!=='#a0743a'?shade(o.wcol,.8):'#7a5228'),top:S('#9a7240')},opt);
    else if(ws==='staff'||ws==='wand'){part(iso,e,hx2,hy2,wz-.3,.07,.07,ws==='staff'?1.05:.7,{side:S('#7a5228'),top:S('#9a7240')},opt);part(iso,e,hx2,hy2,wz+(ws==='staff'?.72:.38),.16,.16,.16,{side:S(ws==='wand'?'#ff8a2a':wc==='#d6f2fa'?'#9a6aff':wc),top:S('#ffffff')},{flash:Math.max(fl,.25+Math.sin(t*6)*.15)});}
    else if(ws==='tnt')part(iso,e,hx2+.08,hy2,wz-.05,.26,.26,.26,{side:TNT_SIDE(),top:S('#d8d8d8')},opt);
    else if(ws==='flask')part(iso,e,hx2+.05,hy2,wz-.05,.16,.16,.24,{side:S('#5cd65c'),top:S('#c9a26b')},{flash:Math.max(fl,.2)});
    else if(ws==='axe'){part(iso,e,hx2,hy2,wz+.05,.07,.07,.62,{side:S('#7a5228')},opt);part(iso,e,hx2+.1,hy2,wz+.42,.18,.06,.24,{side:S(wc),top:S('#ffffff')},opt);}
    else if(ws==='dagger')part(iso,e,hx2,hy2,wz+.1,.07,.1,.34,{side:S(wc),top:S('#ffffff')},opt);
    else part(iso,e,hx2,hy2,wz+.1,.08,.12,.62,{side:S(wc),top:S('#ffffff')},opt);}
  if(o.armour){var AC=S(o.armour),AT=S(shade(o.armour,1.15));part(iso,e,0,-bw/2-aw/2,L+bob+B-.2,aw+.08,aw+.08,.22,{side:AC,top:AT},opt);part(iso,e,0,bw/2+aw/2,L+bob+B-.2,aw+.08,aw+.08,.22,{side:AC,top:AT},opt);}
  /* head */
  part(iso,e,0,0,L+B+bob, H,H,H, o.head,opt);
  if(o.armour){var HC=S(o.armour);part(iso,e,-.02,0,L+B+bob+H-.04,H+.08,H+.08,.1,{side:HC,top:S(shade(o.armour,1.15)),front:HC},opt);}
  if(o.wings){var wf=Math.sin(t*14)*.18;part(iso,e,-.2,-.35,L+B*.6+bob+wf,.06,.5,.4,o.wings,opt);part(iso,e,-.2,.35,L+B*.6+bob-wf,.06,.5,.4,o.wings,opt);}
  if(o.hat)o.hat(L+B+bob+H,opt);
}
function playerT(e){
  var lk=e.look||look(e.name||'x',e.color),fc=e.avatar&&e.avatar.complete&&e.avatar.naturalWidth?e.avatar:face('player',lk.skin,lk.hair,lk.style);
  var shirt=S(lk.shirt),hair=S(lk.hair);
  return {head:{front:fc,back:hair,side:FACE_SIDE(lk),top:hair},
    body:{front:shirtFront(lk.shirt),back:shirt,side:S(shade(lk.shirt,.92)),top:S(shade(lk.shirt,1.1))},
    arm:{front:shirt,back:shirt,side:armT(lk),top:shirt},leg:{front:S(lk.pants),back:S(lk.pants),side:S(shade(lk.pants,.9)),top:S(lk.pants)}};
}
var SIDEC={};
function FACE_SIDE(lk){var k='fs'+lk.skin+lk.hair;if(SIDEC[k])return SIDEC[k];return SIDEC[k]=pix(['hhhhhhhh','hhhhhhhh','hhhhhhhs','hhhhhsss','hhhhssss','hhhsssss','hhssssss','hhssssss'],{h:lk.hair,s:lk.skin});}
function shirtFront(c){var k='sf'+c;if(SIDEC[k])return SIDEC[k];return SIDEC[k]=pix(['cccccccc','cCcccccC'.slice(0,8),'cccccccc','cccdcccc','cccccccc','cccccccc','cccccccc','bbbbbbbb'],{c:c,C:shade(c,1.15),d:shade(c,.8),b:'#3a2a1a'});}
function armT(lk){var k='ar'+lk.shirt+lk.skin;if(SIDEC[k])return SIDEC[k];return SIDEC[k]=pix(['cc','cc','cc','cc','ss','ss','ss','ss'],{c:lk.shirt,s:lk.skin});}
function mobT(kind){
  var k='m'+kind;if(SIDEC[k])return SIDEC[k];var r;
  if(kind==='zombie'||kind==='husk'||kind==='king'){var sk=kind==='husk'?'#b0a070':'#5f9a4a',sh=kind==='husk'?'#7a6a4a':kind==='king'?'#6a2aa0':'#2aa7a7',pa=kind==='husk'?'#5a4a2a':'#34349a';
    r={head:{front:face('zombie',sk),back:S(shade(sk,.9)),side:S(sk),top:S(shade(sk,1.05))},body:boxT(sh),arm:{front:S(sk),back:S(sk),side:pix(['cc','cc','ss','ss','ss','ss'],{c:sh,s:sk}),top:S(sh)},leg:boxT(pa)};}
  else if(kind==='skeleton'||kind==='wskel'){var b=kind==='wskel'?'#2c2c30':'#d8d8d4';
    r={head:{front:face('skel',b),back:S(b),side:S(shade(b,.94)),top:S(b)},body:{front:pix(['bkbkbkbk','kkkkkkkk','bkbkbkbk','kkkkkkkk','bkbkbkbk','kkkkkkkk'],{b:b,k:kind==='wskel'?'#111':'#555'}),back:S(shade(b,.8)),side:S(shade(b,.8)),top:S(b)},arm:boxT(b),leg:boxT(shade(b,.95))};}
  else if(kind==='piglin'){r={head:{front:face('piglin'),back:S('#e8a0a0'),side:S('#e09494'),top:S('#e8a0a0')},body:boxT('#7a5a2a'),arm:boxT('#e8a0a0'),leg:boxT('#3a2a1a')};}
  else if(kind==='enderman'){r={head:{front:face('ender'),back:S('#141018'),side:S('#1a1620'),top:S('#1e1a24')},body:boxT('#141018'),arm:boxT('#141018'),leg:boxT('#141018')};}
  return SIDEC[k]=r;
}
var GLOW={};
function glow(ctx,x,y,r,col,a){var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col.replace('A',a));g.addColorStop(1,col.replace('A',0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function rgba(h,a){var c=hx(h);return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';}
function drawEntity(iso,e,t){
  var c=iso.ctx,k=e.kind,a=e.anim||{},fl=a.flash||0,opt={flash:fl};
  /* shadow */
  var sp=iso.p(e.x,e.y,0),sr=iso.tw*(e.scale||1)*(e.shadow||.32);
  c.fillStyle='rgba(0,0,0,.32)';c.beginPath();c.ellipse(sp[0],sp[1],sr,sr/2,0,0,Math.PI*2);c.fill();
  if(e.glow){var gp=iso.p(e.x,e.y,(e.scale||1)*1);glow(c,gp[0],gp[1],iso.tw*(e.scale||1)*1.4,rgba(e.glow,'A'),.35);}
  if(k==='player'){humanoid(iso,e,Object.assign(playerT(e),{weapon:e.weapon||'iron'}),t);return;}
  if(k==='zombie'||k==='husk'){humanoid(iso,e,Object.assign({},mobT(k),{armsForward:true}),t);return;}
  if(k==='skeleton'||k==='wskel'){humanoid(iso,e,Object.assign({},mobT(k),{thin:true,weapon:k==='wskel'?'stone':'bow',tall:k==='wskel'}),t);return;}
  if(k==='piglin'){humanoid(iso,e,Object.assign({},mobT(k),{weapon:'gold'}),t);return;}
  if(k==='enderman'){humanoid(iso,e,Object.assign({},mobT(k),{thin:true,tall:true}),t);
    if(Math.random()<.2){var pp=iso.p(e.x+(Math.random()-.5)*.6,e.y+(Math.random()-.5)*.6,Math.random()*2.4*(e.scale||1));c.fillStyle='rgba(210,120,255,.8)';c.fillRect(pp[0],pp[1],3,3);}return;}
  if(k==='creeper'){var cg=S('#4fbf3a'),cs={front:face('creeper'),back:cg,side:S('#45ad33'),top:S('#5ccf46')};var swell=a.fuse?1+Math.sin(t*30)*.06*a.fuse:1;var w=a.walk||0,sw=Math.sin(w*9)*.08;var lg={side:S('#3a9a2c'),top:S('#4fbf3a')};
    part(iso,e,.18+sw,-.13,0,.22,.22,.36,lg,opt);part(iso,e,.18-sw,.13,0,.22,.22,.36,lg,opt);part(iso,e,-.18-sw,-.13,0,.22,.22,.36,lg,opt);part(iso,e,-.18+sw,.13,0,.22,.22,.36,lg,opt);
    part(iso,e,0,0,.36,.3*swell,.5*swell,.9,{front:noiseCreeper(),back:noiseCreeper(),side:noiseCreeper(),top:cg},{flash:Math.max(fl,a.fuse?(Math.sin(t*30)>0?.5:0):0)});
    part(iso,e,0,0,1.26,.5*swell,.5*swell,.5,cs,{flash:Math.max(fl,a.fuse?(Math.sin(t*30)>0?.5:0):0)});return;}
  if(k==='spider'||k==='cavespider'||k==='endermite'){var col=k==='cavespider'?'#1f3a4a':k==='endermite'?'#3a2a4a':'#3a3028',sc=k==='endermite'?.45:1;var e2=Object.assign({},e,{scale:(e.scale||1)*sc});var w2=a.walk||0;
    var leg={side:S(shade(col,.7)),top:S(shade(col,.85))};
    if(k!=='endermite')for(var i=0;i<4;i++){var lo=Math.sin(w2*10+i*1.6)*.06;part(iso,e2,-.25+i*.17+lo,-.55,0,.07,.4,.08,leg,opt);part(iso,e2,-.25+i*.17-lo,.55,0,.07,.4,.08,leg,opt);part(iso,e2,-.25+i*.17+lo,-.78,0,.07,.07,.25,leg,opt);part(iso,e2,-.25+i*.17-lo,.78,0,.07,.07,.25,leg,opt);}
    part(iso,e2,-.3,0,.12,.6,.6,.42,{side:S(col),top:S(shade(col,1.1)),front:S(col),back:S(col)},opt);
    part(iso,e2,.25,0,.14,.4,.48,.38,{front:face('spider',shade(col,.8)),back:S(col),side:S(shade(col,.9)),top:S(shade(col,1.05))},opt);return;}
  if(k==='blaze'){var bz=e.z||0;var e3=Object.assign({},e,{z:bz+.35+Math.sin(t*3+e.x)*.12});
    for(var r=0;r<8;r++){var ang=t*2.2+r*Math.PI/4,rad=.42,hz=r<4?.95:.45;var rx=Math.cos(ang)*rad,ry=Math.sin(ang)*rad;iso.box(e3.x+rx-.06,e3.y+ry-.06,e3.z+hz,.12,.12,.45,{top:S('#ffe080'),side:S('#f0a020')},opt);}
    part(iso,e3,0,0,1.2,.5,.5,.5,{front:face('blaze'),back:S('#f6c43a'),side:S('#eab030'),top:S('#ffd860')},opt);
    if(Math.random()<.35){var bp=iso.p(e3.x+(Math.random()-.5)*.5,e3.y+(Math.random()-.5)*.5,e3.z+.6+Math.random());c.fillStyle='rgba(90,80,80,.5)';c.fillRect(bp[0],bp[1],4,4);}
    var gp2=iso.p(e3.x,e3.y,e3.z+1);glow(c,gp2[0],gp2[1],iso.tw*.7,'rgba(255,170,60,A)',.18);return;}
  if(k==='boss:golem'){var G={front:S('#d6cfc0'),back:S('#cfc8b8'),side:S('#c7bfae'),top:S('#e0d9ca')};var gv=golemBody();var wg=a.walk||0,sg=Math.sin(wg*6)*.1,ag=a.atk?Math.sin(a.atk*Math.PI)*.6:0;
    part(iso,e,sg,-.3,0,.35,.35,.9,G,opt);part(iso,e,-sg,.3,0,.35,.35,.9,G,opt);
    part(iso,e,0,0,.9,.6,1.2,1.0,{front:gv,back:gv,side:gv,top:G.top},opt);
    part(iso,e,-sg*1.5+ag,-.75,.35,.3,.3,1.45,G,opt);part(iso,e,sg*1.5+ag,.75,.35,.3,.3,1.45,G,opt);
    part(iso,e,.06,0,1.9,.5,.5,.6,{front:face('golem'),back:G.back,side:G.side,top:G.top},opt);return;}
  if(k==='boss:king'){humanoid(iso,e,Object.assign({},mobT('king'),{armsForward:true,weapon:'gold',hat:function(z,o2){var gd={side:S('#ffcc33'),top:S('#ffe27a')};var off=.21;[[-off,-off],[off,-off],[-off,off],[off,off]].forEach(function(p){part(iso,e,p[0],p[1],z,.1,.1,.18,gd,o2)});part(iso,e,0,0,z,.52,.52,.08,gd,o2);}}),t);
    var kp=iso.p(e.x,e.y,(e.scale||1)*1.4);glow(c,kp[0],kp[1],iso.tw*(e.scale||1)*1.1,'rgba(160,80,255,A)',.18);return;}
  if(k==='boss:wither'){var W={side:S('#54545e'),top:S('#686872'),front:S('#4a4a54'),back:S('#4a4a54')};var hz=(e.z||0)+.4+Math.sin(t*2)*.12;var e4=Object.assign({},e,{z:hz});
    part(iso,e4,0,0,0,.18,.18,1.2,W,opt);
    for(var rb=0;rb<3;rb++)part(iso,e4,0,0,.35+rb*.25,.2,.8,.1,{side:S('#3a3a40'),top:S('#46464c')},opt);
    part(iso,e4,0,0,1.15,.3,1.9,.25,W,opt);
    var HT={front:face('wither'),back:S('#3a3a42'),side:S('#42424a'),top:S('#55555e')};
    part(iso,e4,.02,-.85,1.3,.45,.45,.45,HT,opt);part(iso,e4,.02,.85,1.3,.45,.45,.45,HT,opt);part(iso,e4,.05,0,1.4,.65,.65,.65,HT,opt);
    [[-.85,1.5],[.85,1.5],[0,1.7]].forEach(function(h){var ep=iso.p(e4.x+(e.face===1?.4:0),e4.y+(e.face===0?.4:0)+h[0]*(e.face===1?1:0),e4.z+h[1]*(e.scale||1));glow(c,ep[0],ep[1],iso.tw*.35,'rgba(140,240,255,A)',.5);});
    var wp=iso.p(e4.x,e4.y,e4.z+(e.scale||1)*1.5);glow(c,wp[0],wp[1],iso.tw*(e.scale||1)*1.6,'rgba(120,60,200,A)',.28);
    if(Math.random()<.5){var q=iso.p(e4.x+(Math.random()-.5),e4.y+(Math.random()-.5),e4.z+Math.random()*1.8*(e.scale||1));c.fillStyle='rgba(30,10,40,.7)';c.fillRect(q[0],q[1],5,5);}return;}
  if(k==='boss:dragon'){var D={side:S('#1c1a24'),top:S('#2a2634'),front:S('#1c1a24'),back:S('#1c1a24')};var flap=Math.sin(t*4)*.35;var e5=Object.assign({},e,{z:(e.z||0)+.9+Math.sin(t*2)*.15});
    part(iso,e5,-1.0,0,.1,.9,.25,.25,D,opt);part(iso,e5,-1.7,0,.15,.6,.18,.18,D,opt);
    part(iso,e5,0,0,0,1.3,.7,.55,D,opt);
    for(var sp2=0;sp2<4;sp2++)part(iso,e5,-.5+sp2*.3,0,.55,.12,.1,.15,{side:S('#3a3646'),top:S('#4a4656')},opt);
    var WG={side:S('#2e2838'),top:S('#3a3248')};part(iso,e5,0,-.95-.0,.45+flap,.9,1.2,.06,WG,opt);part(iso,e5,0,.95,.45+flap,.9,1.2,.06,WG,opt);
    part(iso,e5,.9,0,.25,.5,.25,.25,D,opt);
    part(iso,e5,1.3,0,.25,.55,.5,.45,{front:face('dragon'),back:S('#1c1a24'),side:S('#22202a'),top:S('#2a2634')},opt);
    var dp=iso.p(e5.x,e5.y,e5.z+(e.scale||1)*.6);glow(c,dp[0],dp[1],iso.tw*(e.scale||1)*1.8,'rgba(200,110,255,A)',.22);return;}
  /* ---- more mobs (all original block art) ---- */
  if(MOB2[k]){MOB2[k](iso,e,t,opt,c,a);return;}
  /* fallback */
  part(iso,e,0,0,0,.5,.5,1,{side:S('#888')},opt);
}

/* ---------- the bigger bestiary: textures + draw functions per mob (humanoids reuse humanoid()) ---------- */
var TNTS=null;function TNT_SIDE(){if(TNTS)return TNTS;TNTS=pix(['rrrrrrrr','rRrrrrRr','wwwwwwww','wkwkwkwk','wwwwwwww','rrrrrrrr','rRrrrrRr','rrrrrrrr'],{r:'#d83a2a',R:'#a82a1e',w:'#f0f0f0',k:'#2a2a2a'});return TNTS;}
function HT(faceKind,skin,shirt,pants,o){o=o||{};var k='h2'+faceKind+skin+shirt+pants;if(SIDEC[k])return SIDEC[k];var sk=S(skin),sh=S(shirt);
  return SIDEC[k]={head:{front:o.face||face(faceKind,skin),back:S(o.hair||shade(skin,.9)),side:S(o.hair||skin),top:S(o.hair||shade(skin,1.05))},
    body:{front:o.chest||pix(['cccccccc','cCccccCc','cccccccc','cccdcccc','cccccccc','cCccccCc','cccccccc','bbbbbbbb'],{c:shirt,C:shade(shirt,1.15),d:shade(shirt,.8),b:o.belt||shade(shirt,.6)}),back:sh,side:S(shade(shirt,.9)),top:S(shade(shirt,1.1))},
    arm:{front:o.sleeve?sh:sk,back:o.sleeve?sh:sk,side:pix(['cc','cc','cc','ss','ss','ss'],{c:shirt,s:o.sleeve?shirt:skin}),top:sh},leg:boxT(pants)};}
function Q(iso,e,lx,ly,lz,lw,ld,lh,col,opt,front){var T={side:S(col),top:S(shade(col,1.12)),front:front||S(col),back:S(shade(col,.9))};part(iso,e,lx,ly,lz,lw,ld,lh,T,opt);}
function quad4(iso,e,t,opt,col,len,wid,hgt,legH,leg){var w=(e.anim&&e.anim.walk)||0,sw=Math.sin(w*9)*.1;var lw=leg||.22;
  Q(iso,e,len*.35+sw,-wid*.32,0,lw,lw,legH,shade(col,.8),opt);Q(iso,e,len*.35-sw,wid*.32,0,lw,lw,legH,shade(col,.8),opt);Q(iso,e,-len*.35-sw,-wid*.32,0,lw,lw,legH,shade(col,.8),opt);Q(iso,e,-len*.35+sw,wid*.32,0,lw,lw,legH,shade(col,.8),opt);
  Q(iso,e,0,0,legH,len,wid,hgt,col,opt);}
var CROWN=function(iso,e,z,o2,w){var gd={side:S('#ffcc33'),top:S('#ffe27a')};w=w||.52;var off=w/2-.05;[[-off,-off],[off,-off],[-off,off],[off,off]].forEach(function(p){part(iso,e,p[0],p[1],z,.1,.1,.18,gd,o2)});part(iso,e,0,0,z,w,w,.08,gd,o2);};
var MOB2={
 drowned:function(iso,e,t,opt){humanoid(iso,e,Object.assign(HT('drowned','#5aa29a','#3a8a8a','#4a5aa0'),{armsForward:true,weapon:'trident'}),t);},
 stray:function(iso,e,t,opt){humanoid(iso,e,Object.assign(HT('stray','#c4d0d0','#5a6a74','#c4d0d0',{chest:pix(['cccccccc','cbcbcbcb','cccccccc','cbcbcbcb','cccccccc','cbcbcbcb','cccccccc','cccccccc'],{c:'#4a5a64',b:'#c4d0d0'})}),{thin:true,weapon:'bow'}),t);},
 zpiglin:function(iso,e,t,opt){humanoid(iso,e,Object.assign(HT('zpiglin','#e8a0a0','#8a6a3a','#5a7a3a',{hair:'#d08a8a'}),{weapon:'gold'}),t);},
 brute:function(iso,e,t,opt){humanoid(iso,e,Object.assign(HT('piglin','#e8a0a0','#2a2a2a','#3a2a1a',{face:face('piglin'),chest:pix(['kkkkkkkk','kyyyyyyk','kkkkkkkk','kykkkkyk','kkkkkkkk','kkyyyykk','kkkkkkkk','bbbbbbbb'],{k:'#2a2a2a',y:'#ffcc33',b:'#5a3a1a'})}),{weapon:'axe',wcol:'#ffd84a'}),t);},
 pillager:function(iso,e,t,opt){humanoid(iso,e,Object.assign(HT('illager','#9aa3a3','#3a3a40','#2a2a30',{chest:pix(['cccccccc','cCccccCc','cccwwccc','cccwwccc','cccccccc','cCccccCc','cccccccc','bbbbbbbb'],{c:'#3a3a40',C:'#4a4a52',w:'#e8e8e8',b:'#5a3a1a'})}),{weapon:'crossbow'}),t);},
 vindicator:function(iso,e,t,opt){humanoid(iso,e,Object.assign(HT('illager','#9aa3a3','#2a3a4a','#1f2a36',{sleeve:true}),{weapon:'axe',wcol:'#d6dce0'}),t);},
 evoker:function(iso,e,t,opt){humanoid(iso,e,Object.assign(HT('illager','#9aa3a3','#1e1e24','#1e1e24',{sleeve:true,chest:pix(['kkkkkkkk','kyykkyyk','kkkkkkkk','kkkyykkk','kkkkkkkk','kkkyykkk','kkkkkkkk','kyyyyyyk'],{k:'#1e1e24',y:'#d8b040'})}),{}),t);
   if(Math.random()<.25){var p=iso.p(e.x+(Math.random()-.5)*.8,e.y+(Math.random()-.5)*.8,Math.random()*2*(e.scale||1));iso.ctx.fillStyle='rgba(200,230,255,.8)';iso.ctx.fillRect(p[0],p[1],3,3);}},
 witch:function(iso,e,t,opt){humanoid(iso,e,Object.assign(HT('witch','#c4a07a','#4a2a5a','#3a1a4a',{sleeve:true,hair:'#3a1a4a'}),{weapon:'flask',hat:function(z,o2){var hp={side:S('#3a1a4a'),top:S('#4a2a5a')};part(iso,e,0,0,z,.7,.7,.06,hp,o2);part(iso,e,0,0,z+.06,.42,.42,.18,hp,o2);part(iso,e,-.04,0,z+.24,.28,.28,.16,hp,o2);part(iso,e,-.1,0,z+.4,.14,.14,.14,{side:S('#5aa03a'),top:S('#6ab04a')},o2);}}),t);},
 vex:function(iso,e,t,opt){var e2=Object.assign({},e,{scale:(e.scale||1)*.55,z:(e.z||0)+.9+Math.sin(t*5+e.x)*.15});humanoid(iso,e2,Object.assign(HT('vex','#b8c8dc','#9ab0c8','#b8c8dc',{sleeve:true}),{weapon:'iron',wings:{side:S('rgba(220,235,255,.85)'),top:S('#e8f2ff')}}),t);},
 phantom:function(iso,e,t,opt){var e2=Object.assign({},e,{z:(e.z||0)+1.3+Math.sin(t*3+e.y)*.18});var f=Math.sin(t*7+e.x)*.25,B='#3a4a7a';
   Q(iso,e2,0,0,0,.9,.42,.2,B,opt);Q(iso,e2,-.55,0,.02,.35,.24,.14,shade(B,.85),opt);Q(iso,e2,.55,0,0,.34,.4,.26,B,opt,face('phantom'));
   Q(iso,e2,0,-.55,f,.55,.7,.06,'#4a5a8a',opt);Q(iso,e2,0,.55,f,.55,.7,.06,'#4a5a8a',opt);},
 silverfish:function(iso,e,t,opt){var w=(e.anim&&e.anim.walk)||t,sw=function(i){return Math.sin(w*10+i)*.06};
   Q(iso,e,-.42,sw(2),0,.22,.2,.16,'#8a8a94',opt);Q(iso,e,-.18,sw(1),0,.28,.3,.22,'#9a9aa4',opt);Q(iso,e,.12,sw(0),0,.3,.34,.24,'#8e8e98',opt);Q(iso,e,.38,0,0,.22,.26,.2,'#9a9aa4',opt,face('silver'));},
 magma:function(iso,e,t,opt){var bz=Math.abs(Math.sin(t*3+e.x))*.35;var e2=Object.assign({},e,{z:(e.z||0)+bz});var sq=1-bz*.15;
   Q(iso,e2,0,0,0,.72,.72,.34*sq,'#4a1a12',opt);Q(iso,e2,0,0,.34*sq,.74,.74,.06,'#d8641a',{flash:Math.max(opt.flash||0,.3)});Q(iso,e2,0,0,.4*sq,.72,.72,.32*sq,'#4a1a12',opt,face('magma'));
   var gp=iso.p(e2.x,e2.y,e2.z+.4);glow(iso.ctx,gp[0],gp[1],iso.tw*.6,'rgba(255,140,40,A)',.2);},
 ghast:function(iso,e,t,opt){var e2=Object.assign({},e,{z:(e.z||0)+1.1+Math.sin(t*1.6+e.x)*.2});
   for(var i=0;i<6;i++){var tx=(i%3-1)*.3,ty=(i<3?-.2:.2),len=.6+((i*37)%5)*.08+Math.sin(t*3+i)*.08;part(iso,e2,tx,ty,-len,.1,.1,len,{side:S('#e4e4e4'),top:S('#f2f2f2')},opt);}
   Q(iso,e2,0,0,0,1.15,1.15,1.15,'#f0f0f0',opt,face('ghast'));},
 hoglin:function(iso,e,t,opt){var C='#a8705a';quad4(iso,e,t,opt,C,1.0,.6,.55,.42,.22);Q(iso,e,.48,0,.12,.5,.5,.5,shade(C,.95),opt,face('hoglin'));
   Q(iso,e,.75,-.2,.18,.08,.08,.3,'#f5f0d8',opt);Q(iso,e,.75,.2,.18,.08,.08,.3,'#f5f0d8',opt);Q(iso,e,-.1,0,.97,.7,.12,.12,'#e8d070',opt);},
 ravager:function(iso,e,t,opt){var C='#4a4a52';quad4(iso,e,t,opt,C,1.5,.85,.75,.6,.3);Q(iso,e,.8,0,.45,.6,.62,.62,shade(C,.9),opt,face('illager','#6a6a72'));
   Q(iso,e,.75,-.38,1.0,.12,.12,.32,'#e8e0c8',opt);Q(iso,e,.75,.38,1.0,.12,.12,.32,'#e8e0c8',opt);Q(iso,e,0,0,1.35,.9,.6,.08,'#6a4a2a',opt);},
 shulker:function(iso,e,t,opt){var open=Math.max(0,Math.sin(t*1.5+e.x))*.22;Q(iso,e,0,0,0,.8,.8,.42,'#9a6a9a',opt);Q(iso,e,0,0,.28,.46,.46,.3+open,'#e8d870',opt,face('shulker'));Q(iso,e,0,0,.42+open,.8,.8,.34,'#8a5a8a',opt);},
 slime:function(iso,e,t,opt){var bz=Math.abs(Math.sin(t*3.2+e.y))*.3;var e2=Object.assign({},e,{z:(e.z||0)+bz});var ctx=iso.ctx;
   Q(iso,e2,0,0,.12,.38,.38,.38,'#3a8a2a',opt);ctx.globalAlpha=ctx.globalAlpha*.82;Q(iso,e2,0,0,0,.66,.66,.62,'#7ad65c',opt,face('slime'));ctx.globalAlpha=Math.min(1,ctx.globalAlpha/.82);},
 guardian:function(iso,e,t,opt){gObj(iso,e,t,opt,'#4aa098','#e88a3a',1);},
 'boss:elder':function(iso,e,t,opt){gObj(iso,e,t,opt,'#c8c4b8','#9a6ab0',1.05);var gp=iso.p(e.x,e.y,(e.scale||1)*1);glow(iso.ctx,gp[0],gp[1],iso.tw*(e.scale||1)*1.4,'rgba(170,120,255,A)',.2);},
 'boss:warden':function(iso,e,t,opt){var pulse=.5+Math.sin(t*3)*.5;var T=HT('warden','#0f3a44','#123f4a','#0f3038',{face:face('warden'),chest:pix(['tttttttt','tcttttct','tccttcct','ttcccctt','tccttcct','tcttttct','tttttttt','tttttttt'],{t:'#123f4a',c:'#3fd8e8'}),hair:'#0f3a44'});
   humanoid(iso,e,Object.assign({},T,{hat:function(z,o2){var hc={side:S('#1a5560'),top:S('#2a7580')};part(iso,e,0,-.32,z-.18,.14,.14,.34,hc,o2);part(iso,e,0,.32,z-.18,.14,.14,.34,hc,o2);}}),t);
   var gp=iso.p(e.x,e.y,(e.scale||1)*1.3);glow(iso.ctx,gp[0],gp[1],iso.tw*(e.scale||1)*1.5,'rgba(60,230,255,A)',.15+pulse*.15);},
 'boss:ravagerk':function(iso,e,t,opt){MOB2.ravager(iso,e,t,opt);var e2=Object.assign({},e,{scale:(e.scale||1)*.62,z:(e.z||0)+1.42*(e.scale||1)});humanoid(iso,e2,Object.assign(HT('illager','#9aa3a3','#5a1e1e','#2a2a30',{sleeve:true}),{weapon:'axe',wcol:'#ffd84a',hat:function(z,o2){CROWN(iso,e2,z,o2);}}),t);
   var gp=iso.p(e.x,e.y,(e.scale||1)*1.2);glow(iso.ctx,gp[0],gp[1],iso.tw*(e.scale||1)*1.2,'rgba(255,90,60,A)',.15);},
 'boss:evokerm':function(iso,e,t,opt){humanoid(iso,e,Object.assign(HT('illager','#9aa3a3','#24143a','#24143a',{sleeve:true,chest:pix(['kkkkkkkk','kyykkyyk','kkkkkkkk','kkkyykkk','kkkyykkk','kkkyykkk','kkkkkkkk','kyyyyyyk'],{k:'#24143a',y:'#ffd040'})}),{hat:function(z,o2){CROWN(iso,e,z,o2);}}),t);
   for(var i=0;i<2;i++){var ang=t*1.8+i*Math.PI;var v=Object.assign({},e,{x:e.x+Math.cos(ang)*1.1*(e.scale||1)*.6,y:e.y+Math.sin(ang)*1.1*(e.scale||1)*.6,scale:(e.scale||1)*.5,face:1});MOB2.vex(iso,v,t,opt);}
   var gp=iso.p(e.x,e.y,(e.scale||1)*1.2);glow(iso.ctx,gp[0],gp[1],iso.tw*(e.scale||1)*1.4,'rgba(255,220,120,A)',.16);},
 'boss:blazek':function(iso,e,t,opt,c){var bz=e.z||0;var e3=Object.assign({},e,{z:bz+.35+Math.sin(t*3+e.x)*.12});
   for(var r=0;r<12;r++){var ang=t*2.6+r*Math.PI/6,rad=r%2?.5:.36,hz=r%3===0?1.0:r%3===1?.6:.25;var rx=Math.cos(ang)*rad,ry=Math.sin(ang)*rad;iso.box(e3.x+rx-.06,e3.y+ry-.06,e3.z+hz,.12,.12,.45,{top:S('#ffb040'),side:S('#e0601a')},opt);}
   part(iso,e3,0,0,1.25,.55,.55,.55,{front:face('blaze'),back:S('#f6a43a'),side:S('#ea8a30'),top:S('#ffc860')},opt);CROWN(iso,e3,1.8,opt,.5);
   var gp2=iso.p(e3.x,e3.y,e3.z+1);glow(c,gp2[0],gp2[1],iso.tw*1.4*(e.scale||1),'rgba(255,120,40,A)',.3);}
};
function gObj(iso,e,t,opt,col,spike,sz){var e2=Object.assign({},e,{z:(e.z||0)+.25+Math.sin(t*2+e.x)*.1});var s2=.8*sz,SP={side:S(spike),top:S(shade(spike,1.15))};
  Q(iso,e2,-.55*sz,0,.25,.4*sz,.2,.2,shade(col,.85),opt);Q(iso,e2,-.85*sz,0,.28,.3*sz,.14,.14,spike,opt);
  Q(iso,e2,0,0,0,s2,s2,s2,col,opt,face('guardian',col));
  [[0,-s2/2-.06,.3],[0,s2/2+.06,.3],[-.25,-s2/2-.06,.55],[.25,s2/2+.06,.55],[0,0,s2+.0]].forEach(function(p,i){part(iso,e2,p[0],p[1],p[2]+(i===4?0:0),.1,.1,i===4?.18:.14,SP,opt);});}
var NC=null;function noiseCreeper(){if(NC)return NC;NC=noise('#4fbf3a',.4,7,function(i,j,r){return r()<.18?'#2f7f22':r()<.1?'#7fe060':null});return NC;}
var GB=null;function golemBody(){if(GB)return GB;GB=noise('#d6cfc0',.1,9,function(i,j,r){return (r()<.08)?'#5f9a3a':(j>10&&r()<.2)?'#b4ab9a':null});return GB;}


/* ---------- rooms: a dungeon room (floor, back walls with torches, platform edge) pre-rendered once per map/size ---------- */
function renderRoom(mapId,cols,rows,iso0,W,H,seed){
  var M=MAPS[mapId]||MAPS.plains,r=rng(seed||hash(mapId)),cv=mk(Math.round(W*iso0.dpr),Math.round(H*iso0.dpr)),c=cv.getContext('2d');
  c.setTransform(iso0.dpr,0,0,iso0.dpr,0,0);
  var iso=new Iso(c,{tw:iso0.tw,zh:iso0.zh,ox:iso0.ox,oy:iso0.oy});iso.dpr=iso0.dpr;
  /* backdrop */
  var g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,M.sky[0]);g.addColorStop(1,M.sky[1]);c.fillStyle=g;c.fillRect(0,0,W,H);
  if(M.void){for(var s=0;s<140;s++){c.fillStyle='rgba(230,210,255,'+(r()*.6+.1)+')';var sz=r()<.1?2:1;c.fillRect(r()*W,r()*H,sz,sz);}}
  var lava={},lights=[];
  if(M.lava){var lx=Math.floor(cols*.3),ly=Math.floor(rows*.28);for(var j=0;j<rows;j++)for(var i=0;i<cols;i++){var dx=(i-lx)/2.2,dy=(j-ly)/1.6;if(dx*dx+dy*dy<1&&i>1&&j>1&&i<cols-1&&j<rows-1)lava[i+','+j]=1;}}
  /* platform front edge (depth 2 blocks), drawn first */
  var sideT=tex(M.floor[0]==='grass'?'dirt':M.wall,3);
  for(var i2=cols-1;i2>=0;i2--)iso.box(i2,rows,-2,1,0.001,2,{top:sideT,fy:sideT,fx:sideT},{outline:'rgba(0,0,0,.25)'});
  for(var j2=rows-1;j2>=0;j2--)iso.box(cols,j2,-2,0.001,1,2,{top:sideT,fy:sideT,fx:sideT},{outline:'rgba(0,0,0,.25)'});
  /* floor */
  for(var j3=0;j3<rows;j3++)for(var i3=0;i3<cols;i3++){
    var k=i3+','+j3;
    if(lava[k]){iso.tile(i3,j3,-.12,tex('lava',1+((i3*7+j3*3)%4)));continue;}
    var n=M.floor[Math.floor(r()*M.floor.length)];
    if(n==='path'&&!(Math.abs(i3-j3)<2))n=M.floor[0];
    var dk=((i3+j3)%2)*.04+(r()*.06);
    iso.tile(i3,j3,0,tex(n,1+Math.floor(r()*6)),dk);
  }
  /* lava rim glow is dynamic; remember lava tiles */
  /* back walls: along y=-1 (top-right edge) and x=-1 (top-left edge) */
  var wt=tex(M.wall,2),wt2=tex(M.wall2,4),hgt=2;
  iso.box(-1,-1,0,1,1,hgt+1,{top:wt2,side:wt2});
  for(var i4=0;i4<cols;i4++){var tall=(i4%4===3)?hgt+1:hgt;var T=(i4%4===3)?wt2:tex(M.wall,1+(i4%5));iso.box(i4,-1,0,1,1,tall,{top:T,side:T});if(i4%4===1)lights.push({x:i4+.5,y:-.02,z:1.35,col:M.light});}
  for(var j4=0;j4<rows;j4++){var tall2=(j4%4===3)?hgt+1:hgt;var T2=(j4%4===3)?wt2:tex(M.wall,1+(j4%5));iso.box(-1,j4,0,1,1,tall2,{top:T2,side:T2});if(j4%4===1)lights.push({x:-.02,y:j4+.5,z:1.35,col:M.light});}
  /* torches on the walls (sticks + flame) */
  lights.forEach(function(L){var p=iso.p(L.x,L.y,L.z);c.fillStyle='#6a4a20';c.fillRect(p[0]-2,p[1]-2,4,12);c.fillStyle=M.light;c.fillRect(p[0]-3,p[1]-7,6,6);c.fillStyle='#fff6c0';c.fillRect(p[0]-1,p[1]-5,2,3);});
  /* a few decoration blocks at the room's edges (never in the fighting middle) */
  var deco=[[cols-1,0],[0,rows-1],[cols-2,0],[1,0],[0,1]];
  deco.forEach(function(d,ix){if(r()<.75){var dt=tex(M.deco[ix%M.deco.length],2+ix);iso.box(d[0]+.1,d[1]+.1,0,.8,.8,.8,{top:dt,side:dt});}});
  Object.keys(lava).forEach(function(k2){var p=k2.split(',');lights.push({x:+p[0]+.5,y:+p[1]+.5,z:.1,col:'#ff7a20',lava:1});});
  return {canvas:cv,lights:lights,lava:lava,map:M};
}
/* darkness + light holes + warm additive glow, drawn over the scene each frame */
var LC=null;
function lighting(ctx,iso,lights,W,H,t,amb,extra){
  if(!LC)LC=mk(1,1);var d=iso.dpr||1;if(LC.width!==Math.round(W*d)||LC.height!==Math.round(H*d)){LC.width=Math.round(W*d);LC.height=Math.round(H*d);}
  var l=LC.getContext('2d');l.setTransform(d,0,0,d,0,0);l.globalCompositeOperation='source-over';l.clearRect(0,0,W,H);
  l.fillStyle='rgba(6,4,14,'+amb+')';l.fillRect(0,0,W,H);
  l.globalCompositeOperation='destination-out';
  var all=lights.concat(extra||[]);
  all.forEach(function(L,i){var p=iso.p(L.x,L.y,L.z||0);var fl=L.lava?1:(.92+Math.sin(t*9+i*1.7)*.05+Math.sin(t*23+i)*.03);var R=(L.r||(L.lava?1.6:3.2))*iso.tw*fl;var g=l.createRadialGradient(p[0],p[1],0,p[0],p[1],R);g.addColorStop(0,'rgba(0,0,0,'+(L.ent?.5:L.lava?.55:.95)+')');g.addColorStop(1,'rgba(0,0,0,0)');l.fillStyle=g;l.fillRect(p[0]-R,p[1]-R,R*2,R*2);});
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(LC,0,0);ctx.restore();
  ctx.save();ctx.globalCompositeOperation='lighter';
  all.forEach(function(L,i){if(L.ent)return;var p=iso.p(L.x,L.y,L.z||0);var fl=.9+Math.sin(t*7+i*2.3)*.1;var R=(L.lava?1.1:1.5)*iso.tw*fl*(L.r?L.r/3:1);glow(ctx,p[0],p[1],R,rgba(L.col||'#ffb060','A'),L.lava?.22:.3);});
  ctx.restore();
  /* vignette */
  var v=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.55)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
}

/* ---------- the wide raid field (Kukoro Dungeon-raid space, Minecraft-Dungeons look) ----------
   A big open map that fills the whole stage: diamond voxel tiles under an angled camera, a chasm / river splitting our side (left)
   from the enemies' side (right) with a bridge in the middle where the 1v1 duels happen, and scenery props (trees, rocks, barrels,
   crates, pillars, lamps) kept out of the places where the party, the enemies and the duel stand.
   Field coordinates are normalised: nx 0 = left … 1 = right, ny 0 = back … 1 = front; FIELD.toScreen / toWorld convert. */
var FIELDMAP={
  plains:{floor:['grass'],path:'path',edge:'dirt',chasm:'water',bridge:'planks',amb:.16,light:'#ffd27a',props:['tree','tree','rock','barrel','crate','tree','bush','tnt','rock']},
  desert:{floor:['sand','sand','sand','sandstone'],path:'sandstone',edge:'sandstone',chasm:'void',bridge:'planks',amb:.14,light:'#ffd890',props:['cactus','cactus','rock','barrel','crate','pillar','deadbush']},
  nether:{floor:['netherrack','netherrack','netherrack','netherrack','netherrack','netherrack','netherrack','netherrack','netherrack','netherrack','netherrack','soul'],path:'netherrack',edge:'netherrack',chasm:'lava',bridge:'planks',amb:.28,light:'#ff8a3a',props:['glowstone','pillar','rock','barrel','wart','rock','pillar']},
  end:{floor:['endstone','endstone','endstone','endstone','endstone','endstone','endstone','endstone','endstone','purpur'],path:'purpur',edge:'endstone',chasm:'void',bridge:'purpur',amb:.28,light:'#c78aff',props:['obsidian','chorus','obsidian','rock','chorus']},
  cave:{floor:['stone','stone','stone','stone','stone','cobble','deepslate'],path:'cobble',edge:'deepslate',chasm:'lava',bridge:'planks',amb:.38,light:'#ffb35a',props:['ore','rock','barrel','crate','pillar','chest','ore']}
};
var FIELD={top:.17,span:.76};
FIELD.layout=function(iso,W,H){var tw=Math.max(12,Math.min(W/27,H/15));iso.set({tw:tw,zh:tw*.62,ox:W/2,oy:0});FIELD.W=W;FIELD.H=H;FIELD.iso=iso;return tw;};
FIELD.toScreen=function(nx,ny){return [nx*FIELD.W,FIELD.H*(FIELD.top+ny*FIELD.span)];};
FIELD.fromScreen=function(px,py){return [px/FIELD.W,(py/FIELD.H-FIELD.top)/FIELD.span];};
FIELD.toWorld=function(nx,ny){var s=FIELD.toScreen(nx,ny),iso=FIELD.iso;var a=(s[0]-iso.ox)/(iso.tw/2),b=(s[1]-iso.oy)/(iso.th/2);return [(a+b)/2,(b-a)/2];};
function chasmAt(nx,ny){var c=.5+Math.sin(ny*5.2+.6)*.022;return Math.abs(nx-c)<.042&&!(ny>.47&&ny<.75);}
function bridgeAt(nx,ny){var c=.5+Math.sin(ny*5.2+.6)*.022;return Math.abs(nx-c)<.05&&ny>.47&&ny<.75;}
function renderField(mapId,W,H,iso0,seed,keep){
  var FM=FIELDMAP[mapId]||FIELDMAP.plains,M=MAPS[mapId]||MAPS.plains,r=rng(seed||hash(mapId)),d=iso0.dpr||1,cv=mk(Math.round(W*d),Math.round(H*d)),c=cv.getContext('2d');
  c.setTransform(d,0,0,d,0,0);c.imageSmoothingEnabled=false;var iso=new Iso(c,{tw:iso0.tw,zh:iso0.zh,ox:iso0.ox,oy:iso0.oy});iso.dpr=d;
  var g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,M.sky[0]);g.addColorStop(1,M.sky[1]);c.fillStyle=g;c.fillRect(0,0,W,H);
  if(M.void||FM.chasm==='void'){for(var st=0;st<220;st++){c.fillStyle='rgba(230,210,255,'+(r()*.5+.1)+')';c.fillRect(r()*W,r()*H,r()<.1?2:1,r()<.1?2:1);}}
  var tw=iso.tw,lights=[],liquid=[];
  /* world bounds that cover the screen */
  var corners=[[0,0],[W,0],[0,H],[W,H]].map(function(p){var a=(p[0]-iso.ox)/(tw/2),b=(p[1]-iso.oy)/(iso.th/2);return [(a+b)/2,(b-a)/2];});
  var x0=Math.floor(Math.min.apply(null,corners.map(function(q){return q[0]})))-2,x1=Math.ceil(Math.max.apply(null,corners.map(function(q){return q[0]})))+2;
  var y0=Math.floor(Math.min.apply(null,corners.map(function(q){return q[1]})))-2,y1=Math.ceil(Math.max.apply(null,corners.map(function(q){return q[1]})))+3;
  var tiles=[];for(var x=x0;x<=x1;x++)for(var y=y0;y<=y1;y++){var p=iso.p(x+.5,y+.5,0);if(p[0]<-tw||p[0]>W+tw||p[1]<-tw||p[1]>H+tw*2)continue;var n=FIELD.fromScreen(p[0],p[1]);tiles.push({x:x,y:y,nx:n[0],ny:n[1],s:x+y});}
  tiles.sort(function(a,b){return a.s-b.s||a.x-b.x;});
  var edgeT=tex(FM.edge,3),liqT=FM.chasm==='void'?null:tex(FM.chasm,2);
  var hole={};tiles.forEach(function(t){if(chasmAt(t.nx,t.ny))hole[t.x+','+t.y]=1;});
  tiles.forEach(function(t){var k=t.x+','+t.y;
    if(hole[k]){if(liqT){iso.tile(t.x,t.y,-.55,tex(FM.chasm,1+((t.x*7+t.y*3)&3)),.05);if(r()<.18)liquid.push([t.x+.5,t.y+.5]);if(FM.chasm==='lava'&&r()<.07)lights.push({x:t.x+.5,y:t.y+.5,z:0,col:'#ff7a20',lava:1});}return;}
    var name;if(bridgeAt(t.nx,t.ny))name=FM.bridge;else if(Math.abs(t.ny-.6)<.06&&t.nx>.3&&t.nx<.7)name=r()<.8?FM.path:FM.floor[0];else name=FM.floor[Math.floor(r()*FM.floor.length)];
    if(name==='path'&&FM.path!=='path')name=FM.floor[0];
    var dk=((t.x+t.y)&1)*.035+r()*.05;
    /* a cliff face where the ground meets the chasm (the tile in front of it is a hole) */
    if(hole[(t.x+1)+','+t.y]||hole[t.x+','+(t.y+1)])iso.box(t.x,t.y,-1.6,1,1,1.6,{top:tex(name,1+Math.floor(r()*6)),side:edgeT},{outline:null,dark:dk});
    else iso.tile(t.x,t.y,0,tex(name,1+Math.floor(r()*6)),dk);
  });
  /* props: scattered in the free ground, never where people stand */
  var keepOut=(keep||[]).concat([[.425,.6,.09],[.575,.6,.09],[.5,.6,.07]]);
  function free(nx,ny,rad){if(chasmAt(nx,ny)||bridgeAt(nx,ny)||chasmAt(nx-.03,ny)||chasmAt(nx+.03,ny))return false;for(var i=0;i<keepOut.length;i++){var q=keepOut[i],dx=nx-q[0],dy=(ny-q[1])*.8;if(dx*dx+dy*dy<(q[2]+rad)*(q[2]+rad))return false;}return true;}
  var props=[],tries=0,want=Math.round(18+W*H/90000);
  while(props.length<want&&tries++<900){var nx=r()*1.04-.02,ny=r()*1.2-.22;var kind=FM.props[Math.floor(r()*FM.props.length)];var tall=/tree|pillar|obsidian|cactus|chorus/.test(kind);
    if(tall&&ny>.25&&ny<.95&&!(nx<.06||nx>.94))continue; /* tall things stay at the back / the far edges so they never hide a fighter */
    if(!free(nx,ny,tall?.06:.035))continue;var w=FIELD.toWorld(nx,ny);props.push({k:kind,x:Math.floor(w[0]),y:Math.floor(w[1]),nx:nx,ny:ny});keepOut.push([nx,ny,tall?.035:.02]);}
  /* lamps beside the party and the enemies (warm light pools like Dungeons) */
  [[.035,.42],[.035,.86],[.37,.3],[.63,.3],[.965,.42],[.965,.86],[.37,.9],[.63,.9]].forEach(function(q){var w=FIELD.toWorld(q[0],q[1]);props.push({k:'lamp',x:Math.floor(w[0]),y:Math.floor(w[1]),nx:q[0],ny:q[1]});});
  props.sort(function(a,b){return (a.x+a.y)-(b.x+b.y)});
  var O={outline:'rgba(10,8,20,.45)'};
  props.forEach(function(p){var x=p.x,y=p.y,k=p.k;
    if(k==='tree'){iso.box(x+.35,y+.35,0,.3,.3,1.6,{top:tex('log',2),side:tex('log',3)},O);iso.box(x-.45,y-.45,1.3,1.9,1.9,1.1,{top:tex('leaves',2),side:tex('leaves',3)},O);iso.box(x-.05,y-.05,2.4,1.1,1.1,.6,{top:tex('leaves',4),side:tex('leaves',5)},O);}
    else if(k==='rock'){var rt=tex(mapId==='nether'?'netherrack':mapId==='end'?'endstone':mapId==='desert'?'sandstone':'cobble',3);iso.box(x+.15,y+.2,0,.7,.6,.45,{top:rt,side:rt},O);if(r()<.5)iso.box(x+.5,y-.1,0,.4,.4,.3,{top:rt,side:rt},O);}
    else if(k==='barrel'){var bt=tex('planks',5);iso.box(x+.25,y+.25,0,.5,.5,.62,{top:tex('log',4),side:bt},O);}
    else if(k==='crate'){iso.box(x+.2,y+.2,0,.6,.6,.6,{top:tex('crate',2),side:tex('crate',3)},O);if(r()<.4)iso.box(x+.32,y+.32,.6,.38,.38,.38,{top:tex('crate',4),side:tex('crate',4)},O);}
    else if(k==='tnt'){iso.box(x+.25,y+.25,0,.5,.5,.5,{top:tex('planks',2),side:tex('tnt_side',2)},O);}
    else if(k==='bush'){iso.box(x+.2,y+.2,0,.6,.6,.45,{top:tex('leaves',6),side:tex('leaves',7)},O);}
    else if(k==='deadbush'){c.fillStyle='#8a6a3a';var q=iso.p(x+.5,y+.5,0);c.fillRect(q[0]-1,q[1]-tw*.35,2,tw*.35);c.fillRect(q[0]-tw*.15,q[1]-tw*.25,tw*.3,1.5);}
    else if(k==='cactus'){iso.box(x+.32,y+.32,0,.36,.36,1.5,{top:tex('cactus',2),side:tex('cactus',3)},O);iso.box(x+.68,y+.42,.6,.26,.18,.5,{top:tex('cactus',4),side:tex('cactus',4)},O);}
    else if(k==='pillar'){var pt=tex(M.wall,2);iso.box(x+.2,y+.2,0,.6,.6,1.8,{top:pt,side:pt},O);}
    else if(k==='glowstone'){iso.box(x+.2,y+.2,0,.6,.6,.6,{top:tex('glow',2),side:tex('glow',3)},O);lights.push({x:x+.5,y:y+.5,z:.6,col:'#ffd27a',r:2.2});}
    else if(k==='wart'){iso.box(x+.25,y+.25,0,.5,.5,.3,{top:solid('#8a1a1a'),side:solid('#6a1010')},O);}
    else if(k==='obsidian'){var h=1.6+r()*1.4;iso.box(x+.1,y+.1,0,.8,.8,h,{top:tex('obsidian',2),side:tex('obsidian',3)},O);lights.push({x:x+.5,y:y+.5,z:h+.2,col:'#c78aff',r:1.6});var q2=iso.p(x+.5,y+.5,h+.15);c.fillStyle='#f0c8ff';c.fillRect(q2[0]-2,q2[1]-2,4,4);}
    else if(k==='chorus'){var ct=solid('#8a5a9a');iso.box(x+.4,y+.4,0,.2,.2,1.1,{top:ct,side:ct},O);iso.box(x+.25,y+.25,1.1,.5,.5,.35,{top:solid('#d7b0e0'),side:solid('#b088c0')},O);}
    else if(k==='ore'){iso.box(x+.15,y+.15,0,.7,.7,.7,{top:tex('ore',2),side:tex('ore',3)},O);}
    else if(k==='chest'){iso.box(x+.2,y+.25,0,.6,.5,.5,{top:tex('chest',2),side:tex('chest',3)},O);}
    else if(k==='lamp'){iso.box(x+.42,y+.42,0,.16,.16,1.25,{top:tex('log',2),side:tex('log',3)},O);var q3=iso.p(x+.5,y+.5,1.4);c.fillStyle='#3a2a1a';c.fillRect(q3[0]-tw*.09,q3[1]-tw*.11,tw*.18,tw*.2);c.fillStyle=FM.light;c.fillRect(q3[0]-tw*.06,q3[1]-tw*.08,tw*.12,tw*.13);c.fillStyle='#fff6c0';c.fillRect(q3[0]-tw*.025,q3[1]-tw*.05,tw*.05,tw*.07);lights.push({x:x+.5,y:y+.5,z:1.4,col:FM.light,r:3.4});}
  });
  return {canvas:cv,lights:lights,liquid:liquid,map:M,fm:FM,amb:FM.amb,lava:{}};
}
api.renderField=renderField;api.FIELD=FIELD;api.FIELDMAP=FIELDMAP;
api.renderRoom=renderRoom;api.lighting=lighting;api.mk=mk;

api.OIso=OIso;api.tex=tex;api.solid=solid;api.pix=pix;api.face=face;api.Iso=Iso;api.drawEntity=drawEntity;api.MAPS=MAPS;api.BOSSES=BOSSES;api.MOBS=MOBS;api.MOBH=MOBH;api.glow=glow;api.rgba=rgba;
root.MC=api;
})(typeof window!=='undefined'?window:globalThis);
