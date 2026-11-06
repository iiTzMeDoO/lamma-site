/* profile.js — «حسابي / My profile» for لَمّة | Lamma (Steam-style profile).
   /profile/            → your own profile (the signed-in session; signed out → the sign-in chooser)
   /profile/?id=twitch:<login>  (or provider:id) → anyone's profile, read-only. Viewers who only played through Twitch chat
   have one too, built from their stats. Data: LammaLevels (XP, per-game counters) + LammaProfile (banner, picture, bio,
   frames, name colours, fighter skins) — this device, or Supabase once it is set in auth-config.js. */
(function(){
'use strict';
var A=window.App,$=A.$,LV=window.LammaLevels,P=window.LammaProfile;
A.strings({
 ar:{pf_back:'لوحة الصدارة',pf_loading:'جارٍ التحميل…',pf_title:'ملفك الشخصي',pf_in_sub:'سجّل الدخول لترى إحصائياتك كاملة، وتختار بانرك وصورتك، وتلبس السكنات التي فزت بها.',
  pf_in:'تسجيل الدخول',pf_in_or:'أو افتح ملف أي لاعب من',pf_board:'لوحة الصدارة',pf_edit:'تعديل الملف الشخصي',pf_since:'عضو منذ',pf_fav:'لعبته المفضلة',pf_fav_me:'لعبتي المفضلة',
  pf_local:'على هذا الجهاز فقط',pf_online:'أونلاين',pf_nobio:'لا توجد نبذة بعد.',pf_xp:'نقطة خبرة',pf_next:'للمستوى',pf_max:'',
  pf_none_yet:'لم يلعب هذا اللاعب أي جولة مسجّلة بعد. الإحصائيات تظهر هنا بعد أول جولة.',pf_none_me:'لم تلعب أي جولة مسجّلة بعد. العب أو شغّل جولة في أي لعبة وستمتلئ هذه الصفحة.',
  pf_local_why:'هذه الأرقام من هذا الجهاز. بعد ربط Supabase تُجمع من كل الأجهزة.',
  pf_stats:'الإحصائيات',st_rounds:'الجولات',st_wins:'الانتصارات',st_rate:'نسبة الفوز',st_xp:'نقاط الخبرة',st_level:'المستوى',st_top:'أكثر لعبة',st_streak:'سلسلة الفوز الحالية',st_best:'أفضل سلسلة',
  st_host:'كمضيف / ستريمر',st_hosted:'جولات شغّلها',st_hplayers:'لاعبون استضافهم',st_hxp:'نقاط الاستضافة',st_none:'—',
  pf_games:'كل الألعاب',g_played:'لعب',g_won:'فاز',g_xp:'خبرة',g_hosted:'شغّل',g_fav:'المفضلة',
  pf_skins:'السكنات',t_frame:'الإطارات',t_color:'لون الاسم',t_banner:'البانرات',t_skin:'سكن المقاتل',
  sk_equip:'ارتداء',sk_on:'مُرتدى ✓',sk_open:'مفتوح',sk_lock_lv:'يُفتح عند المستوى {n}',sk_lock_w:'يُفتح بعد {n} فوز',sk_prog:'{a} / {b}',sk_free:'مجاني',
  sk_mc_ph:'اسم ماينكرافت',sk_mc_bad:'اكتب اسم ماينكرافت صحيحًا (3–16 حرفًا إنجليزيًا أو أرقام أو _).',
  sk_note:'سكن المقاتل يظهر لك في «معركة الساحة» عندما تلعب من شات تويتش (إن لم تختر سكنًا بالأمر !سكن).',sk_note_off:'سكن المقاتل يظهر في «معركة الساحة» للاعبي تويتش.',
  ed_title:'تعديل الملف الشخصي',ed_banner:'البانر',ed_upload:'ارفع صورة',ed_url:'أو رابط صورة (https)',ed_use:'استخدم',ed_avatar:'الصورة',ed_av_reset:'صورة الحساب الأصلية',
  ed_bio:'نبذة قصيرة',ed_bio_ph:'عرّف بنفسك في سطر أو سطرين…',ed_fav:'اللعبة المفضلة',ed_fav_none:'بلا',ed_save:'حفظ',ed_cancel:'إلغاء',ed_close:'إغلاق',
  ed_img_bad:'تعذّر قراءة الصورة. جرّب صورة JPG أو PNG.',ed_url_bad:'الرابط يجب أن يبدأ بـ https:// ويكون رابط صورة.',ed_big:'الصورة كبيرة جدًا حتى بعد الضغط.',
  ed_saved:'حُفظ ✓',ed_saved_local:'حُفظ على هذا الجهاز ✓',ed_quota:'لا توجد مساحة كافية في المتصفح لحفظ الصور.',ed_working:'جارٍ تجهيز الصورة…',
  pv_twitch:'تويتش',pv_discord:'ديسكورد',pv_google:'جوجل',pv_guest:'ضيف',pf_viewer:'لاعب من الشات'},
 en:{pf_back:'Leaderboard',pf_loading:'Loading…',pf_title:'Your profile',pf_in_sub:'Sign in to see your full stats, pick your banner and picture, and wear the skins you have won.',
  pf_in:'Sign in',pf_in_or:'Or open any player\'s profile from the',pf_board:'leaderboard',pf_edit:'Edit profile',pf_since:'Member since',pf_fav:'Favourite game',pf_fav_me:'My favourite game',
  pf_local:'On this device only',pf_online:'Online',pf_nobio:'No bio yet.',pf_xp:'XP',pf_next:'to level',pf_max:'',
  pf_none_yet:'This player has no recorded rounds yet. Stats show up here after the first one.',pf_none_me:'You have no recorded rounds yet. Play or run a round in any game and this page fills up.',
  pf_local_why:'These numbers are from this device. Once Supabase is connected they come from every device.',
  pf_stats:'Stats',st_rounds:'Rounds',st_wins:'Wins',st_rate:'Win rate',st_xp:'XP',st_level:'Level',st_top:'Most played',st_streak:'Current win streak',st_best:'Best streak',
  st_host:'As host / streamer',st_hosted:'Rounds hosted',st_hplayers:'Players hosted',st_hxp:'Hosting XP',st_none:'—',
  pf_games:'Every game',g_played:'played',g_won:'won',g_xp:'XP',g_hosted:'hosted',g_fav:'Favourite',
  pf_skins:'Skins',t_frame:'Frames',t_color:'Name colour',t_banner:'Banners',t_skin:'Fighter skin',
  sk_equip:'Equip',sk_on:'Equipped ✓',sk_open:'Unlocked',sk_lock_lv:'Unlocks at level {n}',sk_lock_w:'Unlocks after {n} wins',sk_prog:'{a} / {b}',sk_free:'Free',
  sk_mc_ph:'Your Minecraft name',sk_mc_bad:'Type a valid Minecraft name (3–16 letters, digits or _).',
  sk_note:'Your fighter skin shows in «Arena Battle» when you play from Twitch chat (unless you pick one with !skin).',sk_note_off:'The fighter skin shows in «Arena Battle» for Twitch players.',
  ed_title:'Edit profile',ed_banner:'Banner',ed_upload:'Upload an image',ed_url:'or an image link (https)',ed_use:'Use',ed_avatar:'Picture',ed_av_reset:'Account picture',
  ed_bio:'Short bio',ed_bio_ph:'Say something about yourself…',ed_fav:'Favourite game',ed_fav_none:'None',ed_save:'Save',ed_cancel:'Cancel',ed_close:'Close',
  ed_img_bad:'Could not read that image. Try a JPG or PNG.',ed_url_bad:'The link must start with https:// and point to an image.',ed_big:'The image is too big even after compressing.',
  ed_saved:'Saved ✓',ed_saved_local:'Saved on this device ✓',ed_quota:'Not enough browser storage to save the images.',ed_working:'Preparing the image…',
  pv_twitch:'Twitch',pv_discord:'Discord',pv_google:'Google',pv_guest:'Guest',pf_viewer:'Chat player'}
});
var root=$('pfRoot'),Q=new URLSearchParams(location.search),qid=normId(Q.get('id')),cur=null,tab='frame',avCache={};
try{avCache=JSON.parse(sessionStorage.getItem('lamma-av')||'{}')||{}}catch(e){}
function normId(v){v=String(v||'').trim();if(!v)return '';if(v.indexOf(':')<0)v='twitch:'+v;var p=v.split(':'),pv=p[0].toLowerCase(),rest=p.slice(1).join(':');
  if(pv==='twitch')rest=rest.toLowerCase().replace(/^@/,'');var id=pv+':'+rest;return /^(twitch|discord|google|guest):[^\s:<>"']{1,64}$/.test(id)?id:''}
function sess(){return window.LammaAuth&&LammaAuth.session?LammaAuth.session():null}
function T(k){return A.t(k)}
function fmt(s,o){return String(s).replace(/\{(\w)\}/g,function(_,k){return o[k]!=null?o[k]:''})}
function num(n){try{return Number(n||0).toLocaleString(A.lang()==='en'?'en-US':'ar-SY-u-nu-latn')}catch(e){return String(n||0)}}
function mk(tag,cls,kids){var e=document.createElement(tag);if(cls)e.className=cls;(kids||[]).forEach(function(k){if(k!=null)e.appendChild(typeof k==='string'?document.createTextNode(k):k)});return e}
function bdi(t){var b=document.createElement('bdi');b.textContent=t;return b}
function nm(o){return A.lang()==='en'?o.en:o.ar}
function initial(n){n=String(n||'?').trim();return (Array.from?Array.from(n)[0]:n.charAt(0))||'?'}
function svg(paths,sw){var NS='http://www.w3.org/2000/svg',v=document.createElementNS(NS,'svg');v.setAttribute('viewBox','0 0 24 24');v.setAttribute('fill','none');v.setAttribute('stroke','currentColor');v.setAttribute('stroke-width',sw||'1.9');v.setAttribute('stroke-linecap','round');v.setAttribute('stroke-linejoin','round');v.setAttribute('aria-hidden','true');
  paths.forEach(function(d){var p=document.createElementNS(NS,'path');p.setAttribute('d',d);v.appendChild(p)});return v}
function lockIco(){return svg(['M7 11V8a5 5 0 0 1 10 0v3','M5.5 11h13v9h-13z'])}
function penIco(){return svg(['M4 20h4L19 9l-4-4L4 16z','M13.5 6.5l4 4'])}
function userIco(){return svg(['M12 12.5a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4z','M4.5 20.2c1.2-3.6 4.1-5.4 7.5-5.4s6.3 1.8 7.5 5.4'])}
function pvIco(p){var D={twitch:['M5 3h15v10l-4.5 4.5H12L9 20.5V17.5H5z','M11 7.5v4M15.5 7.5v4'],discord:['M7.5 7.5c3-1.4 6-1.4 9 0','M7.5 16.5c3 1.4 6 1.4 9 0','M6 7.8C4.5 10.3 4 13 4.3 15.8 6 17.2 7.4 17.9 8.6 18.2l1-1.7','M18 7.8c1.5 2.5 2 5.2 1.7 8-1.7 1.4-3.1 2.1-4.3 2.4l-1-1.7','M9.6 12.6h.01M14.4 12.6h.01'],
  google:['M20 12.2c0 4.6-3.2 7.8-8 7.8a8 8 0 1 1 5.4-13.9','M12.3 12h7.7'],guest:['M12 12.5a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4z','M4.5 20.2c1.2-3.6 4.1-5.4 7.5-5.4s6.3 1.8 7.5 5.4']};return svg(D[p]||D.guest)}
function toast(t){var o=document.querySelector('.pf-toast');if(o)o.remove();var d=mk('div','pf-toast',[t]);d.setAttribute('role','status');document.body.appendChild(d);setTimeout(function(){d.remove()},2600)}
function bannerStyle(el,v){
  el.className=el.className.replace(/\s*pf-bn-[a-z]+/g,'');el.style.backgroundImage='';
  v=String(v||'');if(!v)v='b:night';
  if(P.isBuiltinBanner(v))el.className+=' pf-bn-'+v.slice(2);
  else if(P.imgOk(v))el.style.backgroundImage='url("'+v.replace(/["\\]/g,'')+'")';
  else el.className+=' pf-bn-night';
}
function avatarBox(cls,src,name,frame){
  var w=mk('span',cls);if(src){var i=document.createElement('img');i.src=src;i.alt='';i.referrerPolicy='no-referrer';i.addEventListener('error',function(){if(i.parentNode)i.parentNode.removeChild(i);w.textContent=initial(name)});w.appendChild(i)}else w.textContent=initial(name);
  P.applyFrame(w,frame);return w;
}
/* public Twitch picture for a chat player with none on file */
function twitchAvatar(id,cb){
  if(avCache[id])return cb(avCache[id]);if(!/^twitch:[a-z0-9_]{2,25}$/.test(id)||!window.fetch)return;
  fetch('https://gql.twitch.tv/gql',{method:'POST',headers:{'Client-ID':'kimne78kx3ncx6brgo4mv6wki5h1ko','Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({query:'query{user(login:"'+id.slice(7)+'"){profileImageURL(width:300) displayName}}'})})
    .then(function(r){return r.json()}).then(function(j){var u=j&&j.data&&j.data.user;if(u&&u.profileImageURL&&/^https:\/\//.test(u.profileImageURL)){avCache[id]=u.profileImageURL;try{sessionStorage.setItem('lamma-av',JSON.stringify(avCache))}catch(e){}cb(u.profileImageURL)}}).catch(function(){});
}

/* ---------- the numbers ---------- */
function summary(v){
  var pl=v.player||{},games=pl.games||{},hg=(v.host&&v.host.games)||{};
  var played=0,wins=0,xpG=0,top=null;
  Object.keys(games).forEach(function(g){var s=games[g];played+=s.p|0;wins+=s.w|0;xpG+=s.x|0;if(!top||(s.p|0)>(games[top].p|0))top=g});
  played=Math.max(played,pl.played|0);wins=Math.max(wins,pl.wins|0);
  var hosted=(v.host&&v.host.hosted)|0,hp=(v.host&&v.host.players)|0,hx=0,htop=null;
  Object.keys(hg).forEach(function(g){hx+=hg[g].x|0;if(!htop||(hg[g].p|0)>(hg[htop].p|0))htop=g});
  var rec=[v.player,v.streamer].filter(Boolean).sort(function(a,b){return (b.xp|0)-(a.xp|0)})[0]||{xp:0};
  var xpAll=(v.player?v.player.xp|0:0)+(v.streamer?v.streamer.xp|0:0);
  return {played:played,wins:wins,rate:played?Math.round(wins*100/played):null,xp:xpAll,best:rec,prog:LV.progress(rec.xp|0),top:top||htop,streak:pl.streak|0,bestStreak:pl.best|0,
    hosted:hosted,hostPlayers:hp,hostXp:v.streamer?v.streamer.xp|0:hx,games:games,hgames:hg,level:v.level||1,winsAll:v.wins|0};
}
function gameOf(k){var l=P.GAMES;for(var i=0;i<l.length;i++)if(l[i].k===k)return l[i];return null}

/* ---------- page ---------- */
function load(){
  var s=sess(),id=qid||P.myId();
  A.clear(root);
  if(!id){signedOut();return}
  root.appendChild(mk('p','muted',[T('pf_loading')]));
  P.load(id).then(function(x){cur=x;draw()},function(){cur={id:id,profile:{},view:P.localView(id),source:'local'};draw()});
}
function signedOut(){
  var b=mk('button','btn pf-primary',[T('pf_in')]);b.type='button';b.addEventListener('click',function(){if(window.LammaAuth&&LammaAuth.open)LammaAuth.open()});
  var lk=mk('a','',[T('pf_board')]);lk.href='/leaderboard/';
  var c=mk('section','pf-card pf-signin',[mk('span','pf-avatar',[userIco()]),mk('h1','',[T('pf_title')]),mk('p','',[T('pf_in_sub')]),b,mk('p','small',[T('pf_in_or')+' ',lk,'.'])]);
  c.querySelector('h1').className='pf-signin-t';root.appendChild(c);
  if(window.LammaAuth&&LammaAuth.open)setTimeout(function(){if(!sess()&&!document.getElementById('authChooser'))LammaAuth.open()},150);
}
function isOwn(){return !!cur&&cur.id===P.myId()}
function draw(){
  if(!cur)return;A.clear(root);
  var s=sess(),own=isOwn(),p=cur.profile||{},v=cur.view||{},S=summary(v),pv=cur.id.split(':')[0];
  var rec=v.player||v.streamer||{};
  var name=(own&&s&&(s.display||s.login))||p.display||(v.player&&v.player.display)||(v.streamer&&v.streamer.display)||cur.id.slice(cur.id.indexOf(':')+1);
  var pic=(P.imgOk(p.avatar)&&p.avatar)||(own&&s&&s.avatar)||(v.player&&v.player.avatar)||(v.streamer&&v.streamer.avatar)||avCache[cur.id]||'';
  document.title=name+' — '+(A.lang()==='en'?'Lamma':'لَمّة');
  /* hero */
  var hero=mk('section','pf-card pf-hero');
  var bn=mk('div','pf-banner');bannerStyle(bn,p.banner);hero.appendChild(bn);
  if(own){var eb=mk('button','pf-edit-btn',[penIco(),mk('span','',[T('pf_edit')])]);eb.type='button';eb.id='pfEdit';eb.addEventListener('click',openEdit);bn.appendChild(eb)}
  var av=avatarBox('pf-avatar',pic,name,p.frame);av.id='pfAvatar';
  if(!pic&&pv==='twitch')twitchAvatar(cur.id,function(u){if(!document.body.contains(av)||av.querySelector('img'))return;A.clear(av);var i=document.createElement('img');i.src=u;i.alt='';av.appendChild(i)});
  var h1=mk('h1','',[bdi(name)]);P.applyColor(h1,p.name_color);
  var pvl=mk('span','pf-pv',[pvIco(pv),T('pv_'+pv)]);if(!own&&pv==='twitch'&&!p.updated_at&&!(v.streamer))pvl.lastChild.textContent=T('pv_twitch')+' · '+T('pf_viewer');
  var badge=LV.badge(S.prog.level);
  var line=mk('div','pf-name',[h1,badge,pvl]);
  var bar=mk('span','lvp-bar');var bi=mk('i');bi.style.width=Math.round(S.prog.pct*100)+'%';bar.appendChild(bi);
  var xpl=mk('div','pf-xp',[bar,mk('small','',[num(S.prog.xp)+' '+T('pf_xp')+' · '+num(Math.max(0,S.prog.to-S.prog.xp))+' '+T('pf_next')+' '+(S.prog.level+1)])]);
  var bio=mk('p','pf-bio'+(p.bio?'':' empty'),[p.bio?p.bio:T('pf_nobio')]);bio.setAttribute('dir','auto');
  var meta=mk('div','pf-meta');
  var since=p.since||v.since||'';if(since){var d=new Date(since);if(!isNaN(d))meta.appendChild(mk('span','',[T('pf_since')+' ',mk('b','',[d.toLocaleDateString(A.lang()==='en'?'en-GB':'ar-SY-u-nu-latn',{month:'long',year:'numeric'})])]))}
  var fg=gameOf(p.fav_game);if(fg){var fa=mk('a','',[fg.ic+' '+nm(fg)]);fa.href=fg.href;meta.appendChild(mk('span','',[T(own?'pf_fav_me':'pf_fav')+': ',fa]))}
  meta.appendChild(mk('span',cur.source==='supabase'?'pf-src online':'pf-src',[cur.source==='supabase'?T('pf_online'):T('pf_local')]));
  hero.appendChild(mk('div','pf-id',[av,mk('div','pf-idtx',[line,xpl,bio,meta])]));
  if(!S.played&&!S.hosted)hero.appendChild(mk('p','pf-note',[own?T('pf_none_me'):T('pf_none_yet')]));
  else if(cur.source!=='supabase')hero.appendChild(mk('p','pf-note',[T('pf_local_why')]));
  root.appendChild(hero);
  /* stats */
  var st=mk('section','pf-sec',[mk('div','pf-sec-h',[mk('h2','',[T('pf_stats')])])]);
  var tg=gameOf(S.top);
  var tiles=[[num(S.played),T('st_rounds')],[num(S.wins),T('st_wins')],[S.rate==null?T('st_none'):num(S.rate)+'%',T('st_rate')],[num(S.xp),T('st_xp'),1],
    ['Lv'+S.prog.level,T('st_level'),1],[tg?tg.ic+' '+nm(tg):T('st_none'),T('st_top'),0,1],[num(S.streak),T('st_streak')],[num(S.bestStreak),T('st_best')]];
  var grid=mk('div','pf-stats');tiles.forEach(function(t){var b=mk('b','',[t[0]]);if(/^Lv/.test(t[0]))b.setAttribute('dir','ltr');grid.appendChild(mk('div','pf-stat'+(t[2]?' hl':'')+(t[3]?' txt':''),[b,mk('span','',[t[1]])]))});st.appendChild(grid);
  if(S.hosted){st.appendChild(mk('p','pf-sub-t',[T('st_host')]));var g2=mk('div','pf-stats');
    [[num(S.hosted),T('st_hosted')],[num(S.hostPlayers),T('st_hplayers')],[num(S.hostXp),T('st_hxp')]].forEach(function(t){g2.appendChild(mk('div','pf-stat',[mk('b','',[t[0]]),mk('span','',[t[1]])]))});st.appendChild(g2)}
  root.appendChild(st);
  /* per game */
  var gs=mk('section','pf-sec',[mk('div','pf-sec-h',[mk('h2','',[T('pf_games')])])]);
  var ul=mk('ul','pf-card pf-games'),maxP=1;
  P.GAMES.forEach(function(g){var s=S.games[g.k],h=S.hgames[g.k];maxP=Math.max(maxP,s?s.p|0:0,h?h.p|0:0)});
  P.GAMES.slice().sort(function(a,b){function w(g){var s=S.games[g.k],h=S.hgames[g.k];return (s?s.p|0:0)+(h?h.p|0:0)}return w(b)-w(a)}).forEach(function(g){
    var s=S.games[g.k]||{p:0,w:0,x:0},h=S.hgames[g.k];
    var a=mk('a','',[nm(g)]);a.href=g.href;if(p.fav_game===g.k)a.appendChild(mk('span','pf-fav',[T('g_fav')]));
    var nums=mk('span','pf-gnum',[mk('span','',[T('g_played')+' ',mk('i','',[num(s.p)])]),mk('span','',[T('g_won')+' ',mk('i','',[num(s.w)])]),mk('span','',[T('g_xp')+' ',mk('i','',[num(s.x)])])]);
    if(h&&h.p)nums.appendChild(mk('span','',[T('g_hosted')+' ',mk('i','',[num(h.p)])]));
    var gb=mk('span','pf-gbar');var gi=mk('i');gi.style.width=Math.round(((s.p|0)+(h?h.p|0:0))*100/Math.max(1,maxP))+'%';gb.appendChild(gi);
    ul.appendChild(mk('li','pf-game'+((s.p||(h&&h.p))?'':' zero'),[mk('span','pf-gic',[g.ic]),mk('span','pf-gtx',[a,nums,gb])]));
  });
  gs.appendChild(ul);root.appendChild(gs);
  /* skins */
  root.appendChild(skins(S,p,own,name,pic));
}
function reqText(st,it){var r=it.req||{};if(r.lv&&r.lv>1)return fmt(T('sk_lock_lv'),{n:r.lv});if(r.wins)return fmt(T('sk_lock_w'),{n:r.wins});return T('sk_free')}
function skins(S,p,own,name,pic){
  var lv=S.prog.level>S.level?S.prog.level:S.level,wins=Math.max(S.wins,S.winsAll);
  var sec=mk('section','pf-sec',[mk('div','pf-sec-h',[mk('h2','',[T('pf_skins')])])]);sec.id='pfSkins';
  var tabs=mk('div','pf-tabs');tabs.setAttribute('role','tablist');
  [['frame','t_frame'],['color','t_color'],['banner','t_banner'],['skin','t_skin']].forEach(function(t){
    var list=P.COS[t[0]],open=list.filter(function(it){return P.unlockState(it,lv,wins).ok}).length;
    var b=mk('button','pf-tab'+(tab===t[0]?' on':''),[T(t[1]),mk('small','',[open+'/'+list.length])]);b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',String(tab===t[0]));b.setAttribute('data-tab',t[0]);
    b.addEventListener('click',function(){tab=t[0];var y=window.scrollY;draw();window.scrollTo(0,y);var nb=document.querySelector('.pf-tab[data-tab='+t[0]+']');if(nb)nb.focus()});tabs.appendChild(b)});
  sec.appendChild(tabs);
  var grid=mk('div','pf-items');grid.setAttribute('role','tabpanel');
  var field={frame:'frame',color:'name_color',banner:'banner',skin:'skin'}[tab];
  P.COS[tab].forEach(function(it){
    var u=P.unlockState(it,lv,wins),val=tab==='banner'?'b:'+it.k:it.k,curV=p[field]||'';
    var on=tab==='banner'?(curV===val||(!curV&&it.k==='night')):tab==='skin'?(P.skinKey(curV)===it.k||(!curV&&it.k==='steve')):(curV===it.k||(!curV&&(it.k==='none'||it.k==='default')));
    var prev=mk('div','pf-prev');
    if(tab==='frame')prev.appendChild(avatarBox('pf-mini-av',pic,name,it.k));
    else if(tab==='color'){var n=mk('span','pf-mini-nm',[bdi(name)]);P.applyColor(n,it.k);if(it.k==='default')n.style.color='#eceefa';prev.appendChild(n)}
    else if(tab==='banner'){var mb=mk('span','pf-mini-bn');bannerStyle(mb,val);prev.appendChild(mb)}
    else{var mc=it.k==='mc'?((String(curV).indexOf('mc:')===0&&P.skinMc(curV))||'MHF_Question'):(it.mc||'MHF_Steve');var im=document.createElement('img');im.className='pf-head';im.alt='';im.width=64;im.height=64;im.loading='lazy';im.referrerPolicy='no-referrer';im.src='https://mc-heads.net/avatar/'+encodeURIComponent(mc)+'/64';
      im.addEventListener('error',function(){im.replaceWith(mk('span','pf-mini-av',['?']))});prev.appendChild(im)}
    var card=mk('div','pf-item'+(on?' on':'')+(u.ok?'':' locked'),[prev,mk('span','pf-it-n',[nm(it)])]);
    if(!u.ok){card.appendChild(mk('span','pf-lock',[lockIco()]));card.setAttribute('aria-label',nm(it)+' — '+reqText(u,it));
      card.appendChild(mk('span','pf-it-s',[reqText(u,it)]));var pg=mk('span','pf-prog');var pi=mk('i');pi.style.width=Math.round(u.pct*100)+'%';pg.appendChild(pi);pg.setAttribute('role','img');pg.setAttribute('aria-label',fmt(T('sk_prog'),{a:num(u.have),b:num(u.need)}));
      card.appendChild(pg);card.appendChild(mk('span','pf-it-s',[fmt(T('sk_prog'),{a:num(u.have),b:num(u.need)})]))}
    else if(own){
      if(tab==='skin'&&it.k==='mc'){
        var inp=document.createElement('input');inp.type='text';inp.maxLength=16;inp.placeholder=T('sk_mc_ph');inp.value=String(curV).indexOf('mc:')===0?P.skinMc(curV):'';inp.setAttribute('aria-label',T('sk_mc_ph'));inp.autocomplete='off';inp.spellcheck=false;
        var go=mk('button','pf-eq'+(on?' on':''),[on?T('sk_on'):T('sk_equip')]);go.type='button';
        go.addEventListener('click',function(){var n=inp.value.trim();if(!/^[A-Za-z0-9_]{3,16}$/.test(n)){toast(T('sk_mc_bad'));inp.focus();return}equip('skin','mc:'+n)});
        card.appendChild(mk('div','pf-mcin',[inp,go]));
      }else{var eq=mk('button','pf-eq'+(on?' on':''),[on?T('sk_on'):T('sk_equip')]);eq.type='button';if(on)eq.setAttribute('aria-pressed','true');
        else eq.addEventListener('click',function(){equip(field,tab==='banner'?(it.k==='night'?'':val):(it.k==='none'||it.k==='default'||it.k==='steve'?'':it.k))});card.appendChild(eq)}
    }else card.appendChild(mk('span','pf-it-s ok',[on?T('sk_on'):T('sk_open')]));
    grid.appendChild(card);
  });
  sec.appendChild(mk('div','pf-card',[grid]));sec.lastChild.style.padding='10px';
  if(tab==='skin')sec.appendChild(mk('p','pf-skin-note',[cur.id.indexOf('twitch:')===0?T('sk_note'):T('sk_note_off')]));
  return sec;
}
function equip(field,value){var o={};o[field]=value;P.save(o).then(function(r){cur.profile=Object.assign({},cur.profile,r.profile);toast(r.online?T('ed_saved'):T('ed_saved_local'));var y=window.scrollY;draw();window.scrollTo(0,y)},function(e){toast(String(e&&e.message)==='quota'?T('ed_quota'):String(e&&e.message||e))})}

/* ---------- edit panel ---------- */
var draft=null,modal=null,lastFocus=null;
function compress(file,w,h,maxLen){
  return new Promise(function(res,rej){
    if(!file||!/^image\//.test(file.type))return rej(new Error('img'));
    var url=URL.createObjectURL(file),im=new Image();
    im.onload=function(){try{
      var sw=im.naturalWidth,sh=im.naturalHeight,ar=w/h,cw=sw,ch=sw/ar;if(ch>sh){ch=sh;cw=sh*ar}
      var sx=(sw-cw)/2,sy=(sh-ch)/2,scale=Math.min(1,w/cw),out=null;
      for(var k=0;k<8;k++){
        var c=document.createElement('canvas');c.width=Math.max(16,Math.round(cw*scale));c.height=Math.max(16,Math.round(ch*scale));
        var g=c.getContext('2d');g.fillStyle='#131318';g.fillRect(0,0,c.width,c.height);g.imageSmoothingQuality='high';g.drawImage(im,sx,sy,cw,ch,0,0,c.width,c.height);
        var q=[.86,.78,.7,.62,.55,.5,.45,.4][k];out=c.toDataURL('image/jpeg',q);
        if(out.length<=maxLen)break;if(k>=2)scale*=.8;out=null;
      }
      URL.revokeObjectURL(url);out?res(out):rej(new Error('big'));
    }catch(e){URL.revokeObjectURL(url);rej(e)}};
    im.onerror=function(){URL.revokeObjectURL(url);rej(new Error('img'))};im.src=url;
  });
}
function openEdit(){
  if(!isOwn())return;lastFocus=document.activeElement;
  var p=cur.profile||{},S=summary(cur.view||{}),lv=S.prog.level>S.level?S.prog.level:S.level,wins=Math.max(S.wins,S.winsAll),s=sess();
  draft={banner:p.banner||'',avatar:p.avatar||'',bio:p.bio||'',fav_game:p.fav_game||''};
  if(modal)modal.remove();
  modal=mk('div','pf-modal');modal.id='pfModal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','pfEdT');
  var x=mk('button','pf-x',['×']);x.type='button';x.setAttribute('aria-label',T('ed_close'));x.addEventListener('click',closeEdit);
  var h=mk('h2','',[T('ed_title')]);h.id='pfEdT';
  var err=mk('p','pf-err');err.setAttribute('role','alert');
  /* live preview */
  var pb=mk('div','pf-banner'),pa=null,box=mk('div','pf-prevbox',[pb]);
  function paint(){bannerStyle(pb,draft.banner);if(pa)pa.remove();pa=avatarBox('pf-avatar',draft.avatar||(s&&s.avatar)||'',(s&&(s.display||s.login))||'?',p.frame);box.appendChild(pa);
    [].forEach.call(modal.querySelectorAll('.pf-bnopt'),function(b){b.classList.toggle('on',b.getAttribute('data-v')===(draft.banner||'b:night')||(!draft.banner&&b.getAttribute('data-v')==='b:night'))})}
  /* banner */
  var bns=mk('div','pf-bns');
  P.COS.banner.forEach(function(it){var u=P.unlockState(it,lv,wins),b=mk('button','pf-bnopt');b.type='button';b.setAttribute('data-v','b:'+it.k);bannerStyle(b,'b:'+it.k);b.setAttribute('aria-label',nm(it)+(u.ok?'':' — '+reqText(u,it)));b.title=nm(it);
    if(!u.ok){b.disabled=true;b.appendChild(mk('span','pf-lk',['🔒 Lv'+it.req.lv]))}else b.addEventListener('click',function(){draft.banner=it.k==='night'?'':'b:'+it.k;err.textContent='';paint()});bns.appendChild(b)});
  function fileRow(kind){
    var f=document.createElement('input');f.type='file';f.accept='image/png,image/jpeg,image/webp';f.hidden=true;f.id='pfFile_'+kind;
    var up=mk('button','btn btn-ghost btn-sm',[T('ed_upload')]);up.type='button';up.addEventListener('click',function(){f.click()});
    f.addEventListener('change',function(){var file=f.files&&f.files[0];if(!file)return;err.textContent=T('ed_working');
      (kind==='banner'?compress(file,1200,400,150000):compress(file,256,256,60000)).then(function(d){draft[kind]=d;err.textContent='';paint()},function(e){err.textContent=e&&e.message==='big'?T('ed_big'):T('ed_img_bad')});f.value=''});
    var u=document.createElement('input');u.type='url';u.className='pf-in';u.placeholder=T('ed_url');u.setAttribute('aria-label',T('ed_url'));u.dir='ltr';u.id='pfUrl_'+kind;
    var use=mk('button','btn btn-ghost btn-sm',[T('ed_use')]);use.type='button';use.addEventListener('click',function(){var v=u.value.trim();if(!/^https:\/\/[^\s"'<>()]{4,300}$/.test(v)){err.textContent=T('ed_url_bad');return}draft[kind]=v;err.textContent='';paint()});
    var row=mk('div','pf-row',[up,f,u,use]);
    if(kind==='avatar'){var rs=mk('button','btn btn-ghost btn-sm',[T('ed_av_reset')]);rs.type='button';rs.addEventListener('click',function(){draft.avatar='';paint()});row.appendChild(rs)}
    return row;
  }
  var bio=document.createElement('textarea');bio.className='pf-in';bio.id='pfBio';bio.maxLength=160;bio.value=draft.bio;bio.placeholder=T('ed_bio_ph');bio.dir='auto';
  var cnt=mk('span','pf-cnt',[draft.bio.length+'/160']);bio.addEventListener('input',function(){draft.bio=bio.value.slice(0,160);cnt.textContent=Array.from(draft.bio).length+'/160'});
  var sel=document.createElement('select');sel.className='pf-in';sel.id='pfFav';var o0=document.createElement('option');o0.value='';o0.textContent=T('ed_fav_none');sel.appendChild(o0);
  P.GAMES.forEach(function(g){var o=document.createElement('option');o.value=g.k;o.textContent=g.ic+' '+nm(g);sel.appendChild(o)});sel.value=draft.fav_game;sel.addEventListener('change',function(){draft.fav_game=sel.value});
  var bl=mk('label','',[T('ed_bio')]);bl.htmlFor='pfBio';var fl=mk('label','',[T('ed_fav')]);fl.htmlFor='pfFav';
  var body=mk('div','pf-sheet-b',[box,
    mk('div','pf-fld',[mk('span','pf-lab',[T('ed_banner')]),bns,fileRow('banner')]),
    mk('div','pf-fld',[mk('span','pf-lab',[T('ed_avatar')]),fileRow('avatar')]),
    mk('div','pf-fld',[bl,bio,cnt]),mk('div','pf-fld',[fl,sel]),err]);
  var save=mk('button','btn pf-primary',[T('ed_save')]);save.type='button';save.id='pfSave';
  var cancel=mk('button','btn btn-ghost',[T('ed_cancel')]);cancel.type='button';cancel.addEventListener('click',closeEdit);
  save.addEventListener('click',function(){save.disabled=true;P.save(draft).then(function(r){cur.profile=Object.assign({},cur.profile,r.profile);closeEdit();draw();toast(r.online?T('ed_saved'):T('ed_saved_local'))},
    function(e){save.disabled=false;err.textContent=String(e&&e.message)==='quota'?T('ed_quota'):String(e&&e.message||e)})});
  var sheet=mk('div','pf-sheet',[mk('div','pf-sheet-h',[h,x]),body,mk('div','pf-sheet-f',[cancel,save])]);
  modal.appendChild(sheet);
  modal.addEventListener('click',function(e){if(e.target===modal)closeEdit()});
  modal.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();closeEdit()}
    if(e.key==='Tab'){var f=[].filter.call(modal.querySelectorAll('button:not([disabled]),input:not([hidden]),textarea,select'),function(n){return n.offsetParent!==null});if(!f.length)return;var a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
  document.body.appendChild(modal);document.documentElement.classList.add('pf-noscroll');paint();
  setTimeout(function(){try{x.focus()}catch(e){}},30);
}
function closeEdit(){if(modal){modal.remove();modal=null}document.documentElement.classList.remove('pf-noscroll');if(lastFocus&&lastFocus.focus&&document.body.contains(lastFocus))try{lastFocus.focus()}catch(e){}else{var b=$('pfEdit');if(b)b.focus()}}

A.boot();
load();
A.onLang(function(){if(cur)draw();else if(!qid&&!P.myId())load()});
window.addEventListener('lamma-auth',function(){if(!qid)load();else if(cur)draw()});
LV.onChange(function(){if(cur&&!modal)P.load(cur.id).then(function(x){cur=x;var y=window.scrollY;draw();window.scrollTo(0,y)})});
})();
