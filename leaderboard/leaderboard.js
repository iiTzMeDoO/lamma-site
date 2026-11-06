/* leaderboard.js — «لوحة الصدارة»: Top Streamers / Top Viewers (top 50) from levels.js (Supabase when set, else this device) */
(function(){
'use strict';
var A=window.App,$=A.$,LV=window.LammaLevels;
A.strings({
 ar:{lv_title:'لوحة الصدارة',lv_sub:'المستويات من كل الألعاب: المشاهدون يكسبون نقاط خبرة باللعب والفوز، والستريمرز بتشغيل الجولات.',
  lv_streamers:'أفضل الستريمرز',lv_viewers:'أفضل المشاهدين',lv_empty:'لا أحد هنا بعد. شغّل جولة في أي لعبة وستظهر الأسماء.',
  lv_local:'على هذا الجهاز فقط',lv_local_why:'لوحة أونلاين تجمع كل الأجهزة تعمل بعد ربط Supabase (ملف الإعداد).',lv_online:'أونلاين · من كل الأجهزة',
  lv_online_empty:'اللوحة الأونلاين فارغة بعدُ، فهذه بيانات هذا الجهاز.',lv_loading:'جارٍ التحميل…',lv_xp:'نقطة خبرة',lv_rounds:'جولة',
  lv_me:'مستواك',lv_myprofile:'حسابي',lv_next:'للمستوى التالي',lv_rules_t:'كيف تُحسب النقاط؟',
  r_play:'المشاهد: +{a} لكل جولة يشارك فيها',r_win:'الفوز: +{a}، و+{b} لكل نقطة إضافية تعطيها اللعبة (حتى {c} في الجولة)',
  r_host:'الستريمر: +{a} لكل جولة تنتهي بلاعب واحد على الأقل، و+{b} لكل مشاهد شارك (حتى {c} مشاهدًا)',
  r_friends:'مع الأصحاب بلا بث: نقاط التشغيل تذهب إلى مستوى المضيف نفسه',r_curve:'المستوى n يحتاج 100 × (n−1)^1.5 نقطة: المستوى 2 = 100، 3 = 283، 5 = 800، 10 = 2700'},
 en:{lv_title:'Leaderboard',lv_sub:'Levels from every game: viewers earn XP by playing and winning, streamers by running rounds.',
  lv_streamers:'Top Streamers',lv_viewers:'Top Viewers',lv_empty:'Nobody here yet. Run a round in any game and names will show up.',
  lv_local:'On this device only',lv_local_why:'An online board across all devices works once Supabase is connected (setup file).',lv_online:'Online · all devices',
  lv_online_empty:'The online board is still empty, so this is this device\'s data.',lv_loading:'Loading…',lv_xp:'XP',lv_rounds:'rounds',
  lv_me:'Your level',lv_myprofile:'My profile',lv_next:'to next level',lv_rules_t:'How is XP counted?',
  r_play:'Viewer: +{a} for every round they take part in',r_win:'Winning: +{a}, plus +{b} for every extra point the game gives (up to {c} per round)',
  r_host:'Streamer: +{a} for every round that ends with at least one player, plus +{b} per viewer who played (up to {c} viewers)',
  r_friends:'With friends, no stream: hosting XP goes to the host\'s own level',r_curve:'Level n needs 100 × (n−1)^1.5 XP: level 2 = 100, 3 = 283, 5 = 800, 10 = 2700'}
});
var kind='streamer',last=null,avCache={};
try{avCache=JSON.parse(sessionStorage.getItem('lamma-av')||'{}')||{}}catch(e){}
function mk(tag,cls,kids){var e=document.createElement(tag);if(cls)e.className=cls;(kids||[]).forEach(function(k){if(k!=null)e.appendChild(typeof k==='string'?document.createTextNode(k):k)});return e}
function fmt(s,o){return String(s).replace(/\{(\w)\}/g,function(_,k){return o[k]!=null?o[k]:''})}
function num(n){try{return Number(n||0).toLocaleString(A.lang()==='en'?'en-US':'ar-SY-u-nu-latn')}catch(e){return String(n||0)}}
function initial(n){n=String(n||'?').trim();return (Array.from?Array.from(n)[0]:n.charAt(0))||'?'}
function avatar(r){
  var w=mk('span','lvp-av'),src=r.avatar||avCache[r.id]||'';
  if(src){var i=document.createElement('img');i.src=src;i.alt='';i.width=40;i.height=40;i.loading='lazy';i.referrerPolicy='no-referrer';i.addEventListener('error',function(){if(i.parentNode)i.parentNode.removeChild(i);w.textContent=initial(r.display)});w.appendChild(i)}
  else w.textContent=initial(r.display);
  return w;
}
function bar(xp){var p=LV.progress(xp),b=mk('span','lvp-bar');var i=mk('i');i.style.width=Math.round(p.pct*100)+'%';b.appendChild(i);b.setAttribute('role','img');b.setAttribute('aria-label',num(xp-p.from)+' / '+num(p.to-p.from)+' '+A.t('lv_next'));return b}
function row(r,i){
  var lv=r.level||LV.levelFor(r.xp);
  var nm=mk('span','lvp-nm',[mk('bdi','',[r.display||r.id])]);
  var meta=mk('span','lvp-meta',[num(r.xp)+' '+A.t('lv_xp')]);
  if(kind==='streamer'&&r.rounds)meta.appendChild(document.createTextNode(' · '+num(r.rounds)+' '+A.t('lv_rounds')));
  /* «حسابي»: every row opens that person's profile and wears their equipped frame + name colour */
  var av=avatar(r),P=window.LammaProfile,d=P?P.deco(r.id):{};
  if(P){P.applyFrame(av,d.frame);P.applyColor(nm,d.name_color);if(d.avatar&&P.imgOk(d.avatar)){var im=av.querySelector('img');if(!im){A.clear(av);im=document.createElement('img');im.alt='';im.width=40;im.height=40;av.appendChild(im)}im.src=d.avatar}}
  var a=mk('a','lvp-link',[mk('span','lvp-rk',[String(i+1)]),av,mk('span','lvp-who',[mk('span','lvp-line',[nm,LV.badge(lv)]),bar(r.xp),meta])]);
  a.href=P?P.url(r.id):'/profile/?id='+encodeURIComponent(r.id);
  return mk('li','lvp-row',[a]);
}
/* public Twitch avatars for rows that have none (one request for the whole page, cached for this tab) */
function fetchAvatars(rows){
  var need=rows.filter(function(r){return !r.avatar&&!avCache[r.id]&&/^twitch:[a-z0-9_]{2,25}$/.test(r.id)}).slice(0,50);
  if(!need.length||!window.fetch)return;
  var q='query{'+need.map(function(r,i){return 'u'+i+':user(login:"'+r.id.slice(7)+'"){profileImageURL(width:70)}'}).join(' ')+'}';
  fetch('https://gql.twitch.tv/gql',{method:'POST',headers:{'Client-ID':'kimne78kx3ncx6brgo4mv6wki5h1ko','Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({query:q})})
    .then(function(r){return r.json()}).then(function(j){var d=j&&j.data;if(!d)return;var got=0;need.forEach(function(r,i){var u=d['u'+i];if(u&&u.profileImageURL&&/^https:\/\//.test(u.profileImageURL)){avCache[r.id]=u.profileImageURL;got++}});
      try{sessionStorage.setItem('lamma-av',JSON.stringify(avCache))}catch(e){}if(got)draw();}).catch(function(){});
}
function draw(){
  var ol=$('lvList');A.clear(ol);var src=$('lvSrc');A.clear(src);
  if(!last){src.textContent=A.t('lv_loading');return}
  var rows=last.rows||[];
  if(last.source==='local'){src.className='lvp-src local';src.appendChild(mk('b','',[A.t('lv_local')]));src.appendChild(document.createTextNode(' · '+(LV.online?A.t('lv_online_empty'):A.t('lv_local_why'))))}
  else{src.className='lvp-src online';src.appendChild(mk('b','',[A.t('lv_online')]))}
  rows.forEach(function(r,i){ol.appendChild(row(r,i))});
  $('lvEmpty').hidden=rows.length>0;
}
function load(){
  last=null;draw();var k=kind;
  LV.top(k,50).then(function(res){if(k!==kind)return;last=res;draw();fetchAvatars(res.rows||[])});
}
function setKind(k){kind=k;['tabS','tabV'].forEach(function(id){var b=$(id),on=b.getAttribute('data-kind')===k;b.classList.toggle('on',on);b.setAttribute('aria-selected',on?'true':'false');if(on)$('lvList').setAttribute('aria-labelledby',id)});load()}
function me(){
  var box=$('lvMe'),m=LV.mine(),s=window.LammaAuth&&LammaAuth.session();A.clear(box);
  if(!s){box.hidden=true;return}
  var xp=m?m.xp:0,p=LV.progress(xp);box.hidden=false;
  var P=window.LammaProfile,pd=P?P.deco(P.myId()):{},mav=avatar({id:'me',display:s.display||s.login,avatar:pd.avatar||s.avatar});if(P)P.applyFrame(mav,pd.frame);
  box.appendChild(mav);
  box.appendChild(mk('div','lvp-who',[mk('span','lvp-line',[mk('small','muted',[A.t('lv_me')]),mk('span','lvp-nm',[mk('bdi','',[s.display||s.login])]),LV.badge(p.level)]),bar(xp),mk('span','lvp-meta',[num(xp)+' '+A.t('lv_xp')+' · '+num(Math.max(0,p.to-xp))+' '+A.t('lv_next')])]));
  var go=mk('a','btn btn-ghost btn-sm lvp-mine',[A.t('lv_myprofile')]);go.href='/profile/';box.appendChild(go);
}
function rules(){
  var X=LV.XP,ul=$('lvRules');A.clear(ul);
  [fmt(A.t('r_play'),{a:X.viewer.play}),fmt(A.t('r_win'),{a:X.viewer.win,b:X.viewer.perPoint,c:X.viewer.maxWinPerRound}),
   fmt(A.t('r_host'),{a:X.streamer.round,b:X.streamer.perPlayer,c:X.streamer.maxPlayers}),A.t('r_friends'),A.t('r_curve')].forEach(function(t){ul.appendChild(mk('li','',[t]))});
}
$('tabS').addEventListener('click',function(){setKind('streamer')});
$('tabV').addEventListener('click',function(){setKind('player')});
$('lvList').parentNode.parentNode.querySelector('.lvp-tabs').addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){var n=kind==='streamer'?'player':'streamer';setKind(n);$(n==='streamer'?'tabS':'tabV').focus();e.preventDefault()}});
if(/[?&]tab=viewers/.test(location.search))kind='player';
A.onLang(function(){draw();me();rules()});
LV.onChange(function(){if(last&&last.source==='local')load();me()});
if(window.LammaProfile)LammaProfile.onChange(function(){draw();me()});
A.boot();
setKind(kind);
})();
